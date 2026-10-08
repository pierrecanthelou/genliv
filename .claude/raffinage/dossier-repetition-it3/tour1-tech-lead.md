# Tech Lead — dossier-repetition it3, tour 1

**RISQUE** — Le rapport ne porte ni les lieux traversés ni le chemin. Le panneau n'a rien à dériver sans champ neuf. Et « non atteint en 20 pas » est faux dès que l'arrêt n'est pas pas_max.

**OBJECTION**
1. Le libellé doit être lié au parcours (« sur ce parcours »), pas à PAS_MAX.
2. parler/agir : refus. No-op sur monde (commandes.ts:393,:445), décale le RNG (KR-304). Co-présence suffit.
3. Étalon : refus. Son seul consommateur (calibrage) est hors n°16. Abstraction sans appelant.
4. Les critères 3, 7 et 9 de la spec sont périmés (combat_ouvert, ouverture_a_ecrire, « Rejouer à l'identique »).

**PROPOSITION**
- `parcours: readonly string[]` dans RapportRepetition (départ puis lieu après chaque pas). Visités = `new Set(parcours)`. Les 7 sorties passent par une fermeture `rapporter`.
- PNJ sans `presence` : EXCLUS des non-atteints (doublon avec règle Contrôles `personnage-sans-presence`).
- ListeConstats local à la feature, `<details>` natif pour le dépliable.
- Un seul lot `couverture-parcours` (le lot panneau ne passe pas tsc sans le type parcours).
- PanneauRepetition.tsx passe de 261 à ~340 l., sous 400 (KR-112).

**VERDICT** — recevable sous réserve : points 1 à 3 tranchés, un seul lot.

## ANNEXE — Découpage : 1 lot feature, 0 contrat

| Lot | Fichiers |
|---|---|
| L1 `couverture-parcours` | R repeter.ts · R repeter.test.ts · R repeterCombat.integration.test.ts · N ListeConstats.tsx · R PanneauRepetition.tsx · R panneauRepetition.test.tsx |

Signatures : `RapportRepetition.parcours: readonly string[]`, `ListeConstats({titre, entrees: ConstatEntree[], vide: string})`.
Consommé : `localiserEntite` (déjà exporté brain/index.ts).
