import SwiftUI

struct CompleteProfileView: View {
    @Environment(AppState.self) private var appState
    @State private var currentStep = 0
    @State private var displayName = ""
    @State private var dateOfBirth = Date()
    @State private var dobSet = false
    @State private var role: UserRole? = nil
    @State private var isLoading = false
    @State private var errors: [String: String] = [:]

    private let steps = ["About You", "Your Role"]
    private let maxDate = Date()
    private let minDate = Calendar.current.date(byAdding: .year, value: -100, to: Date())!

    var body: some View {
        VStack(spacing: 0) {
            // Header
            VStack(spacing: 4) {
                Text("EKKO")
                    .font(.title2.bold())
                    .foregroundStyle(Color.accentColor)
                + Text(" Connect")
                    .font(.title2.bold())
                Text("Set up your profile to get started")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 20)
            .padding(.bottom, 16)

            // Step Indicator
            StepIndicator(steps: steps, currentStep: currentStep)
                .padding(.bottom, 24)

            // Content
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if currentStep == 0 {
                        step1AboutYou
                    } else {
                        step2YourRole
                    }
                }
                .padding(.horizontal, 24)
            }

            // Error display
            if let submitError = errors["submit"] {
                Text(submitError)
                    .font(.caption)
                    .foregroundStyle(EKKOTheme.destructive)
                    .padding(.horizontal, 24)
                    .padding(.top, 8)
            }

            // Escape hatch — lets users back out to the sign-in screen
            // in case they got here with a stale session (e.g. account deleted
            // on another device) or just want to use a different account.
            Button("Sign out") {
                Task { await appState.signOut() }
            }
            .font(.caption)
            .foregroundStyle(.secondary)
            .padding(.top, 8)

            Spacer()

