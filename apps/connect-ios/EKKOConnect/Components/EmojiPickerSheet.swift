import SwiftUI

/// Quick emoji picker sheet — taps insert the emoji at the cursor.
struct EmojiPickerSheet: View {
    @Binding var text: String
    @Environment(\.dismiss) private var dismiss

    private let categories: [(String, [String])] = [
        ("Smileys", ["😀","😃","😄","😁","😆","🥹","😅","😂","🤣","🥲","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","😞","😔","😟","😕","🙁","☹️","😣","😖","😫","😩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😶‍🌫️","😱","😨","😰","😥","😓"]),
        ("Hearts", ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","💕","💞","💓","💗","💖","💘","💝","💟"]),
        ("Hands", ["👍","👎","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","🫵","👋","🤚","🖐️","✋","🖖","👏","🙌","🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪"]),
        ("Activities", ["🎨","🎭","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎬","📷","📸","📹","🎥","📽️","🎞️","🖼️","💻","📱","⌨️","🖥️","🖨️","💡","🔦","📚","📖","✏️","🖊️","🖌️","🖍️","📝"]),
        ("Symbols", ["💯","✨","⭐","🌟","💫","✅","☑️","✔️","❌","❎","💥","🔥","💫","💢","💨","💦","💤","🚀","🎉","🎊","🎈","🎁","🏆","🥇","🥈","🥉","🏅","🎖️"]),
    ]

    private let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 8)

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    ForEach(categories, id: \.0) { category, emojis in
                        VStack(alignment: .leading, spacing: 8) {
                            Text(category)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.secondary)
                                .padding(.horizontal, 16)

                            LazyVGrid(columns: columns, spacing: 4) {
                                ForEach(emojis, id: \.self) { emoji in
                                    Button {
                                        text.append(emoji)
                                    } label: {
                                        Text(emoji)
                                            .font(.system(size: 28))
                                            .frame(width: 36, height: 36)
                                    }
                                }
                            }
                            .padding(.horizontal, 12)
                        }
                    }
                }
                .padding(.vertical, 16)
            }
            .navigationTitle("Emoji")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}
