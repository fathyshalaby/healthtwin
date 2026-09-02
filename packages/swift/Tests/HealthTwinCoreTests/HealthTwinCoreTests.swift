import XCTest
@testable import HealthTwinCore

final class HealthTwinCoreTests: XCTestCase {
    func testHitTestLeftKnee() {
        let hit = hitTest(x: 87, y: 272, view: .anterior)
        XCTAssertEqual(hit?.label, "Left Knee")
        XCTAssertEqual(hit?.regionId, "knee")
        XCTAssertEqual(hit?.side, .left)
    }

    func testHitTestLowerBack() {
        let hit = hitTest(x: 100, y: 144, view: .posterior)
        XCTAssertEqual(hit?.label, "Lower Back")
    }

    func testFoldLogTombstone() {
        let store = MemoryStore()
        let a = store.add(NewObservation(
            location: Location(regionId: "knee", side: .left, view: .anterior),
            type: .pain,
            intensity: 6
        ))
        XCTAssertEqual(store.live.count, 1)
        store.remove(a)
        XCTAssertEqual(store.live.count, 0)
    }

    func testHeatmapMeanIntensity() {
        let store = MemoryStore()
        let loc = Location(regionId: "knee", side: .left, view: .anterior)
        store.add(NewObservation(location: loc, type: .pain, intensity: 4))
        store.add(NewObservation(location: loc, type: .pain, intensity: 8))
        let h = computeHeatmap(store.live, metric: .meanIntensity)
        XCTAssertEqual(h["knee:left:anterior"], 6)
    }
}
