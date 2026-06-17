# Changelog

> **Versioning re-baselined to the horizontal-slice model** (see `docs/ROADMAP.md`): MINOR = capability tier (`0.1` MVP / `0.2` V1 / `0.3` V2 …), PATCH = one feature advanced within the tier. `package.json` reset `0.3.1 → 0.1.0`. The `0.2.0`/`0.3.0`/`0.3.1` entries below were produced under the earlier depth-first scheme and are kept for history; their work (tree-canvas iter 1–2, node-editor iter 1) is "banked depth" the slice plan won't redo.

## 0.2.2 — book-library iteration 1 (V1 slice)

- **Richer book cards**: each card now shows écrans · liens · fins counts (the « fins » count derives from `effectiveKind === 'fin'`, consistent with the FIN badge, KR-054/068) plus a « Modifié le {date} » line (feature-local timezone-stable `formatDate`).
- **In-place rename** + **duplicate** + delete, revealed on hover/focus via a CSS-only `.book-card` rule (the canonical hover-reveal pattern — no `isHovered` JS state, keyboard-reachable). Rename edits the title in place (Enter/blur commits, Esc cancels; blank is a no-op).
- Two new SSOT mutations on **`BookService`**: **`renameBook`** (trims, rejects blank, persist → new **`book:updated`** event) and **`duplicateBook`** (deep copy with a fresh book id + fresh node/edge ids, edge endpoints remapped by stable id so the copy references its own nodes, KR-003; « (copie) » title; persist → `book:created`). `book:updated` is wired into `useBooks` (list re-reads on rename) and `useOpenBook` (KR-020/013/071/004).
- 117 tests passing (7 new). Search/sort + open-book-delete guard stay in iteration 2; per-book sync status in iteration 3.

## 0.2.1 — choice-linking iteration 1 (V1 slice — first of the 0.2.x tier 🚀)

- **Editable « libellé du choix » per outgoing row** — the player-facing button text now rides the edge (`Edge.label`) and persists through a new **`BookService.updateEdge`** (`EdgePatch`), the SSOT for every edge mutation (KR-060/020). A **blank label is dropped** at the SSOT so the canvas falls back to the kind's label (an empty `edge.label` never renders as a blank button); the field shows an inviting placeholder when empty.
- New brain **`edge:updated`** event, wired into `useOpenBook`'s mutation list, so the panel row **and** the canvas (which already renders `edge.label ?? canvasLabel`) reflect a label change live — no `useEffect` mirror (KR-013). Each row is now a two-line card (→ destination + kind badge + delete · libellé `Field` with an `ariaLabel` naming its destination).
- The libellé renders on every outgoing row (choice + relink), consistent with the canvas honouring `edge.label` for all kinds. Per-choice **rule badges** (⊘ prereq / ⏱ countdown) stay deferred to iterations 3–4 (need `ObjectCatalogService`). 110 tests passing (4 new). **🚀 Opens the 0.2.x / V1 tier** — `book-creation` / `tree-canvas` / `node-editor` iter-1 were banked depth-first, so `choice-linking` is the first V1 slice.

## 0.1.8 — cloud-sync walking skeleton (MVP slice — tier complete 🏁)

- New **`CloudSyncService`** (brain) — a **local-first Decorator** over `PersistenceService` (Liskov; `BookService` + every feature unchanged), wired once in `createBrain`. Writes hit local **synchronously** (offline-ready, KR-004), then push to a cloud transport in the background: status `idle → syncing → synced` (or `error`, local write preserved). With no transport the store is **`offline`** (local-only) and emits no per-write noise — so the existing suite is fully transparent. New **KR-093**.
- New `sync:status` event + `useSyncStatus` hook; the **`cloud-sync`** feature's `SyncIndicator` (a corner Badge pill, aria-live) surfaces the live state, derived from a `SyncStatus`→label/tone `Record` (KR-117), mounted once by `App` over both routes. Real cloud transport / offline queue / reconciliation deferred to iterations.
- 106 tests passing (7 new). **🏁 The 0.1.x MVP tier is complete — every feature now has a walking skeleton.**

