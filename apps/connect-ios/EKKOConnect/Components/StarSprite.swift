import UIKit

/// Diffraction-spike star image used across the app (globe pins, purchase
/// celebration, active-now indicator). White on clear so consumers can tint
/// it via material or .foregroundStyle.
///
/// Rendered once per (size, variant) combination and cached.
enum EKKOStarSprite {

    enum Variant {
        /// Full 4-spike star with diagonals — the "hero" look.
        case detailed
        /// 2-spike cross, minimal — for tiny indicators where diagonals muddy.
        case simple
    }

    static func image(size: CGFloat = 128, variant: Variant = .detailed) -> UIImage {
        let key = "\(Int(size))-\(variant)"
        if let cached = cache[key] { return cached }
        let img = render(size: size, variant: variant)
        cache[key] = img
        return img
    }

    // MARK: - Private

    nonisolated(unsafe) private static var cache: [String: UIImage] = [:]

    private static func render(size: CGFloat, variant: Variant) -> UIImage {
        let dim = CGSize(width: size, height: size)
        let fmt = UIGraphicsImageRendererFormat()
        fmt.scale = 2
        fmt.opaque = false
        let renderer = UIGraphicsImageRenderer(size: dim, format: fmt)
        return renderer.image { ctx in
            let cg = ctx.cgContext
            let center = CGPoint(x: size / 2, y: size / 2)
            let space = CGColorSpaceCreateDeviceRGB()

            // Radial core glow — bright white fading to transparent
            let coreColors = [
                UIColor.white.cgColor,
                UIColor.white.withAlphaComponent(0.6).cgColor,
                UIColor.white.withAlphaComponent(0).cgColor,
            ] as CFArray
            let coreGrad = CGGradient(colorsSpace: space, colors: coreColors, locations: [0, 0.3, 1])!
            cg.drawRadialGradient(
                coreGrad,
                startCenter: center, startRadius: 0,
                endCenter: center, endRadius: size * 0.18,
                options: []
            )

            // Spike drawing helper — tapered both ends via linear gradient on a
            // thin clipped quad so the line itself fades out at the tips.
            cg.setBlendMode(.plusLighter)
            func spike(angle: CGFloat, length: CGFloat, width: CGFloat) {
                let dx = cos(angle) * length
                let dy = sin(angle) * length
                let p0 = CGPoint(x: center.x - dx, y: center.y - dy)
                let p1 = CGPoint(x: center.x + dx, y: center.y + dy)
                let grad = CGGradient(
                    colorsSpace: space,
                    colors: [
                        UIColor.white.withAlphaComponent(0).cgColor,
                        UIColor.white.withAlphaComponent(0.9).cgColor,
                        UIColor.white.withAlphaComponent(0).cgColor,
                    ] as CFArray,
                    locations: [0, 0.5, 1]
                )!
                cg.saveGState()
                let perpX = -sin(angle) * width / 2
                let perpY = cos(angle) * width / 2
                let path = UIBezierPath()
                path.move(to: CGPoint(x: p0.x + perpX, y: p0.y + perpY))
                path.addLine(to: CGPoint(x: p1.x + perpX, y: p1.y + perpY))
                path.addLine(to: CGPoint(x: p1.x - perpX, y: p1.y - perpY))
                path.addLine(to: CGPoint(x: p0.x - perpX, y: p0.y - perpY))
                path.close()
                cg.addPath(path.cgPath)
                cg.clip()
                cg.drawLinearGradient(grad, start: p0, end: p1, options: [])
                cg.restoreGState()
            }

            let longLen = size * 0.45
            let shortLen = size * 0.23
            let thick = size * 0.02
            let thin = size * 0.012

            spike(angle: 0,             length: longLen, width: thick)   // horizontal
            spike(angle: .pi / 2,       length: longLen, width: thick)   // vertical

            if variant == .detailed {
                spike(angle: .pi / 4,       length: shortLen, width: thin)
                spike(angle: 3 * .pi / 4,   length: shortLen, width: thin)
            }
        }
    }
}
