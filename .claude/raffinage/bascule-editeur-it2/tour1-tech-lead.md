# Tour 1 — Tech Lead — bascule-editeur it2/3

**RISQUE** — `src/App.tsx` est le point de couture de TROIS préoccupations de cette tranche : monter l'entrée de création, monter la route `dossier`, retirer la garde `book:deleted` devenue inarmable (KR-071). Deux lots qui le nomment produisent le seul conflit que `tsc` ne voit pas — les deux branches compilent. Second risque, plus silencieux : `create()` sème un document dont **personne n'a jamais exercé la validité**. `dossier-minimal.json` peuple TOUTES les collections ; un dossier à listes vides partout, un seul lieu, est un chemin que le validateur n'a jamais rendu vert.

**OBJECTION** — (1) Le critère 6 exige l'id testé « à la création **ET à la duplication** » : `duplicate()` est nommément reportée par les `open_questions`. Critère intestable tel qu'écrit. Et `createDossierId()` **publique** n'a qu'un appelant : c'est de la dette, pas un contrat. (2) `design_contract.registres_de_langue` affirme « aucun champ ici n'est lu par le joueur » — faux dès que le seed écrit `accroche_joueur` et `texte_ouverture_joueur`. (3) Le message « feature n° 9 » ne peut pas être en dur dans `brain/components/EditorTopBar.tsx` : la chrome partagée ne connaît pas la feuille de route.

**PROPOSITION** — 3 lots (annexe B), `App.tsx` possédé par le seul lot 2. L'écran minimal vit dans `src/features/bascule-editeur/`, jamais une branche dans `EditorScreen.tsx` — qui n'est dans AUCUN lot. `EditorTopBar` gagne 4 props optionnelles, zéro prop requise modifiée. `create(titre: string): Dossier`, id et seed internes.

**VERDICT** — **recevable sous réserve** : objections 1 et 3 tranchées avant l'ouverture du lot 1.

*(248 mots)*

---

### Annexe A — signatures exactes exposées par le lot `contrat`

#### A.1 · `src/brain/Router.ts`

```ts
export type Route = { name: 'home' } | { name: 'editor'; bookId: string } | { name: 'dossier'; dossierId: string }
```

**ADDITIF, strictement.** `editor`/`bookId` reste (décision actée) : trois suites l'utilisent encore en montage (`tree-canvas/tests/TreeCanvas.test.tsx` ×3, `cloud-sync/tests/ConflictDialog.test.tsx` ×2). Le retirer ici ferait rougir cinq navigations pour un gain nul, et la démolition est à la n° 9. Après le lot 2, **aucun code de production ne navigue plus vers `editor`** — relevé actuel : le seul appelant est `src/features/book-creation/hooks/useCreateBook.ts:17`, que le lot 2 supprime.

#### A.2 · `src/brain/DossierService.ts`

```ts
export interface DossierService {
	get(id: string): Dossier | null                     // inchangé
	list(): DossierResume[]                             // inchangé
	open(id: string): void                              // inchangé
	importDossier(fileText: string): DossierInspection  // inchangé
	exportDossier(id: string): Dossier | null           // inchangé
	remove(id: string): boolean                         // inchangé
	/**
	 * Sème un dossier VALIDE au sens de `validateDossier` (KR-178) et le persiste,
	 * PUIS émet `dossier:created` (KR-004). Le titre est `trim()`é ; vide, il
	 * retombe sur TITRE_PAR_DEFAUT — le service ne dépend pas de la garde du dialogue.
	 * N'ouvre pas et ne navigue pas : c'est l'appelant qui enchaîne `open()`.
	 */
	create(titre: string): Dossier
}
```

**`createDossierId` reste PRIVÉE au module** (objection 1) — fonction de fichier, non exportée, absente de l'interface :

```ts
/** Un id conforme à FORME_ID_DOSSIER — jamais createId(), dont le `_` est refusé (KR-177). */
function createDossierId(): string
```

Motif : un seul appelant (`create`), et le second nommé par la spec (`duplicate`) est reporté par les `open_questions`. L'exposer maintenant, c'est livrer une méthode que personne n'appelle — exactement ce que la docstring du service refuse déjà pour `rename`/`update`. **Si le comité maintient la ligne `brain_contracts`, elle est honorée par l'`id` que rend `create()`, et le contrat se réécrit à la feature qui livrera `duplicate()`.**

Corollaire de test : **ne pas exporter `FORME_ID_DOSSIER`** depuis `validate.ts` (privé, l. 106) et **ne pas recopier la regex** dans un test (KR-117). Le garde s'écrit :

