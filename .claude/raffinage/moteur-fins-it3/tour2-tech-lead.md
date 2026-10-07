# Tech Lead — moteur-fins it3 — tour 2

RÉPONSES CROISÉES
1. NIA brain/ : REFUSÉ. Une constante en brain/ n'a de sens que si une fonction brain/ l'émet. Un seul lecteur, feature/.
2. UX « Échap mentirait » : faux, CadrePartie porte le handler. Texte part car inatteignable.
3. PM log : OUI. combatRejeu.log existe, JournalLigneRound extrait (deux appelants).
4. PM bouton EcranFin : ACCEPTÉ. Prop optionnelle, sans dialogue.
5. QA REGLES-DU-JEU.md : pointeur au plus, pas une copie du libellé.
6. NIA CA R5 : confirmé. combat_en_cours, pas partie_terminee.

MES OBJECTIONS
1. mort_confirmee : DURCIE EN VETO (KR-013).
2. Refus dans illisible : maintenue hors it3.
3. isDead : retrait confirmé.
4. Ligne de journal : maintenue, REJETÉ.
5. AiguillagePartie : MAINTENU.

VERDICT : Recevable, 1 lot, brain/ intact.

ANNEXE : L1 mort-ecran feature. N EcranMort.tsx, N EcranMort.test.tsx, N JournalLigneRound.tsx, N mortDuHeros.test.tsx. R PartieEnCours, AiguillagePartie, CombatEnCours, CombatEnCours.test, EcranCombat, EcranCombat.test, EcranFin, EcranFin.test, reprise.test. Signatures détaillées.
