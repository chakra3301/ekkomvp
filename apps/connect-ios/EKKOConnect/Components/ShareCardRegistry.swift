import SwiftUI
import UIKit

// Central registry listing every share-card variant available to the user.
// Order here is the order shown in the carousel.
//
// Slug "default" is the original EKKO-branded ProfileShareCard — the "this is
// my profile" screenshot style. The other 8 entries are the designer-supplied
// poster variants ported from share-cards/ (Chrome Foil → Terminal).

enum ShareCardSlug: String, CaseIterable, Identifiable {
    case defaultCard = "default"
    case chromeFoil  = "chrome-foil"
    case receipt     = "receipt"
    case manga       = "manga"
    case tradingCard = "trading-card"
    case signal      = "signal"
    case vhs         = "vhs"
    case poster      = "poster"
    case terminal    = "terminal"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .defaultCard: return "EKKO"
        case .chromeFoil:  return "Chrome Foil"
        case .receipt:     return "Receipt"
        case .manga:       return "Manga"
        case .tradingCard: return "Trading Card"
        case .signal:      return "Signal"
        case .vhs:         return "VHS"
        case .poster:      return "Poster"
        case .terminal:    return "Terminal"
        }
    }
}

// MARK: - View builder for a given slug

struct ShareCardView: View {
    let slug: ShareCardSlug
    let profile: ShareProfile
    /// User-chosen accent, or nil to use the card default (sakura pink).
    let accent: Color?
    /// Only consumed by slug == .defaultCard. Display name / username /
    /// headline / etc. that the EKKO-branded card uses directly instead of
    /// going through ShareProfile.
    let legacy: LegacyPayload?

    struct LegacyPayload {
        let displayName: String
        let username: String?
        let headline: String?
        let location: String?
        let isInfinite: Bool
    }

    var body: some View {
        switch slug {
        case .defaultCard:
            if let legacy {
                ProfileShareCard(
                    displayName: legacy.displayName,
                    username: legacy.username,
                    headline: legacy.headline,
                    location: legacy.location,
                    isInfinite: legacy.isInfinite,
                    heroImage: profile.heroImage,
                    avatarImage: profile.avatarImage
                )
            } else {
                ProfileShareCard(
                    displayName: profile.name,
                    username: profile.handle.replacingOccurrences(of: "@", with: ""),
                    headline: profile.role,
                    location: profile.location,
                    isInfinite: profile.isInfinite,
                    heroImage: profile.heroImage,
                    avatarImage: profile.avatarImage
                )
            }
        case .chromeFoil:  ChromeFoilShareCard(profile: profile, accent: resolvedAccent)
        case .receipt:     ReceiptShareCard(profile: profile, accent: resolvedAccent)
        case .manga:       MangaShareCard(profile: profile, accent: resolvedAccent)
        case .tradingCard: TradingShareCard(profile: profile, accent: resolvedAccent)
        case .signal:      SignalShareCard(profile: profile, accent: resolvedAccent)
        case .vhs:         VhsShareCard(profile: profile, accent: resolvedAccent)
        case .poster:      PosterShareCard(profile: profile, accent: resolvedAccent)
        case .terminal:    TerminalShareCard(profile: profile, accent: resolvedAccent)
        }
    }

    private var resolvedAccent: Color { accent ?? ShareProfile.sakura }
}

// MARK: - Renderer

@MainActor
enum ShareCardRenderer {
    /// Snapshot any variant at full 1080×1920 resolution, suitable for
    /// pushing to Instagram Stories or the iOS share sheet.
    static func render(
        slug: ShareCardSlug,
        profile: ShareProfile,
        accent: Color?,
        legacy: ShareCardView.LegacyPayload?
    ) -> UIImage? {
        let view = ShareCardView(
            slug: slug,
            profile: profile,
            accent: accent,
            legacy: legacy
        )
        let renderer = ImageRenderer(content: view)
        renderer.scale = 1
        renderer.proposedSize = .init(width: 1080, height: 1920)
        return renderer.uiImage
    }
}
