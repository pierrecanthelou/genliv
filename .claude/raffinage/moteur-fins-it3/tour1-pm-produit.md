# PM Produit — moteur-fins it3 — tour 1

RISQUE
L'écran de mort remplace EcranCombat. L'auteur ne lit alors plus comment il est mort (round létal, log). C'est une régression de lisibilité par rapport à aujourd'hui. Le goal empile en plus trois choses (écran, bandeau, bouton). Le cadrage lui accole deux reports sans rapport : « refus dans illisible » et une couture de session.

OBJECTION
1. `mort_confirmee` est un champ dérivable stocké (KR-013, CLAUDE.md). Il rouvre aussi la décision close « cloreCombat(hero-mort) rend la session à l'identique ». La mort se lit par `rejouerCombat(session).etat.outcome`. Je durcis en veto si le champ ou la branche `cloreCombat` survit.
2. « Refus dans illisible » n'a aucun lecteur auteur. Il ne peut rien faire d'une sauvegarde endommagée, hors « Recommencer » (livré en it2). Valeur nulle, et c'est une seconde tranche (contrat `reprise.ts`).
3. Le bouton « Nouvelle partie » est mal défini. `EcranFin` n'en a pas. Le ↻ d'en-tête ouvre « progression effacée » sur un héros déjà mort, ce qui est faux (la décision de dangerosité visait une session reprenable). Fin et mort doivent être traitées pareil.
4. Le critère « R5 non appelé sur hero-mort » contredit l'intention de n°13 (le libellé 'hero-mort' existe dans `commentateur.ts`). La garde tient en une ligne dans `CombatEnCours.handleJouer`. Il faut la nommer comme coupe volontaire, pas comme oubli.

PROPOSITION
- Une seule tranche, 6 critères au plus :
  - `EcranMort` avec `TEXTE_MORT_HEROS` (constante, `--text-strong`) ;
  - log de combat en lecture seule (le round létal reste lisible) ;
  - bouton « Nouvelle partie » sans dialogue, sur `EcranMort` ET `EcranFin` ;
  - branche dérivée dans `PartieEnCours`, comme la fin ;
  - garde R5 ;
  - suppression de la branche `isDead` d'`EcranCombat` et de son test « PARTIE TERMINÉE… Quitter le test », sinon le texte orphelin survit.
- Le bandeau n'est plus un critère : il est déjà rendu, une assertion suffit.
- HORS PÉRIMÈTRE : refus dans illisible, `mort_confirmee`, ligne de journal de mort, cas limites navigateur, Rejouer/graine (it4), `AiguillagePartie`, `EndScreen`, tout champ de session.
- Je reporte 3 items (refus, journal, `AiguillagePartie`). J'en ajoute 2 : le log lisible et le bouton sur la fin.

VERDICT
Recevable sous réserve : couture de session retirée, refus dans illisible sorti, round létal lisible.
