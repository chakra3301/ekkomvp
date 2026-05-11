import SwiftUI

struct RegisterView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    /// Email comes in from the splash's smart-continue routing — by the time
    /// the user lands here we already know the address isn't registered.
    let prefilledEmail: String

    @State private var password = ""
    @State private var agreedToTerms = false
    @State private var isLoading = false
    @State private var errors: [String: String] = [:]
    @State private var showVerificationAlert = false
    @State private var verificationEmail = ""

    private var email: String {
        prefilledEmail.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // EKKO chrome wordmark — same logo used on the
                // ekkoconnect.app landing page.
                Image("EkkoFont")
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity)
                    .frame(height: 180)
                    .padding(.top, 40)
                    .padding(.bottom, 8)
                    .shadow(color: .black.opacity(0.35), radius: 18, y: 8)

                VStack(spacing: 16) {
                    // Static email confirmation — we already know this address
                    // is new (the splash gated via auth.checkEmailExists). No
                    // re-input, no editing here; users can hit Back to change.
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Creating account for")
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.white.opacity(0.75))
                        Text(email)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 16)
                            .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
                            .glassBubble(cornerRadius: 14)
                    }

                    // Password
                    FormField(label: "Password", error: errors["password"]) {
                        SecureField(
                            "",
                            text: $password,
                            prompt: Text("At least 8 characters").foregroundColor(.white.opacity(0.55))
                        )
                        .foregroundStyle(.white)
                        .tint(.white)
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
                                .foregroundStyle(.white.opacity(0.85))
                            HStack(spacing: 10) {
                                Button("Terms of Service") {
                                    if let url = LegalURLs.terms { UIApplication.shared.open(url) }
                                }
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.white)
                                .underline()

                                Button("Privacy Policy") {
                                    if let url = LegalURLs.privacy { UIApplication.shared.open(url) }
                                }
                                .font(.caption.weight(.medium))
                                .foregroundStyle(.white)
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
                                ProgressView().tint(.white)
                            } else {
                                Text("Continue")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(.white)
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
                // White is the inherited tint here so FormField's labels
                // (which don't set their own foregroundStyle) pick it up.
                .foregroundStyle(.white)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 40)
        }
        .scrollContentBackground(.hidden)
        .background {
            AuthDottedBackground()
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
                email: email,
                password: password
            )

            if let session = response.session {
                // Email auto-confirm enabled — drop straight into the Complete Profile flow
                await appState.updateSession(session)
                dismiss()
            } else {
                // Email confirmation required — tell the user to verify
                verificationEmail = email
                showVerificationAlert = true
            }
        } catch {
            errors["password"] = error.localizedDescription
        }
        isLoading = false
    }

    private func validate() -> Bool {
        var errs: [String: String] = [:]
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
