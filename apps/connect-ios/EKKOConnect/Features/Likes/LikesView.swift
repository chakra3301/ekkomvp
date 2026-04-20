import SwiftUI
import Kingfisher

enum LikesTab: String, Hashable {
    case likes
    case requests
}

struct LikesView: View {
    @Environment(AppState.self) private var appState
    @Environment(PurchaseManager.self) private var purchaseManager
    @State private var selectedTab: LikesTab = .likes
    @State private var likes: [ConnectSwipe] = []
    @State private var isLoading = true
    @State private var isSwiping = false
    @State private var matchData: MatchCelebrationData?
    @State private var showUpgradeSheet = false
    @State private var expandedProfile: ConnectProfile?
    @State private var isLoadingExpanded = false
    /// Inquiry CTA state. The expanded profile sheet sets this when the
    /// visitor taps Book a Call / Apply Now on a Hire / Client template.
    @State private var pendingInquiry: PendingInquiry?

    private struct PendingInquiry: Identifiable {
        let id = UUID()
        let type: ConnectInquiryType
        let toUserId: String
        let recipientName: String?
        let briefs: [ClientBrief]
    }

    private var isPremium: Bool {
        appState.hasInfiniteAccess
    }

    struct MatchCelebrationData: Identifiable {
        let id: String
        let displayName: String
        var avatarUrl: String?
        var featuredImage: String?
    }

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        VStack(spacing: 0) {
            tabBar
                .padding(.top, 8)
                .padding(.horizontal, 16)
                .padding(.bottom, 12)

            Group {
                switch selectedTab {
                case .likes: likesTabContent
                case .requests: RequestsView()
                }
            }
        }
        .furiganaTitle("Likes", JPLabels.screens.likes)
        .task {
            await loadLikes()
            await appState.refreshInquiryUnreadCount()
        }
        .sheet(isPresented: $showUpgradeSheet) {
            UpgradeModal(isPresented: $showUpgradeSheet)
                .environment(purchaseManager)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
        .sheet(item: $expandedProfile) { profile in
            expandedProfileSheet(profile)
        }
        .overlay {
            if let match = matchData {
                MatchCelebrationOverlay(
                    matchId: match.id,
                    displayName: match.displayName,
                    avatarUrl: match.avatarUrl,
                    featuredImage: match.featuredImage,
                    onSendMessage: {
                        // Navigate to the chat: select Matches tab + push ChatView via AppState
                        let matchId = match.id
                        matchData = nil
                        appState.selectedTab = 2
                        appState.pendingChatMatchId = matchId
                    },
                    onKeepSwiping: { matchData = nil }
                )
                .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: matchData != nil)
    }

    // MARK: - Tab bar (Likes / Requests)

    @ViewBuilder
    private var tabBar: some View {
        HStack(spacing: 8) {
            tabButton(.likes, label: "Likes", badge: nil)
            tabButton(.requests, label: "Requests", badge: appState.inquiryUnreadCount)
            Spacer(minLength: 0)
        }
    }

    private func tabButton(_ tab: LikesTab, label: String, badge: Int?) -> some View {
        let isActive = selectedTab == tab
        return Button {
            withAnimation(.easeInOut(duration: 0.18)) {
                selectedTab = tab
            }
        } label: {
            HStack(spacing: 6) {
                Text(label)
                    .font(.subheadline.weight(isActive ? .semibold : .medium))
                    .foregroundStyle(isActive ? .primary : .secondary)
                if let badge, badge > 0 {
                    Text("\(badge)")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.white)
                        .frame(minWidth: 16)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(Color.accentColor, in: Capsule())
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(
                Capsule()
                    .fill(isActive ? Color.secondary.opacity(0.15) : Color.clear)
            )
            .overlay(
                Capsule()
                    .stroke(Color.secondary.opacity(isActive ? 0.0 : 0.2), lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Likes tab content

    @ViewBuilder
    private var likesTabContent: some View {
        if isLoading {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    SkeletonView(width: 180, height: 20)
                        .padding(.horizontal, 16)
                    SkeletonGrid(rows: 3)
                }
                .padding(.top, 8)
            }
        } else if likes.isEmpty {
            emptyState
        } else {
            ZStack {
                likesGrid
                    .blur(radius: isPremium ? 0 : 22)
                    .disabled(!isPremium)
                    .allowsHitTesting(isPremium)
                if !isPremium {
                    premiumGate
                }
            }
        }
    }

    // MARK: - Likes Grid

    private var likesGrid: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("\(likes.count) \(likes.count == 1 ? "person" : "people") liked you")
                    .font(.headline)
                    .padding(.horizontal, 16)

                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(likes) { like in
                        likeCard(like)
                    }
                }
                .padding(.horizontal, 16)
            }
            .padding(.top, 8)
        }
        .refreshable { await loadLikes() }
    }