## 0.1.7 — action-trap walking skeleton (MVP slice)

- New **`action-trap`** feature — the fourth and last `action-*`: self-registers a « Piège » editor with the brain **ActionRegistry**, so node-editor now offers **all four** action types (Décor / PNJ / Monstre / Piège) with zero changes. `TrapEditor` is a VIEW over `BookService`: a DESCRIPTION + réussite/échec reveal texts + a « L'échec mène à la Mort » toggle (the « échec sanctionné » variant), persisted on `node.trap`.
- Extracted a shared **`brain/components/OutcomesEditor`** (KR-109) at the **second consumer** of the réussite/échec rows: monster + trap now render outcomes from one component derived from `ROLL_OUTCOMES` (KR-117/091); `MonsterEditor` refactored to use it (rows de-duplicated). New **KR-092**.
- The automatic `échec → Mort` edge is deferred (KR-067) — the skeleton captures the `fatal` intent. Domain model gained `node.trap` (`TrapConfig`); `NodePatch` carries `trap` (text-only guard covers it, KR-055/090, regression-tested). 99 tests passing (2 new + MonsterEditor refactor). **All MVP action editors complete; only `cloud-sync` remains in the 0.1.x tier.**

## 0.1.6 — action-monster walking skeleton (MVP slice)

- New **`action-monster`** feature — third `action-*`: self-registers a « Monstre » editor with the brain **ActionRegistry** (node-editor now offers Décor / PNJ / Monstre with zero changes). `MonsterEditor` is a VIEW over `BookService`: a NAME + a player-facing reveal text per combat outcome, persisted on `node.monster`.
- **réussite / échec** — the only semantic outcomes/colours — modelled as a new brain **`ROLL_OUTCOMES`** registry (`Record<RollOutcome, {label, tone}>`, an instance of **KR-117**), placed in brain so trap/skill-roll editors reuse it (KR-109). The editor **derives** both outcome rows (good/bad `Badge` + field) from it — no hardcoded labels. New **KR-091**.
- The monster-library is **stubbed** via a new `monster:savedToLibrary` event on the brain EventBus (wired now, consumed later). Added `ariaLabel` to the shared `Field` so Badge-captioned fields keep an accessible name. Domain model gained `node.monster` (`MonsterConfig`) + `RollOutcome`; `NodePatch` carries `monster` (text-only guard covers it, KR-055/090, regression-tested). 97 tests passing (3 new). Stats / loot / outcome targets / real library deferred to iterations.

## 0.1.5 — action-pnj walking skeleton (MVP slice)

- New **`action-pnj`** feature — second `action-*`: self-registers a « PNJ » editor with the brain **ActionRegistry** (node-editor offers « Décor » + « PNJ » with zero changes, KR-050/051). `PnjEditor` is a VIEW over `BookService` (KR-020): a NAME + player-facing DIALOGUE, persisted on `node.pnj`.
- The « Le PNJ donne un objet » switch reveals the **shared `brain/components/ObjectEditor`** — the very primitive action-decor introduced — imported from brain with **no cross-feature import** (validates KR-052/109). The gift carries a stable id (KR-003); toggling off drops it.
- Domain model gained `node.pnj` (`PnjConfig`); `NodePatch` carries `pnj` so the text-only guard keeps it off structural screens (KR-055/090, now regression-tested for `pnj` too). 94 tests passing (3 new). Gift effects / « mène à » / reusable-PNJ catalog deferred to iterations.

## 0.1.4 — action-decor walking skeleton (MVP slice)

