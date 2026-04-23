import SwiftUI

struct ProfileView: View {
    @Environment(AppState.self) private var appState
    @State private var isLoading = true
    @State private var isTogglingActive = false

    // MARK: - Edit mode state
    @State private var isEditMode = false
    @State private var isSaving = false
    @State private var activeEditor: ProfileEditSection?
    @State private var showLeaveConfirmation = false
    @State private var saveError: String?

    /// Local mirror of the profile while editing. Updated by inline sheets.
    /// Compared to `originalSnapshot` for the unsaved-changes guard.
    @State private var draft: ProfileDraft = .init()
    @State private var originalSnapshot: ProfileDraft = .init()
    @State private var showShareSheet = false

    /// Read through to AppState so tier changes from a purchase propagate
    /// automatically — no local copy to go stale.
    private var connectProfile: ConnectProfile? {
        appState.currentConnectProfile
    }

    private var hasUnsavedChanges: Bool {
        draft != originalSnapshot
    }

    var body: some View {
        Group {
            if isLoading && connectProfile == nil {
                SkeletonProfile()
            } else if let profile = connectProfile {
                profileContent(profile)
            } else {
                emptyState
            }
        }
        .furiganaTitle("Profile", JPLabels.screens.profile)
        .toolbar {
            // Hide the gear in edit mode so users can't navigate away accidentally.
            if !isEditMode {
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 16) {
                        Button {
                            showShareSheet = true
                        } label: {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundStyle(.secondary)
                        }
                        .accessibilityLabel("Share profile")

                        NavigationLink(destination: SettingsView()) {
                            Image(systemName: "gearshape")
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showShareSheet) {
            // Hero = first media slot (matches how SwipeCard picks its hero).
            let heroUrl = connectProfile?.mediaSlots
                .min(by: { $0.sortOrder < $1.sortOrder })?.url

            ProfileShareSheet(
                displayName: appState.currentProfile?.displayName ?? "Creative",
                username: appState.currentProfile?.username,
                headline: connectProfile?.headline,
                location: connectProfile?.location,
                isInfinite: connectProfile?.connectTier == .INFINITE,
                heroUrl: heroUrl,
                avatarUrl: appState.currentProfile?.avatarUrl,
                bio: connectProfile?.bio,
                lookingFor: connectProfile?.lookingFor,
                likes: connectProfile?.likesReceivedCount ?? 0,
                matches: connectProfile?.matchesCount ?? 0,
                projects: connectProfile?.mediaSlots.count ?? 0,
                accentHex: connectProfile?.accentColor
            )
            .presentationDetents([.large])
            .presentationDragIndicator(.hidden)
        }
        .task { await loadProfile() }
        .confirmationDialog(
            "Discard changes?",
            isPresented: $showLeaveConfirmation,
            titleVisibility: .visible
        ) {
            Button("Discard changes", role: .destructive) {
                exitEditMode(discardChanges: true)
            }
            Button("Keep editing", role: .cancel) {}
        } message: {
            Text("Your unsaved changes will be lost.")
        }
        .alert("Couldn't save", isPresented: .init(
            get: { saveError != nil },
            set: { if !$0 { saveError = nil } }
        )) {
            Button("OK") { saveError = nil }
        } message: {
            if let saveError { Text(saveError) }
        }
    }

    // MARK: - Profile Content

    @ViewBuilder
    private func profileContent(_ profile: ConnectProfile) -> some View {
        let template: ConnectProfileTemplate = isEditMode
            ? (ConnectProfileTemplate(rawValue: draft.profileTemplate) ?? .default)
            : ConnectProfileTemplate.from(profile.profileTemplate)

        VStack(spacing: 0) {
            if isEditMode {
                editToolbar
                    .padding(.top, 8)
                    .padding(.bottom, 12)
                    .background(.ultraThinMaterial)
                    .overlay(alignment: .bottom) {
                        Rectangle()
                            .fill(Color.secondary.opacity(0.15))
                            .frame(height: 0.5)
                    }
                    .zIndex(1)
            }

            // ZStack so the view-mode toolbar can float IN FRONT of the
            // Hero cover (which starts at the very top of the scroll).
            ZStack(alignment: .top) {
                ScrollView {
                    templateBody(template, profile: profile)
                        .padding(.bottom, 24)
                }
                .coordinateSpace(name: "heroScroll")
                .refreshable {
                    guard !isEditMode else { return }
                    await loadProfile()
                }

                if !isEditMode {
                    viewToolbar(profile)
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                }
            }
        }
        .sheet(item: $activeEditor) { section in
            sheetForSection(section)
        }
    }

    @ViewBuilder
    private func templateBody(_ template: ConnectProfileTemplate, profile: ConnectProfile) -> some View {
        let editActions = isEditMode ? makeEditActions() : nil

        // Pull live values from `draft` while in edit mode so template
        // switching previews real data.
        let displayName = appState.currentProfile?.displayName ?? "Your Name"
        let avatarUrl   = appState.currentProfile?.avatarUrl
        let headline    = isEditMode ? trimmedOrNil(draft.headline) : profile.headline
        let location    = isEditMode ? trimmedOrNil(draft.location) : profile.location
        let lookingFor  = isEditMode ? trimmedOrNil(draft.lookingFor) : profile.lookingFor
        let bio         = isEditMode ? trimmedOrNil(draft.bio) : profile.bio
        let mediaSlots  = isEditMode ? draft.mediaSlots : profile.mediaSlots
        let prompts     = isEditMode ? draft.prompts : profile.prompts
        let instagram   = isEditMode ? trimmedOrNil(draft.instagramHandle) : profile.instagramHandle
        let twitter     = isEditMode ? trimmedOrNil(draft.twitterHandle) : profile.twitterHandle
        let website     = isEditMode ? trimmedOrNil(draft.websiteUrl) : profile.websiteUrl

        switch template {
        case .hero:
            ConnectProfileHeroView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .editorial:
            ConnectProfileEditorialView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .stack:
            ConnectProfileStackView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .split:
            ConnectProfileSplitView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                username: appState.currentProfile?.username,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .terminal:
            ConnectProfileTerminalView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                username: appState.currentProfile?.username,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .photo:
            ConnectProfilePhotoView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                username: appState.currentProfile?.username,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .video:
            ConnectProfileVideoView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                username: appState.currentProfile?.username,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .music:
            ConnectProfileMusicView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                username: appState.currentProfile?.username,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .client:
            ConnectProfileClientView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                clientData: isEditMode ? draft.clientData : profile.clientData,
                editActions: editActions
            )

        case .hire:
            ConnectProfileHireView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                hireData: isEditMode ? draft.hireData : profile.hireData,
                editActions: editActions
            )

        case .threeD:
            ConnectProfileThreeDView(
                displayName: displayName,
                avatarUrl: avatarUrl,
                username: appState.currentProfile?.username,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                likesReceivedCount: profile.likesReceivedCount,
                matchesCount: profile.matchesCount,
                isAdmin: appState.isAdmin,
                editActions: editActions
            )

        case .default:
            ConnectProfileCard(
                displayName: displayName,
                avatarUrl: avatarUrl,
                headline: headline,
                location: location,
                lookingFor: lookingFor,
                bio: bio,
                mediaSlots: mediaSlots,
                prompts: prompts,
                instagramHandle: instagram,
                twitterHandle: twitter,
                websiteUrl: website,
                connectTier: profile.connectTier,
                isAdmin: appState.isAdmin,
                editableAvatar: !isEditMode,
                editActions: editActions
            )
            .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.cardRadius))

