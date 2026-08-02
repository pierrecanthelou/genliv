---
description: Exécute un plan d'itération approuvé avec un essaim d'agents de développement, un par lot, puis intègre et fait vérifier.
argument-hint: <feature> <numéro d'itération>
---

Exécution du plan `.claude/raffinage/$1-it$2.plan.md`.

## Étape 0 — refus si le plan n'est pas exécutable
Lis le plan. Arrête-toi si :
- il n'est pas marqué **validé** (la porte 2, humaine, n'a pas été franchie) ;
- il contient un bloc `ESCALADE` non résolu ;
- deux lots nomment le même fichier ;
- il dépasse 4 lots ou 8 critères ;
- un lot n'a pas de critères observables ou pas de signature déclarée.

Ne « répare » pas le plan toi-même : renvoie-le à `/raffiner`.

## Étape 1 — le contrat d'abord
S'il existe un lot marqué `contrat` (il touche `brain/` ou un contrat de sortie IA), lance-le **seul** avec `dev-contrat` — pas `dev-lot` — sur la branche d'itération. C'est le poste à effort élevé du pipeline : ce qu'il écrit sera consommé par des agents qui ne pourront plus le questionner.

Attends sa porte qualité verte. Rien d'autre ne démarre avant. Transmets ensuite son compte rendu (signature réellement livrée) à chaque ouvrier de l'étape 2.

## Étape 2 — séquentiel par défaut, essaim si le plan le justifie

Compte les lots restants après le contrat.

- **1 ou 2 lots → un seul `dev-lot`, en séquence.** C'est le cas courant sur ce codebase, et c'est très bien : pas de worktree, pas de fusion, pas de blocage croisé. Le parallélisme ne se paie que s'il y a de quoi paralléliser.
- **3 lots ou plus → essaim.** Un worktree git par lot, puis **en une seule fois** un subagent `dev-lot` par lot. Chacun reçoit : le chemin du plan, son identifiant de lot, son worktree, le compte rendu du lot contrat.

**Quatre ouvriers au maximum.** Au-delà, deux vagues : le coût de fusion et de blocages croisés dépasse le gain. L'effort se met dans le découpage et le contrat, pas dans le nombre d'ouvriers.

Tu **ne relaies aucun message entre les agents**. S'ils ont besoin de se parler, le découpage est faux — consigne-le pour le comité.

## Étape 3 — blocages
Un `BLOCAGE` remonté par un `dev-lot` ne se contourne pas en élargissant son périmètre. Tu le mets de côté, tu laisses les autres finir, puis tu le traites au niveau du plan : soit un autre lot le prend, soit ça repart au comité.

## Étape 4 — intégration
Lance `integrateur` : contrôle de propriété des fichiers, fusion dans l'ordre, porte qualité globale.

## Étape 5 — vérification
Lance `qa` en **mode B**, avec un contexte neuf : plan + diff, critère par critère, invariants transverses, respect des périmètres de lots, et le score de mutation sur `src/brain/` si l'itération y a touché.

## Étape 6 — dossier de revue
Écris `.claude/raffinage/$1-it$2.revue.md` et affiche-le :

- **En une ligne** : ce que l'auteur peut faire maintenant qu'il ne pouvait pas.
- **Critères** : chacun, `VÉRIFIÉ` avec sa preuve ou `NON VÉRIFIÉ` avec ce qui manque.
- **Diff par lot** : fichiers touchés, à comparer à la liste du plan.
- **Ce qui a été refusé** : les `REJETÉ` du registre, avec leur motif — c'est ce qu'un relecteur ne peut pas deviner du diff.
- **Ce qui a été reporté** : les `REPORTÉ`, et où ils sont partis.
- **Écarts assumés** et blocages non résolus.
- **Porte qualité** : jest, mutation `brain/` — vert/rouge, chiffres.
- **`RETOUR-COMITÉ`** : ce que ce découpage a appris pour l'itération suivante.

Reporte enfin le résultat dans `features/$1/specification.json` → `implementation.iterations_log`.
