# Roadmap — horizontal slices (MVP → V1 → V2 …)

The app is built **breadth-first**: every MINOR version is a _runnable slice across all features_ at one depth. `MINOR` = capability tier; `PATCH` = one feature advanced within that tier. Within a tier, features advance in **build order** (dependencies first). We build **one feature's slice, then STOP** for the user to challenge + a `tech-lead` subagent review.

- `0.1.x` — **MVP**: every feature has a walking skeleton.
- `0.2.x` — **V1**: iteration 1 of every feature.
- `0.3.x` — **V2**: iteration 2 of every feature.
- `0.4.x` — **V3**: iteration 3 of every feature.
- `0.5.x` — **V4**: iteration 4 of the features whose `n ≥ 4`.

Iteration counts are ragged (`n` is 3–4 per feature), so later tiers include fewer features. A feature whose iteration `K` was already banked depth-first is **skipped** in that tier (no bump).

## Build order (dependencies first)

`book-creation` → `tree-canvas` → `node-editor` → `choice-linking` → `book-library` → `outline-view` → `action-decor` → `action-pnj` → `action-monster` → `action-trap` → `cloud-sync`

## Per-feature loop (every slice)

read spec + `code-knowledge.json` + histories → build the slice (brain contracts only) → Prettier/`tsc`/ESLint/`jest` → update spec log + `code-knowledge` + `CHANGELOG` + `features_history` + `README` → self-review gate → **`tech-lead` subagent PR review of the uncommitted staged diff (fix every finding, re-gate, re-review until `APPROVE`)** → **user review/approval of the still-uncommitted slice** → commit directly to `main` → bump PATCH → **STOP** (next feature only on the user's go).

## Tier 0.1.x — MVP (walking skeletons)

Grandfathered from the earlier depth-first pass: `book-creation`, `tree-canvas`, `node-editor` (these also banked some iterations — see below).

| Version | Feature        | Skeleton scope                                                                   | Status            |
| ------- | -------------- | -------------------------------------------------------------------------------- | ----------------- |
| (0.x)   | book-creation  | home → new-book dialog → seed Sommaire + isolated Mort → editor                  | done              |
| (0.x)   | tree-canvas    | graph view, live `BookService` binding, selection, « + Nœud »                    | done (+ iter 1–2) |
| (0.x)   | node-editor    | side panel, Description + end toggles, ActionRegistry seam                       | done (+ iter 1)   |
| 0.1.1   | choice-linking | author a `choice` edge parent→child via `BookService.addEdge`; renders on canvas | planned           |
| 0.1.2   | book-library   | list / open / delete books from `listBooks`; `book:deleted`                      | planned           |
| 0.1.3   | outline-view   | tree as an indented outline; canvas↔outline switch; shared selection             | planned           |
| 0.1.4   | action-decor   | self-register décor editor with `ActionRegistry`; owns the shared `ObjectEditor` | planned           |
| 0.1.5   | action-pnj     | register PNJ editor                                                              | planned           |
| 0.1.6   | action-monster | register monstre editor; réussite/échec outcomes; monster-library stub           | planned           |
| 0.1.7   | action-trap    | register piège editor                                                            | planned           |
| 0.1.8   | cloud-sync     | wrap `PersistenceService` with `CloudSyncService`; local-first + `sync:status`   | planned           |

## Tiers 0.2.x+ — V1, V2, … (iteration tiers)

Each tier = iteration `K` of every feature with an iteration `K`, in build order, same per-feature loop. Already-banked iterations are skipped:

- `0.2.x` (V1) = iteration 1 of each feature — tree-canvas & node-editor iter-1 already banked → skipped.
- `0.3.x` (V2) = iteration 2 of each — tree-canvas iter-2 already banked → skipped.
- `0.4.x` (V3) = iteration 3 of each. Shipped: `book-creation` iter 3 (0.4.0), `tree-canvas` iter 3 (0.4.1). `node-editor` iter 3 = **superseded** (its « objets à prendre » inventory was absorbed by action-decor « prendre »; no slice, no bump) — its iter 2 (action seam) was also banked across the skeleton + the action-\* features.
- `0.5.x` (V4) = iteration 4 of features whose `n ≥ 4` (e.g. `node-editor` iter 4 = debounced commits, `tree-canvas` iter 4 = robustness at scale).

Banked depth so far: tree-canvas iter 1–2, node-editor iter 1–3 (iter 2 banked, iter 3 superseded). Deferred dependencies to honor when their tier arrives: book-creation iter 3 (offline queue) needs `cloud-sync` ✅ done; tree-canvas iter 3 (pan/zoom + position persistence) needs `UIPreferencesService` ✅ done; the shared `ObjectCatalogService` (action-decor iter 3 + choice-linking hidden-prereqs, KR-062) is still deferred.

## Code-health sweep (from the TODO review)

A cross-cutting cleanup of the repo, phased so each lands as its own reviewed refactor (no version bump — folds into the touched code):

- **P1 — kind registry (done):** `brain/kinds.ts` (`NODE_KINDS`/`EDGE_KINDS`) is the single per-kind source; removed scattered `if (kind === …)` tests, the `Partial<Record>` badge map, and 3 duplicate per-kind tables (KR-068).
- **P2 — hit-target token (done):** `--hit-target: 44px` token + `HIT_TARGET_MIN` brain constant replace the `44` literal repeated across 9 files. Still open under this rule (lower-value, cosmetic, slated for the visual reskin): the `autoSlot`/seed layout origins (BookService), the canvas/card dimension literals (NodeCard, EdgeLayer, ZoomControls, TreeCanvas), and the one-off `minHeight: 96` card height (BookCard). These are deliberately left as plain values for now (low-fi wireframe).
- **P3 — finishing touches (done):** shared `plural()` helper (FR: 0 & 1 singular; BookCard, CanvasTopBar); extracted the large inline `style` objects in `LibraryScreen` + `BookCard` to named consts; named the remaining geometry/dimension magic numbers (canvas bounds via `resolveBounds`, `LAYOUT_ORIGIN`, `DOT_GRID_SIZE`, `HINT_*`, card/page/modal/picker dimensions); derived `NodeKind`/`EdgeKind` from the registry (single source). Memoization reviewed and rejected (no preemptive `useMemo`/`useCallback`, perf rule).
- **P4 — encapsulation (done, from the inline-note review):** domain INVARIANTS are now read through named predicates (`kinds.ts`: `isStructural`/`canHaveOutgoing`/`canBeTarget`/`edgeNests`) instead of indexing `NODE_KINDS[kind].flag` at ~8 call sites (BookService, OutgoingChoices, TargetPicker, NodeEditorPanel, nodeKind) — callers no longer import the registry to ask a domain question (Law of Demeter; registry stays the SSOT, KR-068). Book lookups by id go through `getNode`/`getEdge` (`brain/utils/book.ts`), removing the repeated `book?.nodes.find(n => n.id === …) ?? null` (BookService + the 4 action editors + OutgoingChoices). `buildOutline` nests via the `EDGE_KINDS.nests` flag, not `edge.kind === 'choice'`. **Decisions:** event-name string lists (`hooks.ts`) are kept — they are `AppEventName[]`-typed curated subsets, not magic strings (a typo fails to compile); per-variant BEHAVIOUR (gift `apply`, caractéristique `compute/test`) is deferred to PLAY MODE, where it becomes a descriptor field on the registry, never an if/switch (KR-117, noted in `characteristics.ts`/`types.ts`).
- **Still inline by choice (low value):** `NodeCard`'s internal micro-spacing (`padding: '10px 12px'`, `marginBottom: 5`, etc.) and a few per-component cosmetic paddings — genuinely one-off wireframe values with no shared meaning; revisit at the visual reskin if a token scale emerges.
- **Deliberately not changed:** `tree-canvas/layout/nodeView.ts` keeps its `kind === 'sommaire'` snippet placeholder (view-local empty-state string, not domain knowledge); `buildOutline`'s root-find `n.kind === 'sommaire'` (a single clear domain statement in a pure builder); the `DecorEditor` `interaction === 'prendre'` body branch (becomes descriptor-driven when écouter/fouiller land in décor iter 2).
