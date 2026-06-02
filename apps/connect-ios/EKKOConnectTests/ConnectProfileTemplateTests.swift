import XCTest
@testable import EKKOConnect

/// Pins ConnectProfileTemplate.selectableForSignup(role:) (drives the signup
/// theme picker) and .from(_:) raw→enum fallback.
final class ConnectProfileTemplateTests: XCTestCase {
    func testSelectableForClientRole() {
        let t = ConnectProfileTemplate.selectableForSignup(role: .CLIENT)
        XCTAssertEqual(t, [.default, .hero, .editorial, .stack, .split])
    }

    func testSelectableForCreativeRoleExcludesHireAndClient() {
        let t = ConnectProfileTemplate.selectableForSignup(role: .CREATIVE)
        XCTAssertEqual(t.count, 10)
        XCTAssertFalse(t.contains(.hire))
        XCTAssertFalse(t.contains(.client))
        XCTAssertTrue(t.contains(.terminal))
        XCTAssertTrue(t.contains(.threeD))
    }

    func testSelectableForNilRoleMatchesCreative() {
        XCTAssertEqual(ConnectProfileTemplate.selectableForSignup(role: nil),
                       ConnectProfileTemplate.selectableForSignup(role: .CREATIVE))
    }

    func testFromRawFallsBackToDefault() {
        XCTAssertEqual(ConnectProfileTemplate.from("HERO"), .hero)
        XCTAssertEqual(ConnectProfileTemplate.from("NONSENSE"), .default)
        XCTAssertEqual(ConnectProfileTemplate.from(nil), .default)
    }
}
