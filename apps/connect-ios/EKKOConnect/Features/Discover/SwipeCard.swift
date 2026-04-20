import SwiftUI
import Kingfisher

/// A single swipeable card in the discover stack.
/// Supports drag-to-swipe with LIKE/PASS indicators, 3D tilt, tap-to-expand, and action buttons.
struct SwipeCard: View {
    let profile: ConnectProfile
    let isTop: Bool
    let onSwipe: (SwipeType) -> Void
    let onBlock: () -> Void
    let onReport: () -> Void

    @State private var offset: CGSize = .zero
    @State private var isExpanded = false
    @State private var showMenu = false

    private let swipeThreshold: CGFloat = 100
    private let velocityThreshold: CGFloat = 500

    private var displayName: String {
        profile.user?.profile?.displayName ?? "Creative"
    }

    private var featuredSlot: MediaSlot? {
        profile.mediaSlots.first { $0.sortOrder == 0 } ?? profile.mediaSlots.first
    }

    private var rotation: Double {
        Double(offset.width / 20)
    }

    private var likeOpacity: Double {
        min(max(Double(offset.width) / 100, 0), 1)
    }

    private var passOpacity: Double {
        min(max(Double(-offset.width) / 100, 0), 1)
    }

    var body: some View {
        cardContent
            .offset(x: offset.width)
            .rotationEffect(.degrees(rotation))
            .gesture(
                isTop && !isExpanded
                ? DragGesture()
                    .onChanged { value in
                        offset = value.translation
                    }
                    .onEnded { value in
                        handleDragEnd(value)
                    }
                : nil
            )
            .animation(.spring(response: 0.4, dampingFraction: 0.7), value: offset)
            .fullScreenCover(isPresented: $isExpanded) {
                expandedProfile
            }
    }

    // MARK: - Card Content (Collapsed)

    private var cardContent: some View {
        GeometryReader { geo in
            ZStack(alignment: .bottom) {
                // Hero image — exactly the size of the card
                heroImage
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()

                // Bottom info overlay
                infoOverlay

                // Swipe indicators
                if isTop {
                    swipeIndicators
                }

                // More menu
                if isTop {
                    moreMenuButton
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
            .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .shadow(color: .black.opacity(0.15), radius: 10, y: 5)
            .contentShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
            .onTapGesture {
                if isTop { isExpanded = true }
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel("Profile card for \(displayName)")
            .accessibilityHint(isTop ? "Double-tap to view full profile. Swipe right to like, left to pass." : "")
            .accessibilityAddTraits(isTop ? .isButton : [])
        }
    }

    @ViewBuilder
    private var heroImage: some View {
        if let slot = featuredSlot, let url = URL(string: slot.url) {
            KFImage(url)
                .resizable()
                .scaledToFill()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipped()
        } else {
            ZStack {
                LinearGradient(
                    colors: [Color.accentColor.opacity(0.3), Color.accentColor.opacity(0.1), Color(.systemBackground)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Text(String(displayName.prefix(1)))
                    .font(.system(size: 72, weight: .bold))
                    .foregroundStyle(Color.accentColor.opacity(0.2))
            }
        }
    }

    private var swipeIndicators: some View {
        ZStack {
            // LIKE indicator (top right)
            Text("LIKE")
                .font(.title.bold())
                .foregroundStyle(Color.accentColor)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.accentColor.opacity(0.5), lineWidth: 2)
                )
                .rotationEffect(.degrees(-20))
                .opacity(likeOpacity)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
                .padding(.top, 32)
                .padding(.trailing, 24)

            // PASS indicator (top left)
            Text("PASS")
                .font(.title.bold())
                .foregroundStyle(EKKOTheme.destructive)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(EKKOTheme.destructive.opacity(0.5), lineWidth: 2)
                )
                .rotationEffect(.degrees(20))
                .opacity(passOpacity)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                .padding(.top, 32)
                .padding(.leading, 24)
        }
        .allowsHitTesting(false)
    }

    private var moreMenuButton: some View {
        Menu {
            Button(role: .destructive) {
                onBlock()
            } label: {
                Label("Block", systemImage: "shield.slash")
            }
            Button {
                onReport()
            } label: {
                Label("Report", systemImage: "flag")
            }
        } label: {
            Image(systemName: "ellipsis")
                .font(.body.bold())
                .foregroundStyle(.white)
                .padding(10)
                .background(.black.opacity(0.4))
                .clipShape(Circle())
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
        .padding(.top, 12)
        .padding(.trailing, 12)
    }

    private var infoOverlay: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(displayName)
                    .font(.custom(EKKOFont.regular, size: 26))
                    .foregroundStyle(.white)

                if profile.user?.role == .ADMIN {
                    Text("GM")
                        .font(.caption2.bold())
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(
                            LinearGradient(
                                colors: [Color.accentColor, Color.purple],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .clipShape(Capsule())
                } else if profile.connectTier == .INFINITE {
                    Image(systemName: "infinity")
                        .font(.caption2.bold())
                        .foregroundStyle(Color.accentColor)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.accentColor.opacity(0.2))
                        .clipShape(Capsule())
                }
            }

            if let headline = profile.headline, !headline.isEmpty {
                Text(headline)
                    .font(.custom(EKKOFont.regular, size: 16))
                    .foregroundStyle(.white.opacity(0.8))
            }

            if let location = profile.location, !location.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "mappin")
                        .font(.caption2)
                    Text(location)
                        .font(.caption)
                }
                .foregroundStyle(.white.opacity(0.7))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(20)
        .background(
            LinearGradient(
                colors: [.clear, .black.opacity(0.4), .black.opacity(0.8)],
                startPoint: .top,
                endPoint: .bottom
            )
            .frame(height: 200)
            .frame(maxHeight: .infinity, alignment: .bottom)
        )
    }

