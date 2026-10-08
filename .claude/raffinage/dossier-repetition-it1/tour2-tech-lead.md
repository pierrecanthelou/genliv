# dossier-repetition it1 — Tech Lead — Tour 2

RÉPONSE À NARRATIF-IA (affectation, `choisirDestination`). Adopte `creerHerosSynthetique`, privée à `repeter.ts`. Pool via `creerRng(graine,'heros',0)`. Chemin tire dans `'repetition'`. Retire « tentative un à un » : un `acces[]` pendant est refusé au SSOT (`tables.ts:650`), donc `cible_inconnue` inatteignable. Choix unique ; refus `executerCommande` → `impasse`.

RÉPONSE À UX (objection 2). Trois états, pas quatre. `ouverture_a_ecrire` bloquante (`controles.ts:169-171`, section `depart`) : `bloquants[0].section` mène à Départ. Rayer « Rejouer à l'identique » : PM le reporte.

RÉPONSE À QA (objection 2). Racine = `features/dossier-repetition` entière, plancher 1. `floor(3/5)×5 = 0` viderait l'assertion (BUG-084).

MES OBJECTIONS
1. Domaine clos — **MAINTENUE**, veto conditionnel. Impact : `alea.ts` + `alea.test.ts` seuls. Sans L1, Relancer et « Parcours n° » sortent.
2. Rejouer à l'identique — **RETIRÉE** (UX raye).
3. Second décideur — **MAINTENUE** : aucun pré-filtre des accès.
4. Un seul refus — **MAINTENUE** ; porte `bloquant: Controle`.
5. KR-309/313 sans test sur mesure — **MAINTENUE**.

VERDICT FINAL — recevable sous réserve.

---

## ANNEXE — Lots révisés (2, séquentiels)

| Lot | Type | Ordre | Fichiers |
|---|---|---|---|
| **L1 `alea-repetition`** | `contrat` | 1er | R `alea.ts` · R `alea.test.ts` |
| **L2 `repetition-it1`** | `feature` | 2e | N `repeter.ts` · N `PanneauRepetition.tsx` · N `index.ts` · N `repeter.test.ts` · N `panneauRepetition.test.tsx` · N `cablage.test.ts` · R `DossierEditorScreen.tsx` · N `slotRepetition.test.tsx` · R `App.tsx` · R `moteurSansIA.test.ts` |

L1 expose : `DomaineAlea = 'heros' | 'jet' | 'combat' | 'repetition'`

L2 expose : `PAS_MAX`, `MotifArret`, `RapportRepetition`, `ResultatRepetition`, `repeter()`, `creerHerosSynthetique()` (module, pas barrel), `PanneauRepetitionProps`.

L2 consomme barrel `brain` + `player/engine` (`finAtteinte`, `ouvrirRencontreSiDue`, `rollCreationPool`, `buildHeroFromCreation`).

Chaîne repeter : `controlerDossier` → `ouvrirSession` → `fixerHeros` → `finAtteinte` pas 0 → boucle `choisirDestination` → `executerCommande` → `ouvrirRencontreSiDue` → `finAtteinte`.

moteurSansIA : racine `features/dossier-repetition`, plancher 1.

Décisions en autonomie :
- Clé d'indice `'repetition'` = le pas de boucle (1..20).
- `brain/index.ts` non touché.
- Graine initiale = 1, Relancer = +1.
- Test 3e slot dans fichier neuf `slotRepetition.test.tsx`.
- Racine moteurSansIA = feature entière, plancher 1.
- Refus `executerCommande` → `impasse`, sans rotation.
- `refus` porte `bloquant: Controle`.
