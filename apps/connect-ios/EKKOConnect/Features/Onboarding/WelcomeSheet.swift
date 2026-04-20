import SwiftUI

/// First-run welcome sheet shown once after the user completes profile setup.
/// Tracks completion in UserDefaults so it never shows again.
struct WelcomeSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 24) {
            Capsule()
                .fill(Color.secondary.opacity(0.4))
                .frame(width: 36, height: 4)
                .padding(.top, 10)

            VStack(spacing: 6) {
                Text("Welcome to")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                HStack(spacing: 6) {
                    Text("EKKO")
                        .foregroundStyle(Color.accentColor)
                    + Text(" Connect")
                        .foregroundStyle(.primary)
                }
                .font(.title.bold())
            }
            .padding(.top, 8)

            Text("Here's how it works")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)

            VStack(spacing: 16) {
                tip(icon: "safari", color: Color.accentColor,
                    title: "Discover",
                    body: "Swipe right on creatives you want to connect with. Left to pass.")
                tip(icon: "heart.fill", color: .pink,
                    title: "See who likes you",
                    body: "Incoming likes show up in the Likes tab. Like back to match.")
                tip(icon: "message.fill", color: .green,
                    title: "Chat",
                    body: "Matches unlock conversations — share ideas, photos, and voice notes.")
                tip(icon: "hand.raised.fill", color: .orange,
                    title: "Stay safe",
                    body: "Block or report anyone from their profile. We review every report within 24 hours.")
            }
            .padding(.horizontal, 20)

            Spacer()

            Button {
                markCompleted()
                dismiss()
            } label: {
                Text("Get started")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                    .background(Color.accentColor)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
            .accessibilityLabel("Get started")
        }
        .presentationDetents([.large])
        .presentationDragIndicator(.hidden)
        .interactiveDismissDisabled(false)
        .onDisappear {
            markCompleted()
        }
    }

    @ViewBuilder
    private func tip(icon: String, color: Color, title: String, body: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(
                    LinearGradient(
                        colors: [color, color.opacity(0.7)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(body)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
    }

    private func markCompleted() {
        UserDefaults.standard.set(true, forKey: OnboardingTracker.welcomeSeenKey)
    }
}

/// Static helper to know whether the onboarding has been completed.
enum OnboardingTracker {
    static let welcomeSeenKey = "ekko-welcome-seen"

    static var hasSeenWelcome: Bool {
        UserDefaults.standard.bool(forKey: welcomeSeenKey)
    }

    static func reset() {
        UserDefaults.standard.removeObject(forKey: welcomeSeenKey)
    }
}
