# Revue d'itération — `dossier-repetition` · itération 1

> **En une ligne** : l'auteur peut lancer une répétition synthétique de son dossier pour voir où le joueur s'arrête.

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | repeter() sans fetch/CopiloteService/play-mode | VÉRIFIÉ | `cablage.test.ts` scanne 3 fichiers source, `moteurSansIA.test.ts` scanne la racine |
| 2 | Rapport dérivé useMemo, pas de useState ni PersistenceService | VÉRIFIÉ | `PanneauRepetition.tsx:111-114` — `useMemo`, seul état = `graine` |
| 3 | Dossier 20+ lieux → pas=20, pas_max | VÉRIFIÉ | `repeter.test.ts::va_et_vient_PAS_MAX` — `mockExec` appelé 20 fois, `creerRng` borné |
| 4 | 4 motifs avec champs discriminants | VÉRIFIÉ | `fin_pas_0`, `impasse_pas_1`, `combat_ouvert_avec_monstre_ref`, `va_et_vient_PAS_MAX` |
| 5 | Reproductibilité graine | VÉRIFIÉ | `repeter.test.ts::reproductibilite_graine` — `toEqual` sur deux appels |
| 6 | Dossier injouable → refus + lien section | VÉRIFIÉ | `repeter.test.ts::dossier_injouable` + `panneauRepetition.test.tsx::refus_dossier_injouable` |
| 7 | 3 états invite/résultat/à corriger + textes du contrat | VÉRIFIÉ | `invite`, `resultat_fin`, `resultat_impasse`, `resultat_combat_ouvert`, `resultat_pas_max`, `relancer_incremente` (badge n°1→n°2) |
| 8 | creerRng('repetition') indépendant | VÉRIFIÉ | `alea.test.ts` : 6 tests (meme_cle, independance, pas_distincts, entrelacement, graines_distinctes, bornes) |

## Diff par lot

### Lot L1 — `alea-repetition` (contrat)

| Fichier | Type |
|---|---|
| `src/brain/dossier/alea.ts` | R |
| `src/brain/dossier/alea.test.ts` | R |

Signature livrée : `DomaineAlea = 'heros' | 'jet' | 'combat' | 'repetition'`

### Lot L2 — `repetition-it1`

| Fichier | Type |
|---|---|
| `src/features/dossier-repetition/utils/repeter.ts` | N |
| `src/features/dossier-repetition/components/PanneauRepetition.tsx` | N |
| `src/features/dossier-repetition/index.ts` | N |
| `src/features/dossier-repetition/tests/repeter.test.ts` | N |
| `src/features/dossier-repetition/tests/panneauRepetition.test.tsx` | N |
| `src/features/dossier-repetition/tests/cablage.test.ts` | N |
| `src/features/bascule-editeur/components/DossierEditorScreen.tsx` | R |
| `src/features/bascule-editeur/tests/slotRepetition.test.tsx` | N |
| `src/App.tsx` | R |
| `src/features/play-mode/tests/moteurSansIA.test.ts` | R |

## Ce qui a été refusé

| # | Proposition | Statut | Motif |
|---|---|---|---|
| 21 | Registre de politiques (Strategy) | REJETÉ | Un seul appelant, abstraction prématurée |
| 22 | `avancerPas` commun | REJETÉ | Déjà rejeté au cadrage |
| 23 | Rapport en `useState` | REJETÉ | Miroir périssable (KR-305/013) |
| 24 | Exécuteur dans `brain/` | REJETÉ | Arête `brain→player` interdite |
| 25 | Rotation des accès | REJETÉ | Accès pendant refusé au SSOT, un seul tirage suffit |

## Ce qui a été reporté

- **mort / combat_sans_issue** → it2 (résolution de combat)
- **Lieux/PNJ non atteints** → it3 (analyse de couverture)
- **Test moteur réel (smoke sans mock)** → it2, déclencheur : réouverture de `repeter.ts` pour la boucle combat
- **Règles ESLint UX (`--good`/`--bad`, `--hit-target`)** → dette à déclencheur

## Écarts assumés

**KR-303 — ordre combat/fin dans la boucle.** Le plan §5 ligne 171 dit « la fin gagne sur le combat au même pas ». Le code vérifie combat en premier (repeter.ts:190-202) puis fin (repeter.ts:204-216). C'est l'ordre correct : `finAtteinte` rend `undefined` sous `session.combat` (evaluate.ts:477, KR-303), donc inverser les blocs serait un mutant équivalent avec le vrai moteur mais un mensonge structurel. Le test `combat_et_fin_meme_pas` prouve l'ordre par `toHaveBeenCalledTimes(1)`. Commentaire KR-303 ajouté en ligne.

## Porte qualité

| Étape | Résultat |
|---|---|
| Prettier | vert |
| tsc --noEmit | vert |
| jest | 162/162 suites, 3026 tests |
| Score de mutation | non applicable (aucun des 4 fichiers mutés touché) |
| Auto-revue | tout vert (aucun défaut) |
| Tech-lead PR | APPROVE (2 tours) |

## Bugs journalisés

Aucun bug ajouté à `bug_history.json` — aucune régression ni défaut interne.

## RETOUR-COMITÉ

- Le plan §5 ligne 171 contenait une affirmation fausse (« la fin gagne ») que deux tours de comité n'ont pas attrapée. Le TL tour 1 avait écrit l'ordre correct (« la rencontre gagne, KR-303 ») mais l'orchestrateur a recopié l'inverse dans la chaîne. À vérifier dès qu'un plan §5 cite un ordre de vérification.
- `cablage.test.ts` initial ne balayait qu'un seul fichier. Élargi au feature entier par la QA mode B. Vérifier systématiquement la portée des gardes d'isolation.
- Le test moteur réel (sans mock) est reporté à l'it2 — le TL l'accepte avec un déclencheur nommé. Les témoins de reproductibilité et de bornes sont plus faibles sans lui (prouver le comportement sur des mocks ne prouve pas le moteur).
