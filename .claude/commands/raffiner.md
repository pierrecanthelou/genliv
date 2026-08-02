---
description: Réunit le comité (PM, Tech Lead, UX, QA) pour raffiner une itération et produire un plan signé, découpé en lots.
argument-hint: <feature> <numéro d'itération>
---

Raffinage de l'itération **$2** de la feature **$1**.

Charge la skill `raffinage-iteration` et applique-la à la lettre. Tu es l'**orchestrateur** : tu ne prends aucun parti, tu es le seul à écrire.

## Étape 0 — cadrage, taille, composition
Lis `features/$1/specification.json` et extrais l'itération n°$2 (`plan.iterations[]`). Si elle n'existe pas, arrête-toi et dis-le.

**Contrôle de taille avant tout le reste.** Écris la phrase de démo : « à la fin de cette itération, l'auteur peut ___ ». Si elle contient un « et », si elle traverse plus d'une feature, ou si tu pressens plus de 4 lots — **ne raffine pas**. Découpe : propose N itérations numérotées, chacune une tranche verticale démontrable, dans l'ordre de construction, et demande à l'humain laquelle raffiner. Une itération mal dimensionnée ne se rattrape pas au raffinage.

Prépare ensuite un cadrage de 10 lignes maximum : le `goal` brut, la feature, les KR déjà connus, les `resolved_decisions` qui s'appliquent, les fichiers probablement concernés. Ce cadrage est envoyé identique à tous les rôles.

Décide enfin la **composition** : les quatre rôles socles, **plus `narratif-ia`** si l'itération touche le dossier d'aventure, le moteur, les prompts, la mémoire de session ou le mode jeu. Écris cette décision et son motif en tête du plan.

## Étape 1 — tour 1, en parallèle
Lance **en une seule fois** les subagents de la composition retenue avec le même cadrage. Ils ne se voient pas. Chacun rend `RISQUE / OBJECTION / PROPOSITION / VERDICT` (+ annexe pour `tech-lead`, `ux-designer`, `narratif-ia`).

Écris les quatre notes dans `.claude/raffinage/$1-it$2/tour1-<rôle>.md`.

Si un rôle rend une note **sans objection**, relance-le une fois en le lui disant.

## Étape 2 — tour 2, en parallèle
Relance les mêmes rôles avec **toutes les notes du tour 1**. Chacun doit répondre nommément à au moins une objection empiétant sur son domaine, puis statuer sur chacune de ses propres objections : retirée (motif) / maintenue / durcie en veto.

Écris dans `.claude/raffinage/$1-it$2/tour2-<rôle>.md`.

## Étape 3 — arbitrage
Toi seul tranches. Pour chaque désaccord ouvert : `RETENU` (avec le lot porteur) / `REJETÉ` (motif en une phrase) / `REPORTÉ` (vers où). Aucun désaccord sans statut.

Contrôles avant d'écrire :
- chaque veto est **dans le domaine** de son émetteur, sinon requalifie-le en objection ;
- au plus **une** proposition `INNOVATION` ;
- les lots ont des listes de fichiers **disjointes** — sinon renvoie le découpage au `tech-lead` (une seule fois) ;
- tout lot touchant `brain/` **ou un contrat de sortie IA** est marqué `contrat` et ordonné en premier ;
- il y a **1 à 4 lots** et **8 critères au plus** ; au-delà, l'itération est trop grosse — remonte une proposition de découpage, ne raffine pas un plan-fleuve ;
- chaque critère d'acceptation est `Étant donné / Quand / Alors` et observable.

Si un veto tient encore : écris un bloc `ESCALADE` en tête du plan (les deux options, leur coût, la recommandation de chaque rôle) et **arrête-toi**.

## Étape 4 — le plan
Écris `.claude/raffinage/$1-it$2.plan.md` en suivant exactement `templates/plan-iteration.md`.

## Étape 5 — porte 1, mécanique

Relis ton propre plan et vérifie mécaniquement. Une seule case rouge = tu réécris le plan, sans déranger personne.

- [ ] la phrase de démo tient en une phrase, **sans « et »**
- [ ] **1 à 4 lots** et **8 critères au plus** ; une seule feature touchée, hors lot `contrat`
- [ ] aucun bloc `ESCALADE`
- [ ] listes de fichiers **disjointes**, chaque fichier marqué (N) ou (R)
- [ ] tout lot touchant `brain/` ou un contrat de sortie IA est marqué `contrat` et ordonné en premier
- [ ] chaque lot déclare la signature exacte qu'il expose ou consomme
- [ ] chaque critère est `Étant donné / Quand / Alors`, avec son niveau de test
- [ ] chaque KR cité a un test nommé au § 7
- [ ] chaque texte visible par l'utilisateur (libellé, placeholder) est écrit dans le contrat de design
- [ ] chaque valeur visuelle est un token `--*` existant, aucune valeur en dur
- [ ] section « hors périmètre » non vide
- [ ] chaque désaccord a un statut

## Étape 6 — porte 2, humaine : tu t'arrêtes

Porte 1 verte, **arrête-toi et attends une validation explicite.** N'enchaîne pas sur `/essaim`. N'écris rien dans `features/$1/specification.json`.

Affiche uniquement la **fiche de validation** — elle doit se lire en deux minutes :

1. la phrase de démo ;
2. la tranche : ce qu'elle traverse, de l'écran jusqu'à la persistance ;
3. le tableau des lots (id, titre, nombre de fichiers, `contrat` ou non) ;
4. le hors-périmètre ;
5. les désaccords `REPORTÉ` et la proposition `INNOVATION` s'il y en a une ;
6. la ligne : « Plan écrit dans `.claude/raffinage/$1-it$2.plan.md`. Valide, ou dis ce qui doit changer. »

Un bloc `ESCALADE` court-circuite tout : remonte-le tel quel, avec les deux options et leur coût.

## Étape 7 — après validation
Marque le plan `validé`, reporte dans `features/$1/specification.json` (`goal` raffiné dans `plan.iterations[$2]`, arbitrages structurants dans `implementation.resolved_decisions`, reports dans `implementation.open_questions`), puis lance `/essaim $1 $2`.
