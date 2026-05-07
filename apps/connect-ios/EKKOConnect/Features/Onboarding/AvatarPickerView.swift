import SwiftUI

/// First-run avatar picker. Sits between the theme picker and
/// ProfileSetupView. Skipping is fine — the user can add an avatar later
/// from the profile editor. The actual upload is delegated to the existing
/// `EditableAvatarView`, which handles PhotosPicker, Supabase Storage upload,
/// and the `profile.updateAvatar` mutation.
struct AvatarPickerView: View {
    @Environment(AppState.self) private var appState

    private var hasAvatar: Bool {
        let url = appState.currentProfile?.avatarUrl ?? ""
        return !url.isEmpty
    }

    var body: some View {
        VStack(spacing: 0) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Add a profile picture")
                    .font(.title2.bold())
                Text("People will see this on your profile, posts, and matches. You can skip and add one later.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 16)
            .padding(.top, 24)
            .padding(.bottom, 32)

            Spacer()

            EditableAvatarView(
                url: appState.currentProfile?.avatarUrl,
                name: appState.currentProfile?.displayName ?? "You",
                size: 160
            )

            Text("Tap to choose a photo")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.top, 16)

            Spacer()

            Button {
                appState.needsAvatar = false
            } label: {
                Text(hasAvatar ? "Continue" : "Skip for now")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.primary)
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
            }
            .buttonStyle(.plain)
            .glassBubble(cornerRadius: 14)
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .background(AmbientBackground())
    }
}
