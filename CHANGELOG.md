# Changelog

> **Versioning re-baselined to the horizontal-slice model** (see `docs/ROADMAP.md`): MINOR = capability tier (`0.1` MVP / `0.2` V1 / `0.3` V2 …), PATCH = one feature advanced within the tier. `package.json` reset `0.3.1 → 0.1.0`. The `0.2.0`/`0.3.0`/`0.3.1` entries below were produced under the earlier depth-first scheme and are kept for history; their work (tree-canvas iter 1–2, node-editor iter 1) is "banked depth" the slice plan won't redo.

## Code-health — P4 (registry predicates + book lookups) — no version bump

Cross-cutting cleanup from a review of inline `// FIX:`/`// TODO:` notes (folds into the touched code; see `docs/ROADMAP.md` § Code-health sweep, P4):

- **Domain-invariant predicates**: new `kinds.ts` helpers `isStructural` / `canHaveOutgoing` / `canBeTarget` / `edgeNests` replace `NODE_KINDS[kind].flag` indexing at ~8 call sites (BookService, OutgoingChoices, TargetPicker, NodeEditorPanel, nodeKind) — callers stop importing the registry to ask a domain question (Law of Demeter; registry stays the SSOT, KR-068). Presentational reads (label/mark/tone/…) unchanged.
- **`getNode`/`getEdge`** (`brain/utils/book.ts`) hide the book's internal arrays, removing the repeated `book?.nodes.find(n => n.id === …) ?? null` from BookService + the four action editors + OutgoingChoices.
- **`buildOutline`** nests via `EDGE_KINDS.nests`, not `edge.kind === 'choice'`.
- **Decisions recorded** (KR-068/117 extended): event-name lists in `hooks.ts` are typed curated subsets (not magic strings — kept); per-variant behaviour (gift `apply`, caractéristique `compute/test`) is deferred to PLAY MODE as registry descriptor fields, never if/switch. 167 tests passing (+7); all inline notes resolved/removed.

## 0.2.8 — cloud-sync iteration 1 (V1 slice — tier complete 🏁)

- **Real transport machinery, local-target « cloud »**: per the production-target swap, the LOCAL build wires a new **`LocalStorageTransport`** — a `CloudTransport` backed by a separate `cloudsync:` localStorage namespace (a fake remote) — so the full local-first sync machinery runs with **no server**. The Cloudflare build target swaps in a worker-backed transport (client + worker route + SENSITIVE auth, KR-114) via the same interface later.
- **Debounced + batched pushes**: `set()` writes local synchronously, then rapid writes coalesce into one background push cycle (status syncing → synced/error once per batch; timer-safe, default 300ms).
- **Last-write-wins reconciliation on `book:opened`** (KR-094): `CloudTransport` gained `pull`; on open, the cloud copy is compared by `updatedAt` — a newer cloud copy is **adopted** locally (written underneath, never re-pushed → no echo loop) and `book:updated` is emitted so the open view re-reads; a newer local copy is **pushed up**; an empty cloud is seeded.
- `createBrain` stays transport-optional (a new `syncDebounceMs` option), so every existing test is transparent (offline). 160 tests passing (6 new). The real Cloudflare client/worker/auth + offline queue + conflict handling are iters 1(CF)/2/3. **🏁 The 0.2.x / V1 tier is complete — every feature has its iteration 1.**

## 0.2.7 — action-trap iteration 1 (V1 slice)

- **Skill roll (§ 05)**: the trap gains a **CARACTÉRISTIQUE** select + a **DIFFICULTÉ** stepper (shared brain `Stepper`) on `trap.roll`, beside the existing réussite/échec reveal texts (shared `OutcomesEditor`) and the « échec mène à la Mort » toggle.
- Caractéristiques are now a brain **`CHARACTERISTICS`** registry (Habileté / Endurance / Chance — a closed-set `Record`, KR-117), placed in brain like `ROLL_OUTCOMES` because skill-roll editors reuse it (trap now; décor « jet requis » later). The select derives from it — no hardcoded list. `SkillRoll.failureText` made **optional** so trap (outcomes-based) and décor (failureText-based) share one roll shape.
- `TrapConfig` gained `roll`; a skeleton trap migrates the default roll in on read (KR-116) and canonicalises on write. The automatic échec→Mort edge stays deferred to iter 2 (KR-067). 153 tests passing (1 new). **🏁 All four action editors have their V1 — only `cloud-sync` remains in the 0.2.x tier.**

## 0.2.6 — action-monster iteration 1 (V1 slice)

