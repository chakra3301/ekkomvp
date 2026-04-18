import SwiftUI
import Kingfisher

/// Hero variant of the Connect profile (template = "HERO").
/// Full-bleed parallax cover with an oversized name overlay, floating avatar,
/// horizontal media rail, prompts, looking-for, socials.
///
/// Mirrors the structural moves of Variant 1 in the design handoff while
/// using EKKOTheme + Arches font + glass primitives that the rest of the
/// Connect app uses.
struct ConnectProfileHeroView: View {
    let displayName: String
    var avatarUrl: String?
    var headline: String?
    var location: String?
    var lookingFor: String?
    var bio: String?
    var mediaSlots: [MediaSlot] = []
    var prompts: [PromptEntry] = []
    var instagramHandle: String?
    var twitterHandle: String?
    var websiteUrl: String?
    var connectTier: ConnectTier = .FREE
    var likesReceivedCount: Int = 0
    var matchesCount: Int = 0
    var isAdmin: Bool = false

    private let coverHeight: CGFloat = 440

    private var sortedMedia: [MediaSlot] {
        mediaSlots.sorted { $0.sortOrder < $1.sortOrder }
    }

    private var heroSlot: MediaSlot? { sortedMedia.first }
    private var railSlots: [MediaSlot] { Array(sortedMedia.dropFirst()) }

    var body: some View {
        VStack(spacing: 0) {
            heroCover
                .padding(.bottom, -42) // avatar overlap

            VStack(alignment: .leading, spacing: 22) {
                avatarRow

                if let bio, !bio.isEmpty {
                    Text(bio)
                        .archesStyle(.body)
                        .foregroundStyle(.primary.opacity(0.9))
                        .fixedSize(horizontal: false, vertical: true)
                        .padding(.horizontal, 20)
                }

                statsRow

                if !railSlots.isEmpty {
                    workRail
                }

                if !prompts.isEmpty {
                    promptsSection
                }

                if let lookingFor, !lookingFor.isEmpty {
                    lookingForSection(lookingFor)
                }

                socialsSection

                Spacer(minLength: 32)
            }
            .padding(.top, 56) // room for avatar overlap
        }
    }

    // MARK: - Hero Cover

