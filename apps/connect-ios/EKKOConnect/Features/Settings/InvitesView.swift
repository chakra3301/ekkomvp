import SwiftUI

/// Member-facing invite economy. Lives behind Settings → Invites.
/// Backend: see `packages/api/src/routers/invite.ts`.
struct InvitesView: View {
    @Environment(AppState.self) private var appState

    @State private var balance: InviteBalance?
    @State private var codes: [IssuedInvite] = []
    @State private var isLoading = true
    @State private var isGenerating = false
    @State private var revokingCode: String?
    @State private var errorMessage: String?

    private var isFounder: Bool {
        appState.currentUser?.isFounder == true
    }

    var body: some View {
        List {
            Section {
                balanceCard
                    .listRowInsets(EdgeInsets(top: 12, leading: 16, bottom: 12, trailing: 16))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)

                generateButton
                    .listRowInsets(EdgeInsets(top: 0, leading: 16, bottom: 12, trailing: 16))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .font(.caption)
                        .foregroundStyle(EKKOTheme.destructive)
                }
            }

            Section {
                if isLoading && codes.isEmpty {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                    .listRowBackground(Color.clear)
                } else if codes.isEmpty {
                    emptyState
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                } else {
                    ForEach(codes, id: \.code) { invite in
                        InviteCodeRow(
                            invite: invite,
                            isRevoking: revokingCode == invite.code,
                            onRevoke: { Task { await revoke(invite.code) } }
                        )
                    }
                }
            } header: {
                if !codes.isEmpty {
                    Text("Your codes")
                }
            } footer: {
                Text("Codes expire 30 days after creation. Revoking an unredeemed code refunds the slot.")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
        }
        .scrollContentBackground(.hidden)
        .furiganaTitle("Invites", JPLabels.screens.invites)
        .task { await load() }
        .refreshable { await load() }
    }

    // MARK: - Header

    private var balanceCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text("\(balance?.availableCount ?? 0)")
                    .font(.system(size: 56, weight: .bold, design: .rounded))
                    .foregroundStyle(.primary)
                    .contentTransition(.numericText())
                    .animation(.easeOut(duration: 0.2), value: balance?.availableCount)
                Text(balance?.availableCount == 1 ? "invite left" : "invites left")
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(.secondary)
                Spacer()
                if isFounder {
                    Text("FOUNDER")
                        .font(.caption2.weight(.bold))
                        .tracking(1.5)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 5)
                        .background(Color.accentColor.opacity(0.15))
                        .foregroundStyle(Color.accentColor)
                        .clipShape(Capsule())
                }
            }

            if let nextRefresh = balance?.nextRefreshAt {
                Text("Refreshes \(refreshCopy(for: nextRefresh))")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("Top up monthly while you stay active.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            if let balance, balance.totalIssued > 0 {
                HStack(spacing: 16) {
                    statChip(value: balance.totalIssued, label: "issued")
                    statChip(value: balance.totalRedeemed, label: "redeemed")
                }
                .padding(.top, 4)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .glassBubble(cornerRadius: 20)
    }

    private func statChip(value: Int, label: String) -> some View {
        HStack(spacing: 4) {
            Text("\(value)")
                .font(.caption.weight(.semibold))
            Text(label)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private var generateButton: some View {
        Button {
            Task { await generate() }
        } label: {
            ZStack {
                if isGenerating {
                    ProgressView().tint(.white)
                } else {
                    Label("Generate new code", systemImage: "plus.circle.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 48)
            .background(Color.accentColor.opacity(canGenerate ? 1 : 0.4))
            .clipShape(RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
        .disabled(!canGenerate)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "envelope.badge")
                .font(.title)
                .foregroundStyle(.secondary)
            Text("No codes yet")
                .font(.subheadline.weight(.medium))
            Text("Generate a code and share it with someone whose work belongs here.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
    }

    private var canGenerate: Bool {
        !isGenerating && (balance?.availableCount ?? 0) > 0
    }

    // MARK: - Networking

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        async let balanceTask: InviteBalance? = try? appState.trpc.query("invite.myBalance")
        async let codesTask: [IssuedInvite]? = try? appState.trpc.query("invite.listMine")
        balance = await balanceTask
        if let fetched = await codesTask {
            codes = fetched
        }
    }

    private func generate() async {
        isGenerating = true
        errorMessage = nil
        defer { isGenerating = false }
        do {
            let invite: IssuedInvite = try await appState.trpc.mutate("invite.generate")
            codes.insert(invite, at: 0)
            // Refresh balance to keep available/issued counts honest.
            if let b: InviteBalance = try? await appState.trpc.query("invite.myBalance") {
                balance = b
            }
            appState.showSuccess("Code generated")
        } catch {
            errorMessage = friendlyError(error)
        }
    }

    private func revoke(_ code: String) async {
        revokingCode = code
        defer { revokingCode = nil }
        struct Body: Encodable { let code: String }
        do {
            let updated: IssuedInvite = try await appState.trpc.mutate(
                "invite.revoke",
                input: Body(code: code)
            )
            if let idx = codes.firstIndex(where: { $0.code == code }) {
                codes[idx] = updated
            }
            if let b: InviteBalance = try? await appState.trpc.query("invite.myBalance") {
                balance = b
            }
            appState.showSuccess("Code revoked")
        } catch {
            appState.showError(friendlyError(error))
        }
    }

    private func friendlyError(_ error: Error) -> String {
        if let trpc = error as? TRPCError {
            return trpc.errorDescription ?? "Something went wrong."
        }
        return error.localizedDescription
    }

    private func refreshCopy(for date: Date) -> String {
        let interval = date.timeIntervalSinceNow
        if interval <= 0 { return "soon" }
        let days = Int(ceil(interval / 86_400))
        if days == 1 { return "in 1 day" }
        return "in \(days) days"
    }
}

// MARK: - Code Row

private struct InviteCodeRow: View {
    let invite: IssuedInvite
    let isRevoking: Bool
    let onRevoke: () -> Void

    @State private var showRevokeConfirm = false

    private var displayCode: String {
        let c = invite.code
        guard c.count == 8 else { return c }
        let mid = c.index(c.startIndex, offsetBy: 4)
        return "\(c[..<mid])-\(c[mid...])"
    }

    private var shareText: String {
        """
        You're invited to EKKO.

        Code: \(displayCode)
        https://www.ekkoconnect.app/invite?code=\(invite.code)
        """
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(displayCode)
                    .font(.system(.subheadline, design: .monospaced).weight(.semibold))
                    .lineLimit(1)

                HStack(spacing: 6) {
                    statusChip
                    if let redeemer = invite.redeemedBy {
                        Text("· \(redeemer.profile?.displayName ?? "Someone")")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                    } else if invite.status == "ACTIVE" {
                        Text("· expires \(expiryCopy)")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            Spacer(minLength: 8)

            if invite.status == "ACTIVE" {
                ShareLink(item: shareText) {
                    Image(systemName: "square.and.arrow.up")
                        .font(.subheadline)
                        .foregroundStyle(Color.accentColor)
                        .frame(width: 32, height: 32)
                }
                .buttonStyle(.plain)
            }
        }
        .contentShape(Rectangle())
        .contextMenu {
            Button {
                UIPasteboard.general.string = displayCode
            } label: {
                Label("Copy code", systemImage: "doc.on.doc")
            }
            if invite.status == "ACTIVE" {
                Button(role: .destructive) {
                    showRevokeConfirm = true
                } label: {
                    Label("Revoke", systemImage: "xmark.circle")
                }
            }
        }
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            if invite.status == "ACTIVE" {
                Button(role: .destructive) {
                    showRevokeConfirm = true
                } label: {
                    Label("Revoke", systemImage: "trash")
                }
            }
        }
        .confirmationDialog(
            "Revoke this invite?",
            isPresented: $showRevokeConfirm,
            titleVisibility: .visible
        ) {
            Button("Revoke", role: .destructive, action: onRevoke)
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("\(displayCode) will stop working. The slot refunds to your balance.")
        }
        .opacity(isRevoking ? 0.5 : 1)
    }

    private var statusChip: some View {
        Text(statusLabel)
            .font(.caption2.weight(.semibold))
            .tracking(0.5)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(statusColor.opacity(0.15))
            .foregroundStyle(statusColor)
            .clipShape(Capsule())
    }

    private var statusLabel: String {
        switch invite.status {
        case "ACTIVE": return "ACTIVE"
        case "REDEEMED": return "REDEEMED"
        case "EXPIRED": return "EXPIRED"
        case "REVOKED": return "REVOKED"
        default: return invite.status.uppercased()
        }
    }

    private var statusColor: Color {
        switch invite.status {
        case "ACTIVE": return .green
        case "REDEEMED": return Color.accentColor
        case "EXPIRED", "REVOKED": return .secondary
        default: return .secondary
        }
    }

    private var expiryCopy: String {
        let interval = invite.expiresAt.timeIntervalSinceNow
        if interval <= 0 { return "soon" }
        let days = Int(ceil(interval / 86_400))
        if days == 1 { return "in 1 day" }
        if days > 30 { return "in 30+ days" }
        return "in \(days)d"
    }
}

// MARK: - Response Models

struct InviteBalance: Decodable {
    let availableCount: Int
    let totalIssued: Int
    let totalRedeemed: Int
    let lastRefreshAt: Date?
    let nextRefreshAt: Date?
}

struct IssuedInvite: Decodable {
    let code: String
    let status: String
    let issuedAt: Date
    let expiresAt: Date
    let redeemedAt: Date?
    let redeemedBy: RedeemedByUser?
    let cohort: String?
    let isFounder: Bool

    struct RedeemedByUser: Decodable {
        let id: String
        let profile: RedeemerProfile?
    }

    struct RedeemerProfile: Decodable {
        let displayName: String?
        let username: String?
        let avatarUrl: String?
    }
}
