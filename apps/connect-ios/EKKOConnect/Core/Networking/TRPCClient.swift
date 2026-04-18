import Foundation

/// Lightweight tRPC client that communicates with the Next.js API.
/// Supports both queries (GET) and mutations (POST) with Bearer token auth.
@Observable
final class TRPCClient {
    private let baseURL: URL
    private var accessToken: String?
    /// Optional closure that provides a fresh access token on each request.
    /// When set, this takes priority over the static `accessToken`.
    var tokenProvider: (() async -> String?)?
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    private let session: URLSession

    init(baseURL: URL, session: URLSession? = nil) {
        self.baseURL = baseURL
        // Use a session configured to PRESERVE the Authorization header on
        // cross-host redirects (e.g. ekkoconnect.app → www.ekkoconnect.app).
        // URLSession strips it by default for security, which would 401 us.
        if let session {
            self.session = session
        } else {
            let config = URLSessionConfiguration.default
            self.session = URLSession(
                configuration: config,
                delegate: AuthPreservingRedirectDelegate(),
                delegateQueue: nil
            )
        }

        self.decoder = JSONDecoder()
        // tRPC with superjson serializes dates as ISO 8601 strings
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let string = try container.decode(String.self)
            if let date = formatter.date(from: string) {
                return date
            }
            // Fallback: try without fractional seconds
            let fallback = ISO8601DateFormatter()
            fallback.formatOptions = [.withInternetDateTime]
            if let date = fallback.date(from: string) {
                return date
            }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid date: \(string)")
        }

        self.encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
    }

    func setAccessToken(_ token: String?) {
        self.accessToken = token
    }

    // MARK: - Query (GET)

    /// Resolves the current access token — prefers the dynamic provider, falls back to static.
    private func resolveToken() async -> String? {
        if let provider = tokenProvider {
            return await provider()
        }
        return accessToken
    }

    func query<T: Decodable>(_ procedure: String, input: (any Encodable)? = nil) async throws -> T {
        var url = baseURL.appendingPathComponent(procedure)

        if let input {
            let inputData = try encoder.encode(AnyEncodable(input))
            let inputJSON = String(data: inputData, encoding: .utf8) ?? "{}"
            let wrapped = "{\"json\":\(inputJSON)}"
            guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else {
                throw TRPCError.invalidResponse
            }
            components.queryItems = [URLQueryItem(name: "input", value: wrapped)]
            guard let composed = components.url else {
                throw TRPCError.invalidResponse
            }
            url = composed
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let token = await resolveToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        #if DEBUG
        print("[tRPC] GET \(procedure) → \(url)")
        #endif
        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        #if DEBUG
        print("[tRPC] GET \(procedure) ← \(statusCode) (\(data.count) bytes)")
        if statusCode >= 400 {
            print("[tRPC] Response body: \(String(data: data, encoding: .utf8) ?? "nil")")
        }
        #endif
        try validateResponse(response, data: data)
        return try decodeResult(data)
    }

    // MARK: - Mutation (POST)

    func mutate<T: Decodable>(_ procedure: String, input: (any Encodable)? = nil) async throws -> T {
        let url = baseURL.appendingPathComponent(procedure)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let token = await resolveToken()
        if let token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let input {
            let inputData = try encoder.encode(AnyEncodable(input))
            let inputJSON = String(data: inputData, encoding: .utf8) ?? "{}"
            let body = "{\"json\":\(inputJSON)}"
            request.httpBody = body.data(using: .utf8)
        } else {
            request.httpBody = "{\"json\":{}}".data(using: .utf8)
        }

        #if DEBUG
        print("[tRPC] POST \(procedure) (token: \(token != nil ? "yes" : "no"))")
        #endif
        let (data, response) = try await session.data(for: request)
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        #if DEBUG
        print("[tRPC] POST \(procedure) ← \(statusCode) (\(data.count) bytes)")
        if statusCode >= 400 {
            print("[tRPC] Error body: \(String(data: data, encoding: .utf8) ?? "nil")")
        }
        #endif
        try validateResponse(response, data: data)
        return try decodeResult(data)
    }

    /// Mutation that returns Void (ignores response body)
    func mutate(_ procedure: String, input: (any Encodable)? = nil) async throws {
        let _: EmptyResult = try await mutate(procedure, input: input)
    }

    // MARK: - Private

    private func validateResponse(_ response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw TRPCError.invalidResponse
        }
        guard (200...299).contains(http.statusCode) else {
            // Try multiple tRPC error shapes
            if let json = try? JSONSerialization.jsonObject(with: data) {
                let message = extractErrorMessage(from: json) ?? "Server error \(http.statusCode)"
                throw TRPCError.serverError(code: "HTTP_\(http.statusCode)", message: message)
            }
            throw TRPCError.httpError(statusCode: http.statusCode)
        }
    }

    /// Recursively searches a JSON structure for an "error.message" / "message" field.
    private func extractErrorMessage(from json: Any) -> String? {
        if let dict = json as? [String: Any] {
            // Common tRPC shape: { "error": { "message": "..." } }
            if let error = dict["error"] as? [String: Any],
               let msg = error["message"] as? String {
                return msg
            }
            // Nested: { "error": { "json": { "message": "..." } } }
            if let error = dict["error"] as? [String: Any],
               let jsn = error["json"] as? [String: Any],
               let msg = jsn["message"] as? String {
                return msg
            }
            // Fallback: any top-level "message"
            if let msg = dict["message"] as? String {
                return msg
            }
            // Dive into values
            for v in dict.values {
                if let msg = extractErrorMessage(from: v) { return msg }
            }
        } else if let arr = json as? [Any] {
            for v in arr {
                if let msg = extractErrorMessage(from: v) { return msg }
            }
        }
        return nil
    }

    /// Unwraps the tRPC + superjson response envelope:
    /// `{ "result": { "data": { "json": <T> } } }`
    private func decodeResult<T: Decodable>(_ data: Data) throws -> T {
        let envelope = try decoder.decode(TRPCResultEnvelope<T>.self, from: data)
        return envelope.result.data.json
    }
}

