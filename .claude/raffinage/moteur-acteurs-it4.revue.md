# Revue d'itération — `moteur-acteurs` · itération `4`

> Date : 2026-10-04

**L'auteur peut voir son PNJ exiger un jet avant de confier ce qu'il sait.**

---

## Critères d'acceptation

| # | Critère | Verdict | Preuve |
|---|---------|---------|--------|
| 1 | § 6 décrit la porte `jet` (mise en jeu, challenge, XP, réussite, re-tentative) | **VÉRIFIÉ** | `docs/REGLES-DU-JEU.md` § 6 lignes 251–263 |
| 2 | `evaluerSavoir` rend `'sous_epreuve'` quand jet seule porte fermée | **VÉRIFIÉ** | `revelation.test.ts` — 10+ tests tri-état |
| 3 | R4 `resiste` → `CarteJet` affichée | **VÉRIFIÉ** | `useTourDeJeu.test.ts:1362` |
| 4 | CarteJet → lancer dé → `issueDuJet` + jet consigné + XP créditée | **VÉRIFIÉ** | `useTourDeJeu.test.ts:1450` |
| 5 | Jet réussi sans rang dû → rejet `rang-inconnu`, rejeu puis silence | **VÉRIFIÉ** | `schemaSortie.test.ts:1498` |
| 6 | Appel 2 avec `resiste` → rejet `schema` | **VÉRIFIÉ** | `schemaSortie.test.ts:1491` |
| 7 | `resiste` invalide → rejet, bannière d'échec IA | **VÉRIFIÉ** | `schemaSortie.test.ts:1484–1505` + `useTourDeJeu.test.ts:1100` |
| 8 | Contexte appel 1 : ni `formulation_joueur`/`verite` du savoir gardé ; `CE QUE TU GARDES` présent | **VÉRIFIÉ** | `acteur.test.ts:514` — 8 assertions d'étanchéité KR-229 |

**8/8 VÉRIFIÉS.**

---

## Diff par lot

### Lot A — `brain-acteur-jet` (contrat)

| Fichier | Rôle |
|---------|------|
| `docs/REGLES-DU-JEU.md` | § 6 porte `jet` |
| `src/brain/dossier/revelation.ts` + test | tri-état, `JetReussi`, `savoirSousEpreuve` |
| `src/brain/dossier/arbitre.ts` + test | `epreuvesReussies` |
| `src/brain/dossier/recit.ts` + test | re-vérification honore le jet |
| `src/brain/copilote/types.ts` | `CibleActeurResistible`, `ResistanceActeur` |
| `src/brain/copilote/schemaSortie.ts` + test | `validerEnjeux` extraite, forme B |
| `src/brain/copilote/contexte/acteur.ts` + test | `CE QUE TU GARDES`, `À L'INSTANT`, marque dû |
| `src/brain/CopiloteService.ts` + test | 11e surcharge, opt-in |
| `worker/index.ts` + tests + frontiere | gabarit 3 formes, budget remesuré |

17 fichiers — **conforme au plan.**

### Lot B — `cablage-jet-dialogue` (feature)

| Fichier | Rôle |
|---------|------|
| `src/features/play-mode/hooks/useTourDeJeu.ts` | flux R4→CarteJet→jet→R4 |
| `src/features/play-mode/hooks/useTourDeJeu.test.ts` | 6 tests ajoutés |

2 fichiers — **conforme au plan.**

---

## Ce qui a été refusé

| # | Désaccord | Statut | Motif |
|---|-----------|--------|-------|
| 10 | Fait persistant `EtatPnj` pour stocker la réussite (NIA) | `REJETÉ` | Dérivable stocké (KR-013). Réussite dérivée du journal par `epreuvesReussies`. TL veto, PM refuse. |
| 13 | Ligne d'issue via `AMORCE_ISSUE` du narrateur (NIA) | `REJETÉ` | « réussit » est un mot interdit de réplique (KR-270). Issue assemblée par le code avec un registre propre à R4. |
| 14 | Scission du lot A en A1/A2 (TL) | `REJETÉ` | Coupe crée une dépendance A2→A1 sur la signature de `evaluerSavoir`. 2 lots contrat séquentiels pour le même coût. |

## Ce qui a été reporté

| # | Désaccord | Destination |
|---|-----------|-------------|
| 11 | Ligne RÉCIT contextuelle avant la carte (UX obj 1) | Hors périmètre it4. Si la démo montre l'ambiguïté → it5. |
| 12 | Focus clavier retour après CarteJet (UX obj 3) | Dette à déclencheur. |

---

## Écarts assumés (lot A)

1. `savoirsRevelables` gagne un 4e paramètre optionnel `epreuves` (absent du § 4) — requis pour « savoir dû dans `CE QUE TU PEUX CONFIER` ».
2. `ContexteActeurRendu` gagne `rangDu?` et `epreuveGardee?` (le plan ne décrivait pas le retour).
3. `SortieActeurBrute` devient union de deux interfaces nommées (`RepliqueActeurBrute | ResistanceActeurBrute`).
4. Garde « sans héros » tenue par `assemblerActeur` (voit la session), pas par `savoirSousEpreuve` (voit `faits` seulement).
5. `carac`/`tc` de `ResistanceActeur` posés par le service depuis `revele_si.jet`, jamais par R4.
6. Marque « dû » = suffixe ` · dû` (5 chars, tient le budget : 110 ≤ 120).
7. `BUDGET_CARACTERES_ACTEUR` : 6220 → 6330 (terme dossier Harek = 789, palier inchangé 3000).
8. `npm run format` scopé aux fichiers du lot (le format global efface le timeout de `panneauPersonnages.test.tsx`, BUG-139/147).

## Blocages non résolus

Aucun.

---

## Porte qualité

| Instrument | Résultat |
|------------|----------|
| `tsc --noEmit` | **0 erreur** |
| ESLint | **0 erreur** (1 warning préexistant hors lot) |
| Jest | **2465 tests / 137 suites** (+96 tests, 0 échec) |
| Mutation | **non applicable** (aucun des 4 fichiers de règles touché) |

---

## RETOUR-COMITÉ

- Le **mode d'emploi** du lot contrat (§ 2 du rapport lot A) a épargné au lot B toute redécision : le hook n'appelle ni `savoirSousEpreuve` ni `epreuvesReussies` — le service s'en charge.
- **Budget de lignes** : `useTourDeJeu.ts` passe de ~454 à ~530 lignes (KR-112 signal à 400, bloquant à 800). La scission est portée par la feature n° 13.
- **Sondes de discriminance** : 22 mutants posés par le lot contrat, 22 tués — les écarts de la QA it2/it3 (`dossier-controles`) n'ont pas récidivé.
- **Fichiers > 800 lignes (préexistant)** : `schemaSortie.ts` (~1800), `CopiloteService.ts` (~1170), `worker/index.ts` (~1330). Dette technique de la dette B3, non traitée ici.
- L'invite du worker (3 formes, enjeux, issue) a été **rédigée par le lot contrat** faute de texte dans le plan — à relire en playtest (KR-229, la résistance hors sujet n'est pas constatable par jest).
