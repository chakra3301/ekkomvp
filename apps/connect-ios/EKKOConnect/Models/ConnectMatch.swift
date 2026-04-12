import Foundation

struct ConnectMatch: Codable, Identifiable {
    let id: String
    let user1Id: String
    let user2Id: String
    let status: ConnectMatchStatus
    let ekkoConversationId: String?
    let createdAt: Date
    let updatedAt: Date?

    // Nested
    var user1: UserWithProfile?
    var user2: UserWithProfile?
    var messages: [ConnectMessage]?
}

/// Formatted match returned by getMatches with convenience fields
struct MatchListItem: Codable, Identifiable {
    let id: String
    let otherUser: UserWithProfile
    let lastMessage: LastMessagePreview?
    let createdAt: Date
}

struct LastMessagePreview: Codable {
    let content: String
    let senderId: String
    let createdAt: Date
}
