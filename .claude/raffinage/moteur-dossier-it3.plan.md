# Plan d'itération — `moteur-dossier` · itération `3`

> Statut : **`validé`** — porte 2 franchie le 2026-09-24, validation explicite de l'auteur
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-24
> Composition : **5 rôles** — motif : l'itération livre le **premier évaluateur d'`ExprNode` du moteur** et le **premier `appliquerDelta`** ; elle touche le dossier, le moteur et le mode jeu.
> Exécution : **séquentielle** (2 lots, le `contrat` seul et en premier). Pas d'essaim, pas de worktree.

## Fiche de validation

| | |
|---|---|
| **Démo** | « À la fin, l'auteur **voit un jalon de son dossier s'atteindre en cours de partie, parce que sa condition est devenue vraie**. » |
| **Tranche** | la console (it2) → `executerCommande` → `resoudreJalons` (point fixe) → `evaluerExpr` sur `FaitsDeSession` → `appliquerDelta` → `EtatSession` neuve → le journal re-rendu, ligne de jalon + pastilles d'effet. |
| **Lots** | **2** · dont `contrat` : **oui** (L1, seul et en premier) |
| **Hors périmètre** | la surface d'édition de `declencheur_expr`/`effet` · l'**export au baril** de la projection · `types.ts`, `destinations.ts`, `validate.ts` · `atteignabilite.ts`, `controles.ts` *(le test, oui ; le module, non)* · `couverture.test.ts` · `src/player/**` · tout composant neuf · la reprise de session · le replay déterministe · un 3ᵉ rôle de journal |
| **Reporté** | **l'export** de `projeterJalonsAtteints`/`JalonAtteint` → **n° 10**, avec son premier consommateur, sa borne d'agrégat et son comportement sur handle pendant · **la surface d'édition** des jalons → `dossier-registres` (2ᵉ occurrence de BUG-090) |

**Aucune proposition `INNOVATION`.** Aucun bloc `ESCALADE` : les six vetos formulés sont tous satisfaits ou requalifiés (§ 8).

---

## 1 — But raffiné

À la fin de cette itération, **l'auteur voit un jalon de son dossier s'atteindre en cours de partie, parce que sa condition est devenue vraie**.

## 2 — Hors périmètre

- **La surface d'édition de `declencheur_expr` et `Jalon.effet`.** Mesuré : **zéro** écrivain dans `src/features/**`. C'est une **2ᵉ occurrence de BUG-090**, pas son armement — reportée à `dossier-registres`, qui possède `FicheJalon.tsx`. La faire entrer ici traverserait une **seconde feature** hors lot `contrat`.
- **L'export au baril** de `projeterJalonsAtteints` et `JalonAtteint` : zéro consommateur en it3 ; la fonction et son témoin restent **dans `brain/dossier/`**.
- **`types.ts`, `destinations.ts`, `validate.ts`** : `Jalon.declencheur_expr?` et `Jalon.effet` existent déjà — **le schéma du dossier ne bouge pas**. Si un lot croit devoir les ouvrir, c'est le signal qu'il a dérivé.
- **`controles.ts`** (le module), `atteignabilite.ts`, `couverture.test.ts`, `feuilles.ts`, `src/player/**`.
- **Tout composant neuf** dans `play-mode` : aucun `JalonsAtteints.tsx`.
- **La reprise de session**, le **replay déterministe**, un **3ᵉ membre de `RoleJournal`**, l'élargissement de `CommandeId`.
- **Le score de mutation** : aucun des 4 fichiers mutés n'est au diff (KR-243). `npm run test:mutation` **ne doit pas être lancé**.

## 3 — Contrat de design

### 3.A — UNE seule entrée de journal par jalon atteint

| # | `role` | `texte` | `origine` | pastilles `deltas[]` | Badge |
|---|---|---|---|---|---|
| 1 | `joueur` | `> ALLER lieu.vigie-du-nord` | *(absent)* | — | `↪ JOUEUR` |
| 2 | `moteur` | `lieu_courant : lieu.tour-effondree → lieu.vigie-du-nord` | `'aller'` | — | `↻ MOTEUR` |
| 3 | `moteur` **(NEUF)** | `jalons_atteints : jalon.premiere-vigie` | *(absent)* | `[atteindre_jalon:jalon.premiere-vigie] [reveler_indice:indice.pas-dans-la-cendre]` | `↻ MOTEUR` |