// MARK: - Response Envelopes

private struct TRPCResultEnvelope<T: Decodable>: Decodable {
    let result: TRPCResultData<T>
}

private struct TRPCResultData<T: Decodable>: Decodable {
    let data: TRPCDataJSON<T>
}

private struct TRPCDataJSON<T: Decodable>: Decodable {
    let json: T
}

private struct EmptyResult: Decodable {}

// MARK: - Error Types

enum TRPCError: LocalizedError {
    case invalidResponse
    case httpError(statusCode: Int)
    case serverError(code: String, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Invalid server response"
        case .httpError(let code):
            return "Server error (\(code))"
        case .serverError(_, let message):
            return message
        }
    }
}

private struct TRPCErrorEnvelope: Decodable {
    let error: TRPCErrorBody
}

private struct TRPCErrorBody: Decodable {
    let message: String
    let data: TRPCErrorData?
}

private struct TRPCErrorData: Decodable {
    let code: String?
}

// MARK: - Type Erasure for Encodable

private struct AnyEncodable: Encodable {
    private let _encode: (Encoder) throws -> Void

    init(_ value: any Encodable) {
        _encode = value.encode
    }

    func encode(to encoder: Encoder) throws {
        try _encode(encoder)
    }
}

// MARK: - Redirect delegate

/// URLSession strips the Authorization header by default on cross-host redirects
/// (e.g. ekkoconnect.app → www.ekkoconnect.app). This delegate re-attaches the
/// original request's Authorization header to the redirected request so the
/// backend still sees the Bearer token.
private final class AuthPreservingRedirectDelegate: NSObject, URLSessionTaskDelegate {
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        var mutable = request
        if mutable.value(forHTTPHeaderField: "Authorization") == nil,
           let original = task.originalRequest?.value(forHTTPHeaderField: "Authorization") {
            mutable.setValue(original, forHTTPHeaderField: "Authorization")
        }
        completionHandler(mutable)
    }
}
