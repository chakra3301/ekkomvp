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
}
