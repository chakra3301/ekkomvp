import SwiftUI

/// The "global view" of Discover — a 3D wireframe globe with a pulsing pin
/// per user. Only shown to Infinite-tier users who have enabled global search.
///
/// Tapping a pin reveals a mini preview card. Swiping down dismisses it,
/// tapping the card itself "expands" into the swipe queue for that user's
/// city, so the user can keep discovering creatives in that area.
struct GlobeView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.colorScheme) private var colorScheme
    @State private var pins: [GlobePin] = []
    @State private var isLoading = true
    @State private var selectedPin: GlobePin?
    @State private var selectedZoom: GlobeSceneView.ZoomLevel = .close
    @State private var previewOffset: CGFloat = 0

    var onExpand: (GlobePin, GlobeSceneView.ZoomLevel) -> Void

    var body: some View {
        ZStack {
            // Fallback background behind SceneKit for safety on load — matches
            // the palette so there's no flash of the opposite scheme's color.
            (colorScheme == .dark ? Color.black : Color(red: 0.98, green: 0.98, blue: 1.0))
                .ignoresSafeArea()

            GlobeSceneView(pins: pins, scheme: colorScheme) { pin, zoom in
                withAnimation(.spring(response: 0.35, dampingFraction: 0.85)) {
                    selectedPin = pin
                    selectedZoom = zoom
                    previewOffset = 0
                }
            }
            .ignoresSafeArea(edges: [.bottom, .horizontal])

            // Subtle vignette so pins on the silhouette edges don't wash out.
            // Dark-mode darkens the rim; light-mode lightens it — same intent,
            // opposite direction.
            RadialGradient(
                colors: [
                    .clear,
                    (colorScheme == .dark ? Color.black : Color.white).opacity(0.55)
                ],
                center: .center,
                startRadius: 180,
                endRadius: 520
            )
            .allowsHitTesting(false)
            .ignoresSafeArea()

            // Loading indicator (top-trailing)
            if isLoading {
                VStack {
                    HStack {
                        Spacer()
                        ProgressView()
                            .padding(10)
                            .background(.ultraThinMaterial, in: Capsule())
                    }
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.top, 4)
            }

            // Mini preview card
            if let pin = selectedPin {
                VStack {
                    Spacer()
                    previewCard(for: pin)
                        .padding(.horizontal, 16)
                        .padding(.bottom, 24)
                        .offset(y: previewOffset)
                        .gesture(
                            DragGesture()
                                .onChanged { value in
                                    previewOffset = max(0, value.translation.height)
                                }
                                .onEnded { value in
                                    if value.translation.height > 80 {
                                        withAnimation(.easeOut(duration: 0.2)) {
                                            previewOffset = 400
                                        }
                                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                                            selectedPin = nil
                                            previewOffset = 0
                                        }
                                    } else {
                                        withAnimation(.spring()) { previewOffset = 0 }
                                    }
                                }
                        )
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
        .task { await loadPins() }
    }

    // MARK: - Preview Card

    @ViewBuilder
    private func previewCard(for pin: GlobePin) -> some View {
        Button {
            onExpand(pin, selectedZoom)
            selectedPin = nil
        } label: {
            HStack(spacing: 12) {
                AvatarView(
                    url: pin.avatarUrl,
                    name: pin.displayName ?? "?",
                    size: 52
                )
                .overlay(
                    Circle().stroke(accentColor(for: pin), lineWidth: 2)
                )
                .shadow(color: accentColor(for: pin).opacity(0.55), radius: 10)

                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(pin.displayName ?? "Creative")
                            .font(.custom(EKKOFont.regular, size: 17))
                            .foregroundStyle(.primary)
                        if pin.isInfinite {
                            Text("∞")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Color(red: 0.73, green: 0.38, blue: 1.0))
                        }
                    }
                    Text(pin.city ?? "Somewhere on Earth")
                        .font(.custom(EKKOFont.regular, size: 13))
                        .foregroundStyle(.secondary)
                    Text(selectedZoom == .close ? "Swipe creatives in this city ↑" : "Swipe creatives in this region ↑")
                        .font(.custom(EKKOFont.regular, size: 11))
                        .foregroundStyle(accentColor(for: pin).opacity(0.9))
                        .padding(.top, 2)
                }

                Spacer()

                Image(systemName: "chevron.up")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(accentColor(for: pin).opacity(0.35), lineWidth: 1)
                    )
            )
            .shadow(color: .black.opacity(0.4), radius: 20, y: 8)
        }
        .buttonStyle(.plain)
    }

    private func accentColor(for pin: GlobePin) -> Color {
        switch pin.tint {
        case .creative: return Color(red: 0.20, green: 1.0, blue: 0.55)
        case .client:   return Color(red: 1.0, green: 0.25, blue: 0.35)
        case .infinite: return Color(red: 0.73, green: 0.38, blue: 1.0)
        }
    }

    // MARK: - Data

    private func loadPins() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let result: GlobePinsResponse = try await appState.trpc.query("connectDiscover.getGlobalPins")
            pins = result.pins
        } catch {
            appState.showError("Couldn't load the globe — \(error.localizedDescription)")
        }
    }
}