            // Stats only outside edit mode (Hero has its own inline stats).
            if !isEditMode {
                HStack(spacing: 12) {
                    StatCard(value: profile.likesReceivedCount, label: "Likes Received")
                    StatCard(value: profile.matchesCount, label: "Matches")
                }
                .padding(.horizontal, 16)
            }
        }
    }

    private func trimmedOrNil(_ s: String) -> String? {
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }

    // MARK: - View toolbar (display mode)

    private func viewToolbar(_ profile: ConnectProfile) -> some View {
        HStack {
            // Status chip — glass background so it reads over the Hero cover.
            HStack(spacing: 6) {
                Image(systemName: profile.isActive ? "eye.fill" : "eye.slash.fill")
                    .font(.caption)
                VStack(alignment: .leading, spacing: 0) {
                    JPSubLabel(
                        text: profile.isActive ? JPLabels.status.active : JPLabels.status.paused,
                        size: 7
                    )
                    Text(profile.isActive ? "Active" : "Paused")
                        .font(.subheadline.weight(.medium))
                }
            }
            .foregroundStyle(profile.isActive ? .green : .secondary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())

            Spacer()

            HStack(spacing: 8) {
                Button {
                    Task { await toggleActive() }
                } label: {
                    Text(profile.isActive ? "Pause" : "Activate")
                        .font(.subheadline)
                }
                .buttonStyle(.glass)
                .disabled(isTogglingActive)

                Button {
                    enterEditMode()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "pencil").font(.caption)
                        Text("Edit profile").font(.subheadline)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.accentColor)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius))
                    .shadow(color: .black.opacity(0.2), radius: 6, y: 2)
                }
            }
        }
    }

    // MARK: - Edit toolbar

    private var editToolbar: some View {
        VStack(spacing: 10) {
            HStack {
                templateMenu
                Spacer()
                Button {
                    attemptExitEditMode()
                } label: {
                    Text("Cancel").font(.subheadline)
                }
                .buttonStyle(.glass)
                .disabled(isSaving)

                Button {
                    Task { await save() }
                } label: {
                    HStack(spacing: 4) {
                        if isSaving {
                            ProgressView().tint(.white).controlSize(.small)
                        } else {
                            Image(systemName: "checkmark").font(.caption)
                        }
                        Text("Save").font(.subheadline.weight(.semibold))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.accentColor)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius))
                    .opacity(isSaving ? 0.7 : 1.0)
                }
                .disabled(isSaving)
            }
            .padding(.horizontal, 16)

            // Subtle "Editing" banner so it's obvious the page is in edit mode.
            HStack(spacing: 6) {
                Image(systemName: "pencil.circle.fill")
                    .foregroundStyle(.tint)
                Text("Editing — tap any section to change it")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
                Spacer()
                if hasUnsavedChanges {
                    Text("Unsaved changes")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.orange)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private var templateMenu: some View {
        Menu {
            ForEach(ConnectProfileTemplate.allCases) { template in
                Button {
                    draft.profileTemplate = template.rawValue
                } label: {
                    if draft.profileTemplate == template.rawValue {
                        Label(template.title, systemImage: "checkmark")
                    } else {
                        Text(template.title)
                    }
                }
            }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "rectangle.3.group")
                    .font(.caption.weight(.medium))
                Text("Template: \(currentTemplateTitle)")
                    .font(.subheadline.weight(.medium))
                Image(systemName: "chevron.down")
                    .font(.caption2)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(Color.white.opacity(0.15), lineWidth: 0.5))
        }
    }

    private var currentTemplateTitle: String {
        ConnectProfileTemplate(rawValue: draft.profileTemplate)?.title ?? "Default"
    }

    // MARK: - Empty State (first-time setup keeps using ProfileSetupView)

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "person.crop.circle")
                .font(.system(size: 48))
                .foregroundStyle(.tint)

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

    // MARK: - Edit mode lifecycle

    private func enterEditMode() {
        guard let profile = connectProfile else { return }
        let snap = ProfileDraft.from(profile)
        draft = snap
        originalSnapshot = snap
        isEditMode = true
    }

    private func attemptExitEditMode() {
        if hasUnsavedChanges {
            showLeaveConfirmation = true
        } else {
            exitEditMode(discardChanges: false)
        }
    }

    private func exitEditMode(discardChanges: Bool) {
        if discardChanges {
            draft = originalSnapshot
        }
        isEditMode = false
    }

    // MARK: - Sheet dispatch

    @ViewBuilder
    private func sheetForSection(_ section: ProfileEditSection) -> some View {
        switch section {
        case .media:
            ProfileMediaSheet(
                mediaSlots: $draft.mediaSlots,
                userId: appState.session?.user.id.uuidString ?? ""
            )
        case .headlineHeadlineLocation:
            ProfileHeadlineLocationSheet(
                headline: $draft.headline,
                location: $draft.location
            )
        case .bio:
            ProfileTextEditorSheet(
                title: "About",
                japaneseTitle: JPLabels.sections.about,
                placeholder: "Tell others about yourself…",
                charLimit: ConnectLimits.bioMax,
                multiline: true,
                text: $draft.bio
            )
        case .lookingFor:
            ProfileTextEditorSheet(
                title: "Looking For",
                japaneseTitle: JPLabels.sections.lookingFor,
                placeholder: "What are you looking for?",
                charLimit: ConnectLimits.lookingForMax,
                multiline: true,
                text: $draft.lookingFor
            )
        case .prompts:
            ProfilePromptsSheet(prompts: $draft.prompts)
        case .socials:
            ProfileSocialsSheet(
                instagramHandle: $draft.instagramHandle,
                twitterHandle: $draft.twitterHandle,
                websiteUrl: $draft.websiteUrl
            )
        case .mediaTitle(let index):
            // Per-slot caption editor used by Editorial. Bind to the
            // chosen slot's title via a derived Binding.
            let titleBinding = Binding<String>(
                get: { mediaTitleAt(index: index) },
                set: { setMediaTitle(index: index, $0) }
            )
            ProfileTextEditorSheet(
                title: "Caption",
                japaneseTitle: nil,
                placeholder: "Caption for № \(String(format: "%02d", index + 1))",
                charLimit: 100,
                multiline: false,
                text: titleBinding
            )

        case .audioMeta(let index):
            // BPM + KEY editor for an audio slot (Music template).
            let bpmBinding = Binding<Int?>(
                get: { audioMetaAt(index: index).bpm },
                set: { setAudioBPM(index: index, $0) }
            )
            let keyBinding = Binding<String?>(
                get: { audioMetaAt(index: index).key },
                set: { setAudioKey(index: index, $0) }
            )
            ProfileAudioMetaSheet(bpm: bpmBinding, key: keyBinding)

        case .hireData:
            ProfileHireSheet(hireData: $draft.hireData)

        case .clientData:
            ProfileClientSheet(clientData: $draft.clientData)
        }
    }

    private func audioMetaAt(index: Int) -> (bpm: Int?, key: String?) {
        let sorted = draft.mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        guard index < sorted.count else { return (nil, nil) }
        return (sorted[index].bpm, sorted[index].key)
    }

    private func setAudioBPM(index: Int, _ value: Int?) {
        let sorted = draft.mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        guard index < sorted.count else { return }
        let target = sorted[index]
        guard let storageIndex = draft.mediaSlots.firstIndex(where: {
            $0.url == target.url && $0.sortOrder == target.sortOrder
        }) else { return }
        draft.mediaSlots[storageIndex].bpm = value
    }

    private func setAudioKey(index: Int, _ value: String?) {
        let sorted = draft.mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        guard index < sorted.count else { return }
        let target = sorted[index]
        guard let storageIndex = draft.mediaSlots.firstIndex(where: {
            $0.url == target.url && $0.sortOrder == target.sortOrder
        }) else { return }
        draft.mediaSlots[storageIndex].key = value
    }

    private func mediaTitleAt(index: Int) -> String {
        let sorted = draft.mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        guard index < sorted.count else { return "" }
        return sorted[index].title ?? ""
    }

    /// Update the title for the slot at `index` in the *sorted* media list.
    /// We have to map back to draft.mediaSlots' actual position because
    /// the Editorial view sees the sorted view, not the storage order.
    private func setMediaTitle(index: Int, _ value: String) {
        let sorted = draft.mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
        guard index < sorted.count else { return }
        let target = sorted[index]
        guard let storageIndex = draft.mediaSlots.firstIndex(where: {
            $0.url == target.url && $0.sortOrder == target.sortOrder
        }) else { return }
        draft.mediaSlots[storageIndex].title = value.isEmpty ? nil : value
    }

    private func makeEditActions() -> ProfileEditActions {
        ProfileEditActions(
            onTapMedia:            { activeEditor = .media },
            onTapHeadlineLocation: { activeEditor = .headlineHeadlineLocation },
            onTapBio:              { activeEditor = .bio },
            onTapLookingFor:       { activeEditor = .lookingFor },
            onTapPrompts:          { activeEditor = .prompts },
            onTapSocials:          { activeEditor = .socials },
            onEditMediaTitle:      { idx in activeEditor = .mediaTitle(idx) },
            onEditAudioMeta:       { idx in activeEditor = .audioMeta(idx) },
            onTapHireData:         { activeEditor = .hireData },
            onTapClientData:       { activeEditor = .clientData }
        )
    }

    // MARK: - Network actions

    private func loadProfile() async {
        do {
            let profile: ConnectProfile = try await appState.trpc.query("connectProfile.getCurrent")
            appState.currentConnectProfile = profile
        } catch {
            appState.currentConnectProfile = nil
        }
        isLoading = false
    }

    private func toggleActive() async {
        isTogglingActive = true
        do {
            struct ToggleResult: Codable { let isActive: Bool }
            let result: ToggleResult = try await appState.trpc.mutate("connectProfile.toggleActive")
            appState.currentConnectProfile?.isActive = result.isActive
        } catch {
            appState.showError("Couldn't update profile: \(error.localizedDescription)")
        }
        isTogglingActive = false
    }

    private func save() async {
        guard connectProfile != nil else { return }
        isSaving = true
        defer { isSaving = false }

        do {
            let payload = ProfilePayload(
                headline:        draft.headline.isEmpty ? nil : draft.headline,
                lookingFor:      draft.lookingFor.isEmpty ? nil : draft.lookingFor,
                bio:             draft.bio.isEmpty ? nil : draft.bio,
                mediaSlots:      draft.mediaSlots,
                prompts:         draft.prompts,
                instagramHandle: draft.instagramHandle.isEmpty ? nil : draft.instagramHandle,
                twitterHandle:   draft.twitterHandle.isEmpty ? nil : draft.twitterHandle,
                websiteUrl:      draft.websiteUrl.isEmpty ? nil : draft.websiteUrl,
                location:        draft.location.isEmpty ? nil : draft.location,
                profileTemplate: draft.profileTemplate,
                hireData:        draft.hireData,
                clientData:      draft.clientData
            )
            struct GenericResponse: Codable { let id: String }
            let _: GenericResponse = try await appState.trpc.mutate(
                "connectProfile.update",
                input: payload
            )
            await appState.refreshConnectProfile()
            originalSnapshot = draft
            isEditMode = false
        } catch {
            saveError = error.localizedDescription
        }
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

// MARK: - ProfileDraft
//
// Local working copy of all editable fields. Equatable so we can detect
// unsaved changes by simple comparison against the entry-time snapshot.

struct ProfileDraft: Equatable {
    var profileTemplate: String = ConnectProfileTemplate.default.rawValue
    var headline: String = ""
    var bio: String = ""
    var lookingFor: String = ""
    var location: String = ""
    var instagramHandle: String = ""
    var twitterHandle: String = ""
    var websiteUrl: String = ""
    var mediaSlots: [MediaSlot] = []
    var prompts: [PromptEntry] = []
    /// Hire-template payload. nil when not yet configured.
    var hireData: HireData? = nil
    /// Client-template payload. nil when not yet configured.
    var clientData: ClientData? = nil

    static func from(_ profile: ConnectProfile) -> ProfileDraft {
        ProfileDraft(
            profileTemplate: profile.profileTemplate ?? ConnectProfileTemplate.default.rawValue,
            headline:        profile.headline ?? "",
            bio:             profile.bio ?? "",
            lookingFor:      profile.lookingFor ?? "",
            location:        profile.location ?? "",
            instagramHandle: profile.instagramHandle ?? "",
            twitterHandle:   profile.twitterHandle ?? "",
            websiteUrl:      profile.websiteUrl ?? "",
            mediaSlots:      profile.mediaSlots,
            prompts:         profile.prompts,
            hireData:        profile.hireData,
            clientData:      profile.clientData
        )
    }
}
