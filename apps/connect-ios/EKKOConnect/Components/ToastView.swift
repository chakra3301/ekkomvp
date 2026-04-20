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
