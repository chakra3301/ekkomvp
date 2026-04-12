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

    private var undoTimer: Timer?
    private var trpc: TRPCClient?

    enum ViewMode: String, CaseIterable {
        case stack, grid, history
    }

    struct MatchData: Identifiable {
        let id: String
        let displayName: String
        var avatarUrl: String?
        var featuredImage: String?
    }

    // MARK: - Setup

    func setup(trpc: TRPCClient) {
        self.trpc = trpc
    }

    // MARK: - Load Discovery Queue

    func loadQueue() async {
        guard let trpc else { return }
        isLoading = true

        // Load filters from UserDefaults
        let filters = loadFilters()

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

            var filterInput: DiscoveryFilterInput?
            if let f = filters {
                var fi = DiscoveryFilterInput()
                if f.role != "ALL" { fi.role = f.role }
                if !f.city.isEmpty { fi.location = f.city }
                if f.globalSearch { fi.globalSearch = true }
                filterInput = fi
            }

            let result: [ConnectProfile] = try await trpc.query(
                "connectDiscover.getDiscoveryQueue",
                input: QueueInput(limit: 10, filters: filterInput)
            )
            profiles = result
            currentIndex = 0
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    // MARK: - Swipe

    func swipe(targetUserId: String, type: SwipeType, matchNote: String? = nil) async {
        guard let trpc else { return }

        // If LIKE, show note prompt first
        if type == .LIKE && pendingLikeUserId == nil {
            pendingLikeUserId = targetUserId
            return
        }

        do {
            let result: SwipeResult = try await trpc.mutate(
                "connectMatch.swipe",
                input: SwipeInput(
                    targetUserId: targetUserId,
                    type: type,
                    matchNote: matchNote
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
            errorMessage = error.localizedDescription
        }

        pendingLikeUserId = nil
    }

    /// Called from the like note prompt
    func submitLikeNote(_ note: String?) async {
        guard let userId = pendingLikeUserId else { return }
        pendingLikeUserId = nil
        await swipe(targetUserId: userId, type: .LIKE, matchNote: note)
    }

    func skipLikeNote() async {
        guard let userId = pendingLikeUserId else { return }
        pendingLikeUserId = nil
        await swipe(targetUserId: userId, type: .LIKE)
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

    private func loadFilters() -> StoredFilters? {
        guard let data = UserDefaults.standard.data(forKey: "ekko-connect-filters"),
              let filters = try? JSONDecoder().decode(StoredFilters.self, from: data) else {
            return nil
        }
        return filters
    }
}

private struct StoredFilters: Codable {
    var city: String = ""
    var maxDistanceMiles: Int = 50
    var globalSearch: Bool = false
    var role: String = "ALL"
}
