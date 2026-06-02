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
    @State private var pendingInquiry: PendingSwipeInquiry?
    @State private var activePulse = false

    @Environment(AppState.self) private var appState
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    private struct PendingSwipeInquiry: Identifiable {
        let id = UUID()
        let type: ConnectInquiryType
        let toUserId: String
        let recipientName: String?
        let briefs: [ClientBrief]
    }

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
        ZStack {
            // Neon trail — sits at the card's resting frame so as the card
            // flies off it leaves a glow streak in the direction of motion.
            // Green trail for LIKE, hot pink for PASS — mirrors the globe
            // pin palette so the whole app speaks the same neon vocabulary.
            swipeTrail

            cardContent
                .offset(x: offset.width)
                .rotationEffect(.degrees(rotation))
        }
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
        .animation(.spring(response: 0.28, dampingFraction: 0.78), value: offset)
        .fullScreenCover(isPresented: $isExpanded) {
            expandedProfile
        }
    }

    /// Swipe trail: two edge-anchored neon gradient streaks (green right,
    /// pink left) that fade in with drag intensity and offset slightly
    /// *toward* the drag direction to read as motion blur rather than a
    /// static glow. Only renders on the top card.
    @ViewBuilder
    private var swipeTrail: some View {
        if isTop {
            ZStack {
                streakLayer(
                    color: EKKOTheme.Neon.green,
                    anchor: .trailing,
                    intensity: likeOpacity
                )
                streakLayer(
                    color: EKKOTheme.Neon.pink,
                    anchor: .leading,
                    intensity: passOpacity
                )
            }
            .allowsHitTesting(false)
            // Parallax with the card at half speed — classic motion-blur trick.
            .offset(x: offset.width * 0.5)
            .rotationEffect(.degrees(rotation * 0.5))
        }
    }

    private func streakLayer(color: Color, anchor: HorizontalAlignment, intensity: Double) -> some View {
        let toTrailing = anchor == .trailing
        return RoundedRectangle(cornerRadius: 20, style: .continuous)
            .fill(
                LinearGradient(
                    stops: [
                        .init(color: .clear,                   location: 0.0),
                        .init(color: color.opacity(0.0),       location: 0.35),
                        .init(color: color.opacity(0.55),      location: 0.85),
                        .init(color: color.opacity(0.9),       location: 1.0),
                    ],
                    startPoint: toTrailing ? .leading : .trailing,
                    endPoint:   toTrailing ? .trailing : .leading
                )
            )
            .blur(radius: 28)
            .opacity(intensity)
            .padding(-24)  // let the blur bleed past the card frame for a true glow
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
        ZStack {
            // Opaque branded base — drawn under the media so a card is never
            // see-through while it loads. Without it, a loading card reveals
            // the card stacked behind it and both name overlays bleed through,
            // reading as "names stacked on top of each other."
            cardPlaceholder

            if let slot = featuredSlot {
                heroMedia(for: slot)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipped()
            }
        }
    }

    /// Renders the featured slot by media type so the deck card matches the
    /// profile's real hero — not just photos. Video autoplays muted+looping
    /// (a passive AVPlayerLayer that doesn't fight the swipe drag). The live
    /// 3D viewer is intentionally NOT used here: it's a gesture-grabbing,
    /// heavyweight WKWebView, so the collapsed card shows a static poster and
    /// the interactive model renders when the card is expanded. Audio is the
    /// same — its tap-to-play control would fight tap-to-expand, so it gets a
    /// poster too.
    @ViewBuilder
    private func heroMedia(for slot: MediaSlot) -> some View {
        if slot.isVideo {
            // Only the top card's video plays; the covered back card pauses +
            // rewinds (isActive flips synchronously with the deck, unlike the
            // back card's deferred onDisappear). When a swipe promotes the back
            // card to top, isTop becomes true and its video starts.
            CoverVideoPlayerView(urlString: slot.url, isActive: isTop)
        } else if slot.isModel {
            posterHero(coverUrl: slot.coverUrl, glyph: "cube.transparent")
        } else if slot.isAudio {
            posterHero(coverUrl: slot.coverUrl, glyph: "waveform")
        } else if let url = URL(string: slot.url) {
            KFImage(url)
                .downsampled(to: CardTarget.fullBleed)
                .retrying()
                .resizable()
                .fade(duration: 0.3)   // crossfade in once decoded, no hard pop
                .scaledToFill()
        }
    }

    /// Static hero for 3D / audio slots: the upload's cover image when one
    /// exists, otherwise a branded glyph over the opaque base so the card
    /// reads as intentional rather than empty.
    @ViewBuilder
    private func posterHero(coverUrl: String?, glyph: String) -> some View {
        if let coverUrl, let url = URL(string: coverUrl) {
            KFImage(url)
                .downsampled(to: CardTarget.fullBleed)
                .retrying()
                .resizable()
                .fade(duration: 0.3)
                .scaledToFill()
        } else {
            ZStack {
                placeholderBase   // opaque — masks the initial-letter placeholder behind it
                Image(systemName: glyph)
                    .font(.system(size: 60, weight: .light))
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
    }

    /// Opaque dark base + accent tint. Guarantees a card hides whatever sits
    /// behind it in the deck.
    private var placeholderBase: some View {
        ZStack {
            EKKOTheme.background
            LinearGradient(
                colors: [Color.accentColor.opacity(0.30), Color.accentColor.opacity(0.08), .clear],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        }
    }

    /// Fully opaque placeholder shown while a photo loads (and as the no-media
    /// fallback): the branded base plus the person's initial.
    private var cardPlaceholder: some View {
        ZStack {
            placeholderBase
            Text(String(displayName.prefix(1)))
                .font(.system(size: 72, weight: .bold))
                .foregroundStyle(Color.accentColor.opacity(0.25))
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

                // Active-now sparkle — glowing matrix-green star when the
                // other user pinged the server within the last 15 min.
                if let lastActive = profile.user?.lastActiveAt, lastActive.isRecentlyActive {
                    Image(uiImage: EKKOStarSprite.image(size: 32, variant: .simple))
                        .renderingMode(.template)
                        .resizable()
                        .frame(width: 18, height: 18)
                        .foregroundStyle(EKKOTheme.Neon.green)
                        .shadow(color: EKKOTheme.Neon.green.opacity(0.9), radius: 6)
                        .opacity(activePulse ? 1.0 : 0.55)
                        .scaleEffect(activePulse ? 1.0 : 0.85)
                        .onAppear {
                            // Reduce Motion: show the "active now" star steady
                            // at full strength instead of pulsing it forever.
                            guard !reduceMotion else { activePulse = true; return }
                            withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {
                                activePulse = true
                            }
                        }
                        .accessibilityLabel("Active now")
                }

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
                    ConnectProfileViewer(
                        profile: profile,
                        viewerIsOwner: false,
                        onTapInquiryCTA: { type in
                            pendingInquiry = PendingSwipeInquiry(
                                type: type,
                                toUserId: profile.userId,
                                recipientName: profile.user?.profile?.displayName,
                                briefs: profile.clientData?.briefs ?? []
                            )
                        }
                    )

                    // Action buttons
                    HStack(spacing: 24) {
                        // Pass button
                        Button {
                            UIImpactFeedbackGenerator(style: .light).impactOccurred()
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
                            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
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
            .sheet(item: $pendingInquiry) { p in
                inquirySheetForSwipe(p)
            }
        }
        .presentationDragIndicator(.visible)
    }

    @ViewBuilder
    private func inquirySheetForSwipe(_ p: PendingSwipeInquiry) -> some View {
        switch p.type {
        case .BOOKING_REQUEST:
            BookCallSheet(
                toUserId: p.toUserId,
                recipientName: p.recipientName,
                onSent: { appState.showSuccess("Sent — they'll see it under Requests.") }
            )
        case .APPLICATION:
            ApplyNowSheet(
                toUserId: p.toUserId,
                recipientBrand: p.recipientName,
                briefs: p.briefs,
                onSent: { appState.showSuccess("Sent — they'll see it under Requests.") }
            )
        case .NOTE:
            BookCallSheet(
                toUserId: p.toUserId,
                recipientName: p.recipientName,
                onSent: { appState.showSuccess("Sent.") }
            )
        }
    }

    // MARK: - Drag Handling

    private func handleDragEnd(_ value: DragGesture.Value) {
        let xOffset = value.translation.width
        let velocity = value.predictedEndTranslation.width - value.translation.width

        if xOffset > swipeThreshold || velocity > velocityThreshold {
            // Swipe right — LIKE
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
            withAnimation(.spring(response: 0.22, dampingFraction: 0.82)) {
                offset = CGSize(width: 500, height: 0)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
                onSwipe(.LIKE)
                offset = .zero
            }
        } else if xOffset < -swipeThreshold || velocity < -velocityThreshold {
            // Swipe left — PASS
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
            withAnimation(.spring(response: 0.22, dampingFraction: 0.82)) {
                offset = CGSize(width: -500, height: 0)
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.22) {
                onSwipe(.PASS)
                offset = .zero
            }
        } else {
            // Snap back
            withAnimation(.spring(response: 0.32, dampingFraction: 0.72)) {
                offset = .zero
            }
        }
    }
}
