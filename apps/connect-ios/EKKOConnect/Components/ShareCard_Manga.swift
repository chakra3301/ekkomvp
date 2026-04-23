import SwiftUI

// Card 3 · Manga Panel
// Anime cover + speech bubble. Port of 03-manga.tsx.

struct MangaShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura

    private let paper = Color(red: 0.953, green: 0.953, blue: 0.941)

    // A fixed issue number — the React generated a new one on each render,
    // which would shift every time the sheet re-opens. Keep it stable so the
    // preview and the exported PNG match.
    private var issueNumber: Int { 42 }

    var body: some View {
        ZStack {
            Color(red: 0.039, green: 0.039, blue: 0.055)

            // Cover
            ZStack {
                ShareCoverPlaceholder(
                    color: accent,
                    color2: Color(red: 0.055, green: 0, blue: 0.102),
                    seed: 7,
                    heroImage: profile.heroImage
                )
            }
            .frame(width: 940, height: 1560)
            .overlay(alignment: .top) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("第\(issueNumber)話 · 特別号")
                            .font(ShareCardFont.jp(26, weight: .medium))
                            .kerning(26 * 0.3)
                            .foregroundStyle(.white)
                            .shadow(color: .black.opacity(0.6), radius: 0, y: 2)
                        Text("VOL.2026 · ISSUE \(profile.stats.projects)")
                            .font(ShareCardFont.mono(18))
                            .kerning(18 * 0.2)
                            .foregroundStyle(.white.opacity(0.85))
                    }
                    Spacer()
                    Text("LIVE")
                        .font(ShareCardFont.mono(20, weight: .bold))
                        .kerning(20 * 0.25)
                        .foregroundStyle(.black)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(accent)
                        .cornerRadius(2)
                        .rotationEffect(.degrees(3))
                }
                .padding(30)
            }
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(paper, lineWidth: 3)
            )
            .clipShape(RoundedRectangle(cornerRadius: 8))
            .shadow(color: .black.opacity(0.6), radius: 40, y: 40)
            .position(x: 540, y: 860)

            // Bottom identity
            VStack(alignment: .leading, spacing: 0) {
                Text(ShareCardJP.name)
                    .font(ShareCardFont.jp(22, weight: .medium))
                    .kerning(22 * 0.35)
                    .foregroundStyle(accent)

                HStack(alignment: .lastTextBaseline) {
                    Text(profile.name)
                        .font(ShareCardFont.display(100))
                        .kerning(-100 * 0.02)
                        .foregroundStyle(paper)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                    Spacer()
                    EkkoTypedLabel(size: 42, color: paper)
                }
                .padding(.top, 12)

                HStack {
                    Text("\(profile.handle) · \(profile.location)")
                    Spacer()
                    Text("EKKOCONNECT.APP")
                }
                .font(ShareCardFont.mono(20))
                .kerning(20 * 0.25)
                .foregroundStyle(paper.opacity(0.6))
                .padding(.top, 18)
            }
            .frame(width: 940)
            .position(x: 540, y: 1780)
        }
        .frame(width: 1080, height: 1920)
        .clipped()
    }
}

