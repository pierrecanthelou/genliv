# dossier-repetition it1 — Tech Lead — Tour 1

**RISQUE** — Le rapport devient un second moteur. Sans extraction (actée), seul l'ORDRE garde la dérive. C'est celui de `PartieEnCours.tsx:246-253` : `executerCommande`, puis `ouvrirRencontreSiDue`, puis `finAtteinte` sur la session post-rencontre (la rencontre gagne, KR-303). À l'ouverture, `finAtteinte` seul.

**OBJECTION**
1. **Veto, contournement de contrat.** Le cadrage dit « choix aléatoire » et « la graine contrôle le RNG ». Mais `DomaineAlea` est clos (`heros|jet|combat`), et mon tour 1 écrivait « politique sans aléa ». Sans aléa, la graine n'a aucun effet observable en it1 : le héros n'est lu que par `resoudreRencontre`, et un combat ouvert ARRÊTE la boucle. « Relancer » et « Parcours n°n » mentent alors. Emprunter `jet` ou `heros` détourne un domaine. La spec cite aussi `brain/dossier/rng.ts`, qui n'existe pas : c'est `alea.ts`.
2. « Rejouer à l'identique » est sans effet. `repeter` est pure, la graine est le seul état, et le panneau est démonté à chaque changement de destination. Le bouton est intestable.
3. Qu'un accès soit jouable relève d'`executerCommande`. Un filtre maison dans la politique est un second décideur (KR-013).

**PROPOSITION**
- Lot `contrat` : domaine `'repetition'`, clé `creerRng(graine,'repetition',pas)`, une par pas.
- Politique : elle ordonne les accès par rotation seedée et les tente un à un. Aucun accepté = `impasse`.
- Panneau : seul état local `graine: number | null` (compteur, Relancer = +1). Rapport dérivé en ligne, jamais mémorisé. Retirer « Rejouer à l'identique », ou lui donner un effet.
- KR-309/313 sont déjà câblés par le lint dérivé du disque : aucun test sur mesure.
- `ouverture_a_ecrire` est inatteignable derrière `jouable` (marqueur `bloquant`, `controles.ts:169-170`). Un seul refus.

**VERDICT** — Recevable sous réserve du lot `contrat`. Repli : politique déterministe en un seul lot, Relancer et « Parcours n° » retirés de l'it1.

---

## ANNEXE — Lots (2, séquentiels)

| Lot | Type | Ordre | Fichiers |
|---|---|---|---|
| **L1 `alea-repetition`** | `contrat` | 1er, seul | R `src/brain/dossier/alea.ts` · R `src/brain/dossier/alea.test.ts` |
| **L2 `repetition-it1`** | `feature` | 2e | N `src/features/dossier-repetition/utils/repeter.ts` · N `…/components/PanneauRepetition.tsx` · N `…/index.ts` · N `…/tests/repeter.test.ts` · N `…/tests/panneauRepetition.test.tsx` · N `…/tests/cablage.test.ts` · R `DossierEditorScreen.tsx` · R `dossierEditorScreen.test.tsx` · R `App.tsx` · R `moteurSansIA.test.ts` |

### Signatures

**L1 expose** : `export type DomaineAlea = 'heros' | 'jet' | 'combat' | 'repetition'`

**L2 expose** (`repeter.ts`) :
```ts
export const PAS_MAX = 20
export type MotifArret = 'fin' | 'impasse' | 'combat_ouvert' | 'pas_max'
export type RapportRepetition = {
  readonly graine: number
  readonly pas: number
  readonly lieu_id: string
} & (
  | { readonly arret: 'fin'; readonly fin_id: string }
  | { readonly arret: 'combat_ouvert'; readonly monstre_ref: string }
  | { readonly arret: 'impasse' }
  | { readonly arret: 'pas_max' }
)
export type ResultatRepetition =
  | { readonly ok: true; readonly rapport: RapportRepetition }
  | { readonly ok: false; readonly refus: 'dossier_injouable' }
export function repeter(dossier: Dossier, graine: number): ResultatRepetition
```

### Chaîne de `repeter` (ordre contraignant)
1. `controlerDossier(d).jouable`, sinon refus.
2. `ouvrirSession(d, { graine_alea: graine })`, puis `fixerHeros`.
3. `finAtteinte` à pas 0.
4. Boucle `pas = 1..PAS_MAX` : `destinationsPossibles` ordonné par rotation seedée, premier `executerCommande` accepté, puis `ouvrirRencontreSiDue`, combat/fin/suite.

### Refus motivés
- Registre de politiques (Strategy) : un seul appelant.
- `avancerPas` commun : déjà rejeté.
- Rapport en `useState` : miroir périssable, KR-305.
- Exécuteur dans `brain/` : arête `brain→player`.
- `ouverture_a_ecrire` comme refus séparé : inatteignable derrière `jouable`.
