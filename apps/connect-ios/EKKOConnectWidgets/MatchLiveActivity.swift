import ActivityKit
import SwiftUI
import WidgetKit

// Lock-screen + Dynamic Island presentation of the "New match" Live Activity.
// Tapping any surface deep-links into `ekkoconnect://match/<matchId>`, which
// AppRouter resolves into the chat thread.

struct MatchLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MatchActivityAttributes.self) { context in
            // Lock screen / banner
            LockScreenView(
                attributes: context.attributes,
                state: context.state
            )
            .activityBackgroundTint(.black.opacity(0.85))
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded
                DynamicIslandExpandedRegion(.leading) {
                    AvatarChip(
                        name: context.attributes.otherDisplayName,
                        urlString: context.attributes.otherAvatarUrl
                    )
                }
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(context.attributes.otherDisplayName)
                            .font(.footnote.weight(.semibold))
                            .lineLimit(1)
                            .foregroundStyle(.white)
                        Text(relative(context.state.updatedAt))
                            .font(.caption2)
                            .foregroundStyle(.white.opacity(0.6))
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack(spacing: 8) {
                        SparkleGlyph()
                            .frame(width: 14, height: 14)
                        Text(context.state.headline)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.white)
                            .lineLimit(2)
                        Spacer(minLength: 0)
                    }
                }
            } compactLeading: {
                SparkleGlyph()
                    .frame(width: 16, height: 16)
                    .foregroundStyle(MatchPalette.green)
            } compactTrailing: {
                Text(initials(of: context.attributes.otherDisplayName))
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 6)
            } minimal: {
                SparkleGlyph()
                    .foregroundStyle(MatchPalette.green)
            }
            .widgetURL(URL(string: "ekkoconnect://match/\(context.attributes.matchId)"))
        }
    }

    private func relative(_ date: Date) -> String {
        let seconds = Int(-date.timeIntervalSinceNow)
        if seconds < 60 { return "just now" }
        let minutes = seconds / 60
        if minutes < 60 { return "\(minutes)m ago" }
        let hours = minutes / 60
        return "\(hours)h ago"
    }

    private func initials(of name: String) -> String {
        let parts = name.split(separator: " ").prefix(2)
        return parts.map { $0.prefix(1) }.joined().uppercased()
    }
}

// MARK: - Lock screen view

private struct LockScreenView: View {
    let attributes: MatchActivityAttributes
    let state: MatchActivityAttributes.ContentState

    var body: some View {
        HStack(spacing: 14) {
            AvatarChip(name: attributes.otherDisplayName, urlString: attributes.otherAvatarUrl)
                .frame(width: 56, height: 56)

            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    SparkleGlyph()
                        .frame(width: 12, height: 12)
                        .foregroundStyle(MatchPalette.green)
                    Text("New match")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(MatchPalette.green)
                        .textCase(.uppercase)
                        .kerning(1.5)
                }
                Text(attributes.otherDisplayName)
                    .font(.headline.weight(.semibold))
                    .foregroundStyle(.white)
                    .lineLimit(1)
                Text(state.headline)
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.75))
                    .lineLimit(2)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 8) {
                if state.unread > 0 {
                    Text("\(state.unread)")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)
                        .background(Capsule().fill(MatchPalette.magenta))
                }
                Text("Tap ↗")
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            // Subtle neon gradient to match the app's Tokyo palette
            LinearGradient(
                colors: [
                    Color(red: 0.055, green: 0.0, blue: 0.12),
                    Color.black,
                ],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        )
    }
}

// MARK: - Avatar chip (widget-local, no Kingfisher dep)

private struct AvatarChip: View {
    let name: String
    let urlString: String?

    var body: some View {
        ZStack {
            Circle()
                .fill(
                    LinearGradient(
                        colors: [MatchPalette.green.opacity(0.55), MatchPalette.magenta.opacity(0.55)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    )
                )
            Text(initials)
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(.white)
        }
        .overlay(
            Circle().stroke(MatchPalette.green.opacity(0.45), lineWidth: 1.5)
        )
    }

    private var initials: String {
        let parts = name.split(separator: " ").prefix(2)
        return parts.map { $0.prefix(1) }.joined().uppercased()
    }
}

// MARK: - Sparkle glyph (widget-local — no app code reuse)

private struct SparkleGlyph: View {
    var body: some View {
        GeometryReader { geo in
            let s = min(geo.size.width, geo.size.height)
            Path { p in
                p.move(to: CGPoint(x: s * 0.5, y: 0))
                p.addLine(to: CGPoint(x: s * 0.58, y: s * 0.42))
                p.addLine(to: CGPoint(x: s, y: s * 0.5))
                p.addLine(to: CGPoint(x: s * 0.58, y: s * 0.58))
                p.addLine(to: CGPoint(x: s * 0.5, y: s))
                p.addLine(to: CGPoint(x: s * 0.42, y: s * 0.58))
                p.addLine(to: CGPoint(x: 0, y: s * 0.5))
                p.addLine(to: CGPoint(x: s * 0.42, y: s * 0.42))
                p.closeSubpath()
            }
            .fill(Color.white)
        }
    }
}

// MARK: - Palette (mirrors the app's Tokyo neon)

private enum MatchPalette {
    static let green   = Color(red: 0.0, green: 1.0, blue: 0.322)
    static let magenta = Color(red: 0.851, green: 0.0, blue: 1.0)
}
