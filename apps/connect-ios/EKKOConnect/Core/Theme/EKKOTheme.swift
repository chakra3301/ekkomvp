import SwiftUI

enum EKKOTheme {
    // MARK: - Colors

    static let primary = Color(hex: "#0080FF")
    static let primaryForeground = Color.white
    static let destructive = Color(red: 0.92, green: 0.28, blue: 0.33)

    // Light mode
    static let backgroundLight = Color.white
    static let cardLight = Color.white.opacity(0.6)
    static let mutedForegroundLight = Color(hex: "#4B5563")
    static let borderLight = Color(hex: "#E5E7EB")

    // Dark mode
    static let backgroundDark = Color(hue: 220/360, saturation: 0.13, brightness: 0.13)
    static let cardDark = Color.white.opacity(0.08)
    static let mutedForegroundDark = Color(hex: "#9CA3AF")
    static let borderDark = Color.white.opacity(0.1)

    // MARK: - Corners

    static let cardRadius: CGFloat = 16
    static let buttonRadius: CGFloat = 12
    static let avatarRadius: CGFloat = .infinity // full circle

    // MARK: - Layout

    static let headerHeight: CGFloat = 44
    static let tabBarHeight: CGFloat = 49

    // MARK: - Shadows

    static let cardShadow = Color.black.opacity(0.08)
}

// MARK: - Glass Morphism ViewModifier

struct GlassCard: ViewModifier {
    @Environment(\.colorScheme) private var colorScheme

    var cornerRadius: CGFloat = EKKOTheme.cardRadius

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(
                        colorScheme == .dark
                            ? Color.white.opacity(0.1)
                            : Color.white.opacity(0.6),
                        lineWidth: 0.5
                    )
            )
    }
}

extension View {
    func glassCard(cornerRadius: CGFloat = EKKOTheme.cardRadius) -> some View {
        modifier(GlassCard(cornerRadius: cornerRadius))
    }
}

// MARK: - Light Glass — heavy blur, white translucent fill

struct GlassBubble: ViewModifier {
    var cornerRadius: CGFloat = 24

    func body(content: Content) -> some View {
        content
            .background(
                ZStack {
                    // Heavy blur with saturation boost
                    Color.clear.background(.ultraThinMaterial)
                    // Light translucent fill
                    Color.white.opacity(0.3)
                }
                .saturation(1.2)
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(Color.white.opacity(0.4), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.15), radius: 16, y: 8)
    }
}

extension View {
    func glassBubble(cornerRadius: CGFloat = 24) -> some View {
        modifier(GlassBubble(cornerRadius: cornerRadius))
    }
}

// MARK: - Color Extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: // RGB
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

// MARK: - Glass Button Style

struct GlassButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius, style: .continuous)
                    .stroke(Color.white.opacity(0.15), lineWidth: 0.5)
            )
            .opacity(configuration.isPressed ? 0.7 : 1.0)
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

extension ButtonStyle where Self == GlassButtonStyle {
    static var glass: GlassButtonStyle { GlassButtonStyle() }
}

// MARK: - Primary Button Style

struct PrimaryButtonStyle: ButtonStyle {
    var isDisabled: Bool = false

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius, style: .continuous)
                    .fill(isDisabled ? EKKOTheme.primary.opacity(0.4) : EKKOTheme.primary)
            )
            .opacity(configuration.isPressed ? 0.85 : 1.0)
            .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}
