# Tech Lead — moteur-horloge it2 — TOUR 1

**RISQUE** — Le cadrage fait de `changementsDe(avant, après)` le cœur d'it2. Or `CibleNarrateur` ne porte que la session d'après (doctrine n° 10 it2, `copilote/types.ts:525`), et `lancerLeDe` (`useTourDeJeu.ts:458`) n'a aucun « avant ». Suivre le cadrage rouvre `copilote/types.ts` et deux sites de hook, tous hors des fichiers probables.

**OBJECTION**
1. `etapeDeclenchee` rend `false` pour « absent » comme pour « faux ». J2 (lignes 4 et 5) les distingue : bloqué d'un côté, minuterie de l'autre. Seul `evaluate.ts` peut lire `.declencheur_expr` (garde `evaluate.test.ts`). Le tri-état vit donc là, et ce fichier est absent du cadrage.
2. J2 lit `duree` sur `plan_actions[n]` (lignes 5-6) et sur `[k]` (ligne 7). `types.ts:425` et `si_bloque` disent « cette étape », donc k.
3. « Bloqué » n'a aucun lecteur : `si_bloque` n'est pas dans les proses retenues. Un sélecteur sans appelant est une dette.
4. M = 1997 sous un palier de 2000 (×3, `narrateur.ts`). Le bloc le franchit, donc le budget narrateur, le `max` du worker et l'invite bougent.

**PROPOSITION**
- `changementsDuPas(dossier, session)`, sans `avant`. Avancé ⟺ `etape_plan.depuis === horloge.tour`. Bloqué à ce pas ⟺ `tour − depuis === duree[k]`. Aucune ligne dans `copilote/types.ts` ni dans le hook.
- `depuis` optionnel (sessions 0.7.21, déjà déployées), absent ≡ 0. `duree` lue sur k, ignorée si non entière ou < `DUREE_MIN`.
- Lecteur de bloqué : la ligne `si_bloque` de PENDANT CE TEMPS. Sinon bloqué sort d'it2.
- Trois lots, `session.ts` (> 800 lignes) non rouvert.

**VERDICT** — recevable sous réserve (1, 2, 3 tranchés).

## ANNEXE — découpage en lots

| id | titre | type | ouvrier | précondition |
|---|---|---|---|---|
| **L1** | Moteur : `depuis`, minuterie, tri-état, projection | `contrat` | `dev-contrat` | aucune, premier |
| **L2** | Narrateur : bloc PENDANT CE TEMPS, budget, invite | `contrat` | `dev-contrat` | L1 figé |
| **L3** | Bandeau PAS #n | feature | `dev-lot` | aucune |

### L1 — contrat (brain/dossier)
Fichiers : `docs/REGLES-PLAY.md` (R), `faits.ts` (R), `sessionDestinations.ts` (R), `evaluate.ts` (R), `horloge.ts` (R), `evaluate.test.ts` (R), `horloge.test.ts` (R), `commandes.test.ts` (R), `sessionCouverture.test.ts` (R), `__fixtures__/session-saturee.ts` (R).

Expose :
```ts
etape_plan?: { readonly rang: number; readonly depuis?: number }
type DeclencheurDEtape = 'vrai' | 'faux' | 'absent'
function declencheurDEtape(faits, etape): DeclencheurDEtape
function tickHorloge(dossier, session): EtatSession // inchangée
type ChangementDePnj = { pnj_id: string; nature: 'avance' | 'bloque'; rang: number }
function changementsDuPas(dossier, session): readonly ChangementDePnj[]
```

### L2 — contrat (brain/copilote + worker)
Fichiers : `contexte/horloge.ts` (N), `narrateur.ts` (R), `contexte.test.ts` (R), `worker/index.ts` (R), `worker/index.test.ts` (R), `worker/frontiere.test.ts` (R).

Expose :
```ts
const CHEMIN_ACTION_DE_PLAN = 'monde.personnages[].plan_actions[].action'
const CHEMIN_SI_BLOQUE = 'monde.personnages[].plan_actions[].si_bloque'
function lignesPendantCeTemps(dossier, session): readonly string[]
```

### L3 — feature (play-mode)
Fichiers : `BandeauHeros.tsx` (R), `BandeauHeros.test.tsx` (R), `EcranPartie.tsx` (R), `EcranPartie.test.tsx` (R).

Expose : `BandeauHerosProps.pas?: number`, rendu `PAS #{pas}`.

## Décisions prises en autonomie
- Origine du décompte : `depuis ?? 0`
- `depuis` optionnel (KR-251)
- Propriétaire de `duree` : étape k
- Projection sans `avant` : `depuis === tour`
- Tri-état : `declencheurDEtape` remplace `etapeDeclenchee`
- Lecteur de bloqué : `si_bloque` dans PENDANT CE TEMPS
- Perceptibilité : `personnagesPresents` existant
- Place du bloc : après CE PAS, hors cascade
- Avancements sous pas non racontés : jamais narré
- L1 et L2 séparés
