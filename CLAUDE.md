# CLAUDE.md — Éditeur de « livre dont vous êtes le héros »

Persistent project context for Claude Code. Read `README.md` in this handoff for the full orientation; this file is the always-on rule set.

## Engineering workflow (always-on — read first)

The binding build process — walking-skeleton-first build steps, feature branch → quality-loop review gate → merge, versioning rules, testing patterns, and the `specification.json` / `bug_history.json` / `features_history.json` schemas — is imported below so it loads every session. Follow it for every change; do not wait to be reminded.

@docs/WORKFLOW.md

The on-demand **design system** (tokens, primitives, wireframe fidelity, asset generation) is the `livre-jeu-design` skill in `.claude/skills/` — invoke it for visual/design work.

## What we're building

> ### ⚠ Bascule IA en cours — lire `docs/ROADMAP-BASCULE-IA.md` avant tout travail neuf
>
> The product is moving from **« a book = a tree of nodes + edges »** to **« an adventure dossier played by an AI »**. The three blocking decisions (D1 condition language, D2 where the AI calls live, D3 the fate of the existing features) were settled on **2026-08-03**, and the deletion they commanded is **done**: eight features are gone, five survive to be repointed (roadmap § 1 bis / § 1 ter).
>
> Consequences for the rules below: the **Domain rules** section still describes the tree model, which is what the surviving code implements *today* — it holds until feature n° 1 `dossier-format` replaces `brain/types.ts` + `BookService`, and it is that feature's job to rewrite this section. Do not extrapolate the dossier format from it, and do not delete the tree model ahead of n° 1.

An **authoring tool** for « livres dont vous êtes le héros » (gamebooks). The editor lets an author build an adventure, edit each screen, and model encounters, skill rolls, combat, traps, and hidden item prerequisites. Scope = **editor/authoring mode only** in Temps 1; the play engine is Temps 2.

**Language: French throughout** (UI copy + domain terms). Do not translate to English.

## Design references are not production code

The `.dc.html` files are **HTML design references** (look + behaviour). Recreate them in this codebase's stack and patterns — do not ship the HTML. `Editeur Livre-Jeu - Wireframes.dc.html` is the **binding visual reference**; `Editeur Prototype.dc.html` shows the interactions. Fidelity is **low-fi wireframe**: structure/layout/component-anatomy/token-names are binding; the specific greys, the blue, and the Unicode-glyph icons are a placeholder visual pass to be reskinned later.

## Game rules — `docs/REGLES-DU-JEU.md` is the source of truth (always-on rule)

`docs/REGLES-DU-JEU.md` is the **single source of truth for every game mechanic** (KR-130): characteristics, challenge tiers, combat arithmetic, XP. Never settle a rule ambiguity from the code — go back to that file, correct it there, then propagate to `src/brain/`. `docs/REGLES-PLAY.md` is its orchestration complement for play mode.

The rules layer (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) is held by the mutation score: any iteration touching one of those four runs `npm run test:mutation` above `break: 80`, and `src/brain/rules.golden.test.ts` pins value by value everything the mutation config neutralises.

## Domain rules (non-negotiable)

- Node types: `sommaire` (root), `choix`, `pnj`, `décor` (prendre/écouter/fouiller), `piège`, `monstre`, `fin` (victoire/échec), `mort`.
- Every new book is seeded with **exactly two nodes**: a `sommaire` (empty text zone, root) + an **isolated, locked** `mort` node (0 edges; not deletable/duplicable; only its text is editable). Never auto-link `mort` on create.
- **`sommaire` and `mort` are structural screens** (KR-055): **no « libellé du choix », no « action requise », no « fin victoire/échec »**. `mort` additionally has **no outgoing choices**. Editable fields: `sommaire` → text + illustration (book cover thumbnail in library, full-width header in play mode); `mort` → text only. Enforced in the node-editor panel (`illustration` section gated on `node.kind !== 'mort'`; action/end-toggle sections gated on `!structural`) *and* in `BookService.updateNode` (structural nodes accept `{ text, illustration }`; locked nodes accept only `{ text }`).
- **Structural screens are never authored choice targets** (KR-067): the `sommaire` root has **no incoming choices** and the `mort` leaf is reached **only automatically at the end of a combat**, never via a `choice`/`relink`. Enforced at the SSOT (`BookService.addEdge` rejects a `sommaire`/`mort` target) *and* in the relink picker (excluded from candidates). The future automatic combat→`mort` link uses a dedicated path, not the manual edge API.
- Edges carry `kind`: `choice` | `relink` | `flee`. A *choice* is the labelled button in a parent screen that leads to a child screen.
- Objects always carry a **name (internal)** + a **player-facing description**. Skill rolls resolve to **réussite / échec** (the only semantic colors).
- Format-specific mechanics: objects can accomplish/reinforce interactions; an inventory object can be a **hidden prerequisite** on a choice; some actions change screen without being a choice; choices can be under a **countdown**.
- All references (objects, monsters, node targets) are **by stable id, never by name**. Surface dangling references; never silently break them.