```ts
const v = validateDossier(dossiers.create('Le sceau'))
expect(v.ok).toBe(true)
expect(v.errors).toEqual([])
expect(v.warnings).toEqual([])
```

`warnings` vide est atteignable et vaut la peine : les trois familles d'avertissement (`revelation-sans-porte`, `condition-sans-expr`, `texte-trop-long`) ne peuvent pas tirer sur un seed sans savoir, sans fin en prose et sous budget. **Un seed qui avertit dès sa naissance est un défaut, pas un état calme** — cette assertion le dit une fois pour toutes.

#### A.3 · La FORME du seed (lot contrat, littéral unique dans `DossierService.ts`)

Dérivée de `RACINES` + `CHAMPS_REQUIS` + `LISTES_REQUISES` + `REFERENCES_SIMPLES` (`src/brain/dossier/tables.ts`), **pas** de `src/brain/dossier/__fixtures__/dossier-minimal.json` — cette fixture peuple toutes les collections et n'est pas un minimum.

```ts
const LIEU_INITIAL = 'lieu.premier-lieu'   // conforme à FORME_IDENTIFIANT : ^(pnj|lieu|…)\.[a-z0-9-]+$
const TITRE_PAR_DEFAUT = '…'               // rédaction UX

{
	schema: DOSSIER_SCHEMA,
	id, titre, createdAt: now, updatedAt: now,
	canon: {
		mj:      { synopsis_mj: AMORCE.synopsis_mj },          // requis, non vide
		partage: { accroche_joueur: AMORCE.accroche_joueur },  // requis, non vide — REGISTRE JOUEUR
		ton: AMORCE.ton,                                       // requis, non vide
		interdits_ton: [], objectifs: [],
	},
	monde: {
		personnages: [], lieux: [{ id: LIEU_INITIAL, nom: AMORCE.nom_lieu }],
		objets: [], indices: [], quetes: [], evenements: [],
		conditions: { climat: [] },                            // LISTES_REQUISES
	},
	charpente: {
		depart: { lieu_id: LIEU_INITIAL, texte_ouverture_joueur: AMORCE.ouverture }, // RÉSOUT contre lieux[]
		jalons: [], fins: [],
	},
}
```

**Objection 2, contrainte technique qui en découle** : `accroche_joueur` et `texte_ouverture_joueur` sont de registre JOUEUR — ils sortent vers le modèle au Temps 2. Un seed qui y écrit de la prose plausible peut **être joué tel quel** sans que rien ne le signale. Les valeurs d'`AMORCE` sont rédigées par l'UX, sous une contrainte non négociable : **chaque valeur se désigne elle-même comme un texte à écrire**, jamais une phrase qu'un joueur pourrait plausiblement entendre. Le propriétaire de la détection « amorce jamais modifiée » est le linter n° 7 `dossier-controles`, nommé, pas construit ici.

#### A.4 · `src/brain/components/EditorTopBar.tsx`

**Aucune prop requise ne change** — `src/EditorScreen.tsx` (chemin Book) reste intact, donc hors de tout lot, conformément à la décision actée.

```ts
export interface EditorTopBarProps {
	title: string
	onBack: () => void
	nodeCount?: number           // ÉTAIT requis → optionnel ; le Badge ne se rend que s'il est fourni
	onAddNode?: () => void       // ÉTAIT requis → optionnel ; « + Nœud » ne se rend que s'il est fourni
	actions?: React.ReactNode    // inchangé
	onPreview?: () => void       // inchangé
	backLabel?: string           // NOUVEAU, défaut 'Mes livres' ; l'écran dossier passe le sien (rédaction UX)
	previewDisabledHint?: string // NOUVEAU — le texte du `title` quand onPreview est absent
}
```

Rendu : `{nodeCount !== undefined && <Badge …>}`, `{onAddNode && <button …>}`, et
`title={onPreview ? 'Aperçu du jeu' : (previewDisabledHint ?? 'Aperçu du jeu — mode lecture (hors éditeur)')}`.

**Pourquoi pas un `badge?: ReactNode` générique** (plus propre en Open/Closed) : il forcerait `EditorScreen.tsx` à changer, alors que la décision actée interdit d'y toucher « au-delà du strict nécessaire ». Deux optionnels et zéro churn valent mieux qu'une belle prop et un fichier condamné rouvert.

