# Plan global — convergence outils/méthodes entre projetx, chrono-sabine, genliv

_Créé le 2026-08-12 (projetx). Mis à jour le 2026-10-08 (genliv, panel sibling-convergence n° 2).
Trois copies identiques aux trois racines ; cette session ne peut écrire que celle de genliv —
les deux autres reçoivent un prompt de reprise (§5)._

---

## 0. Lexique

| Terme | Définition |
|---|---|
| **gate-hook** | Script `.claude/hooks/` qui bloque un `git commit` mécaniquement (exit 2). Existe dans les trois projets. |
| **gate-humain** | La revue tech-lead + utilisateur qui précède le commit chez genliv et chrono-sabine (`WORKFLOW.md`, Build Steps étape 7). projetx n'en a pas — il committe automatiquement. |
| **A1** | Le design de gate-hook de projetx : hash de contenu + mode observation/blocking + escape hatch logged (`commit-gate.mjs`). Toujours en observation au 2026-10-08. |
| **trigger Cloudflare** | Le moment où un push distant déclenche un build Cloudflare — un push cassé casse alors un build distant, pas juste le poste local. |

---

## 1. La question posée, et pourquoi la réponse est oui — mais ciblée

_(Raisonnement inchangé — voir la version du 2026-08-12 pour le développement complet.)_

