import SwiftUI

/// Displays an X (Twitter) handle with the X logo.
/// Tap to open the X app (or Safari if not installed).
struct TwitterPreview: View {
    let handle: String

    var body: some View {
        Button {
            openTwitter()
        } label: {
            HStack(spacing: 10) {
                XLogo()
                    .frame(width: 28, height: 28)

                VStack(alignment: .leading, spacing: 2) {
                    Text("@\(cleanHandle)")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.primary)
                    Text("View on X")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

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

    private var cleanHandle: String {
        handle.trimmingCharacters(in: CharacterSet(charactersIn: "@"))
    }

    private func openTwitter() {
        // Try Twitter/X app first
        if let appURL = URL(string: "twitter://user?screen_name=\(cleanHandle)"),
           UIApplication.shared.canOpenURL(appURL) {
            UIApplication.shared.open(appURL)
            return
        }
        // Fallback to Safari
        if let webURL = URL(string: "https://x.com/\(cleanHandle)") {
            UIApplication.shared.open(webURL)
        }
    }
}
