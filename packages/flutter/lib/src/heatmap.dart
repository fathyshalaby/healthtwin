import 'model.dart';

enum HeatmapMetric { frequency, meanIntensity, recency }

Map<String, double> computeHeatmap(
  List<Observation> current, {
  HeatmapMetric metric = HeatmapMetric.frequency,
  DateTime? from,
}) {
  final rows = current.where((o) {
    if (from != null && o.occurredAt.isBefore(from)) return false;
    return true;
  });
  final groups = <String, List<Observation>>{};
  for (final o in rows) {
    final k = '${o.location.regionId}:${o.location.side.name}:${o.location.view.name}';
    groups.putIfAbsent(k, () => []).add(o);
  }
  final out = <String, double>{};
  for (final e in groups.entries) {
    final obs = e.value;
    if (metric == HeatmapMetric.frequency) {
      out[e.key] = obs.length.toDouble();
    } else if (metric == HeatmapMetric.meanIntensity) {
      final vals = obs.map((o) => o.intensity).whereType<double>().toList();
      if (vals.isNotEmpty) {
        out[e.key] = vals.reduce((a, b) => a + b) / vals.length;
      }
    } else {
      out[e.key] = obs
          .map((o) => o.occurredAt.millisecondsSinceEpoch.toDouble())
          .reduce((a, b) => a > b ? a : b);
    }
  }
  return out;
}
