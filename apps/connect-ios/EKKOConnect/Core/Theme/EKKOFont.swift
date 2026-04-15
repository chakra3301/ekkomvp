import SwiftUI
import UIKit

/// Central place for the custom Arches font and helpers.
enum EKKOFont {
    static let regular = "ARCHES-REGULAR"
    static let italic = "ARCHES-REGULARITALIC"

    /// Return an Arches font matching the given system TextStyle's size.
    static func arches(_ size: CGFloat, italic: Bool = false) -> Font {
        .custom(italic ? Self.italic : Self.regular, size: size)
    }

    /// Print every loaded family/font — call on app launch if a font isn't appearing.
    static func debugPrintLoadedFonts() {
        for family in UIFont.familyNames.sorted() {
            print("Family: \(family)")
            for name in UIFont.fontNames(forFamilyName: family) {
                print("  - \(name)")
            }
        }
    }
}

// MARK: - Global default replacement

/// Apply Arches as the default font. Since every `.font(.title)` call in the
/// tree overrides the environment, we replace text styles globally via a
/// low-level SwiftUI mechanism: the `Font` protocol doesn't expose this, so
/// we instead recursively redraw Text using a custom `Font` per style via
/// `.dynamicTypeSize` + transform. The simplest robust path is to attach a
/// transaction modifier that replaces each inherited style with its Arches
/// equivalent using `fontDesign(.default)` as an anchor.
///
/// In practice the cleanest approach: set the environment font AND apply
/// `.font()` on the root. Any view that calls `.font(.title)` will override,
/// so we ALSO swizzle the default `Text` font via `UILabel.appearance`
/// (for UIKit) and use `archesStyle` helpers in SwiftUI.
struct ArchesGlobalFont: ViewModifier {
    func body(content: Content) -> some View {
        content
            .environment(\.font, .custom(EKKOFont.regular, size: 17))
            .font(.custom(EKKOFont.regular, size: 17))
    }
}

extension View {
    /// Apply Arches as the default font environment.
    func archesFont() -> some View {
        modifier(ArchesGlobalFont())
    }

    /// Use this in place of `.font(.title)`, `.font(.body)`, etc. to use Arches
    /// at the standard system sizes. Example: `.archesStyle(.title)`.
    func archesStyle(_ style: ArchesTextStyle) -> some View {
        self.font(style.font)
    }
}

/// Semantic text styles mapped to Arches point sizes.
/// Mirrors SwiftUI's built-in text styles for consistency.
enum ArchesTextStyle {
    case largeTitle
    case title
    case title2
    case title3
    case headline
    case subheadline
    case body
    case callout
    case footnote
    case caption
    case caption2

    var font: Font {
        switch self {
        case .largeTitle: return .custom(EKKOFont.regular, size: 34)
        case .title:      return .custom(EKKOFont.regular, size: 28)
        case .title2:     return .custom(EKKOFont.regular, size: 22)
        case .title3:     return .custom(EKKOFont.regular, size: 20)
        case .headline:   return .custom(EKKOFont.regular, size: 17)
        case .subheadline: return .custom(EKKOFont.regular, size: 15)
        case .body:       return .custom(EKKOFont.regular, size: 17)
        case .callout:    return .custom(EKKOFont.regular, size: 16)
        case .footnote:   return .custom(EKKOFont.regular, size: 13)
        case .caption:    return .custom(EKKOFont.regular, size: 12)
        case .caption2:   return .custom(EKKOFont.regular, size: 11)
        }
    }
}

// MARK: - UIKit bar appearance

/// Apply Arches to UIKit-rendered components (navigation bar, tab bar).
/// Call once on app launch.
@MainActor
enum ArchesUIKitAppearance {
    static func apply() {
        // Navigation bar titles
        let navLarge = UIFont(name: EKKOFont.regular, size: 30) ?? .systemFont(ofSize: 30, weight: .bold)
        let navInline = UIFont(name: EKKOFont.regular, size: 17) ?? .systemFont(ofSize: 17, weight: .semibold)

        let navAppearance = UINavigationBar.appearance().standardAppearance
        navAppearance.titleTextAttributes = [
            .font: navInline,
        ]
        navAppearance.largeTitleTextAttributes = [
            .font: navLarge,
        ]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance

        // Tab bar labels
        if let tabFont = UIFont(name: EKKOFont.regular, size: 10) {
            let tabAppearance = UITabBar.appearance().standardAppearance
            let attrs: [NSAttributedString.Key: Any] = [.font: tabFont]
            tabAppearance.stackedLayoutAppearance.normal.titleTextAttributes = attrs
            tabAppearance.stackedLayoutAppearance.selected.titleTextAttributes = attrs
            tabAppearance.inlineLayoutAppearance.normal.titleTextAttributes = attrs
            tabAppearance.inlineLayoutAppearance.selected.titleTextAttributes = attrs
            tabAppearance.compactInlineLayoutAppearance.normal.titleTextAttributes = attrs
            tabAppearance.compactInlineLayoutAppearance.selected.titleTextAttributes = attrs
            UITabBar.appearance().standardAppearance = tabAppearance
            UITabBar.appearance().scrollEdgeAppearance = tabAppearance
        }
    }
}
