# Tour 2 — QA (contre-lecture) — **le seul tour où quelque chose a été EXÉCUTÉ**

> **Vérifié par l'orchestrateur** : `git status --porcelain` ne montre que `.claude/raffinage/dossier-controles-it10/` et `docs/REGLES-DU-JEU-PAPIER.md` (préexistant). `find src -name "*zz*"` → vide. Les deux prototypes jetables ont bien été supprimés, aucun fichier existant modifié.

## 1. Réponses nommées

**À `tech-lead` (tour 1, § 3)** — son affirmation « `expr.test.ts:404/416` rougit à l'arrivée d'un troisième lecteur », explicitement marquée « NON MESURÉ ». **CONFIRMÉE, mesurée.** `src/brain/dossier/zzSwitchLecteur.ts` (un `switch (noeud.op)` sur `ExprNode`) + `npx jest src/brain/dossier/expr.test.ts -t "un lecteur d arbre est soit le SEUL site"` : la ligne 404 rougit, diff `Array ["atteignabilite.ts","expr.ts", + "zzSwitchLecteur.ts"]`. Fichier supprimé → `1 passed`. **Cas négatif vérifié** : l'instrument sait retomber vert.

**À `narratif-ia` (tour 1, § C, Q3)** — objection empiétant sur mon terrain : « (a) un mutant qui rend `'faux'` là où la table dit `'indecidable'` — attrapé par `ou(evenement_consomme(E), …)`, forme de la mesure B ; (b) un mutant qui rend `non` certain-vrai dès que l'enfant n'est pas certain-vrai — attrapé par `non(lieu_courant_est(départ))`, forme de la mesure C », marquée « non mesuré ». **J'ai exécuté : LES DEUX APPARIEMENTS SONT FAUX.** Ni A, ni B, ni C ne tuent M2 ou M3. Il n'existe, dans le matériau du plan, **aucun témoin qui exerce `jalon_atteint` / `lieu_visite`** — la mesure C porte sur `lieu_courant_est`, qui est *certain*, jamais indécidable.

## 2. Statut de mes objections du tour 1

