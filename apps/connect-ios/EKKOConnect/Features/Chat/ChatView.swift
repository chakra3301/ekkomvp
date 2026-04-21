import SwiftUI
import PhotosUI
import Kingfisher

struct ChatView: View {
    let matchId: String
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var messages: [ConnectMessage] = []
    @State private var messageText = ""
    @State private var match: ConnectMatch?
    @State private var isLoading = true
    @State private var isSending = false
    @State private var isUploading = false
    @State private var showProfileSheet = false
    @State private var showMenu = false
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var showEmojiPicker = false
    @State private var audioRecorder = AudioRecorder()
    @State private var showReportSheet = false
    /// Full ConnectProfile fetched lazily when the user taps "View
    /// Profile" — needed to render the right template (Hire / Client /
    /// etc.) since the match payload only carries a thin slice.
    @State private var sheetProfile: ConnectProfile?
    @State private var sheetIsLoading = false
    /// Inquiry CTA state for the profile sheet (matches the LikesView
    /// pattern). Hire / Client templates fire this on Book a Call /
    /// Apply Now.
    @State private var pendingInquiry: PendingChatInquiry?

    private struct PendingChatInquiry: Identifiable {
        let id = UUID()
        let type: ConnectInquiryType
        let toUserId: String
        let recipientName: String?
        let briefs: [ClientBrief]
    }

    // Realtime (typing indicators + live messages + read receipts)
    @State private var realtimeService: RealtimeService?

    private var currentUserId: String? {
        appState.session?.user.id.uuidString
    }

    private var otherUser: UserWithProfile? {
        guard let match, let currentUserId else { return nil }
        if match.user1Id == currentUserId { return match.user2 }
        return match.user1
    }

    private var displayName: String {
        otherUser?.profile?.displayName ?? "User"
    }

    private var isOtherTyping: Bool {
        realtimeService?.isOtherTyping ?? false
    }

