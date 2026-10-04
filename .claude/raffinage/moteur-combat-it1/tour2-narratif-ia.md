# Narratif & IA — moteur-combat it1 — Tour 2

## Réponses aux questions croisées

**Q1 — Lot contrat nommé.** OBJECTION RETIRÉE. PM et TL convergent sur un lot contrat en premier.

**Q2 — Retrait de « manqué ».** Position MAINTENUE : pas de risque. Le log mécanique n'est jamais injecté (KR-294).

**Q3 — Consommation à l'ouverture (PM).** Pas de risque narratif. L'événement consommé à l'ouverture empêche la réouverture. Le monstre qui disparaît après une fuite est un fait du moteur, pas un mensonge. L'alternative (consommer à la clôture) forcerait un état ambigu pendant le combat.

**Q4 — pending* non appliqués (TL).** Pas un risque narratif : CombatLogEntry.text n'entre dans aucun contexte de modèle (KR-294). Le risque est UX (le joueur lit un effet sans conséquence visible), pas IA.

## Statut de mes objections Tour 1

| Objection | Statut |
|---|---|
| Lot contrat non nommé | RETIRÉE — PM et TL le posent |
| Frontière code/IA | MAINTENUE sans durcissement — intacte, pas de veto |

## Décision en autonomie

Consommation à l'ouverture approuvée. Si c'est l'inverse, un crash mid-combat laisse un événement non consommé et le monstre réapparaît.
