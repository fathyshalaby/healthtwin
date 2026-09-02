import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:healthtwin/healthtwin.dart';

void main() {
  test('hitTest finds Left Knee at its centroid', () {
    final hit = hitTest(const Offset(87, 272), BodyView.anterior);
    expect(hit, isNotNull);
    expect(hit!.label, 'Left Knee');
    expect(hit.regionId, 'knee');
    expect(hit.side, Side.left);
  });

  test('hitTest finds Lower Back on posterior', () {
    final hit = hitTest(const Offset(100, 144), BodyView.posterior);
    expect(hit, isNotNull);
    expect(hit!.label, 'Lower Back');
  });

  test('foldLog drops tombstones and superseded rows', () {
    final store = MemoryStore();
    final a = store.add(const NewObservation(
      location: Location(regionId: 'knee', side: Side.left, view: BodyView.anterior),
      type: ObservationType.pain,
      intensity: 6,
    ));
    expect(store.live, hasLength(1));
    store.remove(a);
    expect(store.live, isEmpty);
  });

  test('heatmap groups by region key', () {
    final store = MemoryStore();
    store.add(const NewObservation(
      location: Location(regionId: 'knee', side: Side.left, view: BodyView.anterior),
      type: ObservationType.pain,
      intensity: 4,
    ));
    store.add(const NewObservation(
      location: Location(regionId: 'knee', side: Side.left, view: BodyView.anterior),
      type: ObservationType.pain,
      intensity: 8,
    ));
    final h = computeHeatmap(store.live, metric: HeatmapMetric.meanIntensity);
    expect(h['knee:left:anterior'], 6);
  });

  testWidgets('tapping the left-knee centroid logs an entry', (tester) async {
    final store = MemoryStore();
    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(child: HealthTwinCapture(store: store, height: 400)),
        ),
      ),
    );
    await tester.pumpAndSettle();

    final map = tester.getRect(find.byType(BodyMap));
    // viewBox 200×400 mapped onto the BodyMap box; knee centroid (87, 272).
    final tap = Offset(map.left + map.width * (87 / 200), map.top + map.height * (272 / 400));
    await tester.tapAt(tap);
    await tester.pumpAndSettle();

    expect(find.text('Left Knee'), findsOneWidget);
    await tester.tap(find.widgetWithText(FilledButton, 'Save'));
    await tester.pumpAndSettle();

    expect(store.live, hasLength(1));
    expect(store.live.first.location.regionId, 'knee');
    expect(find.textContaining('knee'), findsWidgets);
  });
}
