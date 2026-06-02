import SwiftUI

/// App-wide "No internet connection" strip. Lives as a top overlay on
/// AppRouter alongside ToastHost / MessageBannerHost. Persistent while
/// `appState.isOffline` is true; self-clears when connectivity returns.
struct OfflineBanner: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack {
            if appState.isOffline {
                bannerCard
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
            Spacer()
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.75), value: appState.isOffline)
        .allowsHitTesting(false)   // never block taps underneath (it's persistent)
    }

    private var bannerCard: some View {
        HStack(spacing: 10) {
            Image(systemName: "wifi.slash")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(EKKOTheme.destructive)
            Text("No internet connection")
                .font(.subheadline)
                .foregroundStyle(.primary)
                .lineLimit(1)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(EKKOTheme.destructive.opacity(0.3), lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(0.15), radius: 12, y: 6)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("No internet connection")
    }
}
