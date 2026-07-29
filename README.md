# Extension d’adresses — FireMap Louiseville

Cette extension ajoute une recherche d’adresses à FireMap sans copier Google Maps.

## Source utilisée

La recherche utilise **OpenStreetMap / Nominatim**. Elle est gratuite pour un usage interactif raisonnable. L’extension :

- limite les recherches à Louiseville;
- attend avant d’envoyer une requête;
- ne fait pas plus d’une requête par seconde;
- conserve les résultats déjà cherchés dans un cache local;
- affiche l’attribution OpenStreetMap;
- ne télécharge pas les adresses en masse.

Cette extension ne garantit pas que toutes les adresses civiles de Louiseville sont présentes. Pour un usage opérationnel, les adresses doivent être validées avec une source municipale ou gouvernementale officielle.

## Fichiers

- `address-search.js` : moteur de recherche.
- `address-search.css` : apparence sombre.
- `integration-firemap-v2.js` : code à ajouter à FireMap V2.
- `INSTALLATION.md` : étapes détaillées.
- `LICENSE-NOTICE.txt` : avis sur la source et l’attribution.

## Limite importante

Le serveur public Nominatim convient à une petite application et aux recherches manuelles. Il ne doit pas être utilisé pour télécharger toutes les adresses, faire des recherches automatiques massives ou envoyer un grand nombre de requêtes.

Pour un déploiement municipal à plusieurs utilisateurs, il faudra utiliser une instance dédiée ou importer un jeu de données officiel comme le Référentiel québécois des adresses.