- **Objection 1** (« le témoin de mesure C ne sépare rien ») → **RETIRÉE.** Ma propre proposition — un témoin dédié `non(lieu_courant_est(depart))` non masqué — a été mesurée : elle sépare bien M1 du modèle juste (`m1 = 'vrai'` contre attendu `'faux'`). Le risque est résolu **pour M1**.
- **Objection 2** (« le statut de `lieu_visite(départ)` n'est tranché nulle part ») → **DURCIE EN VETO**, sous forme corrigée. Sa forme bivalente n'a plus d'objet (Q3 tranchée en trivalué). Mais la mesure révèle un trou non anticipé : **aucun des quatre témoins du comité n'exerce `jalon_atteint` ni `lieu_visite`**, donc aucun ne prouve que ces cellules restent `'indecidable'` plutôt que de dériver vers `'faux'` — le canal de faux négatif que la trivalence est censée fermer. **VETO : le lot ne peut pas clore sans un témoin qui isole `jalon_atteint(...)` ou `lieu_visite(...)` NU, sans négation, et affirme `'indecidable'`.**

## 3. Mesures

Prototype `src/brain/dossier/zzTourZero.test.ts` — Kleene selon la table exacte du tech-lead, contre les vrais `expr.ts` / `predicates.ts` / `types.ts` et les deux vraies fixtures. **Aucun mock.**

### (1) Valeurs attendues — CONFIRMÉES, valeur par valeur

| témoin | expression réelle | verdict mesuré |
|---|---|---|
| référence `objectifs[0]` | `evenement_consomme(embuscade-a-la-tour)`, sans négation | **`'faux'`** — silence |
| référence `objectifs[1]` | `non(possede_objet(sceau-de-cendre))` | **`'vrai'`** — tire (Mesure A) |
| minimal `objectifs[0]` | `ou(evenement_consomme(...), pnj_a_revele(...))` | **`'faux'`** — silence (Mesure B) |
| fabriqué | `non(lieu_courant_est('lieu.val-cendre'))`, départ = `lieu.val-cendre` | **`'faux'`** — silence (Mesure C) |

**A tire, B silence, C silence — confirmé par exécution.**

### (2) Pouvoir séparateur — mesuré, et il contredit deux affirmations non mesurées du tour 1

```
M1 -> A-obj0: faux/faux vert | A-obj1: vrai/vrai vert | B: faux/faux vert | C: attendu=faux m1=vrai ROUGE
M2 -> A-obj0: faux/faux vert | A-obj1: vrai/vrai vert | B: faux/faux vert | C: faux/faux vert
M3 -> A-obj0: faux/faux vert | A-obj1: vrai/vrai vert | B: faux/faux vert | C: faux/faux vert
```

- **M1** (`lieu_courant_est` toujours `'faux'`) : **tué par le témoin C, et par lui seul.** Confirmé.
- **M2** (`non` traite `'?'` comme faux) : **AUCUN des quatre témoins du plan ne le sépare.** Le seul `non` réel du dépôt porte sur `possede_objet`, valeur certaine-fausse. J'ai dû construire un cinquième témoin, absent du plan : `non(lieu_visite(x))` → juste `'indecidable'`, M2 `'vrai'` → rouge.
- **M3** (`jalon_atteint`/`lieu_visite` forcés à `'faux'`) : **AUCUN des quatre non plus.** Témoin dédié nécessaire : le prédicat **NU** `lieu_visite(x)` → juste `'indecidable'`, M3 `'faux'` → rouge.
- **Témoin suspect, trouvé en le construisant** : le témoin dédié à M2 (`non(lieu_visite(x))`) **tue aussi M3** (`verdictM3 = 'vrai'` ≠ `'indecidable'`). C'est **structurel**, pas accidentel : les deux seules cellules `'indecidable'` sont exactement celles que M3 corrompt, donc tout témoin exposant le bug de `non` passe par une cellule que M3 a déjà rendue certaine. **Le témoin NU est propre** : il tue M3 et reste vert sur M2. **Il faut les DEUX témoins, jamais un seul** — le nu prouve M3 seul ; le nié, lu conjointement avec le nu resté vert, prouve M2.
- **Et cela a failli me tromper aussi** : ma première hypothèse (« un témoin dédié à M2 suffit et ne recoupe pas M3 ») était fausse — le run l'a démentie, pas ma relecture.

### (3) Ligne de base — mesurée sur les trois dossiers

- **Dossier neuf** (`canon.objectifs` vide) : **aucune ligne ajoutée**, reste à 4.
- **`dossier-minimal.json`** : `objectifsPerdus() = 0` → **aucune ligne ajoutée**, reste à 1.
- **`dossier-reference.json`** : `objectifsPerdus() = 1`, sur exactement `objectif.proteger-le-sceau` → **11 → 12**. Déduction du tech-lead confirmée.

`path = canon.objectifs[].echoue_si_expr` et `section = canon` vérifiés en source (`destinations.ts:141`, valeur `'moteur'`). **Ce que je n'ai pas pu constater** : le `ControleId` de la 9ᵉ règle, **qu'aucune note de tour 1 ne nomme** — l'orchestrateur doit le trancher avant que ce test soit écrivable.

### (4) Garde de couture — positif ET négatif

Rouge : `expect(lecteurs).toEqual(expected)` → `+ "zzSwitchLecteur.ts"` à `expr.test.ts:404`. Fichier supprimé → `21 passed, 21 total` sur `expr.test.ts` entier. **Validée dans les deux sens.**

## Hors de ma mesure

- Le contenu exact des chaînes `message`/`remediation` avec la 9ᵉ entrée réelle — pas d'implémentation à rejouer.
- Le `ControleId` et le `niveau` définitifs.
- Le diff réel sur `atteignabilite.ts`.
- **Score de mutation / table dorée : sans objet** — `src/brain/dossier/**` n'entre dans aucun des deux périmètres. Aucun des deux instruments n'est convoqué.

## Critères d'acceptation que je signe (8, plafond atteint)

Tous de niveau **contrat `brain/`** (jest, fonctions pures) :

1. **Étant donné** `dossier-reference.json` `canon.objectifs[1].echoue_si_expr = non(possede_objet('objet.sceau-de-cendre'))`, **quand** la condition est évaluée à l'ouverture, **alors** le verdict est `'vrai'` et le constat s'allume. *(mesuré)*
2. **Étant donné** `canon.objectifs[0].echoue_si_expr = evenement_consomme(...)` dans la même collection, **quand** elle est évaluée, **alors** le verdict est `'faux'` et rien ne s'allume — KR-197/202 servis sans mutation de fixture. *(mesuré)*
3. **Étant donné** `dossier-minimal.json` `objectifs[0].echoue_si_expr = ou(evenement_consomme(...), pnj_a_revele(...))`, **quand** elle est évaluée, **alors** le verdict est `'faux'`. *(mesuré)*
4. **Étant donné** un `echoue_si_expr = non(lieu_courant_est(<charpente.depart.lieu_id>))`, **quand** il est évalué à t=0, **alors** le verdict est `'faux'`, jamais `'vrai'` — le faux positif interdit. *(mesuré ; témoin absent des fixtures, à écrire)*
5. **Étant donné** un `echoue_si_expr` qui lit `jalon_atteint(...)` ou `lieu_visite(...)` **NU**, **quand** il est évalué à t=0, **alors** le verdict est `'indecidable'`, jamais `'faux'`. *(absent de tout témoin actuel — objet du veto)*
6. **Étant donné** la même condition **NIÉE**, **quand** elle est évaluée à t=0, **alors** le verdict est `'indecidable'`, jamais `'vrai'` ; **distinct du n° 5**, aucun ne remplace l'autre. *(mesuré : un seul témoin tue les deux mutants opposés)*
7. **Étant donné** la table `Record<PredicatId, …>`, **quand** un huitième prédicat entre dans `PREDICATES` sans cellule, **alors** `tsc` refuse de compiler (KR-117). *(typage, pas un `it()`)*
8. **Étant donné** les trois dossiers du dépôt, **quand** la 9ᵉ règle entre au registre, **alors** seule la ligne de base de `dossier-reference.json` gagne un constat (11 → 12, sur `objectif.proteger-le-sceau`), les deux autres restant à 4 et 1. *(mesuré)*

**Signalé, non compté dans les 8** : la réécriture de `expr.test.ts:404/416` est un critère de **non-régression de la couture d'it6**, mesuré rouge puis vert ce tour, pas un critère neuf de cette feature.

**Hors périmètre** : `charpente.fins[].condition_expr`, toute UI, accessibilité, score de mutation, table dorée.
