import SwiftUI
import UIKit

/// Official Instagram logo from Assets.xcassets/InstagramLogo.
/// Falls back to a drawn placeholder if the asset hasn't been added yet.
struct InstagramLogo: View {
    var body: some View {
        if UIImage(named: "InstagramLogo") != nil {
            Image("InstagramLogo")
                .resizable()
                .scaledToFit()
        } else {
            InstagramLogoFallback()
        }
    }
}

/// Official X logo from Assets.xcassets/XLogo.
/// Falls back to a drawn placeholder if the asset hasn't been added yet.
struct XLogo: View {
    var body: some View {
        if UIImage(named: "XLogo") != nil {
            Image("XLogo")
                .resizable()
                .scaledToFit()
        } else {
            XLogoFallback()
        }
    }
}

/// Website / link icon — blue gradient with globe.
struct WebsiteLogo: View {
    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let corner = size * 0.22

            RoundedRectangle(cornerRadius: corner, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [EKKOTheme.primary, Color.cyan],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay {
                    Image(systemName: "globe")
                        .font(.system(size: size * 0.55, weight: .semibold))
                        .foregroundStyle(.white)
                }
        }
    }
}

// MARK: - Fallbacks (shown until the brand asset is added)

private struct InstagramLogoFallback: View {
    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let corner = size * 0.22
            let stroke = size * 0.08

            RoundedRectangle(cornerRadius: corner, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [
                            Color(red: 0.99, green: 0.82, blue: 0.25),
                            Color(red: 0.96, green: 0.30, blue: 0.32),
                            Color(red: 0.86, green: 0.16, blue: 0.47),
                            Color(red: 0.50, green: 0.18, blue: 0.80),
                        ],
                        startPoint: .bottomLeading,
                        endPoint: .topTrailing
                    )
                )
                .overlay {
                    Circle()
                        .stroke(.white, lineWidth: stroke)
                        .padding(size * 0.24)
                    Circle()
                        .fill(.white)
                        .frame(width: size * 0.12, height: size * 0.12)
                        .position(x: size - size * 0.25, y: size * 0.25)
                }
        }
    }
}

private struct XLogoFallback: View {
    var body: some View {
        GeometryReader { geo in
            let size = min(geo.size.width, geo.size.height)
            let corner = size * 0.22

            RoundedRectangle(cornerRadius: corner, style: .continuous)
                .fill(Color.black)
                .overlay {
                    Image(systemName: "xmark")
                        .font(.system(size: size * 0.55, weight: .heavy))
                        .foregroundStyle(.white)
                }
        }
    }
}
