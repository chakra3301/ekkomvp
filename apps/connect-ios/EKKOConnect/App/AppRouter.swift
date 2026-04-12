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
                    CompleteProfileView()
                } else {
                    MainTabView()
                }
            }
        }
        .animation(.easeInOut(duration: 0.3), value: appState.isLoading)
        .animation(.easeInOut(duration: 0.3), value: appState.isAuthenticated)
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
    @State private var selectedTab = 0

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

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DiscoverView()
            }
            .tabItem {
                Label("Discover", systemImage: "safari")
            }
            .tag(0)

            NavigationStack {
                LikesView()
            }
            .tabItem {
                Label("Likes", systemImage: "heart")
            }
            .tag(1)

            NavigationStack {
                MatchesView()
            }
            .tabItem {
                Label("Matches", systemImage: "message")
            }
            .tag(2)

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person")
            }
            .tag(3)
        }
        .tint(EKKOTheme.primary)
    }
}
