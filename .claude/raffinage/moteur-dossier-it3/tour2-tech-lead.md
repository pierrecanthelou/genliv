# Tour 2 — tech-lead — moteur-dossier it3

```
RÉPONSE
Narratif, X-1 : tu as raison, et MON MOTIF ÉTAIT FAUX — mesuré. Nous partagions la
prémisse « la correction ne peut que sous-tirer » ; je l'invoquais contre ton 'faux'.
Or `premiereFeuilleVraieAuTourZero` n'a qu'UN appelant de production —
`controles.ts:1222`, sur `canon.objectifs[].echoue_si_expr` SEUL. Le
`non(lieu_visite(vigie-du-nord))` que je citais vit dans `charpente.fins[].condition_expr`,
qu'AUCUNE règle ne lit ; et `lieu_visite` n'apparaît dans AUCUN `echoue_si_expr` des deux
fixtures. Sous 'faux' hors départ, `controles.test.ts` NE ROUGIT PAS. Mieux : `DELTAS`
n'ayant pas de `visiter_lieu`, ton 'faux' est déterminé et rendrait le linter plus utile,
pas plus bavard. Je retire — famille BUG-080, un refus juste pour un motif faux.

MES OBJECTIONS
1. Point fixe borné ≠ passe unique — MAINTENUE (le re-déclenchement la renforce).
2. Séparateur KR-247 — MAINTENUE, amendée : clone MUTÉ EN TEST, jamais la fixture disque.
3. Trois instruments rougissent — MAINTENUE et chiffrée : plancher oracle 6 → 5, pas 4.

POSITION
X-1 — retirée : `lieu_visite` trivalente sur le modèle exact de `lieu_courant_est`.
X-2 — je cède : `projeterJalonsAtteints` SORT d'it3 (seul lecteur = un test, KR-249).
X-3 — mon lot 2 ne se réduit pas à `JournalRow.tsx` : il DISPARAÎT comme lot de
      production et devient UN fichier de test dans `play-mode`.
M-3 — la troisième cellule est réelle, mais AVEUGLE elle coûte `controles.test.ts` :
      je propose la cellule GARDÉE, qui la corrige sans rien traîner.
X-5 — amendement DANS LA SPEC SEULE ; la porte `B3` ne réagit pas (mesuré).

VERDICT — recevable sous réserve (M-3 : forme de la cellule à trancher par l'orchestrateur).
```

## A — Mesures neuves *(lecture du dépôt ; pas de `Bash`)*

| # | Fait mesuré | Preuve |
|---|---|---|
| 1 | `premiereFeuilleVraieAuTourZero` a **un seul appelant de production** | `controles.ts:6` + `:1222`, règle `objectif-perdu-a-l-ouverture`, sur `canon.objectifs[].echoue_si_expr` **et rien d'autre** |
| 2 | `lieu_visite` n'est dans **aucun** `echoue_si_expr` | ses 6 occurrences : `minimal:228` (jalon) · `reference:25` (`reussi_si_expr`) · `:118` (étape de quête) · `:331` (événement) · `:376` (jalon) · `:409-411` (`fins[].condition_expr`) |
| 3 | Les trois `echoue_si_expr` du dépôt | `minimal:37` `ou(evenement_consomme, pnj_a_revele)` · `reference:30` `evenement_consomme` · `reference:43` `non(possede_objet(objet.sceau-de-cendre))` |
| 4 | **`possede_objet: 'faux'` est le producteur UNIQUE du seul vrai positif sur fixture réelle** | `controles.test.ts:2341`, `:2343`, `:2346-2347`, `:2351-2352`, `:2371`, `:2422`, + la ligne de base `:1672` |
| 5 | Cellule passée **aveuglément** à `'indecidable'` → **8 points rouges** + perte du témoin de polarité « encore faux » (`:2369-2372`) | seules cellules certain-FAUX restantes : `pnj_a_revele`, `lieu_courant_est` hors départ |
| 6 | **Aucun jalon des deux fixtures ne porte `donner_objet`** | `minimal:229` `[reveler_indice]` · `reference:377` `[reveler_indice]` · `reference:384` `[]`. `donner_objet` n'existe qu'en `quetes[].recompense` et `evenements[].issues[].consequence` — aucun ne part à l'ouverture |
| 7 | **Plancher de l'oracle, dérivé et concordant** | `dossier-minimal` = 1 lieu, 1 objet, 2 indices, 1 pnj, 1 jalon, 1 événement → 6 = 1 `lieu_courant_est` + 1 `possede_objet` + 2 `indice_connu` + 2 `pnj_a_revele`, **exactement** `tourzeroOracle.test.ts:145-147` |
| 8 | Plancher après it3 | **cellule gardée : −2 +1 = 5** · cellule aveugle : −3 +1 = **4** |
| 9 | **KR-238 : le corps à amender est dans la spec** | `specification.json:113` porte l'illustration fausse ; `code-knowledge.json:672` est **déjà un renvoi compacté** qui **ne la porte pas** |

