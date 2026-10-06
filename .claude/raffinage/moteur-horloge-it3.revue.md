# Revue d'itération — `moteur-horloge` · itération `3`

> Date : 2026-10-06
> Essaim : 2 lots `contrat` séquentiels, sans worktree

## En une ligne

L'auteur lit qu'un PNJ coincé trop longtemps à une étape change d'approche.

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---------|--------|--------|
| 1 | Ligne journal `etape_bloquee : <id> <k+1>` au pas d'échéance, `role: 'moteur'`, même sans `si_bloque` | VÉRIFIÉ | `horloge.test.ts:416` journal-etape-bloquee, `:440` journal-meme-sans-si-bloque |
| 2 | PNJ bloqué + perceptible + `si_bloque` rédigé → ligne repliée dans PENDANT CE TEMPS | VÉRIFIÉ | `contexte.test.ts:3904` pnj-bloque-present-si-bloque |
| 3 | Déclencheur vrai + échéance au même pas → avancement seul, pas de constat | VÉRIFIÉ | `blocage.test.ts:310` avancement-emporte-blocage |
| 4 | `etape_plan` absent ou `{rang: 0}` sans `depuis` → origine 0, blocage possible | VÉRIFIÉ | `blocage.test.ts:159` absent-ou-rang0-sans-depuis-origine-0 |
| 5 | `{rang ≥ 1}` sans `depuis` → jamais en échéance | VÉRIFIÉ | `blocage.test.ts:184` rang-ge1-sans-depuis-jamais |
| 6 | `.duree` : seul `blocage.ts` le lit dans `brain/` (KR-246) | VÉRIFIÉ | `blocage.test.ts:393` garde source |
| 7 | `horloge.ts` ne lit ni `.duree` ni `.depuis` | VÉRIFIÉ | `horloge.test.ts:1086` garde source |
| 8 | Budget M mesuré → `BUDGET_CARACTERES_DOSSIER` ajusté (M=2371 > 2333) | VÉRIFIÉ | `contexte.test.ts:3023` pireCasNarrateur, `frontiere.test.ts:1320` pins |

## Diff par lot

### L1 — `L1-moteur-blocage` (contrat)

| Prévu | Réel | Écart |
|-------|------|-------|
| N `src/brain/dossier/blocage.ts` | ✓ | — |
| N `src/brain/dossier/blocage.test.ts` | ✓ | — |
| R `src/brain/dossier/horloge.ts` | ✓ | — |
| R `src/brain/dossier/horloge.test.ts` | ✓ | — |
| R `src/brain/dossier/evaluate.test.ts` | ✓ | — |
| R `src/brain/dossier/faits.ts` | ✓ | — |
| R `docs/REGLES-PLAY.md` | ✓ | Réécrite EN PREMIER |
| R tests rouges de la sonde | ✓ | 4 fichiers : `recit.test.ts`, `commandes.test.ts`, `contexte.test.ts`, `jalonAuJournal.test.tsx` |

### L2 — `L2-narrateur-si-bloque` (contrat)

| Prévu | Réel | Écart |
|-------|------|-------|
| R `src/brain/copilote/contexte/horloge.ts` | ✓ | — |
| R `src/brain/copilote/contexte/narrateur.ts` | ✓ | — |
| R `src/brain/copilote/contexte.test.ts` | ✓ | — |
| R `worker/index.ts` | ✓ | Budget ajusté (M > 2333) |
| R `worker/frontiere.test.ts` | ✓ | Pins ajustées |

## Ce qui a été refusé

| # | Désaccord | Motif |
|---|-----------|-------|
| 16 | NIA O2 : `etape_plan` absent → origine 0 (stockée) | NIA l'a retirée — position TL adoptée : dériver sans stocker |
| 19 | TL annexe : invite du narrateur à amender | NIA tour 2 : « pas une dette, PENDANT CE TEMPS n'est cité par aucune invite » |

## Ce qui a été reporté

| # | Objet | Destination |
|---|-------|-------------|
| 18 | `replier` dupliqué → `noyau.ts` | Dette à déclencheur (un seul duplication, deux appelants) |
| 20 | Texte d'auteur peut contredire la présence statique | Limite d'écriture, à noter pour l'auteur — hors périmètre moteur |
| 21 | Libellé UX du champ `si_bloque` pour l'auteur | Feature `dossier-format`, pas le moteur |

## Écarts assumés

1. **Critère #6 — portée « du dépôt »** : le plan disait « seul `blocage.ts` le lit ». Mesuré : `validate.ts` lit `.duree` pour un avertissement `si_bloque` orphelin (pas une décision), et les panneaux d'édition dans `features/`. La garde teste `src/brain/` et attend exactement `['brain/dossier/blocage.ts', 'brain/dossier/validate.ts']`. Portée documentée dans J2.
2. **Test `etape-plan-meme-reference`** : étiqueté L1 dans le plan mais ciblait `contexte.test.ts` (L2). Logé dans `horloge.test.ts` (L1), là où est le tick. Pas dupliqué.
3. **Budget** : M=2371, les trois constantes ajustées — `BUDGET_CARACTERES_DOSSIER` 7000→8000, `BUDGET_CARACTERES_NARRATEUR` 28 056→29 056, `TAILLE_MAX_CORPS_IA` 87 040→90 112. Le palier dépend du nombre de lignes (5 PNJ pour franchir 2333, 4 restent sous).

## Blocages non résolus

Aucun.

## Porte qualité

| Outil | Résultat |
|-------|----------|
| Prettier | vert |
| `tsc --noEmit` | vert |
| ESLint | 0 erreur (1 warning préexistant hors périmètre) |
| Jest | 147 suites · 2806 tests · 0 échec |
| Mutation `brain/` | non requis (aucun des 4 fichiers touchés) |

## Docstrings corrigées à la marge

- `blocage.ts:9` — « l'assembleur du narrateur l'appellera » reste au futur, devenu présent. À corriger à l'étape Docs.
- `docs/REGLES-PLAY.md` J2 point 4 — « l'assembleur l'appellera (it3) » idem.

## RETOUR-COMITÉ

- Le découpage en 2 lots `contrat` séquentiels a bien fonctionné : L1 livre le prédicat, L2 le consomme, aucun conflit.
- La pré-étape « sonde jest » de L1 a détecté 4 fichiers rouges hors lot (fixture Corvin `duree: 2` produit un constat au pas 2), absorbés proprement.
- Le budget conditionnel (« mesurer M, ajuster si > 2333 ») a demandé à L2 de toucher `worker/` — la sortie conditionnelle du fichier a bien fonctionné comme mécanisme.
- La formule d'origine (rang 0 → 0, rang ≥ 1 sans `depuis` → jamais) est la plus délicate : elle résout PM O3 (Sélène/Corvin atteignables) sans violer le contrat it2 (pas de `depuis` inventé). Le prédicat est pur, total, et ne stocke rien.
