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
    /// Optional user-chosen accent color (hex, e.g. "#FF3D9A"). nil falls
    /// back to the app default. Applied via SwiftUI .tint() at the root
    /// so every Color.accentColor downstream picks it up.
    var accentColor: String?
    /// Optional payload for the Hire template — availability, services,
    /// clients, testimonials, process. Lives in a single JSON column
    /// server-side so this struct can grow without a migration.
    var hireData: HireData?
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
        accentColor = try container.decodeIfPresent(String.self, forKey: .accentColor)
        hireData = try? container.decodeIfPresent(HireData.self, forKey: .hireData)
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
        case profileTemplate, accentColor
        case hireData
        case createdAt, updatedAt, user
    }
}

enum ConnectProfileTemplate: String, CaseIterable, Identifiable {
    case `default` = "DEFAULT"
    case hero      = "HERO"
    case editorial = "EDITORIAL"
    case stack     = "STACK"
    case split     = "SPLIT"
    case terminal  = "TERMINAL"
    case photo     = "PHOTO"
    case video     = "VIDEO"
    case music     = "MUSIC"
    case threeD    = "THREED"
    case hire      = "HIRE"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .default:   return "Default"
        case .hero:      return "Hero"
        case .editorial: return "Editorial"
        case .stack:     return "Stack"
        case .split:     return "Split"
        case .terminal:  return "Terminal"
        case .photo:     return "Photo"
        case .video:     return "Video"
        case .music:     return "Music"
        case .threeD:    return "3D"
        case .hire:      return "Hire Me"
        }
    }

    var summary: String {
        switch self {
        case .default:
            return "The standard Connect card — clean, balanced, with media gallery and prompts."
        case .hero:
            return "Full-bleed cover with a parallax effect and an oversized name overlay. Best for portfolio-forward creatives."
        case .editorial:
            return "Magazine-style masthead, drop-cap bio, and a 2-column work grid. Best for writers, designers, and feature-worthy work."
        case .stack:
            return "Swipeable card deck — one piece of work front-and-center at a time. Best when each piece deserves the spotlight."
        case .split:
            return "Split layout with a vertical-text left rail (avatar + handle) and a right column for name, NOW card, and about. Full-bleed 3-col media grid below."
        case .terminal:
            return "Monospace command-line aesthetic — your profile rendered as $ whoami, ls, grep output. Best for devs, hackers, and zine-y looks."
        case .photo:
            return "Featured 3:4 frame + 4-column contact sheet. Best for photographers — your photos get the spotlight, others swappable below."
        case .video:
            return "Cinemascope 2.39:1 player with REC / TC HUD and a horizontal reel carousel. Best for filmmakers and motion artists."
        case .music:
            return "Now-playing card with waveform + transport, plus a track list with mini-waveforms. Best for producers, sound designers, musicians."
        case .threeD:
            return "Live wireframe viewport with FPS / coord HUD and an asset library of your model files. Best for 3D artists and technical creatives."
        case .hire:
            return "Client-facing rate card — availability, services, past clients, testimonials, and process. Best when you're open for work."
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
    /// Optional editorial-style caption shown under the slot in templates
    /// like Editorial. Older slots may not have one — encode/decode treats
    /// it as missing rather than nil.
    var title: String?
    /// Optional cover image for audio slots (album art). Falls back to the
    /// gradient + waveform glyph when nil.
    var coverUrl: String?
    /// User-entered BPM for audio slots. Connect doesn't analyse audio at
    /// upload — this is filled in by the user via the Music template's
    /// edit-mode metadata sheet.
    var bpm: Int?
    /// User-entered musical key for audio slots (e.g. "Abm", "C#", "F").
    /// Same provenance as `bpm`.
    var key: String?

    init(url: String,
         mediaType: String,
         sortOrder: Int,
         title: String? = nil,
         coverUrl: String? = nil,
         bpm: Int? = nil,
         key: String? = nil) {
        self.url = url
        self.mediaType = mediaType
        self.sortOrder = sortOrder
        self.title = title
        self.coverUrl = coverUrl
        self.bpm = bpm
        self.key = key
    }

    enum CodingKeys: String, CodingKey {
        case url, mediaType, sortOrder, title, coverUrl, bpm, key
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        url = try c.decode(String.self, forKey: .url)
        mediaType = try c.decode(String.self, forKey: .mediaType)
        sortOrder = try c.decode(Int.self, forKey: .sortOrder)
        title = try c.decodeIfPresent(String.self, forKey: .title)
        coverUrl = try c.decodeIfPresent(String.self, forKey: .coverUrl)
        bpm = try c.decodeIfPresent(Int.self, forKey: .bpm)
        key = try c.decodeIfPresent(String.self, forKey: .key)
    }

    /// Returns a copy with a new sortOrder, preserving every optional
    /// field. Used by the reorder logic so user-entered metadata
    /// (title / coverUrl / bpm / key) doesn't get nuked when slots swap
    /// positions.
    func with(sortOrder newSortOrder: Int) -> MediaSlot {
        MediaSlot(
            url: url,
            mediaType: mediaType,
            sortOrder: newSortOrder,
            title: title,
            coverUrl: coverUrl,
            bpm: bpm,
            key: key
        )
    }

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
    var accentColor: String?
    var hireData: HireData?
}

// MARK: - Hire template payload
//
// Single struct that backs the "Hire Me" template. Lives in a JSON column
// server-side so we can iterate on the data shape without a migration.
// Every field is optional; the view falls back to placeholders when a
// section is empty so a brand-new Hire profile still has structure.

struct HireData: Codable, Equatable {
    var availability: HireAvailability?
    var services: [HireService]?
    var clients: [String]?
    var testimonials: [HireTestimonial]?
    var process: [HireProcessStep]?
    /// Optional one-liner under the closing CTA (e.g. "Let's make
    /// something strange."). Falls back to a default when empty.
    var ctaTagline: String?
}

struct HireAvailability: Codable, Equatable {
    var status: String?      // "BOOKING" | "LIMITED" | "CLOSED"
    var next: String?        // free-form, e.g. "MAY 12"
    var capacity: String?    // e.g. "2 slots"
    var timezone: String?    // e.g. "PST"
    var replyTime: String?   // e.g. "< 24h"
    var contactEmail: String?
}

struct HireService: Codable, Equatable, Identifiable {
    var name: String
    var from: String?        // price, e.g. "$8k"
    var unit: String?        // e.g. "/ project"
    var tag: String?         // e.g. "flagship" / "popular"
    var lead: String?        // e.g. "3 wks"

    /// Identifier derived from the (name, unit) pair so SwiftUI lists
    /// don't crash when two services have the same name accidentally.
    var id: String { name + "·" + (unit ?? "") }
}

struct HireTestimonial: Codable, Equatable, Identifiable {
    var by: String           // "Maya K."
    var role: String?        // "CD @ Hyundai"
    var quote: String

    var id: String { by + "·" + quote.prefix(16) }
}

struct HireProcessStep: Codable, Equatable, Identifiable {
    var title: String        // "DISCOVERY"
    var detail: String?      // "30-min call · scope, refs, fit check"
    var length: String?      // "3 days"

    var id: String { title }
}
