import SwiftUI
import Kingfisher

struct LikesView: View {
    @Environment(AppState.self) private var appState
    @Environment(PurchaseManager.self) private var purchaseManager
    @State private var likes: [ConnectSwipe] = []
    @State private var isLoading = true
    @State private var isSwiping = false
    @State private var matchData: MatchCelebrationData?
    @State private var showUpgradeSheet = false

    private var isPremium: Bool {
        appState.currentConnectProfile?.connectTier == .INFINITE
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
        Group {
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
        .navigationTitle("Likes")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadLikes() }
        .sheet(isPresented: $showUpgradeSheet) {
            UpgradeModal(isPresented: $showUpgradeSheet)
                .environment(purchaseManager)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
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
        let avatarUrl = like.user?.profile?.avatarUrl

        VStack(spacing: 0) {
            // Photo
            ZStack(alignment: .bottom) {
                if let url = avatarUrl, let imageURL = URL(string: url) {
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
                        .background(EKKOTheme.primary)
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
                    .foregroundStyle(EKKOTheme.primary)

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
                        .background(EKKOTheme.primary)
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
                .foregroundStyle(EKKOTheme.primary)
                .padding()
                .background(EKKOTheme.primary.opacity(0.1))
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
}
