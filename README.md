# FireMap Louiseville V3 Pro

Version Web/PWA professionnelle pour GitHub Pages.

## Nouveautés V3 Pro
- Débits en gallons par minute (GPM)
- Recherche de bornes et d'adresses de Louiseville
- Recherche d'adresses via le géocodeur officiel du gouvernement du Québec
- Mode intervention avec borne disponible la plus proche
- Distance approximative entre l'intervention et la borne
- Rayon de couverture de 300 mètres
- Propriété municipale ou privée
- Couleur, dégagement, essai de débit et prochaine inspection
- Photos, import/export GeoJSON et sauvegarde locale
- Thème sombre noir et rouge
- Installation sur iPhone comme PWA

## Installation GitHub Pages
1. Décompresser le ZIP.
2. Remplacer tous les fichiers de l'ancien dépôt par ceux-ci.
3. Conserver Settings > Pages > main > /(root).
4. Attendre 2 à 5 minutes.
5. Ouvrir le site dans Safari et l'ajouter à l'écran d'accueil.

## Adresses
La recherche directe utilise le service officiel de géocodage du gouvernement du Québec.
Le fichier `adresses-louiseville.json` est aussi prévu pour une future base entièrement hors ligne.

Le fichier BDOA_QC_v1 fourni ne contenait aucune ligne attribuée à Louiseville, ni au code postal J5V. Il n'a donc pas été possible d'intégrer légalement une liste locale complète à partir de ce fichier sans inventer des adresses.

## Sécurité
FireMap est un outil d'aide. Toute borne, adresse, pression ou capacité doit être validée par le service incendie et la municipalité avant un usage opérationnel.
