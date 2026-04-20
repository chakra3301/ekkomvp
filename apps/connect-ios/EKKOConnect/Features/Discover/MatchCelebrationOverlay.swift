import SwiftUI

/// Overlay shown when a mutual match is detected.
struct MatchCelebrationOverlay: View {
    let matchId: String
    let displayName: String
    var avatarUrl: String?
    var featuredImage: String?
    let onSendMessage: () -> Void
    let onKeepSwiping: () -> Void

    @State private var showContent = false

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
        }
    }
}
