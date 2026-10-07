## TOUR 2 — Tech Lead — moteur-fins it4 (4/4)

**Réponses nommées**
- PM+UX (état `graineImposee`) : graine voyage en argument de `onRejouer`, `{generation, graine?}` la porte.
- QA : refuse `EntreeJournal.test.ts` (`decision_modele` n'existe pas), 1 combat suffit.
- `boutonSecondaire` : N fichier séparé, pas R `boutonPrimaire.ts`.
- autoFocus sur Nouvelle partie dans EcranFin : accepté.
- tabIndex du journal : refusé.
- Budget PartieEnCours : 395 lignes.
- L2 docs : maintenu.

**Mes objections du tour 1**
- CA 21 : MAINTENUE (DURCIE EN VETO si formulation QA retenue).
- CA 22 : RETIRÉE.
- Cas limites navigateur : MAINTENUE.

**VERDICT** : APPROUVÉ SOUS RÉSERVE. 2 lots (L1 feature, L2 docs), aucun contrat.
