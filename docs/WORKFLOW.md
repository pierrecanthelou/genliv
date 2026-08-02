# Claude Code Config — genliv

CRITICAL: the test + `tsc --noEmit` gate before every commit is **enforced deterministically** by a `PreToolUse` hook (`.claude/hooks/pre-commit-gate.sh`, wired in `.claude/settings.json`) — it blocks any `git commit` until `tsc --noEmit` and `jest` pass. Do not treat the gate as optional or try to work around it.

**Commit/review flow (binding):** write code → **`tech-lead` agent PR** review (re-review until `APPROVE`) → **user review** → **commit to `main`**. The user reviews the still-uncommitted slice and must approve before anything is committed; commit directly to `main` (no feature branch). Your remaining responsibilities: keep the gate green, present the tech-lead verdict + a one-line summary (files + intent) to the user, and commit only after the user approves. See **Build Steps → The per-feature unit** for the full sequence.

**Review scope is by file type:** if the change touches **only `.md`** files (docs), skip both the tech-lead PR and user review — just commit it directly to `main` once green. If the change touches **any `.ts`/`.tsx`** file (code), apply the full flow above (tech-lead PR → user review → commit), even when the diff also includes `.md` files.

## Stack: React

Default to React with **TypeScript**. All source files use `.ts`/`.tsx`. Explicit types on public interfaces and hook return values; infer elsewhere.

- **HTML**: Semantic elements, no divitis. ARIA attributes where native semantics are insufficient. PWA oriented.
- **CSS**:
- **JS/JSX**: ES2020+, React 18+, hooks only (no class components). `async/await`, optional chaining, nullish coalescing.
- **Build**: Vite. No other build tool unless asked.
- **No unnecessary dependencies**: prefer React built-ins and native browser APIs before reaching for a library.
- **Tests**: Jest + React Testing Library for unit/component tests. Coverage > 80% overall. Playwright for E2E.
- **Linter/Beautifier**: ESLint (with `eslint-plugin-react`, `eslint-plugin-react-hooks`) + Prettier.

## Code Style

- Tabs for indentation.
- Single quotes in JS/JSX.
- No trailing semicolons.
- Components are functions. Never class components.
- One component per file. File name matches component name (PascalCase).
- Keep components small: extract logic into custom hooks, pure helpers into `utils/`.
- Props: destructure in the function signature. No prop spreading on DOM elements.
- Events: handler names prefixed with `handle` (e.g., `handleSubmit`). Prop names prefixed with `on` (e.g., `onSubmit`).
- No `useEffect` for derived state — compute it inline or with `useMemo`. Legitimate uses: subscriptions, imperative DOM/third-party APIs, syncing with external systems.

## File Organization

```
...                         # config files (vite.config.js, .eslintrc.cjs, .prettierrc, package.json, ...)
bug_history.json            # bugs surfaced during a feature's quality loop (review/test) or after merge, with mitigation
features_history.json       # what was built and how, to inform future work
src/
    index.html              # Vite entry HTML
    style.css               # global CSS (reset, custom properties, typography)
    main.jsx                # React root: mounts App, wires brain + features
    brain/                  # Core engine: drives navigation (routing), cross-feature communication,
                            # and service wiring. Implements Event Bus, Service Locator, Router,
                            # and DI via React Context. Feature-agnostic — never imports from features/.
    features/               # Independent feature modules. Each owns its components, hooks,
                            # utils, and tests. Communicates with other features only via brain/.
dist/                       # Vite build output (gitignored)
```

Each feature folder:

```
features/[feature_name]/
    specification.json      # plan + implementation record (see schema below)
    index.js                # public API — only export what other features may need via brain
    components/
    hooks/
    utils/
    tests/
```

## Architecture Principles

Apply SOLID principles and relevant Design Patterns. Always propose a plan before implementing.

**SOLID in brief:**

- **S** — Single Responsibility: each module/function does one thing and one thing only.
- **O** — Open/Closed: extend behavior via new modules, not by modifying existing ones.
- **L** — Liskov Substitution: any implementation of a contract must be swappable without breaking callers.
- **I** — Interface Segregation: expose small, focused APIs rather than large, general ones.
- **D** — Dependency Inversion: features depend on brain/ abstractions, never on each other's internals.

**Common Design Patterns to reach for:**