**Pourquoi une prop et pas un `if` dans la barre** (objection 3) : `brain/components/` est agnostique des features par contrat. Y écrire « feature n° 9 » met la feuille de route dans la chrome partagée, et le jour où la n° 9 branche l'aperçu, la chaîne survit dans un fichier que personne ne relit. **Le message appartient à l'écran qui sait pourquoi il est désactivé.**

Observable : `expect(bouton).toBeDisabled()` + `expect(bouton).toHaveAttribute('title', <texte exact>)` — RTL, instrument déjà en place.

#### A.5 · Consommé par les lots feature, rien d'autre

`useBrain().dossiers.create/open/get`, `useBrain().router.navigate`, `useRoute()`, `EditorTopBar`, `Modal`, `Field`, `useSyncStatus`, `type Dossier`, `type DossierResume`.
**Jamais** `persistence`, **jamais** `dossierKey`, **jamais** `validateDossier` en code de feature (KR-011/111).
**Jamais** `buildAdventureDocument` depuis un `Dossier` : sa signature prend un `Book`, c'est le typage qui tient KR-167, pas une consigne.

---

### Annexe B — découpage en lots (propriété exclusive, aucun fichier partagé)

| Lot | Type | Fichiers (N = créé, R = remplacé, D = supprimé) | Vérifiable seul |
|---|---|---|---|
| **1 — `contrat-dossier-create`** *(seul, EN PREMIER)* | `contrat` | **R** `src/brain/Router.ts` · **R** `src/brain/DossierService.ts` · **R** `src/brain/DossierService.test.ts` · **R** `src/brain/components/EditorTopBar.tsx` · **N** `src/brain/components/EditorTopBar.test.tsx` | `tsc` + `jest` : seed validé sans erreur NI avertissement ; id conforme via `validateDossier` ; `get(create(t).id)` non nul ; ordre persistance→`dossier:created` ; titre vide → `TITRE_PAR_DEFAUT` ; barre sans `nodeCount`/`onAddNode` ; `title` du bouton désactivé |
| **2 — `creation-et-ecran-dossier`** *(contrat figé)* | feature | **N** `src/features/book-creation/hooks/useCreateDossier.ts` · **N** `.../components/CreateDossierEntry.tsx` · **N** `.../components/NewDossierButton.tsx` · **N** `.../components/NewDossierDialog.tsx` · **N** `.../tests/createDossierFlow.test.tsx` · **N** `.../tests/NewDossierDialog.test.tsx` · **R** `.../index.ts` · **D** `.../hooks/useCreateBook.ts`, `.../components/CreateBookEntry.tsx`, `.../components/NewBookButton.tsx`, `.../components/NewBookDialog.tsx`, `.../tests/createFlow.test.tsx`, `.../tests/NewBookDialog.test.tsx` · **N** `src/features/bascule-editeur/components/DossierEditorScreen.tsx` · **N** `src/features/bascule-editeur/index.ts` · **N** `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` · **R** `src/App.tsx` | RTL sur `<App/>` : « + Nouveau dossier » → titre → « Créer » → l'écran d'édition rend le titre du dossier ; `['dossier:created','dossier:opened']` dans l'ordre, magasin déjà écrit au premier ; « Aperçu du jeu » désactivé + `title` exact ; route `dossier` inconnue → message nommé + retour accueil |
| **3 — `ouvrir-un-dossier-depuis-la-bibliotheque`** *(contrat figé ; PARALLÈLE au lot 2)* | feature | **R** `src/features/book-library/components/DossierCard.tsx` · **R** `src/features/book-library/components/LibraryScreen.tsx` · **R** `src/features/book-library/hooks/useDossierLibrary.ts` · **R** `src/features/book-library/tests/dossierLibrary.test.tsx` | RTL sur `<LibraryScreen/>` monté DIRECTEMENT (pas `<App/>`, § B.3) : clic sur le titre d'une carte lisible → `router.current()` vaut `{name:'dossier', dossierId}` ; `dossier:opened` part AVANT la navigation ; une carte `lisible:false` n'offre AUCUNE affordance d'ouverture |

