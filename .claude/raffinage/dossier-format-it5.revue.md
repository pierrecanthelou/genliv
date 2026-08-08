# Revue d'itération — `dossier-format` · itération 5 (dernière de la feature)

**En une ligne** : l'auteur peut désormais partir d'un dossier de référence complet et jouable (six personnages, cinq lieux, deux fins, deux jalons, deux événements) — un fichier réel qu'il peut importer tel quel — plutôt que d'une page blanche ; sa suffisance narrative est prouvée par une checklist à sept branches nommées, jamais par un contrôle à l'œil.

## Critères d'acceptation (plan § 6)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | `validateDossier(reference)` → `ok:true, errors:[], warnings:[]` | **VÉRIFIÉ** | test `le dossier de reference valide sans erreur ni avertissement`, `suffisance.test.ts` |
| 2 | Les sept branches de la checklist de suffisance, chacune non vide, échec par NOM | **VÉRIFIÉ** | test agrégat `chaque branche de la checklist de suffisance est non vide` + 7 tests unitaires dédiés, `suffisance.test.ts` — discriminance vérifiée par l'ouvrier via une sonde jetable (chaque branche bascule à `false` quand sa preuve narrative est retirée) |
| 3 | Aucune clé JSON en trop face à `dossier-minimal.json` | **VÉRIFIÉ** | test `aucune cle en trop face a dossier-minimal` |
| 4 | Clôture des sites de deltas = `CHEMINS_DE_DELTAS.length` | **VÉRIFIÉ** | test `le compte de sites de deltas parcourus egale CHEMINS_DE_DELTAS.length`, avec assertion discriminante que le seul chemin exclu est `climat[].effets_regles` |
| 5 | Round-trip import/export, deep-equal | **VÉRIFIÉ** | test `le dossier de reference traverse import puis export intact` via `DossierService.importDossier`/`.exportDossier` |

Les 5 critères sont vérifiés, tous par un test `brain/` qui lit le fichier réel — aucun n'est prouvé par l'affordance d'import (KR-156).

## Diff par lot

**Lot 1 — `dossier-reference`** (seul lot du plan, aucun lot `contrat`) :

| Fichier | Attendu (plan § 5) | Livré |
|---|---|---|
| `src/brain/dossier/__fixtures__/dossier-reference.json` | N | conforme |
| `src/brain/dossier/suffisance.test.ts` | N | conforme (12 tests : 1 validation + 1 agrégat + 7 unitaires par branche + 3 contrat) |
| `src/features/dossier-format/specification.json` | R | conforme — `status` → `done`, `iterations_log[5]` ajouté, critère 9 réécrit, `resolved_decisions`/`open_questions` mis à jour, compacté sous le plafond de budget |
| `docs/ROADMAP-BASCULE-IA.md` | R | conforme — colonne Statut `dossier-format` → `5/5 — terminée` |
| `CHANGELOG.md`, `README.md` | R | conformes |
| `features_history.json` | R | livré avec un écart assumé (voir ci-dessous) : scindé en `features_history.json` + `features_history.0.5.json` |
| `package.json` | R au plan, mais gelé par consigne | **non modifié**, comme demandé — le PATCH +1 attend l'approbation humaine finale |
| `bug_history.json`, `code-knowledge.json` | R conditionnels | non touchés — aucun défaut ni risque nouveau |

Aucun fichier de production `src/brain/dossier/*.ts` touché — vérifié par `git diff --stat` (intégrateur) et par le test de fermeture § critère 3/4.

Aucune collision de lots (lot unique) — pas de `RETOUR-COMITÉ` lié à une fusion.

## Ce qui a été refusé (registre des désaccords, plan § 8)

