import SwiftUI

// MARK: - Typography rules
//
// One source of truth for the JP sub-label aesthetic. Every JP label in the
// app should go through one of the views below so the look stays consistent.
//
// Spec from the design handoff:
//   font-family : Noto Sans JP, weight 400 or 500
//   letter-spacing : 0.25em – 0.3em (wide tracking — the whole aesthetic)
//   opacity : 0.55 – 0.7 (always subdued vs the EN line)
//   line-height : 1, tight stacking (2–4px below JP before EN)
//   color : muted for chrome, accent for hero name
//
// `.tracking()` in SwiftUI takes points, not em — the values below
// approximate 0.25em–0.3em at the chosen point sizes.

enum JPFont {
    static let family = "NotoSansJP"

    static func regular(_ size: CGFloat) -> Font {
        .custom(family, size: size).weight(.regular)
    }

    static func medium(_ size: CGFloat) -> Font {
        .custom(family, size: size).weight(.medium)
    }
}

// MARK: - Toggle key
//
// Single AppStorage key read by every JP label component so flipping the
// Settings switch hides every JP sub-label in one render pass.

enum JPSettings {
    static let storageKey = "showJapanese"
    static let defaultValue = false
}

// MARK: - JPSubLabel
//
// The small floating sub-label used above titles, beside section headers,
// and as the second line of status chips. Renders nothing when the user
// has turned off `showJapanese`.

struct JPSubLabel: View {
    let text: String
    var size: CGFloat = 9
    var tracking: CGFloat? = nil
    var color: Color = .secondary
    var opacity: Double = 0.65
    var weight: Font.Weight = .regular

    @AppStorage(JPSettings.storageKey) private var showJapanese = JPSettings.defaultValue

    var body: some View {
        if showJapanese {
            Text(text)
                .font(.custom(JPFont.family, size: size).weight(weight))
                // Default tracking ≈ 0.27em — within the 0.25–0.3em spec.
                .tracking(tracking ?? size * 0.27)
                .foregroundStyle(color.opacity(opacity))
                .lineLimit(1)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

// MARK: - FuriganaTitle
//
// Drop-in replacement for navigation titles: stacks the JP sub-label above
// the English title in the navigation bar's principal slot. Use via the
// `.furiganaTitle(_:_:)` modifier below.

struct FuriganaTitle: View {
    let english: String
    let japanese: String

    @AppStorage(JPSettings.storageKey) private var showJapanese = JPSettings.defaultValue

    var body: some View {
        VStack(spacing: 1) {
            if showJapanese {
                Text(japanese)
                    .font(.custom(JPFont.family, size: 9).weight(.regular))
                    .tracking(2.4)
                    .foregroundStyle(.secondary.opacity(0.65))
                    .lineLimit(1)
            }
            Text(english)
                .font(.custom(EKKOFont.regular, size: 17))
                .foregroundStyle(.primary)
                .lineLimit(1)
        }
    }
}

extension View {
    /// Replace the standard navigation title with a stacked JP + EN title.
    /// Keeps `.navigationBarTitleDisplayMode(.inline)` for the right size.
    func furiganaTitle(_ english: String, _ japanese: String) -> some View {
        self
            .navigationTitle(english)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .principal) {
                    FuriganaTitle(english: english, japanese: japanese)
                }
            }
    }
}

/// Conditional furigana title — used by views that take a dynamic English
/// title and only sometimes have a paired JP. Falls back to a plain inline
/// navigation title when `japanese` is nil.
struct MaybeFuriganaTitle: ViewModifier {
    let english: String
    let japanese: String?

    func body(content: Content) -> some View {
        if let japanese {
            content.furiganaTitle(english, japanese)
        } else {
            content
                .navigationTitle(english)
                .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// MARK: - JPSection header
//
// Compact JP-above-EN block used inline in the profile templates above
// section content (About, Looking For, Prompts, etc.).

struct JPSectionHeader: View {
    let english: String
    let japanese: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            JPSubLabel(text: japanese)
            Text(english)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Settings toggle
//
// Single switch the user flips to hide every JP sub-label in one go. Drop
// into any Form section.

struct JapaneseSubLabelsToggle: View {
    @AppStorage(JPSettings.storageKey) private var showJapanese = JPSettings.defaultValue

    var body: some View {
        Toggle(isOn: $showJapanese) {
            HStack(spacing: 8) {
                Text("日本語")
                    .font(.custom(JPFont.family, size: 13))
                Text("Japanese sub-labels")
                    .font(.subheadline)
            }
        }
        .tint(EKKOTheme.primary)
    }
}
