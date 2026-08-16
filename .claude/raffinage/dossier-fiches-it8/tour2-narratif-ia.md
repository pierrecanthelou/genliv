## Note — TOUR 2, rôle Narratif & IA — `dossier-fiches` it8

**Tech Lead, objection 2 — `affinite` / décision A.** Non, KR-193 ne suffit pas : il dit que ce n'est pas une règle de jeu, il ne dit rien d'un producteur. Ce qui exempte tient en deux points. (1) La décision A garde le **document** : `tier` se serait persisté dans chaque dossier d'auteur, sans migration (schéma:1, KR-160), avec une sémantique que personne ne lit. `affinite` ne franchit jamais le document — registre de code, zéro clé de schéma, zéro ligne de `destinations.ts`. (2) UX lui donne un consommateur **dans it8** : le label `COURAGE (CA)`. Condition : si ce rendu tombe, le champ tombe avec lui. Union locale confirmée, jamais `Characteristic` — c'est le marqueur visible que le jour KR-130 n'est pas venu ; l'import serait la duplication de règle que je bloque.

**UX — coexistence.** Les deux textes répondent à deux questions distinctes, mais ma phrase ne se répète pas sous six curseurs : elle **fusionne dans ta légende unique** (annexe).

**QA — `cede_si`.** Hors-instrument confirmé, comme `Relation.secret` en it5 : la ligne `'…cede_si': 'ia'` est sous `couverture.test.ts` (l'audience) ; le prédicat de rôle n'a aucun vocabulaire dans `destinations.ts`, il appartient à la n° 10. Pas de test-grep de présence : son seul mode de panne est une coquille, et nommer un prédicat pour ne prouver qu'une chaîne est le motif KR-199. Si tu en écris un, qu'il compare l'**identité** des deux copies sur les **trois** champs (`secret`, `revele_comment`, `cede_si`) — ton instrument, pas ma réserve.

**PM** — reformulation acceptée.

**Objection 1** (destination réelle de `cede_si`) — **MAINTENUE**, inchangée.
**Objection 2** (`affinite` sans consommateur) — **RETIRÉE** : consommateur livré dans le même lot, et le champ ne touche pas le document.
**Réserve** (pas une objection neuve) : borne d'interface acceptée si le JSDoc de `parler` dit la suite — au-delà de `PARLER_REPLIQUES`, la n° 10 **tronque**, elle n'échoue pas. Une borne qui n'existe qu'au clavier ne borne pas le contexte (KR-165).

**VERDICT — recevable sous réserve** : objection 1 tenue telle quelle, légende unique, ligne de troncature au JSDoc de `parler`.

---

### Annexe (hors quota) — les deux textes exacts

Légende unique de la sous-section CURSEURS (remplace la version UX + ma phrase, un seul site) :

> `Curseurs de caractère — jamais lus par le narrateur ; l'affinité entre parenthèses colore la voix, elle ne modifie aucun jet.`

JSDoc de `Caractere.parler` (`C:\Users\pierr\Desktop\genliv\src\brain\dossier\types.ts`), en plus de la ligne « échantillon de VOIX, jamais une réplique à réciter » :

> Au plus `PARLER_REPLIQUES` répliques — **borne d'interface, non validée**. Un document qui en porte davantage se rend en entier ; c'est l'assembleur n° 10 qui **tronque à l'injection**, il n'échoue pas.

Aucun contrat de sortie IA en it8 : le contrat R4 · acteur reste reporté n° 12 (`open_questions` de `C:\Users\pierr\Desktop\genliv\src\features\dossier-fiches\specification.json`, détail dans `C:\Users\pierr\Desktop\genliv\.claude\raffinage\dossier-fiches-it5\tour1-narratif-ia.md` § F).
