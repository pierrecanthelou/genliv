# Cadrage n°16 `dossier-repetition` — Tour 1 — Tech Lead

RISQUE — Le rapport devient un second décideur. Sans modèle, la partie ne produit ni `a_dit`, ni confiance, ni jet (R2/R4 les écrivent). Toute condition qui en dépend reste fausse, et « fin non atteinte » passerait pour un défaut. Deux des trois lignes promises ont déjà un décideur statique (`indice-sans-source`, `personnage-sans-presence`).

OBJECTION — (1) Rien à extraire de `useTourDeJeu` : c'est un pas asynchrone à trois appels IA, pas une boucle. Le pur est déjà factorisé. (2) L'exécuteur ne peut pas vivre dans `brain/` : zéro arête de valeur `brain→player` (trois `import type`), or héros et combat sont dans `player/engine`. (3) Le verdict de difficulté ne doit pas devenir une règle de `CONTROLES` : `brain/` importerait le runtime.

PROPOSITION — B confirmée (A rendrait le rapport non reproductible, donc stocké : KR-013).
- Exécuteur pur `features/dossier-repetition/utils/repeter.ts` : `(dossier, graine) → ResultatRepetition`, via le baril et `player/engine/{rencontre,fin,charCreation}`.
- Zéro lot `contrat` en it1–it3 : politique sans aléa (pas de `DomaineAlea`), `parler` tenté puis filtré par le moteur.
- Boucles bornées (20 pas × candidats ; rounds plafonnés par une constante mesurée), ni timer ni `try/catch` (porte `jouable`).
- Rapport en `useMemo`, identifiants seuls, jamais écrit dans `MagasinDeSession`.
- Montage : troisième prop sœur de `DossierEditorScreen`.
- Seul `contrat` possible : le seuil « Difficulté non calibrée » (doc → doré → code), en it4 sacrifiable.

VERDICT — recevable sous réserve :
- le libellé dit « non atteint par ce joueur », jamais « inatteignable » ;
- `moteurSansIA.test.ts` est étendu à la nouvelle racine ;
- la dépendance du roadmap est corrigée (9/11/13/14/15, pas 10).

---

## ANNEXE 1 — Découpage en lots

4 itérations proposées, au lieu des 2 du roadmap.

| It. | Lot | Type | Fichiers |
|---|---|---|---|
| 1 | L1 | `feature` | `src/features/dossier-repetition/{specification.json, index.ts, utils/repeter.ts, components/PanneauRepetition.tsx, tests/}` · DossierEditorScreen.tsx + App.tsx · moteurSansIA.test.ts · docs |
| 2 | L1 | `feature` | repeter.ts, PanneauRepetition.tsx, composant de constats |
| 3 | L1 | `feature` | repeter.ts (multi-graine, mesures de dureté), panneau |
| 4 | L1 | `contrat` | section REGLES-DU-JEU.md, rules.golden.test.ts, calibrage.ts, brain/index.ts |
| 4 | L2 | `feature` | consomme L1, repeter.ts et le panneau |

**Signatures**

```ts
// repeter.ts
export const PAS_MAX = 20
export type MotifArret = 'pas_max' | 'fin' | 'mort' | 'impasse' | 'combat_sans_issue' | 'combat_irrejouable'
export type RefusRepetition = 'dossier_injouable' | 'ouverture_a_ecrire'
export interface RapportRepetition {
  readonly graine: number
  readonly pas: number
  readonly arret: MotifArret
  readonly lieux_visites: readonly string[]
  readonly jalons_atteints: readonly string[]
  readonly fin_id?: string
}
export type ResultatRepetition =
  | { readonly ok: true; readonly rapport: RapportRepetition }
  | { readonly ok: false; readonly refus: RefusRepetition }
export function repeter(dossier: Dossier, graine: number): ResultatRepetition
```

Le rapport n'a pas de champ `fin_a_l_ouverture` : il se dérive de `pas === 0 && fin_id !== undefined` (KR-013).

**Consomme** : ouvrirSession, fixerHeros, executerCommande, destinationsPossibles, creerRng, jouerPosture, cloreCombat, controlerDossier.jouable (baril brain/) + ouvrirRencontreSiDue, rejouerCombat, bilanDe, finAtteinte, rollCreationPool, buildHeroFromCreation (player/engine/).

**Terminaison** : boucle externe ≤ PAS_MAX, combat ≤ ROUNDS_MAX, jalons ≤ charpente.jalons.length.

**Mutants à prouver rouges** : PAS_MAX à 19, retirer finAtteinte, retirer ouvrirRencontreSiDue, retirer racine moteurSansIA.

## ANNEXE 2 — Refus motivés

- **Extraire un `avancerPas` commun** : le pur est déjà factorisé, useTourDeJeu est un pas asynchrone à 3 appels IA.
- **Registre Strategy de politiques** : un seul appelant, c'est une dette.
- **Miroir useState du rapport** : se périme à chaque édition, useMemo suffit.
- **Session dans MagasinDeSession** : écraserait la session réelle (KR-305).
- **Option A** : 11e rôle IA, route, audience, rapport non reproductible, 20 appels par clic.
- **Exécuteur dans brain/** : première arête de valeur brain→player, casse la doctrine « module pur ».
- **Exécuteur dans player/engine/** : gonfle le runtime extractible avec un outil d'auteur.

## Fichiers consultés
- src/brain/dossier/commandes.ts, session.ts, sessionCombat.ts, evaluate.ts, alea.ts, controles.ts, atteignabilite.ts
- src/features/play-mode/hooks/useTourDeJeu.ts, components/PartieEnCours.tsx
- src/player/engine/rencontre.ts, fin.ts, heroGen.ts, charCreation.ts
- src/features/play-mode/tests/moteurSansIA.test.ts
- src/features/bascule-editeur/components/DossierEditorScreen.tsx, src/App.tsx
- src/brain/index.ts, .eslintrc.cjs
- docs/ROADMAP-BASCULE-IA.md
