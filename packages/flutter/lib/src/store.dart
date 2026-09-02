import 'model.dart';

class MemoryStore {
  MemoryStore({this.subjectId = 'local-device', this.origin = 'flutter'});

  final String subjectId;
  final String origin;
  final List<Observation> _rows = [];

  List<Observation> get all => List.unmodifiable(_rows);
  List<Observation> get live => foldLog(_rows);

  Observation add(NewObservation input) {
    final now = DateTime.now().toUtc();
    final row = Observation(
      id: _id(),
      subjectId: subjectId,
      origin: origin,
      createdAt: now,
      occurredAt: input.occurredAt ?? now,
      location: input.location,
      type: input.type,
      quality: input.quality,
      intensity: input.intensity,
      note: input.note,
      contextTags: input.contextTags,
    );
    _rows.add(row);
    return row;
  }

  Observation edit(Observation prev, NewObservation patch) {
    final next = add(patch);
    final withLink = Observation(
      id: next.id,
      subjectId: prev.subjectId,
      origin: origin,
      createdAt: next.createdAt,
      occurredAt: patch.occurredAt ?? prev.occurredAt,
      location: patch.location,
      type: patch.type,
      quality: patch.quality,
      intensity: patch.intensity,
      note: patch.note,
      contextTags: patch.contextTags,
      supersedes: prev.id,
    );
    _rows[_rows.length - 1] = withLink;
    return withLink;
  }

  Observation remove(Observation prev) {
    final next = add(NewObservation(location: prev.location, type: prev.type));
    final tomb = Observation(
      id: next.id,
      subjectId: prev.subjectId,
      origin: origin,
      createdAt: next.createdAt,
      occurredAt: next.occurredAt,
      location: prev.location,
      type: prev.type,
      supersedes: prev.id,
      tombstone: true,
    );
    _rows[_rows.length - 1] = tomb;
    return tomb;
  }

  static String _id() {
    final ms = DateTime.now().toUtc().millisecondsSinceEpoch;
    final r = (ms * 1000 + DateTime.now().microsecond) & 0x7fffffff;
    return 'ht${ms.toRadixString(16)}${r.toRadixString(16)}'.padRight(26, '0').substring(0, 26);
  }
}
