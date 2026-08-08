## TOUR 2 — Tech Lead

**RISQUE** — `couverture.test.ts` exige `warnings: []`. Six personnages, c'est six occasions de `revelation-sans-porte`, plus `BUDGET_MOTS_JALON = 20` et `BUDGET_MOTS_CANON = 600`. Un dossier de démo riche part rouge par défaut. Le lot porte ces trois gardes en clair.

**RÉPONSES NOMMÉES**

*À QA (point 5) — je concède.* Vérifié : `FAMILLES_DE_CONDITIONS` porte `alerteSansExpr: false` pour jalons **et** événements. « Jalon SANS `declencheur_expr` » et « événement SANS `declencheur_texte` NI `declencheur_expr` » sont des prédicats valides, testables aujourd'hui, sur champs optionnels existants, **et sans avertissement**. Son compte de 5 est le bon : le mien comptait les champs absents, le sien la formulation — c'est le sien qui sert l'ouvrier.

*Point 1, antagoniste — ma proposition est RETIRÉE.* Le motif existe bien (l'objectif de la fixture porte `echoue_si_expr → pnj_a_revele` ciblant `pnj.aldur-le-sage`), donc le prédicat tenait. Mais Aldûr n'est pas un antagoniste : je nommais « antagoniste » ce qui est « personnage cité dans une condition d'échec ». `camp` arrive en n°4 — deux définitions concurrentes du même mot, c'est ma propre ligne de veto. Sauvetage a posteriori, assumé et retiré. **Report n°4**, avec QA et Narratif.

*Point 2, scène figée — RETIRER, pas reformuler.* `texte_ouverture_joueur` est dans `CHAMPS_REQUIS` : tout dossier valide le satisfait. Sa destination `moteur` est déjà épinglée et déjà gardée par deux assertions existantes. Pouvoir discriminant nul. **Report n°10.**

*Point 3, budget-injectable — refusé comme branche, accepté comme mesure.* La charge injectée dépend de `session.jalons_atteints` et vit en n°9, écrit noir sur blanc dans la docstring de `Charpente`. Mesurée sur le dossier seul, elle mesure autre chose. Et poser un plafond non mesuré contredit « mesure d'abord, plafond ensuite ». Une ligne chiffrée dans la revue d'itération, zéro code, plafond posé en n°9.

*Point 4 — confirmé.* Téléchargement **reporté n°2**, avec PM et UX.

**STATUT DE MES OBJECTIONS TOUR 1** — O1 (branches sans ancrage) : **maintenue et élargie** à 5. O2 (« l'auteur peut charger » faux sous `__fixtures__`) : **maintenue et tranchée** — le fichier reste une fixture, la phrase de démo se reformule, et c'est ce qui ramène l'itération à **un seul lot**. P2 (requalification) : **retirée**. P1, P3 : maintenues.

**PROPOSITION DE REMPLACEMENT** — une branche, pas trois : `certitude ∈ {croit, soupconne}`. Registre `CERTITUDES` existant, jamais instancié dans la fixture minimale, et c'est exactement le cas « rumeur ≠ fait » que la docstring de `Certitude` dit défendre.

**VERDICT** — **APPROUVÉ**, critère 9 réécrit à six branches (`portee=second`, jalon sans `declencheur_expr`, fin avec `condition_expr`, savoir avec porte `apres_indice_id`, événement sans déclencheur, `certitude` non-`sait`) + la clôture `DELTAS` sur cible **admissible**. Aucun fichier de production touché.

---

### Annexe — découpage en lots

**UN SEUL LOT. Pas d'essaim, pas de worktree, exécution séquentielle.** L'itération produit une donnée et un test ; inventer un second lot ne révélerait aucun parallélisme, il fabriquerait une fusion.

| # | Lot | Type | Fichiers (N = crée, R = remplace) |
|---|---|---|---|
| 1 | `dossier-reference` | **feature (test-only)** | **N** `src/brain/dossier/__fixtures__/dossier-reference.json`<br>**N** `src/brain/dossier/suffisance.test.ts`<br>**R** `src/features/dossier-format/specification.json`<br>**R** `CHANGELOG.md`, `features_history.json`, `README.md`, `package.json`, `docs/ROADMAP-BASCULE-IA.md` (colonne Statut) |

**Aucun lot `contrat`** : `types.ts`, `tables.ts`, `destinations.ts`, `predicates.ts`, `deltas.ts`, `validate.ts` ne sont **pas** dans le lot. Un ouvrier qui a besoin d'y toucher a franchi le périmètre — il s'arrête et remonte.

**Décision de conception qui rend cela possible : DEUX fixtures, pas une.**
`dossier-minimal.json` est lue par sept fichiers de test (`couverture`, `validate`, `identifiers`, `read`, `roundtrip`, `DossierService`, `importDossier`) dont plusieurs épinglent `id` et `titre`. La faire grossir, c'est toucher sept fichiers et multiplier par ~5 le balayage de corruption, dont la règle est que **chaque** instance rougit. Elle garde son nom et son métier : sujet du balayage. Le dossier de référence est un **second fichier**, lu par un seul test.

**Interfaces — signatures exactes**

Consommées (lues comme donnée immuable, jamais modifiées) :
```ts
validateDossier(input: unknown): DossierValidation   // ./validate
DELTAS, CHEMINS_DE_DELTAS, CERTITUDES, PORTEES       // ./deltas, ./tables, ./types
type Dossier                                          // ./types
```
Exposée : **aucune**. `suffisance.test.ts` n'exporte rien et n'importe **pas** `couverture.test.ts` (importer un fichier de test ré-exécute ses `describe`).

Forme du livrable de test :
```ts
const BRANCHES: ReadonlyArray<{ nom: string; predicat: (d: Dossier) => boolean }>
// échec par NOM de branche : expect(vides).toEqual([])
```
Prédicats **typés**, aucun second balayeur — la doctrine « un seul walker » est respectée en n'en écrivant aucun.

**Trois gardes obligatoires du lot**

1. `validateDossier(reference)` → `ok: true`, `errors: []`, **`warnings: []`**.
2. **Sous-ensemble de vocabulaire** : l'ensemble des clés JSON du dossier de référence est inclus dans celui de `dossier-minimal.json`, échec **par nom de clé en trop**. C'est ce qui garantit mécaniquement que `destinations.ts` et `tables.ts` restent hors du lot — une clé neuve serait un champ sans audience déclarée et sans test.
3. **Clôture des sites de deltas** : le nombre de sites typés parcourus est asserté égal à `CHEMINS_DE_DELTAS.length` — un cinquième emplacement ajouté demain fait rougir ici au lieu de passer inaperçu.

**Porte qualité du lot, isolément** : `tsc --noEmit` + `jest` verts, `npm run lint` vert, `git diff --stat` ne nomme **aucun** `.ts` de production sous `src/brain/`.
