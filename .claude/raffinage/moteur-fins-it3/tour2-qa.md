# QA — moteur-fins it3 — tour 2

RÉPONSES CROISÉES
- TL isDead : retirée. Pas du code mort, mais retrait accepté si chemin inatteignable.
- PM AiguillagePartie : déjà implémenté pour finAtteinte (reprise.test.tsx:120). Pas de nouvelle implémentation pour it3.

MES OBJECTIONS
1. REGLES-DU-JEU.md : DURCIE EN VETO. Section « Mort du héros » obligatoire avant commit. KR-130.
2. Reprise post-mort : RETIRÉE. Cas testé en intégration.
3. Bandeau : RETIRÉE. BandeauHeros.test.tsx couvre pvLive=0.
4. R5 test : RETIRÉE. spy mockDemander, précédent existant.

VERDICT : Recevable sous réserve de REGLES-DU-JEU.md.
