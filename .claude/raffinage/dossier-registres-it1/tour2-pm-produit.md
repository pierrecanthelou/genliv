RÉPONSE AUX OBJECTIONS

RISQUE — le risque nommé au tour 1 (`portee` semé sans consommateur, anti-patron tier/lie_au_canon) vient de se matérialiser dans la note UX elle-même : le contrat de design rend un Select "PORTÉE" pour un champ dont ni le cadrage ni aucun rôle ne nomme le lecteur. Tech Lead corrobore indépendamment (KR-192, KR-206, « même forme »).

OBJECTION — je maintiens contre UX : rendre `portee`, c'est demander à l'auteur un choix (Select) qui ne produit aucun effet observable cette itération.

PROPOSITION — j'adopte le reste du contrat UX tel quel (Field nom, Field vérité, Field formulation_joueur, section « Mène à »). Je retranche uniquement le Select "PORTÉE" de `FicheIndice.tsx`. `portee` reste posé au type, non rendu, known_risk tracé pour n°7.

Sur l'auto-référence dans `mene_a` : je tranche pour UX contre QA. KR-194 porte sur un autre champ — l'auto-exclusion coûte une ligne et évite un état narrativement absurde.

VERDICT — recevable sous réserve, veto ciblé sur le rendu de `portee`.

Disposition tour 1 :
- RISQUE — maintenue, confirmée.
- OBJECTION — DURCIE EN VETO, ciblé strictement sur le Select "PORTÉE".
- PROPOSITION — maintenue, précisée : j'adopte le reste du contrat de rendu UX intégralement ; seul le Select portée en est retranché.