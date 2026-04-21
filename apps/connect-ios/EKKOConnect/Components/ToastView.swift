import SwiftUI

/// Global toast overlay rendered at the app root.
/// Reads `appState.activeToast` and animates in/out; auto-dismisses after 3s.
struct ToastHost: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack {
            if let toast = appState.activeToast {
                toastCard(toast)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                            if appState.activeToast?.id == toast.id {
                                withAnimation(.spring(response: 0.4)) {
                                    appState.activeToast = nil
                                }
                            }
                        }
                    }
            }
            Spacer()
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.75), value: appState.activeToast)
        .allowsHitTesting(appState.activeToast != nil)
    }

    @ViewBuilder
    private func toastCard(_ toast: AppState.Toast) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon(for: toast.kind))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(color(for: toast.kind))
            Text(toast.message)
                .font(.subheadline)
                .foregroundStyle(.primary)
                .lineLimit(3)
            Spacer(minLength: 0)
            Button {
                withAnimation { appState.activeToast = nil }
            } label: {
                Image(systemName: "xmark")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.ultraThinMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(color(for: toast.kind).opacity(0.3), lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(0.15), radius: 12, y: 6)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(toast.message)
    }

    private func icon(for kind: AppState.Toast.Kind) -> String {
        switch kind {
        case .info: return "info.circle.fill"
        case .success: return "checkmark.circle.fill"
        case .error: return "exclamationmark.triangle.fill"
        }
    }

    private func color(for kind: AppState.Toast.Kind) -> Color {
        switch kind {
        case .info: return Color.accentColor
        case .success: return .green
        case .error: return EKKOTheme.destructive
        }
    }
}

// MARK: - In-app Message Banner

/// Richer-than-toast banner for foreground push messages. Shows sender
/// initials + title + preview, taps deep-link to the thread, auto-dismisses.
struct MessageBannerHost: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        VStack {
            if let banner = appState.activeMessageBanner {
                bannerCard(banner)
                    .padding(.horizontal, 12)
                    .padding(.top, 8)
                    .transition(.move(edge: .top).combined(with: .opacity))
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 4.5) {
                            if appState.activeMessageBanner?.id == banner.id {
                                withAnimation(.spring(response: 0.4)) {
                                    appState.activeMessageBanner = nil
                                }
                            }
                        }
                    }
            }
            Spacer()
        }
        .animation(.spring(response: 0.45, dampingFraction: 0.8), value: appState.activeMessageBanner)
    }

    @ViewBuilder
    private func bannerCard(_ banner: AppState.MessageBanner) -> some View {
        Button {
            // Route via the same deep-link pipeline the rest of the app uses
            if let route = banner.route {
                NotificationCenter.default.post(
                    name: DeepLinkHandler.deepLinkNotification,
                    object: route
                )
            }
            withAnimation(.spring(response: 0.35)) {
                appState.activeMessageBanner = nil
            }
        } label: {
            HStack(spacing: 12) {
                // Initials circle as a lightweight avatar stand-in
                Text(banner.initials)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(
                        LinearGradient(
                            colors: [Color.accentColor, Color(red: 1.0, green: 0.08, blue: 0.56)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(Circle())
                    .overlay(Circle().stroke(.white.opacity(0.25), lineWidth: 0.5))

                VStack(alignment: .leading, spacing: 2) {
                    Text(banner.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    Text(banner.preview)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }

                Spacer(minLength: 0)

                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color.accentColor.opacity(0.35), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.25), radius: 16, y: 8)
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(banner.title): \(banner.preview). Tap to open.")
    }
}
