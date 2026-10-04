# Tour 1 — QA · moteur-combat it2

**RISQUE MAJEUR** — Pas de liste d'acceptance criteria dédiée à l'itération 2. KR-292 et KR-297 sont énoncés sans test explicite validant l'encodage de la fuite ou la persistance du hero-fled.

**OBJECTION**
1. Critères non observables : le goal n'est pas testable, « bouton séparé » décrit l'architecture, pas un résultat observable. AC manquants pour la visibilité du bouton, le clic, la navigation.
2. KR-292 persistance sans chaîne testée : aucun test de rejeu d'une fuite (postures + fuite → même état sur deux appels). Cas limites non testés : fleeTarget orphelin, rejeu au-delà du round de fuite.
3. Définition de fini floue : aucun test nommé pour it2. Périmètre UI flou. Pas d'indication si hero-fled retire `session.combat`.

**PROPOSITION**
- 5 AC dédiées en format « Étant donné / Quand / Alors ».
- Tests nommés : visibilité bouton (2), rejeu fuite (1), garde d'ordre (1), bande inconscient (1).
- Cas limites énumérés avec assertion en test.

**VERDICT** — REFUS. Spec incomplète. AC explicites, tests nommés et définition de fini exigés.
