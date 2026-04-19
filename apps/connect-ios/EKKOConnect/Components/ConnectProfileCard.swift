import SwiftUI
import AVFoundation
import Kingfisher
import WebKit

/// Profile card layout:
/// Hero (first media) → Name/headline/location → Bio → Looking for →
/// Interleaved remaining media + prompts → Social links
struct ConnectProfileCard: View {
    let displayName: String
    var avatarUrl: String?
    var headline: String?
    var location: String?
    var lookingFor: String?
    var bio: String?
    var mediaSlots: [MediaSlot] = []
    var prompts: [PromptEntry] = []
    var instagramHandle: String?
    var twitterHandle: String?
    var websiteUrl: String?
    var connectTier: ConnectTier = .FREE
    /// When true, the name gets a "GM" badge instead of the Infinite icon.
    var isAdmin: Bool = false
    var editableAvatar: Bool = false
    /// When non-nil, the card renders in inline-edit mode: each section becomes
    /// tappable, calls the matching closure, and gets a dashed edit affordance.
    var editActions: ProfileEditActions? = nil

    /// Media beyond the hero, sorted by sortOrder
    private var extraMedia: [MediaSlot] {
        Array(mediaSlots.sorted { $0.sortOrder < $1.sortOrder }.dropFirst())
    }

    /// Interleaved content items for the body section
    private var interleavedItems: [CardItem] {
        var items: [CardItem] = []
        let media = extraMedia
        let maxCount = max(media.count, prompts.count)
        for i in 0..<maxCount {
            if i < media.count {
                items.append(.media(media[i]))
            }
            if i < prompts.count {
                items.append(.prompt(prompts[i]))
            }
        }
        return items
    }

    private enum CardItem: Identifiable {
        case media(MediaSlot)
        case prompt(PromptEntry)

        var id: String {
            switch self {
            case .media(let s): return "media-\(s.sortOrder)-\(s.url.suffix(10))"
            case .prompt(let p): return "prompt-\(p.question.prefix(20))"
            }
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // 1. Hero media (first slot, full width)
            EditableSection(action: editActions?.onTapMedia) {
                heroMedia
            }

            // Avatar overlapping hero — half on, half off
            Group {
                if editableAvatar {
                    EditableAvatarView(url: avatarUrl, name: displayName, size: 120)
                } else {
                    AvatarView(url: avatarUrl, name: displayName, size: 120)
                }
            }
            .overlay(
                Circle().stroke(Color(.systemBackground), lineWidth: 5)
            )
            .shadow(color: .black.opacity(0.18), radius: 12, y: 3)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.leading, 20)
            .offset(y: -60)
            .padding(.bottom, -60)

            VStack(alignment: .leading, spacing: 20) {
                // 2. Name + headline + location
                EditableSection(action: editActions?.onTapHeadlineLocation) {
                    infoSection
                }
                .padding(.top, 8)

                // 3. Bio
                if let bio, !bio.isEmpty {
                    EditableSection(action: editActions?.onTapBio) {
                        VStack(alignment: .leading, spacing: 4) {
                            JPSectionHeader(english: "About", japanese: JPLabels.sections.about)
                            Text(bio)
                                .font(.subheadline)
                        }
                    }
                } else if editActions != nil {
                    EditableSection(action: editActions?.onTapBio) {
                        placeholderRow(label: "About", japanese: JPLabels.sections.about, hint: "Add a short bio")
                    }
                }

                // 4. Looking for
                if let lookingFor, !lookingFor.isEmpty {
                    EditableSection(action: editActions?.onTapLookingFor) {
                        VStack(alignment: .leading, spacing: 4) {
                            JPSectionHeader(english: "Looking for", japanese: JPLabels.sections.lookingFor)
                            Text(lookingFor)
                                .font(.subheadline)
                        }
                    }
                } else if editActions != nil {
                    EditableSection(action: editActions?.onTapLookingFor) {
                        placeholderRow(label: "Looking for", japanese: JPLabels.sections.lookingFor, hint: "Add what you're looking for")
                    }
                }

                // Edit-mode affordance for prompts (since interleaved layout
                // makes per-prompt tap targets awkward, surface a single
                // explicit "Edit prompts" entry point).
                if editActions != nil {
                    EditableSection(action: editActions?.onTapPrompts) {
                        placeholderRow(label: "Prompts", japanese: JPLabels.sections.prompts, hint: "\(prompts.count) prompt\(prompts.count == 1 ? "" : "s")")
                    }
                }
            }
            .padding(16)

            // 5. Interleaved media + prompts
            // Prompts overlay the bottom of the preceding image/video, floating with glass style
            interleavedContent

