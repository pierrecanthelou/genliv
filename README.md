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
    book-creation/      # name a book, seed the starting document, open the editor
    book-library/       # home screen: list / open / delete books
    tree-canvas/        # § 02 graph view (repointed onto the dossier graph in n° 2)
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

**Une feature neuve** a commencé — la n° 1, le contrat entre les deux temps :

| Feature | État | Résumé |
| --- | --- | --- |
| `dossier-format` | iter 4 / 5 ✅ | Le **dossier d'aventure** : `schema: 1` en trois racines (`canon` / `monde` / `charpente`), validateur qui refuse **en français rédigé** (19 codes, l'entité nommée, pas un chemin JSON), gel en profondeur dès l'import, round-trip import/export, et l'affordance « ⬚ Importer un dossier » dans la bibliothèque. Les **conditions** sont un arbre `ExprNode` sans aucun parseur, piloté par le registre fermé `PREDICATES` (7 entrées) : une condition qui référence une entité inexistante est refusée par son nom. Les **effets** sont un registre fermé `DELTAS` (4 entrées, slots de référence seuls) : un effet qui pointe une entité inexistante, une opération que le moteur ne reconnaît pas ou un élément de liste qui n'est pas un objet sont refusés par leur nom. it5 = dossier de référence 6 PNJ / 5 lieux. *(La forme complète des treize racines n'appartient plus à cette feature — décision A : chaque racine la reçoit dans la feature qui l'édite, n° 3 à n° 6.)* |

Et **cinq survivent** à la bascule, toutes destinées à être repointées :

| Feature | État | Repointée en | Résumé |
| --- | --- | --- | --- |
| `tree-canvas` | iter 4 ✅ | n° 2 | § 02 vue graphe : cartes de nœuds + arêtes SVG sur trame de points ; liaison vive au `BookService` ; sélection unique ; pan/zoom + repositionnement persistés par livre (`UIPreferencesService`) ; culling hors écran. Le canevas est **repointé sur le graphe de relations et d'indices** du dossier. |
| `book-library` | iter 3 ✅ | n° 2 | Écran d'accueil : grille de cartes (vue vive via `useBooks`), ouvrir / renommer / dupliquer / supprimer, recherche + tri, pastille de statut cloud par livre. Listera des **dossiers d'aventure**. |
| `cloud-sync` | iter 5 ✅ | n° 1 | `CloudSyncService` local-first décorant `PersistenceService` ; poussées groupées et débattues ; file hors-ligne persistée ; résolution de conflit. Agnostique du document — seule la forme persistée change. |
| `book-creation` | iter 3 ✅ | n° 2 | « Nouveau livre » → amorce → éditeur, en écriture local-first à travers le décorateur de synchronisation. Créera un **dossier vide**. |
| `play-mode` | squelette ✅ | n° 9 | Coquille modale au-dessus de `src/player/` (le runtime joueur extractible, ~4 400 lignes : combat, création de personnage, boutique d'XP). Suit le runtime. |

**Version `0.6.x` = Temps 1** (l'éditeur produit un dossier, features n° 1 à 8) ; `0.7.x` = **Temps 2** (le moteur joue le dossier, n° 9 à 16). PATCH +1 par itération livrée, dans l'ordre de la roadmap. Le modèle en paliers horizontaux (`0.1.x` MVP → `0.5.x` V4) est retiré : il a porté l'éditeur d'arbre jusqu'à `0.5.34`, l'historique est dans [`CHANGELOG.md`](./CHANGELOG.md).

> L'écran d'édition est aujourd'hui une **coquille** : barre supérieure + canevas d'arbre, sans panneau d'édition — le panneau et les éditeurs d'action sont partis avec la décision D3, et la liste de sections du dossier les remplace en n° 2 `bascule-editeur`.
