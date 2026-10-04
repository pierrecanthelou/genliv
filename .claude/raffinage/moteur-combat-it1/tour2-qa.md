# QA — moteur-combat it1 — Tour 2

## Réponses aux questions croisées

**1. moteurSansIA.test.ts (objection 1)** — RETIRÉE. TL confirme qu'il existe et que le lot 2 le fait passer.

**2. Sonde D2-bis (objection 2)** — MAINTENUE ET DURCIE EN VETO. Deux critères d'AT explicites requis :
- Étant donné AT égales et round ≥ 2, quand gardeBonus est tentée, alors elle retourne sans mutation.
- Étant donné gardeBonus refusée, quand on consulte le compteur, alors il est intact.
PM ajoute « ligne REGLES-PLAY d'abord (KR-130) » — d'accord.

**3. Retrait de « manqué »** — ACCEPTÉ. NIA confirme pas de risque, PM retire.

**4. Pending* non appliquées** — VETO. Choix explicite requis :
- Soit un critère AT : « pending* non appliquées ne génèrent aucun log d'action ».
- Soit retirer tout pending* de it1.

## Réponse nommée à UX

D'accord sur « Prochain round → » absent. Journal vide → placeholder dashed avec texte incitatif confirmé.

## Définition de fini it1 (révisée)

Porte verte (tsc + jest), trois critères AT écrits et passants, ligne REGLES-PLAY relue (KR-130), aucun test d'observation sur pending* en code feature, lot 2 fait passer moteurSansIA.test.ts existant.
