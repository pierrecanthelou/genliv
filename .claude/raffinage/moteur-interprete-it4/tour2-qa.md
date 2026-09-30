# Tour 2 — QA — Contre-lecture — moteur-interprete it4

## RISQUE
AC#9 confondait effet observable (« moins de suggestions ») et cause programmable (« contexte réduit »). La proposition narratif-ia recentre sur **sept invariants du code** (I1–I7), chacun une propriété vérifiable en sortie de la fonction de cascade, pas une observation de charge réseau. Risque levé.

## OBJECTION
**Objection 1 (jest-observable)** — Acceptée. Les invariants I1–I7 sont des propriétés du **code**, pas du modèle IA : ordre des paliers (I3), cardinalité de lignes (I4), présence conditionnelle de champs (I2), chaînes exactes (I5). Chacun porte un mutant séparateur nommé (ex. I3 : « P2 d'abord » tue le test). Jest les voit.

**Objection 2 (`EN SA POSSESSION` non borné)** — Acceptée comme **risque résiduel documenté**, non bloquant pour it4. Classification de narratif-ia : propriété architecturale (dossier très riche → P2 permanent, résumé gelé), assignée en `open_questions` à `dossier-controles`. Pas un défaut de code, un cas-limite futur.

**Objection 3 (ambiguïté paliers)** — Levée. Cascade explicite : P1=7209c (RECEMMENT, min 4 lignes), P2=8023c (P1+condensation), P3=1213c (P2+AUPARAVANT), plancher=4511c. Valeurs exactes + tableau de rupture (« aucun palier ne tient → trop-long »).

## PROPOSITION
1. I1–I7 écrits comme **sept tests distincts** (ou sept assertions nommées dans un même test), chacun mapé à son mutant séparateur.
2. Tableau des ruptures et du comportement d'échec → `specification.json`, section `known_risks` ou appendice de la revue.
3. `EN SA POSSESSION` permanent en P2 → ligne explicite `open_questions`.

## VERDICT
**ACCEPT**, le refus de tour 1 est retiré. La proposition satisfait propositions 2 (cascade explicite), 3 (risque documenté), 4 (KR-274 en tableau). KR-268 (aucun stockage) reste une garde.