- **« scène figée » comme branche de la checklist** — `REJETÉ`. `texte_ouverture_joueur` est déjà obligatoire et déjà rempli par tout dossier valide : une assertion de non-vacuité ne discrimine rien. Sa propriété réelle (émission verbatim par le moteur) est un chemin de code, pas une valeur — elle attend son champ en n°10.
- **« antagoniste » requalifiée et gardée (proposition initiale du Tech Lead, tour 1)** — `REJETÉ` par arbitrage de l'orchestrateur au tour 3, malgré un flottement des notes du tour 2 (QA et Narratif avaient accepté la requalification avant de voir la rétractation du Tech Lead dans sa propre note). Le proxy disponible (`objectifs[].echoue_si_expr` référençant un personnage) teste une co-occurrence, pas un antagonisme — même défaut que « scène figée », purgé par cohérence. Remplacée par une branche `certitude`.
- **Téléchargement / export en it5** — `REJETÉ` de cette itération (reporté n°2). Aucune surface de l'éditeur ne liste les dossiers ; l'ajouter aurait inventé un écran (KR-156).

## Ce qui a été reporté

- **Téléchargement (export JSON)** → n°2, clôturé par une entrée `resolved_decisions` explicite plutôt qu'un troisième silence — le contrat de design (bouton, texte « Télécharger le fichier », patron `retryButtonStyle`) est déjà écrit par avance dans le plan § 3.
- **« antagoniste » et « relation secrète » comme concepts de personnages** (`camp`, `relations[].secret`) → n°4 (`dossier-fiches`), même destination que `contre_mesures`. Nouvelle entrée `open_questions` posée pour que n°4 les instancie si pertinent.
- **« scène figée »** → n°10, confirmé. L'ancien texte de l'`open_question` qui affirmait « le format porte un texte et un drapeau » était faux (aucun drapeau dans `types.ts`) — corrigé dans ce lot.
- **Plafond agrégé de mots injectables (`budget-injectable`)** → n°9/n°10, sans propriétaire avant l'assembleur de contexte. Remplacé par une simple ligne de mesure, sans code : voir Porte qualité ci-dessous.

## Écarts assumés

1. **`specification.json` compacté au-delà de ce que demandait explicitement le plan** : l'ouvrier a réduit plusieurs `resolved_decisions` d'it2/it3/it4 (déjà closes, dont le raisonnement complet vit dans les `.revue.md` déjà cités ou dans les docstrings de production de `deltas.ts`/`predicates.ts`/`tables.ts`) à leur phrase d'arbitrage. Motif : le fichier talonnait son plafond de budget de contexte (`docs/WORKFLOW.md` § Budget de contexte) et l'ajout des entrées d'it5 l'aurait franchi. Fichier final : **66 346 / 66 560 o**, sous le plafond. Assumé conforme à la doctrine de compaction (« une `resolved_decisions` dont le code est livré ET dont la revue porte le raisonnement se réduit à sa phrase d'arbitrage »).
2. **`features_history.json` scindé en deux fichiers** (`features_history.json` + `features_history.0.5.json`, nouveau) — conséquence mécanique du même dépassement de plafond, au patron déjà appliqué à `bug_history.json` le 2026-08-06. Vérifié par l'intégrateur : les 14 features de l'ère 0.5 sont retrouvées byte-identiques dans le fichier scindé. **Non reporté dans le tableau `docs/WORKFLOW.md` § Budget de contexte** (pas de ligne « FAIT le … » comme pour `bug_history.json`) — à faire au prochain lot qui touche ce fichier, signalé par l'intégrateur.
3. **`docs/ROADMAP-BASCULE-IA.md` § 1 ter** : une affirmation périmée corrigée en passant par l'ouvrier (`download.ts` n'est *pas* repris par la n°1 — décision close en it5, reportée n°2), hors de la seule consigne « colonne Statut ». Changement mineur, cohérent avec la clôture de la question téléchargement.

Aucun `BLOCAGE` remonté par l'ouvrier. Deux écarts de définition de fini relevés par l'intégrateur (fichier de revue manquant, critère 9 périmé au cadrage, `status` de la spec resté `in-progress`) — **tous corrigés dans ce même lot, par l'orchestrateur**, avant clôture : voir la section « Critères » ci-dessus et le diff de `specification.json`.

