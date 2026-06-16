# Éditeur de livre dont vous êtes le héros — Design System

Design system for an authoring tool that helps writers build **« livres dont vous êtes le héros »** (gamebooks / choose-your-own-adventure). The central, persisted data structure of a book is a **tree of screens (nodes + edges)**; the editor lets an author build that tree visually, edit each leaf, and model encounters, skill rolls, and combat.

This DS was **extracted from the low-fi wireframe** `Editeur Livre-Jeu - Wireframes.dc.html` (the project's binding design reference). It is intentionally a **low-fidelity wireframe system** — grayscale + a single blue accent — meant to be redesigned later without invalidating feature specs. Every token, badge, and component here traces directly to that wireframe.

> **Sources** — `Editeur Livre-Jeu - Wireframes.dc.html` (this project) and the brief `uploads/context.md`. No external Figma or codebase; the wireframe is the source of truth.

---

## CONTENT FUNDAMENTALS

- **Language**: French throughout. UI copy and domain terms are French (« Sommaire », « Mort du personnage », « Prendre », « Écouter », « Fouiller », « Jet requis », « Fin victoire »).
- **Two registers of text, kept distinct:**
  - **Authoring/UI** — terse, functional, lowercase sentences or mono uppercase labels (`NOM DE L'OBJET`, `ACTION REQUISE`, `DESCRIPTION — lue par le joueur`).
  - **Player-facing fiction** — immersive, literary, second person, present tense (« Une créature trapue surgit de l'ombre, gourdin clouté levé. »). Object **names are internal**; their **descriptions are written for the player** (« Vieux chiffon » → « Un morceau d'étoffe rouge poussiéreux, en lambeaux »).
- **Voice**: addresses the *player* as **vous**; addresses the *author* implicitly through labels and actions, never chatty.
- **Casing**: mono labels are UPPERCASE with wide tracking; titles are sentence case; nothing shouts.
- **Emoji**: not part of the system. Unicode glyphs are used sparingly as functional icons only (✎ edit, ✕ delete/close, ⠿ drag, ▾ select, ↻ relink, ⏱ countdown, ⊘ hidden prerequisite, ⚔ weapon, 🗝 key). Prefer a real icon set when this DS is upgraded out of wireframe fidelity.
- **Vibe**: a calm, dense, paper-like authoring desk — closer to a structured outliner than a game UI. The drama lives in the *content*, not the chrome.
- **Empty states & placeholders (project-wide rule)**: nothing is ever a blank void. Every empty element, empty list, input, and textarea carries a **placeholder that invites the next action** — an inputs's example value (« La Caverne d'Aldûr »), an empty text zone's prompt (« Écrivez ici le texte d'introduction… »), an empty list's « + Ajouter… » affordance (dashed accent). Mode note: this DS covers the **editor** only; the **play / book-launch** mode (where the reader's hero is created) is a separate surface.

## VISUAL FOUNDATIONS

