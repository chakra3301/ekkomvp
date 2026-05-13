import SwiftUI

// Card 9 · Chrome 3D
// Hero portrait at top with a vertical Japanese tagline + pink sparkle motif
// overlaid, a chrome EKKO wordmark straddling the seam, and an author row
// (avatar + name + handle + caption) below over a deep navy ground. Port of
// the user's Figma design at file iB57CgwNCeNpu027ayzRaF (node 1:27).
// Rendered at 1080×1920.

struct Chrome3DShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura  // unused — fixed chrome treatment

    private static let bg = Color(red: 0.039, green: 0.039, blue: 0.059)

    var body: some View {
        ZStack(alignment: .topLeading) {
            Self.bg

            // 1. Hero region — 1080×1162 rounded panel, with chrome decoration
            //    overlaid (vertical JP text on the right column + pink sparkle
            //    in the upper-right).
            heroRegion
                .figmaAt(0, 0, width: 1080, height: 1162)

            // 2. Chrome wordmark — straddles the bottom of the hero region into
            //    the author-row area. Sits BEHIND the author text (drawn before
            //    it in the ZStack).
            Image("Chrome3DWordmark")
                .resizable()
                .scaledToFit()
                .figmaAt(-51, 795, width: 1181, height: 615)

            // 3. Author row
            avatar
                .figmaAt(40, 1320, width: 96, height: 96)

            Text(profile.name)
                .font(.system(size: 44, weight: .semibold))
                .foregroundStyle(.white)
                .lineLimit(1)
                .fixedSize()
                .figmaAt(160, 1330)

            Text(profile.handle)
                .font(.system(size: 32, weight: .medium))
                .foregroundStyle(.white.opacity(0.5))
                .lineLimit(1)
                .fixedSize()
                .figmaAt(160, 1390)

            // 4. Caption — bio (preferred) or headline. Two-line cap.
            Text(captionText)
                .font(.system(size: 36, weight: .regular))
                .foregroundStyle(.white.opacity(0.85))
                .lineLimit(2)
                .multilineTextAlignment(.leading)
                .frame(width: 1000, alignment: .topLeading)
                .figmaAt(40, 1480)

            // 5. E-logo at bottom center
            Image("Chrome3DELogo")
                .resizable()
                .scaledToFit()
                .figmaAt(471, 1789, width: 138, height: 138)
        }
        .frame(width: 1080, height: 1920, alignment: .topLeading)
        .background(Self.bg)
    }

    // MARK: Pieces

    private var heroRegion: some View {
        ZStack(alignment: .topLeading) {
            heroFill

            // Pink sparkle (upper right of hero region)
            Image("Chrome3DSparkle")
                .resizable()
                .scaledToFit()
                .figmaAt(766, 64, width: 140, height: 211)

            // Vertical Japanese tagline (far right column of hero region)
            Image("Chrome3DJpText")
                .resizable()
                .scaledToFit()
                .figmaAt(978, 64, width: 43, height: 646)
        }
        .frame(width: 1080, height: 1162, alignment: .topLeading)
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
    }

    @ViewBuilder
    private var heroFill: some View {
        if let hero = profile.heroImage {
            Image(uiImage: hero)
                .resizable()
                .scaledToFill()
                .frame(width: 1080, height: 1162)
                .clipped()
        } else if let av = profile.avatarImage {
            Image(uiImage: av)
                .resizable()
                .scaledToFill()
                .frame(width: 1080, height: 1162)
                .clipped()
        } else {
            ShareCoverPlaceholder(color: accent, color2: Self.bg)
                .frame(width: 1080, height: 1162)
        }
    }

    private var avatar: some View {
        Group {
            if let img = profile.avatarImage {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFill()
            } else {
                ZStack {
                    Color(red: 0.15, green: 0.15, blue: 0.18)
                    Text(String(profile.name.prefix(1)).uppercased())
                        .font(.system(size: 36, weight: .bold))
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
        }
        .frame(width: 96, height: 96)
        .clipShape(Circle())
    }

    private var captionText: String {
        let raw = profile.about.isEmpty ? profile.role : profile.about
        return raw.isEmpty ? "On EKKO." : raw
    }
}

// MARK: - Figma absolute-position helpers

private extension View {
    /// Place top-left at (x, y) with explicit size (w, h). Inside a
    /// ZStack(alignment: .topLeading), the child sits at the ZStack's origin
    /// (0,0) and is then offset to (x, y).
    func figmaAt(_ x: CGFloat, _ y: CGFloat, width w: CGFloat, height h: CGFloat) -> some View {
        self
            .frame(width: w, height: h, alignment: .topLeading)
            .offset(x: x, y: y)
    }

    /// Place at (x, y) using the view's intrinsic size. Call after .fixedSize()
    /// (text) or on already-bounded views.
    func figmaAt(_ x: CGFloat, _ y: CGFloat) -> some View {
        self.offset(x: x, y: y)
    }
}

#Preview("Chrome 3D — with hero") {
    Chrome3DShareCard(profile: .demo)
        .scaleEffect(0.25, anchor: .topLeading)
        .frame(width: 270, height: 480)
}
