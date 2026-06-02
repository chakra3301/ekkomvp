import SwiftUI
import UIKit

enum EKKOTheme {
    // MARK: - Colors

    static let primary = Color(hex: "#0080FF")
    static let primaryForeground = Color.white
    static let destructive = Color(red: 0.92, green: 0.28, blue: 0.33)

    // MARK: - Neon brand palette
    //
    // The three signature neon accents used across the swipe trail, globe pins,
    // match celebration, and share cards. Centralized so the palette reads as a
    // deliberate brand rather than loose literals. Values are byte-identical to
    // the former inline literals — purely a refactor, no visual change. SceneKit
    // needs UIColor (pin emission/diffuse), so the *UI variants preserve the exact
    // original UIColor construction; do NOT derive them from the Color tokens.
    enum Neon {
        static let green = Color(red: 0.0, green: 1.0, blue: 0.32)   // #00FF52 matrix green
        static let pink = Color(red: 1.0, green: 0.08, blue: 0.56)   // #FF148F neon hot pink
        static let purple = Color(red: 0.85, green: 0.0, blue: 1.0)  // #D900FF electric magenta

        static let greenUI = UIColor(red: 0.0, green: 1.0, blue: 0.32, alpha: 1)
        static let pinkUI = UIColor(red: 1.0, green: 0.08, blue: 0.56, alpha: 1)
        static let purpleUI = UIColor(red: 0.85, green: 0.0, blue: 1.0, alpha: 1)
    }

    static let background = Color(hue: 220/360, saturation: 0.13, brightness: 0.13)
    static let card = Color.white.opacity(0.08)
    static let mutedForeground = Color(hex: "#9CA3AF")
    static let border = Color.white.opacity(0.1)

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
//
// Two variants that visually match iOS 26's system "liquid glass" used by
// toolbars and tab bars. On iOS 26+ we hand off to `.glassEffect(in:)` so
// our cards composite over the ambient background with the same brightness
// and blur the system materials use. On iOS 17–25 we fall back to
// `.ultraThinMaterial`.

struct GlassCard: ViewModifier {
    var cornerRadius: CGFloat = EKKOTheme.cardRadius

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        if #available(iOS 26.0, *) {
            content.glassEffect(.regular, in: shape)
        } else {
            content
                .background(.ultraThinMaterial)
                .clipShape(shape)
                .overlay(shape.stroke(Color.white.opacity(0.1), lineWidth: 0.5))
        }
    }
}

extension View {
    func glassCard(cornerRadius: CGFloat = EKKOTheme.cardRadius) -> some View {
        modifier(GlassCard(cornerRadius: cornerRadius))
    }
}

// MARK: - GlassBubble — interactive variant with shadow

struct GlassBubble: ViewModifier {
    var cornerRadius: CGFloat = 24

    func body(content: Content) -> some View {
        let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
        if #available(iOS 26.0, *) {
            content
                .glassEffect(.regular.interactive(), in: shape)
                .shadow(color: .black.opacity(0.25), radius: 12, y: 6)
        } else {
            content
                .background(.ultraThinMaterial)
                .clipShape(shape)
                .overlay(shape.stroke(Color.white.opacity(0.18), lineWidth: 1))
                .shadow(color: .black.opacity(0.35), radius: 16, y: 8)
        }
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
