# dossier-repetition it2 — UX Designer — Tour 2

RÉPONSE AU TECH LEAD — objection 4 / décision « trace des combats : non »
Je ne demande pas la trace `combats[]` : elle est trop chère. Je demande un seul entier `combats_gagnes` dans le rapport. Il est dérivé de la boucle, donc compatible KR-013. Sans lui, un parcours « 3 combats gagnés puis fin » s'affiche comme en it1, et le but « voir affronter les combats » n'a aucune surface. Le coût de réécriture des `toEqual` est déjà payé : l'union change et les tests `combat_ouvert_*` sont réécrits.

RÉPONSE AU NARRATIF — proposition « Combat sans issue contre {monstre.name} après {n} rounds »
- **Je retiens deux points.** `monstre.name` via `BESTIARY_BY_TEMPLATE` : accord, c'est ma proposition, avec le repli « un monstre du bestiaire ». Le mot « round » : `docs/REGLES-DU-JEU.md` l'emploie 11 fois contre 2 pour « tour ». Je corrige donc mon « {BORNE} tours » en « {ROUNDS_MAX} rounds ».
- **Je refuse le présent « meurt ».** Le titre reste au passé composé (« est mort »), comme les autres arrêts. Une voix mixte dans un même rapport est une faute de registre.
- **Usure inter-combats (obj. 2 du Narratif).** La copie ne change pas. « face à {monstre.nom} » désigne le combat fatal et n'affirme pas que le monstre est seul en cause.

STATUT DE MES OBJECTIONS
1. `combat_ouvert` à retirer : retirée, consensus PM/TL/UX et plus aucun producteur. Le panneau n'a plus de branche pour lui.
2. `combats_gagnes` + Badge : maintenue, réduite à l'entier. Badge neutre « 1 combat gagné » / « 2 combats gagnés », absent à 0. Si le comité refuse, `pas` reste le seul signal et le PM doit retirer « voir » du goal. Objection forte, pas un veto.
3. Table motif → copie, un seul `ListRow`, garde `never` : maintenue, alignée sur le switch exhaustif du TL. Un motif sans copie ne compile pas.
4. Nom brut du monstre (`bestiaire.<id>`) : durcie en veto. UX, NIA, TL et PM disent déjà « nom ». Afficher l'identifiant est une faute de registre, quel que soit le motif.
5. Étalon en it2 ou it4 : pas d'objection de design. Si le héros seedé reste, la mort varie avec la graine. Le bouton « Relancer » et le corps « Relancez pour tirer un autre parcours » restent vrais dans les deux cas.

VERDICT TOUR 2 — recevable sous réserve (réserve : nom du monstre résolu, jamais l'identifiant).

## Décisions prises en autonomie faute de spécification
- « Round » ou « tour » dans la copie → « round », terme du doc des règles → si « tour » : le panneau diverge du vocabulaire du doc.
- Entier `combats_gagnes` plutôt que trace complète → entier → si trace : récit plus riche, mais le contrat L2 et le panneau coûtent plus cher et la tranche s'élargit.
- Voix des titres de mort → passé composé, 3e personne, comme les autres arrêts → si présent : voix mixte dans un même rapport.
