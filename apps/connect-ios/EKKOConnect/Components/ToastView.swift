import SwiftUI

/// Lightweight toast notification system.
struct ToastModifier: ViewModifier {
    @Binding var message: String?
    var isError: Bool = false

    func body(content: Content) -> some View {
        content.overlay(alignment: .top) {
            if let message {
                HStack(spacing: 8) {
                    Image(systemName: isError ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                        .foregroundStyle(isError ? EKKOTheme.destructive : .green)
                    Text(message)
                        .font(.subheadline)
                        .lineLimit(2)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .shadow(color: .black.opacity(0.1), radius: 8, y: 4)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .transition(.move(edge: .top).combined(with: .opacity))
                .onAppear {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        withAnimation { self.message = nil }
                    }
                }
            }
        }
        .animation(.spring(response: 0.3), value: message != nil)
    }
}

extension View {
    func toast(_ message: Binding<String?>, isError: Bool = false) -> some View {
        modifier(ToastModifier(message: message, isError: isError))
    }
}