            // 6. Social previews — stacked, each in their own glass card
            EditableSection(action: editActions?.onTapSocials) {
                VStack(spacing: 12) {
                    if let ig = instagramHandle, !ig.isEmpty {
                        InstagramPreview(handle: ig)
                    }
                    if let tw = twitterHandle, !tw.isEmpty {
                        TwitterPreview(handle: tw)
                    }
                    if let web = websiteUrl, !web.isEmpty {
                        websitePreview(url: web)
                    }
                    if editActions != nil &&
                        (instagramHandle?.isEmpty ?? true) &&
                        (twitterHandle?.isEmpty ?? true) &&
                        (websiteUrl?.isEmpty ?? true) {
                        placeholderRow(label: "Socials", japanese: JPLabels.sections.socials, hint: "Add Instagram, X, or website")
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 24)
        }
    }

    private func placeholderRow(label: String, japanese: String? = nil, hint: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                if let japanese {
                    JPSectionHeader(english: label, japanese: japanese)
                } else {
                    Text(label)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                Text(hint)
                    .font(.subheadline)
                    .foregroundStyle(.secondary.opacity(0.7))
            }
            Spacer()
            Image(systemName: "plus.circle")
                .foregroundStyle(EKKOTheme.primary)
        }
    }

    @ViewBuilder
    private func websitePreview(url: String) -> some View {
        Button {
            let urlStr = url.hasPrefix("http") ? url : "https://\(url)"
            if let u = URL(string: urlStr) { UIApplication.shared.open(u) }
        } label: {
            HStack(spacing: 10) {
                WebsiteLogo()
                    .frame(width: 28, height: 28)

                VStack(alignment: .leading, spacing: 2) {
                    Text(cleanDisplayURL(url))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    Text("Open website")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(14)
        }
        .buttonStyle(.plain)
        .glassBubble(cornerRadius: 18)
    }

    private func cleanDisplayURL(_ url: String) -> String {
        url
            .replacingOccurrences(of: "https://", with: "")
            .replacingOccurrences(of: "http://", with: "")
            .replacingOccurrences(of: "www.", with: "")
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }

    // MARK: - Interleaved Content

    @ViewBuilder
    private var interleavedContent: some View {
        let media = extraMedia
        let promptCount = prompts.count
        let mediaCount = media.count

        // Pair each media with a prompt that overlaps its bottom half.
        // Extra prompts (no media to attach to) render standalone.
        // Extra media (no prompt) render standalone.
        let pairCount = min(mediaCount, promptCount)

        // Paired: media with prompt overlapping bottom
        ForEach(0..<pairCount, id: \.self) { i in
            mediaWithOverlayPrompt(slot: media[i], prompt: prompts[i])
        }

        // Remaining media without prompts
        if mediaCount > pairCount {
            ForEach(pairCount..<mediaCount, id: \.self) { i in
                fullMediaView(slot: media[i])
                    .padding(.bottom, 16)
            }
        }

        // Remaining prompts without media
        if promptCount > pairCount {
            ForEach(pairCount..<promptCount, id: \.self) { i in
                promptCard(prompts[i])
                    .padding(.horizontal, 16)
                    .padding(.bottom, 16)
            }
        }
    }

    @ViewBuilder
    private func mediaWithOverlayPrompt(slot: MediaSlot, prompt: PromptEntry) -> some View {
        // For images/videos: prompt floats over the bottom half
        // For audio/3D: show them stacked (no overlay)
        if slot.isAudio || slot.isModel {
            fullMediaView(slot: slot)
                .padding(.bottom, 8)
            promptCard(prompt)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
        } else {
            ZStack(alignment: .bottom) {
                fullMediaView(slot: slot)

                // Glossy glass bubble — transparent, with shine on appear
                VStack(alignment: .leading, spacing: 4) {
                    Text(prompt.question)
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.primary.opacity(0.7))
                    Text(prompt.answer)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.primary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 18)
                .padding(.vertical, 14)
                .glassBubble()
                .padding(.horizontal, 28)
                .offset(y: 40)
            }
            .padding(.bottom, 56)
        }
    }

    // MARK: - Info Section

    private var infoSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(displayName)
                    .font(.custom(EKKOFont.regular, size: 26))
                if isAdmin {
                    Text("GM")
                        .font(.caption.bold())
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(
                            LinearGradient(
                                colors: [EKKOTheme.primary, Color.purple],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(Capsule())
                } else if connectTier == .INFINITE {
                    Image(systemName: "infinity")
                        .font(.caption)
                        .foregroundStyle(EKKOTheme.primary)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(EKKOTheme.primary.opacity(0.1))
                        .clipShape(Capsule())
                }
            }
            if let headline, !headline.isEmpty {
                Text(headline)
                    .font(.custom(EKKOFont.regular, size: 16))
                    .foregroundStyle(.secondary)
            }
            if let location, !location.isEmpty {
                Label(location, systemImage: "mappin")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - Hero Media (full-bleed, edge-to-edge)

    @ViewBuilder
    private func heroContent(slot: MediaSlot) -> some View {
        if slot.isAudio {
            ZStack {
                LinearGradient(
                    colors: [.purple.opacity(0.4), .pink.opacity(0.3), .blue.opacity(0.2)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                VStack(spacing: 12) {
                    Image(systemName: "waveform")
                        .font(.system(size: 48))
                        .foregroundStyle(.white)
                    Text("Audio")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(.white.opacity(0.8))
                }
            }
        } else if slot.isModel {
            ModelViewerView(urlString: slot.url)
        } else if slot.isVideo {
            VideoPlayerView(urlString: slot.url)
        } else if let url = URL(string: slot.url) {
            KFImage(url)
                .resizable()
                .scaledToFill()
        }
    }

    @ViewBuilder
    private var heroMedia: some View {
        if let featured = mediaSlots.sorted(by: { $0.sortOrder < $1.sortOrder }).first {
            ZStack(alignment: .bottomLeading) {
                heroContent(slot: featured)
                    .frame(maxWidth: .infinity)
                    .frame(minHeight: 350)
                    .clipped()

                LinearGradient(
                    colors: [.clear, .clear, .black.opacity(0.6)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 150)
                .frame(maxHeight: .infinity, alignment: .bottom)
            }
        } else {
            Rectangle()
                .fill(Color.gray.opacity(0.15))
                .frame(height: 300)
                .overlay {
                    Image(systemName: "photo")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                }
        }
    }

    // MARK: - Floating Media View (for interleaved section)
    // Padded sides, rounded corners, shadow — feels like a glass container floating

    @ViewBuilder
    private func fullMediaView(slot: MediaSlot) -> some View {
        Group {
            if slot.isAudio {
                AudioPlayerView(urlString: slot.url)
            } else if slot.isModel {
                ModelViewerView(urlString: slot.url)
                    .aspectRatio(1, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color.white.opacity(0.15), lineWidth: 0.5)
                    )
                    .shadow(color: .black.opacity(0.15), radius: 12, y: 6)
                    .padding(.horizontal, 16)
            } else if slot.isVideo {
                VideoPlayerView(urlString: slot.url)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color.white.opacity(0.15), lineWidth: 0.5)
                    )
                    .shadow(color: .black.opacity(0.15), radius: 12, y: 6)
                    .padding(.horizontal, 16)
            } else if let url = URL(string: slot.url) {
                // Photo — natural aspect ratio, padded sides, rounded glass container
                KFImage(url)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color.white.opacity(0.15), lineWidth: 0.5)
                    )
                    .shadow(color: .black.opacity(0.15), radius: 12, y: 6)
                    .padding(.horizontal, 16)
            }
        }
    }

    // MARK: - Prompt Card

    private func promptCard(_ entry: PromptEntry) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(entry.question)
                .font(.caption.weight(.medium))
                .foregroundStyle(.primary.opacity(0.65))
            Text(entry.answer)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .glassBubble()
    }

