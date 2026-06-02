import SwiftUI
import Kingfisher

struct AvatarView: View {
    let url: String?
    let name: String
    var size: CGFloat = 44

    var body: some View {
        if let url, let imageURL = URL(string: url) {
            KFImage(imageURL)
                .downsampled(to: CGSize(width: size, height: size))
                .retrying()
                // Use the branded initials circle as the placeholder so a
                // loading OR failed avatar still reads as the right person —
                // not a wall of identical gray glyphs (the resilient() default).
                .placeholder { _ in initialsCircle }
                .resizable()
                .scaledToFill()
                .frame(width: size, height: size)
                .clipShape(Circle())
        } else {
            initialsCircle
                .frame(width: size, height: size)
        }
    }

    /// Accent circle with the person's initials. Shared by the no-URL branch and
    /// the KFImage failure/loading placeholder so the fallback is identical
    /// regardless of whether the avatar URL is missing or broken.
    private var initialsCircle: some View {
        Circle()
            .fill(Color.accentColor)
            .overlay {
                Text(initials)
                    .font(.system(size: size * 0.35, weight: .semibold))
                    .foregroundStyle(.white)
            }
    }

    private var initials: String {
        let parts = name.split(separator: " ")
        let first = parts.first?.prefix(1) ?? ""
        let last = parts.count > 1 ? parts.last!.prefix(1) : ""
        return "\(first)\(last)".uppercased()
    }
}