- New **`action-decor`** feature — the first real `action-*` feature: it **self-registers** a « Décor » editor with the brain **ActionRegistry** (Open/Closed seam, KR-050/051), so node-editor offers and mounts it with zero changes. `DecorEditor` is a VIEW over `BookService` (KR-020): a Prendre / Écouter / Fouiller `SegmentedControl` persisted on the node.
- New shared **`brain/components/ObjectEditor`** (KR-052/109) — internal NAME + player-facing DESCRIPTION — owned/introduced by action-decor's « prendre » and reusable by future PNJ/monster editors without a cross-feature import. The takeable object gets a stable id minted via `createId` (KR-003, now exported from brain).
- Domain model gained `node.decor` (`DecorConfig`) + `GameObject`; `NodePatch` carries `decor` so the text-only guard keeps it off structural screens (KR-055). New **KR-090**. 91 tests passing (4 new). Écouter/Fouiller + multi-object + skill rolls deferred to iterations 1–2; shared ObjectCatalogService to iteration 3.

## 0.1.3 — outline-view walking skeleton (MVP slice)

- New **`outline-view`** feature: the open book as an indented « plan » (`OutlineView`), a DFS from the sommaire that nests `choice` edges and renders `relink`/`flee`/convergence/cycle back-edges as `↪` reference rows (cycle-safe, **KR-080**); unreachable nodes (isolated `mort`) listed flat; dangling targets flagged `⚠ cible supprimée`.
- Hoisted the shared editor chrome to **`brain/components/EditorTopBar`** (KR-109) with a canvas ↔ outline **view-mode switch**; a new **`src/EditorScreen`** shell owns the (non-synced, KR-022) view-mode and swaps `TreeCanvas` ↔ `OutlineView` while keeping the node-editor panel mounted. `tree-canvas` is now the canvas body only; `CanvasTopBar` removed.
- Selection is shared via the brain `SelectionService` (KR-024): picking an outline row reflects on the canvas and the panel. `buildOutline` is pure + tested. 87 tests passing (9 new).

## Unreleased — unknown-kind boundary guard (KR-116)

- Hardened the persistence trust boundary: `PersistenceService.get` casts JSON unchecked, so a corrupted store / schema drift could carry a kind outside the registry and crash a `NODE_KINDS[kind]` lookup. New `isNodeKind` / `isEdgeKind` guards (derived from the registry keys) + a single `BookService.loadBook` validation: a book with an unknown node/edge kind is surfaced (`console.warn`) and treated as **unreadable** (`getBook`/`openBook` → null, omitted from `listBooks`, mutations refused) rather than throwing — but stays **deletable** so it can be cleaned up. New **KR-116**. 78 tests passing (5 new).
- Removed the three `book!` non-null assertions in `TreeCanvas` (captured a narrowed `activeBookId` after the guard, matching the `NodeEditorPanel` pattern) — no `!` assertions remain in source. Recorded the defensive-boundary + view-tolerance rules (KR-021/116) in the `livre-jeu-design` skill.

## Unreleased — magic numbers, plural & kind single-source (P3 of the code-health sweep)

- **`NodeKind` / `EdgeKind` are now derived from the kind registry** via a `defineKinds` factory + `keyof typeof` (KR-068): the registry is the single source for the kind *set* as well as its behaviour — no parallel union to keep in sync. (Answers "a builder to add a kind without duplicating the union".)
- Killed the remaining geometry/dimension magic numbers as **named constants**: canvas bounds → `resolveBounds` + `CANVAS_MIN_W/H` + `CANVAS_MARGIN` (geometry); `DOT_GRID_SIZE`, `HINT_INSET`, `HINT_GAP` (TreeCanvas); `LAYOUT_ORIGIN` (BookService autoSlot); `CARD_MIN_HEIGHT`, `PAGE_MAX_WIDTH`, `GRID_MIN_COL` (book-library); `MODAL_MAX_WIDTH`, `CLOSE_BUTTON_SIZE` (Modal); `PICKER_MAX_HEIGHT` (choice-linking).
- New shared **`plural()`** helper (FR: 0 & 1 singular) replaces the inline `n > 1 ? …` ternaries (CanvasTopBar, BookCard).
- Extracted the large inline `style={{…}}` objects in `LibraryScreen` and `BookCard` to named `React.CSSProperties` consts (readability, matching the `panelShell`/`monoControl` pattern). 71 tests passing (3 new plural tests). No bump.

