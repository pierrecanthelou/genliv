# PM Produit — tour 1 — moteur-horloge it3

**RISQUE** : l'objectif de l'itération est une liste de champs, pas une phrase de démo. Cinq mots techniques ne démontrent rien à un auteur.

**OBJECTIONS** :
1. Le goal est une liste de champs, pas une phrase de démo — il faut une reformulation.
2. Le journal et R3 décideraient chacun du blocage = deux sites (violation KR-246).
3. Étape 0 : `depuis` absent sur l'étape 0 avec `duree` rend le blocage silencieux (Sélène et Corvin du dossier de référence).
4. J2 règle 8 (« depuis never read by tick ») contredit it3 — doit être réécrite AVANT le code.
5. `si_bloque` est la seconde dérogation R3 — nécessite sa propre constante et garde, amendement de `narrateur.ts:76`.

**PROPOSITIONS** :
- Phrase de démo : « l'auteur lit qu'un PNJ coincé trop longtemps à une étape change d'approche ».
- Un seul prédicat `etapeBloquee` partagé par le tick et R3 (résout KR-246).
- Front `===` (un seul constat, pas de spam).
- J2 réécrite avant le code (lignes 4/5/7, règle 8).

**VERDICT** : recevable sous réserve (O1–O5).