- **Combat mechanics (§ 4D)**: the monster gains **PV / Attaque / Défense** stats (shared brain `Stepper`) and **outcome targets** — **victoire → poursuivre** and **fuite → relier** via the shared brain `TargetPicker` (structural screens excluded KR-067, deleted target surfaced KR-021/063). **Défaite → Mort** is shown as the **automatic** combat path (KR-067) — surfaced read-only, never an authored edge.
- Two brain extractions at their **second consumer** (KR-109, same rule as `ObjectEditor`/`OutcomesEditor`): the value **`Stepper`** (pnj gift + monster stats) and the **`TargetPicker`** (pnj « mène à » + monster targets) moved to `brain/components`; `action-pnj` refactored to import them (feature-local `TargetPicker` deleted, `GiftSection`'s local stepper removed). `TargetPicker` gained `label`/`emptyLabel` props.
- `MonsterConfig` gained `pv`/`attack`/`defense` + `victoryTarget`/`fleeTarget`; a skeleton monster (name + outcomes) normalises with stat defaults on read (KR-116) and canonicalises on write. réussite/échec reveal texts still derive from `ROLL_OUTCOMES` (KR-091/117). Loot + reusable library deferred to iters 2–3. 152 tests passing (3 new + the pnj refactor).

## 0.2.5 — action-pnj iteration 1 (V1 slice)

- **Gift effect (§ 4A)**: the « Le PNJ donne un objet » gift now carries an **effect** — **+PV / +Attaque / +Défense / objet de scénario** (a closed-set `Record`, KR-117) — with a **− N + value stepper** (clamped 1–99) for the stat bonuses; a plot object hides the stepper. The gift's identity still uses the shared brain `ObjectEditor` (KR-052).
- **« Ensuite, le PNJ mène à »**: a target picker wires the PNJ to a follow-up node (a non-choice screen change). Structural screens are excluded (KR-067) and a deleted target is surfaced « ⚠ cible supprimée » (KR-021/063). Stored on `pnj.target` for now; promotion to a rendered tree edge pairs with the dedicated action-edge path (like trap's deferred échec→Mort edge).
- Domain model gained **`PnjGift`** (object + `effect` + `value`) and **`PnjGiftEffect`**; the skeleton's bare-object gift **migrates** on read (pure `giftOf`) and canonicalises on the next write (KR-116). `PnjEditor` split into `GiftSection` + `TargetPicker` (SRP), each a VIEW over `BookService`; gift ids stable (KR-003). Portrait + reusable-PNJ catalog stay in iters 2–3. 147 tests passing (9 new).

## 0.2.4 — action-decor iteration 1 (V1 slice)

- **« Prendre » full (§ 4B)**: the décor « prendre » action is now a **list of takeable objects** as rows — add / remove / reorder (↑↓), each with a **utile / leurre** badge and an optional **« jet requis »** marker. Each object is edited in a **modal** with real commit/cancel semantics (a local draft; « Annuler » discards, so a cancelled new object never lands), composing the shared brain `ObjectEditor` (KR-052) + a utile/leurre `SegmentedControl` + a « jet requis » `Toggle` revealing caractéristique / difficulté / texte d'échec.
- Domain model gained **`TakeableObject`** (object + `kind` + optional `roll`), **`SkillRoll`** (trait/difficulty/failureText), and **`TakeableKind`** (`'utile' | 'leurre'`, a closed-set `Record` per KR-117, non-semantic tones — good/bad reserved for réussite/échec, KR-091). The walking-skeleton single `decor.object` is **migrated** to `decor.objects` on read (pure `takeablesOf`) and canonicalised on the next write (KR-090/116 spirit), so old persisted books still load.
- `DecorEditor` stays a VIEW over `BookService` (KR-020): all list ops write the canonical `{ interaction, objects }` via `updateNode`; object ids are stable (KR-003). Écouter/Fouiller stay stubs (iter 2); shared `ObjectCatalogService` is iter 3. 138 tests passing (12 new).

## 0.2.3 — outline-view iteration 1 (V1 slice)

- **Expand/collapse** in the « plan du livre »: each node with nested children gets a ▸/▾ disclosure (≥44px, aria-labelled with the node title); collapsing hides the exact subtree while later siblings stay. The rule is a new **pure `computeVisibleRows`** helper (unit-tested, KR-080 spirit) over the flat pre-order rows; collapsed ids are local UI state derived with `useMemo` (no `useEffect` mirror, KR-013).
- **Hover preview**: each row's `title` tooltip previews the screen's authored text (via the shared `textLines`, placeholder for an empty screen); reference rows instead read « Aller au nœud … » (or « Cible supprimée » for a dangling target, KR-021). End-leaf labels already render through `NodeBadge`.
- Deferred (documented): per-row rule badges ⊘/⏱ (the edge rules land with choice-linking iters 3–4 — nothing to badge yet) and « centrer dans l'arbre » (needs canvas viewport centering — pairs with the iter-2 node inspector). 126 tests passing (7 new).

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
