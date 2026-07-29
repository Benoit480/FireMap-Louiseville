# Installation sur GitHub — iPhone

## 1. Ajouter les deux fichiers

Dans ton dépôt `FireMap-Louiseville`, téléverse à la racine :

- `address-search.js`
- `address-search.css`

## 2. Modifier index.html

Dans `<head>`, juste après :

```html
<link rel="stylesheet" href="./styles.css">
```

ajoute :

```html
<link rel="stylesheet" href="./address-search.css">
```

À la fin du fichier, juste après :

```html
<script src="./app.js"></script>
```

ajoute :

```html
<script src="./address-search.js"></script>
```

## 3. Modifier app.js

Juste après la ligne qui crée la carte :

```javascript
const map=L.map("map",{zoomControl:false}).setView(defaultCenter,14);
```

ajoute :

```javascript
window.map = map;
```

À la toute fin de `app.js`, colle le contenu du fichier :

```text
integration-firemap-v2.js
```

## 4. Mettre à jour le service worker

Dans la liste `CORE` de `service-worker.js`, ajoute :

```javascript
"./address-search.js",
"./address-search.css",
```

Change aussi le nom du cache, par exemple :

```javascript
const CACHE="firemap-louiseville-v2-2";
```

Cela forcera l’iPhone à télécharger la nouvelle version.

## 5. Enregistrer

Clique sur `Commit changes`.

Attends de 2 à 5 minutes, puis ouvre l’adresse GitHub Pages.

## 6. Rafraîchir l’application installée

Si l’ancienne version demeure affichée :

1. supprime l’icône FireMap de l’écran d’accueil;
2. ouvre l’adresse GitHub Pages dans Safari;
3. recharge la page;
4. fais `Partager > Sur l’écran d’accueil`.

## Utilisation

Tape au moins trois caractères dans la barre de recherche, par exemple :

```text
Notre-Dame
```

ou :

```text
105 Saint-Laurent
```

Choisis ensuite une adresse. La carte se déplacera automatiquement et la fenêtre d’ajout d’une borne s’ouvrira à cet emplacement.