    // MARK: - Expanded Profile

    private var expandedProfile: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    ConnectProfileCard(
                        displayName: displayName,
                        avatarUrl: profile.user?.profile?.avatarUrl,
                        headline: profile.headline,
                        location: profile.location,
                        lookingFor: profile.lookingFor,
                        bio: profile.bio,
                        mediaSlots: profile.mediaSlots,
                        prompts: profile.prompts,
                        instagramHandle: profile.instagramHandle,
                        twitterHandle: profile.twitterHandle,
                        websiteUrl: profile.websiteUrl,
                        connectTier: profile.connectTier,
                        isAdmin: profile.user?.role == .ADMIN
                    )

                    // Action buttons
                    HStack(spacing: 24) {
                        // Pass button
                        Button {
                            isExpanded = false
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                onSwipe(.PASS)
                            }
                        } label: {
                            Image(systemName: "xmark")
                                .font(.title2)
                                .foregroundStyle(EKKOTheme.destructive)
                                .frame(width: 56, height: 56)
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                                .shadow(radius: 8)
                        }

                        // Like button
                        Button {
                            isExpanded = false
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                                onSwipe(.LIKE)
                            }
                        } label: {
                            Image(systemName: "heart.fill")
                                .font(.title)
                                .foregroundStyle(.white)
                                .frame(width: 64, height: 64)
                                .background(Color.accentColor)
                                .clipShape(Circle())
                                .shadow(radius: 8)
                        }
                    }
                    .padding(.top, 32)
                    .padding(.bottom, 80)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        isExpanded = false
                    } label: {
                        Image(systemName: "chevron.down")
                            .font(.body.bold())
                    }
                }
            }
        }
        .presentationDragIndicator(.visible)
    }

    // MARK: - Drag Handling

    private func handleDragEnd(_ value: DragGesture.Value) {
        let xOffset = value.translation.width
        let velocity = value.predictedEndTranslation.width - value.translation.width

        if xOffset > swipeThreshold || velocity > velocityThreshold {
            // Swipe right — LIKE
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
            withAnimation(.spring(response: 0.3)) {
                offset = CGSize(width: 500, height: 0)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                onSwipe(.LIKE)
                offset = .zero
            }
        } else if xOffset < -swipeThreshold || velocity < -velocityThreshold {
            // Swipe left — PASS
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            withAnimation(.spring(response: 0.3)) {
                offset = CGSize(width: -500, height: 0)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                onSwipe(.PASS)
                offset = .zero
            }
        } else {
            // Snap back
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                offset = .zero
            }
        }
    }
}
