import SwiftUI

/// Animated mesh gradient background using stacked radial gradients.
/// Provides depth and color so glass morphism elements have something to blur over.
struct MeshBackground: View {
    @Environment(\.colorScheme) private var colorScheme
    @State private var animate = false

    var body: some View {
        ZStack {
            // Base color
            (colorScheme == .dark ? Color(hex: "#0A0A0F") : Color(hex: "#FAFAFC"))
                .ignoresSafeArea()

            // Three radial gradient blobs, slowly drifting
            ZStack {
                radialBlob(
                    color: meshColor1,
                    position: animate ? UnitPoint(x: 0.2, y: 0.5) : UnitPoint(x: 0.25, y: 0.45),
                    size: 700
                )

                radialBlob(
                    color: meshColor2,
                    position: animate ? UnitPoint(x: 0.8, y: 0.2) : UnitPoint(x: 0.75, y: 0.25),
                    size: 800
                )

                radialBlob(
                    color: meshColor3,
                    position: animate ? UnitPoint(x: 0.5, y: 0.8) : UnitPoint(x: 0.55, y: 0.85),
                    size: 750
                )
            }
            .ignoresSafeArea()
            .blur(radius: 60)
        }
        .onAppear {
            withAnimation(
                .easeInOut(duration: 12)
                .repeatForever(autoreverses: true)
            ) {
                animate.toggle()
            }
        }
    }

    @ViewBuilder
    private func radialBlob(color: Color, position: UnitPoint, size: CGFloat) -> some View {
        GeometryReader { geo in
            let centerX = geo.size.width * position.x
            let centerY = geo.size.height * position.y

            Circle()
                .fill(
                    RadialGradient(
                        colors: [color, color.opacity(0)],
                        center: .center,
                        startRadius: 0,
                        endRadius: size / 2
                    )
                )
                .frame(width: size, height: size)
                .position(x: centerX, y: centerY)
        }
    }

    // MARK: - Mesh Colors

    private var meshColor1: Color {
        colorScheme == .dark
            ? Color(hex: "#3B0764").opacity(0.55) // deep purple
            : Color(hex: "#DBEAFE").opacity(0.85) // soft blue
    }

    private var meshColor2: Color {
        colorScheme == .dark
            ? Color(hex: "#0C4A6E").opacity(0.55) // deep cyan
            : Color(hex: "#FCE7F3").opacity(0.85) // soft pink
    }

    private var meshColor3: Color {
        colorScheme == .dark
            ? Color(hex: "#831843").opacity(0.45) // deep magenta
            : Color(hex: "#DDD6FE").opacity(0.85) // soft violet
    }
}
