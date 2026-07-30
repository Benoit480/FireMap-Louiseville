# Module d’adresses de Louiseville

Le fichier contient **5218 adresses officielles** avec coordonnées GPS.

## Installation

1. Copie le dossier `assets/data` dans ton projet Flutter.
2. Copie les dossiers `lib/models`, `lib/services` et `lib/screens`.
3. Ajoute le contenu de `PUBSPEC_A_AJOUTER.txt` dans ton `pubspec.yaml`.
4. Dans le terminal du projet, exécute :

```bash
flutter pub get
```

5. Utilise le code de `EXEMPLE_BOUTON.txt` sur ton bouton GPS/adresses.

## Fonctionnement

- Recherche sans tenir compte des accents ni des majuscules.
- Une recherche comme `192 notre dame` trouve l’adresse correspondante.
- Le bouton **Départ** ouvre Apple Plans sur iPhone et Google Maps sur Android.
- Les données restent dans l’application : aucune lecture Firestore et aucun coût de recherche.
