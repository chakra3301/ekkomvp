import Foundation

struct ConnectSwipe: Codable, Identifiable {
    let id: String
    let userId: String
    let targetUserId: String
    let type: SwipeType
    let likedContentType: ConnectContentType?
    let likedContentIndex: Int?
    let matchNote: String?
    let createdAt: Date

    // Nested
    var targetUser: UserWithProfile?
    var user: UserWithProfile?
}

struct SwipeInput: Codable {
    let targetUserId: String
    let type: SwipeType
    var likedContentType: ConnectContentType?
    var likedContentIndex: Int?
    var matchNote: String?
    /// When true, the server skips the generic "someone liked your profile"
    /// push (used when a note rides along and sends its own, richer push).
    var suppressLikePush: Bool?
}

struct SwipeResult: Codable {
    let matched: Bool
    let matchId: String?
}

struct UndoResult: Codable {
    let success: Bool
    let undoneTargetUserId: String?
    let undoneType: SwipeType?
}