    @ViewBuilder
    private func likeCard(_ like: ConnectSwipe) -> some View {
        let displayName = like.user?.profile?.displayName ?? "Creative"
        // Prefer the Connect profile's first media slot (the hero photo the user
        // set in their Connect profile). Fall back to the general profile avatar.
        let heroUrl = like.user?.connectProfile?.mediaSlots?
            .sorted { $0.sortOrder < $1.sortOrder }
            .first(where: { $0.mediaType == "PHOTO" })?.url
            ?? like.user?.profile?.avatarUrl

        VStack(spacing: 0) {
            // Photo — tap to expand into full profile
            Button {
                Task { await openProfile(for: like) }
            } label: {
                ZStack(alignment: .bottom) {
                    if let url = heroUrl, let imageURL = URL(string: url) {
                        KFImage(imageURL)
                            .resizable()
                            .scaledToFill()
                            .frame(maxWidth: .infinity)
                            .clipped()
                    } else {
                        Rectangle()
                            .fill(Color.gray.opacity(0.15))
                            .overlay {
                                Text(String(displayName.prefix(1)).uppercased())
                                    .font(.largeTitle.bold())
                                    .foregroundStyle(.secondary)
                            }
                    }

                    // Name overlay
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.7)],
                        startPoint: .center,
                        endPoint: .bottom
                    )

                    Text(displayName)
                        .font(.custom(EKKOFont.regular, size: 16))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                }
                .aspectRatio(3/4, contentMode: .fill)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)

            // Match note
            if let note = like.matchNote, !note.isEmpty {
                Text("\"\(note)\"")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .italic()
                    .lineLimit(2)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
            }

            // Action buttons
            HStack(spacing: 8) {
                Button {
                    Task { await handlePass(like.userId) }
                } label: {
                    Text("Pass")
                        .font(.caption.weight(.medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                }
                .buttonStyle(.glass)
                .disabled(isSwiping)

                Button {
                    Task { await handleLikeBack(like.userId) }
                } label: {
                    Text("Like Back")
                        .font(.caption.weight(.medium))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius))
                }
                .disabled(isSwiping)
            }
            .padding(8)
        }
        .glassCard()
    }

    // MARK: - Premium Gate Overlay

    private var premiumGate: some View {
        VStack(spacing: 16) {
            Spacer()
            VStack(spacing: 14) {
                Image(systemName: "lock.fill")
                    .font(.system(size: 36))
                    .foregroundStyle(Color.accentColor)

                Text("See who likes you")
                    .font(.title3.bold())

                Text("Upgrade to reveal everyone who's already interested — and like them back instantly.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 24)

                Button {
                    showUpgradeSheet = true
                } label: {
                    Text("Upgrade to Infinite")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius))
                }
                .padding(.horizontal, 24)
                .padding(.top, 4)
            }
            .padding(.vertical, 24)
            .frame(maxWidth: .infinity)
            .background(.ultraThinMaterial)
            .clipShape(RoundedRectangle(cornerRadius: 24))
            .overlay(
                RoundedRectangle(cornerRadius: 24)
                    .stroke(Color.white.opacity(0.12), lineWidth: 0.5)
            )
            .shadow(color: .black.opacity(0.3), radius: 20, y: 8)
            .padding(.horizontal, 24)
            Spacer()
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "heart")
                .font(.system(size: 40))
                .foregroundStyle(Color.accentColor)
                .padding()
                .background(Color.accentColor.opacity(0.1))
                .clipShape(Circle())

            Text("No likes yet")
                .font(.headline)

            Text("When someone swipes right on your profile, they'll show up here. A strong profile with great photos gets more attention.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
    }

    // MARK: - Actions

    private func loadLikes() async {
        do {
            struct LikesResult: Codable {
                let likes: [ConnectSwipe]
            }
            let result: LikesResult = try await appState.trpc.query(
                "connectDiscover.getLikesReceived",
                input: ["limit": 20]
            )
            likes = result.likes
        } catch {
            likes = []
        }
        isLoading = false
    }

    private func handleLikeBack(_ targetUserId: String) async {
        isSwiping = true
        defer { isSwiping = false }
        do {
            let result: SwipeResult = try await appState.trpc.mutate(
                "connectMatch.swipe",
                input: SwipeInput(targetUserId: targetUserId, type: .LIKE)
            )
            // Optimistically remove this person from the likes stack. If the
            // other side later unmatches, they'll reappear on next full load.
            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                likes.removeAll { $0.userId == targetUserId }
            }
            if result.matched, let matchId = result.matchId {
                let liker = likes.first { $0.userId == targetUserId }
                let name = liker?.user?.profile?.displayName ?? "Your Match"
                let avatar = liker?.user?.profile?.avatarUrl
                matchData = MatchCelebrationData(
                    id: matchId,
                    displayName: name,
                    avatarUrl: avatar,
                    featuredImage: avatar
                )
            }
        } catch {
            // Surface the real error so we can tell a daily-limit cap apart
            // from a network error or a validation issue.
            appState.showError(error.localizedDescription)
        }
    }

    private func handlePass(_ targetUserId: String) async {
        isSwiping = true
        defer { isSwiping = false }
        do {
            let _: SwipeResult = try await appState.trpc.mutate(
                "connectMatch.swipe",
                input: SwipeInput(targetUserId: targetUserId, type: .PASS)
            )
            withAnimation(.spring(response: 0.35, dampingFraction: 0.8)) {
                likes.removeAll { $0.userId == targetUserId }
            }
        } catch {
            appState.showError(error.localizedDescription)
        }
    }

    // MARK: - Expanded Profile Sheet

    private func openProfile(for like: ConnectSwipe) async {
        guard let profileId = like.user?.connectProfile?.id else { return }
        isLoadingExpanded = true
        defer { isLoadingExpanded = false }
        do {
            let profile: ConnectProfile = try await appState.trpc.query(
                "connectProfile.getById",
                input: profileId
            )
            expandedProfile = profile
        } catch {
            appState.showError("Couldn't load profile — try again.")
        }
    }

    @ViewBuilder
    private func expandedProfileSheet(_ profile: ConnectProfile) -> some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 0) {
                    ConnectProfileViewer(
                        profile: profile,
                        viewerIsOwner: false,
                        onTapInquiryCTA: { type in
                            pendingInquiry = PendingInquiry(
                                type: type,
                                toUserId: profile.userId,
                                recipientName: profile.user?.profile?.displayName,
                                briefs: profile.clientData?.briefs ?? []
                            )
                        }
                    )

                    // Pass / Like Back actions (same flow as the grid card)
                    HStack(spacing: 24) {
                        Button {
                            let targetUserId = profile.userId
                            expandedProfile = nil
                            Task { await handlePass(targetUserId) }
                        } label: {
                            Image(systemName: "xmark")
                                .font(.title2)
                                .foregroundStyle(EKKOTheme.destructive)
                                .frame(width: 56, height: 56)
                                .background(.ultraThinMaterial)
                                .clipShape(Circle())
                                .shadow(radius: 8)
                        }

                        Button {
                            let targetUserId = profile.userId
                            expandedProfile = nil
                            Task { await handleLikeBack(targetUserId) }
                        } label: {
                            Image(systemName: "heart.fill")
                                .font(.title)
                                .foregroundStyle(.white)
                                .frame(width: 64, height: 64)
                                .background(Color.accentColor)
                                .clipShape(Circle())
                                .shadow(radius: 8)
                        }
                    }
                    .padding(.top, 32)
                    .padding(.bottom, 40)
                    .disabled(isSwiping)
                }
            }
            .navigationTitle(profile.user?.profile?.displayName ?? "Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { expandedProfile = nil }
                }
            }
            .sheet(item: $pendingInquiry) { p in
                inquirySheet(p)
            }
        }
    }

    @ViewBuilder
    private func inquirySheet(_ p: PendingInquiry) -> some View {
        switch p.type {
        case .BOOKING_REQUEST:
            BookCallSheet(
                toUserId: p.toUserId,
                recipientName: p.recipientName,
                onSent: { appState.showSuccess("Sent — they'll see it under Requests.") }
            )
        case .APPLICATION:
            ApplyNowSheet(
                toUserId: p.toUserId,
                recipientBrand: p.recipientName,
                briefs: p.briefs,
                onSent: { appState.showSuccess("Sent — they'll see it under Requests.") }
            )
        case .NOTE:
            // Reuse the booking sheet's payload until we have a dedicated
            // generic-note CTA in the UI.
            BookCallSheet(
                toUserId: p.toUserId,
                recipientName: p.recipientName,
                onSent: { appState.showSuccess("Sent.") }
            )
        }
    }
}
