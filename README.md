# genliv — Éditeur de « livre dont vous êtes le héros »

Authoring tool for gamebooks. UI and domain terms are in **French**.

**✅ Bascule livrée** (`0.7.31`, 2026-10-08) : le produit est passé d'un **arbre de choix** à un **dossier d'aventure joué par une IA**. **Temps 1** (l'éditeur produit le dossier, features n° 1–8, 48 itérations) et **Temps 2** (le moteur le joue, n° 9–16, 29 itérations) sont terminés. Le plan exécutable — décisions tranchées, dette à déclencheur, suite — est [`docs/ROADMAP-BASCULE-IA.md`](./docs/ROADMAP-BASCULE-IA.md).

Règles du jeu (source de vérité, KR-130) : [`docs/REGLES-DU-JEU.md`](./docs/REGLES-DU-JEU.md) + [`docs/REGLES-PLAY.md`](./docs/REGLES-PLAY.md) (orchestration du mode jeu). Design handoff : [`design_handoff_gamebook_editor/`](./design_handoff_gamebook_editor). Règles toujours actives : [`CLAUDE.md`](./CLAUDE.md).

## Stack

- **React 18 + TypeScript**, built with **Vite**.
- **Jest + React Testing Library** (161 fichiers de test, porte de commit) — pas d'E2E navigateur : différé au repointage de `tree-canvas`.
- **Stryker** (score de mutation, 4 fichiers de règles, `break: 90`) + table dorée `rules.golden.test.ts`.
- **ESLint + Prettier** (tabs, single quotes, no semicolons) — isolation des features, stockage brut, couleurs en dur et `max-lines` (800) câblés en règles.
- **Worker Cloudflare** (`worker/`) : routes `/ia/:role` (tous les appels modèle, clé API jamais côté client) et `/kv/:key` (synchro cloud). Setup : [`docs/IA-SETUP.md`](./docs/IA-SETUP.md).

## Commands

```bash
npm install      # install dependencies
npm run dev      # Vite dev server (http://localhost:5173)
npm run build    # type-check + production build
npm test         # Jest unit/component tests
npm run lint     # ESLint
npm run typecheck# tsc --noEmit
npm run test:mutation  # score de mutation (fin d'itération, hors porte de commit)
```

## Architecture

```
src/
  main.tsx / App.tsx  # React root + shell: maps route -> view, slot `panneaux`
  styles/             # design system: styles.css + tokens/*.css
  brain/              # core engine — feature-agnostic, never imports features/
    dossier/            # le dossier d'aventure: schema 1, types.ts (fait foi), validate,
                        # destinations (audience), controles (linter), session, evaluate,
                        # commandes, alea, horloge, faits — le contrat entre éditeur et moteur
    DossierService.ts   # single source of truth du dossier (get re-valide, update refuse/avertit)
    CopiloteService.ts  # tous les appels modèle (rédaction + jeu), via le worker
    challenge/combat/xp/characteristics.ts  # règles pures, RNG injectable, sous mutation
    EventBus / Router / PersistenceService + persistenceKeys  # contrats transverses
    components/ utils/  # primitives et utilitaires cross-feature (KR-109/110)
    tree.ts, BookService.ts, kinds.ts  # modèle d'ARBRE en sommeil — extinction au
                        # repointage de tree-canvas, jamais avant (KR-240)
  features/           # modules isolés — ne se parlent que par brain/
    dossier-format      # n°1  — import + validateur du dossier (5/5)
    bascule-editeur     # n°2  — nav par sections, DossierEditorScreen (3/3)
    dossier-canon       # n°3  — canon, départ, objectifs, lieux + accès (5/5)
    dossier-fiches      # n°4  — la fiche personnage, 8 blocs (8/8)
    dossier-objets      # n°5  — registre des objets (2/2)
    dossier-registres   # n°6  — indices, jalons & fins, quêtes, événements, climat (5/5)
    dossier-controles   # n°7  — le linter d'aventure, 9 règles, seuil `jouable` (10/10)
    dossier-copilote    # n°8  — 7 assistants qui PROPOSENT et n'écrivent jamais (6/6)
    moteur-dossier      # n°9  — le moteur joue le dossier sans IA (4/4)
    moteur-interprete   # n°10 — R1 traduit la saisie libre, R3 narre, mémoire, budget (4/4)
    moteur-arbitre      # n°11 — le code lance le dé demandé par l'IA, marge → XP (3/3)
    moteur-acteurs      # n°12 — R4: dialogues PNJ, révélations fail-closed, confiance (4/4)
    moteur-combat       # n°13 — combat raconté (R5), jamais arbitré par l'IA (3/3)
    moteur-horloge      # n°14 — le monde avance sans le joueur (4/4)
    moteur-fins         # n°15 — fin verbatim, mort, reprise, relance à graine égale (4/4)
    dossier-repetition  # n°16 — répétition synthétique: un joueur sans IA traverse (3/3)
    book-library / book-creation / cloud-sync  # survivantes, repointées sur le Dossier
    tree-canvas         # vue graphe de l'arbre — code intact, EN SOMMEIL, repointage sur go
    play-mode           # le shell de partie (console, journal, écrans) au-dessus de player/
  player/             # runtime joueur EXTRACTIBLE — fonctions pures brain/ seulement
                      # (docs/EXIGENCE-APERCU-DU-JEU.md ; règle ESLint dédiée)
worker/               # Cloudflare Worker: /ia/:role (invites par rôle) + /kv/:key
```

**Principles** (see `CLAUDE.md` for the full set): single source of truth (`DossierService`) · feature isolation via `brain/` (ESLint, 3 sens) · persistence via `PersistenceService` only · derived state computed inline (KR-013) · references by stable id, never by name · l'IA ne lance jamais les dés · audience avant injection (`destinations.ts`, zéro dérogation).

## Domain model

Le document est un **dossier d'aventure** — `Dossier`, `schema: 1`, trois racines : `canon` (vérité MJ, accroche joueur, objectifs par camp), `monde` (personnages, lieux + accès, objets, indices, quêtes, événements, conditions/climat), `charpente` (départ, jalons, fins). **`src/brain/dossier/types.ts` fait foi.** Tout champ ajouté est **optionnel à vie** (aucune migration en `schema: 1`). Les conditions sont un arbre `ExprNode` sans parseur (registre `PREDICATES`), les effets un registre `DELTAS`. Pendant la partie, le dossier est en **lecture seule** : tout ce qui bouge vit dans l'état de session (graine, journal, horloge, héros).

## Historique

Le journal itération par itération vit dans [`CHANGELOG.md`](./CHANGELOG.md), les specs (`src/features/*/specification.json`) et les revues (`.claude/raffinage/*.revue.md`) — pas ici. L'éditeur d'arbre pré-bascule (jusqu'à `0.5.34`) et les huit features supprimées le 2026-08-03 sont dans l'historique git.
