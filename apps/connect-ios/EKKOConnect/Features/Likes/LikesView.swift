import SwiftUI
import Kingfisher

struct LikesView: View {
    @Environment(AppState.self) private var appState
    @State private var likes: [ConnectSwipe] = []
    @State private var isLoading = true
    @State private var isSwiping = false

    private let columns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12),
    ]

    var body: some View {
        Group {
            if isLoading {
                VStack { Spacer(); ProgressView(); Spacer() }
            } else if likes.isEmpty {
                emptyState
            } else {
                likesGrid
            }
        }
        .navigationTitle("Likes")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadLikes() }
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
                    .font(.subheadline.weight(.semibold))
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
        do {
            let result: SwipeResult = try await appState.trpc.mutate(
                "connectMatch.swipe",
                input: SwipeInput(targetUserId: targetUserId, type: .LIKE)
            )
            if result.matched {
                // TODO: Show match celebration
            }
            await loadLikes()
        } catch {}
        isSwiping = false
    }

    private func handlePass(_ targetUserId: String) async {
        isSwiping = true
        do {
            let _: SwipeResult = try await appState.trpc.mutate(
                "connectMatch.swipe",
                input: SwipeInput(targetUserId: targetUserId, type: .PASS)
            )
            await loadLikes()
        } catch {}
        isSwiping = false
    }
}
