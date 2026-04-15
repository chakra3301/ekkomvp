import SwiftUI

/// Shimmer loading skeleton placeholder.
struct SkeletonView: View {
    var width: CGFloat? = nil
    var height: CGFloat = 16
    var cornerRadius: CGFloat = 8

    @State private var shimmerOffset: CGFloat = -200

    var body: some View {
        RoundedRectangle(cornerRadius: cornerRadius)
            .fill(Color.gray.opacity(0.18))
            .frame(width: width, height: height)
            .overlay(
                GeometryReader { geo in
                    LinearGradient(
                        colors: [.clear, Color.white.opacity(0.4), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                    .fra
                    me(width: 120)
                    .offset(x: shimmerOffset)
                    .onAppear {
                        shimmerOffset = -120
                        withAnimation(
                            .linear(duration: 1.2)
                            .repeatForever(autoreverses: false)
                        ) {
                            shimmerOffset = geo.size.width + 120
                        }
                    }
                }
            )
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .accessibilityLabel("Loading")
    }
}

/// Row skeleton for list items (used in Matches).
struct SkeletonRow: View {
    var body: some View {
        HStack(spacing: 12) {
            SkeletonView(width: 56, height: 56, cornerRadius: 28)
            VStack(alignment: .leading, spacing: 8) {
                SkeletonView(width: 140, height: 16)
                SkeletonView(width: 200, height: 12)
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }
}

/// Big portrait card skeleton (used in Discover stack while loading).
struct SkeletonSwipeCard: View {
    var body: some View {
        ZStack(alignment: .bottomLeading) {
            SkeletonView(cornerRadius: 20)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            VStack(alignment: .leading, spacing: 10) {
                SkeletonView(width: 180, height: 24)
                SkeletonView(width: 140, height: 14)
                SkeletonView(width: 100, height: 12)
            }
            .padding(20)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .clipShape(RoundedRectangle(cornerRadius: 20))
    }
}

/// 2-column grid skeleton (used in Likes + Discover grid mode).
struct SkeletonGrid: View {
    var rows: Int = 3

    var body: some View {
        let columns = [
            GridItem(.flexible(), spacing: 12),
            GridItem(.flexible(), spacing: 12),
        ]
        LazyVGrid(columns: columns, spacing: 12) {
            ForEach(0..<(rows * 2), id: \.self) { _ in
                SkeletonView(cornerRadius: 16)
                    .aspectRatio(3/4, contentMode: .fit)
            }
        }
        .padding(.horizontal, 16)
    }
}

/// Profile view skeleton — hero + avatar + name + bio lines.
struct SkeletonProfile: View {
    var body: some View {
        VStack(spacing: 0) {
            SkeletonView(cornerRadius: 0)
                .frame(height: 380)

            HStack {
                SkeletonView(width: 120, height: 120, cornerRadius: 60)
                    .overlay(Circle().stroke(Color(.systemBackground), lineWidth: 5))
                    .offset(y: -60)
                    .padding(.bottom, -60)
                    .padding(.leading, 20)
                Spacer()
            }

            VStack(alignment: .leading, spacing: 12) {
                SkeletonView(width: 180, height: 26)
                SkeletonView(width: 220, height: 14)
                SkeletonView(width: 120, height: 12)

                Spacer(minLength: 12)

                SkeletonView(width: 80, height: 12)
                SkeletonView(height: 14)
                SkeletonView(height: 14)
                SkeletonView(width: 260, height: 14)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)

            Spacer()
        }
    }
}
