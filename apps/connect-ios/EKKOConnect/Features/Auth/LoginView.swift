import SwiftUI
import AuthenticationServices
import CryptoKit

struct LoginView: View {
    @Environment(AppState.self) private var appState
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var infoMessage: String?
    @State private var showRegister = false
    @State private var currentNonce: String?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Push sign-in controls down, but leave room for Sign up at the bottom
                Spacer(minLength: 0)
                    .frame(height: 260)

                if let error = errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(EKKOTheme.destructive)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(EKKOTheme.destructive.opacity(0.1))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                if let info = infoMessage {
                    Text(info)
                        .font(.caption)
                        .foregroundStyle(.black)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .frame(maxWidth: .infinity)
                        .background(Color.green.opacity(0.2))
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // OAuth Buttons — glass styled
                VStack(spacing: 12) {
                    // Apple — sign in with apple (system provides correct logo + styling)
                    SignInWithAppleButton(.signIn) { request in
                        let nonce = randomNonceString()
                        currentNonce = nonce
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = sha256(nonce)
                    } onCompletion: { result in
                        Task { await handleAppleSignIn(result) }
                    }
                    .signInWithAppleButtonStyle(.white)
                    .frame(height: 52)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(
                        RoundedRectangle(cornerRadius: 14)
                            .stroke(Color.white.opacity(0.2), lineWidth: 0.5)
                    )

                    // Google — glass styled with branded "G" logo
                    Button {
                        Task { await handleGoogleSignIn() }
                    } label: {
                        HStack(spacing: 10) {
                            GoogleLogo()
                                .frame(width: 18, height: 18)
                            Text("Continue with Google")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.black)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                    }
                    .buttonStyle(.plain)
                    .glassBubble(cornerRadius: 14)
                }

                // Divider
                HStack {
                    Rectangle().frame(height: 0.5).foregroundStyle(.black.opacity(0.25))
                    Text("Or continue with email")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.black.opacity(0.7))
                    Rectangle().frame(height: 0.5).foregroundStyle(.black.opacity(0.25))
                }

                // Legal notice
                legalNotice

