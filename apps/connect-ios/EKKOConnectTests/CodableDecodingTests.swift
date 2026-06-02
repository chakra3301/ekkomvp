import XCTest
@testable import EKKOConnect

/// Pins the resilient Codable decoding on ConnectProfile — the custom init(from:)
/// uses try?-fallbacks on the JSON-column fields so a malformed/partial payload
/// degrades gracefully instead of failing the whole decode (silent data loss).
final class CodableDecodingTests: XCTestCase {
    func testConnectProfileDecodesMediaAndPrompts() throws {
        let json = """
        {"id":"p1","userId":"u1","headline":"Designer",
         "mediaSlots":[{"url":"https://x/clip.mp4","mediaType":"VIDEO","sortOrder":0},
                       {"url":"https://x/a.jpg","mediaType":"PHOTO","sortOrder":1,"title":"Cover"}],
         "prompts":[{"question":"Q","answer":"A"}]}
        """
        let p = try JSONDecoder().decode(ConnectProfile.self, from: Data(json.utf8))
        XCTAssertEqual(p.mediaSlots.count, 2)
        XCTAssertTrue(p.mediaSlots[0].isVideo)
        XCTAssertEqual(p.mediaSlots[1].title, "Cover")
        XCTAssertEqual(p.prompts.first?.question, "Q")
        XCTAssertEqual(p.headline, "Designer")
    }

    func testConnectProfileFallbacksWhenFieldsMissing() throws {
        // Only the two required fields present; everything else must fall back.
        let json = #"{"id":"p2","userId":"u2"}"#
        let p = try JSONDecoder().decode(ConnectProfile.self, from: Data(json.utf8))
        XCTAssertEqual(p.mediaSlots, [])
        XCTAssertEqual(p.prompts, [])
        XCTAssertEqual(p.likesReceivedCount, 0)
        XCTAssertEqual(p.matchesCount, 0)
        XCTAssertTrue(p.isActive)
        XCTAssertEqual(p.connectTier, .FREE)
    }

    func testMalformedMediaSlotsFallsBackToEmpty() throws {
        // mediaSlots present but the wrong shape (object, not array) → try? → [].
        let json = #"{"id":"p3","userId":"u3","mediaSlots":{"oops":true}}"#
        let p = try JSONDecoder().decode(ConnectProfile.self, from: Data(json.utf8))
        XCTAssertEqual(p.mediaSlots, [])
    }

    func testClientStatsRepeatKeyRename() throws {
        // ClientStats maps JSON "repeat" → repeatRate (reserved-word workaround).
        let json = #"{"hires":3,"repeat":"68%"}"#
        let s = try JSONDecoder().decode(ClientStats.self, from: Data(json.utf8))
        XCTAssertEqual(s.repeatRate, "68%")
        XCTAssertEqual(s.hires, 3)
    }
}
