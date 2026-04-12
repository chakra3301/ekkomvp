import SwiftUI

/// Shimmer loading skeleton placeholder.
struct SkeletonView: View {
    var width: CGFloat? = nil
    var height: CGFloat = 16
    var cornerRadius: CGFloat = 8

    @State private var shimmerOffset: CGFloat = -200

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(Color.gray.opacity(0.15))
            .frame(width: width, height: height)
            .overlay(
                LinearGradient(
                    colors: [.clear, Color.white.opacity(0.3), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .frame(width: 100)
                .offset(x: shimmerOffset)
                .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            )
            .clipped()
            .onAppear {
                withAnimation(
                    .linear(duration: 1.5)
                    .repeatForever(autoreverses: false)
                ) {
                    shimmerOffset = 400
                }
            }
    }
}

/// Card-shaped skeleton for profile cards and list items.
struct SkeletonCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            SkeletonView(height: 200, cornerRadius: 16)
            SkeletonView(width: 150, height: 20)
            SkeletonView(width: 100, height: 14)
        }
        .padding(16)
        .glassCard()
    }
}

/// Row skeleton for list items.
struct SkeletonRow: View {
    var body: some View {
        HStack(spacing: 12) {
            SkeletonView(width: 48, height: 48, cornerRadius: 24)
            VStack(alignment: .leading, spacing: 6) {
                SkeletonView(width: 120, height: 16)
                SkeletonView(width: 180, height: 12)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
    }
}
