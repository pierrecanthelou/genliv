# Tour 1 — `pm-produit`

**VERDICT** : recevable sous réserve (ambiguïté de portée des critères à lever avant l'essaim).

**RISQUE** — `plan.acceptance_criteria` de la spec est une liste PLATE de douze critères couvrant les quatre itérations, sans marqueur d'itération. Un ouvrier qui la lit de haut en bas peut tenter le critère du badge de nav, que le § 7 du cadrage réserve nommément à it2. Point d'entrée classique d'un débordement de lot.

**OBJECTION** — la spec ne dit pas quels critères valident it1. Seuls les critères 1, 2 et 12 (non-régression) sont sans ambiguïté ; le critère 3 (invariant de somme par section) est générique mais son exemple cite la section « Indices », qui n'a aucun matériau avant it3.

**PROPOSITION** — écrire noir sur blanc dans le plan : « critères de la spec visés par it1 : n° 1, n° 2, n° 12, et n° 3 relu sur les sections réellement touchées (canon, départ) — pas Indices ». It1 livre trois à quatre critères vérifiés, pas douze.

**Phrase de démo** — gardée telle quelle, juste et sans « et ».

**Signal de coupe (§ 10 du cadrage)** — confirmé : aucune découpe ne garde la démo. Un module `brain/` sans écran n'est pas une tranche verticale, et l'injection dans `bascule-editeur` est déjà cadrée comme un diff sans logique métier. Pas d'objection.

**Valeur auteur** — réelle mais modeste : la liste est utile à mi-parcours, tautologique sur un dossier tout juste créé. Nommé comme risque de perception à surveiller si it3 tarde, pas rouvert.

## Hors périmètre (sortie principale, livrée sur relance)

- **Verdict global « jouable »** — NON affiché. `jouable` reste calculé, exporté, testé ; jamais rendu en bandeau. Un rouge sur 100 % des dossiers à t=0 est le miroir du voyant vert tautologique déjà refusé par `sections.ts`.
- **Atteignabilité clavier de l'entrée « Contrôles »** — OUI, dans le périmètre : item de nav standard, opérable comme les dix autres.
- **Détection qualitative sur dossier importé** sans marqueur jamais posé — hors périmètre : le linter ne teste que la présence littérale du marqueur ; le silence est attendu, pas une lacune à combler par une heuristique de « vraie prose ».
- **Rafraîchissement** quand l'auteur rédige — en direct par construction (calcul dérivé à chaque rendu, KR-013, aucun cache). Hors périmètre : toute synchro explicite entre deux panneaux ouverts en même temps.
- **Pastille INFO exercée** par une vraie règle — NON : aucune règle `info` avant it3. Seul le mapping de tons doit couvrir les trois valeurs.
- **Tri, groupement par niveau, compteur d'en-tête, persistance du rapport, masquage d'une ligne** — aucun n'est requis.
- **Badges de nav** (it2) · **les cinq règles de registre** (it3) · **atteignabilité et canon sans objectif** (it4) · **agrégation des avertissements du validateur** (question ouverte) · **tout lot contrat sur `validate.ts`/`types.ts`/`destinations.ts`** · **focus dans le champ fautif d'une autre feature**.
- **Précision contestée** : le clic d'une ligne qui *sélectionne sa section* (navigation, pas focus-champ) est gardé dans le périmètre par le PM. → contredit par le tech-lead (objection 2, « inlivrable »). Arbitrage au tour 3.
