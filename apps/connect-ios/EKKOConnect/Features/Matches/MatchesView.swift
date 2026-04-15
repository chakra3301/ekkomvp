import SwiftUI

struct MatchesView: View {
    @Environment(AppState.self) private var appState
    @State private var matches: [MatchListItem] = []
    @State private var isLoading = true
    @State private var activeChat: ChatRoute?

    private struct ChatRoute: Identifiable, Hashable {
        let id: String
    }

    var body: some View {
        Group {
            if isLoading {
                VStack(alignment: .leading, spacing: 0) {
                    ForEach(0..<6, id: \.self) { _ in
                        SkeletonRow()
                    }
                    Spacer()
                }
            } else if matches.isEmpty {
                emptyState
            } else {
                matchesList
            }
        }
        .navigationTitle("Matches")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadMatches() }
        .navigationDestination(item: $activeChat) { route in
            ChatView(matchId: route.id)
        }
        .onAppear { consumePendingChatRouteIfAny() }
        .onChange(of: appState.pendingChatMatchId) { _, _ in
            consumePendingChatRouteIfAny()
        }
    }

    private func consumePendingChatRouteIfAny() {
        guard let pending = appState.pendingChatMatchId else { return }
        activeChat = ChatRoute(id: pending)
        appState.pendingChatMatchId = nil
    }

    // MARK: - Matches List

    private var matchesList: some View {
        let newMatches = matches.filter { $0.lastMessage == nil }
        let conversations = matches.filter { $0.lastMessage != nil }

        return ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                // New Matches (horizontal)
                if !newMatches.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("New Matches")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.secondary)
                            .padding(.horizontal, 16)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(newMatches) { match in
                                    NavigationLink(destination: ChatView(matchId: match.id)) {
                                        VStack(spacing: 6) {
                                            AvatarView(
                                                url: match.otherUser.profile?.avatarUrl,
                                                name: match.otherUser.profile?.displayName ?? "User",
                                                size: 64
                                            )
                                            .overlay(
                                                Circle()
                                                    .stroke(EKKOTheme.primary.opacity(0.3), lineWidth: 2)
                                            )

                                            Text(firstName(match.otherUser.profile?.displayName ?? "User"))
                                                .font(.caption)
                                                .foregroundStyle(.primary)
                                                .lineLimit(1)
                                                .frame(maxWidth: 64)
                                        }
                                    }
                                }
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                    .padding(.vertical, 12)

                    Divider()
                }

                // Conversations
                if !conversations.isEmpty {
                    Text("Messages")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                        .padding(.horizontal, 16)
                        .padding(.top, 12)
                        .padding(.bottom, 4)

                    ForEach(conversations) { match in
                        NavigationLink(destination: ChatView(matchId: match.id)) {
                            conversationRow(match)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .refreshable { await loadMatches() }
    }

    @ViewBuilder
    private func conversationRow(_ match: MatchListItem) -> some View {
        let displayName = match.otherUser.profile?.displayName ?? "User"
        let unread = appState.unreadByMatch[match.id] ?? 0

        HStack(spacing: 12) {
            ZStack(alignment: .topTrailing) {
                AvatarView(
                    url: match.otherUser.profile?.avatarUrl,
                    name: displayName,
                    size: 56
                )
                // Unread dot / count bubble
                if unread > 0 {
                    Text(unread > 99 ? "99+" : "\(unread)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .frame(minWidth: 20, minHeight: 20)
                        .background(EKKOTheme.primary)
                        .clipShape(Capsule())
                        .overlay(Capsule().stroke(Color(.systemBackground), lineWidth: 2))
                        .offset(x: 4, y: -4)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(displayName)
                        .font(.custom(EKKOFont.regular, size: 16))
                        .foregroundStyle(.primary)
                    Spacer()
                    if let lastMsg = match.lastMessage {
                        Text(lastMsg.createdAt.relativeShort)
                            .font(.caption)
                            .foregroundStyle(unread > 0 ? EKKOTheme.primary : .secondary)
                            .fontWeight(unread > 0 ? .semibold : .regular)
                    }
                }

                if let lastMsg = match.lastMessage {
                    let prefix = lastMsg.senderId == appState.session?.user.id.uuidString ? "You: " : ""
                    Text("\(prefix)\(lastMsg.content)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "message")
                .font(.system(size: 40))
                .foregroundStyle(EKKOTheme.primary)
                .padding()
                .background(EKKOTheme.primary.opacity(0.1))
                .clipShape(Circle())

            Text("No matches yet")
                .font(.headline)

            Text("When you and another creative both swipe right, you'll match and can start chatting here.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
    }

    // MARK: - Data

    private func loadMatches() async {
        do {
            struct MatchesResult: Codable {
                let matches: [MatchListItem]
            }
            let result: MatchesResult = try await appState.trpc.query(
                "connectMatch.getMatches",
                input: ["limit": 20]
            )
            matches = result.matches
        } catch {
            matches = []
        }
        isLoading = false
    }

    private func firstName(_ name: String) -> String {
        String(name.split(separator: " ").first ?? Substring(name))
    }
}
