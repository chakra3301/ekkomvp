import SwiftUI

/// Chrome / iridescent badge rendered from a black-silhouette PNG. The
/// silhouette is treated as a template image; we fill it with an
/// AngularGradient that slowly rotates so light "moves" across the metal,
/// then add a static linear sheen for the brushed-chrome highlights.
///
/// Each variant carries its own accent palette so the three badges read
/// as different "metals":
///   • `.ceo` — cool steel with violet/cyan flares
///   • `.oa`  — warm gold / pink / amber (original artist)
///   • `.gm`  — green / teal / mint (mod)
///
/// Sizes are anchored on a target HEIGHT so the badges sit consistently
/// next to text regardless of aspect ratio (CEO is portrait, OA is square,
/// GM is taller-than-wide).
struct IridescentBadge: View {
    enum Variant {
        case ceo, oa, gm

        var imageName: String {
            switch self {
            case .ceo: return "BadgeCEO"
            case .oa:  return "BadgeOA"
            case .gm:  return "BadgeGM"
            }
        }

        /// Five-stop palette repeated around the angular gradient. Mixed of
        /// neutral chrome (white / silver / graphite) and the variant's
        /// signature accents — keeps the chrome reading as metal while
        /// each badge has a recognizable "color of light."
        var palette: [Color] {
            switch self {
            case .ceo:
                return [
                    Color.white,
                    Color(red: 0.78, green: 0.84, blue: 0.98),  // ice
                    Color(red: 0.62, green: 0.45, blue: 0.96),  // violet flare
                    Color(red: 0.30, green: 0.32, blue: 0.42),  // graphite
                    Color(red: 0.85, green: 0.92, blue: 1.00),  // light steel
                    Color.white,
                    Color(red: 0.45, green: 0.70, blue: 0.95),  // cool blue
                    Color(red: 0.92, green: 0.92, blue: 0.98),  // platinum
                ]
            case .oa:
                return [
                    Color(red: 1.00, green: 0.97, blue: 0.85),  // pale gold
                    Color(red: 0.98, green: 0.78, blue: 0.42),  // gold
                    Color(red: 1.00, green: 0.55, blue: 0.62),  // pink flare
                    Color(red: 0.40, green: 0.30, blue: 0.20),  // bronze graphite
                    Color(red: 1.00, green: 0.88, blue: 0.65),  // honey
                    Color.white,
                    Color(red: 0.95, green: 0.55, blue: 0.30),  // amber
                    Color(red: 1.00, green: 0.92, blue: 0.78),  // champagne
                ]
            case .gm:
                return [
                    Color.white,
                    Color(red: 0.65, green: 0.95, blue: 0.82),  // mint
                    Color(red: 0.18, green: 0.65, blue: 0.55),  // teal flare
                    Color(red: 0.20, green: 0.30, blue: 0.30),  // dark moss
                    Color(red: 0.78, green: 0.96, blue: 0.86),  // pale mint
                    Color.white,
                    Color(red: 0.30, green: 0.78, blue: 0.55),  // emerald
                    Color(red: 0.88, green: 0.96, blue: 0.92),  // silver-mint
                ]
            }
        }

        /// Subtle outer glow color so each badge "radiates" its own light
        /// onto the surrounding text without becoming a hard halo.
        var glow: Color {
            switch self {
            case .ceo: return Color(red: 0.45, green: 0.55, blue: 0.95)
            case .oa:  return Color(red: 1.00, green: 0.65, blue: 0.45)
            case .gm:  return Color(red: 0.30, green: 0.78, blue: 0.55)
            }
        }
    }

    let variant: Variant
    /// Target height in points. Aspect ratio honored from the source PNG.
    var height: CGFloat = 28

    @State private var angle: Double = 0
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        Image(variant.imageName)
            .renderingMode(.template)
            .resizable()
            .scaledToFit()
            .frame(height: height)
            .foregroundStyle(
                AngularGradient(
                    colors: variant.palette + [variant.palette.first ?? .white],
                    center: .center,
                    angle: .degrees(angle)
                )
            )
            // Static brushed-chrome sheen — highlights the upper-left,
            // shadows the lower-right, so even with the angular gradient
            // animation paused the badge reads as 3D metal.
            .overlay {
                Image(variant.imageName)
                    .renderingMode(.template)
                    .resizable()
                    .scaledToFit()
                    .frame(height: height)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                Color.white.opacity(0.85),
                                Color.clear,
                                Color.black.opacity(0.45),
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .blendMode(.overlay)
                    .allowsHitTesting(false)
            }
            .shadow(color: variant.glow.opacity(0.55), radius: 6)
            .shadow(color: variant.glow.opacity(0.30), radius: 14)
            .onAppear {
                // Respect Reduce Motion: the badge still renders its angular
                // chrome gradient + sheen statically; it just doesn't spin.
                // Matters because badges can appear many-at-once in feeds.
                guard !reduceMotion else { return }
                withAnimation(.linear(duration: 7).repeatForever(autoreverses: false)) {
                    angle = 360
                }
            }
            .accessibilityLabel(accessibilityLabel)
    }

    private var accessibilityLabel: String {
        switch variant {
        case .ceo: return "CEO badge"
        case .oa:  return "Original artist badge"
        case .gm:  return "Moderator badge"
        }
    }
}

#Preview {
    HStack(spacing: 24) {
        IridescentBadge(variant: .ceo, height: 56)
        IridescentBadge(variant: .oa,  height: 56)
        IridescentBadge(variant: .gm,  height: 56)
    }
    .padding(40)
    .background(Color.black)
}
