import Foundation

enum ConnectLimits {
    static let maxMediaSlots = 6
    static let minMediaSlots = 1
    static let maxPrompts = 3
    static let minPrompts = 1
    static let headlineMax = 200
    static let lookingForMax = 500
    static let bioMax = 500
    static let promptAnswerMax = 500
    static let customPromptQuestionMax = 150
    static let matchNoteMax = 255
    static let messageMax = 1000
    static let discoveryBatchSize = 10
    static let messagesPageSize = 30
    static let matchesPageSize = 20
    static let likesPageSize = 20
    static let historyPageSize = 20
    static let dailyLikesFree = 999999
    static let dailyLikesInfinite = 999999
    static let maxMediaSlotsInfinite = 12
    static let maxFileSizeImage = 10_485_760      // 10MB
    static let maxFileSizeVideo = 52_428_800      // 50MB
    static let maxFileSizeAudio = 20_971_520      // 20MB
    static let maxFileSizeModel = 52_428_800      // 50MB
    static let maxFileSizeChatImage = 5_242_880   // 5MB
}

let connectPrompts: [String] = [
    "My most creative project was...",
    "I'm looking to collaborate on...",
    "A skill I want to learn is...",
    "My dream creative project would be...",
    "The medium I'm most passionate about is...",
    "I get inspired by...",
    "My creative process usually starts with...",
    "A project I'm most proud of is...",
    "I believe great design/art should...",
    "Something surprising about my work is...",
    "The best feedback I ever received was...",
    "I'm currently working on...",
    "My creative superpower is...",
    "I want to connect with people who...",
    "A tool I can't live without is...",
]

struct ConnectTierConfig {
    let name: String
    let dailyLikes: Int
    let maxMediaSlots: Int
    let badge: Bool
    let seeWhoLikes: Bool
    let globalSearch: Bool
    let topOfStack: Bool
    let price: String?
}

let connectTiers: [ConnectTier: ConnectTierConfig] = [
    .FREE: ConnectTierConfig(
        name: "Free",
        dailyLikes: 999999,
        maxMediaSlots: 12,
        badge: false,
        seeWhoLikes: true,
        globalSearch: true,
        topOfStack: false,
        price: nil
    ),
    .INFINITE: ConnectTierConfig(
        name: "Infinite",
        dailyLikes: 999999,
        maxMediaSlots: 12,
        badge: true,
        seeWhoLikes: true,
        globalSearch: true,
        topOfStack: true,
        price: "$7.99/mo"
    ),
]