- Observer / Event Bus: decoupled cross-feature messaging.
- Service Locator: runtime resolution of shared services via brain/.
- Factory: encapsulate complex object creation.
- Strategy: swap algorithms behind a stable interface.
- Facade: simplify a complex subsystem behind a single entry point.

`brain/` is the core engine of the application. It drives navigation (routing) and exposes contracts that features consume. It must never import from `features/`.

Features are isolated: a feature must not import directly from another feature. Cross-feature communication goes through `brain/` only.

**`brain/utils/` for cross-feature utilities:** Any utility function used by more than one feature belongs in `brain/utils/`, never in a feature's own `utils/`. Importing from a sibling feature's `utils/` is a cross-feature violation (KR-110).

**`brain/components/` for cross-feature presentational primitives:** Any presentational component consumed by more than one feature belongs in `brain/components/`. A component living in a feature but imported by others is a cross-feature violation — move it to `brain/components/` and re-export from `brain/components/index.ts` (KR-109).

**Sensitive credentials in storage:** Any localStorage key holding a user credential, token, or sensitive value (PAT, OAuth tokens, API keys) must be registered in `brain/persistenceKeys.ts` with a `/* SENSITIVE */` marker and annotated in `UIPreferenceKey`. This creates a single auditable location for all credential storage on this cloud-first PWA (KR-114).

**Component size limits:** A component or hook file over 400 lines is a split signal — extract subcomponents or hooks. A file over 800 lines is a merge blocker (KR-112).

**When refactoring**, identify bad smells first (dead code, long functions, feature envy, shotgun surgery, duplicated logic, primitive obsession), then propose a refactoring plan before touching code. Common techniques: Extract Function/Method, Move Function, Replace Conditional with Polymorphism, Introduce Parameter Object, Replace Magic Number with Symbolic Constant.

## Architecture Vocabulary

Use these terms consistently in code, comments, specs, and conversation. Do not invent synonyms.

| Term | Definition |
| ---- | ---------- |

## Dangerous Actions

A **dangerous action** is any user-triggered operation that is destructive (deletes or permanently removes data), irreversible or hard to reverse (no undo available), or high-consequence (disconnects a service, wipes a configuration, or causes data to diverge).

**Rule**: every dangerous action must be guarded by a confirmation dialog before executing. The dialog must:

- Name the action clearly in the title.
- Describe what will happen (and what will _not_ happen, e.g. "cloud data stays intact").
- Offer a labelled cancel path ("Annuler").
- Use `color="error"` on the confirm button.

Non-dangerous (no dialog needed): navigation, toggling UI state, saving/editing content, read-only operations.

## Testing Patterns

### Mock PersistenceService

Every test mock of `PersistenceService` must include `keys`:

```ts
const persistence = {
 get: jest.fn((k: string) => store[k] ?? null),
 set: jest.fn((k: string, v: unknown) => {
  store[k] = v
 }),
 remove: jest.fn(),
 keys: jest.fn((_prefix: string) => [] as string[]),
}
```

When adding a new method to `PersistenceService`, immediately scan all test mocks and add the stub.
Add to `coveragePathIgnorePatterns` in jest config — do not write artificial tests for:

### Coverage Exclusions

- All `index.ts` barrel re-export files (no logic to test)

### RTL Query Safety

When multiple elements can render the same text (e.g., a date shown on two entries), use `getAllByText(...).length > 0` instead of `getByText` to avoid `getMultipleElementsFoundError`.

Avoid apostrophes in `describe`/`it` label strings — they terminate JS template literals in some configurations. Use ASCII-safe labels.

### Score de mutation — hors porte de commit

`npm run test:mutation` (Stryker, `stryker.config.json`) mesure l'arithmétique des règles du jeu. Il ne fait **pas** partie de la porte de commit : le hook `.claude/hooks/pre-commit-gate.sh` n'exécute que `tsc --noEmit` + `jest`, et cela ne change pas. On lance le score **en fin d'itération**, dès qu'une itération a touché l'un des quatre fichiers mutés.

**Périmètre muté (4 fichiers)** : `src/brain/challenge.ts`, `src/brain/combat.ts`, `src/brain/xp.ts`, `src/brain/characteristics.ts`. Le run n'exécute que la couche logique (`jest.mutation.cjs` : `src/brain/**` + `src/player/**`) — un mutant de règle que seul un test RTL de composant pouvait tuer est, par définition de cet instrument, un survivant. L'arithmétique s'épingle à l'unité, pas incidemment par un rendu.

