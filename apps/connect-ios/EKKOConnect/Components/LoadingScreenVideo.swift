import SwiftUI
import AVKit
import AVFoundation

// MARK: - LoadingScreenVideo

/// In-app splash shown while AppState restores the auth session.
struct LoadingScreenVideo: View {
    var body: some View {
        LoopingVideo(resource: "LoadingScreen", ext: "mp4")
            .ignoresSafeArea()
    }
}

// MARK: - AmbientBackground

/// Slowly-drifting ambient backdrop for Discover and Profile. Picks the
/// dark or light variant of the user's selected style based on the current
/// color scheme. The video pauses when the app backgrounds to avoid
/// draining battery in-pocket. Renders nothing when the user has turned
/// the ambient background off in Settings.
struct AmbientBackground: View {
    @AppStorage(AmbientSettings.enabledKey) private var enabled = AmbientSettings.defaultEnabled
    @AppStorage(AmbientSettings.styleKey) private var styleRaw = AmbientBackgroundStyle.defaultStyle.rawValue
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        if enabled {
            let style = AmbientBackgroundStyle(rawValue: styleRaw) ?? .defaultStyle
            let resource = colorScheme == .dark ? style.darkResource : style.lightResource
            LoopingVideo(resource: resource, ext: "mp4")
                // Force a fresh AVPlayer when the user toggles light/dark
                // or picks a different style.
                .id(resource)
                .ignoresSafeArea()
        }
    }
}

// MARK: - Background styles
//
// Each style ships a dark + light mp4 in Resources/. To add a new style:
//   1. Drop two HEVC mp4s into EKKOConnect/Resources/ named matching the
//      `darkResource` / `lightResource` strings below.
//   2. Add a new case to this enum with its display name and resource names.
//   3. Run `xcodegen generate` so the bundle picks up the files.
// The Settings picker iterates `allCases`, so new styles appear automatically.

enum AmbientBackgroundStyle: String, CaseIterable, Identifiable {
    case dotted = "DOTTED"
    case wavy   = "WAVY"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .dotted: return "Dotted"
        case .wavy:   return "Wavy"
        }
    }

    var darkResource: String {
        switch self {
        case .dotted: return "AmbientBackgroundDark"
        case .wavy:   return "AmbientWavyDark"
        }
    }

    var lightResource: String {
        switch self {
        case .dotted: return "AmbientBackgroundLight"
        case .wavy:   return "AmbientWavyLight"
        }
    }

    static var defaultStyle: Self { .dotted }
}

enum AmbientSettings {
    static let enabledKey = "ambientBackgroundEnabled"
    static let styleKey = "ambientBackgroundStyle"
    static let defaultEnabled = true
}

// MARK: - Settings UI
//
// Drop into any Form section. Hides the style picker when the toggle is off
// so the row count collapses cleanly.

struct AmbientBackgroundSettings: View {
    @AppStorage(AmbientSettings.enabledKey) private var enabled = AmbientSettings.defaultEnabled
    @AppStorage(AmbientSettings.styleKey) private var styleRaw = AmbientBackgroundStyle.defaultStyle.rawValue

    var body: some View {
        Toggle(isOn: $enabled) {
            HStack(spacing: 8) {
                Image(systemName: "sparkles")
                    .foregroundStyle(.secondary)
                Text("Animated background")
                    .font(.subheadline)
            }
        }
        .tint(Color.accentColor)

        if enabled {
            Picker(selection: $styleRaw) {
                ForEach(AmbientBackgroundStyle.allCases) { style in
                    Text(style.displayName).tag(style.rawValue)
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: "rectangle.stack")
                        .foregroundStyle(.secondary)
                    Text("Style")
                        .font(.subheadline)
                }
            }
        }
    }
}

// MARK: - LoopingVideo

/// AVPlayerLayer-backed view that plays a bundled mp4 muted, on loop, with
/// `.resizeAspectFill`. Pauses on app background and resumes on foreground.
private struct LoopingVideo: UIViewRepresentable {
    let resource: String
    let ext: String

    func makeUIView(context: Context) -> PlayerView {
        let view = PlayerView()
        guard let url = Bundle.main.url(forResource: resource, withExtension: ext) else {
            return view
        }

        // Mixes with other audio sessions (and stays silent regardless), so
        // launching the app never interrupts music the user is playing.
        try? AVAudioSession.sharedInstance().setCategory(.ambient, mode: .default, options: [.mixWithOthers])

        let player = AVPlayer(url: url)
        player.isMuted = true
        player.actionAtItemEnd = .none
        view.playerLayer.player = player
        view.playerLayer.videoGravity = .resizeAspectFill
        context.coordinator.player = player

        // Loop without a gap by seeking to zero on each end-of-item.
        let loopObs = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: player.currentItem,
            queue: .main
        ) { _ in
            player.seek(to: .zero)
            player.play()
        }
        context.coordinator.observers.append(loopObs)

        // Pause when the app leaves the foreground; resume on return. Saves
        // battery during multitask without re-decoding the asset every time.
        let bgObs = NotificationCenter.default.addObserver(
            forName: UIApplication.didEnterBackgroundNotification,
            object: nil,
            queue: .main
        ) { _ in player.pause() }
        let fgObs = NotificationCenter.default.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { _ in player.play() }
        context.coordinator.observers.append(contentsOf: [bgObs, fgObs])

        player.play()
        return view
    }

    func updateUIView(_ uiView: PlayerView, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator() }

    final class Coordinator {
        var player: AVPlayer?
        var observers: [NSObjectProtocol] = []
        deinit {
            observers.forEach { NotificationCenter.default.removeObserver($0) }
        }
    }
}

private final class PlayerView: UIView {
    override static var layerClass: AnyClass { AVPlayerLayer.self }
    var playerLayer: AVPlayerLayer { layer as! AVPlayerLayer }
}
