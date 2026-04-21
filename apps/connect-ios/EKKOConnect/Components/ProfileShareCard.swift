import SwiftUI
import UIKit

// MARK: - Share Card View
//
// Portrait 1080×1920 asset exported to Instagram Stories / share sheet. Shows
// a faithful preview of the user's profile card (the same hero layout other
// people see in Discover) under a chrome EKKO wordmark — a "this is what I
// look like on EKKO" share rather than a bespoke poster.

struct ProfileShareCard: View {
    let displayName: String
    let username: String?
    let headline: String?
    let location: String?
    let isInfinite: Bool
    /// Pre-fetched hero media (first media slot) — falls back to the avatar,
    /// then to a gradient + initial letter.
    let heroImage: UIImage?
    let avatarImage: UIImage?

    var body: some View {
        ZStack {
            backdrop

            VStack(spacing: 0) {
                Spacer(minLength: 140)

                // Profile card preview with a passport-style holographic EKKO
                // watermark stamped across the hero. Same 3:4.3 aspect as the
                // Discover cards other people swipe on — reads as a screenshot
                // of their hero view, branded.
                profileCard
                    .frame(width: 940, height: 1345)

                Spacer(minLength: 40)

                // Bottom CTA line
                VStack(spacing: 8) {
                    Text("Find me on EKKO")
                        .font(.system(size: 42, weight: .semibold))
                        .foregroundStyle(.white)
                    if let username, !username.isEmpty {
                        Text("@\(username)   ·   ekkoconnect.app")
                            .font(.system(size: 30, weight: .regular))
                            .foregroundStyle(.white.opacity(0.65))
                    } else {
                        Text("ekkoconnect.app")
                            .font(.system(size: 30, weight: .regular))
                            .foregroundStyle(.white.opacity(0.65))
                    }
                }
                .padding(.bottom, 140)
            }
        }
        .frame(width: 1080, height: 1920)
    }

    // MARK: Backdrop

