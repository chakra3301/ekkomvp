import SwiftUI

/// Root view that decides whether to show auth flow or main tab view.
struct AppRouter: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        ZStack {
            // Mesh background for authenticated/loading states
            if appState.isAuthenticated || appState.isLoading {
                MeshBackground()
            }

            Group {
                if appState.isLoading {
                    VStack(spacing: 12) {
                        Image(systemName: "eye.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(EKKOTheme.primary)
                        Text("EKKO Connect")
                            .font(.title2.bold())
                    }
                } else if !appState.isAuthenticated {
                    AuthFlowView()
                } else if appState.currentProfile == nil {
                    // Step 1: Name, DOB, role
                    CompleteProfileView()
                } else if appState.hasCheckedConnectProfile && appState.currentConnectProfile == nil {
                    // Step 2: Media, prompts, details — required before accessing app features.
                    // Wrap in a NavigationStack so ProfileSetupView's toolbar works.
                    NavigationStack {
                        ProfileSetupView()
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
    }
}

/// Auth navigation stack with sign-in background image
struct AuthFlowView: View {
    var body: some View {
        NavigationStack {
            LoginView()
                .scrollContentBackground(.hidden)
                .background {
                    Image("SignInBackground")
                        .resizable()
                        .scaledToFill()
                        .ignoresSafeArea()
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
            .tint(EKKOTheme.primary)

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
            // Show welcome sheet once, right after the user first reaches the main app
            if !OnboardingTracker.hasSeenWelcome {
                try? await Task.sleep(for: .milliseconds(600))
                showWelcome = true
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
}