**Hors lots, écrits par l'orchestrateur à l'étape 4** (pour qu'aucun lot ne les nomme et qu'aucune fusion ne s'y joue) : `src/features/bascule-editeur/specification.json`, `src/features/book-creation/specification.json`, `src/features/book-library/specification.json`, `CHANGELOG.md`, `README.md`, `features_history.json`, `code-knowledge.json`, `bug_history.json`, `docs/ROADMAP-BASCULE-IA.md`, `package.json`.

**Inchangés, et c'est la preuve du respect des décisions actées** : `src/EditorScreen.tsx` (chemin Book, intact — sa démolition est l'affaire d'it3/n° 9), tout `src/features/tree-canvas/**`, tout `src/features/play-mode/**`, tout `src/features/dossier-format/**`, tout `src/player/**`, `src/brain/index.ts` (aucun export neuf : `Route`, `DossierService`, `EditorTopBar` sont déjà au baril), `src/brain/dossier/**`, `.eslintrc.cjs` (`bascule-editeur` y est déjà, ajouté en it1).

#### B.1 — Pourquoi le lot 2 n'est pas deux lots

`src/App.tsx` doit, dans la même version : monter `<CreateDossierEntry/>` (book-creation), monter `<DossierEditorScreen/>` sur la route `dossier` (bascule-editeur), et retirer la garde `book:deleted` + `isEditingBook` (KR-071). Scinder impose à l'un des deux lots d'importer un module que l'autre n'a pas encore créé : il ne compile pas dans son worktree. **Là où deux préoccupations se rencontrent dans un fichier, elles sont un lot** — c'est le découpage qui révèle l'absence de parallélisme, pas un choix de confort.

#### B.2 — Pourquoi le lot 3 est réellement parallèle

Il ne consomme du lot 1 que la route (`Router.ts`) et l'union `DossierResume` déjà livrée en it1. Il ne consomme **rien** du lot 2 : il navigue, il ne rend pas l'écran. Aucun de ses quatre fichiers n'est nommé ailleurs. Deux vagues : lot 1, puis lots 2 ‖ 3.

#### B.3 — La seule chausse-trappe du lot 3, écrite pour que l'ouvrier ne la découvre pas

`src/features/book-library/tests/dossierLibrary.test.tsx` monte aujourd'hui `<App/>` (l. 7 et 33). Dans le worktree du lot 3, `App.tsx` n'a **pas** la branche de route `dossier` : naviguer y retombe sur `LibraryScreen`. Le nouvel essai monte donc **`<LibraryScreen/>` directement** sous un `BrainProvider` et n'assert que `brain.router.current()` — les essais existants qui montent `<App/>` restent intacts. Un ouvrier qui essaierait d'asserter « l'écran d'édition s'affiche » écrirait un essai qui dépend du lot 2 : c'est le lot 2 qui porte cette assertion-là.

---

### Annexe C — réponse à la question ouverte : ouvrir une carte de dossier existant

**OUI, dans cette tranche — comme lot 3, indépendant et détachable.**

Trois raisons, dans l'ordre où elles pèsent :

1. **Sans lui, le dossier fraîchement créé devient injoignable.** L'auteur crée, atterrit dans l'éditeur, revient à l'accueil — et ne peut plus jamais y retourner. Ce n'est pas un manque transitoire, c'est une bibliothèque qui **liste ce qu'elle ne sait pas ouvrir**. Le comité d'it1 a déjà refusé « une affordance qui ment » ; ceci en est l'exacte réciproque.
2. **Le coût est de quatre fichiers, tous dans `book-library`, aucun partagé.** La carte n'a pas à devenir cliquable en entier — ce serait imbriquer des boutons dans une surface cliquable, et il y en a déjà deux (télécharger, supprimer). **Le titre devient le bouton d'ouverture**, dans la seule branche `lisible: true` : c'est l'**union discriminée qui interdit d'ouvrir un illisible**, pas un `if` de rendu.
3. **La coupe reste possible sans rien défaire.** Retirer le lot 3 laisse les lots 1 et 2 intacts, aux mêmes fichiers. C'est la propriété qui rend la question réversible, et c'est ce que doit produire un découpage : si le comité préfère reporter à it3, le report ne coûte rien.

**Contre-argument que je porte moi-même** : it2 touche alors TROIS dossiers de feature, et le contrôle de taille de la skill en fait un signal de coupe. Je le lève sur mesure, pas sur principe — phrase de démo unique (« l'auteur crée un dossier d'aventure et l'ouvre dans l'éditeur »), 3 lots ≤ 4, ~6 critères ≤ 8, et **7 / 4 fichiers pour les deux lots feature**. La tranche tient. Si le comité déplace le périmètre, c'est le lot 3 qui part — jamais un regroupement artificiel des lots 2 et 3.

**Ce que le lot 3 n'apporte PAS** (à écrire dans le hors-périmètre, sinon un ouvrier l'inventera) : pas de survol qui révèle « Ouvrir », pas de double-clic, pas d'`Entrée` sur la carte entière, pas de puce de synchro par carte (déjà reportée en it1), pas de renommage.

---

### Annexe D — l'écran minimal : où il vit et ce qu'il lit

