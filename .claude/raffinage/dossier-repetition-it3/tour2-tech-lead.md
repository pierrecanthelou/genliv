# Tech Lead — dossier-repetition it3, tour 2

RÉPONSES AUX AUTRES
- [NIA] `lieux_visites` + `trace` → `lieux_visites` se dérive de `trace` (KR-013), pas les deux. Retire son propre `parcours` : `session.monde.lieux_visites` est déjà le SSOT du moteur (session.ts:578, commandes.ts:350). Le rapport le relit en sortie, sans recalcul.
- [PM] 3 lots → non. Rien ne touche brain/ (KR-313). Un lot, six fichiers.
- [UX] ListeConstats → local à la feature, 2 appelants (LIEUX, PERSONNAGES), un composant par fichier. Accepte `localiserEntite`.
- [QA] PNJ atteint défini : `presence[].lieu_id ∈ lieux_visites`. Trois cas limites testables au composant.

STATUT DE MES OBJECTIONS
1. Libellé lié au parcours → maintenue (consensus)
2. parler/agir → maintenue (KR-304, unanime)
3. Étalon → maintenue (unanime)
4. Critères 3,7,9 périmés → maintenue
5. `parcours` → retirée (duplique le moteur, `lieux_visites` est le SSOT)
6. PNJ sans `presence` exclus → retirée (listés, `some([])` → false, sans branche)
7. Fermeture `rapporter` → retirée (hors périmètre)
8. ListeConstats → maintenue (2 appelants)
9. Un lot → maintenue
10. `<details>` → retirée (hors it3)

VERDICT FINAL — recevable sous réserve (`lieux_visites` lu du SSOT, ni `parcours` ni `trace`)

## ANNEXE
| Lot | Fichiers |
|---|---|
| L1 `couverture-parcours` | R repeter.ts · R repeter.test.ts · R repeterCombat.integration.test.ts · N ListeConstats.tsx · R PanneauRepetition.tsx · R panneauRepetition.test.tsx |

Signatures : `RapportRepetition.lieux_visites: readonly string[]`, requis, posé aux 7 sorties. Non-atteints dérivés en ligne dans le panneau.
