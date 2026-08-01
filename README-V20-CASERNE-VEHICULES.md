# FireMap Louiseville V20 — Caserne et véhicules

## Flotte intégrée
- Autopompe 202
- Échelle 502
- Citerne 802
- Unité de soutien 602
- Pickup 902
- Chef 102

## Fonctions
- Icône permanente de la caserne sur la carte
- Configuration du nom, de l'adresse, du téléphone et des coordonnées de la caserne
- Marqueurs des six véhicules
- Statuts opérationnels
- Partage GPS en temps réel depuis un téléphone
- Synchronisation Firestore des véhicules et de la caserne
- Fonctionnement local si Firebase n'est pas disponible

## Firestore
Publier le fichier `firestore.rules` mis à jour. Les nouvelles collections sont :
- `vehicules`
- `configuration` avec le document `caserne`

## Important
À la première ouverture, la caserne est placée au centre de Louiseville. Ouvrir **Caserne et véhicules > Modifier** pour inscrire les coordonnées exactes.

Pour partager la position d'un véhicule, ouvrir **Caserne et véhicules**, puis toucher **Partager GPS** sur le véhicule utilisé. iOS demandera l'autorisation de localisation précise.