`src/features/bascule-editeur/components/DossierEditorScreen.tsx`

```tsx
export function DossierEditorScreen({ dossierId }: { dossierId: string }): JSX.Element
```

- **Pas une branche dans `src/EditorScreen.tsx`** : ce fichier est typé `Book`, importe `TreeCanvas`, `PlayerModal` et `buildAdventureDocument`, et le critère 12 d'it3 exige qu'il n'en contienne plus trace. Y ajouter une branche `Dossier`, c'est écrire du code dont la suppression est déjà planifiée.
- **Pas `src/DossierScreen.tsx` à la racine** non plus : la décision actée place le slice neuf de navigation par sections dans `src/features/bascule-editeur/`. L'y poser dès it2 fait qu'it3 **grossit un fichier au lieu d'en déplacer un**.
- **Lecture** : `const dossier = useMemo(() => dossiers.get(dossierId), [dossiers, dossierId])`. **Pas de hook `useDossier(id)`** dans cette itération : un seul appelant, et la spec ne nomme pas de second (`brain_contracts` cite `useDossiers()`, au pluriel, déjà livré). Il se promeut en `src/brain/hooks.ts` à it3, quand les compteurs de `SECTIONS` en feront un second consommateur — et c'est **à ce moment-là** qu'un abonnement à `dossier:updated` deviendra nécessaire.
  - **Limite connue, à écrire, propriétaire it3** : une adoption cloud (`dossier:updated`) pendant que l'écran est ouvert ne rafraîchit pas le titre. Sans mutation possible en it2, la fenêtre est étroite ; elle ne l'est plus dès qu'un formulaire écrit.
- **`get()` rendant `null`** (dossier absent, supprimé ailleurs, ou devenu illisible) → **état nommé + retour à l'accueil**, calqué sur le « Livre introuvable. » de `EditorScreen.tsx` (rédaction UX). **C'est ce garde-là qui remplace la garde KR-071 supprimée d'`App.tsx`** : il vit dans l'écran, où il est testable en montant la route sur un id inconnu — au lieu d'un abonnement d'événement dont aucun émetteur n'est atteignable depuis cette route.
- **Aucune garde `dossier:deleted` n'est ajoutée dans `App.tsx`.** `remove()` est le seul émetteur, et sa seule affordance vit sur l'accueil : depuis la route `dossier`, elle est **inatteignable**. Poser la garde maintenant, c'est remplacer une garde morte par une garde morte au nom neuf. Elle devient due le jour où une suppression est atteignable depuis l'éditeur — nommé, pas construit.

`src/features/bascule-editeur/index.ts` → `export { DossierEditorScreen } from './components/DossierEditorScreen'`. API publique de la feature, consommée par la seule racine de composition.

---

### Annexe E — hors périmètre nommé (pour que l'essaim ne l'invente pas)

- **Aucune conversion `Book` ↔ `Dossier`, dans aucun sens** (KR-167). `create()` ne lit aucun `Book` ; `useCreateDossier` n'appelle jamais `books.*`. Le typage de `buildAdventureDocument(book: Book)` tient l'invariant de « Aperçu du jeu » tout seul.
- **`create()` ne contrôle pas l'occupation de la clé.** Un id issu de `crypto.randomUUID()` n'entre pas en collision ; ajouter un `cleOccupee()` défensif serait une branche qu'aucun test n'atteint.
- **Aucune démolition de `BookService`/`kinds.ts`/`tree.ts`** (KR-181, n° 9). `useBooks()` reste vivant dans `book-library` pour l'état vide transitoire d'it1 — le lot 3 n'y touche pas.
- **`src/EditorScreen.tsx` et la route `editor` survivent** à cette itération, désormais **sans appelant de production**. Le test-grep du critère 12 est l'affaire d'it3.
- **Aucune nav de sections, aucun compteur, aucun `ListRow`, aucun layout à deux colonnes** : it3, décision actée. L'écran d'it2 est une barre + un état vide nommé, rien de plus.
- **Renommer / dupliquer un dossier** : hors périmètre, déjà reporté par les `open_questions`. Corollaire direct de l'objection 1 sur le critère 6.
- **Aucun `localStorage` brut, aucun `dossierKey()` en code de feature** (KR-011/111) — la règle ESLint le refusera, ce n'est pas une consigne de revue.
- **Score de mutation : sans objet.** Aucun des quatre fichiers mutés (`challenge`, `combat`, `xp`, `characteristics`) ni aucun registre de la table dorée n'est dans un lot. À confirmer par grep en fin d'itération, pas à supposer.
