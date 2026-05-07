import SwiftUI

/// Cryptic "???" badge with dark-matter / dark-energy aesthetics.
///
/// Visual brief: an opaque void wearing a slow radial halo. Reads as
/// rare/strange/cosmic without telling the viewer what it actually is.
/// Shape matches the GM and INFINITE pills (Capsule, ~caption-bold weight)
/// so it sits cleanly inline with display name.
///
/// Animation budget is small — two superimposed shadows pulse out of phase
/// to imply radiation, the fill itself stays static. Tiny "stars" are
/// pre-seeded once per appearance so they don't shimmer-flicker on every
/// redraw.
struct DarkMatterBadge: View {
    @State private var pulse = false
    @State private var stars: [Star] = (0..<7).map { _ in Star.random() }

    private struct Star: Hashable {
        let x: Double      // 0…1, normalized
        let y: Double      // 0…1, normalized
        let r: Double      // dot radius in points
        let opacity: Double

        static func random() -> Star {
            Star(
                x: .random(in: 0.05...0.95),
                y: .random(in: 0.10...0.90),
                r: .random(in: 0.45...0.95),
                opacity: .random(in: 0.35...0.85)
            )
        }
    }

    var body: some View {
        Text("???")
            .font(.caption.bold())
            .tracking(1.6)
            .foregroundStyle(
                LinearGradient(
                    colors: [
                        Color(red: 0.95, green: 0.93, blue: 1.00),
                        Color(red: 0.74, green: 0.74, blue: 0.96),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background {
                ZStack {
                    // Void fill — radial gradient pulled toward black at the edges
                    // so the capsule reads as a hole in space rather than a chip.
                    Capsule()
                        .fill(
                            RadialGradient(
                                colors: [
                                    Color(red: 0.22, green: 0.08, blue: 0.36),
                                    Color(red: 0.08, green: 0.04, blue: 0.18),
                                    Color(red: 0.02, green: 0.01, blue: 0.06),
                                ],
                                center: .center,
                                startRadius: 1,
                                endRadius: 60
                            )
                        )

                    // Faint scatter of dim stars — geometryReader so positions
                    // scale with the actual badge size.
                    GeometryReader { geo in
                        ForEach(stars, id: \.self) { star in
                            Circle()
                                .fill(.white.opacity(star.opacity))
                                .frame(width: star.r * 2, height: star.r * 2)
                                .position(
                                    x: star.x * geo.size.width,
                                    y: star.y * geo.size.height
                                )
                        }
                    }
                    .clipShape(Capsule())
                    .blendMode(.plusLighter)
                }
            }
            .overlay {
                Capsule().stroke(
                    LinearGradient(
                        colors: [
                            Color(red: 0.55, green: 0.30, blue: 0.85).opacity(0.55),
                            Color(red: 0.20, green: 0.30, blue: 0.65).opacity(0.20),
                            Color(red: 0.55, green: 0.30, blue: 0.85).opacity(0.55),
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 0.6
                )
            }
            // Two-stage pulsing halo — the inner is tighter and warmer-violet,
            // the outer is wider and bluer-cold, breathing slightly out of
            // phase. Together they read as ambient radiation rather than a
            // hard glow.
            .shadow(
                color: Color(red: 0.55, green: 0.30, blue: 0.90).opacity(pulse ? 0.55 : 0.25),
                radius: pulse ? 12 : 6
            )
            .shadow(
                color: Color(red: 0.25, green: 0.15, blue: 0.55).opacity(pulse ? 0.40 : 0.18),
                radius: pulse ? 22 : 10
            )
            .scaleEffect(pulse ? 1.035 : 1.0)
            .onAppear {
                withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) {
                    pulse = true
                }
            }
            .accessibilityLabel("Cryptic badge")
    }
}

#Preview {
    VStack(spacing: 24) {
        DarkMatterBadge()
        HStack(spacing: 8) {
            Text("Display Name").font(.title3.bold())
            DarkMatterBadge()
        }
    }
    .padding(32)
    .background(Color.black)
}
