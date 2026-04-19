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
    @State private var profileTemplate: ConnectProfileTemplate = .default

    // Existing profile (for edit mode)
    @State private var existingProfile: ConnectProfile?
    @State private var isLoadingProfile = true

    private var isEditing: Bool { existingProfile != nil }

    /// Steps differ between first-time setup and edit:
    /// - Setup keeps the original 4 steps so signup stays fast.
    /// - Edit prepends a "Template" step so users can switch profile layouts.
    private var steps: [String] {
        isEditing
            ? ["Template", "Media", "Prompts", "Details", "Preview"]
            : ["Media", "Prompts", "Details", "Preview"]
    }

    private var currentStepName: String { steps[currentStep] }

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
                    if let jp = JPLabels.step(steps[currentStep]) {
                        JPSubLabel(text: jp, size: 11)
                    }
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
                        switch currentStepName {
                        case "Template":
                            templateStep
                        case "Media":
                            MediaSlotGrid(
                                slots: $mediaSlots,
                                userId: appState.session?.user.id.uuidString ?? ""
                            )
                        case "Prompts":
                            PromptEditor(prompts: $prompts)
                        case "Details":
                            detailsStep
                        case "Preview":
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
        .furiganaTitle(
            isEditing ? "Edit Profile" : "Profile Setup",
            isEditing ? JPLabels.screens.editProfile : JPLabels.screens.profileSetup
        )
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

    // MARK: - Template Step (edit mode only)

    private var templateStep: some View {
        VStack(spacing: 16) {
            ForEach(ConnectProfileTemplate.allCases) { template in
                TemplatePreviewCard(
                    template: template,
                    isSelected: profileTemplate == template,
                    onSelect: { profileTemplate = template }
                )
            }
        }
    }

    // MARK: - Helpers

    private var canProceed: Bool {
        switch currentStepName {
        case "Template": return true
        case "Media": return mediaSlots.count >= ConnectLimits.minMediaSlots
        case "Prompts": return prompts.count >= ConnectLimits.minPrompts &&
            prompts.allSatisfy { !$0.answer.trimmingCharacters(in: .whitespaces).isEmpty }
        default: return true
        }
    }

    private var stepDescription: String {
        switch currentStepName {
        case "Template": return "Pick how your profile looks. You can change this anytime — it doesn't affect your data."
        case "Media": return "Add up to 6 photos, videos, audio clips, or 3D models. First slot is featured."
        case "Prompts": return "Answer at least 1 prompt to show your personality and creative interests."
        case "Details": return "Add a bio, headline, what you're looking for, and social links."
        case "Preview": return "Preview your profile card. This is what others will see."
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
                profileTemplate = ConnectProfileTemplate.from(profile.profileTemplate)
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
            // Template is an advanced/editing-only field — only send it on edit
            // so initial signup payload stays minimal.
            let payload = ProfilePayload(
                headline: headline.isEmpty ? nil : headline,
                lookingFor: lookingFor.isEmpty ? nil : lookingFor,
                bio: bio.isEmpty ? nil : bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagramHandle.isEmpty ? nil : instagramHandle,
                twitterHandle: twitterHandle.isEmpty ? nil : twitterHandle,
                websiteUrl: websiteUrl.isEmpty ? nil : websiteUrl,
                location: location.isEmpty ? nil : location,
                profileTemplate: isEditing ? profileTemplate.rawValue : nil
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

// MARK: - Template Preview Card

struct TemplatePreviewCard: View {
    let template: ConnectProfileTemplate
    let isSelected: Bool
    let onSelect: () -> Void

    var body: some View {
        Button(action: onSelect) {
            VStack(alignment: .leading, spacing: 0) {
                preview
                    .frame(height: 160)
                    .frame(maxWidth: .infinity)
                    .clipped()

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(template.title)
                            .font(.custom(EKKOFont.regular, size: 18))
                            .foregroundStyle(.primary)
                        Spacer()
                        if isSelected {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.caption)
                                Text("Selected")
                                    .font(.caption.weight(.medium))
                            }
                            .foregroundStyle(EKKOTheme.primary)
                        }
                    }
                    Text(template.summary)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(14)
            }
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(isSelected ? EKKOTheme.primary : Color.white.opacity(0.1),
                            lineWidth: isSelected ? 2 : 0.5)
            )
            .shadow(color: .black.opacity(isSelected ? 0.2 : 0.08), radius: 12, y: 6)
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var preview: some View {
        switch template {
        case .default:   defaultPreview
        case .hero:      heroPreview
        case .editorial: editorialPreview
        case .stack:     stackPreview
        case .split:     splitPreview
        case .terminal:  terminalPreview
        case .photo:     photoPreview
        case .video:     videoPreview
        case .music:     musicPreview
        }
    }

    /// Schematic of the existing ConnectProfileCard layout.
    private var defaultPreview: some View {
        ZStack {
            LinearGradient(
                colors: [Color.gray.opacity(0.25), Color.gray.opacity(0.15)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack(spacing: 6) {
                // Hero block
                RoundedRectangle(cornerRadius: 6)
                    .fill(EKKOTheme.primary.opacity(0.35))
                    .frame(height: 60)
                    .overlay(alignment: .bottomLeading) {
                        Circle()
                            .fill(.white)
                            .frame(width: 24, height: 24)
                            .overlay(Circle().stroke(Color.white, lineWidth: 2))
                            .offset(x: 8, y: 12)
                    }
                    .padding(.horizontal, 16)

                Spacer().frame(height: 8)

                // Name + bio bars
                VStack(alignment: .leading, spacing: 3) {
                    RoundedRectangle(cornerRadius: 2).fill(.primary).frame(width: 70, height: 5)
                    RoundedRectangle(cornerRadius: 2).fill(.secondary.opacity(0.5)).frame(width: 90, height: 3)
                    RoundedRectangle(cornerRadius: 2).fill(.secondary.opacity(0.5)).frame(width: 60, height: 3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 24)

                Spacer()
            }
            .padding(.top, 8)
        }
    }

    /// Schematic of the new ConnectProfileHeroView: full-bleed cover, big name, work rail.
    private var heroPreview: some View {
        ZStack(alignment: .bottom) {
            // Full-bleed cover
            LinearGradient(
                colors: [EKKOTheme.primary.opacity(0.6), EKKOTheme.primary.opacity(0.15), .black.opacity(0.85)],
                startPoint: .top,
                endPoint: .bottom
            )

            // Big name overlay
            VStack(alignment: .leading, spacing: 4) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(.white)
                    .frame(width: 110, height: 10)
                    .shadow(color: EKKOTheme.primary.opacity(0.6), radius: 6)
                RoundedRectangle(cornerRadius: 2)
                    .fill(.white.opacity(0.7))
                    .frame(width: 70, height: 4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 16)
            .padding(.bottom, 56)

            // Avatar + work rail
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Circle()
                        .fill(.white)
                        .frame(width: 22, height: 22)
                        .overlay(Circle().stroke(Color.white, lineWidth: 2))
                    Spacer()
                }
                .padding(.horizontal, 16)
                .offset(y: 8)

                HStack(spacing: 6) {
                    ForEach(0..<4, id: \.self) { _ in
                        RoundedRectangle(cornerRadius: 4)
                            .fill(.white.opacity(0.9))
                            .frame(width: 36, height: 22)
                    }
                }
                .padding(.horizontal, 16)
            }
            .padding(.bottom, 8)
        }
    }

    /// Schematic of ConnectProfileMusicView: tiny header, now-playing
    /// card with thumbnail + waveform + transport, then a small track list.
    private var musicPreview: some View {
        ZStack {
            Color(.systemBackground)
            VStack(spacing: 4) {
                // Header
                HStack(spacing: 4) {
                    Circle().fill(EKKOTheme.primary.opacity(0.4)).frame(width: 12, height: 12)
                    RoundedRectangle(cornerRadius: 1).fill(.primary).frame(width: 50, height: 4)
                    Spacer()
                }

                // Now-playing card
                VStack(spacing: 4) {
                    HStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 2)
                            .fill(LinearGradient(colors: [.purple.opacity(0.6), .pink.opacity(0.4)], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 24, height: 24)
                        VStack(alignment: .leading, spacing: 2) {
                            RoundedRectangle(cornerRadius: 1).fill(EKKOTheme.primary).frame(width: 28, height: 2)
                            RoundedRectangle(cornerRadius: 1).fill(.primary).frame(width: 50, height: 3)
                            RoundedRectangle(cornerRadius: 1).fill(.secondary.opacity(0.4)).frame(width: 36, height: 2)
                        }
                        Spacer()
                    }

                    // Mini waveform
                    HStack(spacing: 0.5) {
                        ForEach(0..<24, id: \.self) { i in
                            Capsule()
                                .fill(i < 9 ? EKKOTheme.primary : .secondary.opacity(0.3))
                                .frame(width: 1.5, height: CGFloat(2 + (i * 7) % 12))
                        }
                    }
                    .padding(.top, 4)

                    // Transport
                    HStack(spacing: 6) {
                        Circle().fill(.secondary.opacity(0.3)).frame(width: 8, height: 8)
                        Circle().fill(EKKOTheme.primary).frame(width: 12, height: 12)
                        Circle().fill(.secondary.opacity(0.3)).frame(width: 8, height: 8)
                    }
                    .padding(.top, 4)
                }
                .padding(8)
                .background(EKKOTheme.primary.opacity(0.08), in: RoundedRectangle(cornerRadius: 6))

                // Track list
                VStack(spacing: 1.5) {
                    ForEach(0..<3, id: \.self) { i in
                        HStack(spacing: 4) {
                            RoundedRectangle(cornerRadius: 0.5).fill(i == 0 ? EKKOTheme.primary : .secondary.opacity(0.5)).frame(width: 6, height: 2)
                            RoundedRectangle(cornerRadius: 0.5).fill(.primary).frame(maxWidth: .infinity, maxHeight: 2)
                            RoundedRectangle(cornerRadius: 0.5).fill(.secondary.opacity(0.4)).frame(width: 18, height: 2)
                        }
                    }
                }
                .padding(.top, 4)

                Spacer()
            }
            .padding(8)
        }
    }

    /// Schematic of ConnectProfileVideoView: tiny header, cinemascope
    /// 2.39:1 player with REC HUD, scrubber, horizontal reel of clips.
    private var videoPreview: some View {
        ZStack {
            Color(.systemBackground)
            VStack(spacing: 4) {
                // Tiny header
                HStack(spacing: 4) {
                    Circle().fill(EKKOTheme.primary.opacity(0.4)).frame(width: 12, height: 12)
                    RoundedRectangle(cornerRadius: 1).fill(.primary).frame(width: 50, height: 4)
                    Spacer()
                }

                // Cinemascope player (very wide, low)
                ZStack(alignment: .topLeading) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color.black)
                        .aspectRatio(2.39, contentMode: .fit)
                    HStack(spacing: 2) {
                        Circle().fill(.red).frame(width: 3, height: 3)
                        RoundedRectangle(cornerRadius: 0.5).fill(.white).frame(width: 8, height: 2)
                    }
                    .padding(3)
                }
                .padding(.top, 6)

                // Scrubber
                ZStack(alignment: .leading) {
                    Capsule().fill(.secondary.opacity(0.2)).frame(height: 1.5)
                    Capsule().fill(EKKOTheme.primary).frame(width: 28, height: 1.5)
                }
                .padding(.top, 4)

                // Horizontal reel
                HStack(spacing: 3) {
                    ForEach(0..<4, id: \.self) { i in
                        RoundedRectangle(cornerRadius: 2)
                            .fill(i == 0 ? EKKOTheme.primary.opacity(0.5) : .secondary.opacity(0.3))
                            .frame(height: 22)
                            .overlay(
                                RoundedRectangle(cornerRadius: 2)
                                    .stroke(i == 0 ? EKKOTheme.primary : Color.clear, lineWidth: 1)
                            )
                    }
                }
                .padding(.top, 6)

                Spacer()
            }
            .padding(8)
        }
    }

    /// Schematic of ConnectProfilePhotoView: tiny header, big 3:4 frame
    /// with EXIF stripes, 4-col contact sheet below.
    private var photoPreview: some View {
        ZStack {
            Color(.systemBackground)
            VStack(spacing: 4) {
                // Tiny header
                HStack(spacing: 4) {
                    Circle().fill(EKKOTheme.primary.opacity(0.4)).frame(width: 12, height: 12)
                    RoundedRectangle(cornerRadius: 1).fill(.primary).frame(width: 50, height: 4)
                    Spacer()
                }
                .padding(.bottom, 2)

                // Big featured 3:4 frame with overlay stripes
                ZStack(alignment: .top) {
                    RoundedRectangle(cornerRadius: 2)
                        .fill(EKKOTheme.primary.opacity(0.4))
                        .aspectRatio(3.0 / 4.0, contentMode: .fit)
                        .frame(maxWidth: .infinity)

                    // Top stripe
                    HStack {
                        RoundedRectangle(cornerRadius: 0.5).fill(.white).frame(width: 18, height: 2)
                        Spacer()
                        RoundedRectangle(cornerRadius: 0.5).fill(.white).frame(width: 14, height: 2)
                    }
                    .padding(4)
                }
                .overlay(alignment: .bottom) {
                    HStack {
                        RoundedRectangle(cornerRadius: 0.5).fill(.white).frame(width: 30, height: 2)
                        Spacer()
                    }
                    .padding(4)
                }

                // Contact sheet 4×2 grid
                LazyVGrid(
                    columns: Array(repeating: GridItem(.flexible(), spacing: 1.5), count: 4),
                    spacing: 1.5
                ) {
                    ForEach(0..<8, id: \.self) { _ in
                        Rectangle()
                            .fill(.secondary.opacity(0.35))
                            .aspectRatio(1, contentMode: .fit)
                    }
                }
                .padding(2)
                .background(.secondary.opacity(0.1), in: RoundedRectangle(cornerRadius: 2))
                .padding(.top, 4)

                Spacer()
            }
            .padding(8)
        }
    }

    /// Schematic of ConnectProfileTerminalView: mono boot line, bordered
    /// header card, and a 4-row data table.
    private var terminalPreview: some View {
        ZStack {
            Color(.systemBackground)
            VStack(alignment: .leading, spacing: 4) {
                // Boot line
                HStack(spacing: 4) {
                    Circle().fill(EKKOTheme.primary).frame(width: 4, height: 4)
                    RoundedRectangle(cornerRadius: 0.5).fill(.secondary.opacity(0.5)).frame(width: 60, height: 2)
                }
                .padding(.bottom, 4)

                // Bordered header card
                RoundedRectangle(cornerRadius: 4)
                    .stroke(.secondary.opacity(0.5), lineWidth: 1)
                    .frame(height: 32)
                    .overlay(alignment: .leading) {
                        HStack(spacing: 4) {
                            Circle().fill(EKKOTheme.primary.opacity(0.5)).frame(width: 12, height: 12)
                            VStack(alignment: .leading, spacing: 2) {
                                RoundedRectangle(cornerRadius: 1).fill(EKKOTheme.primary).frame(width: 18, height: 2)
                                RoundedRectangle(cornerRadius: 1).fill(.primary).frame(width: 50, height: 4)
                            }
                        }
                        .padding(.leading, 4)
                    }

                // Stats bar
                RoundedRectangle(cornerRadius: 4)
                    .stroke(.secondary.opacity(0.5), lineWidth: 1)
                    .frame(height: 14)
                    .padding(.top, 2)

                // Mono command label
                RoundedRectangle(cornerRadius: 0.5).fill(EKKOTheme.primary).frame(width: 36, height: 2)

                // Data table rows
                VStack(spacing: 2) {
                    ForEach(0..<3, id: \.self) { _ in
                        HStack(spacing: 4) {
                            RoundedRectangle(cornerRadius: 0.5).fill(EKKOTheme.primary).frame(width: 8, height: 2)
                            RoundedRectangle(cornerRadius: 0.5).fill(.primary).frame(maxWidth: .infinity, maxHeight: 2)
                            RoundedRectangle(cornerRadius: 0.5).fill(.secondary.opacity(0.5)).frame(width: 16, height: 2)
                        }
                    }
                }
                .padding(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 4)
                        .stroke(.secondary.opacity(0.5), lineWidth: 1)
                )

                Spacer()
            }
            .padding(8)
        }
    }

    /// Schematic of ConnectProfileSplitView: short cover, left avatar rail
    /// + right name/NOW card, full-bleed 3-col grid.
    private var splitPreview: some View {
        ZStack {
            Color(.systemBackground)
            VStack(spacing: 0) {
                // Short cover
                Rectangle()
                    .fill(EKKOTheme.primary.opacity(0.5))
                    .frame(height: 36)

                // Split row: avatar (rail) + content
                HStack(alignment: .top, spacing: 6) {
                    Circle()
                        .fill(.white)
                        .frame(width: 22, height: 22)
                        .overlay(Circle().stroke(.white, lineWidth: 1.5))
                        .offset(y: -8)

                    VStack(alignment: .leading, spacing: 3) {
                        // Big name
                        RoundedRectangle(cornerRadius: 1).fill(.primary).frame(width: 60, height: 6)
                        // NOW card
                        RoundedRectangle(cornerRadius: 3)
                            .fill(.secondary.opacity(0.2))
                            .frame(height: 18)
                            .overlay(alignment: .topLeading) {
                                RoundedRectangle(cornerRadius: 1)
                                    .fill(EKKOTheme.primary)
                                    .frame(width: 14, height: 2)
                                    .padding(4)
                            }
                        // Bio bars
                        RoundedRectangle(cornerRadius: 1).fill(.secondary.opacity(0.4)).frame(height: 2)
                        RoundedRectangle(cornerRadius: 1).fill(.secondary.opacity(0.4)).frame(width: 50, height: 2)
                    }
                    Spacer()
                }
                .padding(.horizontal, 8)
                .padding(.top, 4)

                Spacer().frame(height: 8)

                // 3-col grid
                HStack(spacing: 1) {
                    ForEach(0..<3, id: \.self) { _ in
                        Rectangle()
                            .fill(.secondary.opacity(0.35))
                            .aspectRatio(1, contentMode: .fit)
                    }
                }
                .padding(.horizontal, 1)

                Spacer()
            }
        }
    }

    /// Schematic of ConnectProfileStackView: tiny header + 3-card stack
    /// with prev/Open/next controls.
    private var stackPreview: some View {
        ZStack {
            Color(.systemBackground)
            VStack(spacing: 6) {
                // Compact header — circle avatar + 2 name bars
                HStack(spacing: 6) {
                    Circle().fill(EKKOTheme.primary.opacity(0.4)).frame(width: 16, height: 16)
                    VStack(alignment: .leading, spacing: 2) {
                        RoundedRectangle(cornerRadius: 1).fill(.primary).frame(width: 50, height: 4)
                        RoundedRectangle(cornerRadius: 1).fill(.secondary.opacity(0.4)).frame(width: 32, height: 2)
                    }
                    Spacer()
                }
                .padding(.horizontal, 14)
                .padding(.top, 10)

                // 3-card stack — back two slightly offset behind front
                ZStack {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(.secondary.opacity(0.15))
                        .frame(width: 90, height: 60)
                        .offset(y: 12)
                        .scaleEffect(0.92)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(.secondary.opacity(0.25))
                        .frame(width: 90, height: 60)
                        .offset(y: 6)
                        .scaleEffect(0.96)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(EKKOTheme.primary.opacity(0.5))
                        .frame(width: 90, height: 60)
                        .shadow(color: .black.opacity(0.3), radius: 6, y: 4)
                }
                .padding(.top, 4)

                // Controls — left arrow, Open pill, right arrow
                HStack(spacing: 4) {
                    Capsule().fill(.secondary.opacity(0.25)).frame(width: 14, height: 8)
                    Capsule().fill(EKKOTheme.primary).frame(width: 50, height: 8)
                    Capsule().fill(.secondary.opacity(0.25)).frame(width: 14, height: 8)
                }
                .padding(.top, 12)

                Spacer()
            }
        }
    }

    /// Schematic of ConnectProfileEditorialView: mono masthead, big serif
    /// name, drop-cap bio, 2-column work grid.
    private var editorialPreview: some View {
        ZStack {
            Color(.systemBackground)

            VStack(alignment: .leading, spacing: 6) {
                // Masthead bar
                HStack {
                    RoundedRectangle(cornerRadius: 1).fill(.secondary.opacity(0.7)).frame(width: 32, height: 3)
                    Spacer()
                    RoundedRectangle(cornerRadius: 1).fill(.secondary.opacity(0.7)).frame(width: 18, height: 3)
                }
                .overlay(alignment: .bottom) {
                    Rectangle().fill(.secondary.opacity(0.4)).frame(height: 0.5).offset(y: 4)
                }
                .padding(.bottom, 6)

                // Big name
                RoundedRectangle(cornerRadius: 2).fill(.primary).frame(width: 110, height: 14)
                RoundedRectangle(cornerRadius: 2).fill(.primary).frame(width: 80, height: 14)

                // Drop-cap row
                HStack(alignment: .top, spacing: 4) {
                    Text("A")
                        .font(.system(size: 22, weight: .regular))
                        .foregroundStyle(EKKOTheme.primary)
                    VStack(alignment: .leading, spacing: 2) {
                        ForEach(0..<3, id: \.self) { _ in
                            RoundedRectangle(cornerRadius: 1).fill(.secondary.opacity(0.4)).frame(height: 2)
                        }
                    }
                }
                .padding(.top, 4)

                // 2-col work grid
                HStack(spacing: 4) {
                    RoundedRectangle(cornerRadius: 2).fill(.secondary.opacity(0.45)).aspectRatio(1, contentMode: .fit)
                    RoundedRectangle(cornerRadius: 2).fill(.secondary.opacity(0.35)).aspectRatio(1, contentMode: .fit)
                }
                .padding(.top, 2)

                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.top, 12)
        }
    }
}