## Unreleased — hit-target token (P2 of the code-health sweep)

- New **`--hit-target: 44px`** token + mirrored **`HIT_TARGET_MIN`** brain constant for the WCAG ≥44px interactive minimum. Replaced the `44` literal repeated across 9 files (NodeEditorPanel, CanvasTopBar, ZoomControls, NewBookButton, OutgoingChoices ×5, Modal ×2, Toggle, SegmentedControl, BookCard) — CSS strings use the token, the one numeric `size` prop uses the constant. No behaviour change; 68 tests passing.

## Unreleased — kind registry refactor (P1 of the code-health sweep)

- **New `brain/kinds.ts`** — one data-driven registry (`NODE_KINDS` / `EDGE_KINDS`) holding each kind's label, default title, badge mark and domain flags (`structural` / `canHaveOutgoing` / `canBeTarget`). New **KR-068**.
- Removed the scattered `if (kind === …)` tests and the silent `Partial<Record<NodeKind>>` badge map: `NodeBadge`, `nodeView`/`nodeTitle`, `effectiveKind`, `NodeEditorPanel`, `BookService` (text-only / outgoing / target guards), `EdgeLayer`, `OutgoingChoices` now read the registry. Three duplicate per-kind tables collapsed into one.
- Pure refactor, behaviour preserved exactly; 68 tests passing (5 new registry tests). No version bump. Remaining magic-number / style TODO markers are tracked in `docs/ROADMAP.md` (code-health sweep P2/P3), not shipped as inline comments.

## 0.1.2 — book-library walking skeleton (MVP slice)

- The home screen is now `book-library`'s **`LibraryScreen`**: a grid of book cards listing every persisted book (live VIEW via the new brain **`useBooks()`** hook), newest first, each with a title + screen count.
- Click a card → `openBook` + navigate to its editor. Each card has a delete ✕ gated behind a **confirmation dialog** (dangerous action, error-toned confirm); confirming calls the new **`BookService.deleteBook`** (persist-remove → `book:deleted`, KR-004) and the card drops from the live list.
- `book-creation` refactored: the create affordance is now **`CreateBookEntry`** (button + dialog); `App` composes it into `LibraryScreen` as a prop so the two features never import each other (KR-072). `HomeScreen` removed (chrome moved to the library).
- Shared `Modal` gains `confirmTone='error'` for dangerous-action confirms. New KRs KR-070/071/072. 61 tests passing.
- **Refinement (choice-linking domain):** structural screens are never authored choice targets — the `sommaire` root and `mort` leaf are excluded from the « Relier… » candidates and rejected by `BookService.addEdge` (`mort` is reached only automatically in combat). New **KR-067**. 63 tests passing.

## 0.1.1 — choice-linking walking skeleton (MVP slice)

- `choice-linking` mounts in node-editor's choices slot via a new brain **`SlotRegistry`** (OCP seam, KR-066) — neither feature imports the other.
- Outgoing-choice rows (live VIEW over `BookService`); « + branche » creates a child + `choice` edge and selects it; « Relier… » adds a `relink` edge to an existing node (cycles/convergence); remove deletes only the edge, never the target node.
- `BookService` gains `addChoiceBranch` / `addEdge` / `removeEdge` (SSOT, KR-060); `edge:created` payload now carries `from`/`to`/typed `EdgeKind`. Mort's no-outgoing rule enforced at the SSOT (KR-055/060).
- Hidden-prerequisite + countdown (iters 3–4) deferred — they need `ObjectCatalogService` (lands with action-decor). 52 tests passing.

## 0.1.0 — re-baseline + roadmap (no app code change)

- Adopted the breadth-first slice roadmap (`docs/ROADMAP.md`); rewrote `WORKFLOW.md` build-steps + versioning accordingly.
- Added the `tech-lead` review subagent and the per-feature stop-and-review gate.

## 0.3.1 — node-editor: structural screens (Sommaire / Mort)

