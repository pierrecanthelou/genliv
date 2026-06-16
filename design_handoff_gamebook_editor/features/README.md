# Features — Éditeur de livre dont vous êtes le héros

Each feature is isolated and communicates **only through `brain/` contracts** (services, events, registries) — never by importing another feature. Each `specification.json` has two phases: a `plan` (written up front) and an `implementation` log (filled during build). The **binding design reference** for every UI feature is `Editeur Livre-Jeu - Wireframes.dc.html` + the design system (`styles.css`, `components/`).

## Scope

This editor covers **authoring mode only**. The **play / book-launch mode** — where a reader's hero is instantiated with editable stats and the book is actually played — is a separate surface. Two features are therefore **deferred** to that mode and not specced here:

- `character-sheet` — the hero's starting stats + inventory (created at book launch).
- `game-preview` — playing the book end-to-end to test it.

The editor still defines a **book-level caractéristiques schema** (Force, Perception…) so skill rolls can reference a characteristic; the hero's actual stat *values* live in play mode.

## Build order (walking skeleton first)

| # | Feature | Role | n |
|---|---------|------|---|
| 1 | `book-creation` ✅ specced | Name a book, seed Sommaire + isolated Mort, open editor | 3 |
| 2 | `tree-canvas` | Graph view of the book; selection; pan/zoom; + Nœud | 4 |
| 3 | `node-editor` | Side-panel leaf editor; hosts action + choices slots | 4 |
| 4 | `choice-linking` | Outgoing choices: branch, relink, hidden prereq, countdown | 4 |
| 5 | `book-library` | Home: list / create / open / delete books | 3 |
| 6 | `outline-view` | Indented plan; canvas↔outline toggle | 2 |
| 7 | `action-decor` | Prendre / Écouter / Fouiller + **owns shared ObjectEditor** | 4 |
| 8 | `action-pnj` | PNJ encounter; gives object; dialogue (tree = v2) | 2 |
| 9 | `action-monster` | Create/library monster; combat; reinforced combat | 4 |
| 10 | `action-trap` | Roll → failure routes to Mort / sanction | 2 |
| 11 | `cloud-sync` | Cloud-first persistence + conflict resolution | 3 |

The 4 `action-*` features each **self-register with `ActionRegistry`** so `node-editor` mounts them without importing them — adding an action type later requires zero changes to the editor.

## Brain dependencies (summary)

- **Services**: `BookService` (the API nœud — CRUD on the tree), `ObjectCatalogService`, `MonsterLibraryService`, `CloudSyncService`, `PersistenceService`, `UIPreferencesService`, `Router`, `ActionRegistry`.
- **Shared component**: `ObjectEditor` (owned by `action-decor`, reused by pnj / monster / node-editor) — objects always carry a **name + a player-facing description**.
- **Events**: `book:created|opened|deleted`, `node:created|updated|deleted|selected`, `edge:created|deleted` (`kind: choice|relink|flee`), `action:changed`, `object:granted`, `monster:savedToLibrary`, `sync:status`.

## Cross-cutting rules (apply to every feature)

- **Single source of truth**: the book (nodes + edges) lives in `BookService`; canvas/outline/preview are views — never hold a private copy (KR-020).
- **Empty states**: every empty element/list/input shows an inviting placeholder (project-wide rule, in `readme.md`).
- **Persistence**: only via `PersistenceService`/`persistenceKeys.ts` — no raw `localStorage` (KR-011/111).
- **Derived state**: computed inline, not mirrored via `useEffect` (KR-013/113).
- **References by stable id**: objects, monsters, and node targets are referenced by id, never by name; dangling references are surfaced, not silently broken.
- **Design fidelity**: render from `styles.css` tokens + `components/` only; light theme; ≥44px targets; keyboard-operable.
