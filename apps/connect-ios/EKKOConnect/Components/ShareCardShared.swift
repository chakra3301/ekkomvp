import SwiftUI
import UIKit

// Shared vocabulary for the 8 designer-supplied share cards, ported from
// share-cards/shared.tsx. The originals live at
// /Users/lucaorion/Downloads/design_handoff_ekko_profile 2/share-cards/
//
// Every card consumes the same `ShareProfile` and renders inside a fixed
// 1080×1920 frame. Use `ShareCardScaledCanvas` to preview them scaled to fit a
// container; use an offscreen `ImageRenderer` at scale 1 to export PNGs.

// MARK: - Data

struct ShareProfile {
    enum Status: String { case active, paused, focusing }

    struct Stats {
        let matches: Int
        let likes: Int
        let projects: Int
        let followers: String
    }

    let name: String
    let handle: String
    let role: String
    let location: String
    let status: Status
    let about: String
    let currentProject: String
    let skills: [String]
    let stats: Stats

    /// Hero / portrait image used by cards that show a photo (trading card,
    /// manga, poster, VHS). Falls back to the CoverPlaceholder painting when
    /// absent.
    let heroImage: UIImage?
    /// Small avatar used by cards that want a rounded crop (default card).
    let avatarImage: UIImage?
    /// Whether this user is on the INFINITE tier — shown as an infinity badge
    /// on the default card.
    let isInfinite: Bool

    static let sakura = Color(red: 1.0, green: 0.239, blue: 0.604)  // #FF3D9A
}

enum ShareCardJP {
    static let name = "ノヴァ・ワールド"
    static let role = "創造技術者"
}

// MARK: - Fonts

// React uses Zen Antique / JetBrains Mono / Noto Sans JP. We don't ship those,
// so map Zen Antique → Arches (the app's existing display face) and JBM →
// system monospaced. Noto Sans JP characters render fine under the system
// font on iOS.
enum ShareCardFont {
    static func display(_ size: CGFloat, italic: Bool = false) -> Font {
        .custom(italic ? EKKOFont.italic : EKKOFont.regular, size: size)
    }
    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .monospaced)
    }
    static func sans(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }
    /// Noto Sans JP analogue — system is fine on iOS.
    static func jp(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight)
    }
}

extension View {
    /// Convert CSS `letter-spacing: Xem` to SwiftUI `.kerning`, measured in
    /// points against the font size you just set.
    func spacingEm(_ em: CGFloat, size: CGFloat) -> some View {
        self.kerning(em * size)
    }
}

// MARK: - Canvas wrapper

/// Renders any 1080×1920 card scaled into a container. Preserves the
/// rounded-corner clip the React `CardCanvas` applied.
struct ShareCardScaledCanvas<Content: View>: View {
    var scale: CGFloat = 1
    var background: Color = Color(red: 0.039, green: 0.039, blue: 0.055)
    @ViewBuilder let content: () -> Content

    var body: some View {
        content()
            .frame(width: 1080, height: 1920)
            .background(background)
            .scaleEffect(scale, anchor: .topLeading)
            .frame(width: 1080 * scale, height: 1920 * scale, alignment: .topLeading)
            .clipShape(RoundedRectangle(cornerRadius: 24 * scale, style: .continuous))
    }
}

// MARK: - Wordmark typed

struct EkkoTypedLabel: View {
    var size: CGFloat = 28
    /// CSS em tracking. 0.35em → kerning = size * 0.35.
    var spacingEm: CGFloat = 0.35
    var color: Color = Color(red: 0.953, green: 0.953, blue: 0.941)

    var body: some View {
        Text("ekko")
            .font(ShareCardFont.display(size, italic: true))
            .kerning(size * spacingEm)
            .foregroundStyle(color)
    }
}

// MARK: - Cover placeholder

/// Port of `CoverPlaceholder` from shared.tsx. Renders a radial gradient with
/// dot texture, optional anime silhouette + speed lines, and 14 sparkle
/// motifs. When a `heroImage` is supplied the painting is skipped and the
/// image fills the space — every card that called `<CoverPlaceholder/>` in
/// the React sources forwards the user's photo here.
struct ShareCoverPlaceholder: View {
    let color: Color
    let color2: Color
    var seed: Int = 1
    var anime: Bool = true
    var heroImage: UIImage? = nil

    private func r(_ n: Int) -> Double {
        (sin(Double(seed) * 9301 + Double(n) * 49297) + 1) / 2
    }

