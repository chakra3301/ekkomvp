import Foundation

/// A "note" sent from one user to another via the Hire template's
/// "Book a call" CTA, the Client template's "Apply now" CTA, or any
/// future generic-note path. Lives separately from chat so the recipient
/// reviews the request before it becomes a chat thread.
struct ConnectInquiry: Codable, Identifiable {
    let id: String
    let fromUserId: String
    let toUserId: String
    let type: ConnectInquiryType
    /// Mutable so the inbox can flip status optimistically after
    /// accept/decline before the server roundtrip lands.
    var status: ConnectInquiryStatus
    /// Free-form payload — shape depends on `type`. Decoded lazily into
    /// the typed structs below via the convenience accessors.
    let payload: InquiryPayloadAny
    let preview: String
    /// Mutable so the inbox can mark a row read without re-fetching.
    var readAt: Date?
    let createdAt: Date

    var fromUser: UserWithProfile?

    /// True when the recipient hasn't opened the inquiry yet.
    var isUnread: Bool { readAt == nil }

    /// Decoded booking payload, or nil if the inquiry isn't a booking.
    var booking: BookingInquiryPayload? {
        guard type == .BOOKING_REQUEST else { return nil }
        return try? payload.decode(as: BookingInquiryPayload.self)
    }

    /// Decoded application payload, or nil if the inquiry isn't one.
    var application: ApplicationInquiryPayload? {
        guard type == .APPLICATION else { return nil }
        return try? payload.decode(as: ApplicationInquiryPayload.self)
    }

    /// Decoded generic note payload.
    var note: NoteInquiryPayload? {
        guard type == .NOTE else { return nil }
        return try? payload.decode(as: NoteInquiryPayload.self)
    }
}

enum ConnectInquiryType: String, Codable {
    case BOOKING_REQUEST
    case APPLICATION
    case NOTE
}

enum ConnectInquiryStatus: String, Codable {
    case PENDING
    case ACCEPTED
    case DECLINED
}

// MARK: - Per-type payloads
//
// Mirrors the Zod schemas on the server. The Codable round-trip handles
// JSON ⇄ struct via the `InquiryPayloadAny` wrapper since the field
// shape is type-dependent.

struct BookingInquiryPayload: Codable, Equatable {
    var projectType: String?
    var budget: String?
    var timeline: String?
    var message: String
    var link: String?
}

struct ApplicationInquiryPayload: Codable, Equatable {
    var briefIndex: Int?
    var briefTitle: String?
    var message: String
    var link: String?
}

struct NoteInquiryPayload: Codable, Equatable {
    var message: String
}

// MARK: - Type-erased payload
//
// Server returns the payload as opaque JSON. We decode it as a raw value
// here and lazily re-decode into the typed struct at use site. Keeps
// ConnectInquiry decodable without knowing the type ahead of time.

struct InquiryPayloadAny: Codable {
    let json: Data

    init(from decoder: Decoder) throws {
        // Re-encode the whole container value to raw JSON so we can
        // re-decode into a typed struct later. Goes through JSONSerialization
        // because Codable doesn't expose the raw container bytes directly.
        let container = try decoder.singleValueContainer()
        let any = try container.decode(JSONValue.self)
        self.json = try JSONEncoder().encode(any)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        let value = try JSONDecoder().decode(JSONValue.self, from: json)
        try container.encode(value)
    }

    func decode<T: Decodable>(as type: T.Type) throws -> T {
        try JSONDecoder().decode(T.self, from: json)
    }
}

/// Recursive Codable JSON value used to round-trip arbitrary payloads
/// without losing types between decode/encode.
indirect enum JSONValue: Codable {
    case string(String)
    case int(Int)
    case double(Double)
    case bool(Bool)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if c.decodeNil()                            { self = .null;                return }
        if let v = try? c.decode(Bool.self)         { self = .bool(v);             return }
        if let v = try? c.decode(Int.self)          { self = .int(v);              return }
        if let v = try? c.decode(Double.self)       { self = .double(v);           return }
        if let v = try? c.decode(String.self)       { self = .string(v);           return }
        if let v = try? c.decode([JSONValue].self)  { self = .array(v);            return }
        if let v = try? c.decode([String: JSONValue].self) { self = .object(v);    return }
        throw DecodingError.typeMismatch(
            JSONValue.self,
            .init(codingPath: c.codingPath, debugDescription: "Unknown JSON value")
        )
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .null:           try c.encodeNil()
        case .bool(let v):    try c.encode(v)
        case .int(let v):     try c.encode(v)
        case .double(let v):  try c.encode(v)
        case .string(let v):  try c.encode(v)
        case .array(let v):   try c.encode(v)
        case .object(let v):  try c.encode(v)
        }
    }
}

// MARK: - Mutation inputs

struct SendInquiryInput: Codable {
    let toUserId: String
    let type: ConnectInquiryType
    let payload: JSONValue
}

struct InquiriesResult: Codable {
    let inquiries: [ConnectInquiry]
    let nextCursor: String?
}
