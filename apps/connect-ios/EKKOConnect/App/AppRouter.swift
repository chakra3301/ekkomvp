import SwiftUI

/// Root view that decides whether to show auth flow or main tab view.
struct AppRouter: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        ZStack {
            // Mesh background for authenticated states. The loading splash is
            // a fullscreen video that paints its own background.
            if appState.isAuthenticated && !appState.isLoading {
                MeshBackground()
            }

            Group {
                if appState.isLoading {
                    LoadingScreenVideo()
                } else if !appState.isAuthenticated {
                    AuthFlowView()
                } else if appState.needsInviteGate {
                    // Invite gate: blocks everything beyond auth until the user
                    // redeems an invite or has an approved signup application.
                    InviteGateView()
                } else if appState.currentProfile == nil {
                    // Step 1: Name, DOB, role
                    CompleteProfileView()
                } else if appState.hasCheckedConnectProfile && appState.currentConnectProfile == nil {
                    // First-run signup, post-CompleteProfileView, pre-ConnectProfile.
                    // Walks: Theme picker → Avatar picker → ProfileSetupView.
                    if appState.needsThemePick {
                        ThemePickerView()
                    } else if appState.needsAvatar {
                        AvatarPickerView()
                    } else {
                        // Final step: bio/prompts/media. Wrap in a NavigationStack
                        // so ProfileSetupView's toolbar works.
                        NavigationStack {
                            ProfileSetupView()
                        }
                    }
                } else {
                    MainTabView()
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: appState.isLoading)
        .animation(.easeInOut(duration: 0.3), value: appState.isAuthenticated)
        .overlay(alignment: .top) {
            ToastHost()
        }
        .overlay(alignment: .top) {
            MessageBannerHost()
        }
    }
}

/// Auth navigation stack — uses the same dotted ambient background that
/// drives Discover/Profile, so sign in and sign up sit on the canonical
/// EKKO backdrop and adapt to light/dark.
struct AuthFlowView: View {
    var body: some View {
        NavigationStack {
            LoginView()
                .scrollContentBackground(.hidden)
                .background {
                    AuthDottedBackground()
                }
                .toolbarBackground(.hidden, for: .navigationBar)
        }
    }
}

/// Main app with bottom tab bar
struct MainTabView: View {
    @Environment(AppState.self) private var appState

    init() {
        // Translucent tab bar — system blur material that lets mesh background show through
        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithDefaultBackground()
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance

        // Translucent navigation bar
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithDefaultBackground()
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
    }

    @State private var unreadRefreshTimer: Timer?
    @State private var showWelcome = false
    @AppStorage(JPSettings.storageKey) private var showJapanese = JPSettings.defaultValue

    var body: some View {
        @Bindable var state = appState
        // When JP is on we hide the system tab bar and overlay a custom
        // floating-pill tab bar that shows JP+EN labels (no icons). When
        // JP is off we let the standard UIKit tab bar render — that's the
        // app's normal look.
        // `.toolbar(.hidden, for: .tabBar)` only takes effect when applied
        // INSIDE a tab's content (not on the TabView itself), so each
        // NavigationStack wears the modifier directly.
        let tabBarVisibility: Visibility = showJapanese ? .hidden : .visible

        ZStack(alignment: .bottom) {
            TabView(selection: $state.selectedTab) {
                NavigationStack {
                    DiscoverView()
                        .toolbar(tabBarVisibility, for: .tabBar)
                }
                .tabItem {
                    Label("Discover", systemImage: "safari")
                }
                .tag(0)

                NavigationStack {
                    LikesView()
                        .toolbar(tabBarVisibility, for: .tabBar)
                }
                .tabItem {
                    Label("Likes", systemImage: "heart")
                }
                .tag(1)

                NavigationStack {
                    MatchesView()
                        .toolbar(tabBarVisibility, for: .tabBar)
                }
                .tabItem {
                    Label("Matches", systemImage: "message")
                }
                .badge(showJapanese ? 0 : appState.totalUnreadCount)
                .tag(2)

                NavigationStack {
                    ProfileView()
                        .toolbar(tabBarVisibility, for: .tabBar)
                }
                .tabItem {
                    Label("Profile", systemImage: "person")
                }
                .tag(3)
            }

            if showJapanese {
                CustomTabBar(
                    selection: $state.selectedTab,
                    unreadCount: appState.totalUnreadCount
                )
            }
        }
        .task {
            // Initial load + periodic refresh of unread counts
            await appState.refreshUnreadCounts()
            unreadRefreshTimer?.invalidate()
            unreadRefreshTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
                Task { await appState.refreshUnreadCounts() }
            }

            // First-run hand-off from ProfileSetupView: land on the Profile
            // tab so ProfileView can flip into edit mode and arm tips.
            if appState.pendingFirstProfileEdit {
                appState.selectedTab = 3
            }

            // Welcome sheet: show only after the first-edit handoff has
            // fully resolved (tips seen) so it doesn't compete with the
            // edit-mode coach marks.
            await maybeShowWelcomeAfterDelay()
        }
        .onChange(of: appState.pendingFirstProfileEdit) { _, isPending in
            // ProfileView clears this AFTER the first edit-mode session ends
            // (save or cancel). At that point the editor coach marks have
            // already had their turn, so the welcome sheet can fire.
            if !isPending {
                Task { await maybeShowWelcomeAfterDelay() }
            }
        }
        .sheet(isPresented: $showWelcome) {
            WelcomeSheet()
        }
        .onDisappear {
            unreadRefreshTimer?.invalidate()
            unreadRefreshTimer = nil
        }
        .onChange(of: appState.selectedTab) { _, _ in
            // Refresh when user pokes the tab bar
            Task { await appState.refreshUnreadCounts() }
        }
    }

    /// Shows the WelcomeSheet once, deferred while the first-run profile-edit
    /// handoff is in flight so it doesn't compete with the editor coach marks.
    private func maybeShowWelcomeAfterDelay() async {
        guard !OnboardingTracker.hasSeenWelcome else { return }
        guard !appState.pendingFirstProfileEdit else { return }
        try? await Task.sleep(for: .milliseconds(600))
        showWelcome = true
    }
}
