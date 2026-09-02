import 'package:flutter/material.dart';

import 'body_map.dart';
import 'geometry.dart';
import 'heatmap.dart';
import 'model.dart';
import 'store.dart';

class HealthTwinReview extends StatelessWidget {
  const HealthTwinReview({super.key, required this.store, this.height = 360});

  final MemoryStore store;
  final double height;

  @override
  Widget build(BuildContext context) {
    return _Review(store: store, height: height);
  }
}

class _Review extends StatefulWidget {
  const _Review({required this.store, required this.height});
  final MemoryStore store;
  final double height;

  @override
  State<_Review> createState() => _ReviewState();
}

class _ReviewState extends State<_Review> {
  BodyView _view = BodyView.anterior;
  HeatmapMetric _metric = HeatmapMetric.frequency;

  @override
  Widget build(BuildContext context) {
    final live = widget.store.live;
    final heat = computeHeatmap(live, metric: _metric);
    final shade = shadingFor(heat);
    return Column(
      children: [
        SegmentedButton<BodyView>(
          segments: const [
            ButtonSegment(value: BodyView.anterior, label: Text('Front')),
            ButtonSegment(value: BodyView.posterior, label: Text('Back')),
          ],
          selected: {_view},
          onSelectionChanged: (s) => setState(() => _view = s.first),
        ),
        const SizedBox(height: 8),
        SegmentedButton<HeatmapMetric>(
          segments: const [
            ButtonSegment(value: HeatmapMetric.frequency, label: Text('Freq')),
            ButtonSegment(value: HeatmapMetric.meanIntensity, label: Text('Intensity')),
          ],
          selected: {_metric},
          onSelectionChanged: (s) => setState(() => _metric = s.first),
        ),
        BodyMap(view: _view, shading: shade, height: widget.height, onSelect: (_, __) {}),
        const SizedBox(height: 12),
        if (live.isEmpty)
          const Text('No entries yet.')
        else
          ...live.map(
            (o) => ListTile(
              title: Text('${o.location.regionId} · ${o.type.name}'),
              subtitle: Text(o.occurredAt.toIso8601String().substring(0, 10)),
            ),
          ),
      ],
    );
  }
}
