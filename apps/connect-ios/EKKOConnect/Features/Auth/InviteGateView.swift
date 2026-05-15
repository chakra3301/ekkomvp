import SwiftUI

/// Shown after a user authenticates but before they have `accessGranted=true`.
/// Two paths through the gate:
///   1. Redeem an invite code (member-issued or admin-minted)
///   2. Apply via the public form on the web; status surfaces here once the
///      user's email has an application row, and a server-side flip on
///      approval auto-advances them on next gate visit.
struct InviteGateView: View {
    @Environment(AppState.self) private var appState

    @State private var displayCode: String = ""
    @State private var isRedeeming = false
    @State private var errorMessage: String?
    @State private var applicationStatus: SignupAppStatusResponse?
    @State private var hasCheckedApplication = false

    private var canonicalCode: String {
        displayCode.filter { $0.isLetter || $0.isNumber }.uppercased()
    }

    private var isCodeValid: Bool {
        canonicalCode.count == 8
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 28) {
                hero
                    .padding(.top, 80)

                Text("EKKO is private — built around taste, not noise. Enter the invite code you received, or apply to join the waitlist.")
                    .font(.callout)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 32)

                codeField
                    .padding(.horizontal, 24)

                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(EKKOTheme.destructive)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }

                continueButton
                    .padding(.horizontal, 24)

                if let status = applicationStatus, status.status != nil {
                    applicationStatusBanner(status)
                        .padding(.horizontal, 24)
                }

                Divider()
                    .padding(.horizontal, 24)
                    .padding(.vertical, 8)

                applyBlock

                Spacer(minLength: 24)

                signOutLink
                    .padding(.bottom, 24)
            }
        }
        .scrollContentBackground(.hidden)
        .background { AuthDottedBackground() }
        .task {
            // Pre-fill from a deep link that landed before the gate appeared.
            if let pending = appState.pendingInviteCode, !pending.isEmpty {
                displayCode = formatCode(pending)
                appState.pendingInviteCode = nil
            }
            // If the user already applied via the web form and the server has
            // flipped them to APPROVED, this call also flips accessGranted on
            // the User row — refresh so the router advances.
            await checkApplication()
        }
    }

    // MARK: - Sections

    private var hero: some View {
        VStack(spacing: 6) {
            Text("EKKO")
                .font(.system(size: 48, weight: .bold))
                .foregroundStyle(.primary)
            Text("INVITE ONLY")
                .font(.caption.weight(.semibold))
                .tracking(3)
                .foregroundStyle(.secondary)
        }
    }

    private var codeField: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Invite code")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)

            TextField("ABCD-EFGH", text: $displayCode)
                .font(.system(.title3, design: .monospaced))
                .autocorrectionDisabled()
                .textInputAutocapitalization(.characters)
                .padding(.horizontal, 16)
                .frame(height: 52)
                .glassBubble(cornerRadius: 14)
                .onChange(of: displayCode) { _, new in
                    let formatted = formatCode(new)
                    if formatted != displayCode {
                        displayCode = formatted
                    }
                    errorMessage = nil
                }
                .onSubmit {
                    if isCodeValid {
                        Task { await redeem() }
                    }
                }
        }
    }

    private var continueButton: some View {
        Button {
            Task { await redeem() }
        } label: {
            ZStack {
                if isRedeeming {
                    ProgressView().tint(.white)
                } else {
                    Text("Continue")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 52)
            .background(Color.accentColor.opacity(isCodeValid && !isRedeeming ? 1 : 0.5))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
        .disabled(!isCodeValid || isRedeeming)
    }

    @ViewBuilder
    private func applicationStatusBanner(_ status: SignupAppStatusResponse) -> some View {
        if let s = status.status {
            VStack(alignment: .leading, spacing: 6) {
                Text(applicationHeadline(for: s))
                    .font(.caption.weight(.semibold))
                Text(applicationBody(for: s))
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .glassBubble(cornerRadius: 12)
        }
    }

    private var applyBlock: some View {
        VStack(spacing: 10) {
            Text("Don't have a code?")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button {
                if let url = URL(string: "https://www.ekkoconnect.app/apply") {
                    UIApplication.shared.open(url)
                }
            } label: {
                Text("Apply for an invite")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .underline()
            }
        }
    }

    private var signOutLink: some View {
        Button {
            Task { await appState.signOut() }
        } label: {
            Text("Sign out")
                .font(.caption.weight(.medium))
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Copy

    private func applicationHeadline(for status: String) -> String {
        switch status {
        case "PENDING": return "Application received"
        case "WAITLISTED": return "On the waitlist"
        case "DECLINED": return "Application not approved"
        default: return status
        }
    }

    private func applicationBody(for status: String) -> String {
        switch status {
        case "PENDING": return "We'll email you when your application is reviewed."
        case "WAITLISTED": return "We'll review your work again in 60 days."
        case "DECLINED": return "Thanks for your interest. You're welcome to apply again with new work."
        default: return ""
        }
    }

    // MARK: - Networking

    private func redeem() async {
        let code = canonicalCode
        guard code.count == 8 else { return }
        isRedeeming = true
        errorMessage = nil
        defer { isRedeeming = false }

        struct Body: Encodable { let code: String }
        struct RedeemResponse: Decodable {
            let ok: Bool
            let alreadyGated: Bool?
            let isFounder: Bool?
        }

        do {
            let res: RedeemResponse = try await appState.trpc.mutate(
                "invite.redeem",
                input: Body(code: code)
            )
            // Refresh the user record so `accessGranted` flips and the
            // AppRouter advances out of the gate on its next render.
            await appState.fetchCurrentUser()
            if res.isFounder == true || appState.currentUser?.isFounder == true {
                appState.showSuccess("Welcome, founder.")
            } else {
                appState.showSuccess("You're in.")
            }
        } catch {
            errorMessage = friendlyError(error)
        }
    }

    private func checkApplication() async {
        guard !hasCheckedApplication else { return }
        hasCheckedApplication = true

        do {
            let res: SignupAppStatusResponse = try await appState.trpc.query("signupApplication.myStatus")
            if res.gated == true {
                await appState.fetchCurrentUser()
                return
            }
            applicationStatus = res
        } catch {
            // Application status is informational; failures shouldn't block
            // the primary code-redemption flow.
            #if DEBUG
            print("[InviteGate] myStatus failed: \(error)")
            #endif
        }
    }

    // MARK: - Code formatting

    /// Strips non-alphanumeric chars, uppercases, caps at 8, and inserts a
    /// hyphen between the two halves so `A3F9K2X7` displays as `A3F9-K2X7`.
    private func formatCode(_ raw: String) -> String {
        let cleaned = raw.filter { $0.isLetter || $0.isNumber }.uppercased()
        let limited = String(cleaned.prefix(8))
        if limited.count > 4 {
            let mid = limited.index(limited.startIndex, offsetBy: 4)
            return String(limited[..<mid]) + "-" + String(limited[mid...])
        }
        return limited
    }

    private func friendlyError(_ error: Error) -> String {
        if let trpc = error as? TRPCError {
            return trpc.errorDescription ?? "Couldn't verify that code."
        }
        return error.localizedDescription
    }
}

private struct SignupAppStatusResponse: Decodable {
    let gated: Bool?
    let source: String?
    let status: String?
}
