import 'package:flutter/material.dart';

import 'body_map.dart';
import 'geometry.dart';
import 'model.dart';
import 'store.dart';

const _types = ObservationType.values;
const _qualities = Quality.values;

/// Drop-in capture surface: body figure + bottom sheet + live entries.
class HealthTwinCapture extends StatefulWidget {
  const HealthTwinCapture({super.key, required this.store, this.height = 360});

  final MemoryStore store;
  final double height;

  @override
  State<HealthTwinCapture> createState() => _HealthTwinCaptureState();
}

class _HealthTwinCaptureState extends State<HealthTwinCapture> {
  BodyView _view = BodyView.anterior;
  Shape? _selected;

  MemoryStore get store => widget.store;

  Future<void> _open(Shape shape) async {
    setState(() => _selected = shape);
    final draft = await showModalBottomSheet<NewObservation>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => _EntrySheet(shape: shape, view: _view),
    );
    if (draft != null) {
      store.add(draft);
      setState(() => _selected = null);
    } else {
      setState(() => _selected = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    final live = store.live;
    return Column(
      children: [
        SegmentedButton<BodyView>(
          segments: const [
            ButtonSegment(value: BodyView.anterior, label: Text('Front')),
            ButtonSegment(value: BodyView.posterior, label: Text('Back')),
          ],
          selected: {_view},
          onSelectionChanged: (s) => setState(() {
            _view = s.first;
            _selected = null;
          }),
        ),
        const SizedBox(height: 8),
        BodyMap(
          view: _view,
          selectedKey: _selected?.key,
          height: widget.height,
          onSelect: (shape, _) => _open(shape),
        ),
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerLeft,
          child: Text('Entries ${live.length}', style: Theme.of(context).textTheme.titleMedium),
        ),
        if (live.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Text('No entries yet. Tap a region on the body map to log the first one.'),
          )
        else
          ...live.map(
            (o) => ListTile(
              title: Text(o.location.regionId.replaceAll('_', ' ')),
              subtitle: Text(
                [
                  o.type.name,
                  if (o.intensity != null) '${o.intensity!.toStringAsFixed(0)}/10',
                ].join(' · '),
              ),
              trailing: IconButton(
                icon: const Icon(Icons.delete_outline),
                onPressed: () => setState(() => store.remove(o)),
              ),
            ),
          ),
      ],
    );
  }
}

class _EntrySheet extends StatefulWidget {
  const _EntrySheet({required this.shape, required this.view});
  final Shape shape;
  final BodyView view;

  @override
  State<_EntrySheet> createState() => _EntrySheetState();
}

class _EntrySheetState extends State<_EntrySheet> {
  ObservationType _type = ObservationType.pain;
  final _quality = <Quality>{};
  double _intensity = 5;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 16,
        bottom: 20 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.shape.label, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          DropdownButton<ObservationType>(
            value: _type,
            isExpanded: true,
            items: _types
                .map((t) => DropdownMenuItem(value: t, child: Text(t.name)))
                .toList(),
            onChanged: (v) => setState(() => _type = v ?? _type),
          ),
          Wrap(
            spacing: 8,
            children: _qualities
                .map(
                  (q) => FilterChip(
                    label: Text(q.name),
                    selected: _quality.contains(q),
                    onSelected: (v) => setState(() {
                      if (v) {
                        _quality.add(q);
                      } else {
                        _quality.remove(q);
                      }
                    }),
                  ),
                )
                .toList(),
          ),
          Slider(value: _intensity, min: 0, max: 10, divisions: 10, label: '${_intensity.round()}', onChanged: (v) => setState(() => _intensity = v)),
          FilledButton(
            onPressed: () {
              Navigator.pop(
                context,
                NewObservation(
                  location: Location(
                    regionId: widget.shape.regionId,
                    side: widget.shape.side,
                    view: widget.view,
                  ),
                  type: _type,
                  quality: _quality.isEmpty ? null : _quality.toList(),
                  intensity: _intensity,
                ),
              );
            },
            child: const Text('Save'),
          ),
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ],
      ),
    );
  }
}
