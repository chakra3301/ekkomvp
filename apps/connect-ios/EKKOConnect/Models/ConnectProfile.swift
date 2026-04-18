import Foundation

struct ConnectProfile: Codable, Identifiable {
    let id: String
    let userId: String
    var headline: String?
    var lookingFor: String?
    var bio: String?
    var mediaSlots: [MediaSlot]
    var prompts: [PromptEntry]
    var instagramHandle: String?
    var twitterHandle: String?
    var linkedinHandle: String?
    var websiteUrl: String?
    var instagramAccessToken: String?
    var instagramTokenExpiry: Date?
    var instagramUserId: String?
    var disciplineIds: [String]?
    var location: String?
    var latitude: Double?
    var longitude: Double?
    var likesReceivedCount: Int
    var matchesCount: Int
    var isActive: Bool
    var connectTier: ConnectTier
    /// "DEFAULT" (or nil) renders ConnectProfileCard. "HERO" renders ConnectProfileHeroView.
    /// Advanced option — only exposed in the edit flow, not initial setup.
    var profileTemplate: String?
    let createdAt: Date?
    let updatedAt: Date?

    // Nested from API responses
    var user: UserWithProfile?

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        userId = try container.decode(String.self, forKey: .userId)
        headline = try container.decodeIfPresent(String.self, forKey: .headline)
        lookingFor = try container.decodeIfPresent(String.self, forKey: .lookingFor)
        bio = try container.decodeIfPresent(String.self, forKey: .bio)

        // mediaSlots and prompts are JSON columns — decode flexibly
        mediaSlots = (try? container.decode([MediaSlot].self, forKey: .mediaSlots)) ?? []
        prompts = (try? container.decode([PromptEntry].self, forKey: .prompts)) ?? []

        instagramHandle = try container.decodeIfPresent(String.self, forKey: .instagramHandle)
        twitterHandle = try container.decodeIfPresent(String.self, forKey: .twitterHandle)
        linkedinHandle = try container.decodeIfPresent(String.self, forKey: .linkedinHandle)
        websiteUrl = try container.decodeIfPresent(String.self, forKey: .websiteUrl)
        instagramAccessToken = try container.decodeIfPresent(String.self, forKey: .instagramAccessToken)
        instagramTokenExpiry = try container.decodeIfPresent(Date.self, forKey: .instagramTokenExpiry)
        instagramUserId = try container.decodeIfPresent(String.self, forKey: .instagramUserId)
        disciplineIds = try container.decodeIfPresent([String].self, forKey: .disciplineIds)
        location = try container.decodeIfPresent(String.self, forKey: .location)
        latitude = try container.decodeIfPresent(Double.self, forKey: .latitude)
        longitude = try container.decodeIfPresent(Double.self, forKey: .longitude)
        likesReceivedCount = (try? container.decode(Int.self, forKey: .likesReceivedCount)) ?? 0
        matchesCount = (try? container.decode(Int.self, forKey: .matchesCount)) ?? 0
        isActive = (try? container.decode(Bool.self, forKey: .isActive)) ?? true
        connectTier = (try? container.decode(ConnectTier.self, forKey: .connectTier)) ?? .FREE
        profileTemplate = try container.decodeIfPresent(String.self, forKey: .profileTemplate)
        createdAt = try? container.decodeIfPresent(Date.self, forKey: .createdAt)
        updatedAt = try? container.decodeIfPresent(Date.self, forKey: .updatedAt)
        user = try container.decodeIfPresent(UserWithProfile.self, forKey: .user)
    }

    private enum CodingKeys: String, CodingKey {
        case id, userId, headline, lookingFor, bio
        case mediaSlots, prompts
        case instagramHandle, twitterHandle, linkedinHandle, websiteUrl
        case instagramAccessToken, instagramTokenExpiry, instagramUserId
        case disciplineIds, location, latitude, longitude
        case likesReceivedCount, matchesCount, isActive, connectTier
        case profileTemplate
        case createdAt, updatedAt, user
    }
}

enum ConnectProfileTemplate: String, CaseIterable, Identifiable {
    case `default` = "DEFAULT"
    case hero = "HERO"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .default: return "Default"
        case .hero:    return "Hero"
        }
    }

    var summary: String {
        switch self {
        case .default:
            return "The standard Connect card — clean, balanced, with media gallery and prompts."
        case .hero:
            return "Full-bleed cover with a parallax effect and an oversized name overlay. Best for portfolio-forward creatives."
        }
    }

    static func from(_ raw: String?) -> ConnectProfileTemplate {
        guard let raw, let t = ConnectProfileTemplate(rawValue: raw) else { return .default }
        return t
    }
}

struct MediaSlot: Codable, Equatable {
    let url: String
    let mediaType: String
    let sortOrder: Int

    var isVideo: Bool {
        mediaType == "VIDEO" || url.contains("/video-") ||
        url.range(of: #"\.(mp4|webm|mov)(\?|$)"#, options: .regularExpression) != nil
    }

    var isAudio: Bool {
        mediaType == "AUDIO" || url.contains("/audio-") ||
        url.range(of: #"\.(mp3|wav|ogg|aac)(\?|$)"#, options: .regularExpression) != nil
    }

    var isModel: Bool {
        mediaType == "MODEL" || url.contains("/model-") ||
        url.range(of: #"\.(glb|gltf|obj|fbx|usdz)(\?|$)"#, options: .regularExpression) != nil
    }
}

struct PromptEntry: Codable, Equatable {
    var question: String
    var answer: String
    var isCustom: Bool?
}

struct ProfilePayload: Codable {
    var headline: String?
    var lookingFor: String?
    var bio: String?
    var mediaSlots: [MediaSlot]?
    var prompts: [PromptEntry]?
    var instagramHandle: String?
    var twitterHandle: String?
    var websiteUrl: String?
    var disciplineIds: [String]?
    var location: String?
    var latitude: Double?
    var longitude: Double?
    var profileTemplate: String?
}
