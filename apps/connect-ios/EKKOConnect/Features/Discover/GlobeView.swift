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
                                .foregroundStyle(Color(red: 0.85, green: 0.0, blue: 1.0))
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
        case .creative: return Color(red: 0.0,  green: 1.0,  blue: 0.32)  // matrix green
        case .client:   return Color(red: 1.0,  green: 0.08, blue: 0.56)  // neon hot pink
        case .infinite: return Color(red: 0.85, green: 0.0,  blue: 1.0)   // electric magenta
        }
    }

    // MARK: - Data

    private func loadPins() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let result: GlobePinsResponse = try await appState.trpc.query("connectDiscover.getGlobalPins")
            #if DEBUG
            print("[Globe] server returned \(result.pins.count) pins")
            #endif
            if result.pins.isEmpty {
                // Dev fallback: an empty DB shouldn't mean an empty globe — seed
                // demo pins so the rendering path is verifiable without seeding
                // real ConnectProfiles with lat/lon. Stripped from release builds.
                #if DEBUG
                pins = Self.demoPins
                print("[Globe] using \(pins.count) demo pins (DEBUG fallback)")
                #else
                pins = []
                #endif
            } else {
                pins = result.pins
            }
        } catch {
            appState.showError("Couldn't load the globe — \(error.localizedDescription)")
        }
    }

    #if DEBUG
    /// Spread across major creative hubs — enough to validate the render path
    /// (tint variety, overlapping pulses, tap → preview card) without needing
    /// real data in the DB.
    private static let demoPins: [GlobePin] = [
        .demo("nyc",       40.7128,  -74.0060, "New York",      .CREATIVE, infinite: true),
        .demo("la",        34.0522, -118.2437, "Los Angeles",   .CREATIVE, infinite: false),
        .demo("london",    51.5074,   -0.1278, "London",        .CREATIVE, infinite: false),
        .demo("paris",     48.8566,    2.3522, "Paris",         .CLIENT,   infinite: false),
        .demo("berlin",    52.5200,   13.4050, "Berlin",        .CREATIVE, infinite: false),
        .demo("tokyo",     35.6762,  139.6503, "Tokyo",         .CREATIVE, infinite: true),
        .demo("seoul",     37.5665,  126.9780, "Seoul",         .CREATIVE, infinite: false),
        .demo("shanghai",  31.2304,  121.4737, "Shanghai",      .CLIENT,   infinite: false),
        .demo("mumbai",    19.0760,   72.8777, "Mumbai",        .CREATIVE, infinite: false),
        .demo("dubai",     25.2048,   55.2708, "Dubai",         .CLIENT,   infinite: true),
        .demo("sf",        37.7749, -122.4194, "San Francisco", .CLIENT,   infinite: false),
        .demo("chicago",   41.8781,  -87.6298, "Chicago",       .CREATIVE, infinite: false),
        .demo("toronto",   43.6532,  -79.3832, "Toronto",       .CREATIVE, infinite: false),
        .demo("mexico",    19.4326,  -99.1332, "Mexico City",   .CREATIVE, infinite: false),
        .demo("sao",      -23.5505,  -46.6333, "São Paulo",     .CREATIVE, infinite: true),
        .demo("ba",       -34.6037,  -58.3816, "Buenos Aires",  .CREATIVE, infinite: false),
        .demo("lagos",      6.5244,    3.3792, "Lagos",         .CREATIVE, infinite: false),
        .demo("cairo",     30.0444,   31.2357, "Cairo",         .CREATIVE, infinite: false),
        .demo("nairobi",   -1.2921,   36.8219, "Nairobi",       .CREATIVE, infinite: false),
        .demo("joburg",   -26.2041,   28.0473, "Johannesburg",  .CLIENT,   infinite: false),
        .demo("sydney",   -33.8688,  151.2093, "Sydney",        .CREATIVE, infinite: true),
        .demo("melbourne",-37.8136,  144.9631, "Melbourne",     .CREATIVE, infinite: false),
        .demo("singapore",  1.3521,  103.8198, "Singapore",     .CLIENT,   infinite: false),
        .demo("bangkok",   13.7563,  100.5018, "Bangkok",       .CREATIVE, infinite: false),
        .demo("istanbul",  41.0082,   28.9784, "Istanbul",      .CREATIVE, infinite: false),
        .demo("madrid",    40.4168,   -3.7038, "Madrid",        .CREATIVE, infinite: false),
        .demo("amsterdam", 52.3676,    4.9041, "Amsterdam",     .CREATIVE, infinite: true),
        .demo("stockholm", 59.3293,   18.0686, "Stockholm",     .CREATIVE, infinite: false),
        .demo("moscow",    55.7558,   37.6173, "Moscow",        .CLIENT,   infinite: false),
        .demo("hk",        22.3193,  114.1694, "Hong Kong",     .CLIENT,   infinite: true),
    ]
    #endif
}

#if DEBUG
private extension GlobePin {
    static func demo(_ id: String, _ lat: Double, _ lon: Double, _ city: String, _ role: UserRole, infinite: Bool) -> GlobePin {
        GlobePin(
            userId: "demo-\(id)",
            lat: lat,
            lon: lon,
            city: city,
            role: role,
            isInfinite: infinite,
            displayName: city,
            avatarUrl: nil,
            username: id
        )
    }
}
#endif
