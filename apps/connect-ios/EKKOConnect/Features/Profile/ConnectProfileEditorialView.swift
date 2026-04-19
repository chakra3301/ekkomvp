import SwiftUI
import Kingfisher

/// Editorial variant of the Connect profile (template = "EDITORIAL").
/// Magazine-style: top masthead, oversized display name, drop-cap bio,
/// 2-column work grid with №NN captions, footer stats. Mirrors Variant 2
/// from the design handoff, adapted to ConnectProfile data using
/// EKKOTheme + Arches font + glass primitives.
struct ConnectProfileEditorialView: View {
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

    private let mono = "Menlo"
    private let avatarSize: CGFloat = 64

    private var sortedMedia: [MediaSlot] {
        mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            masthead
            nameBlock
            dropCapAbout
            promptsIndex
            workGrid
            statsFooter
            lookingForSection
            socialsSection

            Spacer(minLength: 32)
        }
        .padding(.horizontal, 18)
    }

    // MARK: - Masthead (top mono bar)

    private var masthead: some View {
        HStack {
            Text("EKKO / ISSUE \(issueNumber)")
            Spacer()
            Text("◆ \(currentDateLabel)")
        }
        .font(.custom(mono, size: 10))
        .tracking(1.4)
        .foregroundStyle(.secondary)
        .textCase(.uppercase)
        .padding(.top, 4)
        .padding(.bottom, 14)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(Color.secondary.opacity(0.25))
                .frame(height: 0.5)
        }
    }

    private var issueNumber: String {
        // Synthesised — gives the magazine-issue feel without needing a
        // real "issue" field on the profile.
        let n = (mediaSlots.count + prompts.count) * 7 + 17
        return String(format: "%03d", n)
    }

    private var currentDateLabel: String {
        let f = DateFormatter()
        f.dateFormat = "MMM dd"
        return f.string(from: Date()).uppercased()
    }

    // MARK: - Name block

    private var nameBlock: some View {
        EditableSection(action: editActions?.onTapHeadlineLocation) {
            VStack(alignment: .leading, spacing: 0) {
                // Small mono accent label.
                Text("FEATURE / PROFILE №\(featureNumber)")
                    .font(.custom(mono, size: 10))
                    .tracking(1.8)
                    .foregroundStyle(EKKOTheme.primary)
                    .padding(.bottom, 10)

                // Massive display name.
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(displayName)
                        .font(.custom(EKKOFont.regular, size: 56))
                        .lineLimit(2)
                        .minimumScaleFactor(0.5)
                        .foregroundStyle(.primary)
                    if isAdmin {
                        gmBadge
                    } else if connectTier == .INFINITE {
                        Image(systemName: "infinity")
                            .font(.callout.weight(.semibold))
                            .foregroundStyle(EKKOTheme.primary)
                    }
                }

                HStack(alignment: .bottom) {
                    VStack(alignment: .leading, spacing: 2) {
                        if let headline, !headline.isEmpty {
                            Text(headline)
                                .font(.custom(EKKOFont.italic, size: 15))
                                .foregroundStyle(.primary)
                        }
                        if let location, !location.isEmpty {
                            Label(location, systemImage: "mappin")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .labelStyle(.titleAndIcon)
                        }
                    }
                    Spacer()
                    AvatarView(url: avatarUrl, name: displayName, size: avatarSize)
                        .overlay(Circle().stroke(.secondary.opacity(0.3), lineWidth: 0.5))
                }
                .padding(.top, 14)
            }
        }
        .padding(.top, 28)
        .padding(.bottom, 20)
    }

    private var featureNumber: String {
        String(format: "%03d", mediaSlots.count)
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

    // MARK: - About (full bio rendered in accent color)

    private var dropCapAbout: some View {
        EditableSection(action: editActions?.onTapBio) {
            Group {
                if let bio, !bio.isEmpty {
                    Text(bio)
                        .font(.body)
                        .foregroundStyle(EKKOTheme.primary)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else if editActions != nil {
                    placeholderRow(label: "About", hint: "Add a short bio")
                } else {
                    EmptyView()
                }
            }
        }
        .padding(.vertical, 18)
        .overlay(alignment: .top) {
            Rectangle().fill(Color.secondary.opacity(0.25)).frame(height: 0.5)
        }
        .overlay(alignment: .bottom) {
            Rectangle().fill(Color.secondary.opacity(0.25)).frame(height: 0.5)
        }
    }

    // MARK: - Prompts as numbered index
    //
    // The handoff used "INDEX / DISCIPLINES" with skill names. Connect
    // doesn't have a skills field, so we use the prompts (the user's
    // self-described prompts/answers) as the index instead.

    private var promptsIndex: some View {
        Group {
            if !prompts.isEmpty || editActions != nil {
                EditableSection(action: editActions?.onTapPrompts) {
                    VStack(alignment: .leading, spacing: 14) {
                        sectionLabel("INDEX / PROMPTS")
                        if prompts.isEmpty {
                            placeholderRow(label: "Prompts", hint: "Add prompts")
                        } else {
                            // Numbered Q + A blocks. Magazine-style: mono
                            // numeric lead, italic question, body answer.
                            VStack(alignment: .leading, spacing: 12) {
                                ForEach(Array(prompts.enumerated()), id: \.offset) { i, prompt in
                                    promptBlock(index: i, prompt: prompt)
                                }
                            }
                        }
                    }
                }
            }
        }
        .padding(.top, 18)
        .padding(.bottom, 4)
    }

    private func promptBlock(index: Int, prompt: PromptEntry) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Text(String(format: "%02d", index + 1))
                .font(.custom(mono, size: 11))
                .tracking(1.2)
                .foregroundStyle(EKKOTheme.primary)
                .frame(width: 22, alignment: .leading)
                .padding(.top, 2)

            VStack(alignment: .leading, spacing: 2) {
                Text(prompt.question)
                    .font(.custom(EKKOFont.italic, size: 13))
                    .foregroundStyle(.secondary)
                Text(prompt.answer)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: - Selected work grid (2-col)

    private var workGrid: some View {
        EditableSection(action: editActions?.onTapMedia) {
            VStack(alignment: .leading, spacing: 12) {
                sectionLabel("SELECTED WORK")
                if sortedMedia.isEmpty {
                    placeholderRow(label: "Media", hint: "Add media to feature your work")
                } else {
                    LazyVGrid(
                        columns: [
                            GridItem(.flexible(), spacing: 10),
                            GridItem(.flexible(), spacing: 10),
                        ],
                        spacing: 18
                    ) {
                        ForEach(Array(sortedMedia.enumerated()), id: \.offset) { i, slot in
                            workCell(slot: slot, index: i)
                        }
                    }
                }
            }
        }
        .padding(.top, 18)
        .padding(.bottom, 8)
    }

    @ViewBuilder
    private func workCell(slot: MediaSlot, index: Int) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Group {
                if slot.isAudio {
                    // Tap-to-play overlay — small control for grid context.
                    CoverAudioPlayerView(urlString: slot.url, controlSize: 36)
                } else if slot.isModel {
                    // Real <model-viewer> — interactive even at small size.
                    ModelViewerView(urlString: slot.url)
                } else if slot.isVideo {
                    // Autoplays muted on loop, fills the cell.
                    CoverVideoPlayerView(urlString: slot.url)
                } else if let url = URL(string: slot.url) {
                    KFImage(url).resizable().scaledToFill()
                }
            }
            .aspectRatio(1, contentMode: .fill)
            .frame(maxWidth: .infinity)
            .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 4, style: .continuous)
                    .stroke(Color.secondary.opacity(0.25), lineWidth: 0.5)
            )

            HStack {
                Text("№ \(String(format: "%02d", index + 1))")
                Spacer()
                Text(mediaTypeLabel(for: slot))
            }
            .font(.custom(mono, size: 10))
            .tracking(1.0)
            .foregroundStyle(.secondary)
            .textCase(.uppercase)

            // Editorial caption — uses slot.title if set, otherwise falls
            // back to the matching prompt question, otherwise "Slot N".
            // Tappable in edit mode to open a focused title editor.
            captionView(index: index, slot: slot)
        }
    }

    @ViewBuilder
    private func captionView(index: Int, slot: MediaSlot) -> some View {
        let display = slot.title ?? captionFor(index: index, slot: slot)

        if let onEditTitle = editActions?.onEditMediaTitle {
            Button {
                onEditTitle(index)
            } label: {
                HStack(spacing: 6) {
                    Text(display)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(slot.title == nil ? .secondary : .primary)
                        .multilineTextAlignment(.leading)
                        .lineLimit(2)
                    Spacer(minLength: 0)
                    Image(systemName: "pencil")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(EKKOTheme.primary)
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        } else {
            Text(display)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(.primary)
                .lineLimit(2)
        }
    }

    private func mediaTypeLabel(for slot: MediaSlot) -> String {
        if slot.isAudio { return "AUDIO" }
        if slot.isModel { return "3D" }
        if slot.isVideo { return "VIDEO" }
        return "PHOTO"
    }

    private func captionFor(index: Int, slot: MediaSlot) -> String {
        if index < prompts.count {
            return prompts[index].question
        }
        return "Slot \(index + 1)"
    }

    // MARK: - Stats footer

    private var statsFooter: some View {
        VStack(alignment: .leading, spacing: 0) {
            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 4),
                spacing: 8
            ) {
                statCell(value: "\(likesReceivedCount)", label: "Likes")
                statCell(value: "\(matchesCount)", label: "Matches")
                statCell(value: "\(mediaSlots.count)", label: "Media")
                statCell(value: "\(prompts.count)", label: "Prompts")
            }
        }
        .padding(.vertical, 18)
        .padding(.top, 16)
        .overlay(alignment: .top) {
            Rectangle().fill(Color.secondary.opacity(0.25)).frame(height: 0.5)
        }
    }

    private func statCell(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(value)
                .font(.custom(EKKOFont.regular, size: 22))
                .foregroundStyle(.primary)
            Text(label.uppercased())
                .font(.custom(mono, size: 9))
                .tracking(1.4)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Section label

    private func sectionLabel(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(text)
                .font(.custom(mono, size: 10))
                .tracking(2.4)
                .foregroundStyle(EKKOTheme.primary)
                .textCase(.uppercase)
            Rectangle()
                .fill(Color.secondary.opacity(0.25))
                .frame(height: 0.5)
                .padding(.top, 6)
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

    // MARK: - Looking For

    @ViewBuilder
    private var lookingForSection: some View {
        if let lookingFor, !lookingFor.isEmpty {
            EditableSection(action: editActions?.onTapLookingFor) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("LOOKING FOR")
                    Text(lookingFor)
                        .font(.body)
                        .foregroundStyle(.primary)
                }
            }
            .padding(.top, 16)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapLookingFor) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("LOOKING FOR")
                    placeholderRow(label: "Looking for", hint: "Add what you're looking for")
                }
            }
            .padding(.top, 16)
        }
    }

    // MARK: - Socials

    @ViewBuilder
    private var socialsSection: some View {
        let hasAny = (instagramHandle?.isEmpty == false) ||
                     (twitterHandle?.isEmpty == false) ||
                     (websiteUrl?.isEmpty == false)

        if hasAny || editActions != nil {
            VStack(alignment: .leading, spacing: 10) {
                EditableSection(action: editActions?.onTapSocials) {
                    sectionLabel("ELSEWHERE")
                }

                if hasAny {
                    // Each row is its own button so taps go to the matching
                    // app/URL — only the section label opens the editor.
                    VStack(spacing: 0) {
                        if let ig = instagramHandle, !ig.isEmpty {
                            socialRow(label: "Instagram",
                                      value: "@\(stripAt(ig))",
                                      action: { openInstagram(handle: ig) })
                        }
                        if let tw = twitterHandle, !tw.isEmpty {
                            socialRow(label: "X",
                                      value: "@\(stripAt(tw))",
                                      action: { openTwitter(handle: tw) })
                        }
                        if let web = websiteUrl, !web.isEmpty {
                            socialRow(label: "Site",
                                      value: cleanDisplayURL(web),
                                      action: { openWebsite(url: web) })
                        }
                    }
                } else {
                    EditableSection(action: editActions?.onTapSocials) {
                        placeholderRow(label: "Socials", hint: "Add Instagram, X, or website")
                    }
                }
            }
            .padding(.top, 16)
        }
    }

    private func socialRow(label: String, value: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(label.uppercased())
                    .font(.custom(mono, size: 10))
                    .tracking(1.4)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(value)
                    .font(.custom(mono, size: 12))
                    .foregroundStyle(.primary)
                Image(systemName: "arrow.up.right")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(.vertical, 10)
            .contentShape(Rectangle())
            .overlay(alignment: .bottom) {
                Rectangle()
                    .fill(Color.secondary.opacity(0.18))
                    .frame(height: 0.5)
            }
        }
        .buttonStyle(.plain)
    }

    private func stripAt(_ s: String) -> String {
        s.trimmingCharacters(in: CharacterSet(charactersIn: "@"))
    }

    private func openInstagram(handle: String) {
        let h = stripAt(handle)
        if let appURL = URL(string: "instagram://user?username=\(h)"),
           UIApplication.shared.canOpenURL(appURL) {
            UIApplication.shared.open(appURL)
            return
        }
        if let web = URL(string: "https://www.instagram.com/\(h)") {
            UIApplication.shared.open(web)
        }
    }

    private func openTwitter(handle: String) {
        let h = stripAt(handle)
        if let appURL = URL(string: "twitter://user?screen_name=\(h)"),
           UIApplication.shared.canOpenURL(appURL) {
            UIApplication.shared.open(appURL)
            return
        }
        if let web = URL(string: "https://x.com/\(h)") {
            UIApplication.shared.open(web)
        }
    }

    private func openWebsite(url: String) {
        let str = url.hasPrefix("http") ? url : "https://\(url)"
        if let u = URL(string: str) { UIApplication.shared.open(u) }
    }

    private func cleanDisplayURL(_ url: String) -> String {
        url.replacingOccurrences(of: "https://", with: "")
           .replacingOccurrences(of: "http://", with: "")
           .replacingOccurrences(of: "www.", with: "")
           .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }
}

