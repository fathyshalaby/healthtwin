import 'package:flutter/material.dart';
import 'package:healthtwin/healthtwin.dart';

void main() => runApp(const HealthTwinApp());

class HealthTwinApp extends StatefulWidget {
  const HealthTwinApp({super.key});

  @override
  State<HealthTwinApp> createState() => _HealthTwinAppState();
}

class _HealthTwinAppState extends State<HealthTwinApp> {
  final store = MemoryStore(origin: 'flutter-demo');
  int tab = 0;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HealthTwin',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      home: Scaffold(
        appBar: AppBar(title: const Text('HealthTwin')),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (tab == 0) HealthTwinCapture(store: store) else HealthTwinReview(store: store),
          ],
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: tab,
          onDestinationSelected: (i) => setState(() => tab = i),
          destinations: const [
            NavigationDestination(icon: Icon(Icons.touch_app_outlined), label: 'Capture'),
            NavigationDestination(icon: Icon(Icons.map_outlined), label: 'Review'),
          ],
        ),
      ),
    );
  }
}
