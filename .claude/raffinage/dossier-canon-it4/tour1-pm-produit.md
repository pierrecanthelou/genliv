# Tour 1 — PM Produit — dossier-canon it4

RISQUE — Le goal-brut d'it4, contrairement à it1/it3, ne nomme QUE le lot contrat (« Lot contrat (seul, premier) : crée le type Lieu... »). Aucune mention du lot feature (PanneauLieux, ListRow, fiche à 4 champs) qui produit réellement « une liste de fiches à gauche du panneau ». Comme cette itération ferme la feature (roadmap 3/4 → 4/4, done), un découpage qui livrerait le contrat sans la surface d'écriture laisserait la section Lieux à l'état vide générique — la feature se déclarerait terminée sans que l'auteur puisse jamais consigner un lieu. C'est le risque que je surveille en premier.

OBJECTION — Le goal parle de « consigner un nouveau lieu » (créer/éditer) mais AC#8 (feature-level) exige qu'un lieu « ajouté ou supprimé » mette à jour le compteur : la suppression n'est nommée nulle part dans le goal brut d'it4. Ni intégrée ni explicitement écartée — à trancher au raffinage, pas laissée en angle mort.

PROPOSITION — Exiger au raffinage un découpage explicite à 2 lots nommés (contrat : type Lieu ; feature : PanneauLieux.tsx avec création + édition des 4 champs + suppression sans confirmation, motif déjà acté it1/it3 « aucune référence vivante »), sur le modèle littéral d'it1/it3 (« 2 lots : contrat (...) puis feature (...) »). Chiffrable : 2 lots, ≤4 champs (nom existant + 3 neufs), zéro champ de référence croisée (acces/personnages/objets/indices/evenements, déjà hors périmètre écrit).

VERDICT — recevable sous réserve : la surface d'écriture (liste + fiche) doit être explicitement dans le lot feature de CETTE itération, sinon veto pour valeur nulle à la clôture de feature.
