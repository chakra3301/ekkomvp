import SwiftUI

struct ProfileView: View {
    @Environment(AppState.self) private var appState
    @State private var connectProfile: ConnectProfile?
    @State private var isLoading = true
    @State private var isTogglingActive = false

    var body: some View {
        Group {
            if isLoading {
                VStack {
                    Spacer()
                    ProgressView()
                    Spacer()
                }
            } else if let profile = connectProfile {
                profileContent(profile)
            } else {
                emptyState
            }
        }
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink(destination: SettingsView()) {
                    Image(systemName: "gearshape")
                        .foregroundStyle(.secondary)
                }
            }
        }
        .task { await loadProfile() }
    }

    // MARK: - Profile Content

    @ViewBuilder
    private func profileContent(_ profile: ConnectProfile) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                // Action bar
                HStack {
                    // Status
                    HStack(spacing: 6) {
                        Image(systemName: profile.isActive ? "eye.fill" : "eye.slash.fill")
                            .font(.caption)
                        Text(profile.isActive ? "Active" : "Paused")
                            .font(.subheadline.weight(.medium))
                    }
                    .foregroundStyle(profile.isActive ? .green : .secondary)

                    Spacer()

                    // Actions
                    HStack(spacing: 8) {
                        Button {
                            Task { await toggleActive() }
                        } label: {
                            Text(profile.isActive ? "Pause" : "Activate")
                                .font(.subheadline)
                        }
                        .buttonStyle(.glass)
                        .disabled(isTogglingActive)

                        NavigationLink(destination: ProfileSetupView()) {
                            HStack(spacing: 4) {
                                Image(systemName: "pencil")
                                    .font(.caption)
                                Text("Edit")
                                    .font(.subheadline)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(EKKOTheme.primary)
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius))
                        }
                    }
                }
                .padding(.horizontal, 16)

                // Profile card
                ConnectProfileCard(
                    displayName: appState.currentProfile?.displayName ?? "Your Name",
                    avatarUrl: appState.currentProfile?.avatarUrl,
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
                    editableAvatar: true
                )
                .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.cardRadius))

                // Stats
                HStack(spacing: 12) {
                    StatCard(value: profile.likesReceivedCount, label: "Likes Received")
                    StatCard(value: profile.matchesCount, label: "Matches")
                }
                .padding(.horizontal, 16)
            }
            .padding(.bottom, 24)
        }
        .refreshable { await loadProfile() }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "person.crop.circle")
                .font(.system(size: 48))
                .foregroundStyle(EKKOTheme.primary)

            Text("No Connect Profile Yet")
                .font(.title3.bold())

            Text("Set up your Connect profile to start discovering and matching with creatives.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            NavigationLink(destination: ProfileSetupView()) {
                Text("Set Up Profile")
            }
            .buttonStyle(PrimaryButtonStyle())
            .padding(.horizontal, 40)

            Spacer()
        }
    }

    // MARK: - Actions

    private func loadProfile() async {
        do {
            let profile: ConnectProfile = try await appState.trpc.query("connectProfile.getCurrent")
            connectProfile = profile
        } catch {
            connectProfile = nil
        }
        isLoading = false
    }

    private func toggleActive() async {
        isTogglingActive = true
        do {
            struct ToggleResult: Codable { let isActive: Bool }
            let result: ToggleResult = try await appState.trpc.mutate("connectProfile.toggleActive")
            connectProfile?.isActive = result.isActive
        } catch {
            // TODO: Show error toast
        }
        isTogglingActive = false
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let value: Int
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.title2.bold())
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .glassCard()
    }
}
