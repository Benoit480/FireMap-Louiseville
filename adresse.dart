class Adresse {
  const Adresse({
    required this.id,
    required this.numero,
    required this.suffixe,
    required this.adresse,
    required this.codePostal,
    required this.latitude,
    required this.longitude,
    required this.recherche,
  });

  final String id;
  final String? numero;
  final String? suffixe;
  final String adresse;
  final String? codePostal;
  final double latitude;
  final double longitude;
  final String recherche;

  factory Adresse.fromJson(Map<String, dynamic> json) {
    return Adresse(
      id: json['id'] as String,
      numero: json['numero'] as String?,
      suffixe: json['suffixe'] as String?,
      adresse: json['adresse'] as String,
      codePostal: json['codePostal'] as String?,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      recherche: json['recherche'] as String,
    );
  }
}
