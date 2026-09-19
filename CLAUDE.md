# CLAUDE.md — Éditeur de « livre dont vous êtes le héros »

Persistent project context for Claude Code. Read `README.md` in this handoff for the full orientation; this file is the always-on rule set.

## Engineering workflow (always-on — read first)

The binding build process — build steps, the quality gate (tech-lead PR → user review → commit **directly to `main`**, no feature branch), versioning, testing patterns and the JSON schemas — is imported below so it loads every session. Follow it for every change; do not wait to be reminded.

@docs/WORKFLOW.md

The on-demand **design system** (tokens, primitives, wireframe fidelity, asset generation) is the `livre-jeu-design` skill in `.claude/skills/` — invoke it for visual/design work.

## What we're building

> ### ⚠ Où en est la bascule — lire `docs/ROADMAP-BASCULE-IA.md` avant tout travail neuf
>
> **Temps 1 est livré** (2026-09-19, `0.6.50`) : l'éditeur produit un **dossier d'aventure**, huit features, 48 itérations. Le travail en cours est le **§ 2 bis du roadmap — la dette du Temps 1** : **deux tranches bloquantes** (`B1` `lieux[].acces`, `B2` `outillage-2`) en `0.6.x`, puis une **dette à déclencheur** que rien ne planifie — chaque ligne part quand un lot rouvre son fichier. Le **Temps 2** (le moteur joue le dossier, n° 9–16, `0.7.x`) ne commence qu'ensuite, sur go explicite.
>
> Le modèle d'arbre (`BookNode` / `Edge` / `BookService` / `kinds.ts` / `playExport.ts`) **survit sans aucun producteur d'interface** : seules des fixtures de test l'atteignent, sa couverture ne vaut plus garantie d'usage, et sa démolition appartient à la **n° 9**, seule propriétaire d'extinction (KR-181). Ne rien y ajouter, ne pas le démolir en avance.

An **authoring tool** for « livres dont vous êtes le héros » (gamebooks). The author writes an **adventure dossier** — canon, personnages, lieux, objets, indices, quêtes, événements, fins — that an AI then plays. Temps 1 = authoring only; the play engine is Temps 2.

**Language: French throughout** (UI copy + domain terms). Do not translate to English.

## Design references are not production code

The `.dc.html` files are **HTML design references** (look + behaviour). Recreate them in this codebase's stack and patterns — do not ship the HTML. `Editeur Livre-Jeu - Wireframes.dc.html` is the **binding visual reference**; `Editeur Prototype.dc.html` shows the interactions. Fidelity is **low-fi wireframe**: structure/layout/component-anatomy/token-names are binding; the specific greys, the blue, and the Unicode-glyph icons are a placeholder visual pass to be reskinned later.

## Game rules — `docs/REGLES-DU-JEU.md` is the source of truth (always-on rule)

`docs/REGLES-DU-JEU.md` is the **single source of truth for every game mechanic** (KR-130): characteristics, challenge tiers, combat arithmetic, XP. Never settle a rule ambiguity from the code — go back to that file, correct it there, then propagate to `src/brain/`. `docs/REGLES-PLAY.md` is its orchestration complement for play mode.

The rules layer (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) is held by the mutation score: any iteration touching one of those four runs `npm run test:mutation` above `break: 80`, and `src/brain/rules.golden.test.ts` pins value by value everything the mutation config neutralises.

## Domain rules (non-negotiable)

Le document est un **dossier d'aventure** — `Dossier`, `schema: 1`, trois racines : `canon` (vérité MJ / accroche joueur / objectifs par camp), `monde` (personnages, lieux, objets, indices, quêtes, événements, conditions), `charpente` (départ, jalons, fins). **`src/brain/dossier/types.ts` fait foi** ; ne jamais extrapoler une forme, l'y lire.

