# Revue d'itération — `moteur-fins` · itération `1`

> Produit le 2026-10-06

## Ce que l'auteur peut faire maintenant

L'auteur voit sa partie s'arrêter quand la condition d'une fin du dossier devient vraie, et lit mot pour mot le texte qu'il a écrit pour cette fin.

## Critères

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | `finAtteinte` rend `FinAtteinte` quand condition vraie et pas de combat | VÉRIFIÉ | `evaluate.test.ts` : « finAtteinte rend la première fin dont la condition est vraie » |
| 2 | Deux fins vraies → première dans l'ordre du document (KR-302) | VÉRIFIÉ | `evaluate.test.ts` : « KR-302 deux fins vraies, première dans l'ordre du document » — fixture `fins` inversé |
| 3 | Combat ouvert → `finAtteinte` rend `undefined` (KR-303) | VÉRIFIÉ | `evaluate.test.ts` : « KR-303 combat ouvert bloque finAtteinte » |
| 4 | Après fin, tout verbe rend `partie_terminee` | VÉRIFIÉ | `commandes.test.ts` : balayage `aller`/`agir`/`parler` → `{ ok: false, refus: 'partie_terminee' }` |
| 5 | EcranFin affiche `Fin.texte` verbatim, console et saisie retirées | VÉRIFIÉ | `finDePartie.test.tsx` : écran de fin monté, console et saisie absentes · `EcranFin.test.tsx` : verbatim |
| 6 | Garde coupe R2/R3/R4 après fin | VÉRIFIÉ | `useTourDeJeu.test.ts` : « garde coupe R2/R3/R4 après fin — copilote.demander appelé une seule fois (R1) » |
| 7 | Fin sans texte → repli invitant (KR-307) | VÉRIFIÉ | `EcranFin.test.tsx` : « KR-307 repli invitant sans texte » |

## Diff par lot

### Lot 1 — `contrat-fin` (contrat)

| Fichier | Plan | Livré |
|---|---|---|
| `src/brain/dossier/evaluate.ts` | R | R — `finAtteinte` + `FinAtteinte` ajoutés |
| `src/brain/dossier/commandes.ts` | R | R — garde `partie_terminee` après `combat_en_cours` |
| `src/brain/dossier/interprete.ts` | R | R — commentaire l.150-152 |
| `src/brain/dossier/evaluate.test.ts` | R | R — +256 lignes, 9 tests |
| `src/brain/dossier/commandes.test.ts` | R | R — +263 lignes, balayage `partie_terminee` |
| `src/brain/dossier/session.test.ts` | R (si rouge) | R — 1 test adapté (fixture `fins: []`) |

### Lot 2 — `feature-ecran-fin`

| Fichier | Plan | Livré |
|---|---|---|
| `src/features/play-mode/components/EcranPartie.tsx` | R (~100 l.) | R — 60 lignes (shell + gardes) |
| `src/features/play-mode/components/PartieEnCours.tsx` | N (~300 l.) | N — 316 lignes |
| `src/features/play-mode/components/EcranFin.tsx` | N (~90 l.) | N — 71 lignes |
| `src/features/play-mode/components/EcranFin.test.tsx` | N | N — 5 tests RTL |
| `src/player/engine/fin.ts` | N (réexport) | N — 8 lignes, réexport seul |
| `src/features/play-mode/hooks/useTourDeJeu.ts` | R | R — garde lignes 212-218 |
| `src/features/play-mode/hooks/useTourDeJeu.test.ts` | R | R — 1 test ajouté (garde R2/R3/R4) |
| `src/features/play-mode/tests/finDePartie.test.tsx` | N | N — 1 test intégration |
| `src/features/play-mode/tests/combatParConsole.test.tsx` | R | R — adaptation fin.vigie-abandonnee |
| `src/features/play-mode/components/EcranPartie.test.tsx` | R (si rouge) | Non touché — pas rouge |

## Ce qui a été refusé

