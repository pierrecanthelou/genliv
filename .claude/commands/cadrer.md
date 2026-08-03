---
description: Fait produire par le comité le specification.json d'une NOUVELLE feature — plan, contrats, critères, découpage en itérations verticales.
argument-hint: <nom-de-feature> "<intention en une phrase>"
---

Cadrage de la feature **$1**. Elle n'existe pas encore : tu produis son `features/$1/specification.json`, pas un plan d'itération.

Charge la skill `raffinage-iteration`. Le rituel est le même — trois tours, veto cadré, registre — mais la sortie change : ici le comité découpe **en itérations**, il n'en raffine aucune.

## Étape 0 — cadrage
Lis `CLAUDE.md`, `docs/ROADMAP-BASCULE-IA.md` (l'ordre des features, la carte de ce qui survit, et ce qui est laissé debout pour être remplacé), les `specification.json` voisines (pour le format et le ton), et la section du plan de cible qui décrit cette feature (`docs/PLAN-BASCULE-IA.dc.html`). Résume en 10 lignes : l'intention `$2`, ce qui existe déjà et sera réutilisé, ce qui sera remplacé, les features voisines impactées.

Composition : les quatre rôles socles, **plus `narratif-ia`** si la feature touche le dossier d'aventure, le moteur, les prompts ou le mode jeu.

## Étapes 1 à 3 — les trois tours
Identiques à `/raffiner`. Ce que chaque rôle instruit ici :
- **PM** — l'intention tient-elle en une phrase ; le **découpage en itérations verticales** (c'est sa sortie principale) ; ce qui est hors périmètre de la feature entière ; où elle se place dans l'ordre de construction.
- **Tech Lead** — les contrats `brain/` créés ou consommés ; ce qui casse dans les features existantes ; l'ordre imposé par les dépendances.
- **UX** — les surfaces touchées, les composants du système réutilisés, ceux qui manquent ; les deux registres de langue.
- **QA** — les critères d'acceptation de la feature, les risques connus (nouveaux `KR-xxx`, numérotés à la suite de l'existant), les cas limites.
- **Narratif & IA** — la frontière code/IA, le contrat de sortie du modèle, le budget de contexte, les identifiants stables.

## Étape 4 — le découpage, la partie qui compte
Chaque itération est une **tranche verticale démontrable en une phrase sans « et »**. La n°1 est le squelette : la plus fine tranche qui traverse tout, câblée à travers `brain/`.

Contrôles :
- **3 à 6 itérations.** Moins, la feature est mal vue ; plus, ce sont deux features — propose la coupe.
- chaque itération a un `goal` d'une à deux phrases, autoportant, lisible sans le reste ;
- l'ordre suit les dépendances réelles, pas la logique de présentation ;
- aucune itération ne mélange « faire marcher » et « durcir ».

## Étape 5 — écriture
Écris `features/$1/specification.json` au format exact des specs existantes : `feature`, `created_at`, `status: "planned"`, `design_reference`, puis `plan` { `goal`, `design_contract`, `acceptance_criteria`, `brain_contracts`, `walking_skeleton`, `n`, `iterations[]`, `known_risks` } et `implementation` { `iterations_log: []`, `resolved_decisions`, `open_questions` }.

Les arbitrages `REJETÉ` du registre vont dans `resolved_decisions` — c'est ce qui évite de rejouer le débat à chaque itération. Les `REPORTÉ` vont dans `open_questions`.

Si le cadrage déplace une feature dans l'ordre, ou change son nombre d'itérations, répercute-le dans le tableau de `docs/ROADMAP-BASCULE-IA.md` (§ 2 pour le Temps 1, § 3 pour le Temps 2).

## Étape 6 — porte, puis toi
Arrête-toi et affiche : l'intention en une phrase, la liste des itérations (numéro + phrase de démo), les contrats `brain/` nouveaux, ce qui casse dans l'existant, les `KR` créés. Attends validation avant d'écrire quoi que ce soit dans le dépôt.

Une fois validé : `/raffiner $1 1`.
