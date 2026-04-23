import SwiftUI
import Kingfisher

/// 3D variant of the Connect profile (template = "THREED").
/// Live wireframe viewport (real `<model-viewer>` when there's a 3D slot,
/// synthetic spinning icosahedron + grid floor otherwise) with mono HUD
/// corners, then an asset library table of every model file. Mirrors
/// Variant 6 from the design handoff.
///
/// "Tris" + "size" columns are synthetic — Connect doesn't read .glb /
/// .usdz / .fbx metadata at upload — but they're stable per slot so the
/// asset list looks alive. Falls back to all media when no model slots.
struct ConnectProfileThreeDView: View {
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

    /// 3D-typed slots if the user has any, else fall back to all media.
    private var assets: [MediaSlot] {
        let sorted = mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        let modelOnly = sorted.filter { $0.isModel }
        return modelOnly.isEmpty ? sorted : modelOnly
    }

    /// Featured asset shown in the viewport: first model if any.
    private var featured: MediaSlot? { assets.first }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            compactHeader
            viewportCard
            rigStats
            assetLibrary
            pipelineBlock
            bioBlock
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

    // MARK: - Viewport card

    private var viewportCard: some View {
        Rectangle()
            .fill(Color.black)
            .aspectRatio(16.0 / 11.0, contentMode: .fit)
            .overlay {
                viewportContent
            }
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color.white.opacity(0.12), lineWidth: 0.5)
            )
            .overlay(alignment: .topLeading) {
                Text("● VIEWPORT · PERSP · 60mm")
                    .font(.custom(mono, size: 9))
                    .tracking(1.4)
                    .foregroundStyle(.tint)
                    .padding(.horizontal, 10)
                    .padding(.top, 10)
                    .allowsHitTesting(false)
            }
            .overlay(alignment: .topTrailing) {
                Text("24.0 FPS")
                    .font(.custom(mono, size: 9))
                    .tracking(1.4)
                    .foregroundStyle(.white.opacity(0.6))
                    .padding(.horizontal, 10)
                    .padding(.top, 10)
                    .allowsHitTesting(false)
            }
            .overlay(alignment: .bottom) {
                HStack {
                    Text("x: 0.00  y: 0.00  z: 0.00")
                    Spacer()
                    Text("TRIS \(syntheticTris(for: featured))")
                }
                .font(.custom(mono, size: 9))
                .tracking(1.2)
                .foregroundStyle(.white.opacity(0.55))
                .padding(.horizontal, 10)
                .padding(.bottom, 10)
                .allowsHitTesting(false)
            }
            .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .onTapGesture {
                guard let slot = featured else {
                    editActions?.onTapMedia()
                    return
                }
                let title = slot.title ?? "asset \(slot.sortOrder + 1)"
                presentedMedia = PresentedMedia(slot: slot, displayTitle: title)
            }
            .padding(.horizontal, 16)
    }

    @ViewBuilder
    private var viewportContent: some View {
        if let slot = featured {
            // Real interactive viewer over a faint grid floor.
            ZStack {
                gridFloor
                if slot.isModel {
                    ModelViewerView(urlString: slot.url)
                } else if slot.isVideo {
                    CoverVideoPlayerView(urlString: slot.url)
                } else if slot.isAudio {
                    CoverAudioPlayerView(urlString: slot.url, coverUrl: slot.coverUrl, controlSize: 48)
                } else if let url = URL(string: slot.url) {
                    KFImage(url).resizable().scaledToFill()
                }
            }
        } else {
            // No assets — synthetic wireframe + grid as an aspirational
            // empty state.
            ZStack {
                gridFloor
                SpinningIcosahedron(stroke: Color.accentColor)
                    .frame(width: 140, height: 140)
            }
            .overlay(alignment: .bottom) {
                Text("Add a 3D file to populate the viewport")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.65))
                    .padding(.bottom, 32)
            }
        }
    }

    /// Faint accent-tinted grid floor with a vertical fade so it looks
    /// like a perspective view receding into darkness.
    private var gridFloor: some View {
        Canvas { ctx, size in
            let spacing: CGFloat = 28
            let color = Color.accentColor.opacity(0.18)

            // Horizontal lines
            var y: CGFloat = 0
            while y < size.height {
                var path = Path()
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: size.width, y: y))
                ctx.stroke(path, with: .color(color), lineWidth: 0.5)
                y += spacing
            }
            // Vertical lines
            var x: CGFloat = 0
            while x < size.width {
                var path = Path()
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: size.height))
                ctx.stroke(path, with: .color(color), lineWidth: 0.5)
                x += spacing
            }
        }
        .mask {
            LinearGradient(
                colors: [.clear, .black, .black, .clear],
                startPoint: .top,
                endPoint: .bottom
            )
        }
        .allowsHitTesting(false)
    }

    // MARK: - Rig stats

    private var rigStats: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3),
            spacing: 8
        ) {
            statCell(value: "\(likesReceivedCount)", label: "LIKES")
            statCell(value: "\(matchesCount)",       label: "MATCHES")
            statCell(value: "\(assets.count)",       label: "ASSETS")
        }
        .padding(.horizontal, 16)
        .padding(.top, 14)
    }

    private func statCell(value: String, label: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(value)
                .font(.custom(EKKOFont.regular, size: 22))
                .foregroundStyle(.primary)
            Text(label)
                .font(.custom(mono, size: 8))
                .tracking(2.0)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(10)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8))
        .overlay(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .stroke(Color.secondary.opacity(0.25), lineWidth: 0.5)
        )
    }

    // MARK: - Asset library

    @ViewBuilder
    private var assetLibrary: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                sectionLabel("ASSET LIBRARY / \(assets.count)")
                Spacer()
                Text("sort: recent ↓")
                    .font(.custom(mono, size: 9))
                    .tracking(1.5)
                    .foregroundStyle(.secondary)
            }

            if assets.isEmpty, editActions != nil {
                EditableSection(action: editActions?.onTapMedia) {
                    placeholderRow(label: "Asset library", hint: "Add 3D models to populate")
                }
            } else if !assets.isEmpty {
                VStack(spacing: 0) {
                    ForEach(Array(assets.enumerated()), id: \.offset) { i, slot in
                        assetRow(slot: slot, index: i, last: i == assets.count - 1)
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

    private func assetRow(slot: MediaSlot, index: Int, last: Bool) -> some View {
        Button {
            let title = slot.title ?? assetFilename(for: slot)
            presentedMedia = PresentedMedia(slot: slot, displayTitle: title)
        } label: {
            HStack(alignment: .center, spacing: 10) {
                wireIcon(tint: Color.accentColor)
                    .frame(width: 32, height: 32)

                VStack(alignment: .leading, spacing: 2) {
                    Text(slot.title ?? assetFilename(for: slot))
                        .font(.custom(mono, size: 12))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    Text(assetMetaLine(for: slot))
                        .font(.custom(mono, size: 9))
                        .tracking(1.0)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Text("↓")
                    .foregroundStyle(.tint)
            }
            .padding(12)
            .contentShape(Rectangle())
            .overlay(alignment: .bottom) {
                if !last {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.18))
                        .frame(height: 0.5)
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func wireIcon(tint: Color) -> some View {
        ZStack {
            RoundedRectangle(cornerRadius: 6, style: .continuous)
                .fill(LinearGradient(
                    colors: [tint, tint.opacity(0.2)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                ))
                .overlay(
                    RoundedRectangle(cornerRadius: 6, style: .continuous)
                        .stroke(tint.opacity(0.8), lineWidth: 0.5)
                )

            Canvas { ctx, size in
                let pts: [CGPoint] = [
                    CGPoint(x: size.width * 0.5,  y: size.height * 0.12),
                    CGPoint(x: size.width * 0.88, y: size.height * 0.36),
                    CGPoint(x: size.width * 0.88, y: size.height * 0.68),
                    CGPoint(x: size.width * 0.5,  y: size.height * 0.88),
                    CGPoint(x: size.width * 0.12, y: size.height * 0.68),
                    CGPoint(x: size.width * 0.12, y: size.height * 0.36),
                ]
                var hex = Path()
                hex.addLines(pts)
                hex.closeSubpath()
                ctx.stroke(hex, with: .color(.white.opacity(0.9)), lineWidth: 0.8)

                // 3 crossing lines
                let pairs: [(CGPoint, CGPoint)] = [
                    (CGPoint(x: pts[0].x, y: pts[0].y), CGPoint(x: pts[3].x, y: pts[3].y)),
                    (CGPoint(x: pts[5].x, y: pts[5].y), CGPoint(x: pts[2].x, y: pts[2].y)),
                    (CGPoint(x: pts[1].x, y: pts[1].y), CGPoint(x: pts[4].x, y: pts[4].y)),
                ]
                for (a, b) in pairs {
                    var path = Path()
                    path.move(to: a)
                    path.addLine(to: b)
                    ctx.stroke(path, with: .color(.white.opacity(0.5)), lineWidth: 0.6)
                }
            }
        }
    }

    private func assetFilename(for slot: MediaSlot) -> String {
        // Try to surface the actual filename from the URL; fall back to a
        // synthesized "asset_NN.glb" when the URL doesn't have one (e.g.
        // hashed Supabase storage paths).
        if let url = URL(string: slot.url) {
            let last = url.lastPathComponent
            if !last.isEmpty && last.contains(".") {
                return last
            }
        }
        return "asset_\(String(format: "%02d", slot.sortOrder + 1)).\(extensionGuess(for: slot))"
    }

    private func extensionGuess(for slot: MediaSlot) -> String {
        if slot.isModel {
            // Try URL extension first.
            if let url = URL(string: slot.url) {
                let ext = url.pathExtension.lowercased()
                if !ext.isEmpty { return ext }
            }
            return "glb"
        }
        if slot.isVideo { return "mp4" }
        if slot.isAudio { return "wav" }
        return "jpg"
    }

    private func assetMetaLine(for slot: MediaSlot) -> String {
        let kind = slotKindTag(slot)
        return "\(kind) · \(syntheticTris(for: slot)) tris · \(syntheticSize(for: slot))"
    }

    private func slotKindTag(_ slot: MediaSlot) -> String {
        if slot.isModel { return "MODEL" }
        if slot.isAudio { return "AUDIO" }
        if slot.isVideo { return "VIDEO" }
        return "PHOTO"
    }

    private func syntheticTris(for slot: MediaSlot?) -> String {
        guard let slot else { return "—" }
        let raw = 8 + (slot.sortOrder * 71 + 13) % 480
        if raw >= 100 {
            return String(format: "%dK", raw)
        }
        return "\(raw)K"
    }

    private func syntheticSize(for slot: MediaSlot) -> String {
        let mb = 4 + Double((slot.sortOrder * 53 + 19) % 80)
        return String(format: "%.1f MB", mb)
    }

    // MARK: - Pipeline (prompt-based)
    //
    // Connect doesn't store a "software stack" field. Use prompt
    // questions as inline "pipeline" chips so 3D artists have a place to
    // surface their stack in the meantime.

    @ViewBuilder
    private var pipelineBlock: some View {
        if !prompts.isEmpty {
            EditableSection(action: editActions?.onTapPrompts) {
                VStack(alignment: .leading, spacing: 10) {
                    sectionLabel("PIPELINE")
                    LazyVGrid(
                        columns: [
                            GridItem(.adaptive(minimum: 90, maximum: 200), spacing: 6),
                        ],
                        alignment: .leading,
                        spacing: 6
                    ) {
                        ForEach(Array(prompts.enumerated()), id: \.offset) { _, prompt in
                            Text(prompt.answer)
                                .font(.custom(mono, size: 11))
                                .foregroundStyle(.primary)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .overlay(
                                    Capsule().stroke(Color.secondary.opacity(0.4), lineWidth: 0.5)
                                )
                                .lineLimit(1)
                        }
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.top, 22)
        }
    }

    // MARK: - Bio / Looking For / Socials

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
                .foregroundStyle(.tint)
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
                .foregroundStyle(.tint)
        }
    }

    private func cleanDisplayURL(_ url: String) -> String {
        url.replacingOccurrences(of: "https://", with: "")
           .replacingOccurrences(of: "http://", with: "")
           .replacingOccurrences(of: "www.", with: "")
           .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }
}

// MARK: - Spinning wireframe icosahedron (empty-viewport fallback)
//
// Stroked SVG-style polygon + crossing lines, rotated continuously. We
// approximate the "spin" with a 3D-feeling scale-X morph driven by a
// time-based phase (true 3D rotation needs SceneKit; the squash gives a
// passable 360° feel for an empty-state graphic).

private struct SpinningIcosahedron: View {
    let stroke: Color

    @State private var phase: Double = 0

    private let timer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()

    var body: some View {
        Canvas { ctx, size in
            let cx = size.width / 2
            let cy = size.height / 2
            let r = min(size.width, size.height) / 2.2

            // 3D-feeling spin via x-scale animation on the projected shape.
            let xScale = cos(phase)
            let pts: [CGPoint] = [
                CGPoint(x: cx,                    y: cy - r),
                CGPoint(x: cx + r * 0.866 * xScale, y: cy - r * 0.3),
                CGPoint(x: cx + r * 0.535 * xScale, y: cy + r * 0.8),
                CGPoint(x: cx - r * 0.535 * xScale, y: cy + r * 0.8),
                CGPoint(x: cx - r * 0.866 * xScale, y: cy - r * 0.3),
            ]

            var hex = Path()
            hex.addLines(pts)
            hex.closeSubpath()
            ctx.stroke(
                hex,
                with: .linearGradient(
                    Gradient(colors: [stroke, .white.opacity(0.4)]),
                    startPoint: CGPoint(x: 0, y: 0),
                    endPoint: CGPoint(x: size.width, y: size.height)
                ),
                lineWidth: 0.8
            )

            // Inner crossing lines.
            let pairs: [(Int, Int)] = [(0, 2), (0, 3), (1, 4), (2, 4), (3, 1)]
            for (a, b) in pairs {
                var p = Path()
                p.move(to: pts[a])
                p.addLine(to: pts[b])
                ctx.stroke(p, with: .color(stroke.opacity(0.5)), lineWidth: 0.5)
            }

            // Centre dot.
            let dot = Path(ellipseIn: CGRect(x: cx - 2, y: cy - 2, width: 4, height: 4))
            ctx.fill(dot, with: .color(stroke))
        }
        .onReceive(timer) { _ in
            phase += 0.04
        }
    }
}