    // MARK: - Social Links

}

// MARK: - Audio Player

struct AudioPlayerView: View {
    let urlString: String
    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var progress: Double = 0
    @State private var timer: Timer?

    var body: some View {
        HStack(spacing: 16) {
            // Play/Pause button
            Button {
                togglePlayback()
            } label: {
                Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                    .font(.title2)
                    .foregroundStyle(EKKOTheme.primary)
                    .frame(width: 48, height: 48)
                    .background(EKKOTheme.primary.opacity(0.1))
                    .clipShape(Circle())
            }

            // Waveform / progress
            VStack(alignment: .leading, spacing: 6) {
                // Fake waveform bars
                HStack(spacing: 2) {
                    ForEach(0..<30, id: \.self) { i in
                        let barProgress = Double(i) / 30.0
                        RoundedRectangle(cornerRadius: 1)
                            .fill(barProgress <= progress ? EKKOTheme.primary : Color.gray.opacity(0.2))
                            .frame(width: 3, height: waveformHeight(index: i))
                    }
                }
                .frame(height: 28)

                Text("Audio")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Spacer()
        }
        .padding(16)
        .background(Color.gray.opacity(0.06))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .padding(.horizontal, 16)
        .onDisappear {
            player?.pause()
            timer?.invalidate()
        }
    }

    private func waveformHeight(index: Int) -> CGFloat {
        // Pseudo-random waveform pattern
        let heights: [CGFloat] = [8, 14, 20, 12, 24, 18, 10, 22, 16, 8, 20, 26, 14, 10, 18, 24, 12, 20, 8, 16, 22, 14, 26, 10, 18, 12, 24, 8, 20, 16]
        return heights[index % heights.count]
    }

    private func togglePlayback() {
        if player == nil, let url = URL(string: urlString) {
            player = AVPlayer(url: url)
        }

        if isPlaying {
            player?.pause()
            timer?.invalidate()
        } else {
            player?.play()
            timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
                guard let player, let item = player.currentItem else { return }
                let duration = item.duration.seconds
                let current = player.currentTime().seconds
                if duration.isFinite && duration > 0 {
                    progress = current / duration
                }
            }
        }
        isPlaying.toggle()
    }
}