**Non mesuré — à mesurer par le lot** : (a) `deplacement.test.tsx` gagne-t-il des lignes de journal ? *(argument de solidité : `jalon.premiere-nuit` est atteint **à l'ouverture**, donc non réévalué au pas suivant — le journal d'après-`ALLER` ne devrait pas bouger)* · (b) `expr.test.ts:420/433` · (c) la ligne morte de `sessionCouverture.test.ts` — mesurés par la QA.

## B — Réponse chiffrée à M-3 : la **cellule GARDÉE**

La troisième cellule est **réelle** : `Jalon.effet` admet `donner_objet`, donc `possede_objet: () => 'faux'` devient faux **dans la direction interdite** dès que (i) s'applique. **Le narratif a raison sur le fond.**

Mais la corriger **aveuglément** coûte, mesuré : `controles.test.ts` (**2 444 lignes**) entre au lot, 8 points rouges, **le linter perd son seul vrai positif de fixture**, et l'itération livre une régression produit invisible dans son `goal`.

```ts
// tourzero.ts — PRIVÉ, aucune traversée d'`ExprNode`, aucun import neuf.
// Sur-approximation SYNTAXIQUE : si AUCUN jalon ne porte ce delta, aucun delta de ce
// type ne peut partir à l'ouverture (H6 + H5 d'`atteignabilite.ts`), donc la cellule
// reste certain-FAUX, légitimement. Lit `charpente.jalons[].effet[].delta` et RIEN
// d'autre — jamais `declencheur_expr`.
function unJalonPeutEcrire(dossier: Dossier, delta: DeltaId): boolean

possede_objet: (dossier) => (unJalonPeutEcrire(dossier, 'donner_objet') ? 'indecidable' : 'faux'),
indice_connu:  (dossier) => (unJalonPeutEcrire(dossier, 'reveler_indice') ? 'indecidable' : 'faux'),
pnj_a_revele:  () => 'faux',   // INCHANGÉE, par mesure : `reveler_indice` est d'arité 1
lieu_visite:   (dossier, cibles) => { /* même corps à trois bras que `lieu_courant_est` */ },
```

