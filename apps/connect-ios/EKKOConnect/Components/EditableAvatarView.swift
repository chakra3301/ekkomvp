import SwiftUI
import PhotosUI

/// Avatar that can be tapped to upload a new profile picture.
/// Calls profile.updateAvatar after upload and refreshes AppState.
struct EditableAvatarView: View {
    let url: String?
    let name: String
    var size: CGFloat = 80

    @Environment(AppState.self) private var appState
    @State private var photoSelection: PhotosPickerItem?
    @State private var isUploading = false
    @State private var errorMessage: String?

    var body: some View {
        PhotosPicker(
            selection: $photoSelection,
            matching: .images
        ) {
            ZStack {
                AvatarView(url: url, name: name, size: size)

                // Upload progress overlay
                if isUploading {
                    Circle()
                        .fill(Color.black.opacity(0.5))
                        .frame(width: size, height: size)
                        .overlay {
                            ProgressView().tint(.white)
                        }
                }
            }
            .frame(width: size, height: size)
            .contentShape(Circle())
        }
        .disabled(isUploading)
        .onChange(of: photoSelection) { _, item in
            guard let item else { return }
            Task { await uploadAvatar(item) }
            photoSelection = nil
        }
        .alert("Upload Error", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") {}
        } message: {
            Text(errorMessage ?? "")
        }
    }

    private func uploadAvatar(_ item: PhotosPickerItem) async {
        guard let userId = appState.session?.user.id.uuidString else { return }
        isUploading = true
        defer { isUploading = false }

        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                errorMessage = "Failed to load image"
                return
            }

            let storage = StorageService(supabase: appState.supabase)
            let uploadedURL = try await storage.uploadAvatar(userId: userId, data: data, fileExtension: "jpg")

            // Update profile via API
            struct AvatarInput: Codable { let avatarUrl: String }
            struct AvatarResponse: Codable { let id: String }
            let _: AvatarResponse = try await appState.trpc.mutate(
                "profile.updateAvatar",
                input: AvatarInput(avatarUrl: uploadedURL)
            )

            // Refresh AppState's currentProfile
            await appState.fetchCurrentUser()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
