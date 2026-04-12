import Foundation

struct Profile: Codable, Identifiable {
    var id: String { userId ?? username ?? UUID().uuidString }
    let userId: String?
    let username: String?
    let displayName: String?
    let bio: String?
    let headline: String?
    let avatarUrl: String?
    let bannerUrl: String?
    let location: String?
    let country: String?
    let website: String?
    let instagramUrl: String?
    let linkedinUrl: String?
    let twitterUrl: String?
    let tiktokUrl: String?
    let hourlyRateMin: Int?
    let hourlyRateMax: Int?
    let availability: AvailabilityStatus?
    let followersCount: Int?
    let followingCount: Int?
    let companyName: String?
    let companyDescription: String?
    let industry: String?
    let subscriptionTier: SubscriptionTier?
    let verificationStatus: String?
    let accentColor: String?
    let createdAt: Date?
    let updatedAt: Date?
    let disciplines: [ProfileDiscipline]?

    // Custom init to handle missing keys gracefully
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        userId = try container.decodeIfPresent(String.self, forKey: .userId)
        username = try container.decodeIfPresent(String.self, forKey: .username)
        displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
        bio = try container.decodeIfPresent(String.self, forKey: .bio)
        headline = try container.decodeIfPresent(String.self, forKey: .headline)
        avatarUrl = try container.decodeIfPresent(String.self, forKey: .avatarUrl)
        bannerUrl = try container.decodeIfPresent(String.self, forKey: .bannerUrl)
        location = try container.decodeIfPresent(String.self, forKey: .location)
        country = try container.decodeIfPresent(String.self, forKey: .country)
        website = try container.decodeIfPresent(String.self, forKey: .website)
        instagramUrl = try container.decodeIfPresent(String.self, forKey: .instagramUrl)
        linkedinUrl = try container.decodeIfPresent(String.self, forKey: .linkedinUrl)
        twitterUrl = try container.decodeIfPresent(String.self, forKey: .twitterUrl)
        tiktokUrl = try container.decodeIfPresent(String.self, forKey: .tiktokUrl)
        hourlyRateMin = try container.decodeIfPresent(Int.self, forKey: .hourlyRateMin)
        hourlyRateMax = try container.decodeIfPresent(Int.self, forKey: .hourlyRateMax)
        availability = try container.decodeIfPresent(AvailabilityStatus.self, forKey: .availability)
        followersCount = try container.decodeIfPresent(Int.self, forKey: .followersCount)
        followingCount = try container.decodeIfPresent(Int.self, forKey: .followingCount)
        companyName = try container.decodeIfPresent(String.self, forKey: .companyName)
        companyDescription = try container.decodeIfPresent(String.self, forKey: .companyDescription)
        industry = try container.decodeIfPresent(String.self, forKey: .industry)
        subscriptionTier = try container.decodeIfPresent(SubscriptionTier.self, forKey: .subscriptionTier)
        verificationStatus = try container.decodeIfPresent(String.self, forKey: .verificationStatus)
        accentColor = try container.decodeIfPresent(String.self, forKey: .accentColor)
        createdAt = try container.decodeIfPresent(Date.self, forKey: .createdAt)
        updatedAt = try container.decodeIfPresent(Date.self, forKey: .updatedAt)
        disciplines = try container.decodeIfPresent([ProfileDiscipline].self, forKey: .disciplines)
    }

    private enum CodingKeys: String, CodingKey {
        case userId, username, displayName, bio, headline, avatarUrl, bannerUrl
        case location, country, website, instagramUrl, linkedinUrl, twitterUrl, tiktokUrl
        case hourlyRateMin, hourlyRateMax, availability
        case followersCount, followingCount
        case companyName, companyDescription, industry
        case subscriptionTier, verificationStatus, accentColor
        case createdAt, updatedAt, disciplines
    }
}

struct ProfileDiscipline: Codable {
    let discipline: Discipline?

    struct Discipline: Codable {
        let id: String?
        let name: String
    }
}
