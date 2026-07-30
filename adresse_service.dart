import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;
import '../models/adresse.dart';

class AdresseService {
  AdresseService._();

  static final AdresseService instance = AdresseService._();

  List<Adresse>? _cache;

  Future<List<Adresse>> charger() async {
    if (_cache != null) return _cache!;

    final texte = await rootBundle.loadString(
      'assets/data/louiseville_adresses.json',
    );
    final donnees = jsonDecode(texte) as List<dynamic>;

    _cache = donnees
        .map((item) => Adresse.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);

    return _cache!;
  }

  String normaliser(String valeur) {
    const accents = 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ';
    const simples = 'aaaaaaceeeeiiiinooooouuuuyyoea';

    var resultat = valeur.toLowerCase();
    for (var i = 0; i < accents.length; i++) {
      resultat = resultat.replaceAll(accents[i], simples[i]);
    }

    return resultat
        .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  Future<List<Adresse>> rechercher(
    String requete, {
    int limite = 30,
  }) async {
    final toutes = await charger();
    final termes = normaliser(requete)
        .split(' ')
        .where((mot) => mot.isNotEmpty)
        .toList();

    if (termes.isEmpty) return const [];

    final resultats = toutes.where((adresse) {
      return termes.every(adresse.recherche.contains);
    }).take(limite).toList();

    resultats.sort((a, b) {
      final aCommence = a.recherche.startsWith(termes.first) ? 0 : 1;
      final bCommence = b.recherche.startsWith(termes.first) ? 0 : 1;
      final comparaison = aCommence.compareTo(bCommence);
      return comparaison != 0
          ? comparaison
          : a.adresse.compareTo(b.adresse);
    });

    return resultats;
  }
}
