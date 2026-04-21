import SwiftUI

/// Overlay shown when a mutual match is detected.
struct MatchCelebrationOverlay: View {
    let matchId: String
    let displayName: String
    var avatarUrl: String?
    var featuredImage: String?
    /// Lifetime count of likes this user has received — drives the post-match
    /// upsell teaser. Pass 0 (or nil handler) to hide the teaser entirely.
    var otherLikesCount: Int = 0
    let onSendMessage: () -> Void
    let onKeepSwiping: () -> Void
    /// Tapped when the user taps the "N others liked you" teaser. When nil, the
    /// teaser doesn't render (e.g. Infinite-tier viewers who can already see
    /// their likers have no reason to see this card).
    var onSeeLikes: (() -> Void)?

    @State private var showContent = false
    @State private var showTeaser = false
    @State private var teaserPulse = false

    private var teaserVisible: Bool {
        onSeeLikes != nil && otherLikesCount > 0
    }

    var body: some View {
        ZStack {
            // Backdrop
            Color.black.opacity(0.7)
                .ignoresSafeArea()
                .onTapGesture { onKeepSwiping() }

            VStack(spacing: 24) {
                Spacer()

                // Title
                VStack(spacing: 8) {
                    Text("It's a Match!")
                        .font(.largeTitle.bold())
                        .foregroundStyle(.white)

                    Text("You and \(displayName) both liked each other")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                }
                .scaleEffect(showContent ? 1 : 0.5)
                .opacity(showContent ? 1 : 0)

                // Avatar
                AvatarView(url: avatarUrl, name: displayName, size: 96)
                    .scaleEffect(showContent ? 1 : 0.3)
                    .opacity(showContent ? 1 : 0)

                // Post-match upsell teaser — arrives ~0.9s after the match
                // lands so it reads as a surprise reward, not nagware.
                if teaserVisible {
                    likesTeaser
                        .opacity(showTeaser ? 1 : 0)
                        .offset(y: showTeaser ? 0 : 16)
                        .padding(.horizontal, 32)
                }

                Spacer()

                // Actions
                VStack(spacing: 12) {
                    Button {
                        onSendMessage()
                    } label: {
                        HStack {
                            Image(systemName: "paperplane.fill")
                            Text("Send Message")
                        }
                        .font(.headline)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                    }

                    Button {
                        onKeepSwiping()
                    } label: {
                        Text("Keep Swiping")
                            .font(.subheadline)
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 48)
                .opacity(showContent ? 1 : 0)
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                showContent = true
            }
            // Heavy haptic for match
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)

            // Teaser arrives slightly after the hero animation
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
                withAnimation(.spring(response: 0.55, dampingFraction: 0.75)) {
                    showTeaser = true
                }
                // Soft haptic so the teaser has its own arrival moment
                UIImpactFeedbackGenerator(style: .soft).impactOccurred()
            }
        }
    }

    private var likesTeaser: some View {
        Button {
            onSeeLikes?()
        } label: {
            HStack(spacing: 12) {
                // Neon magenta star — same sprite as the globe pins
                Image(uiImage: EKKOStarSprite.image(size: 36, variant: .detailed))
                    .renderingMode(.template)
                    .resizable()
                    .frame(width: 26, height: 26)
                    .foregroundStyle(Color(red: 0.85, green: 0.0, blue: 1.0))
                    .shadow(color: Color(red: 0.85, green: 0.0, blue: 1.0).opacity(0.9), radius: 10)
                    .opacity(teaserPulse ? 1.0 : 0.7)
                    .scaleEffect(teaserPulse ? 1.05 : 0.9)

                VStack(alignment: .leading, spacing: 2) {
                    Text("\(otherLikesCount) \(otherLikesCount == 1 ? "other" : "others") already liked you")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                    Text("Unlock Infinite to see who")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.75))
                }

                Spacer(minLength: 0)

                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.white.opacity(0.8))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color(red: 0.85, green: 0.0, blue: 1.0).opacity(0.5), lineWidth: 0.8)
            )
            .shadow(color: Color(red: 0.85, green: 0.0, blue: 1.0).opacity(0.3), radius: 16, y: 6)
        }
        .buttonStyle(.plain)
        .onAppear {
            withAnimation(.easeInOut(duration: 1.1).repeatForever(autoreverses: true)) {
                teaserPulse = true
            }
        }
        .accessibilityLabel("\(otherLikesCount) others already liked you. Tap to unlock.")
    }
}
