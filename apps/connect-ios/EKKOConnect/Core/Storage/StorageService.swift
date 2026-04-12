import Foundation
import Supabase

/// Handles file uploads to Supabase Storage, mirroring the path patterns from storage.ts
final class StorageService {
    private let supabase: SupabaseClient
    private let bucket = "portfolio"

    init(supabase: SupabaseClient) {
        self.supabase = supabase
    }

    // MARK: - Connect Media Uploads

    /// Upload a photo or video for a Connect profile media slot
    func uploadConnectMedia(userId: String, data: Data, fileExtension: String, isVideo: Bool) async throws -> String {
        let prefix = isVideo ? "video" : "img"
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let path = "connect/\(userId)/\(prefix)-\(timestamp).\(fileExtension)"
        return try await upload(path: path, data: data, contentType: isVideo ? "video/mp4" : "image/jpeg")
    }

    /// Upload an audio file for a Connect profile media slot
    func uploadConnectAudio(userId: String, data: Data, fileExtension: String) async throws -> String {
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let path = "connect/\(userId)/audio-\(timestamp).\(fileExtension)"
        return try await upload(path: path, data: data, contentType: "audio/mpeg")
    }

    /// Upload a 3D model for a Connect profile media slot
    func uploadConnectModel(userId: String, data: Data, fileExtension: String) async throws -> String {
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let path = "connect/\(userId)/model-\(timestamp).\(fileExtension)"
        return try await upload(path: path, data: data, contentType: "application/octet-stream")
    }

    /// Upload a profile avatar
    func uploadAvatar(userId: String, data: Data, fileExtension: String) async throws -> String {
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let path = "avatars/\(userId)/avatar-\(timestamp).\(fileExtension)"
        return try await upload(path: path, data: data, contentType: "image/jpeg")
    }

    /// Upload a chat image
    func uploadChatImage(userId: String, matchId: String, data: Data, fileExtension: String) async throws -> String {
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let path = "connect/chat/\(matchId)/\(userId)-\(timestamp).\(fileExtension)"
        return try await upload(path: path, data: data, contentType: "image/jpeg")
    }

    // MARK: - Private

    private func upload(path: String, data: Data, contentType: String) async throws -> String {
        let options = FileOptions(cacheControl: "3600", contentType: contentType, upsert: true)
        _ = try await supabase.storage
            .from(bucket)
            .upload(path, data: data, options: options)

        let publicURL = try supabase.storage
            .from(bucket)
            .getPublicURL(path: path)

        return publicURL.absoluteString
    }
}

// MARK: - Media Type Detection

enum MediaTypeDetector {
    static func isVideo(_ url: String) -> Bool {
        url.range(of: #"\.(mp4|webm|mov)(\?|$)"#, options: .regularExpression, range: nil, locale: nil) != nil
        || url.contains("/video-")
    }

    static func isAudio(_ url: String) -> Bool {
        url.range(of: #"\.(mp3|wav|ogg|aac)(\?|$)"#, options: .regularExpression, range: nil, locale: nil) != nil
        || url.contains("/audio-")
    }

    static func isModel(_ url: String) -> Bool {
        url.range(of: #"\.(glb|gltf|obj|fbx|usdz)(\?|$)"#, options: .regularExpression, range: nil, locale: nil) != nil
        || url.contains("/model-")
    }

    static func mediaType(for url: String) -> String {
        if isVideo(url) { return "VIDEO" }
        if isAudio(url) { return "AUDIO" }
        if isModel(url) { return "MODEL" }
        return "PHOTO"
    }
}
