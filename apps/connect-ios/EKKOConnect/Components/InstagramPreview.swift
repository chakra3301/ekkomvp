import SwiftUI
import Kingfisher

/// Displays an Instagram handle with profile pic + 3 recent posts.
/// Data comes from the Connect backend at `/api/instagram/{handle}`.
/// Tap anywhere to open the user's Instagram profile in the Instagram app
/// (or Safari if not installed).
struct InstagramPreview: View {
    let handle: String

    @State private var profilePicUrl: String?
    @State private var posts: [InstagramPost] = []
    @State private var isLoading = true

    private struct InstagramPost: Decodable, Identifiable {
        let imageUrl: String
        var id: String { imageUrl }
    }

    private struct PreviewResponse: Decodable {
        let profilePicUrl: String?
        let posts: [InstagramPost]
    }

    var body: some View {
        Button {
            openInstagram()
        } label: {
            VStack(alignment: .leading, spacing: 12) {
                // Header: Instagram logo + handle + profile pic
                HStack(spacing: 10) {
                    InstagramLogo()
                        .frame(width: 28, height: 28)

                    Text("@\(handle)")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)

                    Spacer()

                    if let picUrl = profilePicUrl, let url = absoluteURL(picUrl) {
                        KFImage(url)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 36, height: 36)
                            .clipShape(Circle())
                            .overlay(Circle().stroke(Color.white.opacity(0.3), lineWidth: 1))
                    }
                }

                // Posts grid (3 columns)
                if isLoading {
                    HStack(spacing: 6) {
                        ForEach(0..<3, id: \.self) { _ in
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color.gray.opacity(0.15))
                                .aspectRatio(1, contentMode: .fit)
                        }
                    }
                    .overlay { ProgressView() }
                } else if !posts.isEmpty {
                    HStack(spacing: 6) {
                        ForEach(posts) { post in
                            if let url = absoluteURL(post.imageUrl) {
                                KFImage(url)
                                    .resizable()
                                    .scaledToFill()
                                    .aspectRatio(1, contentMode: .fill)
                                    .frame(maxWidth: .infinity)
                                    .clipShape(RoundedRectangle(cornerRadius: 8))
                            }
                        }
                        // Pad out if fewer than 3
                        if posts.count < 3 {
                            ForEach(0..<(3 - posts.count), id: \.self) { _ in
                                RoundedRectangle(cornerRadius: 8)
                                    .fill(Color.gray.opacity(0.1))
                                    .aspectRatio(1, contentMode: .fit)
                            }
                        }
                    }
                } else {
                    // No posts available — just show "View on Instagram" hint
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.up.right.square")
                            .font(.caption)
                        Text("View on Instagram")
                            .font(.caption)
                    }
                    .foregroundStyle(.secondary)
                }
            }
            .padding(14)
        }
        .buttonStyle(.plain)
        .glassBubble(cornerRadius: 18)
        .task { await loadPreview() }
    }

    // MARK: - Data

    private func loadPreview() async {
        // Build the URL from the tRPC base URL
        var base = Config.trpcBaseURL
        if base.hasSuffix("/trpc") {
            base = String(base.dropLast("/trpc".count))
        }
        guard let url = URL(string: "\(base)/instagram/\(handle)") else { return }

        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let decoded = try JSONDecoder().decode(PreviewResponse.self, from: data)
            profilePicUrl = decoded.profilePicUrl
            posts = decoded.posts
        } catch {
            // Leave empty state
        }
        isLoading = false
    }

    /// API returns relative URLs like `/api/instagram/image?url=...` — resolve against base.
    private func absoluteURL(_ urlString: String) -> URL? {
        if urlString.hasPrefix("http") {
            return URL(string: urlString)
        }
        var base = Config.trpcBaseURL
        if base.hasSuffix("/api/trpc") {
            base = String(base.dropLast("/api/trpc".count))
        } else if base.hasSuffix("/trpc") {
            base = String(base.dropLast("/trpc".count))
        }
        return URL(string: "\(base)\(urlString)")
    }

    // MARK: - Open Instagram

    private func openInstagram() {
        let cleanHandle = handle.trimmingCharacters(in: CharacterSet(charactersIn: "@"))
        // Try Instagram app first
        if let appURL = URL(string: "instagram://user?username=\(cleanHandle)"),
           UIApplication.shared.canOpenURL(appURL) {
            UIApplication.shared.open(appURL)
            return
        }
        // Fallback to Safari
        if let webURL = URL(string: "https://www.instagram.com/\(cleanHandle)") {
            UIApplication.shared.open(webURL)
        }
    }

}
