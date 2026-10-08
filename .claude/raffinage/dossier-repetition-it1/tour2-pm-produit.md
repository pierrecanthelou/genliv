# dossier-repetition it1 — PM — Tour 2

RÉPONSE À Tech Lead, objection 1 (veto `DomaineAlea`). Accepté, borné. Sans aléa, « Relancer » mentirait. Le repli déterministe vide l'itération de sa valeur. L1 contient UNIQUEMENT le littéral `'repetition'` dans `alea.ts` et son test d'indépendance. Correction `alea.ts` (et non `rng.ts`) dans la spec. Adopte aussi objection 2 : « Rejouer à l'identique » sort sans report.

RÉPONSE À UX, objection 2. L'état « refus ouverture à écrire » est inatteignable derrière `jouable` (`controles.ts:169`). Écran mort, coupé. Trois états : invite, refus unique (lien `bloquants[0].section`), résultat.

RÉPONSE À Narratif-IA. Héros synthétique = bouchon non observable en it1 (combat ouvert arrête la boucle). Accepte affectation séquentielle, sans test d'équilibre. Étalon d'it2 le remplacera.

MES OBJECTIONS
1. Périmètre (plus de 8 critères) : **MAINTENUE**. 8 critères, 4 motifs (fin, impasse, combat_ouvert, pas_max). Mort/combat_sans_issue → it2. Lieux/PNJ → it3.
2. « Aucun blocage » positif : **RETIRÉE**. UX l'a absorbée, copie factuelle (h) la couvre.
3. `ouverture_a_ecrire` en état propre, Échap : **RETIRÉE**. Preuve TL, UX acte.

Ajouts : L1, témoin « graines différentes → parcours différents », témoin KR-312.
Retraits : « Rejouer à l'identique », 4e état, Échap.

VERDICT FINAL : **recevable sous réserve**. Levée : spec réécrite avec 8 critères ventilés, L1 avant L2, 3 états.

Décisions en autonomie :
- Graine initiale = 1, Relancer = +1 (pas d'horloge).
- `pas_max` = 4e motif (sinon PAS_MAX=20 sans témoin nommé, KR-315).
- Héros it1 = bouchon séquentiel sans table dorée.
- « Rejouer à l'identique » supprimé sans report.
- Refus unique `dossier_injouable`.