**Principe retenu : converger le socle partagé (schémas, conventions, patterns prouvés sûrs à
l'échelle solo) ; laisser diverger la profondeur d'outillage (CI, E2E, mutation testing étendu),
qui doit rester proportionnée à la taille et au risque de chaque projet.**

### Mise à jour 2026-10-08 — le déclencheur est PARTIELLEMENT activé

Le §1 du 2026-08-13 nommait « chrono-sabine et genliv migrent vers Cloudflare » comme trigger.
**L'état vérifié le 2026-10-08** :

- **genliv** : le trigger est **MET**. `worker/index.ts` (1 428 lignes), `wrangler.toml` avec un
  vrai id KV. Pas de CI (`.github/` absent). Le gate-hook bloque tsc+jest mais **pas ESLint** ; les
  4 invariants câblés (isolation, stockage brut, couleurs, `max-lines`) ne bloquent aucun commit.
- **chrono-sabine** : le trigger est **NON MET**. Pas de `worker/`, pas de `wrangler.toml`
  (`docs/WORKFLOW.md:339` : « Le worker n'existe pas encore »).
- **projetx** : A1 est en mode **observation** depuis sa pose (`.claude/state/gate-mode.json`,
  27 commits observés, critères de graduation 7j+20c dépassés depuis le 2026-08-30). Le gate-hook
  le plus sophistiqué est fonctionnellement un instrument de mesure, pas un bloqueur.

**Ce que ça invalide dans le plan précédent** :

1. §1 ligne 43 disait « les deux frères » — faux, seul genliv a le trigger.
2. §3 ligne 82 disait « script identique entre eux » — faux, 26 lignes d'écart : genliv a
   ajouté `Bash|PowerShell`, fail-closed python3, fast-exit et options globales git ; chrono-sabine
   a un trou (matcher `Bash` seul, fail-open si python3 absent).
3. §4 « CI / Playwright / audit mensuel restent proportionnés » — à rouvrir pour genliv, pas pour
   chrono-sabine.
4. La conclusion « porter A1 dès la synchro Cloudflare » est prématurée : A1 lui-même ne bloque
   rien. Durcir les gates existants vaut plus cher à court terme.

---

## 2. Socle commun — à rendre identique dans les trois projets

| Élément | Cible | Statut |
|---|---|---|
| Schéma `bug_history.json` (champs) | Identique | ✅ Déjà identique (vérifié 2026-08-12) |
| Convention `regression_test: null` → raison en `mitigation` | Les trois l'adoptent | ⚠ Dégradé chez projetx (46/251 entrées de `bug_history.3.json` sans raison, QA sondage). Absent du `WORKFLOW.md` de chrono-sabine et genliv — n'existe qu'en prose dans `projetx/dev/SKILL.md:617`. |
| Schéma `specification.json` : `resolved_decisions` + `open_questions` structuré | Les trois adoptent les deux | ✅ Les trois ont les deux (projetx `dev/SKILL.md:543`, chrono `WORKFLOW.md:405-415`, genliv `WORKFLOW.md:416-417`). Les grammaires divergent (objet / préfixes textuels / vide) ; la forme est locale, l'intention est convergée — pas de convergence de syntaxe. |
| Plafond de taille des journaux | Formule `ceil(mesure/5 kio) × 5 kio` | ✅ chrono-sabine et genliv l'ont. projetx a `cap_bytes` par shard (rotation), pas un budget de lecture — la nature est différente. |
| Budget de contexte mesuré (plafonds chiffrés sur les fichiers toujours chargés) | Les trois l'adoptent | ⚠ projetx n'en a PAS : 76 kio toujours chargés sans plafond ni cliquet. chrono (`WORKFLOW.md:254-291`) et genliv (`WORKFLOW.md` § Budget de contexte) l'ont. |
| Statut d'itération `"later"` | À évaluer par chrono/genliv | ◻ Non réévalué — genliv et chrono n'ont pas trouvé le besoin à ce jour. |

---

## 3. Convergence par sujet — qui a la meilleure implémentation, qui doit l'adopter

| Sujet | Meilleure impl. | Doit adopter | Statut |
|---|---|---|---|
| Lint cross-feature dérivé du disque | chrono (`isolation-modules.js`) | ~~projetx, genliv~~ | ✅ **FAIT** — projetx (`eslint-local-rules.js`), genliv (`.eslintrc.cjs:41-46`, cite `plan-global.md §3`) |
| Détection couleurs littérales (logique masquage `var()`) | projetx (`eslint-local-rules.js`) | ~~chrono, genliv~~ | ✅ **FAIT** — genliv BUG-027 corrigé (`.eslintrc.cjs:83,108`, lookbehind borné, cite projetx). chrono : `eslint-rules/couleur-color-mix.js` dédié. |
| Sévérité couleurs = `error` | chrono + genliv | ~~projetx~~ | ✅ **FAIT** — projetx l'a adopté |
| Rigueur mutation testing (seuil réel, rationale/fichier, cadence itération) | chrono | ~~projetx, genliv~~ | ✅ **FAIT** — genliv `stryker.config.mjs:1-80` (rationale + cadence, cite `plan-global.md §3`). projetx `stryker.brain.conf.mjs` a rationale. |
| Encapsulation (KR-561, Loi de Déméter) | genliv | ~~chrono, projetx~~ | ✅ **FAIT** (2026-08-16) |
| Gate-hook : ESLint dans la porte | projetx (`scripts/verify.mjs:41-49`) | **genliv**, chrono-sabine | ◻ À FAIRE — le gate genliv/chrono ne lance que tsc+jest ; les 4 invariants ESLint ne bloquent rien. `genliv:pre-commit-gate.sh`, `chrono:pre-commit-gate.sh` |
| Gate-hook chrono-sabine : durcissement | genliv (fail-closed, Bash\|PowerShell) | **chrono-sabine** | ◻ À FAIRE — chrono `settings.json:13` matcher `Bash` seul, fail-open python3. `genliv:pre-commit-gate.sh` est la référence. |
| Budget de contexte mesuré | chrono/genliv (formule + cliquet) | **projetx** | ◻ À FAIRE — 76 kio toujours chargés sans plafond. |
| Heuristique unions de littéraux (`switch` sans `default`, TS2366) | chrono (`WORKFLOW.md:326-330`) | **genliv**, **projetx** | ◻ À FAIRE — garde TS gratuite, heuristique de revue. |
| Validation mécanique des journaux (unicité BUG, enums, null→raison) | genliv (`codeKnowledge.test.ts:135-180`) | **projetx**, **chrono** | ◻ À FAIRE — projetx a BUG-021 dupliqué, 46 null sans raison. |
| Gate A1 (hash, bypass, graduation) | projetx (`commit-gate.mjs`) | chrono, genliv (quand prêt) | ⏳ **REPORTÉ** — durcir l'existant d'abord (#6, #7). Réévaluer une fois ESLint dans les gates et A1 gradué. |
| `cross-feature-scan.mjs` (régression mécanique inter-features) | projetx (`scripts/cross-feature-scan.mjs`) | genliv (profil cloud) | ⏳ **REPORTÉ** — second rang derrière le gate. |
| CI minimale (tsc+lint+jest au push) | projetx (`ci.yml`) | genliv | ⏳ **REPORTÉ** — pas de remote CI à ce jour. À rouvrir au premier pipeline Cloudflare Pages. |

---

## 4. Ce qui ne doit PAS converger

- **CI / Playwright / audit mensuel** — restent proportionnés au risque. **Mis à jour** : la ligne
  est à rouvrir pour genliv (trigger Cloudflare activé) mais PAS pour chrono-sabine (pas de worker).
  Reporté au §3 (CI minimale genliv).
- **Portée du mutation testing** — dépend du calcul métier propre à chaque projet.
- **Sémantique du versioning MINOR/PATCH** — trois choix valides, non transposables.
- **Grammaire des `open_questions`** — l'intention est convergée (les trois l'ont) ; la syntaxe
  est locale et le coût de convergence dépasse le bénéfice.
- **Grammaire des messages lint** — langue et outillage (plugin vs. sélecteur) différents.
- **Flux de commit** — projetx committe automatiquement, genliv/chrono ont un gate-humain. C'est
  une décision de gouvernance proportionnée, pas un écart à fermer.
- **Toute fonctionnalité produit** — hors sujet par construction.

---

## 5. Exécution — ce qui se passe où

### Items FAITS depuis le dernier audit

| Item (§3 du 2026-08-12) | Preuve |
|---|---|
| Lint cross-feature dérivé du disque → genliv | `genliv:.eslintrc.cjs:41-46` |
| Détection couleur littérale → genliv (BUG-027) | `genliv:.eslintrc.cjs:83,108` |
| `resolved_decisions` → genliv | `genliv:docs/WORKFLOW.md:416` |
| Rationale Stryker par fichier → genliv | `genliv:stryker.config.mjs:29-80` |
| Cadence mutation à l'itération → genliv | `genliv:stryker.config.mjs:6-21` |
| Encapsulation → chrono, projetx | `chrono:raffinage-iteration/SKILL.md:74-86`, `projetx:dev/SKILL.md:110,277` |
| Détection couleur littérale → chrono | `chrono:eslint-rules/couleur-color-mix.js` |
| `resolved_decisions` + `open_questions` → chrono | `chrono:docs/WORKFLOW.md:405-415` |
| Sévérité couleurs → projetx | Vérifié `error` dans `.eslintrc.cjs` |
| Rigueur mutation → projetx | `projetx:stryker.brain.conf.mjs` |

### Dans cette session (genliv) — à ne PAS exécuter automatiquement

Rien n'est exécuté par cette skill. Les items ci-dessous forment le backlog, à coder un par un sur
demande explicite.

**Pour genliv** (cette session peut écrire) :
1. Ajouter `npm run lint` au gate-hook (`pre-commit-gate.sh`, entre tsc et jest).
2. Porter l'heuristique d'unions de littéraux (chrono `WORKFLOW.md:326-330`) en heuristique de
   revue dans `docs/WORKFLOW.md` (Build Steps, étape 5).
3. Étendre `codeKnowledge.test.ts` : vérifier `regression_test: null` ⇒ raison en `mitigation`,
   vérifier les enums `severity` / `discovered_at`.

**Pour projetx** — prompt de reprise à coller dans une session ouverte sur ce dépôt :
> Lis `plan-global.md` à la racine (mis à jour le 2026-10-08). Quatre items te concernent :
> 1. Copie le `plan-global.md` tel quel (identique aux trois racines).
> 2. Graduate A1 en mode blocking : écris `"mode": "blocking"` dans `.claude/state/gate-mode.json`
>    — les critères (7j, 20c) sont dépassés depuis le 2026-08-30 (27 commits observés, zéro faux
>    blocage). C'est une décision manuelle, pas un patch de code.
> 3. Mesure puis plafonne le budget de contexte (CLAUDE.md + skills toujours importés) avec la
>    formule `ceil(mesure/5 kio) × 5 kio`, le cliquet vers le bas et la compaction au franchissement
>    — le même dispositif que chrono-sabine (`WORKFLOW.md:254-291`) et genliv.
> 4. Porte l'heuristique d'exhaustivité des unions de littéraux (chrono-sabine
>    `docs/WORKFLOW.md:326-330`) dans la revue de `dev/SKILL.md`.
> 5. Porte la validation mécanique des journaux de genliv (`codeKnowledge.test.ts:135-180`) :
>    unicité BUG-xxx sur tous les shards, enums, `null` → raison. Tu as un BUG-021 dupliqué et
>    46 entrées null sans raison dans `bug_history.3.json`.

**Pour chrono-sabine** — prompt de reprise :
> Lis `plan-global.md` à la racine (mis à jour le 2026-10-08). Trois items te concernent :
> 1. Copie le `plan-global.md` tel quel (identique aux trois racines).
> 2. Durcis le gate-hook : copie les trois renforcements de genliv (`pre-commit-gate.sh`) —
>    matcher `Bash|PowerShell` dans `.claude/settings.json`, fail-closed si python3 absent, et
>    garde bon marché `case` pour sortir tôt sur les commandes sans `git…commit`. Ton hook actuel
>    (48 lignes, inchangé depuis le 2026-08-06) laisse passer un commit PowerShell et sort en
>    `exit 0` si python3 manque.
> 3. Ajoute `npm run lint` au gate-hook (entre tsc et jest).
> 4. Porte la validation mécanique des journaux de genliv (`codeKnowledge.test.ts:135-180`) :
>    unicité BUG-xxx, enums, `null` → raison.

**Reporté (pas d'action immédiate)** :
- Porter A1 (hash + bypass) → réévaluer une fois ESLint dans les gates et A1 gradué en blocking.
- `cross-feature-scan.mjs` → réévaluer quand genliv aura une CI.
- CI minimale genliv → réévaluer au premier pipeline Cloudflare Pages.

---

## 6. Gouvernance — éviter que ça re-diverge silencieusement

_(Inchangé — pas de nouvel outillage cross-repo automatisé. `sibling-convergence` reste un contrôle
périodique et déclenché, invoqué à la main.)_

**Constat 2026-10-08** : le skill `sibling-convergence` lui-même a divergé entre les trois copies
(genliv a `model: opus` / `effort: xhigh` dans le frontmatter, chrono n'a pas ce frontmatter,
projetx est traduit en anglais). Ces différences sont de la configuration locale, pas du contenu —
le corps du skill est le même. À re-vérifier au prochain audit.

**Coût mesuré de cet audit** : ~545k tokens (4 agents, ~81s à ~493s par agent). Plus élevé que le
premier passage (~400k) à cause de la taille accrue des dépôts et de l'annexe de preuves du QA.
Le prochain déclencheur nommé : le premier pipeline CI/Cloudflare Pages activé sur genliv ou
chrono-sabine, ou la graduation d'A1 en blocking chez projetx.
