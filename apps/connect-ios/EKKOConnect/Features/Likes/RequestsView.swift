import SwiftUI
import Kingfisher

/// Inbox of received inquiries (notes / book-a-call / apply-now). Lives
/// behind the Likes screen's "Requests" segment. Tap a row → detail
/// sheet with the full payload + accept/decline.
struct RequestsView: View {
    @Environment(AppState.self) private var appState

    @State private var inquiries: [ConnectInquiry] = []
    @State private var isLoading = true
    @State private var detail: ConnectInquiry?

    var body: some View {
        Group {
            if isLoading && inquiries.isEmpty {
                ScrollView {
                    SkeletonGrid(rows: 3).padding(.top, 8)
                }
            } else if inquiries.isEmpty {
                emptyState
            } else {
                List {
                    ForEach(inquiries) { inquiry in
                        Button {
                            detail = inquiry
                            Task { await markRead(inquiry) }
                        } label: {
                            row(inquiry)
                        }
                        .buttonStyle(.plain)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                    }
                }
                .listStyle(.plain)
                .refreshable { await load() }
            }
        }
        .task { await load() }
        .sheet(item: $detail) { i in
            InquiryDetailSheet(
                inquiry: i,
                onStatusChange: { newStatus in
                    Task { await setStatus(i, status: newStatus) }
                }
            )
        }
    }

    // MARK: - Row

    private func row(_ inquiry: ConnectInquiry) -> some View {
        HStack(alignment: .top, spacing: 12) {
            avatar(for: inquiry)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(inquiry.fromUser?.profile?.displayName ?? "Someone")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                        .lineLimit(1)
                    typeBadge(inquiry.type)
                    Spacer()
                    if inquiry.isUnread {
                        Circle()
                            .fill(Color.accentColor)
                            .frame(width: 7, height: 7)
                    }
                }

                Text(inquiry.preview)
                    .font(.subheadline)
                    .foregroundStyle(.primary)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)

                Text(relativeTime(inquiry.createdAt))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 10)
        .padding(.horizontal, 12)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(inquiry.isUnread ? Color.accentColor.opacity(0.06) : Color.secondary.opacity(0.04))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(Color.secondary.opacity(0.15), lineWidth: 0.5)
        )
        .padding(.vertical, 4)
    }

    @ViewBuilder
    private func avatar(for inquiry: ConnectInquiry) -> some View {
        let url = inquiry.fromUser?.profile?.avatarUrl
        let name = inquiry.fromUser?.profile?.displayName ?? "?"
        AvatarView(url: url, name: name, size: 44)
    }

    @ViewBuilder
    private func typeBadge(_ type: ConnectInquiryType) -> some View {
        let (label, color): (String, Color) = {
            switch type {
            case .BOOKING_REQUEST: return ("BOOKING", Color.accentColor)
            case .APPLICATION:     return ("APPLY",   Color.green)
            case .NOTE:            return ("NOTE",    Color.secondary)
            }
        }()
        Text(label)
            .font(.system(size: 8, weight: .bold).monospaced())
            .tracking(1.5)
            .foregroundStyle(color)
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(color.opacity(0.12), in: Capsule())
    }

    private func relativeTime(_ date: Date) -> String {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .abbreviated
        return f.localizedString(for: date, relativeTo: Date())
    }

    // MARK: - Empty state

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "tray")
                .font(.system(size: 40))
                .foregroundStyle(Color.accentColor)
                .padding()
                .background(Color.accentColor.opacity(0.1))
                .clipShape(Circle())

            Text("No requests yet")
                .font(.headline)

            Text("When someone sends you a note, books a call, or applies to a brief, it'll land here.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Button {
                appState.selectedTab = 0
            } label: {
                Text("Start swiping")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 28)
                    .padding(.vertical, 12)
                    .background(Color.accentColor)
                    .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius))
            }
            .padding(.top, 4)
            Spacer()
        }
    }

    // MARK: - Network

    private func load() async {
        do {
            let result: InquiriesResult = try await appState.trpc.query(
                "connectInquiry.listReceived",
                input: ["limit": 50]
            )
            inquiries = result.inquiries
        } catch {
            inquiries = []
        }
        isLoading = false
        // Refresh the badge count after loading.
        await appState.refreshInquiryUnreadCount()
    }

    private func markRead(_ inquiry: ConnectInquiry) async {
        guard inquiry.isUnread else { return }
        guard let idx = inquiries.firstIndex(where: { $0.id == inquiry.id }) else { return }
        // Optimistically clear the unread dot, but remember the prior value so a
        // failed server call doesn't silently desync the dot + tab badge.
        let previousReadAt = inquiries[idx].readAt
        inquiries[idx].readAt = Date()
        do {
            let _: VoidResponse = try await appState.trpc.mutate(
                "connectInquiry.markAsRead",
                input: ["inquiryId": inquiry.id]
            )
        } catch {
            if let i = inquiries.firstIndex(where: { $0.id == inquiry.id }) {
                inquiries[i].readAt = previousReadAt
            }
            #if DEBUG
            print("[Requests] markAsRead failed: \(error)")
            #endif
        }
        await appState.refreshInquiryUnreadCount()
    }

    private func setStatus(_ inquiry: ConnectInquiry, status: ConnectInquiryStatus) async {
        // Optimistic update.
        if let idx = inquiries.firstIndex(where: { $0.id == inquiry.id }) {
            inquiries[idx].status = status
        }
        do {
            let _: VoidResponse = try await appState.trpc.mutate(
                "connectInquiry.setStatus",
                input: ["inquiryId": inquiry.id, "status": status.rawValue]
            )
        } catch {
            appState.showError("Couldn't update — try again.")
            await load()
        }
    }
}

