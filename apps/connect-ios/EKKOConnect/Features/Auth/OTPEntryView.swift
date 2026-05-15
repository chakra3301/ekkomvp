import SwiftUI

/// 6-digit OTP entry for the passwordless-login path from the splash.
/// Pushed after the splash detects an existing email and calls
/// `supabase.auth.signInWithOTP(email:, shouldCreateUser: false)`.
///
/// On Verify we call `supabase.auth.verifyOTP(email:, token:, type: .email)`,
/// then hand the resulting session to `AppState.updateSession`, which kicks
/// the AppRouter through invite-gate / profile-completion as needed.
struct OTPEntryView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    let email: String

    @State private var code: String = ""
    @State private var isVerifying = false
    @State private var errorMessage: String?
    @State private var isResending = false
    @State private var resendCooldown: Int = 60

    @FocusState private var codeFieldFocused: Bool

    // Supabase's OTP length is configurable in Studio (defaults to 6, range
    // 6–10). Accept anything in that range so the app doesn't break if the
    // project setting drifts.
    private let minCodeLength = 6
    private let maxCodeLength = 10

    private var isCodeReady: Bool {
        code.count >= minCodeLength && code.count <= maxCodeLength
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Image("EkkoFont")
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity)
                    .frame(height: 140)
                    .padding(.top, 24)
                    .padding(.bottom, 8)
                    .shadow(color: .black.opacity(0.35), radius: 18, y: 8)

                VStack(spacing: 6) {
                    Text("Check your email")
                        .font(.title3.bold())
                        .foregroundStyle(.white)
                    Text("We sent a 6-digit code to")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.8))
                    Text(email)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                }
                .multilineTextAlignment(.center)
                .padding(.horizontal, 16)

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

                // Single TextField styled as a code box. Monospaced + tracked
                // wide so the digits read like discrete cells without
                // wrestling SwiftUI focus across multiple fields. Length is
                // dynamic (Supabase's OTP setting can vary 6–10).
                TextField(
                    "",
                    text: $code,
                    prompt: Text(String(repeating: "•", count: minCodeLength))
                        .foregroundColor(.white.opacity(0.35))
                )
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .foregroundStyle(.white)
                .tint(.white)
                .font(.system(.title2, design: .monospaced, weight: .bold))
                .tracking(8)
                .multilineTextAlignment(.center)
                .focused($codeFieldFocused)
                .onChange(of: code) { _, newValue in
                    let cleaned = newValue.filter(\.isNumber)
                    let clamped = String(cleaned.prefix(maxCodeLength))
                    if clamped != newValue { code = clamped }
                    // Auto-submit only when the user hits the max length —
                    // for shorter codes they tap Verify, since we don't know
                    // exactly how many digits the project is configured for.
                    if clamped.count == maxCodeLength {
                        Task { await verify() }
                    }
                }
                .padding(.horizontal, 16)
                .frame(height: 60)
                .glassBubble(cornerRadius: 14)
                .padding(.top, 8)

                Button {
                    Task { await verify() }
                } label: {
                    Group {
                        if isVerifying {
                            ProgressView().tint(.white)
                        } else {
                            Text("Verify")
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
                .disabled(!isCodeReady || isVerifying)
                .opacity(!isCodeReady ? 0.6 : 1)

                // Resend with cooldown so users can't hammer the OTP endpoint
                // (Supabase rate-limits this server-side too).
                HStack(spacing: 4) {
                    Text("Didn't get it?")
                        .foregroundStyle(.white.opacity(0.8))
                    if resendCooldown > 0 {
                        Text("Resend in \(resendCooldown)s")
                            .foregroundStyle(.white.opacity(0.6))
                    } else {
                        Button {
                            Task { await resend() }
                        } label: {
                            Text(isResending ? "Sending…" : "Resend code")
                                .underline()
                                .foregroundStyle(.white)
                        }
                        .disabled(isResending)
                    }
                }
                .font(.caption.weight(.medium))
                .padding(.top, 4)

                Button("Use a different email") {
                    dismiss()
                }
                .font(.caption)
                .foregroundStyle(.white.opacity(0.75))
                .underline()
                .padding(.top, 4)

                Spacer(minLength: 16)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 24)
        }
        .scrollContentBackground(.hidden)
        .background { AuthDottedBackground() }
        .navigationBarBackButtonHidden(false)
        .navigationTitle("")
        .toolbarBackground(.hidden, for: .navigationBar)
        .task {
            codeFieldFocused = true
            await runResendTimer()
        }
    }

    // MARK: - Verify

    private func verify() async {
        guard isCodeReady, !isVerifying else { return }
        isVerifying = true
        errorMessage = nil
        defer { isVerifying = false }
        do {
            let response = try await appState.supabase.auth.verifyOTP(
                email: email,
                token: code,
                type: .email
            )
            guard let session = response.session else {
                errorMessage = "Verification succeeded but no session was returned. Try again."
                return
            }
            await appState.updateSession(session)
        } catch {
            errorMessage = "Couldn't verify that code. Try again or resend."
            code = ""
        }
    }

    // MARK: - Resend

    private func resend() async {
        guard resendCooldown == 0, !isResending else { return }
        isResending = true
        errorMessage = nil
        defer { isResending = false }
        do {
            try await appState.supabase.auth.signInWithOTP(
                email: email,
                shouldCreateUser: false
            )
            resendCooldown = 60
            await runResendTimer()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Drains the 60s countdown 1s at a time on the MainActor. Simpler than
    /// wiring a Timer and lets cancellation just happen via the .task.
    private func runResendTimer() async {
        while resendCooldown > 0 {
            try? await Task.sleep(for: .seconds(1))
            if Task.isCancelled { return }
            resendCooldown -= 1
        }
    }
}