| # | Proposé par | Rejet | Motif |
|---|---|---|---|
| 6 | PM | 4 lots | Lots 2/3/4 partagent `EcranPartie.tsx`/`PartieEnCours.tsx` — violation fichiers disjoints |
| 21 | Narratif-IA | R5 déjà dans `projeterAssaut` | PM vérifié au code : `projeterAssaut` ne teste pas `phase`. R5 appelé sur `hero-mort` (livré n° 13) |
| — | Narratif-IA T1 | `issueDePartie` unifiée | Deux chemins de détection disjoints (`evaluerExpr` vs `bilanDe`). Retirée T2 après lecture du code |
| — | QA T1 | `fin_a_ecrire` dans le contrat | Couple détection/contenu viole SRP. `Fin.texte` optionnel à vie (KR-191) |
| — | QA T1 | Mort a priorité sur fin | Exclusives par construction (combat bloque `finAtteinte`). Pas de clause de priorité |

## Ce qui a été reporté

| Report | Destination |
|---|---|
| Mort du héros (écran, texte constant, garde R5) | it2 |
| Bouton Rejouer + focus auto | it2+ |
| Redécoupage it2/it3/it4 | Cadrage it2 |
| Texte de mort (constante nommée, hors prompt) | it2 |
| En-têtes distincts fin/mort | it2 |
| `boutonRetour` en `brain/components/` | Dette à déclencheur (1 seul appelant) |
| Réécriture `docs/EXIGENCE-APERCU-DU-JEU.md` | Lot `.md` en fin de feature |

## Écarts assumés

- `EcranPartie.tsx` à 60 lignes (plan : ~100) — plus petit que prévu, pas de risque.
- `PartieEnCours.tsx` à 314 lignes (plan : ~300) — sous le seuil 400 (KR-112).
- `EcranFin.tsx` à 72 lignes (plan : ~90) — sous le plan.
- Le test de garde R2/R3/R4 (`useTourDeJeu.test.ts`) a été ajouté après la QA mode B (qui l'avait signalé absent). Défaut corrigé avant la revue tech-lead.
- **Bandeau absent de l'écran de fin** : le plan § 3 met `bandeau={<BandeauHeros/>}` dans la structure, mais la branche fin dans `PartieEnCours` monte `<CadrePartie>` sans bandeau. PV/PE sans objet sur écran de fin. À traiter en it2.
- **`PartieDemarree` dans `PartieEnCours.tsx`** : le plan le laissait dans `EcranPartie.tsx` (~100 l.). Le déplacement évite un cycle d'import et garde `EcranPartie` plus petit (60 l.). Pas de second composant exporté — `PartieDemarree` reste interne.

## Blocages non résolus

Aucun.

## Porte qualité

- **prettier** : vert (`npx prettier --check "src/**/*.{ts,tsx,css}"`)
- **tsc --noEmit** : vert
- **eslint** : vert (0 erreurs, 0 warnings sur les fichiers modifiés)
- **jest** : 2894 tests, 151 suites, 0 échec
- **Score de mutation `brain/`** : non requis — `evaluate.ts` et `commandes.ts` ne sont pas dans le périmètre Stryker (les 4 fichiers mutés sont `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`)

## RETOUR-COMITÉ

- Le découpage en 2 lots (contrat + feature) a fonctionné sans blocage. L'exécution séquentielle était le bon choix (pas de fusion, pas de conflit).
- Le test de garde R2/R3/R4 (`useTourDeJeu.test.ts`) était dans le plan (§ 7, test #13) mais n'a pas été écrit par le lot 2 — détecté par la QA mode B. L'essaim devrait vérifier la correspondance § 7 ↔ tests écrits avant de rendre le lot vert.
- La fixture `dossier-reference` contient une fin (`fin.vigie-abandonnee`) qui devient vraie après clôture d'un combat — ce n'est pas un cas de test inventé mais un effet de bord réel de la fixture existante. `session.test.ts` et `commandes.test.ts` ont dû s'adapter (`fins: []` sur clones).
- `panneauPersonnages.test.tsx` avait un diff parasite (session précédente) — restauré par stash avant la revue.
