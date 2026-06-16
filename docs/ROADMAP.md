# Roadmap — horizontal slices (MVP → V1 → V2 …)

The app is built **breadth-first**: every MINOR version is a *runnable slice across all features* at one depth. `MINOR` = capability tier; `PATCH` = one feature advanced within that tier. Within a tier, features advance in **build order** (dependencies first). We build **one feature's slice, then STOP** for the user to challenge + a `tech-lead` subagent review.

- `0.1.x` — **MVP**: every feature has a walking skeleton.
- `0.2.x` — **V1**: iteration 1 of every feature.
- `0.3.x` — **V2**: iteration 2 of every feature.
- `0.4.x` — **V3**: iteration 3 of every feature.
- `0.5.x` — **V4**: iteration 4 of the features whose `n ≥ 4`.

Iteration counts are ragged (`n` is 3–4 per feature), so later tiers include fewer features. A feature whose iteration `K` was already banked depth-first is **skipped** in that tier (no bump).

## Build order (dependencies first)

`book-creation` → `tree-canvas` → `node-editor` → `choice-linking` → `book-library` → `outline-view` → `action-decor` → `action-pnj` → `action-monster` → `action-trap` → `cloud-sync`

## Per-feature loop (every slice)

read spec + `code-knowledge.json` + histories → build the slice (brain contracts only) → Prettier/`tsc`/ESLint/`jest` → update spec log + `code-knowledge` + `CHANGELOG` + `features_history` + `README` → self-review gate → feature branch → `--no-ff` merge to `main` → bump PATCH → **`tech-lead` subagent review of the diff** → **STOP for user challenge**.

## Tier 0.1.x — MVP (walking skeletons)

Grandfathered from the earlier depth-first pass: `book-creation`, `tree-canvas`, `node-editor` (these also banked some iterations — see below).

| Version | Feature | Skeleton scope | Status |
| --- | --- | --- | --- |
| (0.x) | book-creation | home → new-book dialog → seed Sommaire + isolated Mort → editor | done |
| (0.x) | tree-canvas | graph view, live `BookService` binding, selection, « + Nœud » | done (+ iter 1–2) |
| (0.x) | node-editor | side panel, Description + end toggles, ActionRegistry seam | done (+ iter 1) |
| 0.1.1 | choice-linking | author a `choice` edge parent→child via `BookService.addEdge`; renders on canvas | planned |
| 0.1.2 | book-library | list / open / delete books from `listBooks`; `book:deleted` | planned |
| 0.1.3 | outline-view | tree as an indented outline; canvas↔outline switch; shared selection | planned |
| 0.1.4 | action-decor | self-register décor editor with `ActionRegistry`; owns the shared `ObjectEditor` | planned |
| 0.1.5 | action-pnj | register PNJ editor | planned |
| 0.1.6 | action-monster | register monstre editor; réussite/échec outcomes; monster-library stub | planned |
| 0.1.7 | action-trap | register piège editor | planned |
| 0.1.8 | cloud-sync | wrap `PersistenceService` with `CloudSyncService`; local-first + `sync:status` | planned |

## Tiers 0.2.x+ — V1, V2, … (iteration tiers)

Each tier = iteration `K` of every feature with an iteration `K`, in build order, same per-feature loop. Already-banked iterations are skipped:

- `0.2.x` (V1) = iteration 1 of each feature — tree-canvas & node-editor iter-1 already banked → skipped.
- `0.3.x` (V2) = iteration 2 of each — tree-canvas iter-2 already banked → skipped.
- `0.4.x` (V3) = iteration 3 of each.
- `0.5.x` (V4) = iteration 4 of features whose `n ≥ 4`.

Banked depth so far: tree-canvas iter 1–2, node-editor iter 1. Deferred dependencies to honor when their tier arrives: book-creation iter 3 (offline queue) needs `cloud-sync`; tree-canvas iter 3 (pan/zoom + position persistence) needs `UIPreferencesService`.

## Code-health sweep (from the TODO review)

A cross-cutting cleanup of the repo, phased so each lands as its own reviewed refactor (no version bump — folds into the touched code):

- **P1 — kind registry (done):** `brain/kinds.ts` (`NODE_KINDS`/`EDGE_KINDS`) is the single per-kind source; removed scattered `if (kind === …)` tests, the `Partial<Record>` badge map, and 3 duplicate per-kind tables (KR-068).
- **P2 — hit-target token (done):** `--hit-target: 44px` token + `HIT_TARGET_MIN` brain constant replace the `44` literal repeated across 9 files. Still open under this rule (lower-value, cosmetic, slated for the visual reskin): the `autoSlot`/seed layout origins (BookService), the canvas/card dimension literals (NodeCard, EdgeLayer, ZoomControls, TreeCanvas), and the one-off `minHeight: 96` card height (BookCard). These are deliberately left as plain values for now (low-fi wireframe).
- **P3 — finishing touches (planned):** a shared `plural()` helper (FR: 0 & 1 singular; BookCard, CanvasTopBar); extract the remaining large inline `style` objects to named consts for readability (NodeCard, BookCard, LibraryScreen — consistency with `panelShell`/`monoControl`). Memoization was reviewed and rejected (no preemptive `useMemo`/`useCallback`, perf rule).
- **Deliberately not changed:** `tree-canvas/layout/nodeView.ts` keeps its `kind === 'sommaire'` snippet placeholder — that is a view-local empty-state string, not kind *domain* knowledge, so it stays out of the brain registry.
