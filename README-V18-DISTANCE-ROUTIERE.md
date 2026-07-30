# FireMap V18 — Bornes classées par distance routière

Cette version remplace le classement à vol d’oiseau par un classement selon la distance réelle par la route.

- Les 12 bornes actives les plus proches sont présélectionnées localement.
- FireMap demande ensuite au routeur OpenStreetMap/OSRM la distance routière de chaque borne.
- Les bornes sont classées principalement par distance routière.
- En cas d’égalité, une borne disponible est favorisée, puis le débit le plus élevé.
- Les 3 meilleurs trajets sont dessinés en suivant les rues.
- Si le service de routage est temporairement indisponible, FireMap revient automatiquement au calcul à vol d’oiseau et l’indique clairement.

La fonction exige une connexion Internet pour obtenir les distances routières.