## Porte qualité

- Prettier → `tsc --noEmit` → `npm run lint` → `jest` complet : **vert**. **50 suites / 728 tests** (49/716 avant l'itération) — +1 suite, +12 tests.
- `npm run test:mutation` — **sans objet** (KR-161, aucun des 4 fichiers mutés touché), vérifié par `git diff --stat`.
- **Ligne de revue demandée par le narratif (plan § 7/§ 10), sans plafond posé** — nombre de mots mesurés dans le dossier de référence :
  - `canon.mj.synopsis_mj` : **113 mots**
  - `canon.partage.accroche_joueur` : **22 mots**
  - `charpente.jalons[].enonce_texte` : **16 et 13 mots** (budget nommé : `BUDGET_MOTS_JALON` = 20)
  - Ces chiffres sont cités tels quels, sans jugement : aucun assembleur de contexte n'existe avant la n°9/10, donc aucun plafond agrégé n'est posé ici (cf. `open_questions`, propriétaire n°9/10).

## RETOUR-COMITÉ

- **La discipline « deux fixtures, pas une »**, tranchée par le Tech Lead au tour 2, a payé : le lot n'a touché aucun des sept fichiers de test qui lisent `dossier-minimal.json`, et aucun fichier de production `brain/dossier/*.ts`. Pour une itération de contenu pur, séparer la fixture d'exemple minimal (sujet du balayage de corruption) de la fixture de démonstration évite une explosion combinatoire du balayage existant — motif à retenir pour toute future itération qui enrichit un dossier d'exemple plutôt que le schéma.
- **La checklist de suffisance elle-même a été le lieu du vrai travail de raffinage**, pas le code : sur les neuf branches proposées au cadrage initial (2026-08-03), trois se sont révélées sans ancrage dans le schéma réellement livré (purge du même patron qu'it3/it4). Le signal à généraliser : toute checklist narrative écrite AVANT que le schéma d'une entité soit complet (ici, `personnages[]` avant sa forme complète en n°4) doit être revérifiée branche par branche au raffinage de l'itération qui l'exécute, jamais recopiée telle quelle du cadrage.
- **Un désaccord tranché contre la lettre des notes de deux rôles sur trois** (antagoniste, § 8 désaccord 3) parce que leurs positions du tour 2 répondaient à une version du Tech Lead qu'il avait lui-même rétractée dans la même note — un artefact du fonctionnement en parallèle sans second échange entre pairs. À surveiller pour les itérations à cinq rôles : un tour 2 qui voit un rôle changer radicalement de position en cours de note peut laisser les autres répondre à une prémisse déjà caduque.
- **La compaction de `specification.json` prescrite par le plan a débordé sur des entrées d'it2-it4** que le lot ne devait pas toucher a priori — c'est resté dans l'esprit de la doctrine (raisonnement déjà ailleurs), mais un futur plan devrait soit l'anticiper explicitement dans sa liste de fichiers (`specification.json` était déjà listé, donc pas un incident de propriété), soit confier la compaction à un test de budget qui échoue AVANT l'ajout plutôt qu'après — pour que l'ouvrier n'ait pas à juger seul quelles entrées historiques compacter.
- **`docs/WORKFLOW.md` § Budget de contexte** n'a pas reçu la ligne « FAIT » pour le split de `features_history.json` (contrairement au split de `bug_history.json` documenté le 2026-08-06) — dette mineure à lever au prochain lot qui touche ce tableau.

---

**Feature `dossier-format` terminée (5/5)** — voir `docs/ROADMAP-BASCULE-IA.md`. La feature n°2 `bascule-editeur` prend le relais ; son cadrage lira ce dossier de revue et les `resolved_decisions`/`open_questions` accumulées ici.
