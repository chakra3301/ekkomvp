import Foundation

enum NetworkError: LocalizedError {
    case notAuthenticated
    case decodingFailed(Error)
    case uploadFailed(String)
    case unknown(String)

    var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "You must be signed in"
        case .decodingFailed(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .uploadFailed(let message):
            return "Upload failed: \(message)"
        case .unknown(let message):
            return message
        }
    }
}