**Cliquet du seuil** — `thresholds.break` ne descend jamais.

- Valeur posée le 2026-08-02 sur une mesure : score 81,40 % → `break: 80`, `low: 80`, `high: 90`.
- Toute itération qui touche l'un des 4 fichiers relève `break` de **+5**, plafond **90**. Jamais desserré.
- Le seuil s'écrit toujours `floor(score mesuré / 5) × 5` — aucun chiffre non mesuré dans la config.
- Au-delà du plafond, tout survivant restant doit porter un `// Stryker disable next-line <Mutator>: <justification>`. Un survivant non annoté est un défaut de revue, pas un défaut de seuil.

**Garde-fou par fichier** : recopier les 4 scores du reporter `clear-text` dans la revue d'itération. **Aucun fichier ne recule** — `combat.ts` et `challenge.ts` nommément suivis. Un score global qui monte pendant qu'un fichier descend est un échec, pas un progrès. Pas de script maison pour ça : une abstraction à un seul appelant est une dette.

**Le score varie de ±1 mutant d'un run à l'autre — ne le lis pas à la décimale.** Mesuré sur 5 exécutions le 2026-08-02 : 81,40 % quatre fois, 81,01 % une fois. La cause est identifiée : le mutant `ObjectLiteral` de `combat.ts:107` remplace `{ shield: …, rng }` par `{}`, ce qui fait retomber `rng` sur son défaut `Math.random` non seedé — le test qui devrait le tuer dépend alors d'un tirage réel. Conséquences pratiques : comparer deux scores à moins d'un demi-point ne veut rien dire, et le garde-fou « aucun fichier ne recule » se lit **à ±1 mutant près**, sinon il produira de fausses alertes. Le correctif de fond est de passer un `rng` explicite dans ce test plutôt que de s'appuyer sur le défaut ; à traiter quand `outillage-2` touchera ce mutant.

**`RuntimeError` : zéro toléré** sur les 4 fichiers de logique. Stryker les exclut du dénominateur : ils **rétrécissent la base en silence** et le score cesse d'être lisible tant qu'ils sont là. C'est une panne d'instrument, pas un résultat — on la répare, on ne la contourne pas.

**Registres de données : neutraliser par mutateur, jamais un fichier entier.** Un registre (`CHALLENGE_TIERS`, `CHARACTERISTICS`, les libellés de `POSTURES`, le `BESTIARY`) ne produit que des mutants de littéraux : ils mesurent une densité de données, pas la qualité des tests. On les sort du dénominateur avec `// Stryker disable StringLiteral,ObjectLiteral,ArrayDeclaration: <motif>` + le `// Stryker restore` correspondant, posé au plus près — les `ArithmeticOperator` et `ConditionalExpression` du même fichier doivent continuer d'être générés, et un `restore` posé trop loin neutralise des valeurs de retour de fonction (le cas de `ecartBand` dans `combat.ts`). La contrepartie est **obligatoire et livrée dans le même lot** : `src/brain/rules.golden.test.ts` épingle valeur par valeur tout ce qui est neutralisé, et ce test-là tourne, lui, dans la porte de commit. Neutraliser sans épingler est un relâchement déguisé en durcissement.

Deux réglages à ne pas « corriger » : `tempDirName: "stryker-tmp"` **sans point** (avec `.stryker-tmp`, le `testMatch` ancré sur `<rootDir>/src/**` ne traverse pas un segment commençant par un point, jest voit zéro test et Stryker sort sur `No tests were executed`) et `cleanTempDir: true` (seule protection de `npm run lint` contre le bac à sable). Artefacts produits : `reports/mutation/index.html` + `mutation.json`, gitignorés.

## Timer Safety in Hooks and Components

Every `setTimeout` (and `setInterval`) that calls `setState` or any other side-effect must be tracked in a `useRef` and cancelled in a `useEffect` cleanup. A timer that fires after unmount will attempt to update state on a dead component — React 18 silently drops it in dev but it is still a logic bug that can cause flicker, memory leaks, or double-firing in tests.

**Rules:**

1. **Track every timer in a ref**: `const myTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)`
2. **Cancel before scheduling**: `if (myTimerRef.current) clearTimeout(myTimerRef.current)`
3. **Cancel on unmount** via a single `useEffect` that returns a cleanup:

   ```ts
   useEffect(() => {
    return () => {
     if (myTimerRef.current) clearTimeout(myTimerRef.current)
    }
   }, [])
   ```