## Architecture

- Features are **isolated**: a feature talks to the rest **only through `brain/` contracts** (services, events, registries). Never import one feature from another. *Enforced by ESLint dans les **trois** sens — feature→feature, `brain/`→feature, `player/`→feature — sur une liste dérivée du disque ; preuve : `lintIsolation.test.ts`. Importer `src/player/**` reste légal.*
- **Single source of truth**: the book lives in `BookService`. Canvas and preview are *views* — never hold a private copy.
- Surviving features: `tree-canvas`, `book-library`, `cloud-sync`, `book-creation`, `play-mode`. All five are **repointed** by the bascule, none is finished as-is.
- Build order = the order of `docs/ROADMAP-BASCULE-IA.md` (n° 1 `dossier-format` first — it is the contract between the two temps). One feature at a time, never two in parallel.

## Cross-cutting engineering rules

> **Three of these are now wired into ESLint, not prompt guidance** — feature isolation, raw storage in features, and hardcoded colours fail `npm run lint` with a French message naming the fix. Don't re-derive them by hand; run the linter. The exception is **derived state (KR-013/113)**: there is deliberately **no rule** for it — the AST sees a shape, not a semantics — so it stays a review heuristic, written out in `docs/WORKFLOW.md` (Build Steps, step 5).

- **Persistence only via `PersistenceService` / `persistenceKeys.ts`** — no raw `localStorage` in feature code (KR-011/111). *Enforced: `no-restricted-globals` + `no-restricted-properties` on `src/features/**` (tests excluded).*
- **Derived state is computed inline**, not mirrored through `useEffect` (KR-013/113). *Not enforceable — review heuristic only.*
- **Empty states**: every empty element/list/input shows an inviting placeholder (example value, write-here prompt, dashed « + Ajouter… »). Never a blank void.
- Events to emit/observe — the list is `AppEvents` in `brain/EventBus.ts`, which is authoritative; keep this line aligned with it: `book:created|opened|updated|deleted`, `node:created|updated|deleted|selected`, `edge:created|updated|deleted`, `sync:status`, `sync:conflict`. Fire navigation/events only **after persistence resolves**, in order.

## Design fidelity rules

- Render **only** from `styles.css` tokens + the `components/` primitives. Look up exact `--*` names in `tokens/*.css` — never hardcode the wireframe hex values. *Enforced by ESLint (`no-restricted-syntax`) across `src/**/*.{ts,tsx}`: `rgb()`/`hsl()` cherchés **partout** (chaîne ou gabarit), repli `var(--x, …)` masqué ; `#hex` ancré début-et-fin. Faux positif épinglé par `lintIsolation.test.ts` : `` `Section #123` `` rougit — écris `n°123`.*
- Light theme only (token layer is structured for a later `[data-theme="dark"]`). ≥44px hit targets. Keyboard-operable. Borders + surface tints carry hierarchy, not shadows (shadows only on menus/modals).
- Type: Hanken Grotesk (UI/body) + JetBrains Mono (labels/meta/badges). Accent blue = selection / primary action / active option only.
- Swap Unicode glyph icons for a real icon set (Phosphor or Lucide) at the visual pass; node badges are CSS-drawn (see `components/primitives/NodeBadge`).

## Where to look

- `docs/ROADMAP-BASCULE-IA.md` — **the live plan**: the settled decisions, the feature order, what was deleted and why.
- `docs/PLAN-BASCULE-IA.dc.html` — the target plan this roadmap translates (design reference, not production code).
- `docs/REGLES-DU-JEU.md` + `docs/REGLES-PLAY.md` — the game rules (source of truth) and their play-mode orchestration.
- `docs/EXIGENCE-APERCU-DU-JEU.md` — the « Aperçu du jeu » CTA and the **extractable-runtime** constraint on `src/player/`.
- `src/features/<feature>/specification.json` — per-feature plan, acceptance criteria, iterations, known risks.
- `design_handoff_gamebook_editor/` — `DESIGN-SYSTEM.md` + `styles.css` + `tokens/` + `components/` + the wireframes, plus `brief/context.md` (the original product brief).
