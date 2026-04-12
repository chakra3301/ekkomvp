import Foundation

struct ConnectMessage: Codable, Identifiable {
    let id: String
    let matchId: String
    let senderId: String
    let content: String
    let imageUrl: String?
    let readAt: Date?
    let createdAt: Date

    // Nested
    var sender: UserWithProfile?
}

struct SendMessageInput: Codable {
    let matchId: String
    var content: String?
    var imageUrl: String?
}

struct UnreadCountResult: Codable {
    let count: Int
}
