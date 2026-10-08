# Revue d'itération — `dossier-repetition` · itération `2`

> Date : 2026-10-08
> Verdict QA mode B : **CONFORME**
> Porte qualité : `tsc` vert · `jest` 163 suites / 3032 tests · ESLint vert · Prettier vert
> Score de mutation : **non requis** (aucun des 4 fichiers mutés touché)

## Ce que l'auteur peut faire maintenant

L'auteur voit son joueur synthétique **affronter les combats** de son aventure au lieu de s'y arrêter — mort, combat sans issue, ou survie et poursuite du parcours.

## Critères — 8/8 VÉRIFIÉS

| # | Critère | Preuve | Statut |
|---|---------|--------|--------|
| 1 | `MotifArret` ∉ `combat_ouvert` | `repeter.ts:43` — union `'fin' \| 'impasse' \| 'mort' \| 'combat_sans_issue' \| 'pas_max'` | VÉRIFIÉ |
| 2 | Mort → `arret: 'mort'`, `cloreCombat` non appelé | `repeter.ts:236-247` + test `mort_ne_clot_pas` | VÉRIFIÉ |
| 3 | `ROUNDS_MAX` postures exactes, mutant ±1 rouge | `repeter.ts:207-210` + test `combat_sans_issue` | VÉRIFIÉ |
| 4 | Survie → `cloreCombat` + `combats_traverses++` | `repeter.ts:250-252` + test `survie_et_suite` | VÉRIFIÉ |
| 5 | `finAtteinte` après combat, pas pendant (KR-303) | `repeter.ts:254-268` + test `combat_puis_fin_meme_pas` | VÉRIFIÉ |
| 6 | `combats_traverses` dans le rapport | `repeter.ts:51` type + l.163 init | VÉRIFIÉ |
| 7 | Monstre via `BESTIARY_BY_TEMPLATE` + switch exhaustif `default: never` | `PanneauRepetition.tsx:178-180, 237-240` | VÉRIFIÉ |
| 8 | Déterminisme (même graine = même rapport) | Test `integration_deterministe` ×10 graines | VÉRIFIÉ |

## Diff par lot

### Lot 1 — `boucle-combat` (unique)

| Fichier | Action | Résumé |
|---------|--------|--------|
| `src/features/dossier-repetition/utils/repeter.ts` | R | Boucle combat (`ROUNDS_MAX=50`, `jouerPosture` × N, `rejouerCombat` en un coup), `MotifArret` enrichi `mort`/`combat_sans_issue`, `combat_ouvert` supprimé, `combats_traverses` dans le rapport |
| `src/features/dossier-repetition/components/PanneauRepetition.tsx` | R | Switch exhaustif `default: never` sur 5 motifs, nom du monstre résolu via `BESTIARY_BY_TEMPLATE`, `ROUNDS_MAX` importé (pas hardcodé), mort en `--text-strong` |
| `src/features/dossier-repetition/tests/repeter.test.ts` | R | 5 tests combat ajoutés : `mort_ne_clot_pas`, `combat_sans_issue`, `survie_et_suite`, `combat_puis_fin_meme_pas`, `rejeu_refuse` |
| `src/features/dossier-repetition/tests/panneauRepetition.test.tsx` | R | Tests `combat_ouvert` réécrits en `mort` et `combat_sans_issue`, mock enrichi (`ROUNDS_MAX`, `BESTIARY_BY_TEMPLATE`) |
| `src/features/dossier-repetition/tests/repeterCombat.integration.test.ts` | N | 2 tests intégration moteur réel : déterminisme ×10 graines, rejeu-en-un-coup = pas-à-pas |

## Ce qui a été refusé

| # | Désaccord | Statut | Motif |
|---|-----------|--------|-------|
| 3 | Badge `combats_gagnes` visible en it2 | REJETÉ | L'entier `combats_traverses` est dans le rapport ; le Badge visible est reporté à it3 (dépliable des pas). PM seul contre TL+UX+NIA. |
| 12 | SACRIFIABLE resserré à L1 (étalon) | REPORTÉ | L'étalon étant reporté, SACRIFIABLE reste sur it2 entière. |

## Ce qui a été reporté

| # | Report | Destination |
|---|--------|-------------|
| 1 | Héros étalon (section REGLES-DU-JEU.md, table dorée, `etalon.ts`) | Itération future. KR-130 (doc → test → code) migre avec. |
| 10 | Stats étalon non écrites dans le doc | Migre avec l'étalon. |
| 12 | SACRIFIABLE resserré à L1 | Report avec l'étalon. |

## Écarts assumés

Aucun écart par rapport au plan.

## Porte qualité

- **tsc --noEmit** : vert
- **jest** : 163 suites, 3032 tests, 0 échec
- **ESLint** : vert
- **Prettier** : vert
- **Score de mutation** : non requis (aucun fichier muté touché)

## RETOUR-COMITÉ

- Le lot unique a simplifié l'exécution — pas de worktree, pas de fusion, pas d'intégration.
- L'agent dev-lot a livré le code fonctionnel mais a laissé trois défauts post-agent : hardcoded `50` au lieu de `ROUNDS_MAX`, import manquant, et `eslint-disable-next-line` sur le `default` case. Tous corrigés avant la QA.
- Le mock du test panneau doit toujours exporter les constantes utilisées dans le composant (`ROUNDS_MAX`), pas seulement les fonctions.
- L'architecture rejeu-en-un-coup (TL) a tenu : O(N) confirmé par le test d'intégration `rejeu_en_un_coup_equivaut_au_pas_a_pas`.