/// Stand-in type for tRPC mutations that don't return a useful body.
private struct VoidResponse: Codable {
    let success: Bool?
}

// MARK: - Detail sheet
//
// Renders the full inquiry payload + accept / decline / view-profile
// actions. View Profile pushes a NavigationLink to ConnectProfileViewer
// fetched by getByUserId.

struct InquiryDetailSheet: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(AppState.self) private var appState

    let inquiry: ConnectInquiry
    var onStatusChange: ((ConnectInquiryStatus) -> Void)? = nil

    @State private var fetchedProfile: ConnectProfile?
    @State private var isFetchingProfile = false
    @State private var showProfile = false
    @State private var likeBackState: LikeBackState = .idle

    enum LikeBackState: Equatable { case idle, sending, liked, matched, alreadyLiked }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    payloadView
                    actions
                }
                .padding(20)
            }
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .navigationDestination(isPresented: $showProfile) {
                if let p = fetchedProfile {
                    ScrollView {
                        ConnectProfileViewer(profile: p, viewerIsOwner: false)
                    }
                    .navigationTitle(p.user?.profile?.displayName ?? "Profile")
                    .navigationBarTitleDisplayMode(.inline)
                } else if isFetchingProfile {
                    SkeletonProfile()
                } else {
                    Text("Couldn't load profile.")
                        .foregroundStyle(.secondary)
                        .padding(.top, 40)
                }
            }
        }
    }

    private var title: String {
        switch inquiry.type {
        case .BOOKING_REQUEST: return "Booking request"
        case .APPLICATION:     return "Application"
        case .NOTE:            return "Note"
        }
    }

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            AvatarView(
                url: inquiry.fromUser?.profile?.avatarUrl,
                name: inquiry.fromUser?.profile?.displayName ?? "?",
                size: 56
            )
            VStack(alignment: .leading, spacing: 2) {
                Text(inquiry.fromUser?.profile?.displayName ?? "Someone")
                    .font(.title3.bold())
                if let username = inquiry.fromUser?.profile?.username {
                    Text("@\(username)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Text(inquiry.createdAt, style: .relative)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            statusBadge
        }
    }

    @ViewBuilder
    private var statusBadge: some View {
        // Notes aren't accept/decline requests — no status to show.
        if inquiry.type != .NOTE {
            let (label, color): (String, Color) = {
                switch inquiry.status {
                case .PENDING:  return ("PENDING",  .orange)
                case .ACCEPTED: return ("ACCEPTED", .green)
                case .DECLINED: return ("DECLINED", .red)
                }
            }()
            Text(label)
            .font(.system(size: 9, weight: .bold).monospaced())
            .tracking(1.5)
            .foregroundStyle(color)
            .padding(.horizontal, 6)
            .padding(.vertical, 3)
            .background(color.opacity(0.12), in: Capsule())
        }
    }

    @ViewBuilder
    private var payloadView: some View {
        switch inquiry.type {
        case .BOOKING_REQUEST:
            if let p = inquiry.booking {
                bookingPayload(p)
            } else {
                fallbackPayload
            }
        case .APPLICATION:
            if let p = inquiry.application {
                applicationPayload(p)
            } else {
                fallbackPayload
            }
        case .NOTE:
            if let p = inquiry.note {
                payloadCard {
                    payloadField("Note", p.message, multiline: true)
                }
            } else {
                fallbackPayload
            }
        }
    }

    private var fallbackPayload: some View {
        payloadCard {
            payloadField("Message", inquiry.preview, multiline: true)
        }
    }

    private func bookingPayload(_ p: BookingInquiryPayload) -> some View {
        payloadCard {
            if let v = p.projectType, !v.isEmpty { payloadField("Project type", v) }
            if let v = p.budget, !v.isEmpty      { payloadField("Budget",       v) }
            if let v = p.timeline, !v.isEmpty    { payloadField("Timeline",     v) }
            payloadField("Message", p.message, multiline: true)
            if let v = p.link, !v.isEmpty        { linkField(v) }
        }
    }

    private func applicationPayload(_ p: ApplicationInquiryPayload) -> some View {
        payloadCard {
            if let title = p.briefTitle, !title.isEmpty {
                payloadField("Brief", title)
            }
            payloadField("Pitch", p.message, multiline: true)
            if let v = p.link, !v.isEmpty { linkField(v) }
        }
    }

    private func payloadCard<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.secondary.opacity(0.06))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.secondary.opacity(0.15), lineWidth: 0.5)
        )
    }

    private func payloadField(_ label: String, _ value: String, multiline: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.caption2.weight(.semibold).monospaced())
                .tracking(1.5)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.subheadline)
                .foregroundStyle(.primary)
                .lineLimit(multiline ? nil : 2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func linkField(_ url: String) -> some View {
        Button {
            let str = url.hasPrefix("http") ? url : "https://\(url)"
            if let u = URL(string: str) { UIApplication.shared.open(u) }
        } label: {
            HStack(spacing: 6) {
                Image(systemName: "link")
                Text(url)
                    .lineLimit(1)
                Spacer(minLength: 0)
                Image(systemName: "arrow.up.right")
                    .font(.caption2)
            }
            .font(.subheadline.weight(.medium))
            .foregroundStyle(Color.accentColor)
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color.accentColor.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private var actions: some View {
        VStack(spacing: 8) {
            if inquiry.type == .NOTE {
                // A note rides along with a like — the meaningful response is
                // to like back (→ match), not accept/decline. Make it one tap.
                likeBackButton
                viewProfileButton
            } else {
                viewProfileButton
                decideButtons
            }
        }
    }

    private var viewProfileButton: some View {
        Button {
            Task { await fetchAndShowProfile() }
        } label: {
            HStack {
                Image(systemName: "person.crop.circle")
                Text("View profile")
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.primary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
    }

    private var decideButtons: some View {
        HStack(spacing: 8) {
            Button {
                onStatusChange?(.DECLINED)
                dismiss()
            } label: {
                Text("Decline")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.secondary.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .disabled(inquiry.status == .DECLINED)

            Button {
                onStatusChange?(.ACCEPTED)
                dismiss()
            } label: {
                Text("Accept")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.black)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 12))
            }
            .buttonStyle(.plain)
            .disabled(inquiry.status == .ACCEPTED)
        }
    }

    private var likeBackButton: some View {
        let (icon, label): (String, String) = {
            switch likeBackState {
            case .idle:        return ("heart.fill",            "Like back")
            case .sending:     return ("",                      "")
            case .liked:       return ("checkmark",             "Liked back")
            case .matched:     return ("checkmark.circle.fill", "It's a match!")
            case .alreadyLiked:return ("checkmark",             "Already liked")
            }
        }()
        return Button {
            Task { await likeBack() }
        } label: {
            HStack(spacing: 6) {
                if likeBackState == .sending {
                    ProgressView().tint(.black)
                } else {
                    Image(systemName: icon)
                    Text(label)
                }
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(.black)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .disabled(likeBackState != .idle)
    }

    /// Likes the note's sender back. Since the note arrived alongside their
    /// like, this normally produces an immediate match.
    private func likeBack() async {
        likeBackState = .sending
        do {
            let result: SwipeResult = try await appState.trpc.mutate(
                "connectMatch.swipe",
                input: SwipeInput(targetUserId: inquiry.fromUserId, type: .LIKE, matchNote: nil)
            )
            likeBackState = result.matched ? .matched : .liked
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            let msg = error.localizedDescription.lowercased()
            if msg.contains("already swiped") {
                likeBackState = .alreadyLiked
            } else if msg.contains("daily like limit") || msg.contains("too_many_requests") || msg.contains("rate limit") {
                likeBackState = .idle
                appState.showError("Daily like limit reached — upgrade for more.")
            } else {
                likeBackState = .idle
                appState.showError("Couldn't like back — try again.")
            }
        }
    }

    private func fetchAndShowProfile() async {
        if fetchedProfile != nil {
            showProfile = true
            return
        }
        // Push the destination immediately so the SkeletonProfile renders during
        // the ~500ms fetch (otherwise the tap looks dead). The destination's
        // branches resolve skeleton → profile, or → "Couldn't load profile." on
        // failure, where the toast also fires.
        showProfile = true
        isFetchingProfile = true
        defer { isFetchingProfile = false }
        do {
            let p: ConnectProfile = try await appState.trpc.query(
                "connectProfile.getByUserId",
                input: inquiry.fromUserId
            )
            fetchedProfile = p
        } catch {
            appState.showLoadError("Couldn't load profile.", error: error)
        }
    }
}
