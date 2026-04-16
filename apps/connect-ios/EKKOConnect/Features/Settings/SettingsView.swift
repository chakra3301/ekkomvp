import SwiftUI

struct SettingsView: View {
    @Environment(AppState.self) private var appState
    @Environment(PurchaseManager.self) private var purchaseManager
    @Environment(\.dismiss) private var dismiss

    @State private var connectProfile: ConnectProfile?
    @State private var blockedUsers: [UserWithProfile] = []
    @State private var isTogglingActive = false
    @State private var locating = false
    @State private var showDeleteConfirm = false
    @State private var deleteConfirmText = ""
    @State private var isDeleting = false
    @State private var showUpgradeSheet = false

    // Account settings
    @State private var editingDisplayName = false
    @State private var newDisplayName = ""
    @State private var isSavingName = false

    // Discovery filters (persisted to UserDefaults)
    // Discovery filter bindings that write directly into AppState
    private var filterCity: Binding<String> {
        Binding(
            get: { appState.discoveryFilters.city },
            set: { appState.discoveryFilters.city = $0 }
        )
    }
    private var filterDistance: Binding<Double> {
        Binding(
            get: { Double(appState.discoveryFilters.maxDistanceMiles) },
            set: { appState.discoveryFilters.maxDistanceMiles = Int($0) }
        )
    }
    private var filterGlobalSearch: Binding<Bool> {
        Binding(
            get: { appState.discoveryFilters.globalSearch },
            set: { appState.discoveryFilters.globalSearch = $0 }
        )
    }
    private var filterRole: Binding<String> {
        Binding(
            get: { appState.discoveryFilters.role },
            set: { appState.discoveryFilters.role = $0 }
        )
    }

