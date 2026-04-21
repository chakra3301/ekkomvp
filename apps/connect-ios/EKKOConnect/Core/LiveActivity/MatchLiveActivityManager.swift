import ActivityKit
import Foundation
import UIKit

// Front door for starting, updating, and ending the "New match" Live
// Activity. All calls are safe to invoke on any thread — the manager hops to
// the main actor internally where needed.
//
// Activities auto-expire at `stale` (1 hr here) to match the retention story:
// the pill is meant to announce a fresh match and act as a jump-into-chat
// shortcut, not live forever on someone's lock screen.

@MainActor
enum MatchLiveActivityManager {

    /// 1 hour — beyond this the pill self-demotes to dismissible state.
    private static let staleWindow: TimeInterval = 60 * 60

    /// Returns true when the device + user allow Live Activities. Callers
    /// should avoid wasting cycles on start/update when this is false.
    static var isEnabled: Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }

    /// Start a Live Activity for a newly created match. Safe to call
    /// repeatedly — if one is already running for this matchId we update it
    /// in place instead of starting a duplicate.
    @discardableResult
    static func startOrUpdate(
        matchId: String,
        otherDisplayName: String,
        otherAvatarUrl: String?
    ) -> Bool {
        guard isEnabled else { return false }

        if let existing = existingActivity(for: matchId) {
            Task {
                await existing.update(
                    ActivityContent(
                        state: .init(
                            headline: "✦ You matched with \(otherDisplayName)",
                            unread: 0,
                            updatedAt: .now
                        ),
                        staleDate: Date().addingTimeInterval(staleWindow)
                    )
                )
            }
            return true
        }

        let attributes = MatchActivityAttributes(
            matchId: matchId,
            otherDisplayName: otherDisplayName,
            otherAvatarUrl: otherAvatarUrl,
            createdAt: .now
        )
        let state = MatchActivityAttributes.ContentState(
            headline: "✦ You matched with \(otherDisplayName)",
            unread: 0,
            updatedAt: .now
        )

        do {
            _ = try Activity.request(
                attributes: attributes,
                content: ActivityContent(
                    state: state,
                    staleDate: Date().addingTimeInterval(staleWindow)
                ),
                pushType: nil
            )
            return true
        } catch {
            return false
        }
    }

    /// Push a new unread-message preview into the live activity for this
    /// match. No-ops if the activity isn't running (the caller doesn't need
    /// to care whether the pill ever started).
    static func pushMessage(
        matchId: String,
        preview: String,
        unread: Int
    ) {
        guard let activity = existingActivity(for: matchId) else { return }
        Task {
            await activity.update(
                ActivityContent(
                    state: .init(
                        headline: preview,
                        unread: unread,
                        updatedAt: .now
                    ),
                    staleDate: Date().addingTimeInterval(staleWindow)
                )
            )
        }
    }

    /// Dismiss the activity immediately (e.g. user opened the chat).
    static func end(matchId: String) {
        guard let activity = existingActivity(for: matchId) else { return }
        Task {
            await activity.end(nil, dismissalPolicy: .immediate)
        }
    }

    /// Dismiss every running match activity. Called on logout.
    static func endAll() {
        for activity in Activity<MatchActivityAttributes>.activities {
            Task { await activity.end(nil, dismissalPolicy: .immediate) }
        }
    }

    // MARK: - Private

    private static func existingActivity(
        for matchId: String
    ) -> Activity<MatchActivityAttributes>? {
        Activity<MatchActivityAttributes>.activities.first {
            $0.attributes.matchId == matchId
        }
    }
}
