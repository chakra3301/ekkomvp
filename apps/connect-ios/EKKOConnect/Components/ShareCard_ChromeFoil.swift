import SwiftUI

// Card 1 · Chrome Foil
// Minimal. Huge chrome wordmark over a black void. Port of
// 01-chrome-foil.tsx. Rendered at 1080×1920.

struct ChromeFoilShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura

    var body: some View {
        ZStack {
            RadialGradient(
                colors: [Color(red: 0.094, green: 0.094, blue: 0.118), .black],
                center: UnitPoint(x: 0.5, y: 0.4),
                startRadius: 0, endRadius: 1400
            )

            // Faint 60px grid
            Canvas { ctx, size in
                let step: CGFloat = 60
                var x: CGFloat = 0
                while x < size.width {
                    var p = Path()
                    p.move(to: CGPoint(x: x, y: 0))
                    p.addLine(to: CGPoint(x: x, y: size.height))
                    ctx.stroke(p, with: .color(.white.opacity(0.03)), lineWidth: 1)
                    x += step
                }
                var y: CGFloat = 0
                while y < size.height {
                    var p = Path()
                    p.move(to: CGPoint(x: 0, y: y))
                    p.addLine(to: CGPoint(x: size.width, y: y))
                    ctx.stroke(p, with: .color(.white.opacity(0.03)), lineWidth: 1)
                    y += step
                }
            }

            // Corner reg marks
            ForEach(0..<4, id: \.self) { i in
                let top = i < 2
                let leftSide = i.isMultiple(of: 2)
                RegMark(top: top, leftSide: leftSide)
                    .stroke(Color.white.opacity(0.25), lineWidth: 1)
                    .frame(width: 40, height: 40)
                    .position(
                        x: leftSide ? 80 : 1000,
                        y: top ? 80 : 1840
                    )
            }

            // Top label
            Text("● TRANSMISSION RECEIVED")
                .font(ShareCardFont.mono(22))
                .kerning(22 * 0.5)
                .foregroundStyle(.white.opacity(0.4))
                .frame(maxWidth: .infinity)
                .position(x: 540, y: 100)

            // Chrome wordmark centerpiece
            Image("EkkoWordmark")
                .resizable()
                .scaledToFit()
                .frame(width: 820)
                .shadow(color: .white.opacity(0.15), radius: 20)
                .position(x: 540, y: 820)

            // Handle plate
            VStack(spacing: 0) {
                Text(profile.name)
                    .font(ShareCardFont.display(96))
                    .kerning(-96 * 0.02)
                    .foregroundStyle(Color(red: 0.953, green: 0.953, blue: 0.941))

                Text(profile.role.uppercased())
                    .font(ShareCardFont.mono(26))
                    .kerning(26 * 0.3)
                    .foregroundStyle(accent)
                    .padding(.top, 20)

                Text("\(ShareCardJP.role) · \(profile.location)")
                    .font(ShareCardFont.jp(18))
                    .kerning(18 * 0.3)
                    .foregroundStyle(Color(red: 0.953, green: 0.953, blue: 0.941).opacity(0.45))
                    .padding(.top, 14)
            }
            .frame(maxWidth: .infinity)
            .position(x: 540, y: 1440)

            // Footer
            VStack(spacing: 10) {
                Text(profile.handle.uppercased())
                    .font(ShareCardFont.mono(24))
                    .kerning(24 * 0.2)
                    .foregroundStyle(Color(red: 0.953, green: 0.953, blue: 0.941))
                Text("EKKOCONNECT.APP")
                    .font(ShareCardFont.mono(18))
                    .kerning(18 * 0.3)
                    .foregroundStyle(Color(red: 0.953, green: 0.953, blue: 0.941).opacity(0.4))
            }
            .frame(maxWidth: .infinity)
            .position(x: 540, y: 1780)
        }
        .frame(width: 1080, height: 1920)
        .clipped()
    }
}

private struct RegMark: Shape {
    let top: Bool
    let leftSide: Bool
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let corner = CGPoint(
            x: leftSide ? 0 : rect.width,
            y: top ? 0 : rect.height
        )
        let mid = CGPoint(x: rect.midX, y: corner.y)
        let mid2 = CGPoint(x: corner.x, y: rect.midY)
        p.move(to: corner); p.addLine(to: mid)
        p.move(to: corner); p.addLine(to: mid2)
        return p
    }
}
