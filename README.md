# genliv — Éditeur de « livre dont vous êtes le héros »

Authoring tool for gamebooks (choose-your-own-adventure). UI and domain terms are in **French**.

**🔀 Bascule en cours** : le produit passe d'un **arbre de choix** à un **dossier d'aventure joué par une IA**. Le plan exécutable — décisions tranchées, ordre des features, ce qui a été supprimé — est [`docs/ROADMAP-BASCULE-IA.md`](./docs/ROADMAP-BASCULE-IA.md). Temps 1 : l'éditeur produit un dossier. Temps 2 : le moteur le joue.

Règles du jeu (source de vérité) : [`docs/REGLES-DU-JEU.md`](./docs/REGLES-DU-JEU.md). Design handoff : [`design_handoff_gamebook_editor/`](./design_handoff_gamebook_editor). Règles toujours actives : [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **React 18 + TypeScript**, built with **Vite**.
- **Jest + React Testing Library** for unit/component tests (Playwright E2E planned).
- **ESLint + Prettier** (tabs, single quotes, no semicolons).

## Commands

```bash
npm install      # install dependencies
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # type-check + production build
npm test         # Jest unit/component tests
npm run lint     # ESLint
npm run typecheck# tsc --noEmit
```

## Architecture

```
src/
  main.tsx          # React root: wires brain + features
  App.tsx           # shell: maps route -> view
  style.css         # reset + design-system tokens (styles/)
  styles/           # design system: styles.css + tokens/*.css (colors, type, spacing, fonts)
  brain/            # core engine — feature-agnostic, never imports features/
    types.ts            # rules types (GameObject, SkillRoll, MonsterConfig, …) — consumed by player/
    tree.ts             # the tree model (Book, BookNode, Edge) — condemned: n° 2 then n° 9
    dossier/            # n° 1 — the adventure dossier: schema 1, validator, issues, deep freeze
    DossierService.ts   # get / open / importDossier / exportDossier (get re-validates, never raw)
    EventBus.ts         # Observer: typed cross-feature events
    Router.ts           # navigation contract
    PersistenceService.ts + persistenceKeys.ts   # the only storage gateway (KR-011/111)
    BookService.ts      # single source of truth for the book tree; seed factory
    BrainContext.tsx    # DI via React Context (Service Locator)
    components/         # cross-feature presentational primitives (KR-109)
    utils/              # cross-feature utilities (KR-110), e.g. stable id generation
  features/         # isolated feature modules; talk to the rest only through brain/
    dossier-format/     # n° 1 — import an adventure dossier + read its rejection report
    bascule-editeur/    # n° 2 — 3/3 done: DossierEditorScreen, two-column ten-section nav (SECTIONS, ListRow)
    book-creation/      # name a book, seed the starting document, open the editor
    book-library/       # home screen: list / download / delete adventure dossiers
    tree-canvas/        # § 02 graph view — code untouched, dormant since n°2; repointed in n°6
    cloud-sync/         # local-first sync decorator + conflict resolution
    play-mode/          # modal shell over the player runtime
  player/           # extractable play runtime — imports only pure brain/ functions
```

**Principles** (see `CLAUDE.md` for the full set):

- **Single source of truth**: the book lives in `BookService`. Canvas and preview are views — never private copies (KR-020).
- **Feature isolation**: a feature never imports another feature; cross-feature communication goes through `brain/` contracts only.
- **Persistence only via `PersistenceService` / `persistenceKeys.ts`** — no raw `localStorage` in feature code.
- **Derived state computed inline** (no `useEffect` mirroring); **references by stable id**, never by name.
- **Design fidelity**: render from `styles/` tokens + `brain/components/` primitives only; light theme; ≥44px hit targets; keyboard-operable.

## Domain model — en bascule

> **Le produit bascule** de « un livre = un arbre de nœuds + arêtes » vers « un **dossier d'aventure** joué par une IA ». Le plan exécutable est [`docs/ROADMAP-BASCULE-IA.md`](./docs/ROADMAP-BASCULE-IA.md) — décisions tranchées, ordre des features, ce qui a été supprimé et pourquoi. Le modèle décrit ci-dessous est celui qu'implémente le code **aujourd'hui** ; la feature n° 1 `dossier-format` le remplace.

Node kinds: `sommaire` (root) · `choix` · `pnj` · `decor` · `piege` · `monstre` · `fin` · `mort` (locked death leaf). Edges carry a `kind`: `choice` | `relink` | `flee`. Every new book is seeded with **exactly two nodes**: a `sommaire` (empty text zone, root) and an **isolated, locked** `mort` node (0 edges) — never auto-linked on create.

## Features

Huit features ont été supprimées le 2026-08-03 par la décision D3 (`outline-view`, `node-editor`, `choice-linking`, `book-export`, et les quatre `action-*`) : elles étaient câblées sur des types de nœuds, des choix et des formats d'export que la bascule abandonne. Leur code est dans l'historique git.

**Deux features neuves se sont achevées** — la n° 1, le contrat entre les deux temps, et la n° 2, qui bascule l'éditeur lui-même :

| Feature | État | Résumé |
| --- | --- | --- |
| `dossier-format` | **5/5 ✅ terminée** | Le **dossier d'aventure** : `schema: 1` en trois racines (`canon` / `monde` / `charpente`), validateur qui refuse **en français rédigé** (19 codes, l'entité nommée, pas un chemin JSON), gel en profondeur dès l'import, round-trip import/export, et l'affordance « ⬚ Importer un dossier » dans la bibliothèque. Les **conditions** sont un arbre `ExprNode` sans aucun parseur, piloté par le registre fermé `PREDICATES` (7 entrées) : une condition qui référence une entité inexistante est refusée par son nom. Les **effets** sont un registre fermé `DELTAS` (4 entrées, slots de référence seuls) : un effet qui pointe une entité inexistante, une opération que le moteur ne reconnaît pas ou un élément de liste qui n'est pas un objet sont refusés par leur nom. it5 livre le **dossier de référence** (`dossier-reference.json`, 6 PNJ / 5 lieux, distinct de la fixture minimale) et sa checklist de suffisance à sept branches nommées. *(La forme complète des treize racines n'appartient plus à cette feature — décision A : chaque racine la reçoit dans la feature qui l'édite, n° 3 à n° 6.)* |
| `bascule-editeur` | **3/3 ✅ terminée** | La navigation latérale passe de l'arbre à une liste de sections. it1 repointe `book-library` sur `DossierService` (`list`/`remove`, `DossierResume` en union discriminée lisible/illisible) : la bibliothèque liste, télécharge et supprime des dossiers d'aventure, BUG-048 (dossier-format) fermé pour de bon par un constat de présence par clé. `tree-canvas` mis en sommeil (repointage réel reporté à n° 6, faute de données relationnelles avant n° 4/5/6). it2 repointe `book-creation` sur `Dossier` (`DossierService.create`, seed marqué `⟨à écrire⟩` jamais joué tel quel), fait naître `DossierEditorScreen` (écran minimal, nouveau fichier — `EditorScreen.tsx` reste intact) sur une nouvelle route `{name:'dossier'}`, et rend une carte de bibliothèque cliquable pour rouvrir un dossier déjà présent. it3 livre la vraie nav : `SECTIONS` (registre `brain/`, dix sections comptées, jamais recalculées localement) rendue par `ListRow` (`brain/components`, portée sans sa poignée de glisser) sur deux colonnes, panneau droit à état vide nommé par section, `useOpenDossier` pour le rafraîchissement en direct. `EditorScreen.tsx`/`App.tsx`/le type `Route` restent intouchés — la démolition physique reste n° 9, et le critère de sortie est désormais un verrou anti-régression (aucun code de production ne navigue plus vers l'écran Book) plutôt qu'un grep de contenu. |

Et **quatre autres survivent** à la bascule, toutes destinées à être repointées :

| Feature | État | Repointée en | Résumé |
| --- | --- | --- | --- |
| `tree-canvas` | iter 4 ✅ — **code intact, en sommeil depuis n° 2** | n° 6 | § 02 vue graphe : cartes de nœuds + arêtes SVG sur trame de points ; liaison vive au `BookService` ; sélection unique ; pan/zoom + repositionnement persistés par livre (`UIPreferencesService`) ; culling hors écran. `EditorScreen.tsx` (racine de composition, hors de tout lot) monte toujours `TreeCanvas` sans modification ; depuis `bascule-editeur` it1, plus aucun chemin d'IHM n'y mène (book-creation/book-library ne naviguent plus vers la route éditeur). **`EditorScreen.tsx` reste intouché à l'issue d'it3** — le raffinage a mesuré que le vider ou le supprimer casserait dix tests d'intégration de `tree-canvas` lui-même (`TreeCanvas.test.tsx` monte `<App/>` sur la route `editor` et asserte le rendu de l'écran) ; sa démolition physique, comme celle de `BookService.ts`/`kinds.ts`/`tree.ts`, reste entièrement reportée à n° 9. Repointage réel sur des données (aucune avant n° 4/5/6) reporté à n° 6 `dossier-registres`. |
| `book-library` | **repointée — `bascule-editeur` it1+it2 ✅** | n° 2 | Écran d'accueil : grille de cartes de **dossiers d'aventure** (vue vive via `useDossiers`), télécharger / supprimer, recherche + tri, avis nommé si des livres pré-bascule restent invisibles. Depuis it2, le titre d'une carte lisible est cliquable et rouvre le dossier sur `DossierEditorScreen`. Renommer/dupliquer un dossier : hors périmètre, reportés. |
| `cloud-sync` | iter 5 ✅ | n° 1 | `CloudSyncService` local-first décorant `PersistenceService` ; poussées groupées et débattues ; file hors-ligne persistée ; résolution de conflit. Agnostique du document — seule la forme persistée change. |
| `book-creation` | iter 3 ✅ | n° 2 | « + Nouveau dossier » → `DossierService.create()` sème un dossier valide (canon + un lieu + un point de départ, tous les textes de prose marqués `⟨à écrire⟩`) → écran d'édition, en écriture local-first à travers le décorateur de synchronisation. **Repointée sur `Dossier` depuis `bascule-editeur` it2 ✅** — remonte dans la bibliothèque, dont elle était retirée depuis it1. |
| `play-mode` | squelette ✅ | n° 9 | Coquille modale au-dessus de `src/player/` (le runtime joueur extractible, ~4 400 lignes : combat, création de personnage, boutique d'XP). Suit le runtime. |

**Version `0.6.x` = Temps 1** (l'éditeur produit un dossier, features n° 1 à 8) ; `0.7.x` = **Temps 2** (le moteur joue le dossier, n° 9 à 16). PATCH +1 par itération livrée, dans l'ordre de la roadmap. Le modèle en paliers horizontaux (`0.1.x` MVP → `0.5.x` V4) est retiré : il a porté l'éditeur d'arbre jusqu'à `0.5.34`, l'historique est dans [`CHANGELOG.md`](./CHANGELOG.md).

> L'écran d'édition **de livre** (`EditorScreen.tsx`, route `editor`) est une **coquille intacte et injoignable** : barre supérieure + canevas d'arbre, sans panneau d'édition, plus aucun chemin d'IHM n'y mène depuis `bascule-editeur` it1 — sa démolition physique est reportée à n° 9. L'écran d'édition **de dossier** (`DossierEditorScreen`, route `dossier`, fichier neuf de `bascule-editeur`) affiche depuis it3 sa vraie navigation à deux colonnes : dix `ListRow` (Canon, Départ, Personnages, Lieux, Objets, Indices, Quêtes, Événements, Conditions, Jalons & fins) avec compteur exact à gauche, panneau droit à état vide nommé par section à droite — aucun formulaire d'édition de fiche avant n° 3 à n° 6.
