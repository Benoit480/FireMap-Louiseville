import 'dart:io';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../models/adresse.dart';
import '../services/adresse_service.dart';

class RechercheAdressePage extends StatefulWidget {
  const RechercheAdressePage({super.key});

  @override
  State<RechercheAdressePage> createState() => _RechercheAdressePageState();
}

class _RechercheAdressePageState extends State<RechercheAdressePage> {
  final _controleur = TextEditingController();
  List<Adresse> _resultats = const [];
  bool _chargement = false;

  @override
  void dispose() {
    _controleur.dispose();
    super.dispose();
  }

  Future<void> _rechercher(String texte) async {
    if (texte.trim().isEmpty) {
      setState(() => _resultats = const []);
      return;
    }

    setState(() => _chargement = true);
    final resultats = await AdresseService.instance.rechercher(texte);

    if (!mounted) return;
    setState(() {
      _resultats = resultats;
      _chargement = false;
    });
  }

  Future<void> _ouvrirNavigation(Adresse adresse) async {
    final lat = adresse.latitude;
    final lng = adresse.longitude;

    final Uri destination;
    if (Platform.isIOS) {
      destination = Uri.parse(
        'https://maps.apple.com/?daddr=$lat,$lng&dirflg=d',
      );
    } else {
      destination = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng'
        '&travelmode=driving',
      );
    }

    if (!await launchUrl(
      destination,
      mode: LaunchMode.externalApplication,
    )) {
      throw Exception('Impossible d’ouvrir la navigation.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Adresse d’intervention')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _controleur,
              autofocus: true,
              onChanged: _rechercher,
              decoration: InputDecoration(
                labelText: 'Numéro et rue',
                hintText: 'Ex. 192 Notre-Dame',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _controleur.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _controleur.clear();
                          _rechercher('');
                        },
                      ),
                border: const OutlineInputBorder(),
              ),
            ),
          ),
          if (_chargement) const LinearProgressIndicator(),
          Expanded(
            child: _resultats.isEmpty
                ? const Center(
                    child: Text(
                      'Commence à écrire une adresse de Louiseville.',
                    ),
                  )
                : ListView.separated(
                    itemCount: _resultats.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final adresse = _resultats[index];
                      return ListTile(
                        leading: const Icon(Icons.location_on),
                        title: Text(adresse.adresse),
                        subtitle: Text(
                          '${adresse.latitude.toStringAsFixed(6)}, '
                          '${adresse.longitude.toStringAsFixed(6)}',
                        ),
                        trailing: FilledButton.icon(
                          onPressed: () => _ouvrirNavigation(adresse),
                          icon: const Icon(Icons.navigation),
                          label: const Text('Départ'),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