Les trois portent le **même `tour`** (§ J1 : une conséquence enchaînée n'ajoute jamais de pas).

**UNE entrée, pas deux** — et le motif n'est pas la place, c'est la **double représentation** : une seconde entrée recopierait en prose ce que `deltas[]` porte en donnée, et un consommateur qui lit les deux compterait la révélation **deux fois**. Même défaut que `deltas: []` au lieu d'`undefined`.

**`atteindre_jalon` est le MÉCANISME, pas une décoration — MESURÉ : il est l'un des quatre `DeltaId` du registre** (`deltas.ts:74`, `refKinds: ['jalon']`). C'est donc **son descripteur qui écrit `jalons_atteints`**, et **le point fixe ne le pousse JAMAIS en direct** : deux écrivains du même champ, c'est la seconde source de vérité que KR-013 refuse et que `defineRegistre` existe pour éviter (KR-117). Conséquence sur la ligne : la pastille `[atteindre_jalon:…]` vient **en premier**, avant les pastilles d'`effet[]`, parce que c'est l'ordre causal.

### 3.B — Les pastilles de delta — **elles sont REQUISES, pas décoratives**

Gabarit : `[{delta_id}:{cibles.join(',')}]`, style `metaJournal` (identique à `[origine]`), une par élément de `entree.deltas`, **dans l'ordre du tableau**, **sans filtrage** (y compris un delta redondant avec `texte`), **sans distinction visuelle** entre `'applique'` et `'sans_effet'`.

**Elles sont le LECTEUR de `journal[].deltas`, et sans elles le champ viole KR-249** — la règle d'admission exige un chemin de code qui l'écrit **et un autre qui le lit** ; un test est un instrument, pas un chemin de code. **Précédent exact et contraignant : l'arbitrage O-2 d'it2**, où `JournalRow` a dû rendre `origine` pour la même raison. Sans les pastilles, `deltas?` serait la **troisième exemption nommée** à KR-249 dans cette feature.

### 3.C — Textes et jetons

| Élément | Gabarit | Registre | Qui compose |
|---|---|---|---|
| Ligne de jalon | `jalons_atteints : {jalon_id}` | dév.-débogueur | le **moteur** (`brain/dossier/`) |
| Pastille | `[{delta_id}:{cibles.join(',')}]` | dév.-débogueur | `JournalRow.tsx`, depuis la **donnée** — aucun littéral |
| Badge | `↻ MOTEUR` — **inchangé** | — | code existant |

**Aucun jeton neuf**, aucun `CSSProperties` neuf : les pastilles réutilisent `metaJournal`. **`--accent`, `--good`, `--bad` : aucun usage** — un jalon atteint n'est pas un résultat de jet, et distinguer `'applique'`/`'sans_effet'` par le ton réintroduirait une couleur sémantique par la bande.

### 3.D — La règle de reconstruction, inchangée et contraignante

Le `texte` est **reconstruit** : nom de champ d'`EtatMonde` + `:` + identifiant résolu. **Jamais `enonce_texte`** (audience `'ia'` : ce serait une troisième prose émise verbatim). **Jamais `jalons[].nom`** (audience `'auteur'` : un mot que l'auteur a tapé). Vocabulaire clos : **noms de champs d'`EtatMonde`**, identifiants `espace.slug`, séparateurs `>` `:` `→`. **Le `→` reste réservé à une transition scalaire** — une appartenance d'ensemble n'en porte pas.

**L'extension aux `PredicatId` est REFUSÉE** : elle ne franchit aucune ligne (registre clos, bas-de-casse), mais un prédicat est une **question**, pas un fait, et `jalons_atteints` / `jalon_atteint` se ressemblent trop pour qu'un lecteur sache lequel il lit. **Un seul espace de noms.**

### 3.E — Clavier, états

**Aucun changement** : aucun élément focusable neuf, les lignes restent des `<li>`. **Vide** : aucun jalon vrai → aucune ligne 3, absence normale, pas un état vide à part. **Erreur** : la levée de `evaluerExpr` est une erreur de **programme**, pas une UI.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature |
|---|---|---|---|
| `brain/dossier/faits.ts` — `FaitsDeSession` | type | expose | § 5, L1 — **corps DÉPLACÉ** depuis `EtatMonde`, jamais recopié ; **les SEPT champs restent REQUIS et TOTAUX (KR-254)** — la totalité est la *précondition* de la bivalence de `evaluerExpr` |
| `PredicatDescripteur.lit` / `DeltaDescripteur.ecrit` | champs de registre | expose | champ du descripteur, **jamais un `switch`** (KR-117) |
| `evaluerExpr(faits, noeud): boolean` | fonction pure | expose *(pas au baril)* | **BIVALENTE, elle LÈVE** (KR-238) |
| `appliquerDelta(faits, delta)` | fonction pure | expose *(pas au baril)* | `effet` dérivé par **`===`** sur la référence rendue par `ecrit` |
| `resoudreJalons(dossier, faits)` | fonction pure | expose *(pas au baril)* | **un corps, deux appelants** ; **point fixe borné** par `charpente.jalons.length` |
| `projeterJalonsAtteints` · `JalonAtteint` | fonction + type | **internes à `brain/dossier/`** | **ne sortent pas du baril en it3** |
| `EntreeJournal.deltas?: readonly DeltaJournalise[]` | type | expose | **optionnel à vie** (KR-251) ; `undefined` jamais `[]` |
| `DeltaJournalise { delta, cibles, effet }` | type | expose au baril | **sans `origine`** — elle vit à l'entrée (it2) |
| `DESTINATION_DES_CHAMPS_DE_SESSION` | registre | expose | **+3 lignes, toutes `'moteur'`** ; dispense `journal` « quatre » → **sept** |

## 4 bis — Contrat de sortie IA

