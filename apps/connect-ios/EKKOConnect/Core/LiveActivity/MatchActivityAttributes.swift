import ActivityKit
import Foundation

// Shared between the app and the widget extension. The widget target MUST
// include this file via target membership so the two processes decode the
// same schema.
//
// Immutable metadata about the match lives on `MatchActivityAttributes`
// itself; evolving state (unread count, latest preview) lives on
// `ContentState` and is updated via `Activity.update(_:)`.

struct MatchActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        /// Most recent preview shown in the pill. For a fresh match this is
        /// the teaser line; once they message, we swap in the message body.
        var headline: String
        /// 0 when no message yet, otherwise the unread count.
        var unread: Int
        /// ISO-ish timestamp for the last event, used by the widget to show
        /// relative time ("just now" / "2m ago").
        var updatedAt: Date
    }

    /// Opaque match identifier — used to route `ekkoconnect://match/<id>`
    /// when the user taps the Live Activity.
    let matchId: String
    /// Display name of the other person — headline of the lock-screen pill.
    let otherDisplayName: String
    /// Optional avatar URL. Widget downloads lazily; if nil, falls back to
    /// an initials circle in the activity UI.
    let otherAvatarUrl: String?
    /// Emitted when the match was created. Used to drive the "New match"
    /// copy for the first ~10 min; after that the UI shifts to a plain
    /// message-preview state.
    let createdAt: Date
}
