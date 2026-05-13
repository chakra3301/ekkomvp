import SwiftUI
import AuthenticationServices
import CryptoKit

/// Splash login: a single email input + Continue button + Sign in with Apple.
/// Continue calls `supabase.auth.signInWithOTP(email:, shouldCreateUser: false)`
/// which doubles as our existence check:
///   - success → existing Supabase Auth user, push OTPEntryView
///   - "Signups not allowed for OTP" → no such auth user, push RegisterView
///   - other error → surface to the user
///
/// We deliberately use Supabase Auth as the source of truth here rather than
/// `prisma.user` — those two tables can drift when an auth user is deleted
/// without cleaning up downstream rows. Supabase is the gatekeeper anyway,
/// so its answer is the one that matters for routing.
struct LoginView: View {
    @Environment(AppState.self) private var appState
    @State private var email = ""
    @State private var isContinuing = false
    @State private var errorMessage: String?
    @State private var currentNonce: String?

    // Routing destinations driven by the smart-continue flow.
    @State private var pendingOTPEmail: String?
    @State private var pendingRegisterEmail: String?

    private var trimmedEmail: String {
        email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    private var isEmailValid: Bool {
        // Cheap RFC-ish gate; the server enforces the real shape via z.string().email().
        let pattern = #"^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$"#
        return trimmedEmail.range(of: pattern, options: [.regularExpression, .caseInsensitive]) != nil
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

                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(EKKOTheme.destructive.opacity(0.35))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // Email + Continue (the only email-driven controls on the splash).
                VStack(spacing: 12) {
                    TextField(
                        "",
                        text: $email,
                        prompt: Text("you@example.com").foregroundColor(.white.opacity(0.55))
                    )
                    .foregroundStyle(.white)
                    .tint(.white)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.continue)
                    .onSubmit { Task { await handleContinue() } }
                    .padding(.horizontal, 16)
                    .frame(height: 48)
                    .glassBubble(cornerRadius: 14)

                    Button {
                        Task { await handleContinue() }
                    } label: {
                        Group {
                            if isContinuing {
                                ProgressView().tint(.white)
                            } else {
                                Text("Continue")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(.white)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .contentShape(Rectangle())
                    }
                    .buttonStyle(.plain)
                    .glassBubble(cornerRadius: 14)
                    .disabled(!isEmailValid || isContinuing)
                    .opacity(!isEmailValid ? 0.6 : 1)
                }

                // "or" divider between email and Apple OAuth.
                HStack {
                    Rectangle().frame(height: 0.5).foregroundStyle(.white.opacity(0.35))
                    Text("or")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.white.opacity(0.85))
                        .padding(.horizontal, 8)
                    Rectangle().frame(height: 0.5).foregroundStyle(.white.opacity(0.35))
                }

                // Apple OAuth path — bypasses the email-existence check
                // entirely. Apple creates the user server-side if missing.
                SignInWithAppleButton(.signIn) { request in
                    let nonce = randomNonceString()
                    currentNonce = nonce
                    request.requestedScopes = [.fullName, .email]
                    request.nonce = sha256(nonce)
                } onCompletion: { result in
                    Task { await handleAppleSignIn(result) }
                }
                .signInWithAppleButtonStyle(.whiteOutline)
                .frame(height: 52)
                .clipShape(RoundedRectangle(cornerRadius: 14))

                legalNotice
                    .padding(.top, 8)

                Spacer(minLength: 16)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .navigationBarHidden(true)
        // OTP path: existing email → send code, navigate to entry screen.
        .navigationDestination(item: $pendingOTPEmail) { email in
            OTPEntryView(email: email)
        }
        // Signup path: new email → password + terms.
        .navigationDestination(item: $pendingRegisterEmail) { email in
            RegisterView(prefilledEmail: email)
        }
    }

    // MARK: - Legal Notice

    private var legalNotice: some View {
        VStack(spacing: 4) {
            Text("By continuing you agree to our")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.8))
            HStack(spacing: 4) {
                Button {
                    if let url = LegalURLs.terms { UIApplication.shared.open(url) }
                } label: {
                    Text("Terms of Service")
                        .font(.caption2.weight(.semibold))
                        .underline()
                        .foregroundStyle(.white)
                }
                Text("and")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.8))
                Button {
                    if let url = LegalURLs.privacy { UIApplication.shared.open(url) }
                } label: {
                    Text("Privacy Policy")
                        .font(.caption2.weight(.semibold))
                        .underline()
                        .foregroundStyle(.white)
                }
            }
        }
        .multilineTextAlignment(.center)
        .padding(.horizontal, 16)
    }

    // MARK: - Smart continue

    private func handleContinue() async {
        guard isEmailValid, !isContinuing else { return }
        isContinuing = true
        errorMessage = nil
        defer { isContinuing = false }

        do {
            // Try to send a code with shouldCreateUser=false. Supabase only
            // sends the email if the auth user actually exists; if not, it
            // surfaces a "Signups not allowed for OTP" error which we treat
            // as the signal to route to the signup form.
            try await appState.supabase.auth.signInWithOTP(
                email: trimmedEmail,
                shouldCreateUser: false
            )
            pendingOTPEmail = trimmedEmail
        } catch {
            let msg = error.localizedDescription.lowercased()
            // Supabase returns this exact phrasing when the email isn't
            // registered and shouldCreateUser is false. Use it as the
            // "new user" signal.
            if msg.contains("signups not allowed") || msg.contains("user not found") {
                pendingRegisterEmail = trimmedEmail
            } else {
                errorMessage = error.localizedDescription
            }
        }
    }

    // MARK: - Apple

    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let authorization):
            guard let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityTokenData = appleIDCredential.identityToken,
                  let identityToken = String(data: identityTokenData, encoding: .utf8),
                  let nonce = currentNonce else {
                errorMessage = "Failed to get Apple ID token"
                return
            }
            do {
                let session = try await appState.supabase.auth.signInWithIdToken(
                    credentials: .init(
                        provider: .apple,
                        idToken: identityToken,
                        nonce: nonce
                    )
                )
                await appState.updateSession(session)
            } catch {
                errorMessage = error.localizedDescription
            }
        case .failure(let error):
            if (error as NSError).code != ASAuthorizationError.canceled.rawValue {
                errorMessage = error.localizedDescription
            }
        }
    }

    // MARK: - Nonce helpers

    private func randomNonceString(length: Int = 32) -> String {
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            let randoms: [UInt8] = (0..<16).map { _ in UInt8.random(in: 0...255) }
            for random in randoms {
                if remaining == 0 { break }
                if random < charset.count {
                    result.append(charset[Int(random) % charset.count])
                    remaining -= 1
                }
            }
        }
        return result
    }

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hashed = SHA256.hash(data: data)
        return hashed.compactMap { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - ASWebAuthenticationSession Presentation Context

final class AuthSessionPresentationProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first(where: { $0.isKeyWindow }) ?? ASPresentationAnchor()
    }
}