- **Lot `contrat` obligatoire** : `types.ts`, `destinations.ts` et `validate.ts` ne sont **jamais** dans un lot de type `feature`. Toute tranche qui touche le schéma ouvre un lot `contrat`, seul et en premier (Décision A, veto tech-lead).
- **Aucun chemin de migration en `schema: 1`** (KR-160/191) : **tout champ ajouté est optionnel à vie**. Un champ requis de plus invaliderait rétroactivement tout dossier déjà écrit.
- **Audience avant injection** : `destinations.ts` dit pour qui chaque feuille est écrite — `auteur`, `ia` ou `moteur`. Un champ `auteur` n'entre dans **aucun** contexte de modèle ; rien ne s'injecte sans sa ligne de destination (garde stricte, zéro dérogation, KR-232).
- **Conditions** : couple `…_texte` (auteur, jamais injecté) / `…_expr` (**arbre JSON, jamais une chaîne, aucun parseur**), prédicats du registre fermé `PREDICATES`. L'auteur ne saisit jamais d'expression.
- **L'IA ne lance jamais les dés** et ne modifie aucune statistique : elle demande un jet, le moteur le résout, elle raconte.
- **Deux proses seulement sont émises verbatim** : `charpente.depart.texte_ouverture_joueur` et `charpente.fins[].texte`. Tout le reste est injecté, jamais récité.
- **Jamais de champ dérivable stocké** (KR-013) — une seconde source de vérité que rien ne re-synchronise. Cinq précédents rejetés : `tier` (KR-192), `Quete.lie_au_canon` (KR-206), `scene`/`obstacle`/`monstre`, `Indice.portee` comme classement, les références croisées de `Lieu` (roadmap § 4).
- Les objets portent un **nom (interne)** + une **`description_joueur`**. Les jets se résolvent en **réussite / échec** (seules couleurs sémantiques).
- **Toute référence est un identifiant stable**, jamais un nom libre. Une référence pendante est **refusée au SSOT**, jamais silencieusement rompue.
- Tout retrait d'entité est une **action dangereuse** : dialogue de confirmation, `color="error"`, chemin « Annuler » nommé.

## Architecture

- Features are **isolated**: a feature talks to the rest **only through `brain/` contracts** (services, events, registries). Never import one feature from another. *Enforced by ESLint dans les **trois** sens — feature→feature, `brain/`→feature, `player/`→feature — sur une liste dérivée du disque ; preuve : `lintIsolation.test.ts`. Importer `src/player/**` reste légal.*
- **Single source of truth**: the dossier lives in `DossierService`. Panels, canvas and preview are *views* — never hold a private copy.
- Thirteen features on disk: the eight of Temps 1 (`dossier-*` + `bascule-editeur`) and the five survivors of the bascule — `book-library`, `cloud-sync`, `book-creation` (repointées, livrées), `tree-canvas` (en sommeil, repointage différé après le Temps 2) et `play-mode` (suit le runtime, n° 9).
- Build order = the order of `docs/ROADMAP-BASCULE-IA.md`: § 2 bis `B1` then `B2`, then § 3 n° 9 → n° 16. One tranche at a time, never two in parallel.

## Cross-cutting engineering rules

> **Three of these are now wired into ESLint, not prompt guidance** — feature isolation, raw storage in features, and hardcoded colours fail `npm run lint` with a French message naming the fix. Don't re-derive them by hand; run the linter. The exception is **derived state (KR-013/113)**: there is deliberately **no rule** for it — the AST sees a shape, not a semantics — so it stays a review heuristic, written out in `docs/WORKFLOW.md` (Build Steps, step 5).

- **Persistence only via `PersistenceService` / `persistenceKeys.ts`** — no raw `localStorage` in feature code (KR-011/111). *Enforced: `no-restricted-globals` + `no-restricted-properties` on `src/features/**` (tests excluded).*
- **Derived state is computed inline**, not mirrored through `useEffect` (KR-013/113). *Not enforceable — review heuristic only.*
- **Empty states**: every empty element/list/input shows an inviting placeholder (example value, write-here prompt, dashed « + Ajouter… »). Never a blank void.
- Events to emit/observe — the list is `AppEvents` in `brain/EventBus.ts`, which is authoritative; keep this line aligned with it: `dossier:created|opened|updated|deleted`, `sync:status`, `sync:conflict`, plus les `book:*` / `node:*` / `edge:*` de l'arbre condamné, sans émetteur d'interface et démolis en n° 9. Fire navigation/events only **after persistence resolves**, in order.

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
