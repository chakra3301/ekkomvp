import SwiftUI
import UIKit

/// Floating pill tab bar matching the design handoff aesthetic, used only
/// when the Japanese sub-labels toggle is on. When it's off, AppRouter
/// shows the default UIKit tab bar instead so the app keeps its native look.
///
/// System-feel polish:
///   - Single sliding accent capsule behind the row that snaps between tab
///     positions on selection (cleaner than matchedGeometryEffect, which
///     blew up the layout when the source Shape had no frame anchor).
///   - .sensoryFeedback fires a `.selection` haptic on every tab change,
///     just like UITabBar.
///   - Press scale-down via TabPressStyle.
///   - Spring animations for selection so taps feel responsive but not jumpy.
struct CustomTabBar: View {
    @Binding var selection: Int
    let unreadCount: Int

    private struct TabSpec {
        let id: Int
        let english: String
        let japanese: String
    }

    private let tabs: [TabSpec] = [
        .init(id: 0, english: "Discover", japanese: JPLabels.tabs.discover),
        .init(id: 1, english: "Likes",    japanese: JPLabels.tabs.likes),
        .init(id: 2, english: "Matches",  japanese: JPLabels.tabs.matches),
        .init(id: 3, english: "Profile",  japanese: JPLabels.tabs.profile),
    ]

    private let rowHeight: CGFloat = 44

    var body: some View {
        HStack(spacing: 0) {
            ForEach(tabs, id: \.id) { tab in
                tabButton(tab)
            }
        }
        .frame(height: rowHeight)
        .padding(.horizontal, 6)
        .padding(.vertical, 6)
        .background(.ultraThinMaterial, in: Capsule(style: .continuous))
        .overlay(
            Capsule(style: .continuous)
                .stroke(Color.white.opacity(0.15), lineWidth: 0.5)
        )
        // Sliding accent indicator behind the row — sized + positioned
        // based on the selected tab. Lives in the row's overlay so it
        // doesn't fight the labels for layout space.
        .background(alignment: .leading) {
            GeometryReader { geo in
                let slotWidth = (geo.size.width - 12) / CGFloat(tabs.count) // - horizontal padding
                Capsule(style: .continuous)
                    .fill(Color.accentColor.opacity(0.15))
                    .frame(width: slotWidth, height: rowHeight)
                    .offset(x: 6 + CGFloat(selection) * slotWidth, y: 6)
                    .animation(.spring(response: 0.32, dampingFraction: 0.78), value: selection)
            }
        }
        .shadow(color: .black.opacity(0.3), radius: 16, y: 4)
        .padding(.horizontal, 12)
        .padding(.bottom, 4)
        // Selection-style haptic on every tab change — mirrors UITabBar.
        .sensoryFeedback(.selection, trigger: selection)
    }

    private func tabButton(_ tab: TabSpec) -> some View {
        let isActive = tab.id == selection

        return Button {
            withAnimation(.spring(response: 0.32, dampingFraction: 0.78)) {
                selection = tab.id
            }
        } label: {
            VStack(spacing: 1) {
                Text(tab.japanese)
                    .font(.custom(JPFont.family, size: 9).weight(.regular))
                    .tracking(1.5)
                    .opacity(isActive ? 0.9 : 0.6)
                Text(tab.english)
                    .font(.system(size: 11, weight: isActive ? .semibold : .medium))
            }
            .foregroundStyle(isActive ? Color.accentColor : Color.secondary)
            .animation(.easeInOut(duration: 0.2), value: isActive)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
            .overlay(alignment: .topTrailing) {
                if tab.id == 2 && unreadCount > 0 {
                    Text(unreadCount > 99 ? "99+" : "\(unreadCount)")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 2)
                        .background(.red, in: Capsule())
                        .offset(x: -6, y: 2)
                        .transition(.scale.combined(with: .opacity))
                }
            }
            .animation(.spring(response: 0.3, dampingFraction: 0.7), value: unreadCount > 0)
        }
        .buttonStyle(TabPressStyle())
    }
}

/// Quick scale-down press feedback so each tap feels like a real button.
private struct TabPressStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.92 : 1.0)
            .animation(.spring(response: 0.22, dampingFraction: 0.7), value: configuration.isPressed)
    }
}
