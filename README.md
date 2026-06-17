# genliv — Éditeur de « livre dont vous êtes le héros »

Authoring tool for gamebooks (choose-your-own-adventure). A **book = a tree of nodes + edges**, and that tree is the thing that persists. Scope is **editor/authoring mode only**; play mode is deferred. UI and domain terms are in **French**.

Design handoff and binding specs live in [`design_handoff_gamebook_editor/`](./design_handoff_gamebook_editor); always-on rules are in [`CLAUDE.md`](./CLAUDE.md).

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
    types.ts            # domain model (Book, BookNode, Edge, NodeKind, EdgeKind)
    EventBus.ts         # Observer: typed cross-feature events
    Router.ts           # navigation contract
    PersistenceService.ts + persistenceKeys.ts   # the only storage gateway (KR-011/111)
    BookService.ts      # single source of truth for the book tree; seed factory
    BrainContext.tsx    # DI via React Context (Service Locator)
    components/         # cross-feature presentational primitives (KR-109)
    utils/              # cross-feature utilities (KR-110), e.g. stable id generation
  features/         # isolated feature modules; talk to the rest only through brain/
    book-creation/      # name a book, seed Sommaire + isolated Mort, open the editor
    book-library/       # home screen: list / open / delete books
```

**Principles** (see `CLAUDE.md` for the full set):

- **Single source of truth**: the book (nodes + edges) lives in `BookService`. Canvas / outline / preview are views — never private copies (KR-020).
- **Feature isolation**: a feature never imports another feature; cross-feature communication goes through `brain/` contracts only.
- **Persistence only via `PersistenceService` / `persistenceKeys.ts`** — no raw `localStorage` in feature code.
- **Derived state computed inline** (no `useEffect` mirroring); **references by stable id**, never by name.
- **Design fidelity**: render from `styles/` tokens + `brain/components/` primitives only; light theme; ≥44px hit targets; keyboard-operable.

## Domain model

Node kinds: `sommaire` (root) · `choix` · `pnj` · `decor` · `piege` · `monstre` · `fin` · `mort` (locked death leaf). Edges carry a `kind`: `choice` | `relink` | `flee`. Every new book is seeded with **exactly two nodes**: a `sommaire` (empty text zone, root) and an **isolated, locked** `mort` node (0 edges) — never auto-linked on create.

## Features

| Feature | Status | Summary |
|---------|--------|---------|
| `book-creation` | walking skeleton ✅ | « Nouveau livre » dialog → seed Sommaire + isolated Mort → editor, via `CreateBookEntry` (composed into the library home). Iteration 3 (cloud-first offline queue) deferred until `cloud-sync`. |
| `book-library` | iter 1 ✅ | Home screen `LibraryScreen`: grid of book cards (live VIEW via brain `useBooks`), newest first; click → open + navigate. Cards show écrans · liens · fins counts + « Modifié le {date} ». Hover/focus reveals **rename** (in place), **duplicate**, and delete (CSS-only reveal). `BookService` gained `renameBook` (→ new `book:updated`) + `duplicateBook` (deep copy, fresh ids remapped by stable id, KR-003). Delete still gated by a confirmation dialog → `deleteBook`. Composes `book-creation`'s create affordance as a prop (KR-072). Search/sort + currently-open-book guard deferred to iter 2. |
| `tree-canvas` | iter 1–2 ✅ | § 02 graph view: node cards (NodeBadge + ref + title + snippet) + SVG edges on a dot-grid; live binding to `BookService` via `node:*`/`edge:*`; single-select; « + Nœud » adds a free-floating node. Local pan/zoom shipped; persisting view-state/positions (iter 3) deferred until `UIPreferencesService`. Retires `EditorStub`. |
| `node-editor` | iter 1 ✅ | § 02 side panel mounted beside the canvas: header (NodeBadge + ref + title + ✕), editable Description, Fin victoire/échec toggles, « Action requise » SegmentedControl mounting editors from `ActionRegistry`. Selection promoted to a brain `SelectionService` (SSOT). Libellé/inventory/choices/illustration are deferred slots. |
| `choice-linking` | iter 1 ✅ | Outgoing-choice rows in node-editor's choices slot (via brain `SlotRegistry`): « + branche » creates a child + `choice` edge and selects it; « Relier… » adds a `relink` edge to an existing node (cycles/convergence); remove deletes only the edge. Each row carries an editable **« libellé du choix »** persisted on `Edge.label` via the new `BookService.updateEdge` (+ `edge:updated`); the canvas reflects it live. `BookService` `addChoiceBranch`/`addEdge`/`removeEdge`/`updateEdge`. Rule badges + hidden-prereq + countdown deferred (need `ObjectCatalogService`). |
| `outline-view` | iter 1 ✅ | The open book as an indented « plan » (`OutlineView`): DFS from the sommaire nesting `choice` edges, `relink`/`flee`/cycles shown as `↪` references (cycle-safe), isolated nodes flat. **Expand/collapse** via a pure `computeVisibleRows` helper (▸/▾ disclosure, collapsed ids local UI state); **hover preview** of each screen's text as a row tooltip; refined reference-row « Aller au nœud » affordance. Shared editor `EditorTopBar` (brain) with a canvas ↔ outline switch; selection shared via `SelectionService`. Rule badges (⊘/⏱) await choice-linking iters 3–4; « centrer dans l'arbre » + view-mode persistence deferred to iters 2–3. |
| `action-decor` | iter 1 ✅ | First `action-*` feature: self-registers a « Décor » editor with the brain `ActionRegistry` (node-editor mounts it without importing it). Prendre / Écouter / Fouiller switch on `node.decor`. **« Prendre » full**: a list of takeable objects as rows (add/remove/reorder, **utile/leurre** badge `Record` KR-117, a « jet » marker), each edited in a **modal** (draft commit/cancel) composing the shared **`ObjectEditor`** (KR-052) + an optional **« jet requis »** (caractéristique + difficulté + texte d'échec). New domain types `TakeableObject`/`SkillRoll`/`TakeableKind`; the skeleton's single `decor.object` migrates to `decor.objects` on read (`takeablesOf`). Écouter/Fouiller stubs + shared `ObjectCatalogService` deferred to iters 2–3. |
| `action-pnj` | skeleton ✅ | Second `action-*`: self-registers a « PNJ » editor with the `ActionRegistry`. NAME + player-facing DIALOGUE persisted on `node.pnj`; a « donne un objet » switch reuses the shared `ObjectEditor` (its 2nd consumer, no cross-feature import) with a stable gift id. Gift effects / « mène à » / reusable-PNJ catalog deferred. |
| `action-monster` | skeleton ✅ | Third `action-*`: self-registers a « Monstre » editor. NAME + a player-facing reveal text per **réussite/échec** outcome (the only semantic colours), derived from the new brain **`ROLL_OUTCOMES`** registry (`Record`, KR-117/091). « Ajouter à la librairie » emits the stub `monster:savedToLibrary` event. Stats / loot / outcome targets / real `MonsterLibraryService` deferred. |
| `action-trap` | skeleton ✅ | Fourth `action-*`: self-registers a « Piège » editor. DESCRIPTION + réussite/échec reveal texts via the shared **`brain/components/OutcomesEditor`** (extracted at the 2nd consumer; monster refactored to it) + a « L'échec mène à la Mort » toggle. Skill roll + automatic →Mort edge (KR-067) deferred. |
| `cloud-sync` | skeleton ✅ | Local-first **`CloudSyncService`** (brain) decorating `PersistenceService` (wired in `createBrain`): synchronous local write + background cloud push, status `idle→syncing→synced/error`, `offline` (local-only) with no transport. New `sync:status` event + `useSyncStatus`; the `SyncIndicator` corner pill surfaces it. Real Cloudflare transport / offline queue / reconciliation deferred. |

**🚀 The `0.2.x` / V1 tier is underway** — iteration 1 of each feature, in build order. `book-creation` / `tree-canvas` / `node-editor` iter-1 were banked depth-first, so the first V1 slice is **`choice-linking` iteration 1** (shipped: editable « libellé du choix »). We build **breadth-first** (see `docs/ROADMAP.md`): `0.1.x` = MVP, `0.2.x` = V1, etc. Next V1 slice: `action-pnj` iteration 1.

> The editor is now `tree-canvas` (graph) + `node-editor` (side panel), two isolated features composed by the app shell and talking only through brain (`SelectionService` + `BookService`). The four `action-*` features will self-register their required-action editors with `ActionRegistry`; `node-editor` mounts them without importing them.