// MARK: - Video Player (autoplay, muted, looping)

struct VideoPlayerView: View {
    let urlString: String
    @State private var player: AVPlayer?
    @State private var isVisible = false
    @State private var aspect: CGFloat = 9/16
    @State private var loopObserver: NSObjectProtocol?

    var body: some View {
        VideoPlayerRepresentable(player: player)
            .aspectRatio(aspect, contentMode: .fit)
            .frame(maxWidth: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: 0))
            .onAppear {
                isVisible = true
                setupAndPlay()
            }
            .onDisappear {
                isVisible = false
                player?.pause()
                if let loopObserver {
                    NotificationCenter.default.removeObserver(loopObserver)
                    self.loopObserver = nil
                }
            }
            .task { await loadAspect() }
    }

    private func loadAspect() async {
        guard let url = URL(string: urlString) else { return }
        let asset = AVURLAsset(url: url)
        do {
            let tracks = try await asset.loadTracks(withMediaType: .video)
            guard let track = tracks.first else { return }
            let size = try await track.load(.naturalSize)
            let transform = try await track.load(.preferredTransform)
            let t = size.applying(transform)
            let w = abs(t.width), h = abs(t.height)
            guard h > 0 else { return }
            let ratio = w / h
            await MainActor.run {
                withAnimation(.easeInOut(duration: 0.2)) { aspect = ratio }
            }
        } catch {}
    }

    private func setupAndPlay() {
        if let existing = player {
            existing.play()
            return
        }
        guard let url = URL(string: urlString) else { return }
        let item = AVPlayerItem(url: url)
        let avPlayer = AVPlayer(playerItem: item)
        avPlayer.isMuted = true
        player = avPlayer

        loopObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak avPlayer] _ in
            avPlayer?.seek(to: .zero)
            avPlayer?.play()
        }

        avPlayer.play()
    }
}

struct VideoPlayerRepresentable: UIViewRepresentable {
    let player: AVPlayer?

    func makeUIView(context: Context) -> PlayerUIView {
        PlayerUIView()
    }

    func updateUIView(_ uiView: PlayerUIView, context: Context) {
        uiView.playerLayer.player = player
    }

    class PlayerUIView: UIView {
        let playerLayer = AVPlayerLayer()

        override init(frame: CGRect) {
            super.init(frame: frame)
            playerLayer.videoGravity = .resizeAspect
            layer.addSublayer(playerLayer)
        }

        required init?(coder: NSCoder) { fatalError() }

        override func layoutSubviews() {
            super.layoutSubviews()
            playerLayer.frame = bounds
        }
    }
}

// MARK: - 3D Model Viewer (WKWebView + <model-viewer>)

struct ModelViewerView: View {
    let urlString: String

    var body: some View {
        ModelWebView(urlString: urlString)
    }
}

private struct ModelWebView: UIViewRepresentable {
    let urlString: String

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.isScrollEnabled = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        let ext = (URL(string: urlString)?.pathExtension ?? "").lowercased()
        let iosSrcAttr = ext == "usdz" ? "ios-src=\"\(urlString)\"" : ""
        let html = """
        <!doctype html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <style>
            html, body { margin: 0; padding: 0; height: 100%; background: transparent; }
            model-viewer { width: 100%; height: 100%; background: transparent; --poster-color: transparent; }
          </style>
          <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
        </head>
        <body>
          <model-viewer
            src="\(urlString)"
            \(iosSrcAttr)
            camera-controls
            touch-action="pan-y"
            auto-rotate
            auto-rotate-delay="1500"
            interaction-prompt="none"
            shadow-intensity="1"
            exposure="1"
            ar
            ar-modes="webxr scene-viewer quick-look"
            style="background-color: transparent; --poster-color: transparent;"
            alt="3D model">
          </model-viewer>
        </body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: URL(string: "https://ajax.googleapis.com/"))
    }
}
