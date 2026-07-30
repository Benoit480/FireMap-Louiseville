# FireMap V14 — Synchronisation des bâtiments

Cette version corrige la persistance et la synchronisation des bâtiments à risque.

- sauvegarde immédiate dans le stockage local de l'appareil;
- synchronisation Firestore dans la collection `batiments`;
- reprise automatique des écritures en attente après une perte de réseau;
- migration automatique des bâtiments créés localement avant la correction;
- modifications et suppressions propagées entre les appareils;
- les bornes et la navigation V13 restent inchangées.

## Règles Firebase à publier

Copiez le contenu de `firestore.rules` dans Firebase Console > Firestore Database > Règles, puis cliquez sur **Publier**.
