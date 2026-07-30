# Application Pompiers Louiseville — Version 1

Cette version contient :

- Recherche instantanée parmi **5218 adresses officielles**;
- Carte OpenStreetMap;
- Affichage automatique du fichier de bornes-fontaines déjà présent dans le dépôt;
- Calcul de la borne la plus proche d'une adresse;
- Bouton **DÉPART** vers Apple Plans sur iPhone ou Google Maps sur Android;
- Localisation de l'utilisateur;
- Installation sur l'écran d'accueil;
- Mise en cache PWA.

## Installation dans GitHub

1. Garde une copie de tes fichiers actuels.
2. Téléverse les fichiers de ce dossier à la racine de ton dépôt.
3. Accepte le remplacement de :
   - `index.html`
   - `app.js`
   - `styles.css`
   - `manifest.webmanifest`
   - `service-worker.js`
4. Téléverse aussi `louiseville_adresses.json`.
5. Ne supprime pas :
   - `firebase-config.js`
   - `firebase-sync.js`
   - ton fichier GeoJSON de bornes-fontaines;
   - tes icônes PNG.
6. Fais le commit.
7. Attends le redéploiement Firebase/GitHub, puis recharge avec `Ctrl + F5`.

## Fichier de bornes-fontaines reconnu

L'application essaie automatiquement ces noms :

- `firemap-2026-07-30 2.geojson`
- `firemap-2026-07-30.geojson`
- `bornes-fontaines.geojson`

Ton fichier actuel `firemap-2026-07-30 2.geojson` devrait donc être chargé automatiquement.

## Important

Les fichiers `.dart` et `PUBSPEC_A_AJOUTER.txt` ne servent pas dans ton application actuelle, car ton projet est une application Web HTML/JavaScript, et non une application Flutter.
Tu peux les laisser dans GitHub, mais ils ne seront pas utilisés.
