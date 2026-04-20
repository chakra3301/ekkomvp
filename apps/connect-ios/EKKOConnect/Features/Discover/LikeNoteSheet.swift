import SwiftUI

/// Bottom sheet for adding an optional note when liking someone.
struct LikeNoteSheet: View {
    @Binding var isPresented: Bool
    let onSubmit: (String?) -> Void

    @State private var note = ""
    @FocusState private var isFocused: Bool

    var body: some View {
        VStack(spacing: 12) {
            // Header
            HStack {
                Image(systemName: "heart.fill")
                    .foregroundStyle(Color.accentColor)
                    .font(.subheadline)
                Text("Add a note?")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Text("Optional")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            // Input + Send
            HStack(spacing: 8) {
                TextField("Say something nice...", text: $note)
                    .font(.subheadline)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(.ultraThinMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .focused($isFocused)
                    .onSubmit { onSubmit(note.isEmpty ? nil : note) }

                Button {
                    onSubmit(note.isEmpty ? nil : note)
                } label: {
                    Image(systemName: "paperplane.fill")
                        .foregroundStyle(.white)
                        .padding(10)
                        .background(Color.accentColor)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            // Skip
            Button {
                onSubmit(nil)
            } label: {
                Text("Skip")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(16)
        .glassCard()
        .padding(.horizontal, 16)
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                isFocused = true
            }
        }
    }
}
