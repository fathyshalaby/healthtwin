import XCTest
@testable import HealthTwinCore

final class HealthTwinCoreTests: XCTestCase {
    func testHitTestLeftKnee() {
        let hit = hitTest(x: 88, y: 267, view: .anterior)
        XCTAssertEqual(hit?.label, "Left Knee")
        XCTAssertEqual(hit?.regionId, "knee")
        XCTAssertEqual(hit?.side, .left)
    }

    func testHitTestLowerBack() {
        let hit = hitTest(x: 100, y: 144, view: .posterior)
        XCTAssertEqual(hit?.label, "Lower Back")
    }

    // ── hit-testing: the same cases as packages/bodymap-core/src/hittest.test.ts ──

    func testEveryRegionCentreResolvesToItself() {
        for view in [BodyView.anterior, BodyView.posterior] {
            for s in shapes(for: view) {
                let cx: Double
                let cy: Double
                switch s.primitive {
                case let .ellipse(ex, ey, _, _):
                    cx = ex
                    cy = ey
                case let .roundedRect(x, y, w, h, _):
                    cx = x + w / 2
                    cy = y + h / 2
                }
                XCTAssertEqual(hitTest(x: cx, y: cy, view: view)?.key, s.key, "\(view) \(s.label)")
            }
        }
    }

    func testTapInsideLeftKneeIsLeftKnee() {
        // inside the left knee, but within the right knee's padded zone — used to return the right knee
        XCTAssertEqual(hitTest(x: 95, y: 272, view: .anterior)?.label, "Left Knee")
        XCTAssertEqual(hitTest(x: 105, y: 272, view: .anterior)?.label, "Right Knee")
    }

    func testShoulderCentreIsShoulder() {
        XCTAssertEqual(hitTest(x: 132, y: 91, view: .anterior)?.label, "Right Shoulder")
        XCTAssertEqual(hitTest(x: 68, y: 91, view: .anterior)?.label, "Left Shoulder")
    }

    func testVisibleOverlapGoesToTopmost() {
        XCTAssertEqual(hitTest(x: 121, y: 91, view: .anterior)?.label, "Chest") // inside the shoulder cap AND the chest
    }

    func testNearMissesGoToTheNearestRegion() {
        XCTAssertEqual(hitTest(x: 74, y: 267, view: .anterior)?.label, "Left Knee") // just off the knee's outer edge
        XCTAssertEqual(hitTest(x: 47, y: 205, view: .anterior)?.label, "Left Hand") // 3 off the hand
        XCTAssertEqual(hitTest(x: 50 - hitPad, y: 205, view: .anterior)?.label, "Left Hand")
        XCTAssertNil(hitTest(x: 50 - hitPad - 0.5, y: 205, view: .anterior))
        XCTAssertNil(hitTest(x: 5, y: 5, view: .anterior))
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