                // Email/Password form
                VStack(spacing: 12) {
                    TextField("", text: $email, prompt: Text("you@example.com").foregroundColor(.black.opacity(0.45)))
                        .foregroundStyle(.black)
                        .tint(Color.accentColor)
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .textInputAutocapitalization(.never)
                        .padding(.horizontal, 16)
                        .frame(height: 48)
                        .glassBubble(cornerRadius: 14)

                    SecureField("", text: $password, prompt: Text("Password").foregroundColor(.black.opacity(0.45)))
                        .foregroundStyle(.black)
                        .tint(Color.accentColor)
                        .textContentType(.password)
                        .padding(.horizontal, 16)
                        .frame(height: 48)
                        .glassBubble(cornerRadius: 14)

                    // Forgot password link
                    HStack {
                        Spacer()
                        Button("Forgot password?") {
                            Task { await handlePasswordReset() }
                        }
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.black.opacity(0.75))
                        .underline()
                    }
                }

                // Sign In button — glass styled
                Button {
                    Task { await handleEmailSignIn() }
                } label: {
                    Group {
                        if isLoading {
                            ProgressView().tint(.black)
                        } else {
                            Text("Sign in")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundStyle(.black)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 52)
                }
                .buttonStyle(.plain)
                .glassBubble(cornerRadius: 14)
                .disabled(email.isEmpty || password.isEmpty || isLoading)
                .opacity(email.isEmpty || password.isEmpty ? 0.6 : 1)

                // Register link
                HStack(spacing: 4) {
                    Text("Don't have an account?")
                        .foregroundStyle(.black.opacity(0.7))
                    Button("Sign up") {
                        showRegister = true
                    }
                    .foregroundStyle(.black)
                    .fontWeight(.bold)
                }
                .font(.subheadline)
                .padding(.top, 4)
                .padding(.bottom, 24)
            }
            .padding(.horizontal, 24)
        }
        .navigationBarHidden(true)
        .navigationDestination(isPresented: $showRegister) {
            RegisterView()
        }
    }

    // MARK: - Legal Notice

    private var legalNotice: some View {
        VStack(spacing: 4) {
            Text("By signing up for EKKO Connect you agree to our")
                .font(.caption2)
                .foregroundStyle(.black.opacity(0.65))
            HStack(spacing: 4) {
                Button {
                    if let url = LegalURLs.terms { UIApplication.shared.open(url) }
                } label: {
                    Text("Terms of Service")
                        .font(.caption2.weight(.semibold))
                        .underline()
                        .foregroundStyle(.black)
                }
                Text("and")
                    .font(.caption2)
                    .foregroundStyle(.black.opacity(0.65))
                Button {
                    if let url = LegalURLs.privacy { UIApplication.shared.open(url) }
                } label: {
                    Text("Privacy Policy")
                        .font(.caption2.weight(.semibold))
                        .underline()
                        .foregroundStyle(.black)
                }
            }
        }
        .multilineTextAlignment(.center)
        .padding(.horizontal, 16)
    }

    // MARK: - Google Logo

    struct GoogleLogo: View {
        var body: some View {
            // Multi-color Google "G" constructed from SF Symbols-free shapes
            Canvas { context, size in
                let rect = CGRect(origin: .zero, size: size)
                let radius = size.width / 2
                let center = CGPoint(x: radius, y: radius)
                let innerR = radius * 0.55
                let strokeW = radius - innerR

                // Google "G" — simplified as 4 colored arcs
                func arc(color: Color, start: Double, end: Double) {
                    var path = Path()
                    path.addArc(
                        center: center,
                        radius: (radius + innerR) / 2,
                        startAngle: .degrees(start),
                        endAngle: .degrees(end),
                        clockwise: false
                    )
                    context.stroke(path, with: .color(color), lineWidth: strokeW)
                }
                arc(color: Color(red: 0.26, green: 0.52, blue: 0.96), start: 340, end: 45)  // blue top
                arc(color: Color(red: 0.20, green: 0.66, blue: 0.33), start: 45, end: 135)  // green right
                arc(color: Color(red: 0.99, green: 0.73, blue: 0.02), start: 135, end: 225) // yellow bottom
                arc(color: Color(red: 0.92, green: 0.26, blue: 0.21), start: 225, end: 340) // red left

                // Horizontal bar for the G
                let barHeight = strokeW * 0.7
                let barRect = CGRect(
                    x: center.x,
                    y: center.y - barHeight / 2,
                    width: radius - barHeight * 0.3,
                    height: barHeight
                )
                context.fill(Path(barRect), with: .color(Color(red: 0.26, green: 0.52, blue: 0.96)))
                _ = rect
            }
        }
    }

    // MARK: - Auth Handlers

    private func handlePasswordReset() async {
        errorMessage = nil
        infoMessage = nil
        let trimmed = email.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else {
            errorMessage = "Enter your email first, then tap Forgot password?"
            return
        }
        do {
            try await appState.supabase.auth.resetPasswordForEmail(trimmed)
            infoMessage = "Check \(trimmed) for a password reset link."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func handleEmailSignIn() async {
        isLoading = true
        errorMessage = nil
        do {
            let session = try await appState.supabase.auth.signIn(
                email: email.trimmingCharacters(in: .whitespaces),
                password: password
            )
            await appState.updateSession(session)
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    // MARK: - Google

    private func handleGoogleSignIn() async {
        isLoading = true
        errorMessage = nil
        do {
            let session = try await appState.supabase.auth.signInWithOAuth(
                provider: .google,
                redirectTo: URL(string: "ekkoconnect://auth-callback"),
                launchFlow: { authURL in
                    return try await withCheckedThrowingContinuation { continuation in
                        let authSession = ASWebAuthenticationSession(
                            url: authURL,
                            callbackURLScheme: "ekkoconnect"
                        ) { callbackURL, error in
                            if let error {
                                continuation.resume(throwing: error)
                            } else if let callbackURL {
                                continuation.resume(returning: callbackURL)
                            } else {
                                continuation.resume(throwing: URLError(.badURL))
                            }
                        }
                        let provider = AuthSessionPresentationProvider()
                        authSession.presentationContextProvider = provider
                        authSession.prefersEphemeralWebBrowserSession = false
                        // Keep provider alive
                        objc_setAssociatedObject(authSession, "ctx", provider, .OBJC_ASSOCIATION_RETAIN)
                        if !authSession.start() {
                            continuation.resume(throwing: URLError(.cannotOpenFile))
                        }
                    }
                }
            )
            await appState.updateSession(session)
        } catch {
            if !error.localizedDescription.lowercased().contains("cancel") {
                errorMessage = error.localizedDescription
            }
        }
        isLoading = false
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
