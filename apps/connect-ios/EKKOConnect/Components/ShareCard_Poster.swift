import SwiftUI

// Card 7 · Poster / Flyer
// Club flyer aesthetic — halftone photo + huge stacked type. Port of
// 07-poster.tsx.

struct PosterShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura

    private let paper = Color(red: 0.953, green: 0.953, blue: 0.941)
    private let ink = Color(red: 0.039, green: 0.039, blue: 0.055)

    private var nameSlice: String {
        String(profile.name.lowercased().prefix(8))
    }

    var body: some View {
        ZStack(alignment: .topLeading) {
            accent

            // Halftone photo area — top ~55%
            ZStack {
                if let hero = profile.heroImage {
                    Image(uiImage: hero)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 1080, height: 1056)
                        .clipped()
                        .saturation(0)
                        .contrast(1.5)
                } else {
                    ShareCoverPlaceholder(color: .white, color2: .black, seed: 3)
                        .saturation(0)
                        .contrast(1.5)
                }

                // Halftone dots
                Canvas { ctx, size in
                    var y: CGFloat = 0
                    while y < size.height {
                        var x: CGFloat = 0
                        while x < size.width {
                            ctx.fill(
                                Path(ellipseIn: CGRect(x: x, y: y, width: 1.5, height: 1.5)),
                                with: .color(.black)
                            )
                            x += 6
                        }
                        y += 6
                    }
                }
                .opacity(0.7)
                .blendMode(.screen)
            }
            .frame(width: 1080, height: 1056)

            // Top strip — white on difference
            HStack {
                Text("★ PRESENTED BY EKKO")
                Spacer()
                Text("VOL. 001 / 2026")
            }
            .font(ShareCardFont.mono(22))
            .kerning(22 * 0.3)
            .foregroundStyle(.white)
            .blendMode(.difference)
            .padding(.horizontal, 60)
            .padding(.top, 50)

            VStack(alignment: .leading, spacing: 0) {
                Spacer()

                // JP subtitle
                Text("\(ShareCardJP.name) · 特別公演")
                    .font(ShareCardFont.jp(26, weight: .medium))
                    .kerning(26 * 0.4)
                    .foregroundStyle(ink)
                    .padding(.bottom, 20)
                    .padding(.horizontal, 60)

                // Huge stacked type
                Text(nameSlice)
                    .font(ShareCardFont.display(280))
                    .kerning(-280 * 0.04)
                    .foregroundStyle(ink)
                    .lineLimit(1)
                    .minimumScaleFactor(0.4)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 60)

                // Info grid
                HStack(alignment: .top, spacing: 20) {
                    infoCell("ROLE", profile.role)
                    infoCell("LOC", profile.location)
                    infoCell("HANDLE", profile.handle)
                }
                .padding(.horizontal, 60)
                .padding(.top, 30)
                .overlay(alignment: .top) {
                    Rectangle().fill(ink).frame(height: 4)
                        .padding(.horizontal, 60)
                }
                .padding(.bottom, 80)
            }
            .frame(width: 1080, height: 1920, alignment: .bottomLeading)

        }
        .frame(width: 1080, height: 1920)
        .overlay(alignment: .bottom) {
            MarqueeStrip(handle: profile.handle, accent: accent, ink: ink)
                .frame(height: 50)
        }
        .clipped()
    }

    private func infoCell(_ k: String, _ v: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(k)
                .font(ShareCardFont.mono(14))
                .kerning(14 * 0.3)
                .foregroundStyle(ink.opacity(0.6))
            Text(v)
                .font(ShareCardFont.mono(26, weight: .medium))
                .foregroundStyle(ink)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct MarqueeStrip: View {
    let handle: String
    let accent: Color
    let ink: Color

    var body: some View {
        ink.overlay(
            HStack(spacing: 40) {
                ForEach(0..<4, id: \.self) { _ in
                    Text("◆ FIND ME ON EKKO ◆ \(handle) ◆ EKKOCONNECT.APP")
                }
            }
            .font(ShareCardFont.mono(18))
            .kerning(18 * 0.4)
            .foregroundStyle(accent)
            .padding(.leading, 30)
            , alignment: .leading
        )
    }
}
