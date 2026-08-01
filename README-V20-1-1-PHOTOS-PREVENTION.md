# FireMap V20.1.1 — Photos par catégorie

Chaque élément vérifié et chaque risque particulier possède maintenant :

- 📷 **Prendre une photo** avec la caméra arrière;
- 🖼️ **Importer** une ou plusieurs images;
- aperçu des photos;
- suppression d’une photo;
- synchronisation dans Firebase Storage;
- liens enregistrés dans le document Firestore `prevention` du bâtiment.

## Configuration obligatoire

1. Dans Firebase, ouvrez **Storage** et activez-le si ce n’est pas déjà fait.
2. Dans **Storage → Rules**, copiez le contenu de `storage.rules`, puis publiez.
3. Les règles Firestore existantes demeurent valides.
4. Remplacez les fichiers GitHub et rechargez l’application.

Les photos sont compressées automatiquement lorsqu’elles sont volumineuses afin de réduire le temps de téléversement.
