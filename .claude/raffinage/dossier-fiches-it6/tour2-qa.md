## Note — QA · `dossier-fiches` it6/8 · tour 2 (contre-lecture)

**RISQUE** — La garde du tech-lead (registre littéral de `savoirs.test.tsx` vs « chemins réels » de `tables.ts`/`destinations.ts`) ne ferme mon risque KR-199 QUE si le second membre est dérivé par un prédicat structurel (ex. préfixe `revele_si.` filtré sur `tables.ts`/`destinations.ts`), jamais une deuxième liste tapée à la main. Dans ce dernier cas une 5e porte oubliée des DEUX listes reste invisible — KR-199 est déplacé, pas fermé.

**OBJECTION** — Point 2 (BlocPresence/M1) : ce fichier est listé « hors lot, à ne pas ouvrir » par le tech-lead lui-même ; y écrire correctif ou test dans it6 violerait la propriété de fichiers du lot (Mode B point 6). UX a raison sur `bug_history.json` maintenant (critical, régression vivante) — mais sans `regression_test` renseigné tant que le correctif n'est pas fait, avec renvoi explicite au prochain lot touchant `BlocPresence`. En revanche `BlocSavoirs` est du code NEUF : mon annexe test #3 doit désormais prouver que le corps ne s'efface pas quand un savoir existe déjà et que `monde.indices` est vide — gate sur `savoirs.length`, pas `monde.indices.length` (Objection 1 du tech-lead) — sinon it6 réécrit M1 dans le lot même qui vient de le documenter ailleurs.

Point 3 (racine #6, PM) : reformulation acceptée, observable — nomme les 4 portes, exige preuve séparée par porte, couverte par annexe test #5 + garde `it.each`.

**PROPOSITION** — Nommer au plan le prédicat structurel de la garde de portes ; réécrire l'annexe test #3 (gate `savoirs.length`, pas `monde.indices.length`) ; logger BUG-BlocPresence maintenant, sans fix ni test bundlé dans it6.

**VERDICT** — recevable sous réserve (les 3 points ci-dessus).

---

## Mes objections du tour 1

1. **Racine #6 (GWT incohérent, une scène ≠ preuve des 4 portes)** — RETIRÉE : la reformulation PM est observable (nomme les 4 portes, exige preuve séparée), couverte par annexe test #5 + garde `it.each`.
2. **KR-199 / couverture partielle des 4 portes (motif BUG-068)** — DURCIE EN VETO conditionnel : levé seulement si le plan nomme explicitement un prédicat structurel (dérivation automatique, pas une liste recopiée) pour le membre « réel » de la garde ; sinon la garde est décorative et le risque reste ouvert.
