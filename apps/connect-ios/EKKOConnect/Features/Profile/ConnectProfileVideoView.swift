import SwiftUI
import Kingfisher

/// Video variant of the Connect profile (template = "VIDEO").
/// Cinemascope 2.39:1 featured player + horizontal reel carousel.
/// Mirrors Variant 8 from the design handoff.
///
/// HUD overlays (REC indicator, aspect tag, synthetic timecode) wrap the
/// featured player. Connect doesn't store real video duration/frame-rate
/// metadata so the timecode/scrubber are aesthetic — they show what we
/// can derive (slot index, kind, custom title).
///
/// Falls back to all media when the user has no video-typed slots so
/// photo-only creatives still see something coherent.
struct ConnectProfileVideoView: View {
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

    @State private var selectedIndex: Int = 0
    @State private var presentedMedia: PresentedMedia?

    /// Video-type slots if the user has any, else fall back to all media.
    private var reel: [MediaSlot] {
        let sorted = mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        let videoOnly = sorted.filter { $0.isVideo }
        return videoOnly.isEmpty ? sorted : videoOnly
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            compactHeader
            cinemascopePlayer
            scrubber
            reelCarousel
            statsRow
            bioBlock
            promptsBlock
            lookingForBlock
            socialsBlock
            Spacer(minLength: 32)
        }
        .fullScreenCover(item: $presentedMedia) { presented in
            MediaFullScreenViewer(slot: presented.slot, displayTitle: presented.displayTitle)
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
                                .foregroundStyle(Color.accentColor)
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
                    colors: [Color.accentColor, .purple],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(Capsule())
    }

    // MARK: - Cinemascope player (2.39:1)

