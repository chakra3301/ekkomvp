import Foundation

extension Date {
    /// Returns a short relative time string like "2h", "3d", "1w"
    var relativeShort: String {
        let now = Date()
        let seconds = now.timeIntervalSince(self)

        if seconds < 60 {
            return "now"
        } else if seconds < 3600 {
            return "\(Int(seconds / 60))m"
        } else if seconds < 86400 {
            return "\(Int(seconds / 3600))h"
        } else if seconds < 604800 {
            return "\(Int(seconds / 86400))d"
        } else if seconds < 2592000 {
            return "\(Int(seconds / 604800))w"
        } else {
            return "\(Int(seconds / 2592000))mo"
        }
    }

    /// Absolute, human-readable stamp shown on-demand in chat (long-press a
    /// message). e.g. "Jun 2, 2026 at 3:47 PM" — or "Today at 3:47 PM" /
    /// "Yesterday at …" for recent days. Uses a single static formatter so it
    /// isn't reallocated per message row.
    var exactStamp: String {
        Self.exactStampFormatter.string(from: self)
    }

    private static let exactStampFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        f.doesRelativeDateFormatting = true
        return f
    }()
}
