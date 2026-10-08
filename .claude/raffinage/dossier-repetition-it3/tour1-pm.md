# PM produit — dossier-repetition it3, tour 1

**RISQUE** — Le goal empile cinq choses : lieux, PNJ, dépliable des pas, ListeConstats, parler/agir. Un seul parcours aléatoire lu comme un diagnostic fera croire à l'auteur que son dossier est cassé.

**OBJECTION**
1. parler/agir : non. `parler` ne bouge pas `monde` (commandes.ts:393,445). Il brûle des pas sur les 20, décale le RNG de chaque graine épinglée (KR-304). La co-présence `presence[].lieu_id` suffit.
2. Dépliable + Badge combats_traverses : c'est un second comportement (relire le parcours). Exige une trace neuve. Pousserait PanneauRepetition au-delà de 400 l. (KR-112).
3. Le libellé « NON ATTEINT EN 20 PAS » est faux dès que l'arrêt tombe au pas 4.
4. Étalon : aucun consommateur dans n°16 (calibrage rejeté). Ne peut pas entrer en it3.

**PROPOSITION**
- Démo : « l'auteur peut lire ce que son joueur synthétique n'a pas atteint sur ce parcours ».
- Un seul champ neuf : `lieux_visites` dans RapportRepetition.
- Libellé : « NON ATTEINT SUR CE PARCOURS ».
- PNJ sans presence : listés comme non atteints.
- 3 lots, 0 contrat, 4 critères.
- Reporté : dépliable + Badge → it4 sacrifiable ; étalon → dette à déclencheur.

**VERDICT** — recevable sous réserve. Veto si parler/agir ou le dépliable restent dans it3.
