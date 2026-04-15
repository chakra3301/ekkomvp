import SwiftUI

struct ProfileSetupView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss
    @State private var currentStep = 0
    @State private var isSubmitting = false
    @State private var initialized = false
    @State private var errorMessage: String?

    // Form state
    @State private var mediaSlots: [MediaSlot] = []
    @State private var prompts: [PromptEntry] = []
    @State private var headline = ""
    @State private var lookingFor = ""
    @State private var bio = ""
    @State private var location = ""
    @State private var instagramHandle = ""
    @State private var twitterHandle = ""
    @State private var websiteUrl = ""

    // Existing profile (for edit mode)
    @State private var existingProfile: ConnectProfile?
    @State private var isLoadingProfile = true

    private let steps = ["Media", "Prompts", "Details", "Preview"]
    private var isEditing: Bool { existingProfile != nil }

    var body: some View {
        VStack(spacing: 0) {
            if isLoadingProfile {
                Spacer()
                ProgressView()
                Spacer()
            } else {
                // Step Indicator
                StepIndicator(steps: steps, currentStep: currentStep)
                    .padding(.vertical, 16)

                // Step title + description
                VStack(alignment: .leading, spacing: 4) {
                    Text(steps[currentStep])
                        .font(.title3.bold())
                    Text(stepDescription)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16)
                .padding(.bottom, 16)

                // Step content
                ScrollView {
                    Group {
                        switch currentStep {
                        case 0:
                            MediaSlotGrid(
                                slots: $mediaSlots,
                                userId: appState.session?.user.id.uuidString ?? ""
                            )
                        case 1:
                            PromptEditor(prompts: $prompts)
                        case 2:
                            detailsStep
                        case 3:
                            previewStep
                        default:
                            EmptyView()
                        }
                    }
                    .padding(.horizontal, 16)
                }

                // Navigation
                HStack(spacing: 12) {
                    if currentStep > 0 {
                        Button("Back") {
                            withAnimation { currentStep -= 1 }
                        }
                        .buttonStyle(.glass)
                        .frame(maxWidth: .infinity)
                    }

                    if currentStep < steps.count - 1 {
                        Button("Next") {
                            withAnimation { currentStep += 1 }
                        }
                        .buttonStyle(PrimaryButtonStyle(isDisabled: !canProceed))
                        .disabled(!canProceed)
                        .frame(maxWidth: .infinity)
                    } else {
                        Button {
                            Task { await handleSave() }
                        } label: {
                            if isSubmitting {
                                ProgressView().tint(.white)
                            } else {
                                Text(isEditing ? "Save Changes" : "Activate Profile")
                            }
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .disabled(isSubmitting)
                        .frame(maxWidth: .infinity)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
            }
        }
        .navigationTitle(isEditing ? "Edit Profile" : "Profile Setup")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadExistingProfile() }
        .alert("Error", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            if let msg = errorMessage { Text(msg) }
        }
    }

    // MARK: - Details Step

    private var detailsStep: some View {
        VStack(spacing: 16) {
            FormField(label: "Bio") {
                TextEditor(text: $bio)
                    .frame(minHeight: 100)
                    .padding(8)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .overlay(alignment: .bottomTrailing) {
                        Text("\(bio.count)/\(ConnectLimits.bioMax)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .padding(8)
                    }
            }

            FormField(label: "Headline") {
                TextField("e.g. Graphic Designer & Illustrator", text: $headline)
                    .padding(12)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            FormField(label: "What are you looking for?") {
                TextEditor(text: $lookingFor)
                    .frame(minHeight: 80)
                    .padding(8)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            FormField(label: "Location") {
                TextField("e.g. Los Angeles, CA", text: $location)
                    .padding(12)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            VStack(alignment: .leading, spacing: 12) {
                Text("Social Links")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.secondary)

                HStack {
                    Image(systemName: "camera")
                        .foregroundStyle(.secondary)
                    Text("@")
                        .foregroundStyle(.secondary)
                    TextField("instagram", text: $instagramHandle)
                }
                .padding(12)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 10))

                HStack {
                    Image(systemName: "at")
                        .foregroundStyle(.secondary)
                    Text("@")
                        .foregroundStyle(.secondary)
                    TextField("twitter", text: $twitterHandle)
                }
                .padding(12)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 10))

                HStack {
                    Image(systemName: "globe")
                        .foregroundStyle(.secondary)
                    TextField("https://your-website.com", text: $websiteUrl)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                }
                .padding(12)
                .background(.ultraThinMaterial)
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    // MARK: - Preview Step

    private var previewStep: some View {
        ConnectProfileCard(
            displayName: appState.currentProfile?.displayName ?? "Your Name",
            avatarUrl: appState.currentProfile?.avatarUrl,
            headline: headline.isEmpty ? nil : headline,
            location: location.isEmpty ? nil : location,
            lookingFor: lookingFor.isEmpty ? nil : lookingFor,
            bio: bio.isEmpty ? nil : bio,
            mediaSlots: mediaSlots,
            prompts: prompts,
            instagramHandle: instagramHandle.isEmpty ? nil : instagramHandle,
            twitterHandle: twitterHandle.isEmpty ? nil : twitterHandle,
            websiteUrl: websiteUrl.isEmpty ? nil : websiteUrl
        )
    }

    // MARK: - Helpers

    private var canProceed: Bool {
        switch currentStep {
        case 0: return mediaSlots.count >= ConnectLimits.minMediaSlots
        case 1: return prompts.count >= ConnectLimits.minPrompts &&
            prompts.allSatisfy { !$0.answer.trimmingCharacters(in: .whitespaces).isEmpty }
        default: return true
        }
    }

    private var stepDescription: String {
        switch currentStep {
        case 0: return "Add up to 6 photos, videos, audio clips, or 3D models. First slot is featured."
        case 1: return "Answer at least 1 prompt to show your personality and creative interests."
        case 2: return "Add a bio, headline, what you're looking for, and social links."
        case 3: return "Preview your profile card. This is what others will see."
        default: return ""
        }
    }

    // MARK: - Data Loading

    private func loadExistingProfile() async {
        do {
            let profile: ConnectProfile = try await appState.trpc.query("connectProfile.getCurrent")
            existingProfile = profile
            print("[ProfileSetup] Loaded existing profile: \(profile.id)")
            if !initialized {
                mediaSlots = profile.mediaSlots
                prompts = profile.prompts
                headline = profile.headline ?? ""
                lookingFor = profile.lookingFor ?? ""
                bio = profile.bio ?? ""
                location = profile.location ?? ""
                instagramHandle = profile.instagramHandle ?? ""
                twitterHandle = profile.twitterHandle ?? ""
                websiteUrl = profile.websiteUrl ?? ""
                initialized = true
            }
        } catch {
            print("[ProfileSetup] Load failed: \(error)")
            existingProfile = nil
        }
        isLoadingProfile = false
    }

    // MARK: - Save

    private func handleSave() async {
        isSubmitting = true
        do {
            let payload = ProfilePayload(
                headline: headline.isEmpty ? nil : headline,
                lookingFor: lookingFor.isEmpty ? nil : lookingFor,
                bio: bio.isEmpty ? nil : bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagramHandle.isEmpty ? nil : instagramHandle,
                twitterHandle: twitterHandle.isEmpty ? nil : twitterHandle,
                websiteUrl: websiteUrl.isEmpty ? nil : websiteUrl,
                location: location.isEmpty ? nil : location
            )

            struct GenericResponse: Codable { let id: String }

            if isEditing {
                let _: GenericResponse = try await appState.trpc.mutate("connectProfile.update", input: payload)
            } else {
                do {
                    let _: GenericResponse = try await appState.trpc.mutate("connectProfile.create", input: payload)
                } catch let error as TRPCError {
                    // 409 CONFLICT = profile already exists, use update instead
                    if case .httpError(let code) = error, code == 409 {
                        let _: GenericResponse = try await appState.trpc.mutate("connectProfile.update", input: payload)
                    } else if case .serverError(let code, _) = error, code == "CONFLICT" {
                        let _: GenericResponse = try await appState.trpc.mutate("connectProfile.update", input: payload)
                    } else {
                        throw error
                    }
                }
            }

            // Refresh AppState so the router advances to MainTabView
            // (when setup was required as a first-run gate).
            await appState.refreshConnectProfile()

            // If we were invoked from inside a NavigationStack (edit flow),
            // pop back. When used as the first-run gate, there's nothing to dismiss —
            // the router automatically switches to MainTabView once currentConnectProfile is set.
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
            print("[ProfileSetup] Save error: \(error)")
        }
        isSubmitting = false
    }
}
