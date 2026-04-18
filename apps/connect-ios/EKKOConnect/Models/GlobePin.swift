import Foundation

/// A single user pin displayed on the global Discover globe.
///
/// Coordinates here are NOT the user's real GPS coords — the server
/// snaps the stored location to a ~22km grid and adds a deterministic
/// per-user scatter so the dot is stable across sessions but can't be
/// reverse-geocoded back to a real address.
struct GlobePin: Codable, Identifiable, Equatable {
    let userId: String
    let lat: Double
    let lon: Double
    let city: String?
    let role: UserRole?
    let isInfinite: Bool
    let displayName: String?
    let avatarUrl: String?
    let username: String?

    var id: String { userId }

    /// Globe dot color channel — green (creative), red (client), purple (infinite).
    /// Infinite takes precedence over the base role so paid users glow purple
    /// even if their account role is CREATIVE/CLIENT.
    enum Tint {
        case creative   // green
        case client     // red
        case infinite   // purple
    }

    var tint: Tint {
        if isInfinite { return .infinite }
        switch role {
        case .CLIENT: return .client
        default: return .creative
        }
    }
}

struct GlobePinsResponse: Codable {
    let pins: [GlobePin]
}