- **Palette**: grayscale paper/ink ramps + **one accent** (`--accent #2F6BFF`, blue). Two semantic tones only, reserved for skill-roll outcomes: **success** (`--good`, green) and **failure** (`--bad`, terracotta). No other hues. See `tokens/colors.css`.
- **Accent discipline**: blue marks *selection, primary action, and the active option* — never decoration. Tinted accent surfaces (`--accent-bg`) back selected rows and "create" affordances.
- **Type**: two families — **Hanken Grotesk** for all UI/body, **JetBrains Mono** for eyebrows, field labels, meta, and badges. Sizes are small (9.5–16px in the tool; 30px only for the page title) — this is a dense desktop authoring surface. See `tokens/typography.css`.
- **Backgrounds**: flat. App background is `--paper-6 (#ECECEA)`; cards are white. The tree canvas uses a faint **dot-grid** (`radial-gradient(#E3E3E0 1px, transparent 1px)` at 22px) — the only texture in the system. No images, no gradients (beyond the dot-grid and the hatch/stripe badge fills), no full-bleed photography.
- **Cards**: white, `--r-3xl (12px)` radius, `1px var(--border-card)` border, near-invisible `--shadow-card`. Selected cards get a `1.5px var(--accent)` border + a soft `--ring-selected` halo.
- **Borders over shadows**: hierarchy is carried by hairline borders and surface tints, not elevation. Shadows appear **only** on popovers/menus (`--shadow-menu`) and modals (`--shadow-modal`).
- **Radii**: small and consistent — 4–12px, with a pill (`--r-pill`) for chips, badges, and toggles. Fields/buttons are 6px; inner cards 8px; outer cards/panels/modals 12px.
- **Corner motif**: the node-type badges encode kind through **mark shape** (filled square, outline square, circle, dashed square, triangle, hatch, double-border, gray hatch) — a compact iconographic language documented in `foundations/badges-nodes.html`.
- **Hover/press**: low-key. Hover reveals row action icons (✎/✕) and lightens; the accent buttons darken slightly on press. No bounces; transitions are short (≈120ms) and limited to toggles and selection.
- **Layout**: multi-column editor (canvas + side panel; or three dashboard columns), generous `gap`-based spacing, `align-items:start`. Dense but never cramped — `--space-*` rhythm from 4 to 40px.
- **Transparency/blur**: none. Surfaces are opaque; overlays use a flat ink scrim, not blur.

## ICONOGRAPHY

The wireframe uses **Unicode glyphs as functional icons** (no icon font, no SVG sprite, no PNG icons, no emoji). Current set: ✎ edit · ✕ delete/close · ⠿ drag handle · ▾ select · → / ↪ / ↻ flow & relink · ⏱ countdown · ⊘ hidden prerequisite · ⚔ weapon · 🗝 key · ⬚ image dropzone · + add. Node-type marks are drawn with CSS (borders, `repeating-linear-gradient` hatches, a CSS triangle) — see `NodeBadge`.

**When upgrading past wireframe fidelity**, swap these glyphs for a consistent icon set (Phosphor or Lucide are good matches for this weight). Until then, the glyphs above are the canonical iconography. *(Substitution flagged: no branded icon assets exist yet.)*

---

## INDEX / MANIFEST

**Root**
- `styles.css` — entry point; `@import`s every token + font file. Consumers link this.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`.
- `readme.md` — this guide.
- `SKILL.md` — portable skill manifest.

**Foundations** (`foundations/` — Design System tab specimen cards)
- Colors: `colors-paper`, `colors-ink`, `colors-lines`, `colors-accent`, `colors-semantic`
- Type: `type-ui`, `type-mono`, `type-scale`
- Spacing: `spacing-radii`, `spacing-shadows`, `spacing-scale`
- Brand: `badges-nodes` (the node-type visual language)

**Components** (`components/<group>/` — real `.jsx` + `.d.ts` + `.prompt.md`, one card per group)
- `primitives/` — **NodeBadge**, **Badge**, **Chip**, **IconButton**, **Toggle**
- `forms/` — **Field**, **Select**, **SegmentedControl**, **DifficultyPicker**
- `surfaces/` — **Card**, **CardHead**, **OutcomeBlock**, **ListRow**, **Modal**

These map to the planned `brain/components/` shared primitives (the editor's cross-feature UI).

---

## NOTES & CAVEATS

- **Fonts are Google-hosted** (`tokens/fonts.css` `@import`s the Google Fonts CSS) rather than self-hosted `.woff2`. Swap for local binaries before production.
- **Wireframe fidelity only** — this is deliberately low-fi. Colors, type pairing, and the glyph iconography are placeholders for a future visual pass; the *structure* (tokens, badges, component anatomy) is meant to survive that reskin.
- **Light theme only.** The semantic alias layer in `colors.css` is structured so a `[data-theme="dark"]` scope can be added later without touching components.
