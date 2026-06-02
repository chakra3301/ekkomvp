import SwiftUI
import Kingfisher

// MARK: - Downsampling helper
//
// Kingfisher decodes a downloaded image to a bitmap at its FULL resolution by
// default. A 4000x6000 upload becomes a ~96 MB decoded bitmap in memory even
// when it's drawn into a 200pt grid cell. `.downsampled(to:)` attaches a
// `DownsamplingImageProcessor` so Kingfisher decodes straight to the on-screen
// size, collapsing that to a few hundred KB. The original (un-downsampled) image
// is still cached on disk (`cacheOriginalImage()`) so re-rendering the same
// photo at a different size never re-downloads over the network.
//
// IMPORTANT: a downsampled image MUST be drawn `.resizable()` to appear — every
// call site in this app already chains `.resizable()`, so this is a drop-in.
// Call `.downsampled(to:)` first, then the usual `.resizable().scaledToFill()`.
extension KFImage {
    /// Downsample to a target POINT size (the rendered frame). The point size is
    /// multiplied by `scale` (screen scale) internally so the decoded bitmap is
    /// crisp on Retina without over-allocating.
    /// - Parameters:
    ///   - size: The rendered frame size in points. Pass the `.frame(...)` you
    ///           draw at, or a `CardTarget` constant for dynamic/full-bleed views.
    ///   - scale: Pixel scale factor; defaults to the main screen's scale.
    func downsampled(to size: CGSize, scale: CGFloat = UIScreen.main.scale) -> KFImage {
        // DownsamplingImageProcessor takes points and applies `scaleFactor`
        // itself, so we hand it the point size and set the matching scale.
        let processor = DownsamplingImageProcessor(
            size: CGSize(width: max(size.width, 1), height: max(size.height, 1))
        )
        return self
            .setProcessor(processor)
            .scaleFactor(scale)
            .cacheOriginalImage()
    }

    /// Transient-failure recovery only. Retries a failed load up to twice with a
    /// 2s gap (covers network blips / cold CDN). No visual fallback — use this on
    /// sites that already draw their OWN opaque layer behind the KFImage (e.g. the
    /// Discover deck's `cardPlaceholder`), so a permanent failure still shows that
    /// base rather than a Kingfisher placeholder drawn on top of it.
    func retrying() -> KFImage {
        retry(maxCount: 2, interval: .seconds(2))
    }

    /// Retry + a visible failure/loading fallback. Kingfisher shows the
    /// `.placeholder` view whenever the decoded image is nil — i.e. WHILE loading
    /// AND PERMANENTLY ON FAILURE (a 404 of a present URL leaves the image nil, so
    /// the placeholder stays). The placeholder is a sibling SwiftUI view, so it is
    /// NOT affected by the `.resizable().scaledToFill()` chained after this — it
    /// just fills and is bounded by any outer `.frame()`/`.clipShape()`.
    /// - Parameter glyph: SF Symbol shown centered over a neutral fill. Default
    ///   `photo`; pass `waveform` / `cube.transparent` / `person.crop.circle` for
    ///   audio / 3D / avatar contexts so the fallback reads as intentional.
    func resilient(glyph: String = "photo") -> KFImage {
        retrying()
            .placeholder { _ in
                ResilientImagePlaceholder(glyph: glyph)
            }
    }
}

// MARK: - Failure / loading placeholder
//
// Neutral dark-mode fill + centered SF Symbol. Tones match the nil-fallbacks
// already scattered through the app (gray.opacity ~0.12–0.15 + a .secondary
// glyph). Fills its container; the host KFImage's outer frame / clip shape
// bounds it.
private struct ResilientImagePlaceholder: View {
    let glyph: String
    var body: some View {
        ZStack {
            Color.gray.opacity(0.12)
            Image(systemName: glyph)
                .font(.system(size: 22, weight: .light))
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Stable target sizes for recurring layout roles
//
// Full-bleed cards live inside a GeometryReader whose size animates during a
// swipe; threading `geo.size` into the processor would re-decode + re-cache the
// SAME photo at dozens of slightly different sizes. Instead we downsample to one
// stable size per visual role so each image has a single cache entry. The screen
// width is a fine proxy for "as big as this image is ever drawn."
enum CardTarget {
    private static var screenW: CGFloat { UIScreen.main.bounds.width }
    private static var screenH: CGFloat { UIScreen.main.bounds.height }

    /// Full-bleed swipe/profile cover cards (deck card, hero covers, stack/split/
    /// client/video/3D covers). Width = screen, height = a 3:4-ish tall card.
    static var fullBleed: CGSize {
        CGSize(width: screenW, height: screenW * 1.6)
    }

    /// 2-column grid thumbnails (discover grid + history, likes grid, editorial/
    /// split media tiles). Half the screen width, 3:4.
    static var gridThumb: CGSize {
        let w = screenW / 2
        return CGSize(width: w, height: w * 4.0 / 3.0)
    }

    /// Full-width photo with natural aspect (interleaved card media, photo
    /// template). Width = screen minus side padding; tall height cap so even
    /// portraits taller than 2:1 still decode at display resolution rather than
    /// softening. The processor fits WITHIN this box preserving aspect, so a
    /// normal-ratio photo still decodes at its true (smaller) display size — the
    /// tall cap costs nothing for the common case, it only raises the ceiling.
    static var fullWidthPhoto: CGSize {
        let w = screenW - 32
        return CGSize(width: w, height: w * 3)
    }

    /// Full-screen inspector (double-tap zoom up to 1.6x). Oversize so the
    /// zoomed state stays sharp.
    static var fullScreen: CGSize {
        CGSize(width: screenW * 1.6, height: screenH * 1.6)
    }
}
