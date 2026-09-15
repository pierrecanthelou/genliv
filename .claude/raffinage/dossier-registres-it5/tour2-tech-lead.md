# Tour 2 — `tech-lead` · `dossier-registres` it5

**Réponse nommée à l'UX (D1).** Tu as raison sur la lettre de KR-208 : il interdit une opération entière **neuve**, pas l'usage des quatre existantes. Je retire cet appui, il était faux. Le refus ne tient pas là — et ton « coût nul » ne tient pas non plus, mesuré : `suffisance.test.ts:41-46` nomme `monde.conditions.climat[].effets_regles` `CIBLE_CLIMAT_EXCLUE`, « le SEUL emplacement de `CHEMINS_DE_DELTAS` sans delta admissible », et l'épingle **deux fois** (l.139, l.266, assertion discriminante) ; `destinations.ts:512-518` déclare cette clé **sans suffixe `[]`** parce que la liste est vide — l'audience des *éléments* n'existe donc pas. Un éditeur qui écrit un delta là produit des documents qu'une assertion `brain/` déclare inadmissibles, dont les feuilles n'ont aucune audience déclarée. Ce n'est pas « un composant générique réutilisé » : c'est un lot contrat de plus (clé de destination suffixée, `suffisance.test.ts` et `roundtrip.test.ts:115` réécrits, delta semé dans deux fixtures). Sur ce terrain — un écran qui contredit un contrat `brain/` — je pose un **veto de procédure, pas de produit** : si le comité dit oui, ces fichiers entrent dans le **lot 1** et je rechiffre. Jamais dans le lot 2.

**Statut de mes deux objections.**

- **Objection 1 (critère 7 / `EditeurEffets`)** — **maintenue**, base juridique changée (plus KR-208, mais les deux tests `brain/` ci-dessus), et **durcie en veto** sur le seul point du découpage. Je signe la réécriture de `narratif-ia` (D5).
- **Objection 2 (nom du panneau)** — **maintenue et mesurée**. Contre-exemple vérifié : `PanneauJalonsFins.tsx` porte `EYEBROW_SECTION = 'JALONS & FINS'`, qui n'est le pluriel d'**aucune** collection — c'est `SECTIONS[9].titre`. Les huit panneaux livrés suivent la même loi : fichier = `Panneau` + PascalCase(titre de section), eyebrow = titre en capitales. Donc `PanneauConditions.tsx`. Coût du choix : nul des deux côtés.

**D2** — je tiens `duree?: number`. Repli prose chiffré en annexe C.
**D3** — `manifestation?: string` **accepté**, dans le lot 1, coût vérifié en annexe C.

**VERDICT** — recevable : deux lots, séquentiels, aucun worktree.

---

# ANNEXE A — Découpage FIGÉ (2 lots, fichiers strictement disjoints)

## Lot 1 — `contrat` (seul, en premier — KR-210)

| Fichier | N/R | Ce qu'il porte |
|---|---|---|
| `src/brain/dossier/types.ts` | R | `Climat.duree?: number` + `Climat.manifestation?: string` + `export const BUDGET_MOTS_MANIFESTATION = 20` (constante **propre**, jamais `BUDGET_MOTS_JALON` réutilisé) |
| `src/brain/dossier/tables.ts` | R | 3ᵉ ligne de `CHAMPS_ENTIERS` ; 4ᵉ ligne de `BUDGETS_DE_MOTS` ; retaille du paragraphe « DEUX CHEMINS, ET DEUX SEULEMENT » (l.390-396), devenu faux |
| `src/brain/dossier/destinations.ts` | R | `…climat[].duree: 'moteur'` + `…climat[].manifestation: 'ia'` |
| `src/brain/dossier/__fixtures__/dossier-minimal.json` | R | `duree` + `manifestation` non vides sur le climat |
| `src/brain/dossier/__fixtures__/dossier-reference.json` | R | idem, en prose d'aventure réelle |
| `src/brain/dossier/validate.test.ts` | R | borne basse et non-entier refusés sur `duree` ; budget de `manifestation` calme à 20, avertit à 21 ; absence des deux = calme |
| `src/brain/dossier/couverture.test.ts` | R | **une** dispense neuve : `'monde.conditions.climat[].manifestation': PROSE_D_ENTITE_LIBRE`. **Zéro** pour `duree` |

**Ne sont dans aucun lot, et c'est une borne, pas un oubli** : `roundtrip.test.ts`, `suffisance.test.ts`, `sections.test.ts`, `identifiers.ts`, `amorce.ts`, `deltas.ts`, `validate.ts`, `brain/index.ts`, `EditeurEffets.tsx`.

