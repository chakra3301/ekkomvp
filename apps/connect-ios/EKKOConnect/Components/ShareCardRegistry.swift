import SwiftUI
import UIKit

// Central registry listing every share-card variant available to the user.
// Order here is the order shown in the carousel.
//
// Temporarily reduced to just Chrome Foil while the other variants are being
// reworked. The other variant files (ShareCard_*.swift, ProfileShareCard, etc.)
// stay on disk — re-add cases here when each one is ready to ship.

enum ShareCardSlug: String, CaseIterable, Identifiable {
    case chromeFoil = "chrome-foil"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .chromeFoil: return "Chrome Foil"
        }
    }
}

// MARK: - View builder for a given slug

struct ShareCardView: View {
    let slug: ShareCardSlug
    let profile: ShareProfile
    /// User-chosen accent, or nil to use the card default (sakura pink).
    let accent: Color?
    /// Reserved for the EKKO-branded default card. Currently unused while the
    /// default is being reworked; ignored by Chrome Foil.
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
        case .chromeFoil: ChromeFoilShareCard(profile: profile, accent: resolvedAccent)
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
