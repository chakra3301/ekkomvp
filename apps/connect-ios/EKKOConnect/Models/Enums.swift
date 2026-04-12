import Foundation

enum UserRole: String, Codable, CaseIterable {
    case CREATIVE
    case CLIENT
    case ADMIN
}

enum UserStatus: String, Codable {
    case ACTIVE
    case SUSPENDED
}

enum SwipeType: String, Codable {
    case LIKE
    case PASS
}

enum ConnectContentType: String, Codable {
    case PHOTO
    case VIDEO
    case AUDIO
    case MODEL
    case PROMPT
}

enum ConnectMatchStatus: String, Codable {
    case ACTIVE
    case UNMATCHED
    case BLOCKED
}

enum ConnectTier: String, Codable {
    case FREE
    case INFINITE
}

enum AvailabilityStatus: String, Codable {
    case AVAILABLE
    case BUSY
    case NOT_AVAILABLE
}

enum SubscriptionTier: String, Codable {
    case FREE
    case PRO
    case BUSINESS
}
