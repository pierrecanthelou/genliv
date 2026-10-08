---
description: Joue le protocole de playtest réel — les résidus « non exécutable par jest » consignés par les specs du Temps 2, vérifiés en une session contre le dossier de référence, avec de vrais appels modèle.
argument-hint: (aucun)
model: sonnet
---

Protocole de playtest réel. **Ce n'est pas une itération produit** : rien ne se code ici — on observe le moteur avec de vrais appels modèle, et on consigne. Patron : l'ancienne commande `/outillage` (consommée, archivée dans `.claude/raffinage/archive-commande-outillage.md`).

## Préalables

- Worker déployé et secrets IA posés (`docs/IA-SETUP.md`) ; l'éditeur branché (URL du worker + clé de synchro).
- Le dossier de référence (`dossier-reference.json`) importé et **jouable** (panneau Contrôles sans bloquant).

## Étape 1 — collecte des résidus

Grep `playtest` et `non exécutable par jest` / `non executable` dans `src/features/*/specification.json` (`implementation.open_questions`). Plancher mesuré au ménage du 2026-10-08 — complète depuis les specs, cette liste n'est pas la vérité :

- `moteur-arbitre` — R2 produit-il des propositions carac/TC cohérentes sans voir la fiche du héros ? R3 raconte-t-il un gain quand la ligne CE PAS affiche « aucun changement » ?
- `moteur-acteurs` — R4 tient-il sa fiche (rien hors de ses `savoirs`, jamais hors de son `jamais`) au-delà de la fenêtre K=4 ? La branche `{precision}` se déclenche-t-elle sur deux PNJ proches ? Un rang offert dans « CE QUE TU PEUX CONFIER » est-il réellement cité/confié ?
- `moteur-interprete` — le récit d'`agir` tient-il la promesse du goal malgré KR-262 (zéro nom injecté) ? La condensation de mémoire échoue-t-elle en série (trou silencieux au-delà de la fenêtre) ? Résidu P4 : le modèle conclut-il à une absence depuis le seul bloc EN SA POSSESSION dégradé ?

## Étape 2 — la session

Une partie réelle (~20 pas) sur le dossier de référence. D'abord `dossier-repetition` (n° 16) pour vérifier le squelette sans IA, puis la partie réelle pour les rôles R1–R5. Pour chaque résidu : `OBSERVÉ CONFORME` / `OBSERVÉ NON CONFORME` (verbatim du modèle à l'appui) / `NON PROVOQUÉ` (et pourquoi).

## Étape 3 — consignation

Écris `.claude/raffinage/playtest-<AAAA-MM-JJ>.md` : résidu par résidu, verdict + verbatim. Puis mets à jour chaque `open_questions` concernée : un résidu `OBSERVÉ CONFORME` **se ferme** (en citant le relevé de playtest), un `NON CONFORME` devient un bug (`bug_history.<feature>.json`) ou une dette à déclencheur nommée. Rien ne reste « à vérifier avant le prochain playtest » **après** un playtest.

## Étape 4 — stop

Présente le relevé à l'utilisateur. Aucun correctif ne part sans son go — un défaut de prose modèle peut relever de l'invite (`worker/index.ts`), du contexte (l'assembleur) ou des règles (`docs/REGLES-PLAY.md`, KR-130) : c'est un cadrage, pas un hotfix.
