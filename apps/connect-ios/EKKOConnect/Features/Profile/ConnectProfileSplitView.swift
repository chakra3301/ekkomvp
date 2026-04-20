import SwiftUI
import Kingfisher

/// Split variant of the Connect profile (template = "SPLIT").
/// Short cover → left rail (vertical-text handle + avatar + works count) +
/// right column (display name, NOW card, about) → full-width 3-column media
/// grid → stats / looking-for / socials. Mirrors Variant 3 from the design
/// handoff using EKKOTheme + Arches font + glass primitives.
struct ConnectProfileSplitView: View {
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
    private let coverHeight: CGFloat = 180
    private let avatarSize: CGFloat = 86
    private let railWidth: CGFloat = 86

    @State private var presentedMedia: PresentedMedia?

    private var sortedMedia: [MediaSlot] {
        mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
    }

    private var nowProject: PromptEntry? { prompts.first }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            shortCover
            splitBody
            workStrip
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

    // MARK: - Short cover

    private var shortCover: some View {
        EditableSection(action: editActions?.onTapMedia) {
            ZStack(alignment: .bottom) {
                Group {
                    if let slot = sortedMedia.first {
                        coverContent(for: slot)
                    } else {
                        LinearGradient(
                            colors: [Color.accentColor.opacity(0.45),
                                     Color.accentColor.opacity(0.1),
                                     .black.opacity(0.85)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: coverHeight)
                .clipped()

                LinearGradient(
                    colors: [.clear, .black.opacity(0.65)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 90)
                .allowsHitTesting(false)
            }
        }
    }

    @ViewBuilder
    private func coverContent(for slot: MediaSlot) -> some View {
        if slot.isAudio {
            CoverAudioPlayerView(urlString: slot.url, coverUrl: slot.coverUrl, controlSize: 48)
        } else if slot.isModel {
            ModelViewerView(urlString: slot.url)
        } else if slot.isVideo {
            CoverVideoPlayerView(urlString: slot.url)
        } else if let url = URL(string: slot.url) {
            KFImage(url).resizable().scaledToFill()
        }
    }

    // MARK: - Split body (rail + content)

    private var splitBody: some View {
        HStack(alignment: .top, spacing: 14) {
            leftRail
            rightColumn
        }
        .padding(.horizontal, 16)
        .padding(.top, 0)
        .offset(y: -44) // overlap the cover bottom edge
        .padding(.bottom, -44) // claim back the layout shift
    }

    private var leftRail: some View {
        VStack(spacing: 12) {
            AvatarView(url: avatarUrl, name: displayName, size: avatarSize)
                .overlay(Circle().stroke(Color(.systemBackground), lineWidth: 4))
                .shadow(color: .black.opacity(0.25), radius: 12, y: 4)

            // Vertical handle text — rotated 270° (clockwise reading bottom→top
            // matches the handoff's writing-mode: vertical-rl + 180°).
            if let username, !username.isEmpty {
                Text("@\(username)")
                    .font(.custom(mono, size: 10))
                    .tracking(2.4)
                    .foregroundStyle(.secondary)
                    .textCase(.uppercase)
                    .lineLimit(1)
                    .fixedSize()
                    .rotationEffect(.degrees(-90))
                    .frame(width: 14, height: 90)
            }

            // Vertical works count — large accent display.
            Text("\(sortedMedia.count) works")
                .font(.custom(EKKOFont.regular, size: 28))
                .foregroundStyle(Color.accentColor)
                .lineLimit(1)
                .fixedSize()
                .rotationEffect(.degrees(-90))
                .frame(width: 18, height: 120)
        }
        .frame(width: railWidth)
    }

    private var rightColumn: some View {
        VStack(alignment: .leading, spacing: 0) {
            EditableSection(action: editActions?.onTapHeadlineLocation) {
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .firstTextBaseline, spacing: 8) {
                        Text(displayName)
                            .font(.custom(EKKOFont.regular, size: 36))
                            .lineLimit(2)
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

                    HStack(spacing: 6) {
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
            }
            .padding(.top, 40) // pad away from rail's avatar top

            // NOW → current project card. Sourced from the first prompt's
            // answer when available, otherwise a placeholder in edit mode.
            nowCard
                .padding(.top, 18)

            if let bio, !bio.isEmpty {
                EditableSection(action: editActions?.onTapBio) {
                    Text(bio)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.top, 14)
            } else if editActions != nil {
                EditableSection(action: editActions?.onTapBio) {
                    placeholderRow(label: "About", hint: "Add a short bio")
                }
                .padding(.top, 14)
            }
        }
    }

    private var nowCard: some View {
        EditableSection(action: editActions?.onTapPrompts) {
            VStack(alignment: .leading, spacing: 6) {
                Text("NOW →")
                    .font(.custom(mono, size: 10))
                    .tracking(2.0)
                    .foregroundStyle(Color.accentColor)
                    .textCase(.uppercase)

                if let now = nowProject {
                    Text(now.answer)
                        .font(.subheadline)
                        .foregroundStyle(.primary)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)

                    Text(now.question)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .padding(.top, 2)
                } else {
                    Text("Add a prompt to share what you're working on now")
                        .font(.subheadline)
                        .foregroundStyle(.secondary.opacity(0.8))
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .glassCard()
        }
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

    // MARK: - Full-width 3-col work strip

    private var workStrip: some View {
        VStack(alignment: .leading, spacing: 10) {
            sectionHeader("PORTFOLIO / ALL")

            if sortedMedia.isEmpty, editActions != nil {
                EditableSection(action: editActions?.onTapMedia) {
                    placeholderRow(label: "Media", hint: "Add media to fill your portfolio")
                }
                .padding(.horizontal, 20)
            } else {
                LazyVGrid(
                    columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: 3),
                    spacing: 2
                ) {
                    ForEach(Array(sortedMedia.enumerated()), id: \.offset) { i, slot in
                        gridCell(slot: slot, index: i)
                    }
                }
                .padding(.horizontal, 2)
            }
        }
        .padding(.top, 24)
    }

    private func gridCell(slot: MediaSlot, index: Int) -> some View {
        Button {
            let title = slot.title ?? "Slot \(slot.sortOrder + 1)"
            presentedMedia = PresentedMedia(slot: slot, displayTitle: title)
        } label: {
            ZStack(alignment: .topLeading) {
                Group {
                    if slot.isAudio {
                        CoverAudioPlayerView(urlString: slot.url, coverUrl: slot.coverUrl, controlSize: 28)
                    } else if slot.isModel {
                        ModelViewerView(urlString: slot.url)
                    } else if slot.isVideo {
                        CoverVideoPlayerView(urlString: slot.url)
                    } else if let url = URL(string: slot.url) {
                        KFImage(url).resizable().scaledToFill()
                    }
                }
                .aspectRatio(1, contentMode: .fill)
                .frame(maxWidth: .infinity)
                .clipped()

                Text(String(format: "%02d", index + 1))
                    .font(.custom(mono, size: 9))
                    .tracking(1.4)
                    .foregroundStyle(Color.accentColor)
                    .padding(.horizontal, 6)
                    .padding(.top, 6)
            }
        }
        .buttonStyle(.plain)
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

    // MARK: - Prompts

    @ViewBuilder
    private var promptsBlock: some View {
        if prompts.count > 1 {
            EditableSection(action: editActions?.onTapPrompts) {
                VStack(alignment: .leading, spacing: 12) {
                    sectionLabel("◉ PROMPTS")
                    VStack(spacing: 10) {
                        // First prompt is shown in the NOW card — skip it
                        // here so we don't repeat content.
                        ForEach(Array(prompts.dropFirst().enumerated()), id: \.offset) { _, prompt in
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

    // MARK: - Section labels

    private func sectionHeader(_ label: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(label)
                .font(.custom(mono, size: 11))
                .tracking(2.5)
                .foregroundStyle(Color.accentColor)
            Rectangle()
                .fill(Color.secondary.opacity(0.2))
                .frame(height: 0.5)
        }
        .padding(.horizontal, 20)
    }

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