4. **Chained timers** (inner `setTimeout` inside an outer one) count as separate timers. If the inner id overwrites the ref (common for a two-phase show/hide indicator), the outer `useEffect` cleanup still cancels whichever is currently pending. Verify the chain produces no dangling id.
5. **`useEffect`-local timers**: if a `setTimeout` is created inside a `useEffect`, return `() => clearTimeout(id)` from that same effect instead of using a ref.
6. **Fire-and-forget timers that touch no state** (e.g. `scrollIntoView`) are low-risk but must still be cleaned when inside a `useEffect` — use the returned cleanup, not a separate ref.

**Scan rule**: before committing any hook or component that contains `setTimeout`, search the file for all `setTimeout` calls and verify each one is either (a) tracked in a ref with a matching `useEffect` cleanup, or (b) returned directly from a `useEffect`. Untracked timers are bugs.

## Established UI Patterns

### Hover-reveal row actions

Reveal action buttons on row hover via CSS only — no `isHovered` JS state:

```tsx
// Parent ListItem
sx={{
  position: 'relative',
  '&:hover': { bgcolor: 'action.hover' },
  '&:hover .hover-action': { opacity: 1 },
}}

// Each hover-only button
<IconButton className="hover-action" sx={{ opacity: 0, transition: 'opacity 0.15s' }}>
  <SomeIcon />
</IconButton>
```

This is the canonical pattern for all hover-only row actions in `XItem` and any future list row.

### Cross-feature UI action registration

When multiple independent modules need to contribute actions to the same UI surface (e.g. a BubbleMenu, a toolbar, a context menu), prefer a **registration context** in `brain/` over feature-specific callbacks:

```ts
// brain/SomeSelectionContext.tsx
registerAction(action: { id, label, icon, onTrigger }) => () => void  // returns unregister
actions: Action[]
```

- Context provided by the feature that owns the UI surface (e.g. `NotesProvider` for the notes editor BubbleMenu).
- Consumers call `registerAction` in a `useEffect` — the return value is the cleanup (KR-004 stable-ref for any callback that closes over mutable state).
- The noop default on the context keeps all consumers safe when rendered outside the provider.
- This pattern was used for `NotesSelectionContext` (pensine + todo registering BubbleMenu actions on the notes editor).

## What to Avoid

- Class components.
- `var` — use `const` by default, `let` when reassignment is needed.
- Inline styles except for truly dynamic values.
- `dangerouslySetInnerHTML` with untrusted data (XSS risk).
- `document.write`.
- Prop drilling beyond 2 levels — use Context or brain/ instead.
- Overly generic utilities or abstraction for one-time use.
- Direct cross-feature imports (bypasses brain/ contract).
- Component or hook files over 400 lines — extract subcomponents or hooks first (KR-112).
- `// eslint-disable-next-line react-hooks/exhaustive-deps` — always fix the root cause; this comment masks stale-closure bugs (KR-113).
- Raw `window.localStorage` calls in feature files — use `useUIPreferences()` from `brain/` for non-synced UI state (KR-111).

## Accessibility Defaults

- All interactive elements must be keyboard-accessible.
- Images need meaningful `alt` text (or `alt=""` for decorative).
- Color contrast must meet WCAG AA.
- Use native form elements before rolling custom ones.
- `aria-label` or `aria-labelledby` on all landmark regions.

## Performance Defaults

- `React.memo` only when profiling shows a real problem — not preemptively.
- `useMemo` / `useCallback` only for expensive computations or stable references needed by children.
- Lazy-load routes and heavy components with `React.lazy` + `Suspense`.
- Lazy-load images below the fold with `loading="lazy"`.
- Vite code-splits by route automatically — keep route chunks focused.

## Versioning — horizontal slices (MVP → V1 → V2 …)

We build **breadth-first**: every MINOR is a *runnable slice across all features* at a given depth. See `docs/ROADMAP.md` for the live plan.

`package.json` follows **0.MINOR.PATCH**:

- **MINOR = capability tier.** `0.1.x` = MVP (every feature has a walking skeleton). `0.2.x` = V1 (iteration 1 of every feature). `0.3.x` = V2 (iteration 2). `0.4.x` = V3, etc. Iteration counts are ragged (per-feature `n` is 3–4), so later tiers include fewer features.
- **PATCH = one feature advanced within the current tier.** Each feature's slice (skeleton in `0.1.x`, or iteration *K* in the `0.(K+1).x` tier) committed to `main` → PATCH +1.
- Within a tier, advance features in the documented **build order** (dependencies first).
- Bug fixes do not bump the version on their own — they fold into the feature/iteration that introduced them.
- A feature whose iteration *K* was already banked in a prior (depth-first) pass is **skipped** in that tier (no-op, no bump).

Apply the bump immediately after the slice is committed to `main`.

**Session-gate floor**: every session bumps at minimum PATCH +1. If `package.json` hasn't changed since last session, bump PATCH +1 in a `chore(release)` commit so every deployed build carries a distinct version.

## Code Knowledge

`code-knowledge.json` at the project root is a **single source of cross-feature known risks and lessons**. It is aggregated from all `specification.json` files.

**MANDATORY — before writing any code:**

1. Read `code-knowledge.json` in full.
2. Apply every relevant entry. Do not re-discover a known risk by trial and error.

**MANDATORY — after adding new `known_risks` to any `specification.json`:**

- Append the same entries to `code-knowledge.json` with the next sequential `id` (KR-NNN).

## Bug Investigation

Before diagnosing any bug or answering "is this a bug?" questions:

1. Read `features/[feature]/specification.json` — check `acceptance_criteria`, `known_risks`, and `implementation.iterations_log` for intended behavior.
2. Read `bug_history.json` — check for prior related bugs and their root causes.
3. Read `features_history.json` — check lessons learned.
4. Only then read the code.
5. When the bug is visual and in a view that has a paired counterpart (DayView ↔ WeekView), immediately check the other view too — rendering fields added to one are frequently missing from the other (KR-079).

Do not form a hypothesis from the code alone before cross-referencing the spec. The spec is the source of truth for intended behavior.

**Visual bug fix checklist**: after writing the fix, verify it matches ALL visual properties of structurally similar rows in the same component — padding (`px`, `py`), `borderRadius`, hover state, font. A fix that restores the missing element but breaks alignment is not complete.

## Build Steps — breadth-first slices, one feature at a time

We build the app as **horizontal slices** (see `docs/ROADMAP.md`): tier `0.1.x` gives every feature a walking skeleton (MVP); tier `0.(K+1).x` gives every feature its iteration `K` (V`K`). Within a tier, advance features in the documented build order. **Build exactly one feature's slice, then STOP** — never chain features in a single run.

### The per-feature unit (one PATCH bump, one stop)

1. **Read first.** The feature's `specification.json` (`acceptance_criteria`, `known_risks`, `implementation` log, iteration statuses), `code-knowledge.json` (in full), `bug_history.json`, `features_history.json`, and the relevant sibling specs. If the spec is inconsistent (e.g. iterations without acceptance criteria), propose a fix first. Before coding a **planned** iteration, read the current code — it may already be done; if so mark it `done` and move on (no bump).
2. **Build the slice** — skeleton in `0.1.x`, or iteration `K` in the `0.(K+1).x` tier. Minimal, no decoration. Brain contracts only; consider the whole architecture, side effects and risks.
3. **Gate**: Prettier → `tsc --noEmit` → ESLint → `jest`. (The pre-commit hook enforces tsc+jest; never bypass it.) Refactor → re-gate.
4. **Docs**: update `specification.json` (implementation log / iteration status), mirror new `known_risks` into `code-knowledge.json`, add a `CHANGELOG.md` line, update `features_history.json` and `README.md`.
5. **Self review gate** (quick): `Severity | File:line | Principle/KR | Finding | Fix`. Fix ALL findings; log each to `bug_history.json`. Re-run `tsc` + `jest`.

   **État dérivé (KR-013/113) — heuristique de revue ; il n'existe volontairement pas de règle ESLint pour ça.** L'AST voit une forme, pas une sémantique : le seul sélecteur plausible (« un `useEffect` dont le corps entier est un unique `setX(...)` ») remonte 0 site aujourd'hui et se tromperait demain sur des motifs légitimes (`setMounted(true)`, reset au changement de route) — une règle qui se trompe là-dessus est désactivée dans le mois et emporte les autres avec elle. À chaque auto-revue touchant un composant ou un hook :

   1. Repérage : `rg -n -U --multiline-dotall "useEffect\(\(\) => \{[^}]{0,120}\bset[A-Z]\w*\(" src/`
   2. Pour chaque site remonté, **une** question : « la valeur posée par ce `setX` est-elle calculable à partir des props / de l'état déjà présents au rendu ? » Si oui → `useMemo` ou calcul en ligne, l'effet part.
   3. `react-hooks/exhaustive-deps` reste à `'error'` — il attrape la sous-classe des miroirs à dépendances mensongères. Toute exception est un `overrides` ciblé sur **un seul fichier**, motivé en commentaire et tracé dans `bug_history.json` ; `// eslint-disable-next-line react-hooks/exhaustive-deps` reste interdit.
