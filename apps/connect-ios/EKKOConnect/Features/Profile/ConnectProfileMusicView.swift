import SwiftUI
import AVFoundation
import Kingfisher

/// Music variant of the Connect profile (template = "MUSIC").
/// Now-playing card with animated waveform + transport, plus a release
/// list with mini waveform per row. Mirrors Variant 7 from the design
/// handoff using EKKOTheme + Arches font.
///
/// "Tracks" come from audio MediaSlots. BPM / KEY / LENGTH are synthetic
/// (Connect doesn't store music metadata) — derived deterministically
/// from `sortOrder` so each slot gets a stable plausible-looking value.
/// Falls back to all media when the user has no audio slots so non-music
/// creatives still see something coherent.
struct ConnectProfileMusicView: View {
    let displayName: String
    var avatarUrl: String?
    var username: String?
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
    var editActions: ProfileEditActions? = nil

    private let mono = "Menlo"

    @State private var playingIndex: Int = 0
    @State private var isPlaying: Bool = false
    @StateObject private var player = MusicPlayerController()

    /// Audio MediaSlots if any, else fall back to all media.
    private var tracks: [MediaSlot] {
        let sorted = mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        let audioOnly = sorted.filter { $0.isAudio }
        return audioOnly.isEmpty ? sorted : audioOnly
    }

