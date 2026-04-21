import SwiftUI

// Card 6 · VHS / Dead Internet
// CRT scanlines, tracking error, chromatic aberration. Port of 06-vhs.tsx.

struct VhsShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura

    private let paper = Color(red: 0.953, green: 0.953, blue: 0.941)

    var body: some View {
        ZStack {
            // Base
            RadialGradient(
                colors: [Color(red: 0.102, green: 0.102, blue: 0.141),
                         Color(red: 0.02, green: 0.02, blue: 0.027)],
                center: .center, startRadius: 0, endRadius: 1400
            )

            // Cover fill
            ShareCoverPlaceholder(
                color: accent,
                color2: Color(red: 0.102, green: 0, blue: 0.125),
                seed: 11,
                heroImage: profile.heroImage
            )
            .opacity(0.55)
            .frame(width: 1080, height: 1920)

            // Chromatic aberration edges
            LinearGradient(
                stops: [
                    .init(color: Color(red: 1.0, green: 0, blue: 0.314).opacity(0.15), location: 0),
                    .init(color: .clear, location: 0.05),
                    .init(color: .clear, location: 0.95),
                    .init(color: Color(red: 0, green: 0.78, blue: 1.0).opacity(0.15), location: 1),
                ],
                startPoint: .leading, endPoint: .trailing
            )
            .blendMode(.screen)

            // Scanlines
            Scanlines()
                .blendMode(.multiply)

            // Tracking error band
            LinearGradient(
                colors: [.clear, .white.opacity(0.25), .clear],
                startPoint: .top, endPoint: .bottom
            )
            .frame(height: 60)
            .position(x: 540, y: 710)
            .blendMode(.overlay)

            Rectangle()
                .fill(Color.white.opacity(0.25))
                .frame(height: 20)
                .overlay(
                    Canvas { ctx, size in
                        var x: CGFloat = 0
                        while x < size.width {
                            ctx.fill(Path(CGRect(x: x, y: 0, width: 3, height: size.height)),
                                     with: .color(.white))
                            x += 8
                        }
                    }
                )
                .opacity(0.3)
                .blendMode(.screen)
                .position(x: 540, y: 730)

            // Vignette
            RadialGradient(
                colors: [.clear, .black.opacity(0.7)],
                center: .center, startRadius: 700, endRadius: 1300
            )

            // Top HUD
            HStack(alignment: .top) {
                Text("● REC")
                    .font(ShareCardFont.mono(26))
                    .kerning(26 * 0.15)
                    .foregroundStyle(accent)
                Spacer()
                VStack(alignment: .trailing, spacing: 6) {
                    Text("SP · CH 01")
                        .font(ShareCardFont.mono(18))
                        .kerning(18 * 0.3)
                    Text("EP · ekko archive")
                        .font(ShareCardFont.mono(14))
                        .kerning(14 * 0.3)
                        .opacity(0.55)
                }
            }
            .foregroundStyle(.white)
            .shadow(color: .black.opacity(0.8), radius: 8)
            .padding(.horizontal, 80)
            .position(x: 540, y: 110)

            Text("PLAY ▶ · SPEED 1.0x")
                .font(ShareCardFont.mono(16))
                .kerning(16 * 0.25)
                .foregroundStyle(.white.opacity(0.85))
                .shadow(color: .black.opacity(0.8), radius: 8)
                .position(x: 240, y: 190)

            // Center name — glitched
            VStack(alignment: .leading, spacing: 0) {
                Text(ShareCardJP.name)
                    .font(ShareCardFont.jp(22, weight: .medium))
                    .kerning(22 * 0.4)
                    .foregroundStyle(accent)
                    .shadow(color: .black.opacity(0.8), radius: 12)

                ZStack {
                    Text(profile.name)
                        .foregroundStyle(accent.opacity(0.6))
                        .offset(x: 4)
                    Text(profile.name)
                        .foregroundStyle(Color(red: 0, green: 0.78, blue: 1.0).opacity(0.4))
                        .offset(x: -3)
                    Text(profile.name)
                        .foregroundStyle(paper)
                }
                .font(ShareCardFont.display(160))
                .kerning(-160 * 0.03)
                .lineLimit(1)
                .minimumScaleFactor(0.5)
                .shadow(color: .black.opacity(0.6), radius: 30)
                .padding(.top, 10)

                Text("\(profile.role.uppercased()) · \(profile.location.uppercased())")
                    .font(ShareCardFont.mono(24))
                    .kerning(24 * 0.35)
                    .foregroundStyle(paper)
                    .shadow(color: .black.opacity(0.8), radius: 8)
                    .padding(.top, 30)
            }
            .frame(width: 920, alignment: .leading)
            .position(x: 540, y: 1060)

            // Bottom HUD — timecode
            HStack(alignment: .bottom) {
                VStack(alignment: .leading, spacing: 10) {
                    Text("TAPE 02 · SIDE A")
                        .font(ShareCardFont.mono(16))
                        .kerning(16 * 0.3)
                        .foregroundStyle(.white.opacity(0.5))
                    Text("00:21:34:12")
                        .font(ShareCardFont.mono(44))
                        .kerning(44 * 0.1)
                        .foregroundStyle(accent)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    EkkoTypedLabel(size: 36, color: paper)
                    Text("\(profile.handle) · ekkoconnect.app")
                        .font(ShareCardFont.mono(14))
                        .kerning(14 * 0.3)
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .shadow(color: .black.opacity(0.8), radius: 8)
            .frame(width: 920)
            .position(x: 540, y: 1800)
        }
        .frame(width: 1080, height: 1920)
        .clipped()
    }
}

private struct Scanlines: View {
    var body: some View {
        Canvas { ctx, size in
            var y: CGFloat = 0
            while y < size.height {
                ctx.fill(Path(CGRect(x: 0, y: y, width: size.width, height: 2)),
                         with: .color(.black.opacity(0.25)))
                y += 4
            }
        }
    }
}