            // Navigation buttons
            HStack(spacing: 12) {
                if currentStep > 0 {
                    Button("Back") {
                        withAnimation { currentStep = 0 }
                    }
                    .buttonStyle(.glass)
                    .frame(maxWidth: .infinity)
                }

                if currentStep == 0 {
                    Button("Next") {
                        if validateStep1() {
                            withAnimation { currentStep = 1 }
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .frame(maxWidth: .infinity)
                } else {
                    Button {
                        Task { await handleSubmit() }
                    } label: {
                        if isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Continue")
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle(isDisabled: role == nil))
                    .disabled(role == nil || isLoading)
                    .frame(maxWidth: .infinity)
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)
        }
    }

    // MARK: - Step 1

    private var step1AboutYou: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("About You")
                .font(.title3.bold())
            Text("Tell us your name and date of birth.")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            FormField(label: "Display Name", error: errors["displayName"]) {
                TextField("Your name", text: $displayName)
                    .textContentType(.name)
                    .padding(12)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
            }

            FormField(label: "Date of Birth", error: errors["dateOfBirth"]) {
                VStack(alignment: .leading, spacing: 6) {
                    DatePicker(
                        "Date of Birth",
                        selection: $dateOfBirth,
                        in: minDate...maxDate,
                        displayedComponents: .date
                    )
                    .datePickerStyle(.compact)
                    .labelsHidden()
                    .onChange(of: dateOfBirth) { _, _ in dobSet = true }

                    Text("This will not be shown publicly.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }

    // MARK: - Step 2

    private var step2YourRole: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Your Role")
                .font(.title3.bold())
            Text("How will you use EKKO Connect?")
                .font(.subheadline)
                .foregroundStyle(.secondary)

            RoleCard(
                title: "Creative",
                description: "I create work and want to connect with others",
                icon: "paintpalette.fill",
                isSelected: role == .CREATIVE
            ) {
                withAnimation(.spring(response: 0.3)) { role = .CREATIVE }
            }

            RoleCard(
                title: "Client",
                description: "I'm looking to find and hire creatives",
                icon: "briefcase.fill",
                isSelected: role == .CLIENT
            ) {
                withAnimation(.spring(response: 0.3)) { role = .CLIENT }
            }
        }
    }

    // MARK: - Validation

    private func validateStep1() -> Bool {
        var errs: [String: String] = [:]
        if displayName.trimmingCharacters(in: .whitespaces).count < 2 {
            errs["displayName"] = "Name must be at least 2 characters"
        }
        if !dobSet {
            errs["dateOfBirth"] = "Date of birth is required"
        } else {
            let age = Calendar.current.dateComponents([.year], from: dateOfBirth, to: Date()).year ?? 0
            if age < 13 {
                errs["dateOfBirth"] = "You must be at least 13 years old"
            }
        }
        errors = errs
        return errs.isEmpty
    }

    // MARK: - Submit

    private func handleSubmit() async {
        guard let role else { return }
        isLoading = true
        errors = [:]

        // Validate the stored session is still valid. If the user was deleted
        // on the server, Supabase will 401 — sign out so they can log in again.
        do {
            _ = try await appState.supabase.auth.session
            try await appState.supabase.auth.refreshSession()
        } catch {
            await appState.signOut()
            isLoading = false
            return
        }

        let trimmedName = displayName.trimmingCharacters(in: .whitespaces)
        let username = generateUsername(from: trimmedName)

        // Format date as YYYY-MM-DD (what the backend expects, not full ISO8601)
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        let dobString = formatter.string(from: dateOfBirth)

        do {
            // 1. Update user record with DOB + role
            // Use a generic response since the backend returns the full Prisma User
            // which may have fields we don't model exactly
            struct CompleteInput: Codable {
                let fullName: String
                let dateOfBirth: String
                let role: String
            }
            struct GenericResponse: Codable {
                let id: String
            }
            let _: GenericResponse = try await appState.trpc.mutate("auth.completeUserInfo", input: CompleteInput(
                fullName: trimmedName,
                dateOfBirth: dobString,
                role: role.rawValue
            ))

            // 2. Create profile with username + display name
            struct ProfileInput: Codable {
                let displayName: String
                let username: String
            }
            let _: GenericResponse = try await appState.trpc.mutate("profile.update", input: ProfileInput(
                displayName: trimmedName,
                username: username
            ))

            // 3. Reload the profile to get the full object
            await appState.fetchCurrentUser()
        } catch {
            print("[CompleteProfile] Submit error: \(error)")
            // If the server rejects the token (e.g. account was deleted), bail to sign-in
            let msg = error.localizedDescription.lowercased()
            if msg.contains("401") || msg.contains("unauthorized") || msg.contains("not authenticated") {
                await appState.signOut()
                isLoading = false
                return
            }
            errors["submit"] = error.localizedDescription
        }
        isLoading = false
    }

    private func generateUsername(from name: String) -> String {
        let cleaned = name
            .lowercased()
            .replacingOccurrences(of: "[^a-z0-9_]", with: "", options: .regularExpression)
            .prefix(20)
        if cleaned.count >= 3 {
            return String(cleaned)
        }
        return "user_\(String(Date().timeIntervalSince1970, radix: 36))"
    }
}

// MARK: - Step Indicator

struct StepIndicator: View {
    let steps: [String]
    let currentStep: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(steps.indices, id: \.self) { i in
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .fill(i == currentStep ? Color.accentColor : i < currentStep ? Color.accentColor.opacity(0.2) : Color.gray.opacity(0.15))
                            .frame(width: 32, height: 32)

                        if i < currentStep {
                            Image(systemName: "checkmark")
                                .font(.caption.bold())
                                .foregroundStyle(Color.accentColor)
                        } else {
                            Text("\(i + 1)")
                                .font(.caption.bold())
                                .foregroundStyle(i == currentStep ? .white : .secondary)
                        }
                    }

                    if i < steps.count - 1 {
                        Rectangle()
                            .fill(i < currentStep ? Color.accentColor : Color.gray.opacity(0.15))
                            .frame(width: 32, height: 2)
                    }
                }
            }
        }
    }
}

// MARK: - Role Card

struct RoleCard: View {
    let title: String
    let description: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.accentColor : Color.gray.opacity(0.15))
                        .frame(width: 44, height: 44)
                    Image(systemName: icon)
                        .font(.title3)
                        .foregroundStyle(isSelected ? .white : .secondary)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(.primary)
                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(isSelected ? Color.accentColor : Color.gray.opacity(0.25), lineWidth: isSelected ? 2 : 1)
            )
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(isSelected ? Color.accentColor.opacity(0.05) : .clear)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - String radix helper

private extension String {
    init(_ value: Double, radix: Int) {
        self = String(Int(value), radix: radix)
    }
}
