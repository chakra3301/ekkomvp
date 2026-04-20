import SwiftUI

/// User-selectable accent colors. The default is `.appleBlue` — the
/// existing Connect brand color — so unchanged installs render identically.
/// Sakura, Lime, Blood, Acid, Violet, Ember, Ice come from the design
/// handoff's accent palette.
enum AccentPalette: String, CaseIterable, Identifiable {
    case appleBlue = "#0080FF"
    case sakura    = "#FF3D9A"
    case lime      = "#C4FF3D"
    case blood     = "#FF3D5A"
    case acid      = "#00E5A0"
    case violet    = "#B85CFF"
    case ember     = "#FF7A1A"
    case ice       = "#5EC7FF"

    var id: String { rawValue }
    var hex: String { rawValue }
    var color: Color { Color(hex: rawValue) }

    var name: String {
        switch self {
        case .appleBlue: return "Classic"
        case .sakura:    return "Sakura"
        case .lime:      return "Lime"
        case .blood:     return "Blood"
        case .acid:      return "Acid"
        case .violet:    return "Violet"
        case .ember:     return "Ember"
        case .ice:       return "Ice"
        }
    }

    /// Closest palette match for an arbitrary hex (used to highlight
    /// the active swatch even if the user typed a custom value).
    static func closest(to hex: String?) -> AccentPalette {
        guard let hex else { return .appleBlue }
        return allCases.first { $0.hex.caseInsensitiveCompare(hex) == .orderedSame } ?? .appleBlue
    }
}

// MARK: - Storage key (single source of truth)

enum AccentSettings {
    /// AppStorage key. Read app-wide via @AppStorage so flipping it in
    /// Settings live-tints every visible view.
    static let storageKey = "connectAccentHex"

    /// Default hex when no user choice is saved yet.
    static let defaultValue = AccentPalette.appleBlue.hex
}

// MARK: - Picker view (palette swatches)

struct AccentColorPicker: View {
    @AppStorage(AccentSettings.storageKey) private var savedHex = AccentSettings.defaultValue

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Accent color")
                    .font(.subheadline)
                Spacer()
                Text(AccentPalette.closest(to: savedHex).name)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .monospacedDigit()
            }

            LazyVGrid(
                columns: Array(repeating: GridItem(.flexible(), spacing: 10), count: 8),
                spacing: 10
            ) {
                ForEach(AccentPalette.allCases) { swatch in
                    swatchButton(for: swatch)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func swatchButton(for swatch: AccentPalette) -> some View {
        let isActive = AccentPalette.closest(to: savedHex) == swatch
        return Button {
            withAnimation(.easeInOut(duration: 0.18)) {
                savedHex = swatch.hex
            }
            UIImpactFeedbackGenerator(style: .light).impactOccurred()
        } label: {
            ZStack {
                Circle()
                    .fill(swatch.color)
                    .frame(width: 32, height: 32)
                if isActive {
                    Image(systemName: "checkmark")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                }
            }
            .overlay(
                Circle()
                    .stroke(isActive ? Color.white : Color.clear, lineWidth: 2)
                    .padding(2)
            )
            .overlay(
                Circle()
                    .stroke(isActive ? swatch.color : Color.clear, lineWidth: 2)
            )
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Root view modifier

extension View {
    /// Apply the saved accent color via SwiftUI `.tint()` so every
    /// downstream `Color.accentColor` reference resolves to it. Call once
    /// on the app's root view.
    func ekkoAccentTint() -> some View {
        modifier(EKKOAccentTintModifier())
    }
}

private struct EKKOAccentTintModifier: ViewModifier {
    @AppStorage(AccentSettings.storageKey) private var savedHex = AccentSettings.defaultValue

    func body(content: Content) -> some View {
        content.tint(Color(hex: savedHex))
    }
}
