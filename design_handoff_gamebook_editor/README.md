# Handoff — Éditeur de « livre dont vous êtes le héros »

A complete starter package for building the gamebook (choose-your-own-adventure) **authoring tool** with Claude Code. It contains the binding design reference, the design system, the brief, and a feature-by-feature build plan.

---

## 1. What this is for

The tool lets an author build a **« livre dont vous êtes le héros »** by editing a **tree of screens (nodes + edges)** — the central, persisted data structure of a book. The author builds that tree visually, edits each leaf, and models encounters, skill rolls, combat, traps, and hidden item prerequisites.

Scope of this package = **authoring/editor mode only**. The **play / book-launch mode** (where a reader's hero is instantiated and the book is actually played) is a separate surface — see `docs/ROADMAP-BASCULE-IA.md` § 3 (Temps 2).

Everything here is in **French** (UI copy + domain terms). Keep it that way.

---

## 2. About the design files (read this first)

The two `.dc.html` files are **design references created in HTML** — prototypes showing the intended look and behaviour. **They are not production code to copy.** Your job is to **recreate these designs in a real codebase** using its established framework and patterns. If no codebase exists yet, choose the most appropriate stack (the specs are written for a React app — see §6) and implement the designs there.

- **`Editeur Livre-Jeu - Wireframes.dc.html`** — the **binding visual reference**. Six annotated sections covering the whole product (open it in a browser):
  1. `01 · Parcours bout-en-bout` — Home → « Nouveau livre » modal → seeded tree
  2. `02 · Éditeur — vue d'ensemble de l'arbre` — the hero tree-canvas + side panel
  3. `03 · Mode Outline` — indented plan, toggled from the canvas
  4. `04 · Détail de chaque écran d'action` — node-editor panel per action type
  5. `05 · Mécaniques propres au format numérique` — objects-as-prerequisites, countdowns, combat
  6. `06 · Ajouter une branche · Relier à un nœud existant` — choice-linking / relink
- **`Editeur Prototype.dc.html`** — a clickable, higher-fidelity prototype of the core flow (home → create → tree editor → node editing). Use it to feel the interactions; the wireframe remains the spec of record.

**To open them:** they're self-contained — open either `.dc.html` directly in a browser (Chrome/Safari). They load `support.js` + `styles.css` from this same folder, so keep the folder structure intact.

### Fidelity: **low-fidelity wireframe**

This is a deliberately **low-fi system** — grayscale + a single blue accent. Treat structure, layout, component anatomy, and token *names* as binding; treat the specific grays/blue and the Unicode-glyph icons as a **placeholder visual pass** meant to be reskinned later without invalidating the feature specs. Build the layout and behaviour faithfully; apply (or stand up) a real icon set and final palette when you do the visual pass. Don't let the wireframe greys leak into a product that's supposed to get a real theme — drive everything from the tokens in `styles.css` so a later reskin is a token swap, not a rewrite.

---

## 3. What's in this package

```
design_handoff_gamebook_editor/
├── README.md                         ← you are here (master orientation)
├── CLAUDE.md                         ← drop into your repo root; rules for Claude Code
│
├── Editeur Livre-Jeu - Wireframes.dc.html   ← binding visual reference (open in browser)
├── Editeur Prototype.dc.html                ← clickable core-flow prototype
├── support.js                               ← runtime needed by the two .dc.html files
│
├── styles.css                        ← design-system entry point (link this; @imports tokens)
├── tokens/                           ← colors, typography, spacing, fonts (the CSS variables)
│   ├── colors.css   typography.css   spacing.css   fonts.css
├── components/                       ← component specs: .jsx + .d.ts + .prompt.md per primitive
│   ├── primitives/  (NodeBadge, Badge, Chip, IconButton, Toggle)
│   ├── forms/       (Field, Select, SegmentedControl, DifficultyPicker)
│   └── surfaces/    (Card, CardHead, OutcomeBlock, ListRow, Modal)
├── foundations/                      ← rendered specimen cards (colors / type / spacing / node badges)
├── DESIGN-SYSTEM.md                  ← the full design-system guide (was the DS readme)
├── SKILL.md                          ← portable skill manifest for the DS
│
├── features/                         ← THE BUILD PLAN — one folder per feature
│   ├── README.md                     ← scope, build order, brain contracts, cross-cutting rules
│   └── <feature>/specification.json  ← per-feature plan, acceptance criteria, iterations, risks
│
└── brief/
    └── context.md                    ← the original product brief (source of truth for domain rules)
```

---

## 4. The domain model (the one thing to get right)

A **book** = a **tree of nodes + edges**, and *that tree is what persists*. Everything else (canvas, outline, preview) is a **view** over it — never a private copy.

**Node (leaf) types**, each with a CSS-drawn badge (`components/primitives/NodeBadge`):
`sommaire` (entry/root) · `choix` (description → N choices) · `pnj` · `décor` (prendre / écouter / fouiller) · `piège` · `monstre` · `fin` (victoire/échec) · `mort` (the locked, obligatory death leaf).

Every new book is **seeded with exactly two nodes**: a `sommaire` (empty text zone, the root) and an **isolated** `mort` node (zero edges, locked — not deletable/duplicable, only its text is editable).

**Edges** carry a `kind`: `choice` · `relink` · `flee`. A **choice** is the labelled button shown in a parent screen that leads to this screen.

**Format-specific mechanics** (what makes this richer than paper gamebooks — see `brief/context.md`):
- objects can be **used to accomplish or reinforce** an interaction;
- an inventory object can be a **hidden prerequisite** on a choice;
- some actions **change screen without being a new choice**;
- choices can be under a **countdown**.

**Objects**: always carry a **name (internal)** + a **player-facing description**. Skill rolls produce **réussite / échec** outcomes — the only two semantic colors in the whole system.

References (objects, monsters, node targets) are **by stable id, never by name**; dangling references are surfaced, not silently broken.

---

## 5. The design system in brief

Full detail in `DESIGN-SYSTEM.md`. Headlines:

- **Palette**: grayscale paper/ink ramps + **one accent** (`--accent #2F6BFF`, blue) marking selection / primary action / active option only. Two semantic tones, reserved for skill-roll outcomes: `--good` (green), `--bad` (terracotta). No other hues.
- **Type**: **Hanken Grotesk** for all UI/body, **JetBrains Mono** for eyebrows, field labels, meta, badges. Small sizes (9.5–16px; 30px only for the page title) — a dense desktop authoring surface.
- **Surfaces**: flat. App bg `--paper-6 #ECECEA`; cards white, 12px radius, 1px hairline border, near-invisible shadow. Selected cards get a 1.5px accent border + soft halo. The tree canvas uses a faint dot-grid — the only texture. No gradients, no blur, no photography.
- **Hierarchy via borders + surface tints, not elevation.** Shadows appear only on popovers/menus and modals.
- **Radii** 4–12px + a pill for chips/badges/toggles. **Spacing** `--space-*` 4→40px.
- **Iconography**: Unicode glyphs as functional icons (✎ edit · ✕ close · ⠿ drag · ▾ select · ↻ relink · ⏱ countdown · ⊘ hidden prereq · ⚔ weapon · 🗝 key · + add). Node badges are CSS-drawn. **Swap glyphs for a real icon set (Phosphor or Lucide) at the visual pass.**

**Always drive styling from `styles.css` tokens** — never hardcode the wireframe hex values. The token layer is structured so a `[data-theme="dark"]` scope and a final palette can be added later without touching components. Look up exact `--*` names in `tokens/*.css` before using them.

### Components (`components/`)
Each component ships three files: `.jsx` (reference implementation), `.d.ts` (the prop contract), and `.prompt.md` (usage notes). They're written as React but are framework-agnostic specs — read the `.d.ts` for the API and the `.prompt.md` for behaviour, then rebuild them as your codebase's primitives. They map to the editor's planned `brain/components/` shared layer.

---

## 6. The build plan (`features/`)

> **Périmé depuis la bascule IA du 2026-08-03.** Le plan d'ingénierie vivant est `docs/ROADMAP-BASCULE-IA.md` ; `features/README.md` a été supprimé avec les huit features que la bascule abandonne. Ce qui suit décrit l'éditeur d'arbre d'origine et n'est conservé que comme trace du contexte de ce handoff.

- **Architecture**: each feature is **isolated** and talks to the rest **only through `brain/` contracts** (services, events, registries) — never by importing another feature. The 4 `action-*` features self-register with an `ActionRegistry`, so `node-editor` mounts them without importing them.
- **Single source of truth**: the book (nodes + edges) lives in `BookService`. Canvas / outline / preview are views (KR-020).
- **Build order (walking skeleton first)**: `book-creation` → `tree-canvas` → `node-editor` → `choice-linking` → `book-library` → `outline-view` → `action-decor` (owns the shared `ObjectEditor`) → `action-pnj` → `action-monster` → `action-trap` → `cloud-sync`.
- Each `specification.json` has a `plan` (goal, design contract, acceptance criteria, brain contracts, walking skeleton, numbered iterations, known risks) and an `implementation` log to fill in as you build.

### Cross-cutting rules (apply to every feature)
- **Persistence only via `PersistenceService` / `persistenceKeys.ts`** — no raw `localStorage` (KR-011/111).
- **Derived state computed inline**, not mirrored through `useEffect` (KR-013/113).
- **References by stable id**; surface dangling references.
- **Empty states**: every empty element/list/input shows an **inviting placeholder** (an example value, a write-here prompt, a dashed « + Ajouter… » affordance). Never a blank void.
- **Design fidelity**: render from `styles.css` tokens + `components/` only; light theme; ≥44px hit targets; keyboard-operable.

---

## 7. Suggested Claude Code workflow

1. Put `CLAUDE.md` at your repo root (it encodes the rules above so they're always in context).
2. Open `Editeur Livre-Jeu - Wireframes.dc.html` in a browser and skim all six sections; click through `Editeur Prototype.dc.html`.
3. Read `brief/context.md` (the original domain brief) and `docs/ROADMAP-BASCULE-IA.md` (the live architecture + feature order).
4. Stand up `styles.css` + tokens and the `components/` primitives in your stack first — they're the shared vocabulary every feature renders from.
5. Build the **walking skeleton**: `book-creation` end-to-end (home → create dialog → seed Sommaire + isolated Mort → navigate to editor), wiring a minimal `BookService` through `brain/`.
6. Then follow the build order, one feature at a time, checking each `specification.json`'s acceptance criteria.

---

*This README is self-sufficient: a developer who wasn't in the original conversation can implement the editor from this package alone. The HTML files are design references; recreate them in the target environment, don't ship them.*
