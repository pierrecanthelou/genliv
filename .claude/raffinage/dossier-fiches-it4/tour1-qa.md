RISQUE — L'itération porte deux D1 nouveaux (contre_mesures + duree/si_bloque) sur un fichier déjà repéré comme fragile à cette classe de bug (KR-199, 3 occurrences). Le risque majeur n'est pas la couverture, c'est qu'un critère déjà écrit dans la spec ordonne, sans le nommer, la **reversal** d'une décision déjà arbitrée et testée.

OBJECTION — Le critère #7 (feature) dit : « `plan_actions[].declencheur_texte` OU `contre_mesures[].declencheur_texte` sans `…_expr` jumeau → avertissement D1 ». C'est faux pour `plan_actions` tel que le SSOT le tient aujourd'hui : `tables.ts` fixe `alerteSansExpr: false` pour cette famille, avec le commentaire explicite « étape de plan… légitime et calme », verrouillé par un test nommé « jalon, evenement et etape de plan restent calmes sans …_expr — assertion discriminante » (`validate.test.ts:1732`). Le critère #7 mélange une famille CALME et établie avec `contre_mesures`, seule vraiment neuve — sans l'annoter comme renversement (règle posée après BUG-069). Suivi tel quel, il fait soit casser un test discriminant existant sans arbitrage écrit, soit produire un bandeau que le SSOT ne lèvera jamais (même panne que BUG-064).

PROPOSITION — Scinder #7 en deux critères vérifiables séparément : (a) `contre_mesures[].declencheur_texte` sans expr → avertissement, via une ligne `alerteSansExpr` neuve sur la 6e famille, prouvée par balayage `FAMILLES_DE_CONDITIONS` (jamais un littéral) ; (b) `plan_actions[]` reste calme, prouvé en ÉTENDANT le test discriminant existant, pas par un nouveau. Exiger aussi une ligne `destinations.ts` + un critère nommé pour `duree`/`si_bloque` (absent des `open_questions`, contrairement à `but.echeance`) avant tout lot contrat.

VERDICT — recevable sous réserve.

---

ANNEXE — Cas limites à couvrir par ce lot :
- Bloc « Objectif & plan d'actions » jamais réglé (état vide, aucune écriture au montage).
- `contre_mesures` absent/vide sur un antagoniste (section présente mais sans ligne) vs. absente sur un protagoniste.
- Camp changé après coup protagoniste → antagoniste (et retour) : section contre-mesures apparaît/disparaît en lecture DÉRIVÉE, jamais via `useEffect`.
- `plan_actions[].declencheur_texte` sans `…_expr` : DOIT rester calme (test discriminant étendu, pas un bandeau neuf).
- `contre_mesures[].declencheur_texte` sans `…_expr` : DOIT avertir (nouvelle ligne de table, sonde de discriminance nommée).
- Deux personnages distincts, second atteint par clic de ligne, sur le bloc plan d'actions ET sur la section contre-mesures (montage sans interaction, KR-197 double indexation).
- Dossier de référence (6 personnages) toujours accepté sans régression sur les champs hors lot (crit #8).
- `duree`/`si_bloque` de forme non tranchée : au moins un cas où le champ est absent (rétro-compat schema:1) et un cas où il est présent, avec destination nommée et testée.
- `but.echeance` : décision à trancher, testée soit « champ visible auteur », soit « jamais injecté au modèle » — pas les deux en même temps.

Fichiers pertinents : `src/features/dossier-fiches/specification.json`, `src/brain/dossier/tables.ts` (lignes 368-408), `src/brain/dossier/validate.ts` (lignes 596-619), `src/brain/dossier/validate.test.ts` (lignes 1709-1740), `src/brain/dossier/destinations.ts` (lignes 254-269), `src/brain/dossier/types.ts` (lignes 218-230), `code-knowledge.json` (KR-189, KR-196).
