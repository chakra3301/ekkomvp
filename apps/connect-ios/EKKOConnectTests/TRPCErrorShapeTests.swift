import XCTest
@testable import EKKOConnect

/// Pins TRPCClient.extractErrorMessage parsing of the known tRPC error shapes.
/// These strings are what surface in user-facing error toasts, so a regression
/// here silently degrades every error message in the app.
final class TRPCErrorShapeTests: XCTestCase {
    private func parse(_ json: String) -> String? {
        let obj = try! JSONSerialization.jsonObject(with: Data(json.utf8))
        let client = TRPCClient(baseURL: URL(string: "https://example.com")!)
        return client.extractErrorMessage(from: obj)
    }

    func testFlatErrorMessage() {
        XCTAssertEqual(parse(#"{"error":{"message":"Bad"}}"#), "Bad")
    }

    func testNestedJsonMessage() {
        XCTAssertEqual(parse(#"{"error":{"json":{"message":"Nested"}}}"#), "Nested")
    }

    func testTopLevelMessage() {
        XCTAssertEqual(parse(#"{"message":"Top"}"#), "Top")
    }

    func testNoMessageReturnsNil() {
        XCTAssertNil(parse(#"{"foo":1}"#))
    }

    func testRecursiveDiveFindsNestedMessage() {
        XCTAssertEqual(parse(#"{"a":{"b":{"message":"Deep"}}}"#), "Deep")
    }
}