    var body: some View {
        VStack(spacing: 0) {
            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        if messages.isEmpty && !isLoading {
                            emptyChat
                        }

                        ForEach(messages) { msg in
                            messageBubble(msg)
                                .id(msg.id)
                        }

                        // Typing indicator
                        if isOtherTyping {
                            typingIndicator
                                .id("typing")
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .onChange(of: messages.count) { _, _ in
                    if let last = messages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            // Input bar
            inputBar
        }
        .navigationTitle(displayName)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("View Profile") { showProfileSheet = true }
                    Divider()
                    Button("Unmatch", role: .destructive) { Task { await handleUnmatch() } }
                    Button("Block", role: .destructive) { Task { await handleBlock() } }
                    Button("Report") { showReportSheet = true }
                } label: {
                    Image(systemName: "ellipsis")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .sheet(isPresented: $showProfileSheet) {
            profileSheet
        }
        .sheet(isPresented: $showReportSheet) {
            if let otherId = otherUser?.id {
                ReportSheet(targetType: .USER, targetId: otherId)
            }
        }
        .task {
            await loadChat()
            await setupRealtime()
        }
        .onAppear {
            // Suppresses the in-app message banner for this thread while the
            // user is actively reading it. EKKOConnectApp bridges push →
            // banner via AppState and skips when this matches the push route.
            appState.activeChatMatchId = matchId
            // Opening the chat = the match has been acknowledged, so dismiss
            // any lock-screen Live Activity still pinned for it.
            MatchLiveActivityManager.end(matchId: matchId)
        }
        .onDisappear {
            if appState.activeChatMatchId == matchId {
                appState.activeChatMatchId = nil
            }
            Task { await realtimeService?.unsubscribe() }
        }
        .onChange(of: realtimeService?.newMessageSignal) { _, _ in
            Task { await reloadMessages() }
        }
        .onChange(of: realtimeService?.readSignal) { _, _ in
            Task { await reloadMessages() }
        }
        .onChange(of: messageText) { _, newValue in
            // Notify the other user that we're typing (throttled in the service)
            guard !newValue.isEmpty, let userId = currentUserId else { return }
            Task { await realtimeService?.sendTyping(userId: userId) }
        }
        .onChange(of: selectedPhoto) { _, item in
            guard let item else { return }
            Task { await handlePhotoPicked(item) }
            selectedPhoto = nil
        }
    }

    // MARK: - Realtime setup

    private func setupRealtime() async {
        guard let userId = currentUserId else { return }
        let service = RealtimeService(supabase: appState.supabase)
        realtimeService = service
        await service.subscribeToChat(matchId: matchId, currentUserId: userId)
    }

    private func reloadMessages() async {
        do {
            struct MessagesInput: Codable {
                let matchId: String
                let limit: Int
            }
            struct MessagesResult: Codable {
                let messages: [ConnectMessage]
            }
            let result: MessagesResult = try await appState.trpc.query(
                "connectChat.getMessages",
                input: MessagesInput(matchId: matchId, limit: 50)
            )
            messages = result.messages.reversed()

            // Broadcast that we've read their messages, and persist to DB
            try? await appState.trpc.mutate("connectChat.markAsRead", input: ["matchId": matchId])
            if let userId = currentUserId {
                await realtimeService?.sendRead(userId: userId)
            }
        } catch {
            appState.showError("Couldn't load messages: \(error.localizedDescription)")
        }
    }

    // MARK: - Message Bubble

    @ViewBuilder
    private func messageBubble(_ msg: ConnectMessage) -> some View {
        let isMine = msg.senderId == currentUserId

        HStack(alignment: .bottom, spacing: 8) {
            if isMine { Spacer(minLength: 60) }

            // Other user's avatar on received messages
            if !isMine {
                AvatarView(
                    url: otherUser?.profile?.avatarUrl,
                    name: displayName,
                    size: 28
                )
            }

            VStack(alignment: isMine ? .trailing : .leading, spacing: 4) {
                // Audio message
                if let mediaUrl = msg.imageUrl, MediaTypeDetector.isAudio(mediaUrl) {
                    AudioMessageBubble(url: mediaUrl, isMine: isMine)
                }
                // Image message
                else if let imageUrl = msg.imageUrl, let url = URL(string: imageUrl) {
                    KFImage(url)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 192, height: 144)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }

                // Text content
                if !msg.content.isEmpty && msg.imageUrl == nil {
                    Text(msg.content)
                        .font(.subheadline)
                        .foregroundStyle(isMine ? .white : .primary)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(
                            isMine
                            ? AnyShapeStyle(Color.accentColor)
                            : AnyShapeStyle(.ultraThinMaterial)
                        )
                        .clipShape(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                        )
                }

                // Timestamp + read receipt
                HStack(spacing: 4) {
                    Text(msg.createdAt.relativeShort)
                        .font(.system(size: 10))
                        .foregroundStyle(isMine ? .secondary : .tertiary)

                    if isMine {
                        if msg.readAt != nil {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(.cyan)
                        } else {
                            Image(systemName: "checkmark")
                                .font(.system(size: 10))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            if !isMine { Spacer(minLength: 60) }
        }
    }

    // MARK: - Typing Indicator

    private var typingIndicator: some View {
        HStack {
            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(Color.secondary.opacity(0.6))
                        .frame(width: 6, height: 6)
                        .offset(y: typingBounceOffset(index: i))
                        .animation(
                            .easeInOut(duration: 0.4)
                            .repeatForever()
                            .delay(Double(i) * 0.15),
                            value: isOtherTyping
                        )
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 18))
            Spacer()
        }
    }

    private func typingBounceOffset(index: Int) -> CGFloat {
        isOtherTyping ? -4 : 0
    }

    // MARK: - Input Bar (iMessage style)

    private var inputBar: some View {
        let isEmpty = messageText.trimmingCharacters(in: .whitespaces).isEmpty

        return VStack(spacing: 0) {
            // Recording overlay
            if audioRecorder.isRecording {
                recordingBar
            }

            HStack(spacing: 10) {
                // Plus button (attachments)
                PhotosPicker(selection: $selectedPhoto, matching: .images) {
                    Image(systemName: isUploading ? "arrow.circlepath" : "plus")
                        .font(.system(size: 20, weight: .regular))
                        .foregroundStyle(.secondary)
                        .frame(width: 32, height: 32)
                        .background(Color.gray.opacity(0.18))
                        .clipShape(Circle())
                }
                .disabled(isUploading || audioRecorder.isRecording)

                // Pill text field with inline icons
                HStack(spacing: 8) {
                    TextField("Message", text: $messageText)
                        .font(.system(size: 16))
                        .padding(.leading, 14)
                        .padding(.vertical, 8)
                        .onSubmit { Task { await handleSend() } }
                        .disabled(audioRecorder.isRecording)

                    if isEmpty {
                        // Audio recording button
                        Button {
                            Task { await toggleRecording() }
                        } label: {
                            Image(systemName: audioRecorder.isRecording ? "stop.circle.fill" : "waveform")
                                .font(.system(size: 18))
                                .foregroundStyle(audioRecorder.isRecording ? .red : .secondary)
                                .padding(.trailing, 12)
                        }
                    } else {
                        // Send button replaces waveform when typing
                        Button {
                            Task { await handleSend() }
                        } label: {
                            Image(systemName: "arrow.up")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(.white)
                                .frame(width: 26, height: 26)
                                .background(Color.accentColor)
                                .clipShape(Circle())
                        }
                        .accessibilityLabel("Send message")
                        .padding(.trailing, 4)
                        .disabled(isSending)
                    }
                }
                .overlay(
                    Capsule()
                        .stroke(Color.gray.opacity(0.3), lineWidth: 0.5)
                )
                .clipShape(Capsule())

                // Emoji button
                Button {
                    showEmojiPicker = true
                } label: {
                    Image(systemName: "face.smiling")
                        .font(.system(size: 22))
                        .foregroundStyle(.secondary)
                }
                .disabled(audioRecorder.isRecording)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
        }
        .background(.ultraThinMaterial)
        .sheet(isPresented: $showEmojiPicker) {
            EmojiPickerSheet(text: $messageText)
        }
    }

    // MARK: - Recording Bar

    private var recordingBar: some View {
        HStack(spacing: 12) {
            // Pulsing red dot
            Circle()
                .fill(.red)
                .frame(width: 8, height: 8)
                .opacity(audioRecorder.isRecording ? 1 : 0.3)
                .animation(.easeInOut(duration: 0.7).repeatForever(), value: audioRecorder.isRecording)

            // Live amplitude waveform — newest sample on the right. Bars
            // fallback to a minimum height so silent moments aren't invisible.
            HStack(alignment: .center, spacing: 2) {
                ForEach(Array(audioRecorder.levels.enumerated()), id: \.offset) { _, level in
                    Capsule()
                        .fill(Color.red.opacity(0.85))
                        .frame(width: 2.5, height: max(4, CGFloat(level) * 22))
                }
            }
            .frame(height: 24)
            .animation(.linear(duration: 0.08), value: audioRecorder.levels)

            Spacer(minLength: 4)

            // Elapsed / cap — tints amber as we approach the ceiling so the
            // user isn't surprised by the auto-stop.
            let remaining = AudioRecorder.maxDuration - audioRecorder.elapsed
            Text(formatTime(audioRecorder.elapsed))
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(remaining < 10 ? Color.orange : .secondary)

            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                audioRecorder.cancelRecording()
            } label: {
                Text("Cancel")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.red.opacity(0.08))
    }

    private func formatTime(_ seconds: TimeInterval) -> String {
        let total = Int(seconds)
        return String(format: "%d:%02d", total / 60, total % 60)
    }

    // MARK: - Audio Recording

    private func toggleRecording() async {
        if audioRecorder.isRecording {
            // Stop and send
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            guard let url = audioRecorder.stopRecording() else { return }
            await sendVoiceMessage(fileURL: url)
        } else {
            let granted = await audioRecorder.requestPermission()
            guard granted else {
                appState.showError("EKKO can't record without microphone access. Enable it in Settings.")
                return
            }
            do {
                try audioRecorder.startRecording()
                UIImpactFeedbackGenerator(style: .soft).impactOccurred()
                // Auto-send when the cap is hit so the user doesn't have to
                // race the countdown.
                audioRecorder.onMaxDurationReached = {
                    UINotificationFeedbackGenerator().notificationOccurred(.warning)
                    Task { await toggleRecording() }
                }
            } catch {
                appState.showError("Couldn't start recording — \(error.localizedDescription)")
            }
        }
    }

    private func sendVoiceMessage(fileURL: URL) async {
        guard let userId = currentUserId else { return }
        isSending = true
        do {
            let data = try Data(contentsOf: fileURL)
            let storage = StorageService(supabase: appState.supabase)
            // Reuse chat image upload path; URL extension determines audio handling
            let audioURL = try await storage.uploadConnectAudio(userId: userId, data: data, fileExtension: "m4a")

            let msg: ConnectMessage = try await appState.trpc.mutate(
                "connectChat.sendMessage",
                input: SendMessageInput(matchId: matchId, imageUrl: audioURL)
            )
            messages.append(msg)
            try? FileManager.default.removeItem(at: fileURL)
        } catch {
            print("[Voice] Send failed: \(error)")
        }
        isSending = false
    }

    // MARK: - Empty Chat

    private var emptyChat: some View {
        VStack(spacing: 12) {
            Text("👋")
                .font(.system(size: 48))
                .padding(.top, 40)
            Text("You matched with \(displayName)!")
                .font(.subheadline.weight(.semibold))
            Text("Break the ice — say something about their profile.")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.bottom, 24)
    }

    // MARK: - Profile Sheet

    private var profileSheet: some View {
        NavigationStack {
            ScrollView {
                if let profile = sheetProfile {
                    ConnectProfileViewer(
                        profile: profile,
                        viewerIsOwner: false,
                        onTapInquiryCTA: { type in
                            pendingInquiry = PendingChatInquiry(
                                type: type,
                                toUserId: profile.userId,
                                recipientName: profile.user?.profile?.displayName,
                                briefs: profile.clientData?.briefs ?? []
                            )
                        }
                    )
                } else if sheetIsLoading {
                    ProgressView().padding(.top, 80)
                } else if let other = otherUser {
                    // No Connect profile (or fetch failed) — fall back to
                    // a thin display so the sheet isn't empty.
                    ConnectProfileCard(
                        displayName: other.profile?.displayName ?? "User",
                        avatarUrl: other.profile?.avatarUrl,
                        headline: nil,
                        location: nil
                    )
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { showProfileSheet = false }
                }
            }
            .task {
                guard sheetProfile == nil, let userId = otherUser?.id else { return }
                sheetIsLoading = true
                defer { sheetIsLoading = false }
                do {
                    let p: ConnectProfile = try await appState.trpc.query(
                        "connectProfile.getByUserId",
                        input: userId
                    )
                    sheetProfile = p
                } catch {
                    // Swallow — the fallback ConnectProfileCard renders.
                }
            }
            .sheet(item: $pendingInquiry) { p in
                inquirySheetForChat(p)
            }
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.visible)
    }

    @ViewBuilder
    private func inquirySheetForChat(_ p: PendingChatInquiry) -> some View {
        switch p.type {
        case .BOOKING_REQUEST:
            BookCallSheet(
                toUserId: p.toUserId,
                recipientName: p.recipientName,
                onSent: { appState.showSuccess("Sent — they'll see it under Requests.") }
            )
        case .APPLICATION:
            ApplyNowSheet(
                toUserId: p.toUserId,
                recipientBrand: p.recipientName,
                briefs: p.briefs,
                onSent: { appState.showSuccess("Sent — they'll see it under Requests.") }
            )
        case .NOTE:
            BookCallSheet(
                toUserId: p.toUserId,
                recipientName: p.recipientName,
                onSent: { appState.showSuccess("Sent.") }
            )
        }
    }

    // MARK: - Actions

    private func loadChat() async {
        do {
            // Load match details
            let m: ConnectMatch = try await appState.trpc.query(
                "connectMatch.getMatch",
                input: matchId
            )
            match = m

            // Load messages
            struct MessagesInput: Codable {
                let matchId: String
                let limit: Int
            }
            struct MessagesResult: Codable {
                let messages: [ConnectMessage]
            }
            let result: MessagesResult = try await appState.trpc.query(
                "connectChat.getMessages",
                input: MessagesInput(matchId: matchId, limit: 50)
            )
            messages = result.messages.reversed()

            // Mark as read
            try? await appState.trpc.mutate("connectChat.markAsRead", input: ["matchId": matchId])
        } catch {}
        isLoading = false
    }

    private func handleSend() async {
        let text = messageText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }

        isSending = true
        messageText = ""
        do {
            let msg: ConnectMessage = try await appState.trpc.mutate(
                "connectChat.sendMessage",
                input: SendMessageInput(matchId: matchId, content: text)
            )
            messages.append(msg)
        } catch {
            messageText = text // restore so the user can retry
            appState.showError("Couldn't send message. Check your connection.")
        }
        isSending = false
    }

    private func handlePhotoPicked(_ item: PhotosPickerItem) async {
        isUploading = true
        do {
            guard let data = try await item.loadTransferable(type: Data.self),
                  let userId = currentUserId else {
                isUploading = false
                return
            }

            let storage = StorageService(supabase: appState.supabase)
            let imageUrl = try await storage.uploadChatImage(
                userId: userId,
                matchId: matchId,
                data: data,
                fileExtension: "jpg"
            )

            let msg: ConnectMessage = try await appState.trpc.mutate(
                "connectChat.sendMessage",
                input: SendMessageInput(matchId: matchId, imageUrl: imageUrl)
            )
            messages.append(msg)
        } catch {
            appState.showError("Couldn't send image. Try again.")
        }
        isUploading = false
    }

    private func handleUnmatch() async {
        do {
            try await appState.trpc.mutate("connectMatch.unmatch", input: matchId)
            appState.showSuccess("Unmatched")
            dismiss()
        } catch {
            appState.showError("Couldn't unmatch. Try again.")
        }
    }

    private func handleBlock() async {
        guard let otherUserId = otherUser?.id else { return }
        do {
            try await appState.trpc.mutate("block.block", input: ["userId": otherUserId])
            try await appState.trpc.mutate("connectMatch.unmatch", input: matchId)
            appState.showSuccess("User blocked")
            dismiss()
        } catch {
            appState.showError("Couldn't block user. Try again.")
        }
    }
}

// MARK: - Audio Message Bubble

import AVFoundation

struct AudioMessageBubble: View {
    let url: String
    let isMine: Bool
    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var progress: Double = 0
    @State private var timer: Timer?
    @State private var duration: Double = 0
    @State private var currentTime: Double = 0

    var body: some View {
        HStack(spacing: 10) {
            Button {
                togglePlayback()
            } label: {
                Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(isMine ? .white : Color.accentColor)
                    .frame(width: 32, height: 32)
                    .background(isMine ? Color.white.opacity(0.2) : Color.accentColor.opacity(0.15))
                    .clipShape(Circle())
            }

            HStack(spacing: 2) {
                ForEach(0..<20, id: \.self) { i in
                    let barProgress = Double(i) / 20.0
                    Capsule()
                        .fill(
                            barProgress <= progress
                            ? (isMine ? Color.white : Color.accentColor)
                            : (isMine ? Color.white.opacity(0.35) : Color.gray.opacity(0.3))
                        )
                        .frame(width: 2.5, height: waveHeight(i))
                }
            }
            .frame(height: 24)

            // Duration label — total while idle, current while playing.
            Text(formatTime(isPlaying ? currentTime : duration))
                .font(.system(size: 11, weight: .medium).monospacedDigit())
                .foregroundStyle(isMine ? .white.opacity(0.85) : .secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(isMine ? Color.accentColor : Color.gray.opacity(0.15))
        .clipShape(Capsule())
        .task(id: url) {
            // Preload duration so the bubble shows "0:14" before first play.
            guard let u = URL(string: url) else { return }
            let asset = AVURLAsset(url: u)
            if let d = try? await asset.load(.duration), d.isValid {
                let seconds = d.seconds
                if seconds.isFinite { duration = seconds }
            }
        }
        .onDisappear {
            player?.pause()
            timer?.invalidate()
        }
    }

    private func formatTime(_ seconds: Double) -> String {
        let total = Int(seconds.rounded())
        return String(format: "%d:%02d", total / 60, total % 60)
    }

    private func waveHeight(_ i: Int) -> CGFloat {
        let heights: [CGFloat] = [8, 14, 20, 12, 18, 22, 10, 16, 24, 8, 14, 20, 18, 12, 22, 10, 16, 20, 14, 8]
        return heights[i % heights.count]
    }

    private func togglePlayback() {
        if player == nil, let u = URL(string: url) {
            player = AVPlayer(url: u)
        }
        if isPlaying {
            player?.pause()
            timer?.invalidate()
        } else {
            player?.play()
            timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
                guard let player, let item = player.currentItem else { return }
                let d = item.duration.seconds
                let c = player.currentTime().seconds
                if d.isFinite && d > 0 {
                    progress = c / d
                    currentTime = c
                    if progress >= 1.0 {
                        progress = 0
                        currentTime = 0
                        isPlaying = false
                        player.seek(to: .zero)
                        timer?.invalidate()
                    }
                }
            }
        }
        isPlaying.toggle()
    }
}