6. **Tech-lead review (the PR) — BEFORE the user sees it.** Stage the slice (`git add -A`, do NOT commit) and invoke the `tech-lead` subagent on the **uncommitted** staged diff against `main` (`git diff --staged`). Fix every must-fix (critical/major) **and** every accepted minor finding, logging each to `bug_history.json`; re-gate (`tsc` + `jest`) and re-review until the verdict is `APPROVE`. **The user never reviews a diff that still carries an open finding — the tech-lead PR is the pre-screen.**
7. **User review (the commit gate) — STOP.** Present the still-uncommitted slice: the `tech-lead` `APPROVE` verdict, the acceptance-criteria table, and a one-line summary (files + intent). **Wait for the user to review and approve.** Do not commit before the user approves; address any change the user asks for, then re-gate and re-run the tech-lead PR (step 6) before re-presenting.
8. **Ship (only once the USER approves)**: show the one-line summary and commit the slice **directly to `main`** (no feature branch) → bump `package.json` PATCH +1. Then do not start the next feature until the user gives the go.

When a tier's last feature ships, the app is runnable at that depth across all features; the next tier begins only on user go.

## Design Patch Processing

When `.patch` files are present in `genliv_changes/`, process them in filename order (alphabetical) before any other work:

1. List all `.patch` files in `genliv_changes/` sorted by filename.
2. For each patch in order:
   a. **Apply**: strip the mbox envelope (find the first `diff --git` line in the file) and pipe the remainder to `git apply`. Never use `git am` (it auto-commits).
   b. **Quality loop** (same as Build Steps): - **Review gate**: auto-review as code expert. Produce a structured report (same format as Build Steps quality loop). Always consider side effects and risks. - Fix ALL findings. Append each to `bug_history.json`. - Run full test suite (unit + E2E) **and** `tsc --noEmit`. - If all findings fixed and tests pass: proceed automatically.
   c. Type-check (`tsc --noEmit`) → run tests → if passing: show summary and commit automatically.
   d. **Delete the patch file** from `genliv_changes/`.
   e. Move to the next patch.
3. After all patches processed: **Stop and ask for user validation**.

**Patch apply failure**: if `git apply` rejects a hunk, do not force-apply. Instead report the conflict to the user, show the offending hunk and the current file state, and wait for instructions before proceeding.

## Worker Route Parity

Every `Cloudflare*Service.ts` file in `src/` that calls a worker URL **must** have a corresponding handler in `worker/index.ts`. Missing routes produce silent 404s in production.

**MANDATORY — in the quality loop Review gate**: grep for all `fetch(\`\${workerUrl}/`calls across`src/`and confirm each path has a matching`url.pathname === '/...'`handler in`worker/index.ts`.

Checklist for every new worker route:

1. Handler added: `if (method === 'POST' && url.pathname === '/my-route')`
2. Entry in `ROUTE_LIMITS`: `'/my-route': N` (characters — pick a sensible cap)
3. Rate limit check: `const rateLimited = await checkRateLimit(env.KV, encodedKey)`
4. Body size guard: reject with 413 if `rawBody.length > ROUTE_LIMITS['/my-route']`
5. Response shape matches the brain service interface (`brain/XxxService.ts`)
6. For SSE routes: stream `data: ...\n\n` lines ending with `data: [DONE]\n\n`
7. For JSON routes: parse AI output defensively; return 502 on invalid JSON

**Scan command** (run from repo root before every worker-touching commit):

```
grep -rE 'workerUrl\}/[a-z]' src/ --include='*.ts' | grep -oP '(?<=workerUrl\}/)[\w/-]+'
```

Every path listed must have a `url.pathname === '/...'` branch in `worker/index.ts`.

## Failure Paths

