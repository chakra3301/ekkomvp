import SwiftUI

// Card 8 · Terminal / Boot Sequence
// Green phosphor CRT. Port of 08-terminal.tsx.

struct TerminalShareCard: View {
    let profile: ShareProfile
    var accent: Color = ShareProfile.sakura

    private let phosphor = Color(red: 0, green: 1, blue: 0.533)

    private let asciiPortrait: String = """
          ░▒▓█ █▓▒░
        ▒▓██████████▓▒
       ▓███████████████▓
      ▓█████████████████▓
     ▒██████████████████▒
     ██████████ ██████████
     █████  ██   ██  █████
     █████  ◉     ◉  █████
     ██████         ██████
     ██████  ▂▂▂▂▂  ██████
     ██████  ══════  ██████
      ▓████▓        ▓████▓
       ▓██████████████▓
        ▒▓██████████▓▒
           ▒▓████▓▒
    """

    private var handleNoAt: String {
        profile.handle.replacingOccurrences(of: "@", with: "")
    }

    var body: some View {
        ZStack {
            // CRT base
            Color(red: 0, green: 0.063, blue: 0.02)

            // CRT glow
            RadialGradient(
                colors: [phosphor.opacity(0.08), .clear],
                center: .center, startRadius: 0, endRadius: 1200
            )

            // Scanlines
            Canvas { ctx, size in
                var y: CGFloat = 0
                while y < size.height {
                    ctx.fill(Path(CGRect(x: 0, y: y, width: size.width, height: 2)),
                             with: .color(.black.opacity(0.3)))
                    y += 4
                }
            }

            // Vignette
            RadialGradient(
                colors: [.clear, .black.opacity(0.85)],
                center: .center, startRadius: 700, endRadius: 1300
            )

            VStack(alignment: .leading, spacing: 0) {
                Text("ekko.os :: v2.26.4").opacity(0.6)
                Text("(c) ekkoconnect.app · 2026").opacity(0.6)
                Text("> boot profile/\(handleNoAt)...").padding(.top, 20)
                Text("[ok] loading identity...").opacity(0.5).padding(.top, 8)
                Text("[ok] verifying signature...").opacity(0.5)
                Text("[ok] decrypting portfolio [\(profile.stats.projects)/\(profile.stats.projects)]").opacity(0.5)
                Text("> connection established.")
                    .foregroundStyle(accent)
                    .padding(.top, 20)

                // ASCII portrait
                Text(asciiPortrait)
                    .font(ShareCardFont.mono(24))
                    .kerning(-24 * 0.02)
                    .foregroundStyle(phosphor)
                    .shadow(color: phosphor.opacity(0.4), radius: 12)
                    .padding(.vertical, 40)

                Group {
                    fieldLine("name   ", profile.name, valueColor: .white)
                    fieldLine("role   ", profile.role)
                    fieldLine("handle ", profile.handle)
                    fieldLine("loc    ", profile.location)
                    HStack(spacing: 0) {
                        Text("status ").opacity(0.55)
                        Text("> ")
                        Text("● \(profile.status.rawValue)")
                            .foregroundStyle(accent)
                    }
                    HStack(spacing: 0) {
                        Text("jp     ").opacity(0.55)
                        Text("> ")
                        Text(ShareCardJP.name)
                    }
                }
                .font(ShareCardFont.mono(26))
                .lineSpacing(12)

                Text("> open portfolio --stream")
                    .opacity(0.55)
                    .padding(.top, 40)
                Text("> find me on ekko_█")
                    .padding(.top, 6)
            }
            .font(ShareCardFont.mono(22))
            .lineSpacing(10)
            .foregroundStyle(phosphor)
            .padding(80)
            .frame(width: 1080, height: 1920, alignment: .topLeading)
        }
        .frame(width: 1080, height: 1920)
        .clipped()
    }

    private func fieldLine(_ k: String, _ v: String, valueColor: Color? = nil) -> some View {
        HStack(spacing: 0) {
            Text(k).opacity(0.55)
            Text("> ")
            Text(v)
                .foregroundStyle(valueColor ?? phosphor)
        }
    }
}
