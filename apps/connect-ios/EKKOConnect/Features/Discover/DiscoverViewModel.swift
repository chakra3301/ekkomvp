import SwiftUI

/// Manages discover screen state: profile queue, swipe actions, undo, match detection.
@Observable
final class DiscoverViewModel {
    /// The live stack. Top of the stack is `profiles.first`. On PASS we
    /// rotate the top card to the bottom. On LIKE we remove the card.
    var profiles: [ConnectProfile] = []
    var isLoading = true
    var viewMode: ViewMode = .stack
    var canUndo = false
    var pendingLikeUserId: String?
    /// Full profile snapshot for the pending LIKE. Held so the match
    /// celebration can show the right name/avatar even after the card has
    /// been removed from `profiles`.
    private var pendingLikeProfile: ConnectProfile?
    var matchData: MatchData?
    var errorMessage: String?

    /// Set to true when the server rejects a LIKE because the daily limit is hit.
    /// DiscoverView observes this to present the UpgradeModal.
    var shouldShowUpgradePrompt = false

    // Swipe history
    var history: [HistoryItem] = []
    var isLoadingHistory = false
    var historyCursor: String?

    private var undoTimer: Timer?
    private var trpc: TRPCClient?
    private weak var appState: AppState?

    enum ViewMode: String, CaseIterable {
        case stack, grid, globe, history
    }

    struct MatchData: Identifiable {
        let id: String
        let displayName: String
        var avatarUrl: String?
        var featuredImage: String?
    }

    struct HistoryItem: Codable, Identifiable {
        let id: String
        let userId: String
        let swipeType: String       // "LIKE" | "PASS"
        let swipedAt: Date
        let headline: String?
        let location: String?
        let mediaSlots: [MediaSlot]?
        let user: UserWithProfile?
    }

    // MARK: - Setup

    func setup(trpc: TRPCClient, appState: AppState) {
        self.trpc = trpc
        self.appState = appState
    }

    // MARK: - Load Discovery Queue

    // MARK: - Swipe History

