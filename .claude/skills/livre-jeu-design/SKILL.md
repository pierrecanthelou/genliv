---
name: livre-jeu-design
description: Use this skill to generate well-branded interfaces and assets for the « Éditeur de livre dont vous êtes le héros » authoring tool, either for production or throwaway prototypes/mocks. Contains the low-fi wireframe design system — colors, type, fonts, node-badge language, and UI components for prototyping the gamebook editor.
user-invocable: true
---

The design system assets live in **`design_handoff_gamebook_editor/`** at the repo root: `DESIGN-SYSTEM.md`, `styles.css` + `tokens/`, `foundations/`, `components/`, and the binding wireframe `Editeur Livre-Jeu - Wireframes.dc.html` (+ `Editeur Prototype.dc.html` for interactions). The live, in-app token + primitive copies are `src/styles/` and `src/brain/components/`.

This is a **low-fidelity wireframe system** (grayscale + one blue accent), extracted from `Editeur Livre-Jeu - Wireframes.dc.html`. It is designed to be redesigned later without breaking feature specs — keep the token names and component anatomy stable; the visuals are a placeholder pass.

If creating visual artifacts (mocks, throwaway prototypes, specimen screens), create static HTML files that link `design_handoff_gamebook_editor/styles.css` for the real tokens. If working on production code, render from `src/styles/` tokens + the `src/brain/components/` primitives and read the rules here to design fluently in this system.

Key domain anchors: the persisted data is a **tree of nodes** (Sommaire, choix, PNJ, décor, piège, monstre, fin, mort); object **names are internal but descriptions are player-facing**; skill rolls produce **réussite/échec** outcomes (the only semantic colors).

Rules to keep when designing in code:

- **No magic numbers in styles.** Render dimensions/spacing/radii/type from `src/styles/` tokens; a recurring semantic value with no token (e.g. the **≥44 px hit-target minimum**) becomes a named token/constant, never a literal repeated across files (KR-068 sibling — applied in P2).
- **Each node/edge `kind` self-describes via the kind registry** (`src/brain/kinds.ts`, `NODE_KINDS` / `EDGE_KINDS`): a kind's **badge label, CSS-drawn mark, default title** and domain flags live there. To add or restyle a kind, edit its one descriptor entry — never add an `if (kind === …)` in a component (KR-068). `NodeBadge` and the canvas/outline read marks/labels from the registry. The `NodeKind` / `EdgeKind` union types are *derived* from the registry keys, so the type and the table can't drift.
- **Persisted data is untrusted at the runtime boundary** (KR-116): TypeScript erases kind annotations and `PersistenceService.get` casts JSON unchecked, so a corrupt store or schema drift can carry a `kind` outside the registry — a direct `NODE_KINDS[kind].x` then throws. Validate at the single read chokepoint (`BookService.loadBook`) with `isNodeKind` / `isEdgeKind`; a record with an unknown kind is **surfaced and treated as unreadable, never silently coerced** (and stays deletable so it can be cleaned up). Views must tolerate dangling references — drop or flag (`⚠ cible supprimée`), never crash (KR-021). Don't reach for `!` non-null assertions; capture a narrowed local after the guard instead.

If the user invokes this skill without other guidance, ask what they want to build, ask a few questions, and act as an expert designer who outputs HTML artifacts or production code as needed.