    private var backdrop: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color.black,
                    Color(red: 0.10, green: 0.0, blue: 0.18),
                    Color(red: 0.06, green: 0.0, blue: 0.14),
                    Color.black,
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Loose scattered neon sparkles far from the card area
            ForEach(0..<16, id: \.self) { i in
                let seed = Double(i)
                let x = CGFloat(sin(seed * 2.3)) * 480
                let y = CGFloat(cos(seed * 1.7)) * 880
                let size: CGFloat = 28 + CGFloat(seed.truncatingRemainder(dividingBy: 5)) * 14
                let green = i.isMultiple(of: 3)
                Image(uiImage: EKKOStarSprite.image(size: 96, variant: .simple))
                    .renderingMode(.template)
                    .resizable()
                    .frame(width: size, height: size)
                    .foregroundStyle(
                        green
                        ? Color(red: 0.0, green: 1.0, blue: 0.32).opacity(0.35)
                        : Color(red: 1.0, green: 0.08, blue: 0.56).opacity(0.35)
                    )
                    .offset(x: x, y: y)
            }
        }
    }

    // MARK: Profile Card

    private var profileCard: some View {
        hero
            // Fill the card frame end-to-end — no dead padding around the photo
            .frame(width: 940, height: 1345)
            .clipped()
            .overlay(alignment: .bottom) {
                LinearGradient(
                    colors: [.clear, .black.opacity(0.45), .black.opacity(0.85)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: 480)
                .allowsHitTesting(false)
            }
            .overlay(alignment: .bottomLeading) {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(spacing: 14) {
                        Text(displayName)
                            .font(.custom(EKKOFont.regular, size: 72))
                            .foregroundStyle(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.6)
                        if isInfinite {
                            Image(systemName: "infinity")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundStyle(Color(red: 0.85, green: 0.0, blue: 1.0))
                                .padding(.horizontal, 14)
                                .padding(.vertical, 6)
                                .background(Color(red: 0.85, green: 0.0, blue: 1.0).opacity(0.18))
                                .clipShape(Capsule())
                        }
                    }
                    if let headline, !headline.isEmpty {
                        Text(headline)
                            .font(.system(size: 40, weight: .regular))
                            .foregroundStyle(.white.opacity(0.88))
                            .lineLimit(2)
                    }
                    if let location, !location.isEmpty {
                        HStack(spacing: 8) {
                            Image(systemName: "mappin")
                                .font(.system(size: 26, weight: .semibold))
                            Text(location)
                                .font(.system(size: 30, weight: .regular))
                        }
                        .foregroundStyle(.white.opacity(0.72))
                    }
                }
                .padding(40)
            }
            .clipShape(RoundedRectangle(cornerRadius: 36, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 36, style: .continuous)
                    .stroke(
                        LinearGradient(
                            colors: [
                                Color(red: 0.0, green: 1.0, blue: 0.32).opacity(0.7),
                                Color(red: 1.0, green: 0.08, blue: 0.56).opacity(0.7),
                                Color(red: 0.85, green: 0.0, blue: 1.0).opacity(0.7),
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 4
                    )
            )
            // Watermark lives OUTSIDE the clipShape so it can straddle the
            // top-left corner — most of the foil sits on the backdrop with
            // just its tail breaking into the hero.
            .overlay(alignment: .topLeading) {
                holographicWatermark
                    .frame(width: 520)
                    .offset(x: -120, y: -180)
                    .allowsHitTesting(false)
            }
            .shadow(color: Color(red: 1.0, green: 0.08, blue: 0.56).opacity(0.4), radius: 40, y: 20)
    }

    /// Passport-style holographic wordmark stamp. Three compositing layers:
    ///
    /// 1. Base chrome image (already silver/blue in the PNG) — `.screen` blend
    ///    so it brightens the underlying hero pixels rather than looking
    ///    pasted on top.
    /// 2. Iridescent rainbow gradient masked to the image's alpha — creates
    ///    the angle-shift sheen you see on holograms when light catches them.
    /// 3. A white diagonal highlight band, masked to the image — the "wet
    ///    reflection" streak across a passport hologram.
    ///
    /// A slight rotation keeps it from reading as a logo plate and more like
    /// a stamped foil.
    private var holographicWatermark: some View {
        ZStack {
            // 1. Base chrome layer — lifts the hero where the logo sits.
            Image("EkkoWordmark")
                .resizable()
                .scaledToFit()
                .opacity(0.45)
                .blendMode(.screen)

            // 2. Iridescent tint — magenta → violet → cyan → lime → gold,
            // clipped to the wordmark's shape.
            LinearGradient(
                stops: [
                    .init(color: Color(red: 1.00, green: 0.35, blue: 0.75), location: 0.00),
                    .init(color: Color(red: 0.60, green: 0.30, blue: 1.00), location: 0.25),
                    .init(color: Color(red: 0.30, green: 0.90, blue: 1.00), location: 0.50),
                    .init(color: Color(red: 0.45, green: 1.00, blue: 0.55), location: 0.75),
                    .init(color: Color(red: 1.00, green: 0.85, blue: 0.35), location: 1.00),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .mask(
                Image("EkkoWordmark")
                    .resizable()
                    .scaledToFit()
            )
            .blendMode(.screen)
            .opacity(0.4)

            // 3. Sweeping diagonal highlight — the "reflection" band.
            LinearGradient(
                stops: [
                    .init(color: .white.opacity(0.0), location: 0.35),
                    .init(color: .white.opacity(0.9), location: 0.50),
                    .init(color: .white.opacity(0.0), location: 0.65),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .mask(
                Image("EkkoWordmark")
                    .resizable()
                    .scaledToFit()
            )
            .blendMode(.plusLighter)
            .opacity(0.35)
        }
        .rotationEffect(.degrees(-3))
        .shadow(color: .white.opacity(0.2), radius: 12)
    }

    @ViewBuilder
    private var hero: some View {
        // No inner frame — caller sizes this via `.frame(width:height:)` and
        // `scaledToFill` expands the image to match. Previously a hardcoded
        // 880×1260 here was leaving black borders inside the 940×1345 card.
        if let img = heroImage {
            Image(uiImage: img)
                .resizable()
                .scaledToFill()
        } else if let avatar = avatarImage {
            Image(uiImage: avatar)
                .resizable()
                .scaledToFill()
        } else {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.20, green: 0.10, blue: 0.40),
                        Color(red: 0.40, green: 0.10, blue: 0.55),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Text(String(displayName.prefix(1)).uppercased())
                    .font(.custom(EKKOFont.regular, size: 300))
                    .foregroundStyle(.white.opacity(0.2))
            }
        }
    }
}

// MARK: - Render helper

/// Renders the share card to a 1080×1920 PNG suitable for Instagram Stories.
/// Preloads hero + avatar over the wire so the export isn't ever stuck on the
/// letter fallback when the user has real media.
@MainActor
enum ProfileShareRenderer {
    static func render(
        displayName: String,
        username: String?,
        headline: String?,
        location: String?,
        isInfinite: Bool,
        heroUrl: String?,
        avatarUrl: String?
    ) async -> UIImage? {
        async let hero = loadImage(from: heroUrl)
        async let avatar = loadImage(from: avatarUrl)
        let (heroImg, avatarImg) = await (hero, avatar)

        let view = ProfileShareCard(
            displayName: displayName,
            username: username,
            headline: headline,
            location: location,
            isInfinite: isInfinite,
            heroImage: heroImg,
            avatarImage: avatarImg
        )
        let renderer = ImageRenderer(content: view)
        renderer.scale = 1
        renderer.proposedSize = .init(width: 1080, height: 1920)
        return renderer.uiImage
    }

    private static func loadImage(from urlString: String?) async -> UIImage? {
        guard let urlString, let url = URL(string: urlString) else { return nil }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            return UIImage(data: data)
        } catch {
            return nil
        }
    }
}

// MARK: - Instagram Stories share

/// Hands a pre-rendered background image to Instagram via its sticker URL
/// scheme. Falls back gracefully when IG isn't installed (caller should
/// check `isInstalled` first and route to the generic share sheet).
@MainActor
enum InstagramStoriesShare {
    private static let sourceApp = "app.ekkoconnect.connect"
    private static let contentURL = "https://ekkoconnect.app"

    static var isInstalled: Bool {
        guard let url = URL(string: "instagram-stories://share") else { return false }
        return UIApplication.shared.canOpenURL(url)
    }

    @discardableResult
    static func share(backgroundImage: UIImage) -> Bool {
        guard let url = URL(string: "instagram-stories://share?source_application=\(sourceApp)"),
              UIApplication.shared.canOpenURL(url),
              let pngData = backgroundImage.pngData() else {
            return false
        }

        let items: [[String: Any]] = [[
            "com.instagram.sharedSticker.backgroundImage": pngData,
            "com.instagram.sharedSticker.contentURL": contentURL,
        ]]
        UIPasteboard.general.setItems(
            items,
            options: [.expirationDate: Date().addingTimeInterval(60 * 5)]
        )
        UIApplication.shared.open(url)
        return true
    }
}

// MARK: - Share Sheet
//
// Carousel over every variant in `ShareCardSlug`: the EKKO-branded default
// (the screenshot-style card above) + the 8 designer-supplied poster variants
// ported from share-cards/. Each page renders the card live at a scaled-down
// preview; when the user stops on one, a full 1080×1920 PNG is generated in
// the background for the share buttons below.

struct ProfileShareSheet: View {
    let displayName: String
    let username: String?
    let headline: String?
    let location: String?
    let isInfinite: Bool
    let heroUrl: String?
    let avatarUrl: String?
    /// Connect-profile fields the poster variants read directly. Pass nil to
    /// fall back to safe defaults.
    var bio: String? = nil
    var lookingFor: String? = nil
    var likes: Int = 0
    var matches: Int = 0
    var projects: Int = 0
    /// Optional custom accent color (hex). nil falls back to sakura pink.
    var accentHex: String? = nil

    @Environment(\.dismiss) private var dismiss
    @State private var selected: ShareCardSlug = .defaultCard
    @State private var heroImage: UIImage?
    @State private var avatarImage: UIImage?
    @State private var renderedImage: UIImage?
    @State private var isRendering = false
    @State private var mediaLoaded = false

    private var accent: Color? {
        guard let hex = accentHex, let ui = UIColor(hexString: hex) else { return nil }
        return Color(ui)
    }

    private var shareProfile: ShareProfile {
        let handle = username.map { "@\($0)" } ?? "@you"
        return ShareProfile(
            name: displayName,
            handle: handle,
            role: headline ?? "Creative",
            location: location ?? "",
            status: .active,
            about: bio ?? headline ?? "On EKKO.",
            currentProject: lookingFor ?? headline ?? "On EKKO",
            skills: [],
            stats: .init(
                matches: matches,
                likes: likes,
                projects: max(projects, 1),
                followers: ""
            ),
            heroImage: heroImage,
            avatarImage: avatarImage,
            isInfinite: isInfinite
        )
    }

    private var legacyPayload: ShareCardView.LegacyPayload {
        .init(
            displayName: displayName,
            username: username,
            headline: headline,
            location: location,
            isInfinite: isInfinite
        )
    }

    var body: some View {
        VStack(spacing: 16) {
            Capsule()
                .fill(.tertiary)
                .frame(width: 40, height: 5)
                .padding(.top, 8)

            Text("Share your profile")
                .font(.custom(EKKOFont.regular, size: 24))

            // Carousel — one page per variant
            GeometryReader { geo in
                TabView(selection: $selected) {
                    ForEach(ShareCardSlug.allCases) { slug in
                        previewCell(for: slug, width: geo.size.width)
                            .tag(slug)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .frame(height: 540)

            // Dots + label
            VStack(spacing: 6) {
                HStack(spacing: 6) {
                    ForEach(ShareCardSlug.allCases) { slug in
                        Circle()
                            .fill(slug == selected ? Color.accentColor : Color.secondary.opacity(0.3))
                            .frame(width: 6, height: 6)
                    }
                }
                Text(selected.label)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(.secondary)
            }

            Spacer(minLength: 4)

            VStack(spacing: 10) {
                if InstagramStoriesShare.isInstalled {
                    Button { shareToInstagram() } label: {
                        HStack(spacing: 10) {
                            if isRendering && renderedImage == nil {
                                ProgressView().tint(.white).controlSize(.small)
                            } else {
                                Image(systemName: "camera.fill")
                            }
                            Text("Share to Instagram Story")
                        }
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.95, green: 0.30, blue: 0.55),
                                    Color(red: 0.60, green: 0.18, blue: 0.85),
                                ],
                                startPoint: .leading, endPoint: .trailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }
                    .disabled(renderedImage == nil)
                }

                if let img = renderedImage {
                    ShareLink(
                        item: Image(uiImage: img),
                        preview: SharePreview(
                            "\(displayName) on EKKO",
                            image: Image(uiImage: img)
                        )
                    ) {
                        HStack(spacing: 10) {
                            Image(systemName: "square.and.arrow.up")
                            Text("Share elsewhere")
                        }
                        .font(.headline)
                        .foregroundStyle(.primary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
                        )
                    }
                } else {
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(.ultraThinMaterial)
                        .frame(height: 56)
                        .overlay(ProgressView())
                }

                Button("Cancel") { dismiss() }
                    .foregroundStyle(.secondary)
                    .padding(.top, 4)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .task {
            await loadMedia()
            rerender()
        }
        .onChange(of: selected) { _, _ in
            rerender()
        }
    }

    // MARK: Preview cell

    @ViewBuilder
    private func previewCell(for slug: ShareCardSlug, width: CGFloat) -> some View {
        // Show the exported PNG for the selected slug when available
        // (eliminates the scaled-down SwiftUI paint for that page), but always
        // paint adjacent pages live so the swipe feels instant.
        ZStack {
            if slug == selected, let img = renderedImage {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFit()
            } else {
                let targetWidth = width - 80
                let scale = targetWidth / 1080
                ShareCardView(
                    slug: slug,
                    profile: shareProfile,
                    accent: accent,
                    legacy: slug == .defaultCard ? legacyPayload : nil
                )
                .scaleEffect(scale, anchor: .topLeading)
                .frame(width: 1080 * scale, height: 1920 * scale, alignment: .topLeading)
                .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                .overlay(alignment: .center) {
                    if slug == selected && isRendering {
                        Color.black.opacity(0.15)
                            .overlay(ProgressView().tint(.white))
                    }
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .shadow(color: .black.opacity(0.4), radius: 18, y: 10)
    }

    // MARK: Media load

    private func loadMedia() async {
        async let hero = Self.fetch(urlString: heroUrl)
        async let avatar = Self.fetch(urlString: avatarUrl)
        let (h, a) = await (hero, avatar)
        heroImage = h
        avatarImage = a
        mediaLoaded = true
    }

    private static func fetch(urlString: String?) async -> UIImage? {
        guard let s = urlString, let url = URL(string: s) else { return nil }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            return UIImage(data: data)
        } catch { return nil }
    }

    // MARK: Render

    private func rerender() {
        guard mediaLoaded else { return }
        let slug = selected
        let profile = shareProfile
        let legacy = legacyPayload
        let resolvedAccent = accent
        isRendering = true
        renderedImage = nil
        // Hop off the current run-loop tick so the scaled-down live view has
        // a chance to paint the switch before the renderer hogs the main
        // actor for ~100ms producing a 1080×1920 bitmap.
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 20_000_000)
            guard slug == selected else { return }
            let img = ShareCardRenderer.render(
                slug: slug,
                profile: profile,
                accent: resolvedAccent,
                legacy: slug == .defaultCard ? legacy : nil
            )
            guard slug == selected else { return }
            renderedImage = img
            isRendering = false
        }
    }

    // MARK: Share

    private func shareToInstagram() {
        guard let img = renderedImage else { return }
        if InstagramStoriesShare.share(backgroundImage: img) {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            dismiss()
        }
    }
}

// MARK: - UIColor hex helper

private extension UIColor {
    convenience init?(hexString: String) {
        var s = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("#") { s.removeFirst() }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(
            red:   CGFloat((v >> 16) & 0xff) / 255,
            green: CGFloat((v >> 8)  & 0xff) / 255,
            blue:  CGFloat( v        & 0xff) / 255,
            alpha: 1
        )
    }
}
