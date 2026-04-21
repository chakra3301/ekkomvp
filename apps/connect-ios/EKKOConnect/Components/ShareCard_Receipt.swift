import SwiftUI

// Card 2 · Receipt / Ticker
// Paper receipt on a near-black backdrop. Port of 02-receipt.tsx.

struct ReceiptShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura

    private let paper = Color(red: 0.953, green: 0.953, blue: 0.941)
    private let ink = Color(red: 0.039, green: 0.039, blue: 0.055)

    var body: some View {
        ZStack {
            ink

            // Paper card
            paperCard
                .frame(width: 920, height: 1760)
                .position(x: 540, y: 960)

            // Corner sticker — "NEW MEMBER 2026"
            stickerBadge
                .position(x: 880, y: 280)
        }
        .frame(width: 1080, height: 1920)
        .clipped()
    }

    private var paperCard: some View {
        ZStack(alignment: .top) {
            paper
                .overlay(alignment: .top) {
                    TornEdge().fill(paper).frame(height: 30).offset(y: -1)
                }
                .overlay(alignment: .bottom) {
                    TornEdge(flip: true).fill(paper).frame(height: 30).offset(y: 1)
                }
                .shadow(color: accent.opacity(0.15), radius: 60, y: 40)

            VStack(spacing: 0) {
                Text("◆ ekkoconnect.app ◆")
                    .font(ShareCardFont.mono(22))
                    .kerning(22 * 0.4)
                    .foregroundStyle(ink)

                Text("CREATIVE NETWORK · RECEIPT")
                    .font(ShareCardFont.mono(18))
                    .kerning(18 * 0.2)
                    .foregroundStyle(ink.opacity(0.55))
                    .padding(.top, 12)

                dashedDivider.padding(.top, 30)

                Text(profile.name)
                    .font(ShareCardFont.display(130))
                    .kerning(-130 * 0.03)
                    .foregroundStyle(ink)
                    .multilineTextAlignment(.center)
                    .lineLimit(1)
                    .minimumScaleFactor(0.5)
                    .padding(.top, 40)

                Text(profile.role.uppercased())
                    .font(ShareCardFont.mono(26))
                    .kerning(26 * 0.3)
                    .foregroundStyle(ink)
                    .padding(.top, 20)

                Text(ShareCardJP.name)
                    .font(ShareCardFont.jp(20))
                    .kerning(20 * 0.3)
                    .foregroundStyle(ink.opacity(0.5))
                    .padding(.top, 10)

                dashedDivider.padding(.top, 50)

                VStack(alignment: .leading, spacing: 0) {
                    receiptLine("HANDLE", profile.handle)
                    receiptLine("LOCATION", profile.location)
                    receiptLine("PROJECTS", "× \(profile.stats.projects)")
                    receiptLine("MATCHES", "× \(profile.stats.matches)")
                    receiptLine("FOLLOWERS", profile.stats.followers)
                    receiptLine("STATUS", profile.status.rawValue.uppercased())
                }
                .frame(maxWidth: .infinity)
                .padding(.top, 50)
                .padding(.horizontal, 30)

                dashedDivider.padding(.top, 40)

                VStack(alignment: .leading, spacing: 14) {
                    Text("SKILLSET:")
                        .font(ShareCardFont.mono(20))
                        .kerning(20 * 0.1)
                        .foregroundStyle(ink.opacity(0.65))

                    Text(profile.skills.prefix(5).map { "[\($0)]" }.joined(separator: "  "))
                        .font(ShareCardFont.mono(22))
                        .foregroundStyle(ink)
                        .lineSpacing(10)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 30)
                .padding(.horizontal, 30)

                Spacer(minLength: 40)

                // Barcode + tag
                Barcode()
                    .fill(ink)
                    .frame(width: 700, height: 60)

                Text("\(profile.handle.replacingOccurrences(of: "@", with: "").uppercased()) · 0001 · FIND ME ON EKKO")
                    .font(ShareCardFont.mono(16))
                    .kerning(16 * 0.25)
                    .foregroundStyle(ink)
                    .padding(.top, 10)
            }
            .padding(.vertical, 60)
            .padding(.horizontal, 50)
        }
    }

    private var dashedDivider: some View {
        Text(String(repeating: "- ", count: 26))
            .font(ShareCardFont.mono(16))
            .foregroundStyle(ink.opacity(0.4))
            .lineLimit(1)
    }

    private func receiptLine(_ k: String, _ v: String) -> some View {
        HStack {
            Text(k)
                .foregroundStyle(ink.opacity(0.65))
            Spacer()
            Text(v)
                .foregroundStyle(ink)
        }
        .font(ShareCardFont.mono(24))
        .padding(.vertical, 4)
    }

    private var stickerBadge: some View {
        VStack(spacing: 4) {
            Text("NEW").font(ShareCardFont.mono(22, weight: .bold))
            Text("MEMBER").font(ShareCardFont.mono(14)).kerning(14 * 0.25)
            Text("2026").font(ShareCardFont.mono(11)).kerning(11 * 0.25).opacity(0.7).padding(.top, 6)
        }
        .foregroundStyle(.black)
        .frame(width: 200, height: 200)
        .background(Circle().fill(accent))
        .shadow(color: accent.opacity(0.5), radius: 30, y: 10)
        .rotationEffect(.degrees(8))
    }
}

private struct TornEdge: Shape {
    var flip = false
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let teeth = 20
        let w = rect.width / CGFloat(teeth)
        p.move(to: CGPoint(x: 0, y: rect.height))
        for i in 0...teeth {
            let x = CGFloat(i) * w
            let y: CGFloat = i.isMultiple(of: 2) ? 0 : rect.height * 0.6
            p.addLine(to: CGPoint(x: x, y: y))
        }
        p.addLine(to: CGPoint(x: rect.width, y: rect.height))
        p.closeSubpath()
        if flip {
            p = p.applying(.init(scaleX: 1, y: -1).translatedBy(x: 0, y: -rect.height))
        }
        return p
    }
}

private struct Barcode: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        let bars = 60
        let unit = rect.width / CGFloat(bars)
        for i in 0..<bars {
            let w = (sin(Double(i) * 1.7) * 0.5 + 1) * 1.5
            p.addRect(CGRect(
                x: CGFloat(i) * unit,
                y: 0,
                width: CGFloat(w) * unit / 3,
                height: rect.height
            ))
        }
        return p
    }
}
