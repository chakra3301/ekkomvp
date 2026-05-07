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
                        TextField(
                            "",
                            text: $email,
                            prompt: Text("you@example.com").foregroundColor(.black.opacity(0.45))
                        )
                        .foregroundStyle(.black)
                        .tint(Color.accentColor)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .padding(.horizontal, 16)
                        .frame(height: 48)
                        .glassBubble(cornerRadius: 14)
                    }

                    // Password
                    FormField(label: "Password", error: errors["password"]) {
                        SecureField(
                            "",
                            text: $password,
                            prompt: Text("At least 8 characters").foregroundColor(.black.opacity(0.45))
                        )
                        .foregroundStyle(.black)
                        .tint(Color.accentColor)
                        .textContentType(.newPassword)
                        .padding(.horizontal, 16)
                        .frame(height: 48)
                        .glassBubble(cornerRadius: 14)
                    }

                    // Terms + Privacy agreement
                    HStack(alignment: .top, spacing: 12) {
                        Toggle("", isOn: $agreedToTerms)
                            .toggleStyle(.switch)
                            .tint(Color.accentColor)
                            .labelsHidden()

                        VStack(alignment: .leading, spacing: 4) {
                            Text("I agree to the app's policies and understand there is zero tolerance for objectionable content or abusive behavior.")
                                .font(.caption)
                                .foregroundStyle(.black.opacity(0.7))
                            HStack(spacing: 10) {
                                Button("Terms of Service") {
                                    if let url = LegalURLs.terms { UIApplication.shared.open(url) }
                                }
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.black)
                                .underline()

                                Button("Privacy Policy") {
                                    if let url = LegalURLs.privacy { UIApplication.shared.open(url) }
                                }
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.black)
                                .underline()
                            }
                        }
                        Spacer()
                    }

                    // Submit — glass styled to match LoginView
                    Button {
                        Task { await handleRegister() }
                    } label: {
                        Group {
                            if isLoading {
                                ProgressView().tint(.black)
                            } else {
                                Text("Continue")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(.black)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                    }
                    .buttonStyle(.plain)
                    .glassBubble(cornerRadius: 14)
                    .disabled(!agreedToTerms || isLoading)
                    .opacity(!agreedToTerms ? 0.6 : 1)
                }
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .scrollContentBackground(.hidden)
        .background {
            LoadingScreenVideo()
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
