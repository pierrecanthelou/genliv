# Tech Lead — moteur-combat it1 — Tour 1

## RISQUE

1. **Le déclencheur n'existe pas.** Aucun code ne lit `Evenement.declencheur_expr` hors jalons, et aucun code n'écrit `evenements_consommes`. La phrase de démo n'est atteignable que sur un dossier importé en JSON.
2. **Rejeu faux si `heros` bouge pendant le combat.** `startCombat` lit `heros.pv` et `heros.pe`. La clôture doit être atomique.
3. **Quatre capacités écrivent `pending*`.** Maladie, vol, magie et rayon. La session n'a aucune feuille pour les recevoir.

## OBJECTION

Le cadrage place la détection dans « commandes.ts / orchestrateur ».
- Dans `executerCommande`, la garde `evaluate.test.ts:490` rougit : `evaluate.ts` doit rester le seul lecteur de `.declencheur_expr` dans `brain/dossier/`.
- Les fixtures à événement-monstre feraient aussi rougir `jalonAuJournal` et `verrouDeTour`.
- Le cadrage nomme `destinations.ts`. C'est la table du dossier. La session s'écrit dans `sessionDestinations.ts`.

## PROPOSITION

Deux lots (contrat + feature), séquentiels :
- **Contrat** : `evenementARencontrer` dans evaluate.ts, `resoudreRencontre`/`jouerPosture`/`cloreCombat` dans session.ts, refus `combat_en_cours`, domaine `'combat'` dans alea.ts, sessionDestinations.
- **Feature** : rencontre.ts (rejeu), adoption aux deux sites d'appel, écran, sonde D2-bis, correction « manqué », suppression orphelins.

`cloreCombat` atomique : pv, pe, XP, retrait de `combat` en un seul retour. Sur la mort, `combat` reste.

## VERDICT

**Approuvé sous deux conditions.** Le PM tranche les points 1 et 3, sinon la démo ou le log est mensonger. Aucun veto déclenché.

## ANNEXE — Découpage détaillé

### Lot 1 — contrat-combat (brain/)
Fichiers (tous R) : session.ts, evaluate.ts, commandes.ts, alea.ts, sessionDestinations.ts, __fixtures__/session-saturee.ts, brain/index.ts + tests associés.

Signatures : EtatCombat, BilanCombat, resoudreRencontre, jouerPosture, cloreCombat, evenementARencontrer, RefusCommande += 'combat_en_cours', DomaineAlea += 'combat'.

### Lot 2 — feature-combat (player/ + play-mode/)
N : rencontre.ts, rencontre.test.ts, EcranCombat.tsx, EcranCombat.test.tsx.
R : combatEngine.test.ts (sonde D2-bis), capacityEffects.ts (« manqué »), EcranPartie.tsx, useTourDeJeu.ts + tests.
D : useCombat.ts, CombatScreen.tsx.
