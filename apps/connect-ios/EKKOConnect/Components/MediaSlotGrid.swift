import SwiftUI
import PhotosUI
import UniformTypeIdentifiers
import Kingfisher

struct MediaSlotGrid: View {
    @Binding var slots: [MediaSlot]
    let userId: String

    @State private var uploadingIndex: Int?
    @State private var photoSelection: PhotosPickerItem?
    @State private var activeSlotIndex: Int?
    @State private var showFileImporter = false
    @State private var errorMessage: String?
    @State private var draggingIndex: Int?

    // Cover-image picker state (audio slots only).
    @State private var coverPhotoSelection: PhotosPickerItem?
    @State private var coverTargetIndex: Int?
    @State private var uploadingCoverIndex: Int?

    @Environment(AppState.self) private var appState

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let gap: CGFloat = 6
            let smallSize = (w - gap * 2) / 3
            let bigSize = smallSize * 2 + gap

            VStack(spacing: gap) {
                // Row 1: big + 2 small stacked
                HStack(spacing: gap) {
                    cell(index: 0, width: bigSize, height: bigSize, isFeatured: true)
                    VStack(spacing: gap) {
                        cell(index: 1, width: smallSize, height: (bigSize - gap) / 2)
                        cell(index: 2, width: smallSize, height: (bigSize - gap) / 2)
                    }
                }
                // Row 2: 3 small
                HStack(spacing: gap) {
                    cell(index: 3, width: smallSize, height: smallSize)
                    cell(index: 4, width: smallSize, height: smallSize)
                    cell(index: 5, width: smallSize, height: smallSize)
                }
            }
        }
        .frame(height: UIScreen.main.bounds.width * 0.85)
        .onChange(of: photoSelection) { _, item in
            guard let item, let idx = activeSlotIndex else { return }
            Task { await uploadPhoto(item, index: idx) }
            photoSelection = nil
            activeSlotIndex = nil
        }
        .fileImporter(
            isPresented: $showFileImporter,
            allowedContentTypes: audioAndModelTypes
        ) { result in
            guard let idx = activeSlotIndex else { return }
            if case .success(let url) = result {
                Task { await uploadFile(url, index: idx) }
            }
            activeSlotIndex = nil
        }
        .onChange(of: coverPhotoSelection) { _, item in
            guard let item, let idx = coverTargetIndex else { return }
            Task { await uploadCover(item, index: idx) }
            coverPhotoSelection = nil
            coverTargetIndex = nil
        }
        .alert("Error", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") {}
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - Cell

    @ViewBuilder
    private func cell(index: Int, width: CGFloat, height: CGFloat, isFeatured: Bool = false) -> some View {
        let slot = slots.first { $0.sortOrder == index }

        ZStack {
            if let slot {
                filledContent(slot: slot, index: index)
            } else if uploadingIndex == index {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.gray.opacity(0.05))
            } else {
                emptyContent(index: index, isFeatured: isFeatured)
            }
        }
        .frame(width: width, height: height)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay {
            if draggingIndex == index {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color.accentColor, lineWidth: 2)
            }
        }
        .scaleEffect(draggingIndex == index ? 0.96 : 1)
        .animation(.spring(response: 0.25), value: draggingIndex)
        .modifier(SlotDragModifier(
            enabled: slot != nil,
            index: index,
            onDragStart: { draggingIndex = index },
            onDragEnd: { draggingIndex = nil },
            preview: {
                Group {
                    if let slot {
                        filledContent(slot: slot, index: index)
                    }
                }
                .frame(width: width, height: height)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
        ))
        .dropDestination(for: String.self) { items, _ in
            draggingIndex = nil
            guard let raw = items.first, let from = Int(raw), from != index else { return false }
            moveSlot(from: from, to: index)
            return true
        } isTargeted: { _ in }
    }

    // MARK: - Filled

    @ViewBuilder
    private func filledContent(slot: MediaSlot, index: Int) -> some View {
        ZStack(alignment: .topTrailing) {
            if slot.isAudio {
                ZStack {
                    // Use the uploaded cover as background when set; fall
                    // back to the gradient + waveform otherwise.
                    if let coverStr = slot.coverUrl, let coverURL = URL(string: coverStr) {
                        KFImage(coverURL)
                            .resizable()
                            .scaledToFill()
                        // Subtle dim so the cover-action button stays legible.
                        Color.black.opacity(0.18)
                    } else {
                        LinearGradient(
                            colors: [.purple.opacity(0.15), .pink.opacity(0.15)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                        VStack(spacing: 4) {
                            Image(systemName: "waveform")
                                .font(.title3)
                                .foregroundStyle(Color.accentColor)
                            Text("Audio")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }

                    // Loading spinner while a cover is uploading.
                    if uploadingCoverIndex == index {
                        Color.black.opacity(0.4)
                        ProgressView().tint(.white)
                    }
                }
                .overlay(alignment: .bottomLeading) {
                    coverPickerPill(slot: slot, index: index)
                }
            } else if slot.isModel {
                Color.gray.opacity(0.08)
                    .overlay {
                        VStack(spacing: 4) {
                            Image(systemName: "cube")
                                .font(.title3)
                                .foregroundStyle(Color.accentColor)
                            Text("3D")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
            } else if let url = URL(string: slot.url) {
                KFImage(url)
                    .resizable()
                    .scaledToFill()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .clipped()
                    .overlay(alignment: .bottomLeading) {
                        if slot.isVideo {
                            Image(systemName: "video.fill")
                                .font(.caption2)
                                .foregroundStyle(.white)
                                .padding(4)
                                .background(.black.opacity(0.5))
                                .clipShape(Circle())
                                .padding(5)
                        }
                    }
            }

            // X button
            Button {
                withAnimation(.spring(response: 0.25)) {
                    slots.removeAll { $0.sortOrder == index }
                }
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(5)
                    .background(.black.opacity(0.6))
                    .clipShape(Circle())
            }
            .padding(5)
        }
    }

    // MARK: - Empty

    @ViewBuilder
    private func emptyContent(index: Int, isFeatured: Bool) -> some View {
        ZStack {
            // Main area: PhotosPicker for photos/videos
            PhotosPicker(
                selection: Binding(
                    get: { photoSelection },
                    set: { item in
                        activeSlotIndex = index
                        photoSelection = item
                    }
                ),
                matching: .any(of: [.images, .videos])
            ) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(style: StrokeStyle(lineWidth: 1.5, dash: [6, 5]))
                        .foregroundStyle(Color.secondary.opacity(0.3))
                    VStack(spacing: 3) {
                        Image(systemName: "plus")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundStyle(.secondary)
                        if isFeatured {
                            Text("Featured")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }

            // Small button in bottom-right corner for audio/3D files
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Button {
                        activeSlotIndex = index
                        showFileImporter = true
                    } label: {
                        Image(systemName: "doc.badge.plus")
                            .font(.system(size: 10))
                            .foregroundStyle(.white)
                            .padding(5)
                            .background(Color.accentColor.opacity(0.8))
                            .clipShape(Circle())
                    }
                    .padding(5)
                }
            }
        }
    }

    /// Small pill button at the bottom-left of an audio cell. Lets the user
    /// pick a cover image to display behind that audio file (album art).
    private func coverPickerPill(slot: MediaSlot, index: Int) -> some View {
        let label = slot.coverUrl == nil ? "Add cover" : "Change"
        return PhotosPicker(
            selection: Binding(
                get: { coverPhotoSelection },
                set: { item in
                    coverTargetIndex = index
                    coverPhotoSelection = item
                }
            ),
            matching: .images
        ) {
            HStack(spacing: 4) {
                Image(systemName: "photo")
                    .font(.system(size: 9, weight: .semibold))
                Text(label)
                    .font(.system(size: 10, weight: .semibold))
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(.black.opacity(0.55), in: Capsule())
        }
        .padding(5)
    }

    // MARK: - File Types

    private var audioAndModelTypes: [UTType] {
        [
            .audio, .mp3, .wav, .aiff,
            .usdz,
            UTType(filenameExtension: "glb") ?? .data,
            UTType(filenameExtension: "gltf") ?? .data,
            UTType(filenameExtension: "obj") ?? .data,
            UTType(filenameExtension: "fbx") ?? .data,
        ]
    }

    // MARK: - Upload Photo/Video

    private func uploadPhoto(_ item: PhotosPickerItem, index: Int) async {
        uploadingIndex = index
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                errorMessage = "Failed to load media"
                uploadingIndex = nil
                return
            }
            let isVideo = item.supportedContentTypes.contains { $0.conforms(to: .movie) }
            let ext = isVideo ? "mp4" : "jpg"
            let storage = StorageService(supabase: appState.supabase)
            let url = try await storage.uploadConnectMedia(userId: userId, data: data, fileExtension: ext, isVideo: isVideo)
            addSlot(MediaSlot(url: url, mediaType: isVideo ? "VIDEO" : "PHOTO", sortOrder: index))
        } catch {
            errorMessage = error.localizedDescription
        }
        uploadingIndex = nil
    }

    // MARK: - Upload Audio/3D

    private func uploadFile(_ fileURL: URL, index: Int) async {
        uploadingIndex = index
        guard fileURL.startAccessingSecurityScopedResource() else {
            errorMessage = "Cannot access file"
            uploadingIndex = nil
            return
        }
        defer { fileURL.stopAccessingSecurityScopedResource() }

        do {
            let data = try Data(contentsOf: fileURL)
            let ext = fileURL.pathExtension.lowercased()
            let storage = StorageService(supabase: appState.supabase)

            let audioExts = Set(["mp3", "wav", "aac", "ogg", "aiff", "m4a"])
            let modelExts = Set(["glb", "gltf", "usdz", "obj", "fbx"])

            if audioExts.contains(ext) {
                guard data.count <= ConnectLimits.maxFileSizeAudio else {
                    errorMessage = "Audio must be under 20MB"; uploadingIndex = nil; return
                }
                let url = try await storage.uploadConnectAudio(userId: userId, data: data, fileExtension: ext)
                addSlot(MediaSlot(url: url, mediaType: "AUDIO", sortOrder: index))
            } else if modelExts.contains(ext) {
                guard data.count <= ConnectLimits.maxFileSizeModel else {
                    errorMessage = "3D model must be under 50MB"; uploadingIndex = nil; return
                }
                let url = try await storage.uploadConnectModel(userId: userId, data: data, fileExtension: ext)
                addSlot(MediaSlot(url: url, mediaType: "MODEL", sortOrder: index))
            } else {
                errorMessage = "Unsupported file type"
            }
        } catch {
            errorMessage = error.localizedDescription
        }
        uploadingIndex = nil
    }

    // MARK: - Reorder

    private func moveSlot(from: Int, to: Int) {
        guard from != to else { return }
        guard let source = slots.first(where: { $0.sortOrder == from }) else { return }

        var updated = slots
        updated.removeAll { $0.sortOrder == from }

        if let target = slots.first(where: { $0.sortOrder == to }) {
            // Swap: target takes source's old slot. `with(sortOrder:)`
            // preserves title + coverUrl across the move so optional
            // fields don't get nuked.
            updated.removeAll { $0.sortOrder == to }
            updated.append(target.with(sortOrder: from))
        }
        updated.append(source.with(sortOrder: to))
        updated.sort { $0.sortOrder < $1.sortOrder }

        withAnimation(.spring(response: 0.3)) { slots = updated }
        let haptic = UIImpactFeedbackGenerator(style: .medium)
        haptic.impactOccurred()
    }

    private func addSlot(_ slot: MediaSlot) {
        var updated = slots.filter { $0.sortOrder != slot.sortOrder }
        updated.append(slot)
        updated.sort { $0.sortOrder < $1.sortOrder }
        withAnimation(.spring(response: 0.25)) { slots = updated }
    }

    // MARK: - Cover upload

    private func uploadCover(_ item: PhotosPickerItem, index: Int) async {
        uploadingCoverIndex = index
        defer { uploadingCoverIndex = nil }
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                errorMessage = "Failed to load cover image"
                return
            }
            let storage = StorageService(supabase: appState.supabase)
            let url = try await storage.uploadConnectMedia(
                userId: userId,
                data: data,
                fileExtension: "jpg",
                isVideo: false
            )
            // Mutate the matching slot in place so title + sortOrder are preserved.
            if let i = slots.firstIndex(where: { $0.sortOrder == index }) {
                var updated = slots
                updated[i].coverUrl = url
                slots = updated
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

// MARK: - Conditional draggable modifier

private struct SlotDragModifier<Preview: View>: ViewModifier {
    let enabled: Bool
    let index: Int
    let onDragStart: () -> Void
    let onDragEnd: () -> Void
    @ViewBuilder let preview: () -> Preview

    func body(content: Content) -> some View {
        if enabled {
            content.draggable(String(index)) {
                preview()
                    .opacity(0.9)
                    .onAppear { onDragStart() }
                    .onDisappear { onDragEnd() }
            }
        } else {
            content
        }
    }
}