    var body: some View {
        GeometryReader { geo in
            let size = geo.size
            ZStack {
                if let heroImage {
                    Image(uiImage: heroImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: size.width, height: size.height)
                        .clipped()
                } else {
                    RadialGradient(
                        colors: [color.opacity(0.333), color2, .black],
                        center: UnitPoint(x: 0.3, y: 0.4),
                        startRadius: 0,
                        endRadius: max(size.width, size.height) * 0.9
                    )

                    Canvas { ctx, sz in
                        let step: CGFloat = 5 * sz.width / 100
                        var y: CGFloat = 0
                        while y <= sz.height {
                            var x: CGFloat = 0
                            while x <= sz.width {
                                ctx.fill(
                                    Path(ellipseIn: CGRect(x: x, y: y, width: 1.2, height: 1.2)),
                                    with: .color(color.opacity(0.25))
                                )
                                x += step
                            }
                            y += step
                        }
                    }
                    .blendMode(.screen)
                    .opacity(0.55)

                    if anime {
                        Canvas { ctx, sz in
                            for i in 0..<22 {
                                let yPct = (Double(i) / 22) * 100 + r(i) * 4
                                let wPct = r(i + 300) * 30 + 10
                                let y1 = CGFloat(yPct / 100) * sz.height
                                let x1 = CGFloat((100 - wPct) / 100) * sz.width
                                let y2 = y1 + (2.0 / 100) * sz.height
                                var p = Path()
                                p.move(to: CGPoint(x: x1, y: y1))
                                p.addLine(to: CGPoint(x: sz.width, y: y2))
                                ctx.stroke(p, with: .color(color), lineWidth: 0.4 * sz.height / 100)
                            }
                        }
                        .blendMode(.screen)
                        .opacity(0.35)

                        Canvas { ctx, sz in
                            let sx: (Double) -> CGFloat = { CGFloat($0 / 100) * sz.width }
                            let sy: (Double) -> CGFloat = { CGFloat($0 / 100) * sz.height }
                            var face = Path()
                            face.move(to: CGPoint(x: sx(36), y: sy(55)))
                            face.addQuadCurve(to: CGPoint(x: sx(42), y: sy(30)),
                                              control: CGPoint(x: sx(32), y: sy(40)))
                            face.addQuadCurve(to: CGPoint(x: sx(58), y: sy(30)),
                                              control: CGPoint(x: sx(50), y: sy(22)))
                            face.addQuadCurve(to: CGPoint(x: sx(64), y: sy(55)),
                                              control: CGPoint(x: sx(68), y: sy(40)))
                            face.addQuadCurve(to: CGPoint(x: sx(68), y: sy(80)),
                                              control: CGPoint(x: sx(70), y: sy(62)))
                            face.addLine(to: CGPoint(x: sx(32), y: sy(80)))
                            face.addQuadCurve(to: CGPoint(x: sx(36), y: sy(55)),
                                              control: CGPoint(x: sx(30), y: sy(62)))
                            face.closeSubpath()
                            ctx.fill(face, with: .color(color2.opacity(0.85)))
                            ctx.stroke(face, with: .color(color), lineWidth: 0.3 * sz.height / 100)

                            let eyeR: CGFloat = 1.4 / 100 * sz.width
                            ctx.fill(Path(ellipseIn: CGRect(
                                x: sx(44) - eyeR, y: sy(42) - eyeR, width: eyeR * 2, height: eyeR * 2
                            )), with: .color(color))
                            ctx.fill(Path(ellipseIn: CGRect(
                                x: sx(56) - eyeR, y: sy(42) - eyeR, width: eyeR * 2, height: eyeR * 2
                            )), with: .color(color))
                        }
                        .opacity(0.55)
                    }
                }

                Canvas { ctx, sz in
                    for i in 0..<14 {
                        let x = r(i) * Double(sz.width)
                        let y = r(i + 50) * Double(sz.height)
                        let s = (r(i + 100) * 1.4 + 0.4) * Double(sz.height) / 100
                        let rot = r(i + 200) * 360
                        var sub = ctx
                        sub.translateBy(x: x, y: y)
                        sub.rotate(by: .degrees(rot))
                        sub.scaleBy(x: s, y: s)
                        var p = Path()
                        p.move(to: CGPoint(x: 0, y: -3))
                        p.addLine(to: CGPoint(x: 0.6, y: -0.6))
                        p.addLine(to: CGPoint(x: 3, y: 0))
                        p.addLine(to: CGPoint(x: 0.6, y: 0.6))
                        p.addLine(to: CGPoint(x: 0, y: 3))
                        p.addLine(to: CGPoint(x: -0.6, y: 0.6))
                        p.addLine(to: CGPoint(x: -3, y: 0))
                        p.addLine(to: CGPoint(x: -0.6, y: -0.6))
                        p.closeSubpath()
                        sub.fill(p, with: .color(.white.opacity(0.85)))
                        sub.fill(
                            Path(ellipseIn: CGRect(x: -0.4, y: -0.4, width: 0.8, height: 0.8)),
                            with: .color(color)
                        )
                    }
                }
            }
            .frame(width: size.width, height: size.height)
        }
    }
}

// MARK: - Demo profile (previews)

extension ShareProfile {
    static var demo: ShareProfile {
        ShareProfile(
            name: "NOVA.WRLD",
            handle: "@novawrld",
            role: "Creative Technologist",
            location: "Brooklyn, NY",
            status: .active,
            about: "Building strange interfaces for stranger people.",
            currentProject: "Dead Signals",
            skills: ["Creative Code", "Three.js", "Type Design"],
            stats: .init(matches: 142, likes: 2847, projects: 17, followers: "3.4k"),
            heroImage: nil,
            avatarImage: nil,
            isInfinite: false
        )
    }
}