    private var cinemascopePlayer: some View {
        Group {
            if reel.isEmpty {
                EditableSection(action: editActions?.onTapMedia) {
                    emptyPlayerPlaceholder
                }
                .padding(.horizontal, 16)
            } else {
                let safeIndex = min(selectedIndex, reel.count - 1)
                let cur = reel[safeIndex]

                Rectangle()
                    .fill(Color.black)
                    .aspectRatio(2.39 / 1.0, contentMode: .fit)
                    .overlay {
                        playerContent(slot: cur)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 4, style: .continuous)
                            .stroke(Color.white.opacity(0.12), lineWidth: 0.5)
                    )
                    .overlay(alignment: .top) {
                        topHUD(slot: cur, index: safeIndex)
                    }
                    .overlay(alignment: .bottom) {
                        bottomHUD(slot: cur, index: safeIndex)
                    }
                    .contentShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                    .onTapGesture {
                        let title = cur.title ?? "shot \(safeIndex + 1)"
                        presentedMedia = PresentedMedia(slot: cur, displayTitle: title)
                    }
                    .padding(.horizontal, 16)
            }
        }
    }

    @ViewBuilder
    private func playerContent(slot: MediaSlot) -> some View {
        if slot.isAudio {
            CoverAudioPlayerView(urlString: slot.url, coverUrl: slot.coverUrl, controlSize: 56)
        } else if slot.isModel {
            ModelViewerView(urlString: slot.url)
        } else if slot.isVideo {
            CoverVideoPlayerView(urlString: slot.url)
        } else if let url = URL(string: slot.url) {
            KFImage(url).resizable().scaledToFill()
        }
    }

    private func topHUD(slot: MediaSlot, index: Int) -> some View {
        HStack(spacing: 8) {
            // REC indicator
            HStack(spacing: 4) {
                Circle()
                    .fill(.red)
                    .frame(width: 6, height: 6)
                Text("REC")
            }
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(.black.opacity(0.55), in: Capsule())

            Text("2.39:1")
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(.black.opacity(0.55), in: Capsule())

            Spacer()

            Text("TC \(syntheticTimecode(for: slot, index: index))")
                .padding(.horizontal, 6)
                .padding(.vertical, 3)
                .background(.black.opacity(0.55), in: Capsule())
        }
        .font(.custom(mono, size: 9))
        .tracking(1.0)
        .foregroundStyle(.white.opacity(0.85))
        .padding(.horizontal, 10)
        .padding(.top, 10)
        .allowsHitTesting(false)
    }

    private func bottomHUD(slot: MediaSlot, index: Int) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("CLIP \(String(format: "%02d", index + 1)) / \(String(format: "%02d", reel.count))")
                Spacer()
                Text(slotKindLabel(slot))
                Spacer()
                Text("№ \(String(format: "%02d", slot.sortOrder + 1))")
            }
            .font(.custom(mono, size: 9))
            .tracking(1.0)
            .foregroundStyle(.white.opacity(0.85))
            .allowsHitTesting(false)

            captionRow(slot: slot, index: index)
        }
        .padding(.horizontal, 12)
        .padding(.top, 18)
        .padding(.bottom, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [.clear, .black.opacity(0.85)],
                startPoint: .top, endPoint: .bottom
            )
            .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
            .allowsHitTesting(false)
        )
    }

    @ViewBuilder
    private func captionRow(slot: MediaSlot, index: Int) -> some View {
        let display = slot.title ?? "shot \(index + 1)"
        let textColor: Color = slot.title?.isEmpty == false ? .white : .white.opacity(0.75)

        if let onEditTitle = editActions?.onEditMediaTitle {
            Button {
                onEditTitle(storageIndex(for: slot))
            } label: {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(display)
                        .font(.custom(EKKOFont.regular, size: 17))
                        .foregroundStyle(textColor)
                        .lineLimit(1)
                    Spacer(minLength: 0)
                    Image(systemName: "pencil")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(5)
                        .background(Circle().fill(Color.accentColor))
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        } else {
            Text(display)
                .font(.custom(EKKOFont.regular, size: 17))
                .foregroundStyle(.white)
                .lineLimit(1)
                .allowsHitTesting(false)
        }
    }

    private var emptyPlayerPlaceholder: some View {
        VStack(spacing: 10) {
            Image(systemName: "play.rectangle")
                .font(.system(size: 36))
                .foregroundStyle(Color.accentColor)
            Text("Add videos to fill the reel")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .aspectRatio(2.39 / 1.0, contentMode: .fit)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 4))
        .overlay(
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color.secondary.opacity(0.3), lineWidth: 0.5)
        )
    }

    // MARK: - Scrubber (visual only)

    private var scrubber: some View {
        Group {
            if !reel.isEmpty {
                VStack(spacing: 6) {
                    GeometryReader { geo in
                        let safeIndex = min(selectedIndex, reel.count - 1)
                        let progress = reel.count > 1
                            ? CGFloat(safeIndex) / CGFloat(reel.count - 1)
                            : 0
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.secondary.opacity(0.18))
                                .frame(height: 2)
                            Capsule()
                                .fill(Color.accentColor)
                                .frame(width: max(2, geo.size.width * progress), height: 2)
                            Circle()
                                .fill(Color.accentColor)
                                .frame(width: 8, height: 8)
                                .offset(x: max(0, geo.size.width * progress - 4))
                                .animation(.spring(response: 0.3, dampingFraction: 0.85), value: selectedIndex)
                        }
                        .frame(maxHeight: .infinity, alignment: .center)
                    }
                    .frame(height: 14)
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
            }
        }
    }

    // MARK: - Reel carousel (horizontal)

    @ViewBuilder
    private var reelCarousel: some View {
        if !reel.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    sectionLabel("REEL")
                    Spacer()
                    Text("\(String(format: "%02d", reel.count)) clips")
                        .font(.custom(mono, size: 9))
                        .tracking(1.5)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal, 16)

                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(reel.enumerated()), id: \.offset) { i, slot in
                            reelCell(slot: slot, index: i, isSelected: i == selectedIndex)
                        }
                    }
                    .padding(.horizontal, 16)
                }
            }
            .padding(.top, 18)
        }
    }

    private func reelCell(slot: MediaSlot, index: Int, isSelected: Bool) -> some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                selectedIndex = index
            }
        } label: {
            VStack(alignment: .leading, spacing: 4) {
                Rectangle()
                    .fill(Color.black)
                    .aspectRatio(16.0 / 9.0, contentMode: .fit)
                    .overlay {
                        playerContent(slot: slot)
                    }
                    .frame(width: 140)
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 4, style: .continuous)
                            .stroke(isSelected ? Color.accentColor : Color.white.opacity(0.1), lineWidth: isSelected ? 2 : 0.5)
                    )
                    .overlay(alignment: .topLeading) {
                        Text(String(format: "%02d", index + 1))
                            .font(.custom(mono, size: 9))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 2)
                            .background(.black.opacity(0.55), in: Capsule())
                            .padding(6)
                    }

                Text(slot.title ?? "shot \(index + 1)")
                    .font(.caption)
                    .foregroundStyle(slot.title != nil ? .primary : .secondary)
                    .lineLimit(1)
                    .frame(width: 140, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Stats

    private var statsRow: some View {
        HStack(spacing: 0) {
            statCell(value: "\(likesReceivedCount)", label: "LIKES")
            divider
            statCell(value: "\(matchesCount)", label: "MATCHES")
            divider
            statCell(value: "\(reel.count)", label: "CLIPS")
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

    // MARK: - Helpers

    private func sectionLabel(_ text: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(text)
                .font(.custom(mono, size: 11))
                .tracking(2.5)
                .foregroundStyle(Color.accentColor)
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
                .foregroundStyle(Color.accentColor)
        }
    }

    private func slotKindLabel(_ slot: MediaSlot) -> String {
        if slot.isAudio { return "AUDIO" }
        if slot.isModel { return "3D" }
        if slot.isVideo { return "VIDEO" }
        return "PHOTO"
    }

    /// Synthetic timecode (HH:MM:SS:FF) derived from sortOrder so each
    /// slot gets a stable, plausible-looking value. Connect doesn't store
    /// real video duration — this is HUD garnish.
    private func syntheticTimecode(for slot: MediaSlot, index: Int) -> String {
        let total = (slot.sortOrder * 137 + index * 53) % 7200
        let mins = total / 60
        let secs = total % 60
        let frames = (slot.sortOrder * 7 + index * 3) % 24
        return String(format: "00:%02d:%02d:%02d", mins, secs, frames)
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
