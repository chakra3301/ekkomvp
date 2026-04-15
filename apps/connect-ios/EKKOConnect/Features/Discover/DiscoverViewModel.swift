import SwiftUI

/// Manages discover screen state: profile queue, swipe actions, undo, match detection.
@Observable
final class DiscoverViewModel {
    var profiles: [ConnectProfile] = []
    var currentIndex = 0
    var isLoading = true
    var viewMode: ViewMode = .stack
    var canUndo = false
    var pendingLikeUserId: String?
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
        case stack, grid, history
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
            if !filters.city.isEmpty { fi.location = filters.city }
            if filters.globalSearch {
                fi.globalSearch = true
            } else {
                fi.maxDistanceMiles = filters.maxDistanceMiles
            }

            let result: [ConnectProfile] = try await trpc.query(
                "connectDiscover.getDiscoveryQueue",
                input: QueueInput(limit: 10, filters: fi)
            )
            profiles = result
            currentIndex = 0
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    // MARK: - Swipe

    /// Called from the UI when the user swipes.
    /// - For PASS: submits immediately.
    /// - For LIKE: opens the note prompt first. The actual network call happens
    ///   in `submitLikeNote` / `skipLikeNote` which funnel to `performSwipe`.
    func swipe(targetUserId: String, type: SwipeType, matchNote: String? = nil) async {
        if type == .LIKE && matchNote == nil && pendingLikeUserId == nil {
            pendingLikeUserId = targetUserId
            return
        }
        await performSwipe(targetUserId: targetUserId, type: type, matchNote: matchNote)
    }

    /// Called from the like note prompt after the user taps Send.
    func submitLikeNote(_ note: String?) async {
        guard let userId = pendingLikeUserId else { return }
        pendingLikeUserId = nil
        await performSwipe(targetUserId: userId, type: .LIKE, matchNote: note)
    }

    /// Called from the like note prompt when the user taps Skip or dismisses.
    func skipLikeNote() async {
        guard let userId = pendingLikeUserId else { return }
        pendingLikeUserId = nil
        await performSwipe(targetUserId: userId, type: .LIKE, matchNote: nil)
    }

    /// Does the actual network call — bypasses the "pending note" gate.
    private func performSwipe(targetUserId: String, type: SwipeType, matchNote: String?) async {
        guard let trpc else { return }

        do {
            let result: SwipeResult = try await trpc.mutate(
                "connectMatch.swipe",
                input: SwipeInput(
                    targetUserId: targetUserId,
                    type: type,
                    matchNote: matchNote?.isEmpty == true ? nil : matchNote
                )
            )

            // Enable undo for 30 seconds
            startUndoTimer()

            // Check for match
            if result.matched, let matchId = result.matchId {
                let matchedProfile = profiles.first { $0.userId == targetUserId }
                let firstPhoto = matchedProfile?.mediaSlots.first { $0.mediaType == "PHOTO" }

                matchData = MatchData(
                    id: matchId,
                    displayName: matchedProfile?.user?.profile?.displayName ?? "Your Match",
                    avatarUrl: matchedProfile?.user?.profile?.avatarUrl,
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

    var visibleProfiles: [ConnectProfile] {
        guard currentIndex < profiles.count else { return [] }
        let end = min(currentIndex + 2, profiles.count)
        return Array(profiles[currentIndex..<end])
    }

    func advanceIndex() {
        currentIndex += 1
    }

    /// Pass on a profile: no backend swipe is recorded. The card is moved to
    /// the bottom of the local stack so the user can revisit it later.
    /// `currentIndex` stays put — the card that *was* at index+1 is now at
    /// `currentIndex` and becomes the new top of the stack.
    func recyclePass(targetUserId: String) {
        guard let idx = profiles.firstIndex(where: { $0.userId == targetUserId }) else { return }
        let card = profiles.remove(at: idx)
        profiles.append(card)
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