- **Worker route missing (404)**: a `Cloudflare*Service` calls a URL that has no handler in the worker — client gets a 404 at runtime. Fix: add the handler, `ROUTE_LIMITS` entry, and all guards per the Worker Route Parity checklist above. Log as critical in `bug_history.json`. Past occurrences: BUG-065 (`/top-three-suggest-day`, `/top-three-suggest-week`), BUG-066 (`/ai/recall/stream`).
- **Test suite fails before commit**: do not commit. Fix failing tests first. If the failure reveals a scope problem, update `specification.json` and re-plan with the user before proceeding.
- **Tech-lead PR review requires significant rework**: keep the slice uncommitted, fix it in place (or `git restore` and redo the affected part), re-gate, and re-run the tech-lead PR from scratch before it reaches the user.
- **E2E regression on a previously passing flow**: log it in `bug_history.json` immediately, block the commit, and fix before the slice reaches the user.
- **Review gate produces critical/major findings**: the tech-lead PR runs on the uncommitted staged diff, so fix all of them **before the user sees it** — the user never reviews (and we never commit) a slice that still carries an open finding. Do not carry known issues into `main`.

## JSON Schemas

### `features/[feature_name]/specification.json`

Two-phase document. `plan` is written when the slice begins. `implementation` is filled after the walking skeleton and updated after each iteration.

```json
{
 "feature": "feature-name",
 "created_at": "YYYY-MM-DD",
 "status": "in-progress",
 "plan": {
  "goal": "One sentence: what user problem this solves.",
  "acceptance_criteria": ["Observable, testable criterion 1", "Observable, testable criterion 2"],
  "brain_contracts": [
   {
    "type": "event",
    "name": "feature:event-name",
    "direction": "emits",
    "payload": { "field": "type" }
   },
   {
    "type": "service",
    "name": "AuthService",
    "direction": "consumes"
   }
  ],
  "walking_skeleton": "Description of the minimal end-to-end slice.",
  "n": 2,
  "iterations": [
   { "id": 1, "goal": "Add X", "status": "planned" },
   { "id": 2, "goal": "Polish Y", "status": "planned" }
  ],
  "known_risks": ["Risk identified from bug_history.json to guard against"]
 },
 "implementation": {
  "iterations_log": [
   {
    "id": 0,
    "label": "walking-skeleton",
    "completed_at": "YYYY-MM-DD",
    "architecture_choices": ["Used Observer pattern for Z because ..."],
    "deviations_from_plan": [],
    "test_coverage": { "unit": "82%", "e2e": "core flows covered" }
   },
   {
    "id": 1,
    "label": "iteration-1",
    "completed_at": "YYYY-MM-DD",
    "architecture_choices": [],
    "deviations_from_plan": [],
    "test_coverage": { "unit": "85%", "e2e": "extended flows covered" }
   }
  ],
  "open_questions": []
 }
}
```

**`status` values**: `planned` or `"in-progress"` or `"done"`.
**`direction` values**: `"emits"` or `"consumes"`.
**`iterations[].status` values**: `"planned"` or `"done"`.

### `bug_history.json`

Append-only log. Each entry is one bug surfaced during a quality loop.

```json
{
 "bugs": [
  {
   "id": "BUG-001",
   "date": "YYYY-MM-DD",
   "feature": "feature-name",
   "discovered_at": "walking-skeleton",
   "symptom": "What the user or test observed.",
   "root_cause": "Why it happened — code path or violated assumption.",
   "fix": "What was changed and where.",
   "mitigation": "Guard or validation added to prevent recurrence.",
   "regression_test": "tests/feature-name/bug-001.test.jsx — describe/it label",
   "severity": "critical"
  }
 ]
}
```

**`severity` values**: `"critical"`, `"major"`, `"minor"`.
**`discovered_at` values**: `"walking-skeleton"`, `"iteration-N"`, `"regression"`.

### `features_history.json`

One entry per completed feature. Written at the end of the build steps.

```json
{
 "features": [
  {
   "feature": "feature-name",
   "completed_at": "YYYY-MM-DD",
   "goal": "One sentence summary.",
   "key_architecture_choices": ["Choice made and why"],
   "brain_contracts_added": [
    { "type": "event", "name": "feature:event-name" },
    { "type": "service", "name": "ServiceName" }
   ],
   "lessons_learned": ["What to do differently next time"],
   "bugs_encountered": ["BUG-001"]
  }
 ]
}
```
