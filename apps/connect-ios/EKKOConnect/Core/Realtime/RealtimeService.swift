import Foundation
import Supabase
import Realtime

/// Manages Supabase Realtime channels for live chat features:
/// new messages, typing indicators, and read receipts.
@Observable
@MainActor
final class RealtimeService {
    private let supabase: SupabaseClient
    private var channel: RealtimeChannelV2?

    var isOtherTyping = false
    var newMessageSignal = 0
    var readSignal = 0

    private var typingTimer: Timer?
    private var lastTypingSent: Date = .distantPast
    private let typingThrottleInterval: TimeInterval = 2
    private let typingHideInterval: TimeInterval = 3

    init(supabase: SupabaseClient) {
        self.supabase = supabase
    }

    // MARK: - Subscribe to Chat Channel

    func subscribeToChat(matchId: String, currentUserId: String) async {
        // Unsubscribe from previous channel
        await unsubscribe()

        let channel = supabase.realtimeV2.channel("chat:\(matchId)")

        // Listen for new messages via postgres_changes
        let insertions = channel.postgresChange(
            InsertAction.self,
            schema: "public",
            table: "connect_messages",
            filter: .eq("match_id", value: matchId)
        )

        // Listen for typing broadcasts
        let typing = channel.broadcastStream(event: "typing")

        // Listen for read broadcasts
        let read = channel.broadcastStream(event: "read")

        try? await channel.subscribeWithError()

        self.channel = channel

        // Handle new messages
        Task { @MainActor [weak self] in
            for await action in insertions {
                let senderId = action.record["sender_id"]
                if let senderStr = senderId?.stringValue, senderStr != currentUserId {
                    self?.newMessageSignal += 1
                }
            }
        }

        // Handle typing
        Task { @MainActor [weak self] in
            for await message in typing {
                if let userIdJSON = message["userId"], let userId = userIdJSON.stringValue,
                   userId != currentUserId {
                    guard let self else { return }
                    self.isOtherTyping = true
                    self.typingTimer?.invalidate()
                    self.typingTimer = Timer.scheduledTimer(withTimeInterval: self.typingHideInterval, repeats: false) { _ in
                        Task { @MainActor [weak self] in
                            self?.isOtherTyping = false
                        }
                    }
                }
            }
        }

        // Handle read receipts
        Task { @MainActor [weak self] in
            for await message in read {
                if let userIdJSON = message["userId"], let userId = userIdJSON.stringValue,
                   userId != currentUserId {
                    self?.readSignal += 1
                }
            }
        }
    }

    // MARK: - Send Typing Indicator

    func sendTyping(userId: String) async {
        guard let channel else { return }
        let now = Date()
        guard now.timeIntervalSince(lastTypingSent) >= typingThrottleInterval else { return }
        lastTypingSent = now

        struct TypingPayload: Codable { let userId: String }
        try? await channel.broadcast(event: "typing", message: TypingPayload(userId: userId))
    }

    // MARK: - Send Read Receipt

    func sendRead(userId: String) async {
        guard let channel else { return }
        struct ReadPayload: Codable { let userId: String }
        try? await channel.broadcast(event: "read", message: ReadPayload(userId: userId))
    }

    // MARK: - Unsubscribe

    func unsubscribe() async {
        if let channel {
            await supabase.realtimeV2.removeChannel(channel)
            self.channel = nil
        }
        isOtherTyping = false
        typingTimer?.invalidate()
    }
}

// MARK: - AnyJSON helper

private extension AnyJSON {
    var stringValue: String? {
        switch self {
        case .string(let s): return s
        default: return nil
        }
    }
}
