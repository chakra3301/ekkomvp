import SwiftUI

struct DiscoverView: View {
    @Environment(AppState.self) private var appState
    @State private var viewModel = DiscoverViewModel()
    @State private var reportTargetUserId: String?
    @State private var showUpgradeSheet = false
    @State private var locating = false
    @Environment(PurchaseManager.self) private var purchaseManager

    /// The app requires an actual device location before it'll load the stack.
    /// Infinite users can bypass this via a custom city override or global
    /// search — they're discovering outside their physical location by design.
    private var needsLocation: Bool {
        let hasLocation = appState.currentConnectProfile?.latitude != nil
        if hasLocation { return false }
        let isInfinite = appState.hasInfiniteAccess
        let filters = appState.discoveryFilters
        let hasInfiniteOverride = isInfinite && (filters.globalSearch || !filters.city.isEmpty)
        return !hasInfiniteOverride
    }

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
                    if viewModel.viewMode == .globe {
                        // Globe fetches its own data — skip the location gate and swipe-queue loader.
                        globeMode
                    } else if needsLocation {
                        locationGate
                    } else if viewModel.isLoading {
                        loadingState
                    } else if viewModel.visibleProfiles.isEmpty && viewModel.viewMode == .stack {
                        emptyState
                    } else {
                        switch viewModel.viewMode {
                        case .stack:
                            cardStack
                        case .grid:
                            gridMode
                        case .globe:
                            EmptyView() // handled above
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
        .furiganaTitle("Discover", JPLabels.screens.discover)
        .task {
            viewModel.setup(trpc: appState.trpc, appState: appState)
            await viewModel.loadQueue()
        }
        .onChange(of: appState.discoveryFilters) { _, _ in
            // If the user disables global search (or loses Infinite access)
            // while on globe mode, drop back to the stack so they don't end
            // up stranded on a feature they can't access.
            let globeEligible = appState.hasInfiniteAccess && appState.discoveryFilters.globalSearch
            if viewModel.viewMode == .globe && !globeEligible {
                viewModel.viewMode = .stack
            }
            Task { await viewModel.loadQueue() }
        }
        .sheet(item: Binding(
            get: { reportTargetUserId.map { ReportTarget(id: $0) } },
            set: { reportTargetUserId = $0?.id }
        )) { target in
            ReportSheet(targetType: .USER, targetId: target.id) {
                // After report submitted, drop this profile from the stack.
                viewModel.removeProfile(userId: target.id)
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

    /// Globe mode is an Infinite-tier perk that only makes sense when the
    /// user has opted into global search. Hide it otherwise so the toggle
    /// doesn't advertise a button that will fall back to an empty view.
    private var availableModes: [DiscoverViewModel.ViewMode] {
        let globeEligible = appState.hasInfiniteAccess && appState.discoveryFilters.globalSearch
        return DiscoverViewModel.ViewMode.allCases.filter { mode in
            mode != .globe || globeEligible
        }
    }

    private var viewModeToggle: some View {
        HStack(spacing: 4) {
            ForEach(availableModes, id: \.self) { mode in
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
                            ? Color.accentColor
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
        case .globe: return "globe"
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
                                // Like is destructive — drop from the stack now so the
                                // same card can't be swiped twice while the backend
                                // call (and optional match celebration) resolves.
                                // Capture profile before removal so the ViewModel
                                // can show the match celebration.
                                let snapshot = profile
                                viewModel.removeProfile(userId: profile.userId)
                                Task {
                                    await viewModel.swipe(profile: snapshot, type: type)
                                }
                            }
                        },
                        onBlock: {
                            viewModel.removeProfile(userId: profile.userId)
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
            let snapshot = profile
            viewModel.removeProfile(userId: profile.userId)
            Task {
                await viewModel.swipe(profile: snapshot, type: .LIKE)
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

    // MARK: - Globe Mode

    private var globeMode: some View {
        GlobeView { pin, zoom in
            // Expanding a pin filters the swipe queue and flips back to the
            // stack. Zoom level decides scope: close → the pin's exact city;
            // far → a broad radius around the pin's coords (region/country).
            var filters = appState.discoveryFilters
            filters.globalSearch = false

            switch zoom {
            case .close:
                // City-level filter. Use the city string, clear any geo override.
                filters.city = pin.city ?? ""
                filters.overrideLatitude = nil
                filters.overrideLongitude = nil
                filters.overrideMaxDistanceMiles = nil
            case .far:
                // Country/region-level — use pin coords with a wide radius.
                // 500 miles ≈ roughly the radius of a mid-sized country
                // (big enough to sweep Germany/France/etc., small enough to
                // not span continents).
                filters.city = ""
                filters.overrideLatitude = pin.lat
                filters.overrideLongitude = pin.lon
                filters.overrideMaxDistanceMiles = 500
            }

            appState.discoveryFilters = filters
            withAnimation(.spring(response: 0.35)) {
                viewModel.viewMode = .stack
            }
        }
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
                .background(wasLike ? Color.accentColor : EKKOTheme.destructive)
                .clipShape(Circle())
                .padding(8)
        }
    }

    // MARK: - States

    private var locationGate: some View {
        VStack(spacing: 16) {
            Spacer()
            Image(systemName: "location.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.accentColor)

            Text("Turn On Location")
                .font(.headline)

            Text("EKKO Connect matches you with nearby creatives. Enable location so we can find them.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Button {
                Task { await enableLocation() }
            } label: {
                Label(locating ? "Locating…" : "Use My Location", systemImage: "location.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 12)
                    .background(Color.accentColor)
                    .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius))
            }
            .disabled(locating)
            .padding(.top, 4)
            Spacer()
        }
        .padding()
        .glassCard()
        .padding(.horizontal, 24)
    }

    private func enableLocation() async {
        locating = true
        defer { locating = false }
        do {
            let manager = LocationManager()
            let result = try await manager.getCurrentLocation()
            struct LocationInput: Codable {
                let location: String?
                let latitude: Double
                let longitude: Double
            }
            let profile: ConnectProfile = try await appState.trpc.mutate(
                "connectProfile.update",
                input: LocationInput(
                    location: result.city,
                    latitude: result.latitude,
                    longitude: result.longitude
                )
            )
            appState.currentConnectProfile = profile
            await viewModel.loadQueue()
        } catch {
            appState.showError(error.localizedDescription)
        }
    }

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
                .foregroundStyle(Color.accentColor)
                .padding()
                .background(Color.accentColor.opacity(0.1))
                .clipShape(Circle())

            Text("You've seen everyone")
                .font(.headline)

            Text("No new creatives right now. Try expanding your filters in Settings or check back soon.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Button {
                Task { await viewModel.loadQueue() }
            } label: {
                Label("Refresh", systemImage: "arrow.clockwise")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 10)
                    .background(Color.accentColor)
                    .clipShape(RoundedRectangle(cornerRadius: EKKOTheme.buttonRadius))
            }
            .padding(.top, 4)
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
