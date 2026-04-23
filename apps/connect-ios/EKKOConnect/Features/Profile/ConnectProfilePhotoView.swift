import SwiftUI
import Kingfisher

/// Photo variant of the Connect profile (template = "PHOTO").
/// Featured 3:4 frame with EXIF-style overlays + 4-column contact sheet
/// of all photo slots. Mirrors Variant 9 from the design handoff using
/// EKKOTheme + Arches font.
///
/// Connect doesn't carry real EXIF metadata on MediaSlots, so the
/// "EXIF stripe" surfaces what we DO have — frame number, slot title
/// (used as the caption), and the slot's media kind. When a user has
/// no photo-type slots, we fall back to all media so video/3D-only
/// creatives still see something coherent.
struct ConnectProfilePhotoView: View {
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

    /// Photo-type slots if the user has any, otherwise fall back to all
    /// media so the template still renders something useful.
    private var frames: [MediaSlot] {
        let sorted = mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        let photoOnly = sorted.filter { !$0.isAudio && !$0.isModel && !$0.isVideo }
        return photoOnly.isEmpty ? sorted : photoOnly
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            compactHeader
            featuredFrame
            contactSheet
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
                                .foregroundStyle(.tint)
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

    // MARK: - Featured frame (big 3:4)

    private var featuredFrame: some View {
        Group {
            if frames.isEmpty {
                EditableSection(action: editActions?.onTapMedia) {
                    emptyFramePlaceholder
                }
                .padding(.horizontal, 16)
            } else {
                let safeIndex = min(selectedIndex, frames.count - 1)
                let cur = frames[safeIndex]

                // Aspect-locked container: a clear Rectangle defines the
                // 3:4 frame, the actual photo (or video/3D/audio) overlays
                // and fills it. The photo area uses .onTapGesture for
                // fullscreen so the caption inside the bottom stripe can
                // be its own Button without conflicting with the outer tap.
                Rectangle()
                    .fill(Color.clear)
                    .aspectRatio(3.0 / 4.0, contentMode: .fit)
                    .overlay {
                        framePhoto(slot: cur)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 4, style: .continuous)
                            .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
                    )
                    .overlay(alignment: .top) {
                        HStack {
                            Text("● \(slotKindLabel(cur))")
                            Spacer()
                            Text(frameCounter(safeIndex))
                        }
                        .font(.custom(mono, size: 9))
                        .tracking(1.2)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.top, 10)
                        .padding(.bottom, 24)
                        .frame(maxWidth: .infinity, alignment: .top)
                        .background(
                            LinearGradient(
                                colors: [.black.opacity(0.65), .clear],
                                startPoint: .top, endPoint: .bottom
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                        .allowsHitTesting(false)
                    }
                    .overlay(alignment: .bottom) {
                        bottomStripe(slot: cur, index: safeIndex)
                    }
                    .contentShape(RoundedRectangle(cornerRadius: 4, style: .continuous))
                    .onTapGesture {
                        let title = cur.title ?? "frame \(safeIndex + 1)"
                        presentedMedia = PresentedMedia(slot: cur, displayTitle: title)
                    }
                    .padding(.horizontal, 16)
            }
        }
    }

    @ViewBuilder
    private func framePhoto(slot: MediaSlot) -> some View {
        if slot.isAudio {
            CoverAudioPlayerView(urlString: slot.url, coverUrl: slot.coverUrl, controlSize: 64)
        } else if slot.isModel {
            ModelViewerView(urlString: slot.url)
        } else if slot.isVideo {
            CoverVideoPlayerView(urlString: slot.url)
        } else if let url = URL(string: slot.url) {
            KFImage(url).resizable().scaledToFill()
        }
    }

    private func bottomStripe(slot: MediaSlot, index: Int) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("№ \(String(format: "%02d", slot.sortOrder + 1))")
                Spacer()
                Text(slotKindLabel(slot))
                Spacer()
                Text("frame \(index + 1)")
            }
            .font(.custom(mono, size: 9))
            .tracking(1.0)
            .foregroundStyle(.white.opacity(0.85))
            .allowsHitTesting(false)

