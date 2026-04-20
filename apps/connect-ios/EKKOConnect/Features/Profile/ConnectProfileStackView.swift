import SwiftUI
import Kingfisher

/// Stack variant of the Connect profile (template = "STACK").
/// Compact header → bio → swipeable 3-card deck of media → prev/Open/next
/// controls → stats → prompts → looking-for → socials. Mirrors Variant 4
/// from the design handoff using EKKOTheme + Arches font + glass primitives.
struct ConnectProfileStackView: View {
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
    var editActions: ProfileEditActions? = nil

    private let mono = "Menlo"
    private let avatarSize: CGFloat = 64
    private let cardHeight: CGFloat = 380

    @State private var deckIndex: Int = 0
    @State private var dragOffset: CGSize = .zero
    @State private var presentedMedia: PresentedMedia?

    private var sortedMedia: [MediaSlot] {
        mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            compactHeader
            aboutBlock
            cardDeck
            statsRow
            promptsBlock
            lookingForBlock
            socialsBlock
            Spacer(minLength: 32)
        }
        .fullScreenCover(item: $presentedMedia) { presented in
            MediaFullScreenViewer(slot: presented.slot, displayTitle: presented.displayTitle)
        }
    }

    // MARK: - Compact header

    private var compactHeader: some View {
        EditableSection(action: editActions?.onTapHeadlineLocation) {
            HStack(alignment: .center, spacing: 14) {
                AvatarView(url: avatarUrl, name: displayName, size: avatarSize)
                    .overlay(Circle().stroke(.secondary.opacity(0.3), lineWidth: 0.5))

                VStack(alignment: .leading, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(displayName)
                            .font(.custom(EKKOFont.regular, size: 28))
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
        .padding(.top, 8)
        .padding(.bottom, 18)
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

    // MARK: - About

    @ViewBuilder
    private var aboutBlock: some View {
        if let bio, !bio.isEmpty {
            EditableSection(action: editActions?.onTapBio) {
                Text(bio)
                    .font(.subheadline)
                    .foregroundStyle(.primary.opacity(0.85))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapBio) {
                placeholderRow(label: "About", hint: "Add a short bio")
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
        }
    }

    // MARK: - Card deck

    private var cardDeck: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Mono "WORK / 01 OF 06" + dot indicator
            HStack(alignment: .firstTextBaseline) {
                Text(progressLabel)
                    .font(.custom(mono, size: 10))
                    .tracking(2.0)
                    .foregroundStyle(Color.accentColor)
                Spacer()
                dotIndicator
            }
            .padding(.horizontal, 20)

            // Card stack itself
            ZStack {
                if sortedMedia.isEmpty {
                    emptyDeckPlaceholder
                } else {
                    ForEach(visibleLayers, id: \.layerKey) { layer in
                        deckCard(slot: layer.slot, depth: layer.depth)
                    }
                }
            }
            .frame(height: cardHeight)
            .padding(.horizontal, 20)
            .gesture(
                DragGesture(minimumDistance: 12)
                    .onChanged { value in
                        guard !sortedMedia.isEmpty else { return }
                        // Only let the front card drag horizontally.
                        dragOffset = CGSize(width: value.translation.width, height: 0)
                    }
                    .onEnded { value in
                        guard !sortedMedia.isEmpty else { return }
                        let threshold: CGFloat = 80
                        if value.translation.width < -threshold {
                            advance(+1)
                        } else if value.translation.width > threshold {
                            advance(-1)
                        }
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            dragOffset = .zero
                        }
                    }
            )

            // Controls
            controls
        }
        .padding(.bottom, 20)
    }

    /// Three layers (back → middle → front), drawn back-first so the front
    /// renders on top. Each carries a stable `layerKey` so SwiftUI doesn't
    /// recreate cards while the deck animates.
    private struct DeckLayer {
        let slot: MediaSlot
        let depth: Int
        let layerKey: String
    }

    private var visibleLayers: [DeckLayer] {
        guard !sortedMedia.isEmpty else { return [] }
        let count = sortedMedia.count
        let curr = sortedMedia[deckIndex % count]
        let next = sortedMedia[(deckIndex + 1) % count]
        let next2 = sortedMedia[(deckIndex + 2) % count]
        return [
            // Back of stack first so front draws on top
            DeckLayer(slot: next2, depth: 2, layerKey: "back-\(next2.url)\(next2.sortOrder)"),
            DeckLayer(slot: next,  depth: 1, layerKey: "mid-\(next.url)\(next.sortOrder)"),
            DeckLayer(slot: curr,  depth: 0, layerKey: "front-\(curr.url)\(curr.sortOrder)"),
        ]
    }

    @ViewBuilder
    private func deckCard(slot: MediaSlot, depth: Int) -> some View {
        let scale = 1.0 - CGFloat(depth) * 0.04
        let yOffset = CGFloat(depth) * 14
        let opacity = 1.0 - Double(depth) * 0.3
        let isFront = depth == 0
        let dragX = isFront ? dragOffset.width : 0

        ZStack(alignment: .bottomLeading) {
            mediaContent(slot: slot)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
                )

            if isFront {
                // Front card caption overlay
                LinearGradient(
                    colors: [.clear, .clear, .black.opacity(0.7)],
                    startPoint: .top, endPoint: .bottom
                )
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                .allowsHitTesting(false)

                frontCaption(slot: slot)
                    .padding(18)
            }
        }
        .scaleEffect(scale)
        .offset(x: dragX, y: yOffset)
        // Slight rotation on drag for the swipe-card feel.
        .rotationEffect(.degrees(isFront ? Double(dragX) * 0.04 : 0))
        .opacity(opacity)
        .shadow(color: .black.opacity(isFront ? 0.4 : 0.2), radius: isFront ? 20 : 10, y: 14)
        .animation(.spring(response: 0.45, dampingFraction: 0.8), value: deckIndex)
    }

    /// Caption block on the front card. In edit mode the whole block is a
    /// Button that opens the per-slot title editor for the deck's current
    /// index. Pencil glyph is shown as the affordance.
    @ViewBuilder
    private func frontCaption(slot: MediaSlot) -> some View {
        let captionText = slot.title ?? fallbackTitle(for: slot)
        let captionColor: Color = slot.title == nil ? .white.opacity(0.75) : .white

        if let onEditTitle = editActions?.onEditMediaTitle {
            Button {
                onEditTitle(deckIndex)
            } label: {
                HStack(alignment: .bottom, spacing: 8) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(metaLine(for: slot))
                            .font(.custom(mono, size: 10))
                            .tracking(1.5)
                            .foregroundStyle(Color.accentColor)
                            .textCase(.uppercase)

                        Text(captionText)
                            .font(.custom(EKKOFont.regular, size: 26))
                            .lineLimit(2)
                            .foregroundStyle(captionColor)
                            .multilineTextAlignment(.leading)
                    }
                    Spacer(minLength: 0)
                    Image(systemName: "pencil")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white)
                        .padding(6)
                        .background(Circle().fill(Color.accentColor))
                }
                .contentShape(Rectangle())
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .buttonStyle(.plain)
        } else {
            VStack(alignment: .leading, spacing: 6) {
                Text(metaLine(for: slot))
                    .font(.custom(mono, size: 10))
                    .tracking(1.5)
                    .foregroundStyle(Color.accentColor)
                    .textCase(.uppercase)

                Text(captionText)
                    .font(.custom(EKKOFont.regular, size: 26))
                    .lineLimit(2)
                    .foregroundStyle(.white)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func mediaContent(slot: MediaSlot) -> some View {
        if slot.isAudio {
            CoverAudioPlayerView(urlString: slot.url, coverUrl: slot.coverUrl, controlSize: 64)
        } else if slot.isModel {
            ModelViewerView(urlString: slot.url)
        } else if slot.isVideo {
            CoverVideoPlayerView(urlString: slot.url)
        } else if let url = URL(string: slot.url) {
            KFImage(url).resizable().scaledToFill()
        } else {
            LinearGradient(
                colors: [Color.accentColor.opacity(0.4), .black],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        }
    }

    private var emptyDeckPlaceholder: some View {
        EditableSection(action: editActions?.onTapMedia) {
            VStack(spacing: 12) {
                Image(systemName: "rectangle.stack.badge.plus")
                    .font(.system(size: 36))
                    .foregroundStyle(Color.accentColor)
                Text("Add media to build your deck")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .background(Color.secondary.opacity(0.05), in: RoundedRectangle(cornerRadius: 18))
    }

    private var dotIndicator: some View {
        HStack(spacing: 4) {
            ForEach(0..<sortedMedia.count, id: \.self) { i in
                Capsule()
                    .fill(i == deckIndex ? Color.accentColor : Color.secondary.opacity(0.25))
                    .frame(width: i == deckIndex ? 14 : 4, height: 4)
                    .animation(.spring(response: 0.3, dampingFraction: 0.8), value: deckIndex)
            }
        }
    }

    private var controls: some View {
        let canControl = !sortedMedia.isEmpty
        let frontSlot: MediaSlot? = sortedMedia.indices.contains(deckIndex)
            ? sortedMedia[deckIndex] : nil
        let frontTitle = frontSlot.map { $0.title ?? fallbackTitle(for: $0) } ?? ""

        return HStack(spacing: 10) {
            Button { advance(-1) } label: { stackChip("←") }
                .buttonStyle(.plain)
                .disabled(!canControl)

            Button {
                if let slot = frontSlot {
                    // "Open" always opens fullscreen — editing happens via
                    // the dashed-border edit affordances. Works in both
                    // display and edit mode.
                    presentedMedia = PresentedMedia(slot: slot, displayTitle: frontTitle)
                } else {
                    // No media yet — fall back to the media editor so the
                    // user can add some.
                    editActions?.onTapMedia()
                }
            } label: {
                Text(canControl ? "Open \(frontTitle)" : "Add media")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.accentColor, in: Capsule())
                    .lineLimit(1)
                    .truncationMode(.tail)
            }
            .buttonStyle(.plain)

            Button { advance(+1) } label: { stackChip("→") }
                .buttonStyle(.plain)
                .disabled(!canControl)
        }
        .padding(.horizontal, 20)
        .padding(.top, 18)
    }

    private func stackChip(_ glyph: String) -> some View {
        Text(glyph)
            .font(.system(size: 18, weight: .semibold))
            .foregroundStyle(.primary)
            .padding(.horizontal, 18)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial, in: Capsule())
            .overlay(Capsule().stroke(Color.secondary.opacity(0.2), lineWidth: 0.5))
    }

    private func advance(_ delta: Int) {
        let count = sortedMedia.count
        guard count > 0 else { return }
        let next = (deckIndex + delta + count) % count
        withAnimation(.spring(response: 0.4, dampingFraction: 0.78)) {
            deckIndex = next
        }
    }

    private var progressLabel: String {
        let total = max(sortedMedia.count, 1)
        let current = min(deckIndex + 1, total)
        return "WORK / \(String(format: "%02d", current)) OF \(String(format: "%02d", total))"
    }

    private func metaLine(for slot: MediaSlot) -> String {
        "\(slotKindLabel(slot)) · № \(String(format: "%02d", slot.sortOrder + 1))"
    }

    private func slotKindLabel(_ slot: MediaSlot) -> String {
        if slot.isAudio { return "AUDIO" }
        if slot.isModel { return "3D" }
        if slot.isVideo { return "VIDEO" }
        return "PHOTO"
    }

    private func fallbackTitle(for slot: MediaSlot) -> String {
        "Slot \(slot.sortOrder + 1)"
    }

    // MARK: - Stats

    private var statsRow: some View {
        HStack(spacing: 0) {
            statCell(value: "\(likesReceivedCount)", label: "Likes")
            divider
            statCell(value: "\(matchesCount)", label: "Matches")
            divider
            statCell(value: "\(mediaSlots.count)", label: "Media")
            divider
            statCell(value: "\(prompts.count)", label: "Prompts")
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
            Text(label.uppercased())
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

    // MARK: - Prompts (compact list)

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
            .padding(.top, 20)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapPrompts) {
                placeholderRow(label: "Prompts", hint: "Add prompts")
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
        }
    }

    // MARK: - Looking For

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
            .padding(.top, 20)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapLookingFor) {
                placeholderRow(label: "Looking for", hint: "Add what you're looking for")
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
        }
    }

    // MARK: - Socials

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
            .padding(.top, 20)
        }
    }

    private func websiteRow(url: String) -> some View {
        Button {
            let str = url.hasPrefix("http") ? url : "https://\(url)"
            if let u = URL(string: str) { UIApplication.shared.open(u) }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "globe")
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

    // MARK: - Section label / placeholder

    private func sectionLabel(_ label: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(label)
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
}
