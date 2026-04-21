import SwiftUI

// Card 5 · Signal Transmission
// Radar + waveform poster. Port of 05-signal.tsx.

struct SignalShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura

    private let paper = Color(red: 0.953, green: 0.953, blue: 0.941)
    private let ink = Color(red: 0.039, green: 0.039, blue: 0.055)

    private var waveform: [CGFloat] {
        (0..<36).map { i in
            CGFloat(abs(sin(Double(i) * 0.32) * cos(Double(i) * 0.11)) * 280 + 40) * 0.25
        }
    }

    private var dateString: String {
        let f = DateFormatter()
        f.dateFormat = "yyyy.MM.dd"
        return f.string(from: Date())
    }

    var body: some View {
        ZStack {
            ink

            // Radar
            Radar(accent: accent)
                .frame(width: 900, height: 900)
                .position(x: 540, y: 720)
                .opacity(0.5)

            // Top header
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text("● LIVE · 88.7 FM")
                        .font(ShareCardFont.mono(18))
                        .kerning(18 * 0.4)
                        .foregroundStyle(accent)
                    Text("信号を受信しました")
                        .font(ShareCardFont.jp(14))
                        .kerning(14 * 0.3)
                        .foregroundStyle(paper.opacity(0.5))
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 6) {
                    Text(dateString)
                        .font(ShareCardFont.mono(14))
                        .kerning(14 * 0.3)
                        .foregroundStyle(paper.opacity(0.5))
                    Text("LAT 40.69 LNG -73.99")
                        .font(ShareCardFont.mono(14))
                        .kerning(14 * 0.3)
                        .foregroundStyle(paper.opacity(0.3))
                }
            }
            .padding(.horizontal, 80)
            .position(x: 540, y: 140)

            // Waveform bars
            HStack(alignment: .bottom, spacing: 3) {
                ForEach(Array(waveform.enumerated()), id: \.offset) { i, h in
                    Rectangle()
                        .fill(accent)
                        .opacity(i < 12 ? 1 : 0.3)
                        .frame(height: h)
                }
            }
            .frame(width: 920, height: 80, alignment: .bottom)
            .position(x: 540, y: 820)

            // Identity block
            VStack(spacing: 0) {
                Text("NOW BROADCASTING")
                    .font(ShareCardFont.mono(20))
                    .kerning(20 * 0.5)
                    .foregroundStyle(paper.opacity(0.5))
                    .padding(.bottom, 30)

                Text(profile.name)
                    .font(ShareCardFont.display(140))
                    .kerning(-140 * 0.03)
                    .foregroundStyle(paper)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)

                Text(profile.role.uppercased())
                    .font(ShareCardFont.mono(22))
                    .kerning(22 * 0.35)
                    .foregroundStyle(accent)
                    .padding(.top, 28)
            }
            .frame(width: 920)
            .position(x: 540, y: 1480)

            // Footer
            VStack(spacing: 0) {
                Rectangle().fill(.white.opacity(0.1)).frame(height: 1)
                HStack {
                    Text(profile.handle)
                        .font(ShareCardFont.mono(22))
                        .kerning(22 * 0.25)
                    Spacer()
                    EkkoTypedLabel(size: 30, color: paper.opacity(0.8))
                    Spacer()
                    Text("TUNE IN ↗")
                        .font(ShareCardFont.mono(18))
                        .kerning(18 * 0.3)
                        .opacity(0.5)
                }
                .foregroundStyle(paper)
                .padding(.top, 40)
            }
            .frame(width: 920)
            .position(x: 540, y: 1800)
        }
        .frame(width: 1080, height: 1920)
        .clipped()
    }
}

private struct Radar: View {
    let accent: Color
    var body: some View {
        GeometryReader { geo in
            let size = geo.size
            let cx = size.width / 2
            let cy = size.height / 2
            ZStack {
                // Center glow
                RadialGradient(
                    colors: [accent.opacity(0.4), .clear],
                    center: .center,
                    startRadius: 0,
                    endRadius: min(size.width, size.height) * 0.45
                )
                .frame(width: size.width * 0.95, height: size.height * 0.95)

                // Concentric rings
                ForEach([60.0, 120, 180, 240, 280], id: \.self) { r in
                    Circle()
                        .stroke(accent.opacity(0.3), lineWidth: 1)
                        .frame(width: CGFloat(r) * 2 * (size.width / 600),
                               height: CGFloat(r) * 2 * (size.width / 600))
                        .position(x: cx, y: cy)
                }

                // Diagonal lines
                Canvas { ctx, sz in
                    let r = min(sz.width, sz.height) * 0.47
                    for a in stride(from: 0.0, to: 180.0, by: 30) {
                        let rad = a * .pi / 180
                        var p = Path()
                        p.move(to: CGPoint(x: sz.width / 2 - r * cos(rad),
                                           y: sz.height / 2 - r * sin(rad)))
                        p.addLine(to: CGPoint(x: sz.width / 2 + r * cos(rad),
                                              y: sz.height / 2 + r * sin(rad)))
                        ctx.stroke(p, with: .color(accent.opacity(0.25)), lineWidth: 0.8)
                    }
                }

                // Sweep wedge (quarter turned 0-90°)
                Canvas { ctx, sz in
                    let r = min(sz.width, sz.height) * 0.47
                    var p = Path()
                    let c = CGPoint(x: sz.width / 2, y: sz.height / 2)
                    p.move(to: c)
                    p.addArc(center: c, radius: r, startAngle: .zero, endAngle: .degrees(45), clockwise: false)
                    p.closeSubpath()
                    ctx.fill(p, with: .color(accent.opacity(0.15)))
                }

                // Ping dots
                ForEach(0..<5, id: \.self) { i in
                    let coords: [(Double, Double)] = [(120, -40), (-80, 90), (160, 120), (-140, -60), (40, 180)]
                    let (x, y) = coords[i]
                    let scale = size.width / 600
                    Circle()
                        .fill(accent)
                        .frame(width: 8, height: 8)
                        .position(x: cx + CGFloat(x) * scale, y: cy + CGFloat(y) * scale)
                    Circle()
                        .stroke(accent.opacity(0.4), lineWidth: 1)
                        .frame(width: 24, height: 24)
                        .position(x: cx + CGFloat(x) * scale, y: cy + CGFloat(y) * scale)
                }
            }
        }
    }
}
