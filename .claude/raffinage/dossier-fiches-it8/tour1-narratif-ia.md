## Note — TOUR 1, rôle Narratif & IA — `dossier-fiches` it8

**RISQUE** — Première tranche dont les champs n'existent QUE pour contraindre le modèle. Une contrainte injectée au mauvais rôle devient une soluce : `cede_si` lu par le narrateur, c'est le moteur qui livre la porte de sortie du PNJ avant que le joueur n'ait rien tenté. Rien ne le rattrapera plus tard — aucun assembleur n'existe, et seul ce que it8 écrit sur le champ survit jusqu'à la n° 10.

**OBJECTION** — 1) « `caractere.cede_si` = destination `ia` » est faux par omission. Ce n'est pas `si_bloque` (conditionné à un fait que le moteur CONSTATE ; `cede_si` n'a rien de constatable — lui exiger un prédicat de session lui inventerait une horloge qu'aucun champ ne porte), et pas non plus un `ia` nu. C'est le cas `Relation.secret` : conditionné au RÔLE. 2) `affinite` n'a aucun consommateur en it8 — c'est la « forme sans producteur » refusée à `tier` (décision A). Si c'est de la présentation (KR-193), qu'elle se présente.

**PROPOSITION** — (a/b) `cede_si` : `ia`, injecté sans condition de TEMPS, **réservé au rôle acteur du porteur**. Prédicat écrit à DEUX SITES mot pour mot (JSDoc `Caractere.cede_si` + commentaire de sa ligne dans `destinations.ts`), texte en annexe, nulle part ailleurs — et **aucune** règle dans `validate.ts` : contrairement à `si_bloque`/`duree`, il n'a besoin d'aucun champ compagnon pour être atteignable. `parler[]` et `jamais` restent `ia` nus, inconditionnels : ils évitent une faute, ils ne livrent pas une issue.
(c) Confirmé, aucune ligne de `docs/REGLES-DU-JEU.md` à ouvrir : le document ne définit aucun jet social ni opposé, et `Revelation.jet.carac` est celui du HÉROS. KR-130 se déclenchera le jour où un chiffre sort d'`affinite`, pas avant.
(d) Aucun 3e élargissement : l'entrée « libellés dérivés » nomme déjà it8 et le curseur « 7-8 ». En revanche son décompte « les 8 déjà livrés + les 3 entrants d'it2 » est périmé depuis it4 — it8, dernière itération, le recompte UNE fois depuis `DESTINATION_DES_CHAMPS`, jamais un littéral.
(e) `affinite` rendue en indice sous chaque curseur (« colore la voix, ne modifie aucun jet ») ; `parler[]` : JSDoc « échantillon de VOIX, jamais une réplique à réciter ».

**VERDICT** — **recevable sous réserve** : (a/b) et (e) ; (c) et (d) sont des confirmations, pas des réserves.

---

### Annexe (hors quota) — contrat d'injection

**Pas de contrat de sortie IA en it8** : aucun appel au modèle n'existe au Temps 1, et le contrat R4 · acteur (`{replique, indices_reveles, delta_confiance, jet_demande?, intention_suivante}`, rejeu puis repli déterministe à l'échec de validation) est **déjà reporté n° 12** avec son renvoi — `src/features/dossier-fiches/specification.json`, `open_questions`, détail dans `C:\Users\pierr\Desktop\genliv\.claude\raffinage\dossier-fiches-it5\tour1-narratif-ia.md` § F. Je ne le redouble pas ici : ce serait exactement le second site que ce report interdit.

Ce qui doit être écrit par it8, à coller **mot pour mot** au JSDoc de `Caractere.cede_si` (`C:\Users\pierr\Desktop\genliv\src\brain\dossier\types.ts`) **et** au commentaire de sa ligne (`C:\Users\pierr\Desktop\genliv\src\brain\dossier\destinations.ts`) :

> `cede_si` n'entre **que** dans le contexte de l'appel **acteur du personnage QUI LE PORTE**. Il n'entre **jamais** dans le contexte du **narrateur**, ni dans celui d'un **autre** personnage, ni dans celui de l'**arbitre**. Aucun fait de session ne le conditionne : dans cet appel-là il est injecté **dès le premier tour**, sans que le moteur ait rien à constater — il n'a ni jumeau `…_expr`, ni ligne dans `FAMILLES_DE_CONDITIONS`, et rien à quoi `validateDossier` puisse l'adosser.

Ce que ce prédicat règle, et qu'une tautologie (« une didascalie ne va qu'à qui doit la jouer ») ne réglait pas :

- **le narrateur est exclu au même titre qu'un autre PNJ** — même motif que `camp` et `relations[].secret` : un narrateur qui connaît le point de rupture y conduit le joueur (« tu sens qu'il flancherait si… »), ce qui transforme un levier de scène en indication de parcours ;
- **il n'est PAS gaté dans le temps**, à la différence de `si_bloque` et de `revele_comment` : le moteur ne peut constater aucune reddition, et un gating de session ferait décider au **modèle** quand la condition est remplie — c'est-à-dire lui ferait décider d'un état. Injecté d'entrée à l'acteur, il fait l'inverse : il **borne** la reddition au lieu de la laisser improviser ;
- **`jamais` et `parler[]` ne prennent aucun prédicat** : la granularité par rôle des champs `ia` ordinaires appartient à l'assembleur n° 10 (en-tête de `destinations.ts`). Un garde-fou et un échantillon de voix lus par le narrateur coûtent zéro spoil ; les omettre coûterait une contradiction de fiction ;
- **entrée injectée de l'appel acteur** : inchangée par it8, sauf ces trois champs. Jamais `curseurs.*` (nombres bruts) ni leur paraphrase, tant que la n° 10 n'a pas livré le libellé dérivé **par le code** et sa ligne d'audience — corollaire déjà tenu par it3/it5, non redupliqué.