**Effet mesuré** : `indice_connu` → `'indecidable'` sur **les deux** fixtures (leurs jalons portent `reveler_indice`) — la divergence mesurée par la QA est réparée ; `possede_objet` → reste `'faux'` sur les deux (**aucun** jalon ne donne d'objet) — **`controles.test.ts` reste vert et HORS du lot**, le vrai positif survit, le témoin « encore faux » survit.

**Pouvoir séparateur — les deux implémentations coïncident sur TOUTE fixture du dépôt.** Le témoin doit donc **fabriquer** le dossier (clone + un jalon dont l'`effet[]` porte `donner_objet`) et voir la cellule **basculer** ; sans ce scénario, le critère épingle une coïncidence (BUG-113). Idem en sens inverse pour `indice_connu` : clone avec `effet: []` → la cellule **revient** à `'faux'`. **Une cellule gardée qui ne sait pas basculer est une constante déguisée.**

**Si le comité préfère la cellule aveugle** : c'est légal et **le découpage ne bouge pas** (`controles.test.ts` est dans `src/brain/**`, déjà propriété du lot 1). Le prix : plancher oracle **4**, 8 réécritures, un témoin de polarité à reconstruire, et une ligne de revue disant que **le linter a perdu un vrai positif**.

## C — Découpage FINAL — deux lots, disjoints **par construction**

### Lot 1 — `faits-evaluateur-jalons` · **`contrat`** · seul et en premier
**Propriété exclusive : tout `src/brain/**` + `docs/`.**
(N) `faits.ts` · `evaluate.ts` · `evaluate.test.ts`
(R) `predicates.ts` · `deltas.ts` · `deltas.test.ts` · `expr.test.ts` · `session.ts` · `session.test.ts` · `commandes.ts` · `commandes.test.ts` · `sessionDestinations.ts` · `__fixtures__/session-saturee.ts` · `sessionCouverture.test.ts` · `tourzero.ts` · `tourzero.test.ts` · `tourzeroOracle.test.ts` · `brain/index.ts` · `docs/EXIGENCE-APERCU-DU-JEU.md` § 6
(R, **seulement si la cellule aveugle est retenue**) `controles.test.ts`

**Nom RÉSERVÉ** : `brain/dossier/jalons.ts` (si `evaluate.ts` franchit 400 l.).
**INTERDITS, verts sans modification** : `types.ts`, `destinations.ts`, `validate.ts`, **`__fixtures__/dossier-*.json`** *(neuf — REJETÉ 15)*, `atteignabilite.ts`, `controles.ts`, `couverture.test.ts`, `feuilles.ts`, `src/player/**`, **tout `src/features/**`**.

### Lot 2 — `jalon-au-journal` · feature · **test seul, zéro production**
**Propriété exclusive : tout `src/features/play-mode/**`.**
(N) `tests/jalonAuJournal.test.tsx` · (R, si rouge) `tests/deplacement.test.tsx`
**Zéro composant, zéro fichier de production, zéro jeton, zéro texte neuf.** **INTERDIT** : tout `src/brain/**`.

**Disjonction par CONSTRUCTION**, pas par énumération : `src/brain/**` ∩ `src/features/play-mode/**` = ∅ — aucun fichier ne peut se retrouver dans les deux, même si le lot 1 en découvre un de plus.

**Exécution séquentielle, pas d'essaim, pas de worktree, pas de fusion.** Si le comité juge que la réponse à l'objection 1 du PM tient dans le lot 1, **it3 devient un lot unique** — c'est légal et je ne m'y oppose pas ; je préfère les deux parce qu'un lot `contrat` qui ouvre `src/features/**` **contredit sa propre liste d'INTERDITS**.

## D — Signatures : **delta** par rapport au tour 1

```ts
// SUPPRIMÉ d'it3 (X-2 concédé) :
// export function projeterJalonsAtteints(dossier, faits): readonly JalonAtteint[]

// `JalonAtteint` reste INTERNE à `evaluate.ts` — il sert à composer le `texte` de
// journal, il ne sort pas du baril. Un type exporté à un seul appelant (un test)
// est une dette, pas un contrat.

// `brain/index.ts` — CE QUI SORT : `DeltaJournalise` (type) SI le lot 2 en a besoin ;
// sinon RIEN. Ne sortent pas : `FaitsDeSession`, `evaluerExpr`, `appliquerDelta`,
// `resoudreJalons`, `JalonAtteint`.
```

**Test-grep KR-246 — REFORMULÉ, et c'est nécessaire** : l'invariant se pose sur **`declencheur_expr`**, pas sur `charpente.jalons`. Parmi les modules de session, **un seul** doit le nommer : `evaluate.ts`. Sans cette reformulation, la **cellule gardée** — qui lit `effet[]` — ferait rougir le grep, et on l'assouplirait par une liste d'exclusion, c'est-à-dire qu'on le casserait. `declencheur_expr` **est** l'entrée de la décision ; `charpente.jalons` n'est qu'un chemin.

**Tout le reste du tour 1 tient** : `FaitsDeSession` dans `faits.ts` + alias `EtatMonde` · `lit`/`ecrit` en champs de descripteur · `ecrit` rend la même référence, `effet` dérivé par `===` · `resoudreJalons` = un corps, deux appelants, **point fixe borné**, aucune mémoïsation · `deltas?` optionnel à vie, `undefined` jamais `[]` · trois lignes `'moteur'`, dispense « quatre » → **sept** · aucun `catch` · ordre acyclique inchangé.

## E — X-5 : où KR-238 s'amende

- **Le corps est dans la spec** (`specification.json:113`) — c'est **là, et là seulement**, que vit la phrase fausse. **Amendement : spec seule.**
- `code-knowledge.json:672` est **déjà un renvoi compacté** et ne porte pas l'illustration. **Il ne bouge pas.**
- **La porte `B3` ne réagit pas** : id inchangé, le renvoi résout toujours, `PLANCHER_RENVOIS` ne bouge pas. L'instrument compte des renvois et vérifie leur cible ; **il ne compare aucun texte**.
- **Témoin** : nœud **fabriqué** (`{ op: 'xor' } as unknown as ExprNode`) sous un `non` au sommet, **deux** assertions — il lève dans les deux positions. **Jamais sur une fixture.**

## F — REJETÉ *(§ 8 du plan — BUG-082 ; 12 à 17 sont NEUFS)*

1–11. **Inchangés du tour 1** — sauf le n° 4, qui **tombe** (voir 12).
12 ✦ | **`lieu_visite: 'indecidable'` hors départ** — **ma propre proposition, RETIRÉE** : motif mesuré faux. La cellule est **trivalente**, comme `lieu_courant_est`.
13 ✦ | **Passer `possede_objet`/`indice_connu` aveuglément à `'indecidable'`** — coût mesuré : `controles.test.ts` au lot, 8 points rouges, perte du seul vrai positif de fixture et du témoin de polarité. **Recevable si le comité l'ordonne**, mais la revue écrit alors la régression du linter.
14 ✦ | **`projeterJalonsAtteints` en it3** — plus aucun lecteur de production ; un export dont le seul appelant est un test est une dette (KR-249).
15 ✦ | **Ajouter un jalon à `__fixtures__/dossier-reference.json`** — c'est la **ligne de base** de `controles.test.ts:1640-1674` et de `couverture.test.ts`. Le scénario se monte sur un **clone muté en test** (précédent `controles.test.ts:2406`).
16 ✦ | **Un composant `JalonsAtteints.tsx`** — **ma propre proposition, RETIRÉE** : l'UX a mesuré `JournalRow.tsx`, et un tel composant serait un lecteur de prose `'ia'`.
17 ✦ | **Une cellule de `tourzero.ts` qui appellerait `resoudreJalons`** pour être exacte plutôt que sur-prudente — fusion des deux évaluateurs, **KR-237 : veto**. La sur-approximation syntaxique est le prix, et elle est sûre.

## G — Décisions en autonomie

- **Forme des cellules 2 et 3** → **gardée** par balayage de `charpente.jalons[].effet[]` → si aveugle : `controles.test.ts` au lot, linter privé de son seul vrai positif, témoin à reconstruire, plancher **4**.
- **Domicile de `unJalonPeutEcrire`** → **privé dans `tourzero.ts`** → si exporté d'`evaluate.ts` : `tourzero` importerait l'évaluateur, première marche vers la fusion que KR-237 interdit.
- **Assiette du test-grep KR-246** → **`declencheur_expr`** → sinon la cellule gardée le fait rougir et on l'assouplit par une exclusion : un instrument désarmé pour le faire passer.
- **Lot 2 test-seul plutôt que zéro lot** → sinon le lot `contrat` ouvre `src/features/**`, ce que sa propre liste d'INTERDITS proscrit ; et sans test de rendu, l'objection 1 du PM reste sans réponse observable.
- **Séparateur KR-247 sur clone muté en test** → sinon deux suites hors périmètre rougissent sans qu'aucun critère ne l'ait prévu.
- **`brain/index.ts` n'exporte rien si le lot 2 n'en a pas besoin** → sinon surface publique sans appelant, KR-109 en germe.