    func loadHistory(reset: Bool = true) async {
        guard let trpc else { return }
        if reset { historyCursor = nil; history = [] }
        isLoadingHistory = true
        defer { isLoadingHistory = false }

        do {
            struct Input: Codable { let cursor: String?; let limit: Int }
            struct Result: Codable {
                let items: [HistoryItem]
                let nextCursor: String?
            }
            let result: Result = try await trpc.query(
                "connectDiscover.getSwipeHistory",
                input: Input(cursor: historyCursor, limit: 20)
            )
            if reset {
                history = result.items
            } else {
                history.append(contentsOf: result.items)
            }
            historyCursor = result.nextCursor
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Load Discovery Queue

    func loadQueue() async {
        guard let trpc else { return }
        isLoading = true

        // Read filters from AppState (live-synced with Settings)
        let filters = appState?.discoveryFilters ?? AppState.DiscoveryFilters()

        do {
            struct QueueInput: Codable {
                let limit: Int
                var filters: DiscoveryFilterInput?
            }
            struct DiscoveryFilterInput: Codable {
                var role: String?
                var location: String?
                var globalSearch: Bool?
                var latitude: Double?
                var longitude: Double?
                var maxDistanceMiles: Int?
            }

            var fi = DiscoveryFilterInput()
            if filters.role != "ALL" { fi.role = filters.role }

            let isInfinite = appState?.hasInfiniteAccess == true
            let lat = appState?.currentConnectProfile?.latitude
            let lon = appState?.currentConnectProfile?.longitude

            if filters.globalSearch && isInfinite {
                // Infinite — global search: no geo or city filter.
                fi.globalSearch = true
            } else if isInfinite && !filters.city.isEmpty {
                // Infinite — custom city override: filter by that city name
                // (distance doesn't apply since we don't geocode the string).
                fi.location = filters.city
            } else if let oLat = filters.overrideLatitude, let oLon = filters.overrideLongitude {
                // Radius-based origin override (set when the user taps a pin
                // on the globe view at a wide zoom). Filter to creatives near
                // that region, not near the current user.
                fi.latitude = oLat
                fi.longitude = oLon
                fi.maxDistanceMiles = filters.overrideMaxDistanceMiles ?? filters.maxDistanceMiles
            } else {
                // Everyone else — use the user's actual device coordinates
                // within their chosen radius. If the user hasn't enabled
                // location yet, we still send maxDistanceMiles so the server
                // can no-op the distance filter (needs lat/lon to apply).
                fi.latitude = lat
                fi.longitude = lon
                fi.maxDistanceMiles = filters.maxDistanceMiles
            }

            let result: [ConnectProfile] = try await trpc.query(
                "connectDiscover.getDiscoveryQueue",
                input: QueueInput(limit: 10, filters: fi)
            )
            profiles = result
        } catch {
            errorMessage = error.localizedDescription
            appState?.showError("Couldn't load creatives — pull to retry.")
        }
        isLoading = false
    }

    // MARK: - Swipe

    /// Called from the UI when the user swipes.
    /// - For PASS: submits immediately.
    /// - For LIKE: opens the note prompt first. The actual network call happens
    ///   in `submitLikeNote` / `skipLikeNote` which funnel to `performSwipe`.
    func swipe(profile: ConnectProfile, type: SwipeType, matchNote: String? = nil) async {
        if type == .LIKE && matchNote == nil && pendingLikeUserId == nil {
            pendingLikeUserId = profile.userId
            pendingLikeProfile = profile
            return
        }
        await performSwipe(profile: profile, type: type, matchNote: matchNote)
    }

    /// Called from the like note prompt after the user taps Send.
    func submitLikeNote(_ note: String?) async {
        guard let profile = pendingLikeProfile else { return }
        pendingLikeUserId = nil
        pendingLikeProfile = nil
        await performSwipe(profile: profile, type: .LIKE, matchNote: note)
    }

    /// Called from the like note prompt when the user taps Skip or dismisses.
    func skipLikeNote() async {
        guard let profile = pendingLikeProfile else { return }
        pendingLikeUserId = nil
        pendingLikeProfile = nil
        await performSwipe(profile: profile, type: .LIKE, matchNote: nil)
    }

    /// Does the actual network call — bypasses the "pending note" gate.
    private func performSwipe(profile: ConnectProfile, type: SwipeType, matchNote: String?) async {
        guard let trpc else { return }

        do {
            let result: SwipeResult = try await trpc.mutate(
                "connectMatch.swipe",
                input: SwipeInput(
                    targetUserId: profile.userId,
                    type: type,
                    matchNote: matchNote?.isEmpty == true ? nil : matchNote
                )
            )

            // Enable undo for 30 seconds
            startUndoTimer()

            // Check for match
            if result.matched, let matchId = result.matchId {
                let firstPhoto = profile.mediaSlots.first { $0.mediaType == "PHOTO" }
                matchData = MatchData(
                    id: matchId,
                    displayName: profile.user?.profile?.displayName ?? "Your Match",
                    avatarUrl: profile.user?.profile?.avatarUrl,
                    featuredImage: firstPhoto?.url
                )
            }
        } catch {
            let msg = error.localizedDescription.lowercased()
            if msg.contains("daily like limit") || msg.contains("rate limit") || msg.contains("too_many_requests") {
                shouldShowUpgradePrompt = true
            } else {
                errorMessage = error.localizedDescription
                appState?.showError("Swipe failed — please try again.")
            }
        }
    }

    // MARK: - Undo

    func undo() async {
        guard let trpc else { return }
        do {
            let _: UndoResult = try await trpc.mutate("connectMatch.undoLastSwipe")
            canUndo = false
            undoTimer?.invalidate()
            // Reload queue
            await loadQueue()
        } catch {
            errorMessage = "Couldn't undo — too late"
            canUndo = false
        }
    }

    // MARK: - Visible Profiles

    /// Top two cards of the stack. The top card is `profiles.first`.
    var visibleProfiles: [ConnectProfile] {
        Array(profiles.prefix(2))
    }

    /// Pass on a profile: no backend swipe is recorded. The card is moved to
    /// the bottom of the local stack so the user can revisit it later.
    func recyclePass(targetUserId: String) {
        guard let idx = profiles.firstIndex(where: { $0.userId == targetUserId }) else { return }
        let card = profiles.remove(at: idx)
        profiles.append(card)
    }

    /// Remove a profile from the stack entirely (after a LIKE, block, or report).
    /// When the stack drains, auto-trigger a reload so the user isn't stranded
    /// on an empty screen.
    func removeProfile(userId: String) {
        profiles.removeAll { $0.userId == userId }
        if profiles.isEmpty && !isLoading {
            Task { await loadQueue() }
        }
    }

    // MARK: - Private

    private func startUndoTimer() {
        canUndo = true
        undoTimer?.invalidate()
        undoTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: false) { [weak self] _ in
            Task { @MainActor in
                self?.canUndo = false
            }
        }
    }

}
