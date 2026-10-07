# Revue d'itération — `moteur-fins` · itération `4` (4/4)

> Date : 2026-10-07
> Verdict : **CONFORME — prêt pour la revue tech-lead**

## Ce que l'auteur peut faire maintenant

L'auteur peut relancer sa partie terminée (fin ou mort) avec les mêmes dés : le bouton « ↪ Rejouer — mêmes dés » ouvre une partie neuve qui reproduit les tirages de la précédente.

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---------|--------|--------|
| CA1 | Clic Rejouer → partie neuve + même graine, graine 0 valide | VÉRIFIÉ | `rejouer.test.tsx` intégration AiguillagePartie (jouer→fin→Rejouer→même graine, tirerGraine 1 appel), `rejouer.test.tsx` PartieDemarree (graine 0 → session.graine_alea === 0), `EcranFin.test.tsx` + `EcranMort.test.tsx` (bouton + appel), `mortDuHeros.test.tsx` (clic Rejouer → onRejouer(42)) |
| CA2 | Même graine = même pool de création (rollCreationPool toEqual), graine ≠ → pool ≠ (anti-vacuité), graine_alea immutable de ouvrirSession à fixerHeros | VÉRIFIÉ | `rejeuDeterministe.test.ts` : 5 tests purs (rollCreationPool toEqual sur creerRng identique, anti-vacuité sur 2 graines, graine_alea immutable, dossier immutable, Math.random zéro appel) |
| CA3 | Nouvelle partie après Rejouer → tirerGraine rappelée | VÉRIFIÉ | `rejouer.test.tsx` intégration AiguillagePartie (jouer→fin→Rejouer→créer héros→Nouvelle partie via dialogue→tirerGraine appelée 2 fois, graine non collante) |
| CA4 | moteurSansIA.test.ts vert, aucun champ ajouté, aucun fichier de règles touché | VÉRIFIÉ | 2990 tests / 158 suites verts, diff ne contient ni brain/ ni player/ ni rules |

## Diff par lot

### Lot 1 — `rejouer` (feature)

| Fichier | Plan | Réel | Lignes |
|---------|------|------|--------|
| `boutonSecondaire.ts` | N | N | 19 |
| `EcranFin.tsx` | R | R | 107 (était 79) |
| `EcranMort.tsx` | R | R | 106 (était 90) |
| `PartieEnCours.tsx` | R | R | 397 (était 382, < 400 KR-112) |
| `AiguillagePartie.tsx` | R | R | 134 (était 119) |
| `EcranFin.test.tsx` | R | R | 175 (était 119) |
| `EcranMort.test.tsx` | R | R | 99 (était 82) |
| `mortDuHeros.test.tsx` | R | R | 247 (était 201) |
| `rejeuDeterministe.test.ts` | N | N | 104 |
| `rejouer.test.tsx` | N | N | 259 |
| `specification.json` | hors lot (étape 7) | R | maj goal + arbitrages |

Aucun fichier hors liste.

## Ce qui a été refusé (registre § 8 du plan)

| # | Désaccord | Statut | Motif |
|---|-----------|--------|-------|
| 2 | Affichage GRAINE·{n} | REJETÉ | UX retire en T2 ; preuve = pool de dés de création |
| 4 | tabIndex journal EcranMort | REJETÉ | UX retire, TL refuse |
| 6 | :hover boutonSecondaire | REJETÉ | CSSProperties ne le permet pas ; dette |
| 8 | Barre d'actions commune | REJETÉ | UX retire, abstraction prématurée |
| 10 | « mêmes commandes relues » (QA) | REJETÉ | QA retire ; KR-248 (journal = constat) |
| 11 | EntreeJournal.test.ts | REJETÉ | decision_modele n'existe pas en code |
| 14 | 3 combats dans test pur | REJETÉ | 1 suffit, anti-vacuité par 2 graines |

## Ce qui a été reporté

| Destination | Report |
|-------------|--------|
| Ligne armée au roadmap | L2 docs EXIGENCE-APERCU-DU-JEU.md |
| Tranche outillage | 7 règles ESLint UX |
| Dette quand rouvert | maxWidth 480 en dur (EcranMort), border 1px (boutonPrimaire), :hover boutonSecondaire |

## Écarts assumés

- `PartieEnCours.tsx` à 397 lignes (cible 395, seuil KR-112 à 400) — +2 lignes par rapport au plan (handleRejouer). Marge de 3 avant blocage.

## Porte qualité

| Outil | Résultat |
|-------|----------|
| Prettier | vert |
| tsc --noEmit | vert (0 erreur) |
| ESLint | vert |
| jest | **2990 tests / 158 suites — 0 échec** |
| test:mutation | **non requis** (aucun des 4 fichiers de règles touché) |

## RETOUR-COMITÉ

- Un lot unique sans contrat est le cas idéal : pas de fusion, pas de blocage, pas de course. Le découpage du comité (TL : « un lot, zéro fichier brain/ ») était exact.
- Le budget de lignes PartieEnCours (381 → 397) montre que le prochain ajout à ce fichier déclenchera le split (KR-112). Candidat : extraction du bloc console + journal en composant dédié.
- Les tests couvrent l'injection de graine (graineImposee={0}, session persistée), le clic Rejouer→onRejouer(graine_alea), le texte d'aide, et le déterminisme pur via rollCreationPool. Deux tests d'intégration traversent AiguillagePartie de bout en bout (jouer→fin→Rejouer→même graine, jouer→fin→Rejouer→créer héros→Nouvelle partie→graine non collante).
