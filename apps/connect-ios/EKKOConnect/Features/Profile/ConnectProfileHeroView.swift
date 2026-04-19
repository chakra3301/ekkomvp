import SwiftUI
import AVFoundation
import Kingfisher

/// Hero variant of the Connect profile (template = "HERO").
/// Full-bleed parallax cover with an oversized name overlay, floating avatar,
/// horizontal media rail, prompts, looking-for, socials.
///
/// Mirrors the structural moves of Variant 1 in the design handoff while
/// using EKKOTheme + Arches font + glass primitives that the rest of the
/// Connect app uses.
struct ConnectProfileHeroView: View {
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
    var likesReceivedCount: Int = 0
    var matchesCount: Int = 0
    var isAdmin: Bool = false
    /// When non-nil, sections become tappable and gain edit affordance.
    var editActions: ProfileEditActions? = nil

    private let coverHeight: CGFloat = 440
    private let avatarSize: CGFloat = 96

    private var sortedMedia: [MediaSlot] {
        mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
    }

    private var heroSlot: MediaSlot? { sortedMedia.first }
    private var railSlots: [MediaSlot] { Array(sortedMedia.dropFirst()) }

    var body: some View {
        VStack(spacing: 0) {
            // Cover + floating avatar layered together via ZStack so the
            // avatar can overlap cleanly without negative padding hacks.
            ZStack(alignment: .bottomLeading) {
                heroCover
                AvatarView(url: avatarUrl, name: displayName, size: avatarSize)
                    .overlay(
                        Circle().stroke(Color(.systemBackground), lineWidth: 4)
                    )
                    .shadow(color: .black.opacity(0.25), radius: 12, y: 4)
                    .padding(.leading, 20)
                    .offset(y: avatarSize / 2) // half of the avatar dips below the cover
            }
            .padding(.bottom, avatarSize / 2) // reserve room for the dip

            VStack(alignment: .leading, spacing: 18) {
                // Name + headline + location — moved out of the cover so it
                // sits in the foreground content layer.
                EditableSection(action: editActions?.onTapHeadlineLocation) {
                    nameSection
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)

                // Bio
                if let bio, !bio.isEmpty {
                    EditableSection(action: editActions?.onTapBio) {
                        Text(bio)
                            .archesStyle(.body)
                            .foregroundStyle(.primary.opacity(0.9))
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(.horizontal, 20)
                } else if editActions != nil {
                    EditableSection(action: editActions?.onTapBio) {
                        heroPlaceholder("Add a short bio")
                    }
                    .padding(.horizontal, 20)
                }

                statsRow

                // Work rail — render the rail as-is. In edit mode, surface
                // an explicit "Edit media" pill below it so the dashed border
                // doesn't fight the rail's internal padding.
                if !railSlots.isEmpty {
                    workRail
                }
                if editActions != nil {
                    Button(action: { editActions?.onTapMedia() }) {
                        heroEditPill(icon: "photo.on.rectangle", label: railSlots.isEmpty ? "Add media" : "Edit media")
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20)
                }

                // Prompts
                if !prompts.isEmpty {
                    promptsSection
                }
                if editActions != nil {
                    Button(action: { editActions?.onTapPrompts() }) {
                        heroEditPill(icon: "text.bubble", label: prompts.isEmpty ? "Add prompts" : "Edit prompts")
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20)
                }

                // Looking For
                if let lookingFor, !lookingFor.isEmpty {
                    lookingForSection(lookingFor)
                }
                if editActions != nil {
                    Button(action: { editActions?.onTapLookingFor() }) {
                        heroEditPill(icon: "sparkle.magnifyingglass",
                                     label: (lookingFor?.isEmpty ?? true) ? "Add what you're looking for" : "Edit looking for")
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20)
                }

                // Socials
                socialsSection
                if editActions != nil {
                    Button(action: { editActions?.onTapSocials() }) {
                        heroEditPill(icon: "link", label: "Edit socials")
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 20)
                }

                Spacer(minLength: 32)
            }
            .padding(.top, 56) // room for avatar overlap
        }
    }

    private func heroEditPill(icon: String, label: String) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(EKKOTheme.primary)
            Text(label)
                .font(.subheadline.weight(.medium))
            Spacer()
            Image(systemName: "pencil")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.white)
                .padding(6)
                .background(Circle().fill(EKKOTheme.primary))
        }
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(EKKOTheme.primary.opacity(0.45), style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
        )
    }

    private func heroPlaceholder(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Spacer()
            Image(systemName: "plus.circle")
                .foregroundStyle(EKKOTheme.primary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    // MARK: - Hero Cover (image / video / 3D / audio fallback)
    //
    // The cover acts as a parallax background: as the page scrolls, the
    // cover translates down at ~40% the scroll rate AND scales up slightly,
    // so the lower edge bleeds into the content area behind the foreground
    // sections. Pulling down past the top stretches the cover (iOS-style).
    // No outer .clipped() — the overflow is intentional.

    private var heroCover: some View {
        // Cover sits at the very top of the scroll content (toolbar is
        // overlaid via ZStack in ProfileView, NOT in the scroll content),
        // so `minY == 0` at rest. That makes the parallax math safe to
        // use directly — no baseline capture needed.
        //
        // Pull DOWN past the top → iOS-style stretchy header.
        // Scroll UP → cover translates down at 40% the scroll rate AND
        // scales up slightly, so the artwork "lingers" behind the
        // content scrolling past it.
        GeometryReader { geo in
            let minY = geo.frame(in: .named("heroScroll")).minY
            let pulled = max(minY, 0)
            let scrolled = max(-minY, 0)

            ZStack(alignment: .top) {
                Group {
                    if let slot = heroSlot {
                        coverContent(for: slot)
                    } else {
                        LinearGradient(
                            colors: [EKKOTheme.primary.opacity(0.6),
                                     EKKOTheme.primary.opacity(0.15),
                                     .black.opacity(0.85)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
                }
                .frame(width: geo.size.width, height: coverHeight + pulled)
                // Pull-stretch anchors the top to the original top.
                // Scroll-parallax translates the cover down at 40% rate,
                // so it stays visible longer as content scrolls past.
                .offset(y: -pulled + scrolled * 0.4)
                // Slight zoom anchored at top so the cover fills downward
                // (not centered) — keeps the top edge tight to the frame.
                .scaleEffect(1.0 + scrolled * 0.0008, anchor: .top)
                .clipped()

                // Top mono label
                HStack {
                    Text("⌘  \(handleString)")
                        .font(.custom(EKKOFont.regular, size: 11))
                        .tracking(2)
                        .foregroundStyle(.white.opacity(0.85))
                        .shadow(color: .black.opacity(0.5), radius: 4)
                    Spacer()
                    if let location, !location.isEmpty {
                        Text(location.uppercased())
                            .font(.custom(EKKOFont.regular, size: 11))
                            .tracking(2)
                            .foregroundStyle(EKKOTheme.primary)
                            .shadow(color: .black.opacity(0.5), radius: 4)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .allowsHitTesting(false)

                // Soft bottom darkening
                VStack {
                    Spacer()
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.45)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: 120)
                }
                .frame(height: coverHeight)
                .allowsHitTesting(false)
            }
        }
        .frame(height: coverHeight)
    }

    @ViewBuilder
    private func coverContent(for slot: MediaSlot) -> some View {
        if slot.isAudio {
            // Tap-to-play overlay (loops on end, pauses on disappear).
            CoverAudioPlayerView(urlString: slot.url, controlSize: 64)
        } else if slot.isModel {
            // Real <model-viewer> — tappable, rotatable.
            ModelViewerView(urlString: slot.url)
        } else if slot.isVideo {
            // Autoplays muted on loop, fills the cover.
            CoverVideoPlayerView(urlString: slot.url)
        } else if let url = URL(string: slot.url) {
            KFImage(url)
                .resizable()
                .scaledToFill()
        }
    }

    // MARK: - Name section (moved out of the cover overlay)

    private var nameSection: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline, spacing: 10) {
                Text(displayName)
                    .font(.custom(EKKOFont.regular, size: 36))
                    .lineLimit(2)
                    .minimumScaleFactor(0.7)
                    .foregroundStyle(.primary)

                if isAdmin {
                    gmBadge
                } else if connectTier == .INFINITE {
                    Image(systemName: "infinity")
                        .font(.callout.weight(.semibold))
                        .foregroundStyle(EKKOTheme.primary)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(EKKOTheme.primary.opacity(0.12))
                        .clipShape(Capsule())
                }
            }

            if let headline, !headline.isEmpty {
                Text(headline)
                    .font(.custom(EKKOFont.regular, size: 17))
                    .foregroundStyle(.secondary)
            }

            if let location, !location.isEmpty {
                Label(location, systemImage: "mappin")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }

    // MARK: - GM Badge

    private var gmBadge: some View {
        Text("GM")
            .font(.caption.bold())
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(
                LinearGradient(
                    colors: [EKKOTheme.primary, .purple],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(Capsule())
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 0) {
            heroStat("\(likesReceivedCount)", "Likes",   jp: JPLabels.stats.likes)
            divider
            heroStat("\(matchesCount)",       "Matches", jp: JPLabels.stats.matches)
            divider
            heroStat("\(mediaSlots.count)",   "Media",   jp: JPLabels.stats.media)
            divider
            heroStat("\(prompts.count)",      "Prompts", jp: JPLabels.stats.prompts)
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 20)
        .overlay(Rectangle().fill(Color.secondary.opacity(0.18)).frame(height: 0.5), alignment: .top)
        .overlay(Rectangle().fill(Color.secondary.opacity(0.18)).frame(height: 0.5), alignment: .bottom)
    }

    private func heroStat(_ value: String, _ label: String, jp: String) -> some View {
        VStack(spacing: 2) {
            JPSubLabel(text: jp, size: 8)
            Text(value)
                .font(.custom(EKKOFont.regular, size: 22))
                .foregroundStyle(.primary)
            Text(label.uppercased())
                .font(.custom(EKKOFont.regular, size: 9))
                .tracking(1.8)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.secondary.opacity(0.18))
            .frame(width: 0.5, height: 28)
    }

    // MARK: - Work Rail

    private var workRail: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("WORK / \(railSlots.count)")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(Array(railSlots.enumerated()), id: \.offset) { _, slot in
                        railCard(slot: slot)
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }

    private func railCard(slot: MediaSlot) -> some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if slot.isAudio {
                    CoverAudioPlayerView(urlString: slot.url, controlSize: 36)
                } else if slot.isModel {
                    ModelViewerView(urlString: slot.url)
                } else if slot.isVideo {
                    CoverVideoPlayerView(urlString: slot.url)
                } else if let url = URL(string: slot.url) {
                    KFImage(url).resizable().scaledToFill()
                }
            }
            .frame(width: 180, height: 220)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
            )

            Text(mediaTypeLabel(for: slot))
                .font(.custom(EKKOFont.regular, size: 10))
                .tracking(1.5)
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(.black.opacity(0.55))
                .clipShape(Capsule())
                .padding(10)
        }
        .frame(width: 180)
    }

    private func mediaTypeLabel(for slot: MediaSlot) -> String {
        if slot.isAudio { return "AUDIO" }
        if slot.isModel { return "3D" }
        if slot.isVideo { return "VIDEO" }
        return "PHOTO"
    }

    // MARK: - Prompts

    private var promptsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("◉ PROMPTS")
            VStack(spacing: 10) {
                ForEach(Array(prompts.enumerated()), id: \.offset) { _, prompt in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(prompt.question)
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.secondary)
                        Text(prompt.answer)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.primary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .glassCard()
                }
            }
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Looking For

    private func lookingForSection(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("◉ LOOKING FOR")
            Text(text)
                .archesStyle(.body)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .glassCard()
                .padding(.horizontal, 20)
        }
    }

    // MARK: - Socials

    private var socialsSection: some View {
        let hasAny = (instagramHandle?.isEmpty == false) ||
                     (twitterHandle?.isEmpty == false) ||
                     (websiteUrl?.isEmpty == false)

        return Group {
            if hasAny {
                VStack(alignment: .leading, spacing: 12) {
                    sectionHeader("⌁ ELSEWHERE")
                    VStack(spacing: 12) {
                        if let ig = instagramHandle, !ig.isEmpty {
                            InstagramPreview(handle: ig)
                        }
                        if let tw = twitterHandle, !tw.isEmpty {
                            TwitterPreview(handle: tw)
                        }
                        if let web = websiteUrl, !web.isEmpty {
                            websiteRow(url: web)
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }

    @ViewBuilder
    private func websiteRow(url: String) -> some View {
        Button {
            let urlStr = url.hasPrefix("http") ? url : "https://\(url)"
            if let u = URL(string: urlStr) { UIApplication.shared.open(u) }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "globe")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                Text(cleanDisplayURL(url))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
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
        url.replacingOccurrences(of: "https://", with: "")
           .replacingOccurrences(of: "http://", with: "")
           .replacingOccurrences(of: "www.", with: "")
           .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }

    // MARK: - Section Header

    private func sectionHeader(_ label: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(label)
                .font(.custom(EKKOFont.regular, size: 11))
                .tracking(2.5)
                .foregroundStyle(EKKOTheme.primary)
            Rectangle()
                .fill(Color.secondary.opacity(0.2))
                .frame(height: 0.5)
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Helpers

    /// Best-effort handle string for the top mono label.
    private var handleString: String {
        if let h = headline, !h.isEmpty { return h }
        return displayName.lowercased().replacingOccurrences(of: " ", with: "")
    }
}

// MARK: - Cover-fill video player
//
// Like the existing VideoPlayerView (autoplay, muted, looped) but uses
// `.resizeAspectFill` so the video fills the parent frame instead of
// letterboxing. Used for the Hero cover and rail cards which have fixed
// frames.

struct CoverVideoPlayerView: View {
    let urlString: String
    @State private var player: AVPlayer?
    @State private var loopObserver: NSObjectProtocol?

    var body: some View {
        CoverVideoPlayerRepresentable(player: player)
            .onAppear { setupAndPlay() }
            .onDisappear {
                player?.pause()
                if let loopObserver {
                    NotificationCenter.default.removeObserver(loopObserver)
                    self.loopObserver = nil
                }
            }
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
        avPlayer.actionAtItemEnd = .none
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

private struct CoverVideoPlayerRepresentable: UIViewRepresentable {
    let player: AVPlayer?

    func makeUIView(context: Context) -> CoverPlayerUIView { CoverPlayerUIView() }
    func updateUIView(_ uiView: CoverPlayerUIView, context: Context) {
        uiView.playerLayer.player = player
    }

    final class CoverPlayerUIView: UIView {
        let playerLayer = AVPlayerLayer()

        override init(frame: CGRect) {
            super.init(frame: frame)
            playerLayer.videoGravity = .resizeAspectFill
            layer.addSublayer(playerLayer)
        }

        required init?(coder: NSCoder) { fatalError() }

        override func layoutSubviews() {
            super.layoutSubviews()
            playerLayer.frame = bounds
        }
    }
}

// MARK: - Cover-fill audio player
//
// Audio can't sensibly autoplay (would compete with system audio), so this is
// a tap-to-play overlay with a centered play/pause control. Loops on end,
// pauses on disappear, fills the cover with a tinted gradient + waveform
// glyph behind the control.

struct CoverAudioPlayerView: View {
    let urlString: String
    /// Diameter of the play/pause glyph (smaller for rail cards).
    var controlSize: CGFloat = 64

    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var loopObserver: NSObjectProtocol?

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [.purple.opacity(0.55), .pink.opacity(0.4), .blue.opacity(0.25)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Soft waveform glyph behind the play control.
            Image(systemName: "waveform")
                .font(.system(size: controlSize * 1.4, weight: .light))
                .foregroundStyle(.white.opacity(0.18))
                .offset(y: -controlSize * 0.25)

            Button(action: togglePlayback) {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: controlSize, weight: .regular))
                    .foregroundStyle(.white)
                    .shadow(color: .black.opacity(0.35), radius: 8, y: 2)
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
        }
        .onDisappear {
            player?.pause()
            isPlaying = false
            if let loopObserver {
                NotificationCenter.default.removeObserver(loopObserver)
                self.loopObserver = nil
            }
        }
    }

    private func togglePlayback() {
        if player == nil, let url = URL(string: urlString) {
            let item = AVPlayerItem(url: url)
            let p = AVPlayer(playerItem: item)
            player = p
            loopObserver = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemDidPlayToEndTime,
                object: item,
                queue: .main
            ) { [weak p] _ in
                p?.seek(to: .zero)
                p?.play()
            }
        }
        if isPlaying {
            player?.pause()
        } else {
            player?.play()
        }
        isPlaying.toggle()
    }
}
