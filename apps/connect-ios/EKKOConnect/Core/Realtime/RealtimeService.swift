import Foundation
import Supabase
import Realtime

/// Manages Supabase Realtime channels for live chat features:
/// new messages, typing indicators, and read receipts.
@Observable
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
            filter: "match_id=eq.\(matchId)"
        )

        // Listen for typing broadcasts
        let typing = channel.broadcast(event: "typing")

        // Listen for read broadcasts
        let read = channel.broadcast(event: "read")

        await channel.subscribe()

        self.channel = channel

        // Handle new messages
        Task {
            for await action in insertions {
                let senderId = action.record["sender_id"]
                if let senderStr = senderId?.stringValue, senderStr != currentUserId {
                    await MainActor.run {
                        newMessageSignal += 1
                    }
                }
            }
        }

        // Handle typing
        Task {
            for await message in typing {
                if let userIdJSON = message["userId"], let userId = userIdJSON.stringValue,
                   userId != currentUserId {
                    await MainActor.run {
                        isOtherTyping = true
                        typingTimer?.invalidate()
                        typingTimer = Timer.scheduledTimer(withTimeInterval: typingHideInterval, repeats: false) { _ in
                            Task { @MainActor in
                                self.isOtherTyping = false
                            }
                        }
                    }
                }
            }
        }

        // Handle read receipts
        Task {
            for await message in read {
                if let userIdJSON = message["userId"], let userId = userIdJSON.stringValue,
                   userId != currentUserId {
                    await MainActor.run {
                        readSignal += 1
                    }
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
