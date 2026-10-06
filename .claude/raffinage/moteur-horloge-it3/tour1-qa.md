# QA — tour 1 — moteur-horloge it3

**RISQUE** : le constat de blocage est un calcul dérivé à deux consommateurs (tick pour le journal, R3 pour `si_bloque`). Si la formule diverge entre les deux, un PNJ est bloqué pour l'un et pas pour l'autre.

**OBJECTIONS** :
1. Il manque un test pour `depuis` absent + `duree` posée (cas des sessions 0.7.21).
2. Blocage et avancement doivent être mutuellement exclusifs — test requis.
3. L'injection de `si_bloque` requiert à la fois bloqué ET présent — test frontière nécessaire.

**PROPOSITIONS** :
- Prédicat unique partagé entre tick et R3 pour garantir la cohérence.
- Tests nommés pour chaque frontière : `depuis` absent, exclusivité avancement/blocage, présence + blocage.

**VERDICT** : recevable sous réserve (O1–O3).