**Aucune sortie de modèle.** Zéro appel, zéro import de `CopiloteService`, zéro URL `/ia/` — `moteurSansIA.test.ts` le tient sur une liste dérivée du disque, et les fichiers neufs y entrent **sans geste**.
Le seul artefact IA-facing est la **projection**, dont le contrat s'exécute **en n° 10** : entrée = `jalons_atteints[]` × `charpente.jalons[]` du dossier gelé, **jamais** `declencheur_texte`/`declencheur_expr`/`effet[]` · sortie `{ jalon_id, enonce }[]` **nominale** · **borne d'agrégat** propriété de la n° 10 · handle pendant **exposé, jamais filtré** *(exigence écrite en toutes lettres : **aucun KR du dépôt ne la porte** — le seul voisin vise l'arête orpheline de `tree-canvas`, pas une référence pendante de jalon ; à armer par la n° 10)* · `MARQUEUR_A_ECRIRE` non injecté (famille KR-244) · **zéro ligne dans `sessionDestinations.ts`** (c'est une valeur de retour, pas un champ persisté), audience héritée écrite **en docstring**.
**Les trois lignes ajoutées par it3 sont toutes `'moteur'`** — l'assertion `every(d => d !== 'ia')` reste **verte et intouchée**.

## 5 — Lots

> **Disjonction PAR CONSTRUCTION** : L1 = tout `src/brain/**` + `docs/` · L2 = tout `src/features/play-mode/**`. L1 ∩ L2 = ∅ même si L1 découvre un fichier de plus.

### Lot 1 — `faits-evaluateur-jalons` · **`contrat`** · seul et en premier

- **Ouvrier** : `dev-contrat`, effort élevé.
- **Fichiers** :
  - (N) `brain/dossier/faits.ts` · `evaluate.ts` · `evaluate.test.ts`
  - (R) `predicates.ts` · `deltas.ts` · `deltas.test.ts` · `expr.test.ts` · `session.ts` · `session.test.ts` · `commandes.ts` · `commandes.test.ts` · `sessionDestinations.ts` · `__fixtures__/session-saturee.ts` · `sessionCouverture.test.ts` · `tourzero.ts` · `tourzero.test.ts` · `tourzeroOracle.test.ts` · **`controles.test.ts`** · **`__fixtures__/dossier-reference.json`** · `brain/index.ts` · `docs/EXIGENCE-APERCU-DU-JEU.md` § 6
- **Nom RÉSERVÉ à L1**, que nul autre lot ne crée : `brain/dossier/jalons.ts` — si `evaluate.ts` franchit 400 lignes (KR-112), la passe y part **au-dessus de `types.ts`**.
- **INTERDITS, verts sans modification à la fin** : `types.ts`, `destinations.ts`, `validate.ts`, `controles.ts` **(le module)**, `atteignabilite.ts`, `couverture.test.ts`, `feuilles.ts`, `__fixtures__/dossier-minimal.json`, `src/player/**`, **tout `src/features/**`**.
- **Critères couverts** : #1, #2, #4, #5, #6, #7

