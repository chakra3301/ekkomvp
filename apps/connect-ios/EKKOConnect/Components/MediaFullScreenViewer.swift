import SwiftUI
import AVKit
import Kingfisher

/// Wrapper so a `MediaSlot` can drive `.fullScreenCover(item:)`. We stamp
/// each presentation with a fresh UUID so the viewer reliably re-presents
/// even when the same slot is opened twice in a row.
struct PresentedMedia: Identifiable {
    let id = UUID()
    let slot: MediaSlot
    let displayTitle: String
}

/// Black, full-bleed viewer for a single MediaSlot. Used by templates
/// (Stack today) when the user asks to "open" a piece of work.
///
/// - Photo  → KFImage, fit to screen, double-tap to zoom toggle
/// - Video  → AVKit VideoPlayer with native controls + sound
/// - 3D     → ModelViewerView (already interactive via WKWebView)
/// - Audio  → Centered tap-to-play control with title underneath
struct MediaFullScreenViewer: View {
    let slot: MediaSlot
    let displayTitle: String

    @Environment(\.dismiss) private var dismiss
    @State private var photoZoomed = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            mediaContent
                .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Top + bottom chrome over the media.
            VStack(spacing: 0) {
                topBar
                Spacer()
                if !displayTitle.isEmpty {
                    bottomCaption
                }
            }
        }
        .preferredColorScheme(.dark)
        .statusBarHidden(true)
    }

    // MARK: - Chrome

    private var topBar: some View {
        HStack {
            Text(metaLine)
                .font(.system(size: 11, weight: .semibold))
                .tracking(1.5)
                .foregroundStyle(.white.opacity(0.7))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(.ultraThinMaterial, in: Capsule())

            Spacer()

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 36, height: 36)
                    .background(.ultraThinMaterial, in: Circle())
            }
        }
        .padding(.horizontal, 16)
        .padding(.top, 12)
    }

    private var bottomCaption: some View {
        VStack(alignment: .leading, spacing: 4) {
            Spacer().frame(height: 80) // gradient run-up
            Text(displayTitle)
                .font(.custom(EKKOFont.regular, size: 24))
                .foregroundStyle(.white)
                .lineLimit(3)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
        }
        .background(
            LinearGradient(
                colors: [.clear, .black.opacity(0.85)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
        .allowsHitTesting(false)
    }

    private var metaLine: String {
        let kind: String
        if slot.isAudio { kind = "AUDIO" }
        else if slot.isModel { kind = "3D" }
        else if slot.isVideo { kind = "VIDEO" }
        else { kind = "PHOTO" }
        return "\(kind)  ·  № \(String(format: "%02d", slot.sortOrder + 1))"
    }

    // MARK: - Media

    @ViewBuilder
    private var mediaContent: some View {
        if slot.isAudio {
            FullscreenAudioPlayer(urlString: slot.url)
        } else if slot.isModel {
            ModelViewerView(urlString: slot.url)
        } else if slot.isVideo {
            // Autoplays + native controls, audio enabled.
            AutoplayFullscreenVideoPlayer(urlString: slot.url)
        } else if let url = URL(string: slot.url) {
            KFImage(url)
                .resizable()
                .scaledToFit()
                .scaleEffect(photoZoomed ? 1.6 : 1.0)
                .animation(.spring(response: 0.4, dampingFraction: 0.8), value: photoZoomed)
                .onTapGesture(count: 2) {
                    photoZoomed.toggle()
                }
        } else {
            // Unknown URL fallback.
            Image(systemName: "questionmark.square")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Autoplay video for the fullscreen viewer
//
// Wraps AVKit's VideoPlayer with an AVPlayer that .play()s on appear and
// pauses on disappear so audio doesn't leak when the user dismisses.

private struct AutoplayFullscreenVideoPlayer: View {
    let urlString: String
    @State private var player: AVPlayer?

    var body: some View {
        Group {
            if let player {
                VideoPlayer(player: player)
            } else {
                Color.black
            }
        }
        .onAppear {
            guard player == nil, let url = URL(string: urlString) else { return }
            let p = AVPlayer(url: url)
            p.isMuted = false
            self.player = p
            p.play()
        }
        .onDisappear {
            player?.pause()
        }
    }
}

// MARK: - Fullscreen audio player with visualizer
//
// Tap-to-play big circular control + animated waveform bars below. The
// visualizer is synthetic (overlapping sines) — looks alive without
// needing real-time FFT. AVPlayer handles the actual audio playback so
// remote URLs work the same as local files.

private struct FullscreenAudioPlayer: View {
    let urlString: String

    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var loopObserver: NSObjectProtocol?

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            AudioVisualizer(isPlaying: isPlaying, accent: EKKOTheme.primary)
                .frame(height: 140)
                .padding(.horizontal, 32)

            Button {
                togglePlayback()
            } label: {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 96, weight: .regular))
                    .foregroundStyle(.white)
                    .shadow(color: EKKOTheme.primary.opacity(0.5), radius: 24)
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onDisappear {
            player?.pause()
            isPlaying = false
            if let loopObserver {
                NotificationCenter.default.removeObserver(loopObserver)
                self.loopObserver = nil
            }
        }
    }

    private func togglePlayback() {
        if player == nil, let url = URL(string: urlString) {
            let item = AVPlayerItem(url: url)
            let p = AVPlayer(playerItem: item)
            player = p
            loopObserver = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemDidPlayToEndTime,
                object: item,
                queue: .main
            ) { [weak p] _ in
                p?.seek(to: .zero)
                p?.play()
            }
        }
        if isPlaying {
            player?.pause()
        } else {
            player?.play()
        }
        isPlaying.toggle()
    }
}

// MARK: - Audio visualizer
//
// 32 bars driven by a sum of three sines so the motion feels organic.
// `phase` advances on a Timer when playing; bars settle to a base height
// when paused. Not real audio analysis — for that we'd need AVAudioEngine
// + an installTap with FFT, which is heavier than the visual return.

private struct AudioVisualizer: View {
    let isPlaying: Bool
    let accent: Color

    private let barCount = 32
    private let baseHeight: CGFloat = 14
    private let maxAdd: CGFloat = 110

    @State private var phase: Double = 0

    private let timer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()

    var body: some View {
        GeometryReader { geo in
            let totalGap: CGFloat = CGFloat(barCount - 1) * 4
            let barWidth = max(2, (geo.size.width - totalGap) / CGFloat(barCount))

            HStack(alignment: .center, spacing: 4) {
                ForEach(0..<barCount, id: \.self) { i in
                    Capsule(style: .continuous)
                        .fill(accent)
                        .frame(width: barWidth, height: barHeight(for: i))
                        .opacity(0.85)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
        }
        .onReceive(timer) { _ in
            if isPlaying {
                withAnimation(.easeInOut(duration: 0.06)) {
                    phase += 0.22
                }
            } else if phase != 0 {
                withAnimation(.easeOut(duration: 0.4)) {
                    // Drift back to a still state when paused.
                    phase = 0
                }
            }
        }
    }

    private func barHeight(for index: Int) -> CGFloat {
        let position = Double(index) / Double(barCount)
        let wave1 = sin(phase + position * 6.28)
        let wave2 = sin(phase * 1.4 + position * 12)
        let wave3 = sin(phase * 0.7 + position * 4)
        let combined = (wave1 + wave2 * 0.6 + wave3 * 0.8) / 2.4
        let normalized = (combined + 1) / 2 // 0 — 1
        let active = baseHeight + CGFloat(normalized) * maxAdd
        return isPlaying ? active : baseHeight
    }
}