            captionRow(slot: slot, index: index)
        }
        .padding(.horizontal, 12)
        .padding(.top, 22)
        .padding(.bottom, 12)
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

    /// Italic caption row at the bottom of the featured frame. In edit mode
    /// it becomes a Button that opens the per-slot title editor, with a
    /// pencil glyph as the affordance. Outside edit mode it's a static Text
    /// so it doesn't intercept the photo's fullscreen tap.
    @ViewBuilder
    private func captionRow(slot: MediaSlot, index: Int) -> some View {
        let display = captionText(for: slot, index: index)
        let isCustom = (slot.title?.isEmpty == false)
        let textColor: Color = isCustom ? .white : .white.opacity(0.75)

        if let onEditTitle = editActions?.onEditMediaTitle {
            Button {
                onEditTitle(storageIndex(for: slot))
            } label: {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(display)
                        .font(.custom(EKKOFont.italic, size: 17))
                        .foregroundStyle(textColor)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
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
                .font(.custom(EKKOFont.italic, size: 17))
                .foregroundStyle(.white)
                .lineLimit(2)
                .allowsHitTesting(false)
        }
    }

    /// Map a `MediaSlot` back to its index in the SORTED full mediaSlots
    /// array so `onEditMediaTitle(_:)` updates the right draft entry. The
    /// `frames` list might be filtered (photo-only) so frame indices won't
    /// match the sorted-storage indices ProfileView expects.
    private func storageIndex(for slot: MediaSlot) -> Int {
        let sorted = mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        return sorted.firstIndex(where: {
            $0.url == slot.url && $0.sortOrder == slot.sortOrder
        }) ?? 0
    }

    private var emptyFramePlaceholder: some View {
        VStack(spacing: 10) {
            Image(systemName: "camera.aperture")
                .font(.system(size: 36))
                .foregroundStyle(.tint)
            Text("Add photos to fill the frame")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .aspectRatio(3.0 / 4.0, contentMode: .fit)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 4))
        .overlay(
            RoundedRectangle(cornerRadius: 4)
                .stroke(Color.secondary.opacity(0.3), lineWidth: 0.5)
        )
    }

    // MARK: - Contact sheet (4-column)

    @ViewBuilder
    private var contactSheet: some View {
        if !frames.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    sectionLabel("CONTACT SHEET")
                    Spacer()
                    Text("ROLL #\(String(format: "%03d", frames.count))")
                        .font(.custom(mono, size: 9))
                        .tracking(1.5)
                        .foregroundStyle(.secondary)
                }

                LazyVGrid(
                    columns: Array(repeating: GridItem(.flexible(), spacing: 4), count: 4),
                    spacing: 4
                ) {
                    ForEach(Array(frames.enumerated()), id: \.offset) { i, slot in
                        contactSheetCell(slot: slot, index: i, isSelected: i == selectedIndex)
                    }
                }
                .padding(6)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 4))
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(Color.secondary.opacity(0.25), lineWidth: 0.5)
                )
            }
            .padding(.horizontal, 16)
            .padding(.top, 18)
        }
    }

    private func contactSheetCell(slot: MediaSlot, index: Int, isSelected: Bool) -> some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.85)) {
                selectedIndex = index
            }
        } label: {
            // Same aspect-locked pattern as the featured frame so the
            // grid cells stay perfectly square within the column width.
            Rectangle()
                .fill(Color.clear)
                .aspectRatio(1, contentMode: .fit)
                .overlay {
                    framePhoto(slot: slot)
                }
                .clipShape(RoundedRectangle(cornerRadius: 2, style: .continuous))
                .overlay(alignment: .topLeading) {
                    Text(String(format: "%02d", index + 1))
                        .font(.custom(mono, size: 8))
                        .tracking(0.5)
                        .foregroundStyle(.white)
                        .shadow(color: .black.opacity(0.8), radius: 1, y: 1)
                        .padding(.horizontal, 3)
                        .padding(.top, 2)
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 2, style: .continuous)
                        .stroke(isSelected ? Color.accentColor : Color.clear, lineWidth: 2)
                )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Bio + Prompts + Looking For + Socials

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
            .padding(.horizontal, 16)
            .padding(.top, 22)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapBio) {
                placeholderRow(label: "About", hint: "Add a short bio")
            }
            .padding(.horizontal, 16)
            .padding(.top, 22)
        }
    }

    /// Prompts shown as a "series" list — italic title + question, framed
    /// like a list view to match the handoff's series block aesthetic.
    @ViewBuilder
    private var promptsBlock: some View {
        if !prompts.isEmpty {
            EditableSection(action: editActions?.onTapPrompts) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("SERIES")
                    VStack(spacing: 0) {
                        ForEach(Array(prompts.enumerated()), id: \.offset) { i, prompt in
                            promptListRow(prompt: prompt, index: i, last: i == prompts.count - 1)
                        }
                    }
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(Color.secondary.opacity(0.25), lineWidth: 0.5)
                    )
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 22)
        }
    }

    private func promptListRow(prompt: PromptEntry, index: Int, last: Bool) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(prompt.answer)
                        .font(.custom(EKKOFont.italic, size: 18))
                        .foregroundStyle(.primary)
                        .lineLimit(2)
                    Text(prompt.question.uppercased())
                        .font(.custom(mono, size: 9))
                        .tracking(1.4)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text("→")
                    .foregroundStyle(.secondary)
            }
            .padding(14)
        }
        .overlay(alignment: .bottom) {
            if !last {
                Rectangle()
                    .fill(Color.secondary.opacity(0.18))
                    .frame(height: 0.5)
            }
        }
    }

    @ViewBuilder
    private var lookingForBlock: some View {
        if let lookingFor, !lookingFor.isEmpty {
            EditableSection(action: editActions?.onTapLookingFor) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("LOOKING FOR")
                    Text(lookingFor)
                        .font(.body)
                        .foregroundStyle(.primary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(14)
                        .glassCard()
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 22)
        } else if editActions != nil {
            EditableSection(action: editActions?.onTapLookingFor) {
                placeholderRow(label: "Looking for", hint: "Add what you're looking for")
            }
            .padding(.horizontal, 16)
            .padding(.top, 22)
        }
    }

    @ViewBuilder
    private var socialsBlock: some View {
        let hasAny = (instagramHandle?.isEmpty == false) ||
                     (twitterHandle?.isEmpty == false) ||
                     (websiteUrl?.isEmpty == false)

        if hasAny || editActions != nil {
            VStack(alignment: .leading, spacing: 10) {
                EditableSection(action: editActions?.onTapSocials) {
                    sectionLabel("ELSEWHERE")
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
            .padding(.horizontal, 16)
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
        Text(text)
            .font(.custom(mono, size: 10))
            .tracking(2.5)
            .foregroundStyle(.tint)
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
                .foregroundStyle(.tint)
        }
    }

    private func slotKindLabel(_ slot: MediaSlot) -> String {
        if slot.isAudio { return "AUDIO" }
        if slot.isModel { return "3D" }
        if slot.isVideo { return "VIDEO" }
        return "PHOTO"
    }

    private func frameCounter(_ index: Int) -> String {
        "\(String(format: "%03d", index + 1)) / \(String(format: "%03d", frames.count))"
    }

    private func captionText(for slot: MediaSlot, index: Int) -> String {
        if let t = slot.title, !t.isEmpty { return t }
        return "frame \(index + 1)"
    }

    private func cleanDisplayURL(_ url: String) -> String {
        url.replacingOccurrences(of: "https://", with: "")
           .replacingOccurrences(of: "http://", with: "")
           .replacingOccurrences(of: "www.", with: "")
           .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }
}
