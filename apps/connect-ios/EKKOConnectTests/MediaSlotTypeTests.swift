import XCTest
@testable import EKKOConnect

/// Pins MediaSlot.isVideo/isAudio/isModel detection — the heuristic that drives
/// which hero a deck/grid/profile card renders (video player vs poster vs image).
final class MediaSlotTypeTests: XCTestCase {
    private func slot(_ url: String, _ type: String) -> MediaSlot {
        MediaSlot(url: url, mediaType: type, sortOrder: 0)
    }

    func testVideoDetection() {
        XCTAssertTrue(slot("https://x/a.jpg", "VIDEO").isVideo)            // by mediaType
        XCTAssertTrue(slot("https://x/clip.mp4", "PHOTO").isVideo)         // by extension
        XCTAssertTrue(slot("https://x/clip.mp4?token=1", "PHOTO").isVideo) // ext + query string
        XCTAssertTrue(slot("https://x/video-123", "PHOTO").isVideo)        // by /video- path
        XCTAssertFalse(slot("https://x/a.jpg", "PHOTO").isVideo)
    }

    func testAudioDetection() {
        XCTAssertTrue(slot("https://x/track.mp3", "PHOTO").isAudio)
        XCTAssertTrue(slot("https://x/audio-9", "PHOTO").isAudio)
        XCTAssertTrue(slot("https://x/a.jpg", "AUDIO").isAudio)
        XCTAssertFalse(slot("https://x/a.jpg", "PHOTO").isAudio)
    }

    func testModelDetection() {
        XCTAssertTrue(slot("https://x/m.glb", "PHOTO").isModel)
        XCTAssertTrue(slot("https://x/m.usdz", "PHOTO").isModel)
        XCTAssertTrue(slot("https://x/model-1", "PHOTO").isModel)
        XCTAssertTrue(slot("https://x/a.jpg", "MODEL").isModel)
        XCTAssertFalse(slot("https://x/a.jpg", "PHOTO").isModel)
    }

    func testWithSortOrderPreservesMetadata() {
        let s = MediaSlot(url: "u", mediaType: "AUDIO", sortOrder: 0,
                          title: "T", coverUrl: "c", bpm: 120, key: "Abm")
        let moved = s.with(sortOrder: 3)
        XCTAssertEqual(moved.sortOrder, 3)
        XCTAssertEqual(moved.title, "T")
        XCTAssertEqual(moved.coverUrl, "c")
        XCTAssertEqual(moved.bpm, 120)
        XCTAssertEqual(moved.key, "Abm")
    }
}
