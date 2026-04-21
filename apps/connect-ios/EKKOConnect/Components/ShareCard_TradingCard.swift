import SwiftUI

// Card 4 · Trading Card
// Pokémon-style stat card. Port of 04-trading-card.tsx.

struct TradingShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura

    private let paper = Color(red: 0.953, green: 0.953, blue: 0.941)
    private let ink = Color(red: 0.039, green: 0.039, blue: 0.055)

    private var likesShort: String {
        profile.stats.likes > 999
            ? String(format: "%.1fk", Double(profile.stats.likes) / 1000)
            : String(profile.stats.likes)
    }

    var body: some View {
        ZStack {
            RadialGradient(
                colors: [Color(red: 0.102, green: 0, blue: 0.125), ink],
                center: UnitPoint(x: 0.3, y: 0.2),
                startRadius: 0, endRadius: 1400
            )

            // Subtle diagonal holo pattern
            DiagonalStripes(color: accent.opacity(0.03))
                .opacity(0.7)

            // The card
            tradingCardBody
                .frame(width: 900, height: 1720)
                .position(x: 540, y: 960)
        }
        .frame(width: 1080, height: 1920)
        .clipped()
    }

    private var tradingCardBody: some View {
        VStack(spacing: 24) {
            // Top bar
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(profile.name)
                        .font(ShareCardFont.display(64))
                        .kerning(-64 * 0.02)
                        .foregroundStyle(paper)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Text(profile.role.uppercased())
                        .font(ShareCardFont.mono(18))
                        .kerning(18 * 0.3)
                        .foregroundStyle(accent)
                }
                Spacer()
                Text("★ RARE")
                    .font(ShareCardFont.mono(16, weight: .bold))
                    .kerning(16 * 0.25)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(RoundedRectangle(cornerRadius: 4).fill(accent))
            }

            // Portrait window
            ZStack(alignment: .top) {
                ShareCoverPlaceholder(
                    color: accent,
                    color2: Color(red: 0.055, green: 0, blue: 0.102),
                    seed: 42,
                    heroImage: profile.heroImage
                )
                VStack {
                    HStack {
                        Text("● ACTIVE")
                        Spacer()
                        Text("ID \(profile.handle.replacingOccurrences(of: "@", with: "").uppercased())·01")
                    }
                    .font(ShareCardFont.mono(16))
                    .kerning(16 * 0.2)
                    .foregroundStyle(.white.opacity(0.85))
                    .padding(16)

                    Spacer()

                    Text(ShareCardJP.role)
                        .font(ShareCardFont.jp(22))
                        .kerning(22 * 0.3)
                        .foregroundStyle(.white)
                        .padding(.bottom, 16)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 900)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(accent.opacity(0.5), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // Stat grid
            HStack(spacing: 10) {
                statCell("PRJ", "\(profile.stats.projects)")
                statCell("MAT", "\(profile.stats.matches)")
                statCell("LKS", likesShort)
                statCell("FOL", profile.stats.followers)
            }

            // Signature move
            VStack(alignment: .leading, spacing: 8) {
                Text("SIGNATURE MOVE")
                    .font(ShareCardFont.mono(13))
                    .kerning(13 * 0.3)
                    .foregroundStyle(accent)
                Text("\u{201C}\(profile.currentProject)\u{201D}")
                    .font(ShareCardFont.sans(18))
                    .foregroundStyle(paper)
                    .lineSpacing(4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(18)
            .background(RoundedRectangle(cornerRadius: 10).fill(ink))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white.opacity(0.1), lineWidth: 1))

            // Footer
            HStack {
                EkkoTypedLabel(size: 28, color: paper)
                Spacer()
                Text("EKKOCONNECT.APP · 2026")
                    .font(ShareCardFont.mono(13))
                    .kerning(13 * 0.25)
                    .foregroundStyle(paper.opacity(0.5))
            }
            .padding(.top, 14)
            .overlay(alignment: .top) {
                Rectangle().fill(.white.opacity(0.1)).frame(height: 1)
            }
        }
        .padding(40)
        .background(
            LinearGradient(
                colors: [Color(red: 0.102, green: 0.102, blue: 0.141), Color(red: 0.055, green: 0.055, blue: 0.08)],
                startPoint: .top, endPoint: .bottom
            )
            .overlay(
                // Holo sweep
                LinearGradient(
                    stops: [
                        .init(color: .clear, location: 0.30),
                        .init(color: accent.opacity(0.13), location: 0.45),
                        .init(color: .clear, location: 0.50),
                        .init(color: accent.opacity(0.07), location: 0.65),
                        .init(color: .clear, location: 0.80),
                    ],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .overlay(
            RoundedRectangle(cornerRadius: 24).stroke(accent, lineWidth: 2)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24).stroke(paper, lineWidth: 4).padding(-6)
        )
        .shadow(color: accent.opacity(0.3), radius: 60)
        .shadow(color: .black.opacity(0.6), radius: 80, y: 30)
    }

    private func statCell(_ k: String, _ v: String) -> some View {
        VStack(spacing: 6) {
            Text(v)
                .font(ShareCardFont.display(38))
                .kerning(-38 * 0.02)
                .foregroundStyle(paper)
            Text(k)
                .font(ShareCardFont.mono(12))
                .kerning(12 * 0.3)
                .foregroundStyle(accent)
        }
        .frame(maxWidth: .infinity)
        .padding(14)
        .background(RoundedRectangle(cornerRadius: 8).fill(ink))
        .overlay(RoundedRectangle(cornerRadius: 8).stroke(accent.opacity(0.25), lineWidth: 1))
    }
}

private struct DiagonalStripes: View {
    let color: Color
    var body: some View {
        Canvas { ctx, size in
            let step: CGFloat = 20
            let diag = size.width + size.height
            var x: CGFloat = -diag
            while x < diag {
                var p = Path()
                p.move(to: CGPoint(x: x, y: 0))
                p.addLine(to: CGPoint(x: x + diag, y: diag))
                ctx.stroke(p, with: .color(color), lineWidth: 2)
                x += step
            }
        }
    }
}