## Lot 2 — écran (zéro fichier `brain/`)

| Fichier | N/R | Ce qu'il porte |
|---|---|---|
| `src/features/dossier-registres/components/PanneauConditions.tsx` | N | liste + réordonnancement + ajout + avertissements dérivés |
| `src/features/dossier-registres/components/FicheClimat.tsx` | N | `Field` NOM, `Stepper`/affordance DURÉE, `Field` multi-ligne MANIFESTATION, région `avertissements`, bandeau de refus |
| `src/features/dossier-registres/components/styles.ts` | R **si besoin** | propriété exclusive du lot 2 |
| `src/features/dossier-registres/index.ts` | R | `export { PanneauConditions }` |
| `src/features/dossier-registres/tests/panneauConditions.test.tsx` | N | critères + isolation + absence d'`EditeurEffets` |
| `src/App.tsx` | R | `conditions: <PanneauConditions dossierId={route.dossierId} />` |

**Pas de 3ᵉ lot.** `manifestation` n'ouvre pas de lot : il ajoute une ligne aux fichiers que le lot 1 possède déjà.

---

# ANNEXE B — Signatures figées

| Contrat | Type | Sens | Signature exacte |
|---|---|---|---|
| `Climat` | type | 1 fournit / 2 consomme | `interface Climat extends Entite { effets_regles: Delta[]; duree?: number; manifestation?: string }` — les deux neufs **optionnels** (additif, KR-191) |
| `CHAMPS_ENTIERS` | table | 1 fournit | `{ path: 'monde.conditions.climat[].duree', location: 'Climat', min: DUREE_MIN }` |
| `BUDGETS_DE_MOTS` | table | 1 fournit | `{ path: 'monde.conditions.climat[].manifestation', location: 'Climat', budget: BUDGET_MOTS_MANIFESTATION, sujet: 'La manifestation de ce climat' }` — forme vérifiée (`BudgetDeMots extends ChampRequis`) |
| `BUDGET_MOTS_MANIFESTATION` | constante | 1 fournit | `export const BUDGET_MOTS_MANIFESTATION = 20` dans `types.ts`, à côté de `BUDGET_MOTS_JALON` (l.108) |
| `DESTINATION_DES_CHAMPS` | table | 1 fournit | `'monde.conditions.climat[].duree': 'moteur'` et `'monde.conditions.climat[].manifestation': 'ia'` |
| `DUREE_MIN` | constante | 2 consomme | déjà sortie par `brain/index.ts` |
| `Stepper` | composant | 2 consomme | `Stepper({ label, value, onChange, min = 0, max = 99, prefix = '' })` — passer **`min={DUREE_MIN}` seul** ; `max` non passé **n'est pas « sans plafond », c'est 99** |
| `validateDossier` | fonction | 2 consomme | `validateDossier(dossier).warnings` filtré par `issue.path.startsWith(...)` — patron `PanneauJalonsFins.tsx:206-216` |
| `frapperIdentifiant` / `localiserEntite` | fonction | 2 consomme | espace `climat` déjà enregistré (`identifiers.ts:56`) |
| `DossierService.update` | service | 2 consomme | **trois racines nommées, jamais un spread de `dossier`** (patron `PanneauEvenements.tsx:162`) |
| `PanneauConditions` | composant | 2 fournit | `({ dossierId }: { dossierId: string }): JSX.Element \| null` |

---

# ANNEXE C — Bornes pour l'ouvrier, révisées

### 1. Le geste d'ajout écrit `effets_regles: []` **et rien d'autre**

```ts
const nouveau: Climat = { id: frapperIdentifiant('climat'), effets_regles: [] }
```

`duree` et `manifestation` sont **absents** à la création : aucun `?? DUREE_MIN`, aucune chaîne vide semée. Précédent lu : `BlocPlanActions.tsx:85-90`. Garde KR-013. La clé `effets_regles` est obligatoire : `CHEMINS_DE_DELTAS` + boucle §7 de `validate.ts` → `champ-requis-vide` **bloquant** si elle manque.

### 2. Le `Stepper` reste le bon composant — **si et seulement si** D2 tombe côté entier

