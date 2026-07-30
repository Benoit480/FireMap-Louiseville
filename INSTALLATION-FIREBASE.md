# Activation Firebase — FireMap Louiseville

Le projet est déjà configuré pour :

- Projet Firebase : `firemap-louiseville`
- Collection Firestore : `bornes`
- Authentification : anonyme
- Hébergement de l'application : GitHub Pages

## 1. Publier les règles Firestore

Dans Firebase Console :

1. Ouvrir **Firestore**.
2. Ouvrir l'onglet **Règles**.
3. Remplacer le contenu par celui du fichier `firestore.rules`.
4. Appuyer sur **Publier**.

Ces règles autorisent uniquement les appareils connectés par Firebase Authentication anonyme à lire et modifier la collection `bornes`.

## 2. Vérifier le domaine autorisé

Dans Firebase Console :

1. Ouvrir **Authentication**.
2. Ouvrir **Paramètres**.
3. Ouvrir **Domaines autorisés**.
4. Ajouter `benoit480.github.io` s'il n'est pas déjà présent.

## 3. Mettre le projet sur GitHub

Téléverser tous les fichiers de ce dossier à la racine du dépôt GitHub Pages, en remplaçant les anciennes versions.

Fichiers essentiels :

- `index.html`
- `app.js`
- `styles.css`
- `firebase-config.js`
- `firebase-sync.js`
- `service-worker.js`
- `firestore.rules` (ce fichier sert dans la console Firebase, GitHub ne l'applique pas automatiquement)

## 4. Premier démarrage

1. Attendre quelques minutes après le téléversement GitHub.
2. Ouvrir FireMap dans Safari.
3. L'indicateur sous le logo doit passer de **Connexion…** à **Synchronisé**.
4. Les bornes déjà enregistrées localement sur cet appareil seront envoyées une seule fois vers Firestore.
5. Ouvrir FireMap sur un deuxième appareil : les mêmes bornes doivent apparaître.

## Cache iPhone

Si l'ancienne version reste visible :

1. Supprimer FireMap de l'écran d'accueil.
2. Fermer Safari.
3. Rouvrir le site GitHub Pages.
4. Réinstaller avec **Partager → Sur l'écran d'accueil**.

## Photos

Les informations des bornes sont partagées par Firestore. Les photos demeurent enregistrées localement pour éviter la limite de taille des documents Firestore et l'activation de Firebase Storage.
