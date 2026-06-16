# CLAUDE.md — Éditeur de « livre dont vous êtes le héros »

Persistent project context for Claude Code. Read `README.md` in this handoff for the full orientation; this file is the always-on rule set.

## What we're building

An **authoring tool** for « livres dont vous êtes le héros » (gamebooks). A **book = a tree of nodes + edges**, and *that tree is the thing that persists*. The editor lets an author build the tree visually, edit each leaf, and model encounters, skill rolls, combat, traps, and hidden item prerequisites. Scope = **editor/authoring mode only**; play mode is deferred.

**Language: French throughout** (UI copy + domain terms). Do not translate to English.

## Design references are not production code

The `.dc.html` files are **HTML design references** (look + behaviour). Recreate them in this codebase's stack and patterns — do not ship the HTML. `Editeur Livre-Jeu - Wireframes.dc.html` is the **binding visual reference**; `Editeur Prototype.dc.html` shows the interactions. Fidelity is **low-fi wireframe**: structure/layout/component-anatomy/token-names are binding; the specific greys, the blue, and the Unicode-glyph icons are a placeholder visual pass to be reskinned later.

## Domain rules (non-negotiable)

- Node types: `sommaire` (root), `choix`, `pnj`, `décor` (prendre/écouter/fouiller), `piège`, `monstre`, `fin` (victoire/échec), `mort`.
- Every new book is seeded with **exactly two nodes**: a `sommaire` (empty text zone, root) + an **isolated, locked** `mort` node (0 edges; not deletable/duplicable; only its text is editable). Never auto-link `mort` on create.
- **`sommaire` and `mort` are structural screens** (KR-055): **no « libellé du choix », no « action requise », no « fin victoire/échec »**. `mort` additionally has **no outgoing choices**. Their **only editable field is the text** — enforced in the node-editor panel *and* in `BookService.updateNode`.
- Edges carry `kind`: `choice` | `relink` | `flee`. A *choice* is the labelled button in a parent screen that leads to a child screen.
- Objects always carry a **name (internal)** + a **player-facing description**. Skill rolls resolve to **réussite / échec** (the only semantic colors).
- Format-specific mechanics: objects can accomplish/reinforce interactions; an inventory object can be a **hidden prerequisite** on a choice; some actions change screen without being a choice; choices can be under a **countdown**.
- All references (objects, monsters, node targets) are **by stable id, never by name**. Surface dangling references; never silently break them.

## Architecture

- Features are **isolated**: a feature talks to the rest **only through `brain/` contracts** (services, events, registries). Never import one feature from another.
- **Single source of truth**: the book (nodes + edges) lives in `BookService`. Canvas / outline / preview are *views* — never hold a private copy.
- The 4 `action-*` features **self-register with `ActionRegistry`**; `node-editor` mounts them without importing them.
- Build order (walking skeleton first): `book-creation` → `tree-canvas` → `node-editor` → `choice-linking` → `book-library` → `outline-view` → `action-decor` (owns shared `ObjectEditor`) → `action-pnj` → `action-monster` → `action-trap` → `cloud-sync`.

## Cross-cutting engineering rules

- **Persistence only via `PersistenceService` / `persistenceKeys.ts`** — no raw `localStorage` in feature code (KR-011/111).
- **Derived state is computed inline**, not mirrored through `useEffect` (KR-013/113).
- **Empty states**: every empty element/list/input shows an inviting placeholder (example value, write-here prompt, dashed « + Ajouter… »). Never a blank void.
- Events to emit/observe (examples): `book:created|opened|deleted`, `node:created|updated|deleted|selected`, `edge:created|deleted`, `action:changed`, `object:granted`, `monster:savedToLibrary`, `sync:status`. Fire navigation/events only **after persistence resolves**, in order.

## Design fidelity rules

- Render **only** from `styles.css` tokens + the `components/` primitives. Look up exact `--*` names in `tokens/*.css` — never hardcode the wireframe hex values.
- Light theme only (token layer is structured for a later `[data-theme="dark"]`). ≥44px hit targets. Keyboard-operable. Borders + surface tints carry hierarchy, not shadows (shadows only on menus/modals).
- Type: Hanken Grotesk (UI/body) + JetBrains Mono (labels/meta/badges). Accent blue = selection / primary action / active option only.
- Swap Unicode glyph icons for a real icon set (Phosphor or Lucide) at the visual pass; node badges are CSS-drawn (see `components/primitives/NodeBadge`).

## Where to look

- `brief/context.md` — the original product brief (domain truth).
- `features/README.md` — architecture, build order, brain contracts.
- `features/<feature>/specification.json` — per-feature plan, acceptance criteria, iterations, known risks.
- `DESIGN-SYSTEM.md` + `styles.css` + `tokens/` + `components/` — the design system.
