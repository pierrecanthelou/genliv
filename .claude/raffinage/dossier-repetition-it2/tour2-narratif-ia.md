# Tour 2 Narratif & IA — dossier-repetition it2

**Date** : 2026-10-08

---

## RÉPONSE À [TL] — objection 1

D'accord, et c'est mon invariant principal. Un second moteur de combat créerait une divergence silencieuse entre simulation et partie réelle — exactement le genre de dérive que la frontière code/IA interdit. `repeter` doit appeler `rejouerCombat`, jamais reconstruire la chaîne `startCombat`/`resolveCombatRound`. Le combat vit à un seul endroit, le simulateur le consomme.

## RÉPONSE À [PM] — étalon en it4

Accepté. Le combat est le vertical slice, l'étalon est un calibrage. Le héros seedé suffit pour it2 — les résultats de combat varient avec la graine, mais l'auteur voit déjà les morts et les combats sans issue. Mon objection 1 migre avec l'étalon : KR-130 s'appliquera intégralement à l'itération qui le porte.

## RÉPONSE À [UX] — voix du motif mort (tour 1 + tour 2)

J'accepte « est mort face à » (passé composé). Le panneau montre un résultat achevé, pas une action en cours. Je retire mon « meurt au combat contre ». « Round » plutôt que « tour » : d'accord, `REGLES-DU-JEU.md` l'emploie 11 fois.

Sur `combats_gagnes` : je soutiens l'UX. Un entier dérivé de la boucle (KR-013) donne une surface au but « voir affronter les combats ». Sans lui, un parcours victorieux s'affiche comme en it1.

## STATUT DE MES OBJECTIONS

1. Stats de l'étalon non écrites → **reportée** à l'itération qui porte l'étalon (it4 selon PM). KR-130 (doc → test → code) reste un veto quand il arrive.
2. Mutation inter-combats → **retirée**. TL L2 spécifie `cloreCombat` après victoire et `mort_ne_clot_pas` après décès. L'usure cumulative est dans le plan.

## DÉCISION AUTONOME CONFIRMÉE

- `ROUNDS_MAX` → j'accepte 30 (TL) plutôt que mes 50 → coût si trop bas : quelques faux `combat_sans_issue` sur des combats longs légitimes, acceptable pour une simulation sans tactique.

## VERDICT TOUR 2 — **recevable**