    private var heroCover: some View {
        GeometryReader { geo in
            let minY = geo.frame(in: .named("heroScroll")).minY
            let parallax = max(minY, 0)
            let stretch = max(-minY, 0)

            ZStack(alignment: .bottomLeading) {
                Group {
                    if let slot = heroSlot {
                        coverContent(for: slot)
                    } else {
                        LinearGradient(
                            colors: [EKKOTheme.primary.opacity(0.6), EKKOTheme.primary.opacity(0.15), .black.opacity(0.85)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    }
                }
                .frame(width: geo.size.width, height: coverHeight + parallax + stretch)
                .offset(y: -parallax)
                .clipped()

                // Bottom darkening — name reads cleanly over any image
                LinearGradient(
                    colors: [.clear, .clear, .black.opacity(0.85)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .frame(height: coverHeight)
                .allowsHitTesting(false)

                // Top mono label
                VStack {
                    HStack {
                        Text("⌘  \(handleString)")
                            .font(.custom(EKKOFont.regular, size: 11))
                            .tracking(2)
                            .foregroundStyle(.white.opacity(0.75))
                        Spacer()
                        if let location, !location.isEmpty {
                            Text(location.uppercased())
                                .font(.custom(EKKOFont.regular, size: 11))
                                .tracking(2)
                                .foregroundStyle(EKKOTheme.primary)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 16)
                    Spacer()
                }
                .frame(height: coverHeight)
                .allowsHitTesting(false)

                // Name + headline overlay — bottom of cover, above where the avatar overlaps
                VStack(alignment: .leading, spacing: 6) {
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text(displayName)
                            .font(.custom(EKKOFont.regular, size: 56))
                            .lineLimit(2)
                            .minimumScaleFactor(0.6)
                            .foregroundStyle(.white)
                            .shadow(color: EKKOTheme.primary.opacity(0.5), radius: 18)
                            .shadow(color: .black.opacity(0.5), radius: 12, y: 4)

                        if isAdmin {
                            gmBadge
                        } else if connectTier == .INFINITE {
                            Image(systemName: "infinity")
                                .font(.callout.weight(.semibold))
                                .foregroundStyle(EKKOTheme.primary)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(.white.opacity(0.15))
                                .clipShape(Capsule())
                        }
                    }
                    if let headline, !headline.isEmpty {
                        Text(headline)
                            .font(.custom(EKKOFont.regular, size: 16))
                            .foregroundStyle(.white.opacity(0.85))
                            .lineLimit(2)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 70) // leave room for avatar overlap
            }
        }
        .frame(height: coverHeight)
    }

    @ViewBuilder
    private func coverContent(for slot: MediaSlot) -> some View {
        if slot.isAudio {
            ZStack {
                LinearGradient(
                    colors: [.purple.opacity(0.5), .pink.opacity(0.35), .blue.opacity(0.25)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Image(systemName: "waveform")
                    .font(.system(size: 64))
                    .foregroundStyle(.white.opacity(0.7))
            }
        } else if slot.isModel {
            ZStack {
                LinearGradient(
                    colors: [EKKOTheme.primary.opacity(0.5), .black],
                    startPoint: .top,
                    endPoint: .bottom
                )
                Image(systemName: "cube.transparent")
                    .font(.system(size: 64))
                    .foregroundStyle(.white.opacity(0.7))
            }
        } else if slot.isVideo {
            // Static still: use a thumbnail color while keeping a video icon hint.
            // (Avoids autoplay churn behind the parallax — first slot already
            // surfaces in the rail for explicit playback if needed.)
            ZStack {
                LinearGradient(
                    colors: [.black, EKKOTheme.primary.opacity(0.4)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                Image(systemName: "play.rectangle.fill")
                    .font(.system(size: 56))
                    .foregroundStyle(.white.opacity(0.8))
            }
        } else if let url = URL(string: slot.url) {
            KFImage(url)
                .resizable()
                .scaledToFill()
        }
    }

    // MARK: - Avatar Row

    private var avatarRow: some View {
        HStack(alignment: .bottom) {
            AvatarView(url: avatarUrl, name: displayName, size: 88)
                .overlay(
                    Circle().stroke(Color(.systemBackground), lineWidth: 4)
                )
                .shadow(color: .black.opacity(0.2), radius: 12, y: 3)
                .offset(y: -56)
                .padding(.bottom, -56)
            Spacer()
        }
        .padding(.horizontal, 20)
    }

    private var gmBadge: some View {
        Text("GM")
            .font(.caption.bold())
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(
                LinearGradient(
                    colors: [EKKOTheme.primary, .purple],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .clipShape(Capsule())
    }

    // MARK: - Stats Row

    private var statsRow: some View {
        HStack(spacing: 0) {
            heroStat("\(likesReceivedCount)", "Likes")
            divider
            heroStat("\(matchesCount)", "Matches")
            divider
            heroStat("\(mediaSlots.count)", "Media")
            divider
            heroStat("\(prompts.count)", "Prompts")
        }
        .padding(.vertical, 14)
        .padding(.horizontal, 20)
        .overlay(Rectangle().fill(Color.secondary.opacity(0.18)).frame(height: 0.5), alignment: .top)
        .overlay(Rectangle().fill(Color.secondary.opacity(0.18)).frame(height: 0.5), alignment: .bottom)
    }

    private func heroStat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.custom(EKKOFont.regular, size: 22))
                .foregroundStyle(.primary)
            Text(label.uppercased())
                .font(.custom(EKKOFont.regular, size: 9))
                .tracking(1.8)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.secondary.opacity(0.18))
            .frame(width: 0.5, height: 28)
    }

    // MARK: - Work Rail

    private var workRail: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("WORK / \(railSlots.count)")
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(Array(railSlots.enumerated()), id: \.offset) { _, slot in
                        railCard(slot: slot)
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }

    private func railCard(slot: MediaSlot) -> some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if slot.isAudio {
                    LinearGradient(colors: [.purple.opacity(0.5), .pink.opacity(0.3)], startPoint: .top, endPoint: .bottom)
                        .overlay(Image(systemName: "waveform").font(.system(size: 32)).foregroundStyle(.white.opacity(0.85)))
                } else if slot.isModel {
                    LinearGradient(colors: [EKKOTheme.primary.opacity(0.5), .black], startPoint: .top, endPoint: .bottom)
                        .overlay(Image(systemName: "cube.transparent").font(.system(size: 32)).foregroundStyle(.white.opacity(0.85)))
                } else if slot.isVideo {
                    LinearGradient(colors: [.black, EKKOTheme.primary.opacity(0.4)], startPoint: .topLeading, endPoint: .bottomTrailing)
                        .overlay(Image(systemName: "play.rectangle.fill").font(.system(size: 32)).foregroundStyle(.white.opacity(0.9)))
                } else if let url = URL(string: slot.url) {
                    KFImage(url).resizable().scaledToFill()
                }
            }
            .frame(width: 180, height: 220)
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
            )

            Text(mediaTypeLabel(for: slot))
                .font(.custom(EKKOFont.regular, size: 10))
                .tracking(1.5)
                .foregroundStyle(.white)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(.black.opacity(0.55))
                .clipShape(Capsule())
                .padding(10)
        }
        .frame(width: 180)
    }

    private func mediaTypeLabel(for slot: MediaSlot) -> String {
        if slot.isAudio { return "AUDIO" }
        if slot.isModel { return "3D" }
        if slot.isVideo { return "VIDEO" }
        return "PHOTO"
    }

    // MARK: - Prompts

    private var promptsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("◉ PROMPTS")
            VStack(spacing: 10) {
                ForEach(Array(prompts.enumerated()), id: \.offset) { _, prompt in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(prompt.question)
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.secondary)
                        Text(prompt.answer)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.primary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(14)
                    .glassCard()
                }
            }
            .padding(.horizontal, 20)
        }
    }

    // MARK: - Looking For

    private func lookingForSection(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("◉ LOOKING FOR")
            Text(text)
                .archesStyle(.body)
                .foregroundStyle(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(14)
                .glassCard()
                .padding(.horizontal, 20)
        }
    }

    // MARK: - Socials

    private var socialsSection: some View {
        let hasAny = (instagramHandle?.isEmpty == false) ||
                     (twitterHandle?.isEmpty == false) ||
                     (websiteUrl?.isEmpty == false)

        return Group {
            if hasAny {
                VStack(alignment: .leading, spacing: 12) {
                    sectionHeader("⌁ ELSEWHERE")
                    VStack(spacing: 12) {
                        if let ig = instagramHandle, !ig.isEmpty {
                            InstagramPreview(handle: ig)
                        }
                        if let tw = twitterHandle, !tw.isEmpty {
                            TwitterPreview(handle: tw)
                        }
                        if let web = websiteUrl, !web.isEmpty {
                            websiteRow(url: web)
                        }
                    }
                    .padding(.horizontal, 20)
                }
            }
        }
    }

    @ViewBuilder
    private func websiteRow(url: String) -> some View {
        Button {
            let urlStr = url.hasPrefix("http") ? url : "https://\(url)"
            if let u = URL(string: urlStr) { UIApplication.shared.open(u) }
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "globe")
                    .font(.callout)
                    .foregroundStyle(.secondary)
                Text(cleanDisplayURL(url))
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                Spacer()
                Image(systemName: "arrow.up.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(14)
        }
        .buttonStyle(.plain)
        .glassBubble(cornerRadius: 18)
    }

    private func cleanDisplayURL(_ url: String) -> String {
        url.replacingOccurrences(of: "https://", with: "")
           .replacingOccurrences(of: "http://", with: "")
           .replacingOccurrences(of: "www.", with: "")
           .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }

    // MARK: - Section Header

    private func sectionHeader(_ label: String) -> some View {
        HStack(alignment: .center, spacing: 12) {
            Text(label)
                .font(.custom(EKKOFont.regular, size: 11))
                .tracking(2.5)
                .foregroundStyle(EKKOTheme.primary)
            Rectangle()
                .fill(Color.secondary.opacity(0.2))
                .frame(height: 0.5)
        }
        .padding(.horizontal, 20)
    }

    // MARK: - Helpers

    /// Best-effort handle string for the top mono label.
    private var handleString: String {
        if let h = headline, !h.isEmpty { return h }
        return displayName.lowercased().replacingOccurrences(of: " ", with: "")
    }
}