**Signatures exposées** *(la prose de `faits.ts`, `predicates.ts` et `deltas.ts` ne doit contenir NI `op === '` NI `switch (…op)` — `expr.test.ts` les cherche commentaires compris et enrôlerait le fichier comme lecteur d'arbre)* :

```ts
// faits.ts (N) — AUCUN import. Seul domicile possible d'un type que DEUX registres frères
// doivent nommer sans se dépendre. CORPS DÉPLACÉ depuis `EtatMonde`, JAMAIS recopié.
export interface FaitsDeSession { /* les 7 champs, tous readonly, un par prédicat */ }
// session.ts : export type { FaitsDeSession as EtatMonde } from './faits'

// predicates.ts (R) : lit: (faits, cibles) => boolean      — ne LÈVE jamais
// deltas.ts    (R) : ecrit: (faits, cibles) => FaitsDeSession
//   ⚠ REND LA MÊME RÉFÉRENCE quand rien ne change — c'est ce qui rend `'sans_effet'`
//   MÉCANIQUE et non déclaratif. Précédent : `commandes.ts:207`.

// evaluate.ts (N) — importe faits, expr, predicates, deltas, types.
// N'importe NI session.ts NI commandes.ts : ce sont EUX qui l'appellent.
export interface DeltaJournalise { delta: DeltaId; cibles: readonly string[]
                                   effet: 'applique' | 'sans_effet' }
export interface JalonAtteint { jalon_id: string; enonce: string }   // INTERNE au module
export function evaluerExpr(faits, noeud: ExprNode): boolean          // LÈVE (KR-238)
export function appliquerDelta(faits, delta): { faits; journalise }   // `effet` par `===`
export function resoudreJalons(dossier, faits): { faits; atteints; deltas }
export function projeterJalonsAtteints(dossier, faits): readonly JalonAtteint[]  // PAS au baril

// session.ts (R) : readonly deltas?: readonly DeltaJournalise[]  — `undefined`, jamais `[]`
// brain/index.ts : SORT `DeltaJournalise` (type) SEUL. Ne sortent PAS : `FaitsDeSession`,
//   `evaluerExpr`, `appliquerDelta`, `resoudreJalons`, `projeterJalonsAtteints`, `JalonAtteint`.
```

**`resoudreJalons` — normatif** : **un corps, deux appelants** (`ouvrirSession` **et** `executerCommande` après chaque commande **acceptée** ; un refus n'appelle rien). **POINT FIXE BORNÉ** par `charpente.jalons.length` — `jalons_atteints` croît strictement, la terminaison est un **compteur, pas une promesse**. Un jalon **sans** `declencheur_expr` n'est jamais atteint automatiquement. Un jalon **déjà** atteint n'est pas réévalué. **Aucune mémoïsation** (KR-013). **Seul lecteur de `charpente.jalons` du dépôt.** **`jalons_atteints` n'a QU'UN ÉCRIVAIN : le descripteur `atteindre_jalon.ecrit`** — la passe ne l'étend jamais en direct (KR-117), et c'est ce qui rend sa terminaison observable : un jalon déjà atteint rend la **même référence**, donc `'sans_effet'`.
**À l'ouverture, AUCUNE entrée de journal n'est écrite** — le journal démarre vide (RETENU it1).

**`tourzero.ts` — les QUATRE cellules, dont une de motif seul** :
```
possede_objet  → 'indecidable'   (Jalon.effet admet `donner_objet`)
indice_connu   → 'indecidable'   (Jalon.effet admet `reveler_indice`)
lieu_visite    → TRIVALENTE, corps à trois bras calqué sur `lieu_courant_est` :
                 départ non posé ⇒ 'indecidable' · cible = départ ⇒ 'vrai' · sinon ⇒ 'faux'
jalon_atteint  → VALEUR INCHANGÉE, MOTIF RÉÉCRIT (§ 8, A-4)
pnj_a_revele   → 'faux', INCHANGÉE, conservée PAR MESURE (§ 8, A-5)
```
Plus les **comptes de prose** devenus faux : `tourzero.ts:126` « trois `indecidable` » → **quatre** · `tourzero.test.ts:187` → quatre/trois · `tourzeroOracle.test.ts:35-42` « ASYMÉTRIE MESURÉE » **intégralement réécrit**.

**`dossier-reference.json` — UNE arête, et rien d'autre** : `lieu.tour-effondree`.`acces` = `["lieu.foyer-du-guet", "lieu.vigie-du-nord"]`. **Aucun jalon neuf, aucun effet neuf.**

### Lot 2 — `jalon-au-journal` · feature *(après L1, contrat figé)*

- **Ouvrier** : `dev-lot`. **Territoire exclusif : `src/features/play-mode/**`.**
  - (R) `components/JournalRow.tsx` — les pastilles de `entree.deltas`
  - (N) `tests/jalonAuJournal.test.tsx`
  - (R, si rouge) `tests/deplacement.test.tsx`
- **Signature CONSOMMÉE, aucune exposée** : `EntreeJournal.deltas?: readonly DeltaJournalise[]` et le type `DeltaJournalise { delta, cibles, effet }`, **importés du baril `brain/`**, jamais de `brain/dossier/…` en chemin profond. Le lot **ne crée ni ne modifie aucun export**.
- **INTERDIT** : tout `src/brain/**`. **Aucun composant neuf.** `EcranPartie.tsx` reste **inchangé** — `session.journal.map(...)` est déjà générique. **Aucune lecture à distance** d'un détail de `JournalRow` depuis un autre composant (§ Encapsulation).
- **Critères couverts** : #3

## 6 — Critères d'acceptation *(7 — plafond 8)*

1. **Étant donné** un `ExprNode` fabriqué portant un `op` hors registre (`{ op: 'xor' } as unknown as ExprNode`), **nu** puis **sous un `non` au sommet**, **quand** `evaluerExpr` le résout, **alors** il **LÈVE dans les deux positions** — il ne rend jamais `true`. — *unitaire* — *L1*
   **Séparateur** : « lève » et « rend `false` » coïncident partout **sauf sous le `non`**. **Mutant** : `default: return false`.
   **Le témoin ne se construit sur AUCUNE fixture** : mesuré, les trois `fins[].condition_expr` du dépôt sont des `et` à conjoint faux, le mutant y survit **vert** (§ 8, A-1).

2. **Étant donné** un **CLONE de `dossier-reference.json` MUTÉ EN TEST**, portant **deux jalons distincts dont l'`effet[]` demande le MÊME `reveler_indice`**, résolus dans la même passe, **quand** les deux se déclenchent, **alors** la première entrée de `deltas` porte `effet: 'applique'`, la seconde `'sans_effet'`, et `monde.indices_connus` est **sans doublon**. — *unitaire* — *L1*
   **Séparateur (BUG-113)** : un jalon atteint **n'est jamais réévalué**, donc « demandé deux fois » est **inatteignable par un seul jalon** ; sans deux porteurs, le critère épingle une coïncidence. **Le scénario se monte sur un CLONE MUTÉ EN TEST**, jamais sur la fixture du disque. **Mutant** : `reveler_indice` en spread inconditionnel — rouge sous les **deux** mécanismes.

3. **Étant donné** `dossier-reference.json` avec l'arête neuve, **quand** l'auteur enchaîne `ALLER lieu.tour-effondree` puis `ALLER lieu.vigie-du-nord`, **alors** `session.journal` gagne, **au même `tour` que la seconde commande**, une entrée `role:'moteur'` de texte `jalons_atteints : jalon.premiere-vigie` suivie de ses pastilles `[atteindre_jalon:jalon.premiere-vigie] [reveler_indice:indice.pas-dans-la-cendre]`, **et aucune LIGNE du journal ne contient de sous-chaîne d'`enonce_texte` ni de `declencheur_texte`**. — *composant (RTL)* — *L2*
   **Séparateur** : c'est le **seul** critère qui exerce un jalon devenant vrai **EN COURS** de partie ; les autres ne prouvent que la décision (i). **Mutant** : composer `texte` en injectant `jalon.nom` au lieu de le reconstruire.
   **FORME IMPOSÉE de la clause de non-récitation (KR-255, BUG-120)** : **par LIGNE**, sur **`outerHTML`**, **drapeau `i`** — recopier `deplacement.test.tsx:123`. Sur le `textContent` du conteneur, le DOM concatène sans séparateur : l'assertion est **verte par construction**, donc elle ne mesure rien. Ce n'est pas une précaution de style, c'est le seul mode de panne que cet instrument ne peut pas voir.

4. **Étant donné** `dossier-minimal.json`, **quand** `ouvrirSession` résout les `declencheur_expr` **avant la première action**, **alors** `monde.indices_connus` contient `'indice.sceau-brise'` et `monde.jalons_atteints` contient `'jalon.premiere-nuit'` dès l'ouverture ; `tourzeroOracle.test.ts` reste vert **avec son plancher re-dérivé à 4** ; `tourzero.test.ts` reste 8/8 avec `VALEUR_ATTENDUE` amendée **en une seule édition pour les quatre cellules** et **le témoin Kleene `FAUX` réassigné** ; **et** `controles.test.ts` est amendé, la perte du vrai positif `objectif.proteger-le-sceau` étant **assertée en négatif**, jamais laissée passer en silence. — *unitaire + contrat* — *L1*
   **Séparateur (l'oubli, MESURÉ et reproductible)** : moteur corrigé, cellule non corrigée → l'oracle rougit **nommément** (`indice_connu(indice.sceau-brise) · table faux → état true`), tandis que `tourzero.test.ts` reste vert 8/8.

5. **Étant donné** `evaluate.ts` créé avec un aiguillage `switch (noeud.op)` **exhaustif au compilateur** (`default` sur un paramètre `never`), **quand** `expr.test.ts` s'exécute, **alors** la liste des lecteurs d'arbre passe à **quatre** et compte une fermeture par aiguillage. — *contrat, test-grep à amender dans le lot* — *L1*
   **Séparateur** : **mesuré** — sans amendement, la seule création d'`evaluate.ts` fait rougir `expr.test.ts:420`. **Le lot le voit ROUGE avant d'amender.**

6. **Étant donné** `EntreeJournal.deltas?` ajouté, les trois lignes de feuille dans `DESTINATION_DES_CHAMPS_DE_SESSION` et `session-saturee.ts` amendée d'une instance, **quand** `sessionCouverture.test.ts` s'exécute, **alors** aucune ligne n'est morte, aucune feuille n'est sans ligne, les **8 racines** restent 8, et l'assertion `every(d => d !== 'ia')` reste **verte**. — *contrat* — *L1*
   **Séparateur** : une ligne de table **sans instance** dans la fixture est détectée par « aucune ligne morte ».

7. **Étant donné** deux jalons chaînés dont le second **dans l'ordre du document** doit se déclencher AVANT que le premier ne devienne atteignable, **quand** `resoudreJalons` s'exécute, **alors** les deux finissent atteints, **quel que soit l'ordre d'écriture**. — *unitaire* — *L1*
   **Séparateur (famille BUG-087)** : une **passe unique** en ordre de document rate la chaîne inversée et reste **verte** sur ce même dossier. **Mutant** : `for` unique sans reboucle.

## 7 — Tests nommés

| Test | Assertion | Niveau | KR | Lot |
|---|---|---|---|---|
| `evaluate.test.ts` — « l'évaluateur lève sur une entrée non reconnue » | critère 1, **nœud fabriqué**, nu **et** sous `non` | jest unité | **KR-238** | L1 |
| `evaluate.test.ts` — « idempotence : deux jalons, un seul indice » | critère 2, clone muté | jest unité | **KR-247/248** | L1 |
| `evaluate.test.ts` — « point fixe : chaîne en ordre inverse » | critère 7 | jest unité | KR-013 | L1 |
| `evaluate.test.ts` — « la projection ne porte que `enonce` » | sérialisation sur fixture, sous-chaîne de `declencheur_texte` **absente** ; mutant `jalons.filter(atteint)` vu ROUGE | jest unité | **KR-246** | L1 |
| `evaluate.test.ts` — test-grep du **lecteur unique** de `charpente.jalons` | un seul module le nomme | jest test-grep | KR-246 | L1 |
| `session.test.ts` — « les jalons d'ouverture sont résolus » | critère 4, moitié moteur | jest unité | KR-252 | L1 |
| `tourzeroOracle.test.ts` (R) | plancher **re-dérivé à 4**, § asymétrie réécrit | jest contrat | KR-252 | L1 |
| `tourzero.test.ts` (R) | `VALEUR_ATTENDUE` en **une** édition, témoin Kleene **réassigné**, 2ᵉ bras `lieu_visite` | jest contrat | KR-237 | L1 |
| `controles.test.ts` (R) | la perte du vrai positif **assertée en négatif** | jest contrat | KR-169 | L1 |
| `expr.test.ts` (R) | **quatre** lecteurs, une fermeture par aiguillage | jest test-grep | **KR-237** | L1 |
| `tourzero.test.ts` (R) — zéro-import | `evaluate` ↔ `tourzero` ↔ `atteignabilite`, **six** assertions | jest test-grep | **KR-237** | L1 |
| `sessionCouverture.test.ts` (R) | critère 6 ; **les 7 champs d'`EtatMonde` restent requis** et chacun garde sa ligne ; **une feuille sans ligne d'audience échoue** — c'est ce qui attraperait un `pnj.<id>.sait` glissé au passage | jest contrat | KR-241 / **KR-232** / **KR-253** / **KR-254** | L1 |
| `session.test.ts` (R) — « une session sans `deltas` reste légale » | `undefined` ≠ `[]` ; une entrée d'it2 relue **sans** le champ traverse `ecrire`/relecture intacte | jest unité | **KR-251** | L1 |
| `evaluate.test.ts` — test-grep **zéro littéral d'identifiant de registre** | `evaluate.ts` ne contient **aucun** `PredicatId` ni `DeltaId` en chaîne : la résolution passe par `PREDICATES[p].lit` / `DELTAS[d].ecrit`, jamais par un aiguillage au site d'appel | jest test-grep | **KR-117** | L1 |
| `jalonAuJournal.test.tsx` (N) — clause de non-récitation | **par ligne, `outerHTML`, drapeau `i`** — la forme est imposée, pas suggérée | jest composant | **KR-255** | L2 |
| `commandes.test.ts` (R) | la passe est appelée après une commande **acceptée**, **pas** après un refus | jest unité | — | L1 |
| `jalonAuJournal.test.tsx` (N) | critère 3 + les pastilles rendues | jest composant | **KR-249** | L2 |
| `moteurSansIA.test.ts` (existant, **non modifié**) | zéro `fetch`, zéro `CopiloteService` sur les fichiers neufs | jest test-grep | KR-250 | — |

**KR cités que cette itération N'INSTRUMENTE PAS** — écrit, pas laissé en suspens :
- **KR-239** (la jouabilité rendue par les contrôles est la précondition de correction du bivalent) : la porte est **en amont**, son instrument appartient à `dossier-controles`. it3 la **nomme** dans A-8 ; il ne la reteste pas.
- **KR-244** (refus d'ouverture sur un marqueur à écrire) : obligation du **contrat de la n° 10**, rappelée au § 4 bis pour que la n° 10 l'hérite écrite. Aucune sortie de modèle en it3, donc rien à mesurer ici.

**Cas limites** : jalon sans `declencheur_expr` (jamais atteint) · jalon déjà atteint (non réévalué) · `effet: []` · deux jalons, même delta · chaîne en ordre inverse · nœud non reconnu, nu et nié · refus de commande (aucune passe).

**Non vérifiable en l'état — à recopier dans la revue** :
- **Les quatre cellules `indecidable` ne sont assertées par AUCUN instrument** — l'oracle les tait **par construction** (solidité seule). Leur correction se prouve par **l'ABSENCE d'assertion, jamais par un test vert**.
- **KR-243** : l'évaluateur, les deltas et la passe sont **hors du score de mutation**. `jest` en couverture de lignes est leur unique instrument. **La revue l'écrit noir sur blanc, elle ne le déduit pas.**
- **L'alerte perdue du linter** (`objectif.proteger-le-sceau`) : c'est une **régression produit assumée**, dans la direction permise (silence). La revue l'écrit.
- **Le « PURE, totale » d'`executerCommande`** : la garantie est désormais **conditionnelle**. Aucun instrument ne la tient — seules deux docstrings qualifiées.

## 8 — Registre des désaccords

### Les six désaccords ouverts du tour 1

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| **X-1** | Forme de `lieu_visite` hors départ | **RETENU : `'faux'`** (trivalente) — L1 | Le tech-lead **retire son propre motif comme mesuré faux** (BUG-080) : `controles.ts` n'a qu'un site d'appel, sur `echoue_si_expr` seul, où `lieu_visite` n'apparaît pas. **La QA a mesuré : `controles.test.ts` 55/55 VERT.** Et une cellule **déterminée** n'a pas de direction d'erreur — sinon `lieu_courant_est: 'faux'` serait illégale |
| **X-2** | La projection en it3 | **RETENU pour le CODE · REJETÉ pour l'EXPORT** — L1 | Le narratif retire son rejet du code (elle a un mutant nommé et un test qui le tue) et **durcit sur le baril** : zéro consommateur, et exporter une valeur qui porte `enonce_texte` à toutes les features sans garde ouvre la porte du verbatim sans que rien ne rougisse. Le tech-lead l'a retirée du baril de lui-même |
| **X-3** | Un composant de rendu ? | **REJETÉ** — les lignes de journal suffisent | Convergence PM + UX + tech-lead, chacun retirant sa propre proposition. Le PM : « *voir n'exigeait pas un composant dédié, seulement un pixel réel sur un écran que l'auteur lit* » |
| **X-4** | Ce que le journal porte | **RETENU : UNE entrée + pastilles** — L1 (texte) et L2 (pastilles) | L'UX prend son propre repli. Motif décisif du narratif : deux lignes feraient vivre l'effet **deux fois**, en donnée et en prose |
| **X-5** | KR-238 et son témoin | **RETENU : le KR est AMENDÉ** — L1 | **Mesuré** : l'illustration est fausse, le mutant survit vert sur les trois fixtures. Conclusion et mutant inchangés ; le témoin se bâtit sur un **nœud fabriqué**. Amendement **dans la spec seule** — `code-knowledge.json` est déjà un renvoi compacté qui ne porte pas l'illustration, et la porte `B3` ne réagit pas (id inchangé) |
| **X-6** | Le périmètre auteur | **REPORTÉ à `dossier-registres`** ; la **phrase de démo est précisée** | Mesuré : zéro écrivain de `declencheur_expr`. Faire entrer la surface traverserait une seconde feature. La phrase gagne « **en cours de partie** », ce que l'arête rend vrai |

### Les arbitrages de l'orchestrateur

| # | Arbitrage | Statut | Motif |
|---|---|---|---|
| **A-1** | **L'arête d'`acces` entre au lot** — `tour-effondree` → `["foyer-du-guet", "vigie-du-nord"]` | **RETENU** | **Mesuré** : `vigie-du-nord` est **inatteignable** depuis le départ, et c'est la cible du seul jalon à `declencheur_expr` de `dossier-reference` ; `dossier-minimal` n'a qu'un lieu. **Sans cette ligne, la phrase de démo est un mensonge et le critère 3 est insatisfiable.** Une **arête**, jamais un jalon neuf : un `effet[]` de plus déplacerait les producteurs d'`atteignabilite.ts` |
| **A-2** | **Cellule AVEUGLE, pas gardée** | **RETENU** | Le seul avantage de la gardée était de tenir `controles.test.ts` hors du lot — **A-1 l'y fait entrer de toute façon**. Et la gardée coûte cher au contrat : elle ferait de `tourzero.ts` un **second lecteur de `charpente.jalons`**, cassant le test-grep de KR-246 **au moment même où il est posé**, et exigerait une correspondance `delta → champ écrit` qui n'existe dans aucun descripteur |
| **A-3** | **Les pastilles sont REQUISES** | **RETENU** — L2 | Sans elles, `journal[].deltas` n'a **aucun lecteur** et viole KR-249 — un test est un instrument, pas un chemin de code. **Précédent contraignant : O-2 d'it2**, où `JournalRow` a dû rendre `origine` pour la même raison. Ce serait sinon la **troisième exemption nommée** de la feature |
| **A-4** | **La QUATRIÈME cellule : `jalon_atteint`, motif réécrit** | **RETENU** — L1 | Valeur juste, **motif faux après it3** : sa JSDoc promet « *un `declencheur_expr` que la n° 9 RÉSOUDRA* » — la décision est livrée, et un relecteur conclurait que la cellule peut décider. Elle ne le peut pas : `jalons_atteints` au tour zéro résulte d'un **point fixe** dont ce module ne tient aucune copie, et le rejouer fabriquerait le second évaluateur que KR-237 interdit |
| **A-5** | **`pnj_a_revele` reste `'faux'` PAR MESURE** | **RETENU** | `reveler_indice` est d'arité 1, sans opérande `pnj` : **aucun** `effet[]` de jalon ne peut écrire `a_dit`. **Conservée par mesure, pas par omission** — à écrire dans la revue |
| **A-6** | **Le plancher de l'oracle est 4** | **RETENU** | La QA l'a **mesuré** ; le tech-lead l'avait dérivé à 5 **sans compter les deux indices** de `dossier-minimal`. Le plancher se **re-dérive sur la mesure**, jamais sur une estimation |
| **A-7** | **Le témoin Kleene de `tourzero.test.ts` est réassigné** | **RETENU** — L1 | **Dépendance cachée que personne n'avait vue au tour 1** : ce test utilise `feuilleNue('possede_objet')` comme constante `FAUX` pour prouver la propagation `et`/`ou`. Corriger la cellule **casse le témoin qui prouve autre chose**. Le remplaçant doit rester **déterministe-`'faux'` sous les quatre cellules corrigées** — `pnj_a_revele` est le seul candidat |
| **A-9** | **`jalons_atteints` s'écrit par `atteindre_jalon`, jamais par la passe** | **RETENU** — L1 | **Mesuré** : `atteindre_jalon` est l'un des **quatre** `DeltaId` (`deltas.ts:74`). Personne au comité ne l'avait tranché, et les deux formes compilent. Si la passe étendait `jalons_atteints` en direct, le champ aurait **deux écrivains** — seconde source de vérité (KR-013) — et l'idempotence du critère 2 cesserait d'être mécanique. Conséquence de rendu : la pastille `[atteindre_jalon:…]` vient **en premier** |
| **A-8** | **« PURE, totale » se qualifie, aucun `catch`** | **RETENU** — L1 | `commandes.ts:175` écrit déjà « *lever sur un chemin utilisateur donne un écran blanc* », et it3 y greffe l'appel qui lève. **La parade n'est pas un `catch`** — il rouvrirait le faux positif que KR-238 ferme — mais la porte `jouable` en amont (KR-239) **nommée ici**, plus les deux docstrings qualifiées : « totale **sur un dossier accepté par `validateDossier`** » |

### Tous les REJETÉ, recopiés d'annexe *(BUG-082)*

| Rejeté | Motif |
|---|---|
| **Scinder le lot `contrat`** | Frontière « lecture/écriture » **illégale** (partage `evaluate.ts`) ; frontière « registres/session » livrerait `faits.ts` et `evaluate.ts` **sans lecteur de production**, rouvrant un arbitrage clos en it1. Coût : +1 ouvrier, zéro parallélisme |
| **`evaluate.ts`/`faits.ts` hors `brain/dossier/`** | `expr.test.ts:420` n'y balaie que ce répertoire — **veto réarmé** |
| **Un `switch` au site d'appel pour `lit`/`ecrit`** | KR-117 ; `deltas.ts` l'a déjà écrit |
| **Un `catch` ou tout repli `false`** autour de l'évaluateur | Rouvre exactement le faux positif que KR-238 ferme |
| **Un balayage de `charpente.jalons[].effet[]` depuis `tourzero.ts`** *(la cellule gardée)* | Casserait le test-grep du lecteur unique (KR-246) au moment où il est posé, mettrait la sémantique des jalons dans **deux** modules, et exigerait une correspondance `delta → champ` inexistante |
| **Une cellule appelant `resoudreJalons`** | Fusion des évaluateurs — **KR-237, veto** |
| **`Jalon[]` filtré, `Pick<Jalon,…>`, `Partial<Jalon>`** pour la projection | KR-246 : se ré-élargissent d'un mot en revue |
| **Exporter `FaitsDeSession`, `evaluerExpr`, `appliquerDelta`, `resoudreJalons`, la projection** | Une feature pourrait **décider une règle du jeu** hors du moteur |
| **Mémoïser l'évaluation, cacher la projection dans un `useState`/`useEffect`** | KR-013/113 |
| **`origine` dans `journal[].deltas`** · **élargir `CommandeId` d'un `'jalon'`** · **`origine` en `string`** | Pré-emption d'it2 ; le registre est ce qu'un **joueur peut TAPER** |
| **Prouver KR-247 par un jalon rejoué** | **Mécaniquement impossible** : un jalon atteint n'est pas réévalué |
| **Ajouter un JALON neuf à `dossier-reference.json`** | Un `effet[]` de plus déplace les producteurs d'`atteignabilite.ts` ; **une arête suffit** |
| **Toucher `__fixtures__/dossier-minimal.json`** | L'oracle en dépend **cellule par cellule** |
| **Toucher `types.ts`, `destinations.ts`, `validate.ts`** | Le schéma du dossier ne bouge pas |
| **Ajouter `monde.pnj.<id>.sait`**, comme champ **ou** comme clé réservée | **KR-253**, 6ᵉ occurrence de KR-013 : le savoir d'un PNJ est déterminé par le dossier, en lecture seule ; un transfert futur sera un **delta** |
| **`enonce_texte` ou `jalons[].nom` dans le journal** | Troisième prose verbatim · mot d'auteur |
| **L'extension du vocabulaire aux `PredicatId`** | Un prédicat est une **question**, pas un fait ; et deux espaces de noms indiscernables |
| **Deux lignes de journal** (jalon + effet) | L'effet vivrait **deux fois**, en donnée et en prose |
| **Une ligne dédiée pour un delta `'sans_effet'`**, une couleur pour le distinguer | Troisième état narré ; couleur sémantique par la bande |
| **Un composant `JalonsAtteints.tsx`**, un panneau, un compteur | Rendrait `enonce_texte` sans lecteur légitime — **veto UX** |
| **Un `ListRow`** pour les lignes | `onSelect` requis romprait le contrat |
| **Un 3ᵉ membre de `RoleJournal`** | Changement de contrat non sollicité |
| **Toute ligne `'ia'`** dans `sessionDestinations.ts` | Une ligne `'ia'` est une **autorisation**, pas une prévision |

## 9 — Innovation

**Aucune.** L'`INNOVATION` d'it1 — l'assertion `every(d => d !== 'ia')` écrite **pour être supprimée** par la n° 10 — reste en place, **verte**, et **aucun lot n'y touche** : les trois lignes ajoutées sont `'moteur'`.

## 10 — Définition de fini

- [ ] `npm run format` → `npx tsc --noEmit` → `npm run lint` → `npx jest` verts
- [ ] **`npm run test:mutation` NON lancé** (KR-243), et la revue l'écrit
- [ ] Tests du § 7 écrits et passants
- [ ] **Les cinq mutants obligatoires écrits, vus ROUGES, révoqués** : `default: return false` · spread inconditionnel · `jalons.filter(atteint)` · passe unique · `jalon.nom` dans le texte
- [ ] **`expr.test.ts` vu ROUGE AVANT amendement** — l'amendement ne se fait pas à l'aveugle
- [ ] Les 7 critères cochés un par un
- [ ] **Les INTERDITS verts sans modification** : `types.ts`, `destinations.ts`, `validate.ts`, `controles.ts`, `atteignabilite.ts`, `couverture.test.ts`, `dossier-minimal.json`, `src/player/**`
- [ ] **Plancher de l'oracle re-dérivé sur la MESURE** (attendu 4), jamais recopié
- [ ] Relevé d'état dérivé : **zéro site neuf** (KR-013/113)
- [ ] `evaluate.ts` **sous 400 lignes** (**KR-112**) — sinon `jalons.ts`, nom réservé
- [ ] **Budget de contexte relevé** — le couple est à **14 o**, le roadmap à **60 o** : toute ligne écrite dans l'un des deux **paie sa compaction dans ce lot-ci**
- [ ] Revue écrite : `.claude/raffinage/moteur-dossier-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | Ses deux critères entrent (#3 rendu, #3 post-commande — fusionnés) ; X-6 arbitré en (a) |
| Tech Lead | recevable sous réserve | A-2 tranche M-3 contre sa proposition de cellule gardée, avec son propre argument de KR-246 |
| UX | recevable sous réserve | `play-mode` = `JournalRow.tsx` seul ; aucun `JalonsAtteints.tsx` — **son veto est satisfait** |
| QA | recevable sous réserve | `controles.test.ts` entre au lot ; critère 4 durci aux quatre cellules ; plancher **4** |
| Narratif & IA | recevable sous réserve | Sa réserve n° 1 est **levée par A-1** ; KR-238 amendé par **sa** phrase ; export au baril refusé |
