# PM Produit — moteur-combat it1 — Tour 1

**RISQUE** : Le goal cache une pièce non listée. Rien n'évalue `monde.evenements[].declencheur_expr` au runtime. Seul `resoudreJalons` (evaluate.ts:204) évalue des déclencheurs, et ce sont ceux des jalons. Le critère 1 impose donc un premier évaluateur d'événements. De plus, `combat = {monstre_ref, postures[]}` ne porte pas l'id de l'événement. À la clôture, aucun moyen de le consommer. Comme `lieu_courant_est` reste vrai, le combat se rouvrirait à chaque commande.

**OBJECTION** :
1. « Sonde D2-bis + correction manqué » sont deux riders hors phrase de démo.
   - D2-bis × égalité est un cas limite : combatEngine.ts:239-244 laisse les compteurs intacts, et REGLES-PLAY D2-bis dit « consécutives » sans trancher. La règle n'est pas écrite, donc doc d'abord (KR-130), pas le code.
   - « manqué » : la cible n'est pas écrite et aucun effet n'est visible (une égalité s'affiche « assaut nul », jamais « Manqué »). Valeur nulle pour l'auteur.
2. Défaite sans écran de fin : un héros à 0 PV continuerait d'explorer.

**PROPOSITION** : Quatre lots, sept critères (1, 2, 3, 6, 7, 8, 9), sous le seuil.
- (1) **contrat** : session, commandes, alea, sessionDestinations.
- (2) **moteur** : rencontre.ts + évaluateur borné aux événements à monstre_ref, après chaque commande acceptée. L'événement est consommé à l'ouverture.
- (3) **écran** : EcranCombat + suppression des deux orphelins.
- (4) **D2-bis** : une ligne dans REGLES-PLAY + un test, moteur inchangé par défaut.

Retire « manqué » (déclencheur non armé : it1 ne rouvre pas capacityEffects.ts). Défaite : commandes refusées, bouchon que la n° 15 retire.

**VERDICT** : Phrase de démo retenue. Approuvé si le goal est réécrit sans les deux riders.