    var body: some View {
        List {
            // ============ PROFILE ============
            Section {
                // Profile preview
                NavigationLink(destination: ProfileView()) {
                    HStack(spacing: 12) {
                        AvatarView(
                            url: appState.currentProfile?.avatarUrl,
                            name: appState.currentProfile?.displayName ?? "User",
                            size: 48
                        )
                        VStack(alignment: .leading, spacing: 2) {
                            Text(appState.currentProfile?.displayName ?? "User")
                                .font(.subheadline.weight(.semibold))
                            Text(connectProfile?.headline ?? "View your profile")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                    }
                }

                // Edit profile
                NavigationLink(destination: ProfileSetupView()) {
                    Label("Edit Profile", systemImage: "pencil")
                        .font(.subheadline)
                }

                // Visibility toggle
                if let profile = connectProfile {
                    HStack {
                        Label {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Profile Visibility")
                                    .font(.subheadline)
                                Text(profile.isActive ? "Visible" : "Hidden")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        } icon: {
                            Image(systemName: profile.isActive ? "eye.fill" : "eye.slash.fill")
                                .foregroundStyle(profile.isActive ? .green : .secondary)
                        }
                        Spacer()
                        Toggle("", isOn: Binding(
                            get: { profile.isActive },
                            set: { _ in Task { await toggleActive() } }
                        ))
                        .labelsHidden()
                    }
                }
            } header: {
                Text("Profile")
            }

            // ============ SUBSCRIPTION ============
            Section {
                subscriptionRow
            } header: {
                Text("Subscription")
            }

            // ============ ACCOUNT SETTINGS ============
            Section {
                if editingDisplayName {
                    HStack {
                        TextField("Display name", text: $newDisplayName)
                            .font(.subheadline)
                        Button(isSavingName ? "..." : "Save") {
                            Task { await saveDisplayName() }
                        }
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(EKKOTheme.primary)
                        .disabled(isSavingName)
                        Button("Cancel") {
                            editingDisplayName = false
                        }
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    }
                } else {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Display Name")
                                .font(.subheadline)
                            Text(appState.currentProfile?.displayName ?? "Not set")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button("Edit") {
                            newDisplayName = appState.currentProfile?.displayName ?? ""
                            editingDisplayName = true
                        }
                        .font(.caption)
                        .foregroundStyle(EKKOTheme.primary)
                    }
                }
            } header: {
                Text("Account Settings")
            }

            // ============ APPEARANCE ============
            Section {
                HStack(spacing: 12) {
                    ForEach([
                        ("light", "Light", "sun.max.fill"),
                        ("dark", "Dark", "moon.fill"),
                        ("system", "System", "laptopcomputer"),
                    ], id: \.0) { value, label, icon in
                        Button {
                            appState.themePreference = value
                        } label: {
                            VStack(spacing: 6) {
                                Image(systemName: icon)
                                    .font(.title3)
                                Text(label)
                                    .font(.caption)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(
                                appState.themePreference == value
                                ? EKKOTheme.primary.opacity(0.1)
                                : Color.clear
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(
                                        appState.themePreference == value
                                        ? EKKOTheme.primary.opacity(0.3)
                                        : Color.clear,
                                        lineWidth: 1
                                    )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(
                            appState.themePreference == value ? EKKOTheme.primary : .secondary
                        )
                    }
                }
            } header: {
                Text("Appearance")
            }

            // ============ DISCOVERY FILTERS ============
            Section {
                HStack {
                    TextField("e.g. Los Angeles", text: filterCity)
                        .font(.subheadline)
                    Button {
                        Task { await useMyLocation() }
                    } label: {
                        Image(systemName: locating ? "arrow.circlepath" : "location.fill")
                            .font(.caption)
                    }
                    .disabled(locating)
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Maximum Distance")
                            .font(.subheadline)
                        Spacer()
                        Text(filterGlobalSearch.wrappedValue ? "Global" : "\(Int(filterDistance.wrappedValue)) mi")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Slider(value: filterDistance, in: 10...200, step: 10)
                        .disabled(filterGlobalSearch.wrappedValue)
                        .tint(EKKOTheme.primary)
                }

                if purchaseManager.currentTier == .INFINITE {
                    Toggle(isOn: filterGlobalSearch) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Global Search")
                                .font(.subheadline)
                            Text("Find creatives worldwide")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .tint(EKKOTheme.primary)
                } else {
                    Button {
                        showUpgradeSheet = true
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Global Search")
                                    .font(.subheadline)
                                    .foregroundStyle(.primary)
                                Text("Find creatives worldwide — Infinite")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "lock.fill")
                                .font(.caption)
                                .foregroundStyle(EKKOTheme.primary)
                        }
                    }
                    .buttonStyle(.plain)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Show me")
                        .font(.subheadline)
                    HStack(spacing: 8) {
                        ForEach(["ALL", "CREATIVE", "CLIENT"], id: \.self) { role in
                            Button {
                                filterRole.wrappedValue = role
                            } label: {
                                Text(role == "ALL" ? "Everyone" : role == "CREATIVE" ? "Creatives" : "Clients")
                                    .font(.caption.weight(.medium))
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .background(
                                        filterRole.wrappedValue == role
                                        ? EKKOTheme.primary
                                        : Color.gray.opacity(0.1)
                                    )
                                    .foregroundStyle(filterRole.wrappedValue == role ? .white : .primary)
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            } header: {
                Text("Discovery Filters")
            }

            // ============ BLOCKED USERS ============
            Section {
                if blockedUsers.isEmpty {
                    Text("No blocked users")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(blockedUsers) { user in
                        HStack {
                            AvatarView(
                                url: user.profile?.avatarUrl,
                                name: user.profile?.displayName ?? "?",
                                size: 32
                            )
                            VStack(alignment: .leading) {
                                Text(user.profile?.displayName ?? "Deleted User")
                                    .font(.subheadline)
                                Text("@\(user.profile?.username ?? "unknown")")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Button("Unblock") {
                                Task { await unblock(user.id) }
                            }
                            .font(.caption)
                        }
                    }
                }
            } header: {
                Text("Blocked Users")
            }

            // ============ LEGAL ============
            Section {
                Button {
                    if let url = LegalURLs.terms { UIApplication.shared.open(url) }
                } label: {
                    legalRow(title: "Terms of Service", icon: "doc.text")
                }

                Button {
                    if let url = LegalURLs.privacy { UIApplication.shared.open(url) }
                } label: {
                    legalRow(title: "Privacy Policy", icon: "lock.shield")
                }

                Button {
                    UIApplication.shared.open(LegalURLs.support)
                } label: {
                    legalRow(title: "Support", icon: "questionmark.circle")
                }
            } header: {
                Text("Legal & Support")
            }

            // ============ ACCOUNT ============
            Section {
                if let email = appState.session?.user.email {
                    Text(email)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Button("Sign Out", role: .destructive) {
                    Task { await appState.signOut() }
                }

                Button(role: .destructive) {
                    showDeleteConfirm = true
                } label: {
                    Text("DELETE ACCOUNT")
                        .font(.custom(EKKOFont.regular, size: 16))
                        .tracking(1.5)
                }
                .accessibilityLabel("Delete account")
                .accessibilityHint("Permanently deletes your profile, matches, and messages")
            } header: {
                Text("Account")
            }
        }
        .scrollContentBackground(.hidden)
        .navigationTitle("Settings")
        .task { await loadData() }
        .sheet(isPresented: $showUpgradeSheet) {
            UpgradeModal(isPresented: $showUpgradeSheet)
                .environment(purchaseManager)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
        .alert("Delete Account", isPresented: $showDeleteConfirm) {
            TextField("Type DELETE to confirm", text: $deleteConfirmText)
            Button("Cancel", role: .cancel) { deleteConfirmText = "" }
            Button("Delete", role: .destructive) {
                Task { await deleteAccount() }
            }
            .disabled(deleteConfirmText != "DELETE")
        } message: {
            Text("This will permanently delete your profile, matches, messages, and all data. This cannot be undone.")
        }
    }

    // MARK: - Legal Row

    @ViewBuilder
    private func legalRow(title: String, icon: String) -> some View {
        HStack {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .frame(width: 24)
            Text(title)
                .font(.subheadline)
                .foregroundStyle(.primary)
            Spacer()
            Image(systemName: "arrow.up.right")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Subscription Row

    @ViewBuilder
    private var subscriptionRow: some View {
        let isInfinite = purchaseManager.currentTier == .INFINITE

        if isInfinite {
            HStack(spacing: 12) {
                Image(systemName: "infinity")
                    .font(.title3.bold())
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(
                        LinearGradient(
                            colors: [EKKOTheme.primary, Color.purple],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 8))

                VStack(alignment: .leading, spacing: 2) {
                    Text("EKKO Infinite")
                        .font(.subheadline.weight(.semibold))
                    Text("Unlimited likes · priority · Infinite badge")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
            }
        } else {
            Button {
                showUpgradeSheet = true
            } label: {
                HStack(spacing: 12) {
                    Image(systemName: "sparkles")
                        .font(.title3)
                        .foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(
                            LinearGradient(
                                colors: [EKKOTheme.primary, Color.purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8))

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Upgrade to Infinite")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.primary)
                        Text("Unlock unlimited likes & priority")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - Data Loading

    private func loadData() async {
        // Load connect profile
        if let profile: ConnectProfile = try? await appState.trpc.query("connectProfile.getCurrent") {
            connectProfile = profile
        }
        // Load blocked users
        if let blocked: [UserWithProfile] = try? await appState.trpc.query("block.getBlockedUsers") {
            blockedUsers = blocked
        }
    }

    // MARK: - Actions

    private func toggleActive() async {
        isTogglingActive = true
        do {
            struct ToggleResult: Codable { let isActive: Bool }
            let result: ToggleResult = try await appState.trpc.mutate("connectProfile.toggleActive")
            connectProfile?.isActive = result.isActive
            appState.showSuccess(result.isActive ? "Profile visible again" : "Profile paused")
        } catch {
            appState.showError("Couldn't update visibility.")
        }
        isTogglingActive = false
    }

    private func saveDisplayName() async {
        let trimmed = newDisplayName.trimmingCharacters(in: .whitespaces)
        guard trimmed.count >= 2 else { return }
        isSavingName = true
        do {
            let profile: Profile = try await appState.trpc.mutate(
                "profile.update",
                input: [
                    "displayName": trimmed,
                    "username": appState.currentProfile?.username ?? "",
                ]
            )
            appState.currentProfile = profile
            editingDisplayName = false
            appState.showSuccess("Display name updated")
        } catch {
            appState.showError("Couldn't update display name.")
        }
        isSavingName = false
    }

    private func unblock(_ userId: String) async {
        do {
            try await appState.trpc.mutate("block.unblock", input: userId)
            blockedUsers.removeAll { $0.id == userId }
            appState.showSuccess("Unblocked")
        } catch {
            appState.showError("Couldn't unblock. Try again.")
        }
    }

    private func useMyLocation() async {
        locating = true
        defer { locating = false }

        do {
            let manager = LocationManager()
            let result = try await manager.getCurrentLocation()

            // Update the local filter with the resolved city
            if let city = result.city, !city.isEmpty {
                filterCity.wrappedValue = city
            }

            // Persist coordinates + city to the user's ConnectProfile
            struct LocationInput: Codable {
                let location: String?
                let latitude: Double
                let longitude: Double
            }
            let _: ConnectProfile = try await appState.trpc.mutate(
                "connectProfile.update",
                input: LocationInput(
                    location: result.city,
                    latitude: result.latitude,
                    longitude: result.longitude
                )
            )
        } catch {
            print("[Location] Failed: \(error.localizedDescription)")
        }
    }

    private func deleteAccount() async {
        guard deleteConfirmText == "DELETE" else { return }
        isDeleting = true
        defer { isDeleting = false }

        // Build the delete-account URL from the tRPC base URL
        // trpcBaseURL is .../api/trpc — strip "/trpc" and append "/auth/delete-account"
        var baseString = Config.trpcBaseURL
        if baseString.hasSuffix("/trpc") {
            baseString = String(baseString.dropLast("/trpc".count))
        } else if baseString.hasSuffix("/api/trpc") {
            baseString = String(baseString.dropLast("/trpc".count))
        }
        guard let url = URL(string: "\(baseString)/auth/delete-account") else { return }

        // Get the current Supabase access token
        guard let token = try? await appState.supabase.auth.session.accessToken else {
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            print("[delete-account] ← \(status): \(String(data: data, encoding: .utf8) ?? "")")

            if status == 200 {
                await appState.signOut()
            }
        } catch {
            print("[delete-account] Request failed: \(error)")
        }
    }

}
