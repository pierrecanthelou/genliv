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
| `book-creation` | walking skeleton ✅ | Home → « Nouveau livre » dialog → seed Sommaire + isolated Mort → editor. Iteration 3 (cloud-first offline queue) deferred until `cloud-sync`. |
| `tree-canvas` | iter 1–2 ✅ | § 02 graph view: node cards (NodeBadge + ref + title + snippet) + SVG edges on a dot-grid; live binding to `BookService` via `node:*`/`edge:*`; single-select; « + Nœud » adds a free-floating node. Local pan/zoom shipped; persisting view-state/positions (iter 3) deferred until `UIPreferencesService`. Retires `EditorStub`. |
| `node-editor` | iter 1 ✅ | § 02 side panel mounted beside the canvas: header (NodeBadge + ref + title + ✕), editable Description, Fin victoire/échec toggles, « Action requise » SegmentedControl mounting editors from `ActionRegistry`. Selection promoted to a brain `SelectionService` (SSOT). Libellé/inventory/choices/illustration are deferred slots. |
| `choice-linking` | skeleton ✅ | Outgoing-choice rows in node-editor's choices slot (via brain `SlotRegistry`): « + branche » creates a child + `choice` edge and selects it; « Relier… » adds a `relink` edge to an existing node (cycles/convergence); remove deletes only the edge. `BookService` `addChoiceBranch`/`addEdge`/`removeEdge`. Hidden-prereq + countdown deferred (need `ObjectCatalogService`). |

We build **breadth-first** (see `docs/ROADMAP.md`): `0.1.x` = MVP (every feature has a skeleton), `0.2.x` = V1 (iter 1 of all), etc. Build order: `choice-linking` ✅ → `book-library` → `outline-view` → `action-decor` → `action-pnj` → `action-monster` → `action-trap` → `cloud-sync`.

> The editor is now `tree-canvas` (graph) + `node-editor` (side panel), two isolated features composed by the app shell and talking only through brain (`SelectionService` + `BookService`). The four `action-*` features will self-register their required-action editors with `ActionRegistry`; `node-editor` mounts them without importing them.
