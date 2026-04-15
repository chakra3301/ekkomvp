import SwiftUI

struct DiscoverView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = DiscoverViewModel()
    @State private var reportTargetUserId: String?
    @State private var showUpgradeSheet = false
    @Environment(PurchaseManager.self) private var purchaseManager

    var body: some View {
        ZStack {
            VStack(spacing: 0) {
                // View mode toggle
                HStack {
                    Spacer()
                    viewModeToggle
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)

                // Content
                Group {
                    if viewModel.isLoading {
                        loadingState
                    } else if viewModel.visibleProfiles.isEmpty {
                        emptyState
                    } else {
                        switch viewModel.viewMode {
                        case .stack:
                            cardStack
                        case .grid:
                            gridMode
                        case .history:
                            historyMode
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }

            // Like note prompt
            if viewModel.pendingLikeUserId != nil {
                VStack {
                    Spacer()
                    LikeNoteSheet(
                        isPresented: .init(
                            get: { viewModel.pendingLikeUserId != nil },
                            set: { if !$0 { Task { await viewModel.skipLikeNote() } } }
                        )
                    ) { note in
                        Task { await viewModel.submitLikeNote(note) }
                    }
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
                .animation(.spring(response: 0.3, dampingFraction: 0.8), value: viewModel.pendingLikeUserId != nil)
            }

            // Match celebration overlay
            if let match = viewModel.matchData {
                MatchCelebrationOverlay(
                    matchId: match.id,
                    displayName: match.displayName,
                    avatarUrl: match.avatarUrl,
                    featuredImage: match.featuredImage,
                    onSendMessage: {
                        let matchId = match.id
                        viewModel.matchData = nil
                        appState.pendingChatMatchId = matchId
                        appState.selectedTab = 2
                    },
                    onKeepSwiping: {
                        viewModel.matchData = nil
                    }
                )
                .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: viewModel.matchData != nil)
        .navigationTitle("Discover")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            viewModel.setup(trpc: appState.trpc, appState: appState)
            await viewModel.loadQueue()
        }
        .onChange(of: appState.discoveryFilters) { _, _ in
            Task { await viewModel.loadQueue() }
        }
        .sheet(item: Binding(
            get: { reportTargetUserId.map { ReportTarget(id: $0) } },
            set: { reportTargetUserId = $0?.id }
        )) { target in
            ReportSheet(targetType: .USER, targetId: target.id) {
                // After report submitted, advance past this profile
                viewModel.advanceIndex()
            }
        }
        .sheet(isPresented: $showUpgradeSheet) {
            UpgradeModal(isPresented: $showUpgradeSheet)
                .environment(purchaseManager)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
        .onChange(of: viewModel.shouldShowUpgradePrompt) { _, newValue in
            if newValue {
                showUpgradeSheet = true
                viewModel.shouldShowUpgradePrompt = false
            }
        }
    }

    private struct ReportTarget: Identifiable { let id: String }

    // MARK: - View Mode Toggle

    private var viewModeToggle: some View {
        HStack(spacing: 4) {
            ForEach(DiscoverViewModel.ViewMode.allCases, id: \.self) { mode in
                Button {
                    withAnimation(.spring(response: 0.3)) {
                        viewModel.viewMode = mode
                    }
                } label: {
                    Image(systemName: iconForMode(mode))
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(viewModel.viewMode == mode ? .white : .primary.opacity(0.65))
                        .frame(width: 36, height: 32)
                        .background(
                            viewModel.viewMode == mode
                            ? EKKOTheme.primary
                            : Color.clear
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
        .padding(4)
        .glassBubble(cornerRadius: 12)
    }

    private func iconForMode(_ mode: DiscoverViewModel.ViewMode) -> String {
        switch mode {
        case .stack: return "square.stack.3d.up"
        case .grid: return "square.grid.2x2"
        case .history: return "clock.arrow.circlepath"
        }
    }

    // MARK: - Card Stack

    private var cardStack: some View {
        GeometryReader { geo in
            let horizontalPadding: CGFloat = 16
            let verticalPadding: CGFloat = 16
            let availableWidth = geo.size.width - horizontalPadding * 2
            let availableHeight = geo.size.height - verticalPadding * 2

            // Card is portrait 3:4.3. Fit within available space.
            let widthFromHeight = availableHeight * (3.0 / 4.3)
            let cardWidth = min(availableWidth, widthFromHeight)
            let cardHeight = cardWidth * (4.3 / 3.0)

            ZStack {
                // Undo button
                if viewModel.canUndo {
                    Button {
                        Task { await viewModel.undo() }
                    } label: {
                        Image(systemName: "arrow.uturn.backward")
                            .font(.subheadline)
                            .foregroundStyle(.primary)
                            .padding(10)
                            .glassBubble(cornerRadius: 20)
                            .shadow(radius: 4)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .padding(.leading, 16)
                    .padding(.top, 8)
                    .zIndex(20)
                    .transition(.scale.combined(with: .opacity))
                }

                // Cards (explicit size, stacked and centered)
                ForEach(Array(viewModel.visibleProfiles.enumerated().reversed()), id: \.element.id) { index, profile in
                    SwipeCard(
                        profile: profile,
                        isTop: index == 0,
                        onSwipe: { type in
                            if type == .PASS {
                                // Pass is non-destructive — recycle to bottom of the stack
                                // so the user can revisit later.
                                viewModel.recyclePass(targetUserId: profile.userId)
                            } else {
                                viewModel.advanceIndex()
                                Task {
                                    await viewModel.swipe(targetUserId: profile.userId, type: type)
                                }
                            }
                        },
                        onBlock: {
                            viewModel.advanceIndex()
                            Task {
                                try? await appState.trpc.mutate("block.block", input: ["userId": profile.userId])
                            }
                        },
                        onReport: {
                            reportTargetUserId = profile.userId
                        }
                    )
                    .frame(width: cardWidth, height: cardHeight)
                    .scaleEffect(index == 0 ? 1.0 : 0.95)
                    .offset(y: index == 0 ? 0 : 8)
                    .allowsHitTesting(index == 0)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .animation(.spring(response: 0.3), value: viewModel.canUndo)
    }

    // MARK: - Grid Mode

    private var gridMode: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                ForEach(viewModel.profiles) { profile in
                    gridCard(profile: profile)
                }
            }
            .padding(16)
        }
    }

    @ViewBuilder
    private func gridCard(profile: ConnectProfile) -> some View {
        let displayName = profile.user?.profile?.displayName ?? "Creative"
        let featuredSlot = profile.mediaSlots.first { $0.sortOrder == 0 } ?? profile.mediaSlots.first

        Button {
            Task {
                await viewModel.swipe(targetUserId: profile.userId, type: .LIKE)
            }
        } label: {
            Color.clear
                .aspectRatio(3/4, contentMode: .fit)
                .overlay {
                    ZStack(alignment: .bottom) {
                        // Image fills the cell, anything outside is clipped
                        if let slot = featuredSlot, let url = URL(string: slot.url) {
                            KFImageView(url: url)
                                .frame(maxWidth: .infinity, maxHeight: .infinity)
                                .clipped()
                        } else {
                            Rectangle()
                                .fill(Color.gray.opacity(0.15))
                        }

                        LinearGradient(
                            colors: [.clear, .black.opacity(0.7)],
                            startPoint: .center,
                            endPoint: .bottom
                        )

                        VStack(alignment: .leading, spacing: 2) {
                            Text(displayName)
                                .font(.custom(EKKOFont.regular, size: 16))
                                .foregroundStyle(.white)
                            if let headline = profile.headline {
                                Text(headline)
                                    .font(.custom(EKKOFont.regular, size: 12))
                                    .foregroundStyle(.white.opacity(0.7))
                                    .lineLimit(1)
                            }
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 16))
                .contentShape(RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
    }

    // MARK: - History Mode

    private var historyMode: some View {
        Group {
            if viewModel.isLoadingHistory && viewModel.history.isEmpty {
                loadingState
            } else if viewModel.history.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "clock.arrow.circlepath")
                        .font(.largeTitle)
                        .foregroundStyle(.secondary)
                    Text("No swipe history yet")
                        .font(.headline)
                    Text("Profiles you like or pass on will show up here.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 32)
                    Spacer()
                }
            } else {
                ScrollView {
                    LazyVGrid(
                        columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)],
                        spacing: 12
                    ) {
                        ForEach(viewModel.history) { item in
                            historyCard(item)
                                .onAppear {
                                    // Infinite scroll trigger
                                    if item.id == viewModel.history.last?.id,
                                       viewModel.historyCursor != nil,
                                       !viewModel.isLoadingHistory {
                                        Task { await viewModel.loadHistory(reset: false) }
                                    }
                                }
                        }
                    }
                    .padding(16)
                }
                .refreshable { await viewModel.loadHistory() }
            }
        }
        .task(id: viewModel.viewMode) {
            if viewModel.viewMode == .history && viewModel.history.isEmpty {
                await viewModel.loadHistory()
            }
        }
    }

    @ViewBuilder
    private func historyCard(_ item: DiscoverViewModel.HistoryItem) -> some View {
        let displayName = item.user?.profile?.displayName ?? "Creative"
        let featured = item.mediaSlots?.first { $0.sortOrder == 0 } ?? item.mediaSlots?.first
        let wasLike = item.swipeType == "LIKE"

        ZStack(alignment: .topTrailing) {
            // Photo
            ZStack(alignment: .bottom) {
                if let slot = featured, let url = URL(string: slot.url) {
                    KFImageView(url: url)
                } else {
                    Rectangle().fill(Color.gray.opacity(0.15))
                }

                LinearGradient(
                    colors: [.clear, .black.opacity(0.7)],
                    startPoint: .center,
                    endPoint: .bottom
                )

                VStack(alignment: .leading, spacing: 2) {
                    Text(displayName)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                    if let headline = item.headline {
                        Text(headline)
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.7))
                            .lineLimit(1)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
            }
            .aspectRatio(3/4, contentMode: .fill)
            .clipShape(RoundedRectangle(cornerRadius: 16))

            // LIKE / PASS badge
            Image(systemName: wasLike ? "heart.fill" : "xmark")
                .font(.caption.bold())
                .foregroundStyle(.white)
                .frame(width: 28, height: 28)
                .background(wasLike ? EKKOTheme.primary : EKKOTheme.destructive)
                .clipShape(Circle())
                .padding(8)
        }
    }

    // MARK: - States

    private var loadingState: some View {
        VStack {
            SkeletonSwipeCard()
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
        }
        .accessibilityLabel("Loading profiles")
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "safari")
                .font(.system(size: 40))
                .foregroundStyle(EKKOTheme.primary)
                .padding()
                .background(EKKOTheme.primary.opacity(0.1))
                .clipShape(Circle())

            Text("You've seen everyone")
                .font(.headline)

            Text("No new creatives right now. Try expanding your filters in Settings or check back soon.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
        .padding()
        .glassCard()
        .padding(.horizontal, 24)
    }
}

// MARK: - Kingfisher Image Helper

import Kingfisher

private struct KFImageView: View {
    let url: URL

    var body: some View {
        KFImage(url)
            .resizable()
            .scaledToFill()
    }
}
