import XCTest
@testable import EKKOConnect

/// Pins Date.relativeShort bucket boundaries (chat/message timestamps) and the
/// 15-minute Date.isRecentlyActive window (the "active now" presence sparkle).
final class DateRelativeTests: XCTestCase {
    private func ago(_ seconds: TimeInterval) -> Date { Date().addingTimeInterval(-seconds) }

    func testRelativeShortBuckets() {
        XCTAssertEqual(ago(10).relativeShort, "now")        // < 60s
        XCTAssertEqual(ago(120).relativeShort, "2m")        // minutes
        XCTAssertEqual(ago(3 * 3600).relativeShort, "3h")   // hours
        XCTAssertEqual(ago(2 * 86400).relativeShort, "2d")  // days
        XCTAssertEqual(ago(2 * 604800).relativeShort, "2w") // weeks
        XCTAssertEqual(ago(2 * 2592000).relativeShort, "2mo") // months
    }

    func testIsRecentlyActiveWindow() {
        XCTAssertTrue(ago(5 * 60).isRecentlyActive)   // 5 min ago → active
        XCTAssertFalse(ago(20 * 60).isRecentlyActive) // 20 min ago → not
    }
}
