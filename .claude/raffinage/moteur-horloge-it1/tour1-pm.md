# moteur-horloge it1 — tour 1 — PM

**RISQUE**
Le goal dit « déclencheur vrai OU durée s'écoule » : deux comportements, et une contradiction interne. AC1 et le walking skeleton font avancer le PNJ à l'échéance de la durée. AC2, `types.ts` (docstring de `si_bloque`) et le plan § 2.7 le déclarent « bloqué » : il n'avance pas. `types.ts` fait foi.

**OBJECTION**
1. (veto) Il n'y a pas de phrase de démo sans « ou ». Reformulation : « l'auteur peut lire au journal qu'un PNJ est passé à l'étape suivante dès que le déclencheur de cette étape est vrai. »
2. (objection) `depuis` n'a aucun lecteur en it1 : KR-249, que la spec cite elle-même. Toute la chaîne durée → depuis → bloqué → `si_bloque` n'a aucun consommateur dans le n° 14 (enrichissement R4 reporté indéfiniment).
3. (objection) La liste de fichiers est incomplète : `evaluate.test.ts:706` fige `.declencheur_expr` à `evaluate.ts`. `horloge.ts`, en le lisant, rougit ce test. Il faut un sélecteur dans `evaluate.ts` (+ test).

**PROPOSITION**
It1 = déclencheur seul. Quatre lots, pas un de plus : `contrat` (faits.ts + sessionDestinations.ts, seul, en premier) → sélecteur `evaluate.ts` → `horloge.ts` → couture `executerCommande`. `etape_plan?: { rang }`.
Retiré, reporté en bloc comme les contre-mesures : durée, depuis, bloqué, `si_bloque`. Ligne 14 du roadmap à corriger : pas d'écart silencieux. La forme « objet » de la décision close tient ; `depuis` y entrera optionnel (KR-251) avec son lecteur.
Hors périmètre : bandeau, bloc R3, climat, durée/bloqué, UI neuve, prédicat sur `etape_plan`, enrichissement R4, extraction `sessionCombat.ts`, tout effet de monde d'une étape.
Ligne de journal : `role: 'moteur'`, identifiants et rang, jamais `action` (prose ia, verbatim interdit).

**VERDICT**
VETO sur goal/AC1 tels qu'écrits. Levé dès que la phrase ci-dessus les remplace.
