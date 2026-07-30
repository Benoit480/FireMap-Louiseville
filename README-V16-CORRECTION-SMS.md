# FireMap V16 — Correction de l’adresse des SMS

Le parseur extrait maintenant strictement l’adresse située entre « AU » et « , Louiseville ».

Exemple :

`Louiseville INCENDIE DE BATIMENT Au 60 RUE SAINT-ANTOINE, Louiseville ...`

Adresse détectée : `60 Rue Saint-Antoine, Louiseville J5V1Z5`.

Une confirmation affiche aussi la nature, le niveau et les véhicules avant la création de l’appel actif.
