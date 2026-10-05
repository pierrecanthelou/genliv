## Narratif & IA · moteur-combat it3 · Tour 2

RÉPONSE À TL — `monstre: string` et PV bruts dans la cible : accepté. Le nom du bestiaire est un registre fermé, pas un nom auteur libre. PV bruts dans la cible, paliers en mots sur le fil : architecture correcte. Test « aucun `\d` n'atteint le contexte » = critère de recevabilité du lot 1.

RÉPONSE À UX — voix « 2e personne pluriel (vous) » : déjà tranchée par `VOIX_JOUEUR` dans worker/index.ts. R5 utilise la même constante.

MES OBJECTIONS :
1. Budget R5 non borné — RETIRÉE. TL définit BUDGET_CARACTERES_COMMENTATEUR + refus trop-long avant fetch.
2. Borne 400 vs 800 — MAINTENUE, assouplie. Soupape : si rejet > 30% en intégration, borne monte à 600 sans second comité. Pas un veto, une soupape écrite.

VERDICT FINAL — recevable sous réserve (soupape 400→600 sur mesure).

## ANNEXE — Contrat de sortie IA R5 révisé (tour 2)
- Nom du monstre accepté (bestiaire, registre fermé).
- Paliers sortis de la cible → classés par l'assembleur brain/.
- Postures, capacité, round : sortis.
- VOIX_JOUEUR partagée avec R3 et R4.
- issue?: Exclude<IssueCombat, 'hero-fled'> pour le round de clôture.
- Comportement échec : inchangé (rejeu une fois, puis silence).
