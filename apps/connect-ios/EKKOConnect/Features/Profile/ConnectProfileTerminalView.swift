import SwiftUI
import Kingfisher

/// Terminal variant of the Connect profile (template = "TERMINAL").
/// Mono command-line framing — `$ whoami`, `$ ls -la ./portfolio`,
/// `$ cat skills.txt`, `$ grep -i looking.for`, `$ ./connect`. Mirrors
/// Variant 5 from the design handoff using EKKOTheme + Arches font.
struct ConnectProfileTerminalView: View {
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

    @State private var presentedMedia: PresentedMedia?

    private var sortedMedia: [MediaSlot] {
        mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
    }

    private var nowPrompt: PromptEntry? { prompts.first }

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            bootLine
            asciiHeader
            statsBar
            currentBlock
            workTable
            promptsList
            lookingForBlock
            socialsBlock
            Spacer(minLength: 24)
        }
        .padding(.horizontal, 16)
        .padding(.top, 4)
        .fullScreenCover(item: $presentedMedia) { presented in
            MediaFullScreenViewer(slot: presented.slot, displayTitle: presented.displayTitle)
        }
    }

    // MARK: - Boot line

    private var bootLine: some View {
        let session = String(format: "%03d", (mediaSlots.count + prompts.count) * 7 + 11)
        let handle = (username?.uppercased() ?? "GUEST")
        return HStack(spacing: 6) {
            Circle().fill(Color.accentColor).frame(width: 6, height: 6)
            HStack(spacing: 0) {
                Text("SESSION/\(session)  ·  MOUNT OK  ·  ")
                    .foregroundStyle(Color.secondary)
                Text("\(handle)@EKKO")
                    .foregroundStyle(Color.accentColor)
            }
        }
        .font(.custom(mono, size: 10))
        .tracking(1.0)
        .padding(.bottom, 2)
    }

    // MARK: - ASCII frame header

    private var asciiHeader: some View {
        EditableSection(action: editActions?.onTapHeadlineLocation) {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .center, spacing: 14) {
                    AvatarView(url: avatarUrl, name: displayName, size: 56)
                        .overlay(Circle().stroke(.secondary.opacity(0.3), lineWidth: 0.5))

                    VStack(alignment: .leading, spacing: 2) {
                        commandLabel("$ whoami")
                        Text(displayName)
                            .font(.custom(EKKOFont.regular, size: 28))
                            .foregroundStyle(.primary)
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)

                        Text(metaLine)
                            .font(.custom(mono, size: 11))
                            .tracking(0.4)
                            .foregroundStyle(.secondary)
                            .lineLimit(2)
                    }
                    Spacer(minLength: 0)
                    if isAdmin {
                        gmBadge
                    } else if connectTier == .INFINITE {
                        Image(systemName: "infinity")
                            .font(.callout.weight(.semibold))
                            .foregroundStyle(Color.accentColor)
                    }
                }

                EditableSection(action: editActions?.onTapBio) {
                    HStack(alignment: .top, spacing: 6) {
                        Text(">")
                            .foregroundStyle(Color.accentColor)
                        Text(bio?.isEmpty == false ? bio! : (editActions != nil ? "Add a short bio" : ""))
                            .foregroundStyle(bio?.isEmpty == false ? Color.primary : Color.secondary.opacity(0.7))
                    }
                    .font(.custom(mono, size: 11))
                }
                .overlay(alignment: .top) {
                    DashedDivider()
                        .padding(.horizontal, -2)
                        .offset(y: -12)
                }
                .padding(.top, 12)
            }
            .padding(14)
        }
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(Color.secondary.opacity(0.35), lineWidth: 1)
        )
    }

    private var metaLine: String {
        let role = headline?.uppercased() ?? "—"
        let loc = location?.uppercased() ?? "—"
        return "\(role) · \(loc)"
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

    // MARK: - Stats bar

    private var statsBar: some View {
        HStack(spacing: 0) {
            statCell(value: "\(likesReceivedCount)", label: "LIKES")
            statDivider
            statCell(value: "\(matchesCount)", label: "MATCHES")
            statDivider
            statCell(value: "\(mediaSlots.count)", label: "MEDIA")
            statDivider
            statCell(value: "\(prompts.count)", label: "PROMPTS")
        }
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(Color.secondary.opacity(0.35), lineWidth: 1)
        )
    }

    private func statCell(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.custom(mono, size: 16).weight(.semibold))
                .foregroundStyle(.primary)
            Text(label)
                .font(.custom(mono, size: 8))
                .tracking(2.0)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
    }

    private var statDivider: some View {
        Rectangle().fill(Color.secondary.opacity(0.35)).frame(width: 1)
    }

    // MARK: - Current project (`$ cat now.txt`)

    @ViewBuilder
    private var currentBlock: some View {
        if let now = nowPrompt {
            EditableSection(action: editActions?.onTapPrompts) {
                VStack(alignment: .leading, spacing: 6) {
                    commandLabel("$ cat now.txt")
                    VStack(alignment: .leading, spacing: 4) {
                        Text("# \(now.question)")
                            .font(.custom(mono, size: 10))
                            .foregroundStyle(.secondary)
                        Text(now.answer)
                            .font(.custom(mono, size: 12))
                            .foregroundStyle(.primary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 6))
                    .overlay(
                        RoundedRectangle(cornerRadius: 6, style: .continuous)
                            .stroke(Color.secondary.opacity(0.35), lineWidth: 1)
                    )
                }
            }
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapPrompts) {
                VStack(alignment: .leading, spacing: 6) {
                    commandLabel("$ cat now.txt")
                    placeholderRow(label: "now.txt", hint: "Add a prompt to fill this")
                }
            }
        }
    }

    // MARK: - Work table (`$ ls -la ./portfolio`)

    private var workTable: some View {
        EditableSection(action: editActions?.onTapMedia) {
            VStack(alignment: .leading, spacing: 8) {
                commandLabel("$ ls -la ./portfolio")

                if sortedMedia.isEmpty {
                    placeholderRow(label: "./portfolio", hint: "Add media to populate")
                        .padding(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 6, style: .continuous)
                                .stroke(Color.secondary.opacity(0.35), lineWidth: 1)
                        )
                } else {
                    VStack(spacing: 0) {
                        // Header row
                        tableRow(num: "№", name: "NAME", tag: "TAG", size: "TYPE",
                                 isHeader: true)
                        Rectangle().fill(Color.secondary.opacity(0.35)).frame(height: 1)

                        ForEach(Array(sortedMedia.enumerated()), id: \.offset) { i, slot in
                            Button {
                                let title = slot.title ?? "slot-\(slot.sortOrder + 1)"
                                presentedMedia = PresentedMedia(slot: slot, displayTitle: title)
                            } label: {
                                tableRow(
                                    num: String(format: "%02d", i + 1),
                                    name: tableTitle(for: slot),
                                    tag: slotKindLabel(slot),
                                    size: String(format: "№%02d", slot.sortOrder + 1)
                                )
                            }
                            .buttonStyle(.plain)

                            if i < sortedMedia.count - 1 {
                                Rectangle().fill(Color.secondary.opacity(0.18)).frame(height: 0.5)
                            }
                        }
                    }
                    .overlay(
                        RoundedRectangle(cornerRadius: 6, style: .continuous)
                            .stroke(Color.secondary.opacity(0.35), lineWidth: 1)
                    )
                }
            }
        }
    }

    private func tableRow(num: String, name: String, tag: String, size: String, isHeader: Bool = false) -> some View {
        HStack(alignment: .center, spacing: 8) {
            Text(num)
                .frame(width: 26, alignment: .leading)
                .foregroundStyle(isHeader ? .secondary : Color.accentColor)
            Text(name)
                .frame(maxWidth: .infinity, alignment: .leading)
                .foregroundStyle(isHeader ? .secondary : .primary)
                .lineLimit(1)
                .truncationMode(.tail)
            Text(tag)
                .frame(width: 70, alignment: .leading)
                .foregroundStyle(.secondary)
            Text(size)
                .frame(width: 60, alignment: .trailing)
                .foregroundStyle(.secondary)
        }
        .font(.custom(mono, size: isHeader ? 9 : 11))
        .tracking(isHeader ? 1.5 : 0.4)
        .padding(.vertical, isHeader ? 6 : 10)
        .padding(.horizontal, 10)
        .background(isHeader ? AnyShapeStyle(.ultraThinMaterial) : AnyShapeStyle(Color.clear))
    }

    private func tableTitle(for slot: MediaSlot) -> String {
        if let t = slot.title, !t.isEmpty { return t }
        return "slot-\(slot.sortOrder + 1)"
    }

    private func slotKindLabel(_ slot: MediaSlot) -> String {
        if slot.isAudio { return "audio" }
        if slot.isModel { return "model" }
        if slot.isVideo { return "video" }
        return "photo"
    }

    // MARK: - Prompts list (`$ cat prompts.txt`)
    //
    // Numbered list of prompt questions — terminal "skills.txt" analogue.
    // Skips the first prompt because it's already shown in the now block.

    @ViewBuilder
    private var promptsList: some View {
        let list = Array(prompts.dropFirst())
        if !list.isEmpty {
            EditableSection(action: editActions?.onTapPrompts) {
                VStack(alignment: .leading, spacing: 6) {
                    commandLabel("$ cat prompts.txt")
                    VStack(alignment: .leading, spacing: 6) {
                        ForEach(Array(list.enumerated()), id: \.offset) { i, prompt in
                            VStack(alignment: .leading, spacing: 2) {
                                HStack(spacing: 6) {
                                    Text(String(format: "%02d │", i + 1))
                                        .foregroundStyle(.secondary)
                                    Text(prompt.question)
                                        .foregroundStyle(.primary)
                                }
                                Text("    \(prompt.answer)")
                                    .foregroundStyle(.primary.opacity(0.85))
                                    .padding(.leading, 4)
                            }
                            .font(.custom(mono, size: 11))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Looking For (`$ grep -i "looking.for"`)

    @ViewBuilder
    private var lookingForBlock: some View {
        if let lookingFor, !lookingFor.isEmpty {
            EditableSection(action: editActions?.onTapLookingFor) {
                VStack(alignment: .leading, spacing: 6) {
                    commandLabel("$ grep -i \"looking.for\"")
                    HStack(alignment: .top, spacing: 6) {
                        Text(">")
                            .foregroundStyle(Color.accentColor)
                        Text(lookingFor)
                            .foregroundStyle(.primary)
                    }
                    .font(.custom(mono, size: 11))
                    .fixedSize(horizontal: false, vertical: true)
                }
            }
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapLookingFor) {
                VStack(alignment: .leading, spacing: 6) {
                    commandLabel("$ grep -i \"looking.for\"")
                    placeholderRow(label: "looking.for", hint: "Add what you're looking for")
                }
            }
        }
    }

    // MARK: - Socials (`$ ./connect`)

    @ViewBuilder
    private var socialsBlock: some View {
        let hasAny = (instagramHandle?.isEmpty == false) ||
                     (twitterHandle?.isEmpty == false) ||
                     (websiteUrl?.isEmpty == false)

        if hasAny || editActions != nil {
            VStack(alignment: .leading, spacing: 6) {
                EditableSection(action: editActions?.onTapSocials) {
                    commandLabel("$ ./connect")
                }

                if hasAny {
                    VStack(spacing: 0) {
                        if let ig = instagramHandle, !ig.isEmpty {
                            socialTerminalRow(label: "INSTAGRAM",
                                              value: "@\(stripAt(ig))",
                                              action: { openInstagram(handle: ig) })
                        }
                        if let tw = twitterHandle, !tw.isEmpty {
                            socialTerminalRow(label: "X",
                                              value: "@\(stripAt(tw))",
                                              action: { openTwitter(handle: tw) })
                        }
                        if let web = websiteUrl, !web.isEmpty {
                            socialTerminalRow(label: "SITE",
                                              value: cleanDisplayURL(web),
                                              action: { openWebsite(url: web) })
                        }
                    }
                } else {
                    EditableSection(action: editActions?.onTapSocials) {
                        placeholderRow(label: "./connect", hint: "Add Instagram, X, or website")
                    }
                }
            }
        }
    }

    private func socialTerminalRow(label: String, value: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Text(label)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(value)
                    .foregroundStyle(.primary)
                Image(systemName: "arrow.up.right")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .font(.custom(mono, size: 11))
            .padding(.vertical, 8)
            .contentShape(Rectangle())
            .overlay(alignment: .bottom) {
                DashedDivider()
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - Helpers

    private func commandLabel(_ text: String) -> some View {
        Text(text)
            .font(.custom(mono, size: 9))
            .tracking(2.0)
            .foregroundStyle(Color.accentColor)
    }

    private func placeholderRow(label: String, hint: String) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.custom(mono, size: 11))
                    .foregroundStyle(.secondary)
                Text(hint)
                    .font(.custom(mono, size: 11))
                    .foregroundStyle(.secondary.opacity(0.7))
            }
            Spacer()
            Image(systemName: "plus.circle")
                .foregroundStyle(Color.accentColor)
        }
    }

    private func stripAt(_ s: String) -> String {
        s.trimmingCharacters(in: CharacterSet(charactersIn: "@"))
    }

    private func openInstagram(handle: String) {
        let h = stripAt(handle)
        if let appURL = URL(string: "instagram://user?username=\(h)"),
           UIApplication.shared.canOpenURL(appURL) {
            UIApplication.shared.open(appURL); return
        }
        if let web = URL(string: "https://www.instagram.com/\(h)") {
            UIApplication.shared.open(web)
        }
    }

    private func openTwitter(handle: String) {
        let h = stripAt(handle)
        if let appURL = URL(string: "twitter://user?screen_name=\(h)"),
           UIApplication.shared.canOpenURL(appURL) {
            UIApplication.shared.open(appURL); return
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

// MARK: - Dashed divider line

private struct DashedDivider: View {
    var color: Color = .secondary.opacity(0.35)

    var body: some View {
        GeometryReader { geo in
            Path { path in
                path.move(to: .zero)
                path.addLine(to: CGPoint(x: geo.size.width, y: 0))
            }
            .stroke(color, style: StrokeStyle(lineWidth: 0.5, dash: [3, 3]))
        }
        .frame(height: 0.5)
    }
}
