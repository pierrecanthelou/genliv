---
name: sibling-convergence
description: Comparer les outils, méthodes et conventions de process — jamais les fonctionnalités produit — entre les trois projets frères pilotés par CLAUDE.md (projetx, chrono-sabine, genliv), et produire/mettre à jour le plan-global.md partagé. À charger quand on demande une comparaison de pratiques entre les trois projets, ou selon les déclencheurs ci-dessous.
---

# Skill : Audit de convergence entre projets frères

projetx, chrono-sabine et genliv sont trois produits indépendants construits par le même
développeur avec la même méthodologie pilotée par CLAUDE.md, à des dates différentes. Ils partagent
déjà un patrimoine commun (schéma `bug_history.json` quasi identique, réponses convergentes mais
différentes au même problème d'outillage) sans aucun mécanisme de coordination — cette skill EST ce
mécanisme, invoquée délibérément plutôt que laissée à la redécouverte hasardeuse.

Racines des trois dépôts (à ajuster si déplacés) :
- projetx : `C:\dev\projetx`
- chrono-sabine : `C:\Users\pierr\Desktop\chrono-sabine`
- genliv : `C:\Users\pierr\Desktop\genliv`

## CONTRAINTE DE PÉRIMÈTRE CRITIQUE

Comparer **uniquement les outils, les conventions de lint/test, les schémas de spec, la conception
des gates CI, et la rigueur de process** — la connaissance d'ingénierie logicielle encodée dans les
fichiers `.claude/` et CLAUDE.md/`SKILL.md` de chaque dépôt. Ne jamais recommander de porter une
fonctionnalité produit/métier d'un projet à l'autre : ce sont trois produits sans rapport (PWA
todo/productivité, PWA de suivi de séances, outil d'écriture de livre-jeu) qui partagent une
méthodologie de développement, pas une filiation produit. Toute sortie de panel qui nomme une
fonctionnalité à porter est hors périmètre — l'écarter avant la synthèse, ne pas la replier dans le
backlog.

## Quand l'invoquer

- Périodiquement, par exemple à l'occasion d'un audit mensuel de santé des features — pas à chaque
  commit, pas via un cron automatisé. Le §6 (Gouvernance) de `plan-global.md` est explicite : pas
  de nouvel outillage cross-repo automatisé ; cette skill reste un contrôle délibérément rare,
  invoqué à la main (~400k tokens mesurés pour le premier passage complet, 2026-08-12).
- Quand l'outillage `.claude/` ou le CLAUDE.md d'un dépôt change d'une façon qui pourrait intéresser
  les deux autres (nouvelle conception de gate, nouvelle règle de lint, changement de schéma).
- **Quand le profil de risque d'un projet change matériellement** — par exemple en gagnant des
  données synchronisées dans le cloud ou un pipeline CI/CD déclenché par les push distants. Cas
  réel et daté : chrono-sabine et genliv migrent leur synchro de données vers Cloudflare et auront
  bientôt des builds Cloudflare déclenchés au push (noté le 2026-08-13) — c'est le moment où le
  raisonnement du §4 de `plan-global.md` (« la profondeur CI/E2E/audit reste proportionnée au
  risque, et projetx est aujourd'hui seul à porter un risque Worker + synchro cloud ») cesse de
  tenir pour les deux autres. Relancer cet audit quand ça arrive, en particulier pour rouvrir la
  question du portage du gate de pre-commit A1 (actuellement différée au §5) — un push cassé
  signifie désormais un build distant gâché ou cassé, ce qui est une raison plus forte d'avoir le
  gate plus tôt que « une fois A1 bloquant et éprouvé côté projetx ».
- L'utilisateur demande explicitement une comparaison de pratiques entre les trois projets.

## Comment l'exécuter

1. Lire en entier le CLAUDE.md de ce dépôt et ses `.claude/skills/*/SKILL.md`. Survoler (pas
   exhaustif) les équivalents des deux autres dépôts aux chemins ci-dessus.
2. Lire le `plan-global.md` le plus récent (doit exister aux trois racines et rester réconcilié —
   si les trois copies ont divergé, cette divergence est elle-même un constat à rapporter, pas à
   écraser silencieusement).
3. Lancer un panel à 4 rôles en parallèle — Produit, UX, Tech, QA — même schéma que le passage du
   2026-08-12 : chaque agent reçoit la CONTRAINTE DE PÉRIMÈTRE CRITIQUE ci-dessus mot pour mot, un
   accès en lecture aux trois racines de dépôt, et doit citer des preuves concrètes `fichier:ligne`
   par constat, pas des impressions. Modèle économique pour les rôles de largeur seule, modèle plus
   fort pour Tech (même logique de gradation que le comité `raffinage-iteration`).
4. Synthétiser dans la structure existante de `plan-global.md` : §1 raisonnement, §2 socle commun,
   §3 convergence par sujet (tableau best-of-3 avec fichier:ligne), §4 exceptions explicites, §5
   exécution (qui porte quoi, où — noter que cette skill/session n'a un accès en écriture qu'au
   dépôt depuis lequel elle tourne ; porter dans un autre dépôt nécessite soit une instruction
   cross-repo explicite de l'utilisateur, soit un prompt de reprise pour une session ouverte
   là-bas), §6 gouvernance.
5. Écrire/mettre à jour `plan-global.md` à chaque racine de dépôt dont le contenu a changé — garder
   les trois copies identiques (c'est un document cross-repo) ; un backlog propre à un dépôt (comme
   le `plan-v4.md` de projetx) reste local au dépôt concerné, jamais dupliqué dans les deux autres.
6. **Ne pas exécuter automatiquement le backlog obtenu.** Cette skill est feedback + planification
   seulement. Coder un item de backlog est une demande séparée et explicite, par item.

## Critère d'acceptation

- [ ] Aucun constat ne recommande de porter une fonctionnalité produit/métier entre les trois projets.
- [ ] Chaque constat cite une preuve `fichier:ligne` dans au moins un des trois dépôts.
- [ ] `plan-global.md` est identique (ou sa divergence est explicitement rapportée) sur les trois dépôts après l'audit.
- [ ] Les items de backlog propres à un dépôt restent dans le dépôt concerné.
- [ ] Si l'invocation vient d'un changement de profil de risque (ex. le déclencheur Cloudflare
      ci-dessus), le déclencheur et ce qu'il invalide dans le `plan-global.md` précédent sont nommés
      explicitement, pas juste repliés en silence dans un tableau mis à jour.
