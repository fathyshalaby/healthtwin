import 'dart:ui';

enum Side { left, right, central }

enum BodyView { anterior, posterior }

enum ObservationType { pain, stiffness, numbness, tingling, swelling, weakness, other }

enum Quality { sharp, dull, burning, throbbing, aching, stabbing, cramping }

class Location {
  const Location({
    required this.regionId,
    required this.side,
    required this.view,
    this.point,
  });

  final String regionId;
  final Side side;
  final BodyView view;
  final Offset? point;
}

class Observation {
  const Observation({
    required this.id,
    required this.subjectId,
    required this.origin,
    required this.occurredAt,
    required this.createdAt,
    required this.location,
    required this.type,
    this.quality,
    this.intensity,
    this.note,
    this.contextTags,
    this.taxonomyVersion = '1.1.0',
    this.supersedes,
    this.tombstone = false,
  });

  final String id;
  final String subjectId;
  final String origin;
  final DateTime occurredAt;
  final DateTime createdAt;
  final Location location;
  final ObservationType type;
  final List<Quality>? quality;
  final double? intensity;
  final String? note;
  final List<String>? contextTags;
  final String taxonomyVersion;
  final String? supersedes;
  final bool tombstone;
}

class NewObservation {
  const NewObservation({
    required this.location,
    required this.type,
    this.quality,
    this.intensity,
    this.note,
    this.contextTags,
    this.occurredAt,
  });

  final Location location;
  final ObservationType type;
  final List<Quality>? quality;
  final double? intensity;
  final String? note;
  final List<String>? contextTags;
  final DateTime? occurredAt;
}

/// Live rows: drop superseded ids and tombstones (same fold as @healthtwin/core).
List<Observation> foldLog(List<Observation> all) {
  final superseded = <String>{};
  for (final o in all) {
    final prev = o.supersedes;
    if (prev != null) superseded.add(prev);
  }
  return all.where((o) => !superseded.contains(o.id) && !o.tombstone).toList();
}