- **D2 = entier** : `duree === undefined` → bouton pointillé « + Poser une durée… » qui committe `DUREE_MIN` ; sinon `<Stepper label="DURÉE" value={climat.duree} min={DUREE_MIN} onChange={…} />`. Motif **réimplémenté** depuis `BlocPlanActions.tsx:240-256`, **jamais importé** (import inter-features = veto, `npm run lint` le refuse).
- **D2 = prose** : le `Stepper` est **le mauvais composant**, l'affordance pointillée disparaît, `CHAMPS_ENTIERS` −1 ligne, destination `'auteur'`, `couverture.test.ts` +1 dispense, et la clé n'est **jamais** `duree` (KR-198).

### 3. `manifestation` — coût exact, vérifié par lecture

| Poste | Coût mesuré |
|---|---|
| `types.ts` | 1 champ + 1 constante `BUDGET_MOTS_MANIFESTATION = 20` |
| `tables.ts` | 1 ligne `BUDGETS_DE_MOTS` + 1 import |
| `destinations.ts` | 1 ligne `'ia'` |
| `couverture.test.ts` | **1 dispense NEUVE obligatoire**, `PROSE_D_ENTITE_LIBRE` — la boucle §9 de `validate.ts:798-816` ne produit qu'un **warning**, `ok` reste vrai, donc une corruption chaîne→nombre n'est pas refusée. Contre-épreuve : `jalons[].enonce_texte` a un budget et **aucune** dispense parce qu'il est dans `CHAMPS_REQUIS` ; `manifestation` est optionnel |
| Fixtures | valeur non vide dans les **deux** |
| `validate.test.ts` | 20 mots calme / 21 avertit |
| `brain/index.ts` | **0** tant que l'écran ne rend pas de compteur `n/BUDGET` |
| Lot 2 | 1 `Field` multi-ligne **+ la région `avertissements`** |

**Condition non négociable** : la ligne de budget déclenche KR-183 — un avertissement retourné mais non rendu est un défaut. Donc soit le lot 2 rend l'avertissement (patron `PanneauJalonsFins.tsx:206-216` + `FicheJalon.tsx:125-128`, ~15 lignes), soit la ligne de `BUDGETS_DE_MOTS` **saute** (précédent KR-203). Pas de troisième voie.

### 4. Fichiers `brain/` à ne PAS toucher — et pourquoi

| Fichier | Lignes neuves | Preuve lue |
|---|---|---|
| `roundtrip.test.ts` | **0** | `l.115` épingle déjà `climat[0].effets_regles → []` : le critère 7 réécrit est **déjà prouvé par un test existant et vert**. Le champ additif traverse `toEqual(attendu)` puisque l'attendu est dérivé du fichier lui-même |
| `suffisance.test.ts` | **0** | `CIBLE_CLIMAT_EXCLUE` (l.46) porte la décision. S'il rougit après le lot 1, c'est un **signal**, pas une cible : arrêter et remonter |
| `identifiers.ts` / `sections.ts` / `amorce.ts` / `deltas.ts` | **0** chacun | espace `climat` (l.56) et collection (l.133) déjà là ; section n° 9 déjà comptée ; `conditions: { climat: [] }` déjà semé ; aucun porteur neuf pour l'allow-list KR-215 |
| `validate.ts` | **0** | boucle §6 bis générique sur `CHAMPS_ENTIERS`, boucle §9 générique sur `BUDGETS_DE_MOTS` |
| `DossierEditorScreen.tsx` | **0** | `panneaux?: Partial<Record<SectionId, ReactNode>>` — la clé `conditions` s'injecte depuis `App.tsx` seul, `bascule-editeur` intouché (KR-184) |

### 5. Bornes de qualité du lot 2

1. **`location: 'Climat'`, jamais `'Conditions'`**.
2. **Encapsulation** — `PanneauConditions.tsx` ne cherche jamais un élément de `FicheClimat.tsx` par `querySelector` ni par libellé recopié (dette BUG-078) ; le focus après ajout passe par une `ref` que le panneau **possède**.
3. **Preuve d'absence d'`EditeurEffets`** — un test qui édite les trois champs sur un climat portant un `effets_regles` **non vide en mémoire** et vérifie qu'il ressort **intact** ; plus un `queryBy…` d'absence.
4. **KR-159/186** — le test d'isolation compte **9 autres sections** : recompter dans le fichier.
5. **`importDossier.test.tsx:114`** : zéro ricochet attendu — les trois précédents venaient d'une référence vers l'espace `pnj`. Si le compte bouge, c'est un signal, pas un chiffre à corriger.
6. **Retrait d'un climat : hors périmètre**.
7. **D5** — je signe la réécriture du critère 7 par `narratif-ia`.
