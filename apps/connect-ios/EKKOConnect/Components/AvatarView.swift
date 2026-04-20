import SwiftUI
import Kingfisher

struct AvatarView: View {
    let url: String?
    let name: String
    var size: CGFloat = 44

    var body: some View {
        if let url, let imageURL = URL(string: url) {
            KFImage(imageURL)
                .resizable()
                .scaledToFill()
                .frame(width: size, height: size)
                .clipShape(Circle())
        } else {
            Circle()
                .fill(Color.accentColor)
                .frame(width: size, height: size)
                .overlay {
                    Text(initials)
                        .font(.system(size: size * 0.35, weight: .semibold))
                        .foregroundStyle(.white)
                }
        }
    }

    private var initials: String {
        let parts = name.split(separator: " ")
        let first = parts.first?.prefix(1) ?? ""
        let last = parts.count > 1 ? parts.last!.prefix(1) : ""
        return "\(first)\(last)".uppercased()
    }
}