- Sommaire (root) and Mort (death leaf) are structural: the panel hides « libellé du choix », « action requise » and the Fin victoire/échec toggles for both, and hides « choix sortants » for Mort. Only their text is editable.
- Enforced at the SSOT too: `BookService.updateNode` accepts a text-only patch for `sommaire`/`mort` (generalises the locked-Mort rule, KR-002 → KR-055), so the invariant holds even if a caller sends end flags/action.
- Docs updated (CLAUDE.md domain rules, node-editor spec, code-knowledge KR-055). 43 tests passing.

## 0.3.0 — node-editor (walking skeleton + iteration 1)

- `node-editor` side panel (§ 02): mounted beside the canvas by the app shell. Sticky header (NodeBadge + ref + title + ✕), editable Description `Field`, Fin victoire/échec `Toggle`s, the « Action requise » `SegmentedControl`, and deferred slots (libellé, illustration, inventory, choix sortants).
- **Selection promoted to a brain `SelectionService`** (single source of truth, KR-024): tree-canvas and node-editor both read via `useSelectedNode` and write via `selection.select`; the service is the sole emitter of `node:selected` and clears on `book:opened`. The panel's ✕ deselects without desyncing the canvas highlight.
- **`ActionRegistry`** (brain): the Open/Closed seam (KR-051) — action-* features self-register editors; node-editor mounts them with zero action-specific code. SegmentedControl emits `action:changed`.
- `BookService.updateNode` commits Description + end flags + action type, emitting `node:updated`; a locked node accepts only text edits (KR-002). End flags drive the FIN badge everywhere via `effectiveKind`/`endLabel` (KR-054).
- Shared view logic (`useOpenBook`, `nodeTitle`) and new DS primitives (`Toggle`, `SegmentedControl`) promoted to brain (KR-109/110). Libellé du choix decided to live on the incoming edge (deferred to choice-linking). 41 tests passing.

## 0.2.0 — tree-canvas (walking skeleton + iterations 1–2)

- `tree-canvas` is now the editor surface, rebuilding wireframe § 02 from design-system tokens/primitives: top bar (back · title · node-count badge · disabled « Aperçu du jeu » · « + Nœud »), dot-grid canvas, node cards (`NodeBadge` + ref + title + 1-line snippet), SVG connectors (solid `choice`, dashed `relink`/`flee`, arrowheads, mono label chips), bottom-right zoom controls.
- Live data binding: the canvas is a pure VIEW over `BookService` (KR-020), kept current via a `useSyncExternalStore` subscription to `node:*` / `edge:*` / `book:opened` (no `useEffect` mirror, KR-013).
- `BookService.addNode(bookId, kind)` adds a free-floating node with a deterministic auto-layout slot (KR-023) and emits `node:created` (payload now carries `kind`).
- Single-select owned by the canvas and broadcast as `node:selected{nodeId|null}` (KR-024); clears on empty-canvas click. Orphaned edges are dropped, never drawn to nowhere (KR-021).
- Local pan/zoom shipped (not synced, KR-022); persisting view-state + dragged positions via `UIPreferencesService` deferred to iteration 3. Retired `EditorStub`. 29 tests passing.
- BUG-001 (minor): drag listeners now cancel on unmount mid-gesture.

## 0.1.0 — book-creation walking skeleton

- Initialized the Vite + React 18 + TypeScript app (ESLint, Prettier, Jest + RTL).
- Stood up the design system: tokens (`styles/`) + cross-feature primitives in `brain/components` (NodeBadge, Modal, Field, Card, Badge, IconButton).
- Built the `brain/` core: domain types, EventBus, Router, PersistenceService + persistenceKeys, BookService (single source of truth + atomic seed factory), DI via BrainContext.
- `book-creation` walking skeleton: home → « Nouveau livre » dialog (focus, inline validation, Enter-to-submit, Esc/scrim dismiss) → `BookService.createBook` seeds exactly a Sommaire + an isolated, locked Mort node → emits `book:created` then `book:opened` → navigates to the editor. 16 tests passing.