    private var safePlayingIndex: Int {
        tracks.indices.contains(playingIndex) ? playingIndex : 0
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            compactHeader
            nowPlayingCard
            trackList
            statsRow
            bioBlock
            promptsBlock
            lookingForBlock
            socialsBlock
            Spacer(minLength: 32)
        }
        .onChange(of: playingIndex) { _, newValue in
            // Switch the underlying player to the new track and resume
            // playback if a track was previously playing.
            if let url = tracks.indices.contains(newValue) ? URL(string: tracks[newValue].url) : nil {
                player.load(url: url, autoplay: isPlaying)
            }
        }
        .onDisappear {
            player.pause()
            isPlaying = false
        }
    }

    // MARK: - Header

    private var compactHeader: some View {
        EditableSection(action: editActions?.onTapHeadlineLocation) {
            HStack(alignment: .center, spacing: 14) {
                AvatarView(url: avatarUrl, name: displayName, size: 60)
                    .overlay(Circle().stroke(.secondary.opacity(0.3), lineWidth: 0.5))

                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(displayName)
                            .font(.custom(EKKOFont.regular, size: 24))
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                            .foregroundStyle(.primary)
                        if isAdmin {
                            gmBadge
                        } else if connectTier == .INFINITE {
                            Image(systemName: "infinity")
                                .font(.callout.weight(.semibold))
                                .foregroundStyle(EKKOTheme.primary)
                        }
                    }

                    HStack(spacing: 4) {
                        if let headline, !headline.isEmpty {
                            Text(headline).foregroundStyle(.secondary)
                        }
                        if let headline, !headline.isEmpty,
                           let location, !location.isEmpty {
                            Text("·").foregroundStyle(.secondary)
                        }
                        if let location, !location.isEmpty {
                            Text(location).foregroundStyle(.secondary)
                        }
                    }
                    .font(.caption)
                    .lineLimit(1)
                }
                Spacer()
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 6)
        .padding(.bottom, 16)
    }

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

    // MARK: - Now playing card

    @ViewBuilder
    private var nowPlayingCard: some View {
        if tracks.isEmpty {
            EditableSection(action: editActions?.onTapMedia) {
                emptyTracksPlaceholder
            }
            .padding(.horizontal, 16)
        } else {
            let cur = tracks[safePlayingIndex]
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .center, spacing: 14) {
                    trackThumb(slot: cur, size: 84)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("♫ NOW PLAYING")
                            .font(.custom(mono, size: 9))
                            .tracking(2.0)
                            .foregroundStyle(EKKOTheme.primary)

                        // Editable title — tap-to-edit pencil affordance in
                        // edit mode, plain text in display.
                        captionRow(slot: cur)

                        metaLineView(for: cur)
                    }
                    Spacer(minLength: 0)
                }

                AudioVisualizerBars(isPlaying: isPlaying, accent: EKKOTheme.primary)
                    .frame(height: 44)

                HStack {
                    Text(timeElapsed(for: cur))
                    Spacer()
                    Text("-\(syntheticLength(for: cur))")
                }
                .font(.custom(mono, size: 9))
                .tracking(0.8)
                .foregroundStyle(.secondary)

                transportControls
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(EKKOTheme.primary.opacity(0.08))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(Color.secondary.opacity(0.2), lineWidth: 0.5)
                    )
            )
            .padding(.horizontal, 16)
        }
    }

    private func trackThumb(slot: MediaSlot, size: CGFloat) -> some View {
        ZStack {
            if let coverStr = slot.coverUrl, let coverURL = URL(string: coverStr) {
                KFImage(coverURL)
                    .resizable()
                    .scaledToFill()
            } else {
                LinearGradient(
                    colors: [.purple.opacity(0.6), .pink.opacity(0.4), .blue.opacity(0.25)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Image(systemName: "waveform")
                    .font(.system(size: size * 0.4))
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(Color.white.opacity(0.12), lineWidth: 0.5)
        )
    }

    /// Compact 36pt thumbnail used to the left of each track-list row.
    /// Mirrors `trackThumb` but smaller — shows real cover art when set,
    /// otherwise the gradient + small waveform glyph.
    private func rowThumb(slot: MediaSlot) -> some View {
        ZStack {
            if let coverStr = slot.coverUrl, let coverURL = URL(string: coverStr) {
                KFImage(coverURL)
                    .resizable()
                    .scaledToFill()
            } else {
                LinearGradient(
                    colors: [.purple.opacity(0.5), .pink.opacity(0.35), .blue.opacity(0.2)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Image(systemName: "waveform")
                    .font(.system(size: 14))
                    .foregroundStyle(.white.opacity(0.8))
            }
        }
        .frame(width: 36, height: 36)
        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
        )
    }

    @ViewBuilder
    private func captionRow(slot: MediaSlot) -> some View {
        let display = slot.title ?? "track \(safePlayingIndex + 1)"
        let textColor: Color = slot.title?.isEmpty == false ? .primary : .secondary

        if let onEditTitle = editActions?.onEditMediaTitle {
            Button {
                onEditTitle(storageIndex(for: slot))
            } label: {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    Text(display)
                        .font(.custom(EKKOFont.regular, size: 22))
                        .foregroundStyle(textColor)
                        .lineLimit(1)
                    Image(systemName: "pencil")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(4)
                        .background(Circle().fill(EKKOTheme.primary))
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        } else {
            Text(display)
                .font(.custom(EKKOFont.regular, size: 22))
                .foregroundStyle(.primary)
                .lineLimit(1)
        }
    }

    private var transportControls: some View {
        HStack(spacing: 24) {
            Button {
                advance(-1)
            } label: {
                Image(systemName: "backward.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(width: 40, height: 40)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .buttonStyle(.plain)

            Button {
                togglePlayback()
            } label: {
                Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.black)
                    .frame(width: 52, height: 52)
                    .background(EKKOTheme.primary, in: Circle())
            }
            .buttonStyle(.plain)

            Button {
                advance(+1)
            } label: {
                Image(systemName: "forward.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(width: 40, height: 40)
                    .background(.ultraThinMaterial, in: Circle())
            }
            .buttonStyle(.plain)
        }
        .frame(maxWidth: .infinity)
    }

    private var emptyTracksPlaceholder: some View {
        VStack(spacing: 12) {
            Image(systemName: "music.note.list")
                .font(.system(size: 36))
                .foregroundStyle(EKKOTheme.primary)
            Text("Add audio to start your release feed")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(36)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 18))
    }

    // MARK: - Track list

    @ViewBuilder
    private var trackList: some View {
        if !tracks.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                sectionLabel("RELEASES / \(tracks.count)")

                VStack(spacing: 2) {
                    ForEach(Array(tracks.enumerated()), id: \.offset) { i, slot in
                        trackRow(slot: slot, index: i)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 22)
        }
    }

    private func trackRow(slot: MediaSlot, index: Int) -> some View {
        let isCurrent = index == safePlayingIndex
        return Button {
            if index == playingIndex {
                togglePlayback()
            } else {
                playingIndex = index
                if !isPlaying {
                    isPlaying = true
                    if let url = URL(string: slot.url) {
                        player.load(url: url, autoplay: true)
                    }
                }
            }
        } label: {
            HStack(alignment: .center, spacing: 10) {
                Text(isCurrent && isPlaying ? "▶" : String(format: "%02d", index + 1))
                    .font(.custom(mono, size: 11))
                    .foregroundStyle(isCurrent ? EKKOTheme.primary : .secondary)
                    .frame(width: 22, alignment: .leading)

                rowThumb(slot: slot)

                VStack(alignment: .leading, spacing: 2) {
                    Text(slot.title ?? "track \(index + 1)")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(slot.title != nil ? .primary : .secondary)
                        .lineLimit(1)
                    Text(metaLineText(for: slot))
                        .font(.custom(mono, size: 9))
                        .tracking(1.0)
                        .foregroundStyle(.secondary)
                }

                Spacer(minLength: 8)

                MiniWaveform(seed: slot.sortOrder, accent: isCurrent ? EKKOTheme.primary : .secondary.opacity(0.45))
                    .frame(width: 56, height: 18)

                Text(syntheticLength(for: slot))
                    .font(.custom(mono, size: 10))
                    .foregroundStyle(.secondary)
                    .frame(width: 44, alignment: .trailing)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(isCurrent ? EKKOTheme.primary.opacity(0.08) : Color.clear)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .stroke(isCurrent ? EKKOTheme.primary.opacity(0.25) : Color.clear, lineWidth: 0.5)
                    )
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    // MARK: - Stats

    private var statsRow: some View {
        HStack(spacing: 0) {
            statCell(value: "\(likesReceivedCount)", label: "LIKES")
            divider
            statCell(value: "\(tracks.count)", label: "TRACKS")
            divider
            statCell(value: "\(matchesCount)", label: "MATCHES")
            divider
            statCell(value: "\(prompts.count)", label: "PROMPTS")
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .overlay(Rectangle().fill(Color.secondary.opacity(0.18)).frame(height: 0.5), alignment: .top)
        .overlay(Rectangle().fill(Color.secondary.opacity(0.18)).frame(height: 0.5), alignment: .bottom)
    }

    private func statCell(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.custom(EKKOFont.regular, size: 22))
                .foregroundStyle(.primary)
            Text(label)
                .font(.custom(mono, size: 9))
                .tracking(1.5)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.secondary.opacity(0.18))
            .frame(width: 0.5, height: 28)
    }

    // MARK: - Bio / Prompts / Looking For / Socials

    @ViewBuilder
    private var bioBlock: some View {
        if let bio, !bio.isEmpty {
            EditableSection(action: editActions?.onTapBio) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("ABOUT")
                    Text(bio)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapBio) {
                placeholderRow(label: "About", hint: "Add a short bio")
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    @ViewBuilder
    private var promptsBlock: some View {
        if !prompts.isEmpty {
            EditableSection(action: editActions?.onTapPrompts) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("◉ PROMPTS")
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
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    @ViewBuilder
    private var lookingForBlock: some View {
        if let lookingFor, !lookingFor.isEmpty {
            EditableSection(action: editActions?.onTapLookingFor) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("◉ LOOKING FOR")
                    Text(lookingFor)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .glassCard()
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapLookingFor) {
                placeholderRow(label: "Looking for", hint: "Add what you're looking for")
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    @ViewBuilder
    private var socialsBlock: some View {
        let hasAny = (instagramHandle?.isEmpty == false) ||
                     (twitterHandle?.isEmpty == false) ||
                     (websiteUrl?.isEmpty == false)

        if hasAny || editActions != nil {
            VStack(alignment: .leading, spacing: 12) {
                EditableSection(action: editActions?.onTapSocials) {
                    sectionLabel("⌁ ELSEWHERE")
                }

                if hasAny {
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
                } else {
                    EditableSection(action: editActions?.onTapSocials) {
                        placeholderRow(label: "Socials", hint: "Add Instagram, X, or website")
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.top, 22)
        }
    }

    private func websiteRow(url: String) -> some View {
        Button {
            let str = url.hasPrefix("http") ? url : "https://\(url)"
            if let u = URL(string: str) { UIApplication.shared.open(u) }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "globe").foregroundStyle(.secondary)
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

    // MARK: - Playback control

    private func togglePlayback() {
        guard !tracks.isEmpty else { return }
        let cur = tracks[safePlayingIndex]
        if isPlaying {
            player.pause()
            isPlaying = false
        } else {
            if let url = URL(string: cur.url) {
                player.load(url: url, autoplay: true)
            }
            isPlaying = true
        }
    }

    private func advance(_ delta: Int) {
        guard !tracks.isEmpty else { return }
        let next = (safePlayingIndex + delta + tracks.count) % tracks.count
        playingIndex = next
        // The .onChange binding above swaps the player and resumes if needed.
    }

    // MARK: - Track metadata (real or fallback)
    //
    // BPM and KEY are user-entered on the MediaSlot. Length is still
    // synthesized — Connect doesn't read AVAsset duration yet. When
    // bpm/key aren't set we show "—" as the explicit placeholder so the
    // empty state is honest and clearly tappable in edit mode.

    /// Inline metadata line for the now-playing card. Tappable in edit
    /// mode to open the BPM + KEY editor, plain text otherwise.
    @ViewBuilder
    private func metaLineView(for slot: MediaSlot) -> some View {
        let text = metaLineText(for: slot)
        if let onEditMeta = editActions?.onEditAudioMeta {
            Button {
                onEditMeta(storageIndex(for: slot))
            } label: {
                HStack(spacing: 6) {
                    Text(text)
                        .font(.custom(mono, size: 10))
                        .tracking(1.2)
                        .foregroundStyle(.secondary)
                    Image(systemName: "pencil")
                        .font(.system(size: 8, weight: .semibold))
                        .foregroundStyle(.white)
                        .padding(3)
                        .background(Circle().fill(EKKOTheme.primary))
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        } else {
            Text(text)
                .font(.custom(mono, size: 10))
                .tracking(1.2)
                .foregroundStyle(.secondary)
        }
    }

    private func metaLineText(for slot: MediaSlot) -> String {
        let bpm = slot.bpm.map { "\($0)" } ?? "—"
        let key = slot.key?.isEmpty == false ? slot.key! : "—"
        return "\(bpm) BPM  ·  KEY \(key)  ·  \(syntheticLength(for: slot))"
    }

    private func syntheticLength(for slot: MediaSlot) -> String {
        let secs = 90 + (slot.sortOrder * 67 + 41) % 240 // 1:30–5:30
        return String(format: "%d:%02d", secs / 60, secs % 60)
    }

    private func timeElapsed(for slot: MediaSlot) -> String {
        let secs = (slot.sortOrder * 31 + 17) % 90
        return String(format: "%d:%02d", secs / 60, secs % 60)
    }

    // MARK: - Helpers

    private func sectionLabel(_ text: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(text)
                .font(.custom(mono, size: 11))
                .tracking(2.5)
                .foregroundStyle(EKKOTheme.primary)
            Rectangle()
                .fill(Color.secondary.opacity(0.2))
                .frame(height: 0.5)
        }
    }

    private func placeholderRow(label: String, hint: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Text(hint)
                    .font(.subheadline)
                    .foregroundStyle(.secondary.opacity(0.7))
            }
            Spacer()
            Image(systemName: "plus.circle")
                .foregroundStyle(EKKOTheme.primary)
        }
    }

    private func storageIndex(for slot: MediaSlot) -> Int {
        let sorted = mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        return sorted.firstIndex(where: {
            $0.url == slot.url && $0.sortOrder == slot.sortOrder
        }) ?? 0
    }

    private func cleanDisplayURL(_ url: String) -> String {
        url.replacingOccurrences(of: "https://", with: "")
           .replacingOccurrences(of: "http://", with: "")
           .replacingOccurrences(of: "www.", with: "")
           .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }
}

// MARK: - Music player controller
//
// Single AVPlayer driven by the view. Handles loading a new URL when the
// user switches tracks, looping on end, and pausing on dispose.

final class MusicPlayerController: ObservableObject {
    private var player: AVPlayer?
    private var loopObserver: NSObjectProtocol?
    private var currentURL: URL?

    func load(url: URL, autoplay: Bool) {
        if currentURL == url, let player {
            if autoplay { player.play() } else { player.pause() }
            return
        }

        // Tear down previous player.
        player?.pause()
        if let loopObserver {
            NotificationCenter.default.removeObserver(loopObserver)
            self.loopObserver = nil
        }

        let item = AVPlayerItem(url: url)
        let p = AVPlayer(playerItem: item)
        loopObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak p] _ in
            p?.seek(to: .zero)
            p?.play()
        }
        player = p
        currentURL = url
        if autoplay { p.play() }
    }

    func pause() {
        player?.pause()
    }
}

// MARK: - Audio visualizer (now-playing card)
//
// Same synthetic sine pattern as the fullscreen audio viewer's bars,
// but tuned for a shorter rectangle. Settles to the baseline when paused.

private struct AudioVisualizerBars: View {
    let isPlaying: Bool
    let accent: Color

    private let barCount = 52
    private let baseHeight: CGFloat = 4
    private let maxAdd: CGFloat = 36

    @State private var phase: Double = 0

    private let timer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()

    var body: some View {
        GeometryReader { geo in
            let totalGap: CGFloat = CGFloat(barCount - 1) * 2
            let barWidth = max(1.5, (geo.size.width - totalGap) / CGFloat(barCount))

            HStack(alignment: .center, spacing: 2) {
                ForEach(0..<barCount, id: \.self) { i in
                    Capsule(style: .continuous)
                        .fill(accent.opacity(i < activeBars ? 1.0 : 0.3))
                        .frame(width: barWidth, height: barHeight(for: i))
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .onReceive(timer) { _ in
            if isPlaying {
                withAnimation(.easeInOut(duration: 0.06)) { phase += 0.22 }
            } else if phase != 0 {
                withAnimation(.easeOut(duration: 0.4)) { phase = 0 }
            }
        }
    }

    /// Tinted-active count grows over time when playing; settles when paused.
    private var activeBars: Int {
        let target = isPlaying ? barCount / 2 + Int(sin(phase) * Double(barCount / 6)) : 0
        return max(0, min(barCount, target))
    }

    private func barHeight(for index: Int) -> CGFloat {
        let position = Double(index) / Double(barCount)
        let wave1 = sin(phase + position * 6.28)
        let wave2 = sin(phase * 1.4 + position * 12)
        let wave3 = sin(phase * 0.7 + position * 4)
        let combined = (wave1 + wave2 * 0.6 + wave3 * 0.8) / 2.4
        let normalized = (combined + 1) / 2
        let active = baseHeight + CGFloat(normalized) * maxAdd
        return isPlaying ? active : baseHeight
    }
}

// MARK: - Mini waveform (track list rows)
//
// Static deterministic bars per slot so each row gets a unique-looking
// silhouette without animating in a list (would be expensive and noisy).

private struct MiniWaveform: View {
    let seed: Int
    let accent: Color

    private let barCount = 14

    var body: some View {
        GeometryReader { geo in
            let totalGap: CGFloat = CGFloat(barCount - 1) * 1.5
            let barWidth = max(1.5, (geo.size.width - totalGap) / CGFloat(barCount))

            HStack(alignment: .center, spacing: 1.5) {
                ForEach(0..<barCount, id: \.self) { i in
                    Capsule()
                        .fill(accent)
                        .frame(width: barWidth, height: height(for: i))
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    private func height(for index: Int) -> CGFloat {
        let s = Double(seed)
        let v = abs(sin(Double(index) * 0.9 + s)) * 14 + 3
        return CGFloat(v)
    }
}
