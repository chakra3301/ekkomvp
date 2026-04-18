import Foundation

struct User: Codable, Identifiable {
    let id: String
    let email: String?
    let phone: String?
    let dateOfBirth: Date?
    let role: UserRole?
    let status: UserStatus?
    let emailVerified: Bool?
    let onboarded: Bool?
    let pushToken: String?
    let pushPlatform: String?
    let createdAt: Date?
    let updatedAt: Date?

    var profile: Profile?
    var connectProfile: ConnectProfile?
}

/// Lightweight user wrapper returned in nested API responses.
struct UserWithProfile: Codable, Identifiable {
    let id: String
    let email: String?
    let role: UserRole?
    var profile: Profile?
    /// Slim Connect profile fields the server attaches in some nested responses
    /// (e.g. likes-received, swipe history). Typically just id + mediaSlots + headline.
    var connectProfile: ConnectProfilePreview?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        email = try container.decodeIfPresent(String.self, forKey: .email)
        role = try container.decodeIfPresent(UserRole.self, forKey: .role)
        profile = try container.decodeIfPresent(Profile.self, forKey: .profile)
        connectProfile = try container.decodeIfPresent(ConnectProfilePreview.self, forKey: .connectProfile)
    }

    private enum CodingKeys: String, CodingKey {
        case id, email, role, profile, connectProfile
    }
}

/// Minimal subset of ConnectProfile for nested list responses. Use
/// `connectProfile.getById` to fetch the full profile.
struct ConnectProfilePreview: Codable {
    let id: String?
    let mediaSlots: [MediaSlot]?
    let headline: String?
}
