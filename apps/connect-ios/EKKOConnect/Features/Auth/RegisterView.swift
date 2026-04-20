import SwiftUI

struct RegisterView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var agreedToTerms = false
    @State private var isLoading = false
    @State private var errors: [String: String] = [:]
    @State private var showVerificationAlert = false
    @State private var verificationEmail = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Push content lower on the page so the background image shows at the top
                Spacer(minLength: 0)
                    .frame(height: 280)

                VStack(spacing: 16) {
                    // Email
                    FormField(label: "Email", error: errors["email"]) {
                        TextField("you@example.com", text: $email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    // Password
                    FormField(label: "Password", error: errors["password"]) {
                        SecureField("At least 8 characters", text: $password)
                            .textContentType(.newPassword)
                            .padding(12)
                            .background(.ultraThinMaterial)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }

                    // Terms + Privacy agreement
                    HStack(alignment: .top, spacing: 12) {
                        Toggle("", isOn: $agreedToTerms)
                            .toggleStyle(.switch)
                            .tint(Color.accentColor)
                            .labelsHidden()

                        VStack(alignment: .leading, spacing: 4) {
                            Text("I agree to the app's policies.")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            HStack(spacing: 10) {
                                Button("Terms of Service") {
                                    if let url = LegalURLs.terms { UIApplication.shared.open(url) }
                                }
                                .font(.caption.weight(.medium))
                                .foregroundStyle(Color.accentColor)

                                Button("Privacy Policy") {
                                    if let url = LegalURLs.privacy { UIApplication.shared.open(url) }
                                }
                                .font(.caption.weight(.medium))
                                .foregroundStyle(Color.accentColor)
                            }
                        }
                        Spacer()
                    }

                    // Submit
                    Button {
                        Task { await handleRegister() }
                    } label: {
                        if isLoading {
                            ProgressView().tint(.white)
                        } else {
                            Text("Continue")
                        }
                    }
                    .buttonStyle(PrimaryButtonStyle(isDisabled: !agreedToTerms))
                    .disabled(!agreedToTerms || isLoading)
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .scrollContentBackground(.hidden)
        .background {
            Image("SignInBackground")
                .resizable()
                .scaledToFill()
                .ignoresSafeArea()
        }
        .toolbarBackground(.hidden, for: .navigationBar)
        .navigationBarBackButtonHidden(false)
        .navigationTitle("")
        .alert("Check your email", isPresented: $showVerificationAlert) {
            Button("OK") { dismiss() }
        } message: {
            Text("We sent a verification link to \(verificationEmail). Tap it, then come back and sign in.")
        }
    }

    private func handleRegister() async {
        errors = [:]
        guard validate() else { return }

        isLoading = true
        do {
            let response = try await appState.supabase.auth.signUp(
                email: email.trimmingCharacters(in: .whitespaces),
                password: password
            )

            if let session = response.session {
                // Email auto-confirm enabled — drop straight into the Complete Profile flow
                await appState.updateSession(session)
                dismiss()
            } else {
                // Email confirmation required — tell the user to verify
                verificationEmail = email.trimmingCharacters(in: .whitespaces)
                showVerificationAlert = true
            }
        } catch {
            errors["email"] = error.localizedDescription
        }
        isLoading = false
    }

    private func validate() -> Bool {
        var errs: [String: String] = [:]
        if email.trimmingCharacters(in: .whitespaces).isEmpty {
            errs["email"] = "Email is required"
        }
        if password.count < 8 {
            errs["password"] = "Password must be at least 8 characters"
        }
        errors = errs
        return errs.isEmpty
    }
}

struct FormField<Content: View>: View {
    let label: String
    var error: String? = nil
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.subheadline.weight(.medium))
            content
            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(EKKOTheme.destructive)
            }
        }
    }
}
