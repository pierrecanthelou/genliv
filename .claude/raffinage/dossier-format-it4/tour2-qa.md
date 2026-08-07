# Tour 2 — QA · dossier-format it4

## Reponse nommee 1 — au Tech Lead (C8), sur l'arret du balayage : verifie, et ca ne marche pas tel qu'ecrit

J'ai retrace `feuillesDeLaFixture` (couverture.test.ts:105-120) a la main sur la proposition (2) du tech-lead (`CHEMINS_D_ARRET` gagne un second terme `CHEMINS_DE_DELTAS.map(c => c.path)`). Elle casse le garde qu'elle pretend renforcer — je confirme independamment le constat deja pose par narratif-ia en tour 2, avant de l'avoir lu jusqu'au bout :

- `CHEMINS_D_ARRET.has(normalise)` est teste avant l'entree dans le tableau. Avec `c.path` nu (`monde.quetes[].recompense`, sans `[]`), l'arret tombe sur le TABLEAU entier : une seule feuille, au chemin `monde.quetes[].recompense` — sans `[]`.
- Or destinations.ts:128 porte `monde.quetes[].recompense[]` (avec `[]`), parce qu'aujourd'hui l'element unique de la fixture (`{}`) atteint la branche vide-objet et herite du `[]` de la boucle tableau. Meme chose lignes 142, 147, 166 pour les trois autres chemins.
- Resultat mesure : les quatre lignes suffixees `[]` de `DESTINATION_DES_CHAMPS` deviennent orphelines de toute feuille produite -> le test `aucune ligne morte dans DESTINATION_DES_CHAMPS` (couverture.test.ts:276-282) rougit, pour de vrai, dans l'implementation litterale de la proposition (2).
- Le correctif de narratif-ia (suffixer chaque chemin de `CHEMINS_DE_DELTAS` par `[]` avant de l'ajouter a `CHEMINS_D_ARRET`) est juste : l'arret tombe alors une iteration plus tard, au niveau de CHAQUE ELEMENT du tableau (normalise avec son `[]`), ce qui (a) fait correspondre le chemin produit a la ligne existante de destinations.ts, (b) laisse le walker ne jamais voir l'interieur d'un delta peuple, et (c) preserve la corruption PAR ELEMENT (deux deltas dans `resolutions[].consequence` restent deux feuilles distinctes, donc deux occasions de rougir).
- Corollaire que j'ajoute, non encore ecrit ailleurs : pour `monde.conditions.climat[].effets_regles` — vide par la doctrine C9 —, le tableau ne contient aucun element, le nouvel arret suffixe ne matche jamais `normalise` (qui reste `...effets_regles`, sans `[]`, avant d'entrer dans le tableau vide), et la feuille produite est `...effets_regles` SANS `[]`. La ligne destinations.ts:147 doit donc etre renommee SANS son `[]` pour ce chemin precis — ce n'est pas une ligne en plus, c'est la meme ligne, retaillee. Une ligne qui garderait le `[]` mourrait par construction dès que la fixture a `climat[].effets_regles: []`.

Exigence que j'ajoute au plan (test T13 de l'annexe) : une preuve par sonde, meme doctrine que BUG-051 — ecrire d'abord la version sans suffixe, constater que "aucune ligne morte..." rougit, puis corriger avec le suffixe et constater le retour au vert. Sans cette sonde, la correction est un raisonnement, pas un fait etabli par l'instrument — exactement ce que ce comite refuse d'accepter sur parole depuis BUG-051/KR-174.

## Reponse nommee 2 — a l'UX (C3/C4 tour 1), sur les quatre operandes entiers : je confirme son propre retrait, sur mon terrain

L'UX a retire ses quatre entrees en tour 2 sur la base de KR-130 (aucune section ne porte la magnitude). J'ajoute l'argument qui m'appartient et qui tient meme si une section existait demain : KR-165 exige que toute borne de longueur ou de nombre du schema soit une constante NOMMEE, testee a la limite et a limite+1. Un `modifier_pv: { delta, valeur: number }` sans bornes ne peut recevoir AUCUN test a la limite — il n'y a pas de limite nommee a tester. Un critere qui dirait « la magnitude est acceptee » ne serait pas observable au sens de mon mode A (aucun resultat qu'un test peut constater comme faux). C'est donc un second motif, independant du premier, pour refuser tout operande entier en it4 — meme si la doc gagnait sa section demain, il faudrait encore attendre que la borne y soit nommee. Je rejoins donc narratif-ia, UX et tech-lead : DELTAS schema 1 = 4 entrees, slots de reference seuls.

## Statut de mes objections du tour 1

| # | objection | statut |
|---|---|---|
| 1 | relations/presences/acces/mene_a hors but ecrit | MAINTENUE, pas encore satisfaite — plan.iterations[3].goal (ligne 143 de specification.json) porte encore les quatre mots a l'heure ou j'ecris. Convergence 5/5 sur le fond ; condition de recevabilite tant que le fichier n'est pas corrige, comme le note pm-produit. |
| 2 | BUG-050 en critere explicite | SATISFAITE — open_questions (ligne 308) le porte deja nommement comme condition fermee de la QA d'it3 ; pm-produit l'integre au but reecrit. |
| 3 | matrice de rejet ecrite avant le code (KR-158) | MAINTENUE, livree en annexe ci-dessous, revisee — deux corrections depuis le tour 1 : (a) le code n8 se scinde en deux causes distinctes, suivant la trouvaille de narratif-ia ; (b) les codes sont ceux converges en C6/C4 (`delta`, pas `op`). |
| 4 | code neuf pour operation delta inconnue a trancher | RETIREE en l'etat — ma proposition `element-liste-invalide` tombe (C6, ci-dessous). Je me range sur `element-non-objet`. |
| 5 | garde estCleDe obligatoire, testee par test-grep | MAINTENUE, convergence 3/3 (moi, tech-lead, narratif) — aucune objection ne la rouvre. |

Aucune de mes objections tour 1 ne devient un veto : toutes sont soit satisfaites, soit absorbees par une correction deja ecrite par un autre role et que je ratifie.

## C5 — mon arbitrage principal : la derivation du tech-lead est testable, et je change de position

Mesure demandee : combien de chemins la derivation produit-elle aujourd'hui ? COLLECTIONS_IDENTIFIEES (identifiers.ts:96-107) = 10 chemins. LISTES_REQUISES (tables.ts:163-168) = 4 chemins, dont un (monde.conditions.climat) est un doublon exact d'une entree de COLLECTIONS_IDENTIFIEES. Union dedupliquee = 13 chemins.

Est-ce testable aussi finement qu'une table dediee ? Je reponds oui, et mieux, ce qui me fait retirer ma preference de tour 1 pour une table dediee (partagee avec l'UX).

1. Le mecanisme de sonde existe deja dans le depot. couverture.test.ts sait deja prouver qu'une table derivee n'a pas de seconde liste (le test l arret du balayage est derive de FAMILLES_DE_CONDITIONS, volet b, grep sur les litteraux _expr dans le fichier source). Le meme test-grep s ecrit pour la derivation BUG-050 : je l exige en annexe (T16).

2. La propriete d heritage futur (une collection ajoutee en n4/5/6 herite du garde) est verifiable AUJOURD HUI, mais pas au sens ou le tech-lead la presente. Elle n est pas verifiable comme garantie produit (n4/5/6 n existent pas), mais elle est verifiable comme propriete de la fonction de derivation elle-meme : un test peut construire une table COLLECTIONS_IDENTIFIEES synthetique augmentee d une entree fictive et constater que la sortie de la derivation grandit d autant, exactement le patron deja utilise pour prouver la discriminance de estInstancie (couverture.test.ts:320-329, sur contre_mesures, une collection qui n existe pas encore). C est un test qui existe deja pour une raison voisine ; il s etend, il ne s invente pas.

3. Ce que ni la table ni la derivation ne peuvent garantir : que n4/5/6 pensera bien a ajouter sa ligne a COLLECTIONS_IDENTIFIEES/LISTES_REQUISES. Mais c'est la ou la derivation gagne face a ma table dediee de tour 1 : ces deux tables sont deja un point de passage oblige pour d'autres raisons (resolution d'identifiants, BUG-049) - identifiers.test.ts:49 fixe deja toHaveLength(10) comme discriminant. Une collection oubliee casse deja un test existant, pour une raison independante de BUG-050. Une 5e table dediee, elle, n'aurait aucune autre raison d'etre maintenue : elle serait le seul endroit ou l'oubli serait possible sans qu'aucun autre test ne le voie. La derivation adosse le garde de BUG-050 a une discipline deja forcee ailleurs ; ma table de tour 1 en aurait cree une nouvelle, non forcee.

Ce qui reste non verifiable par aucun instrument, a ecrire tel quel dans la revue plutot que de le compter comme acquis : que n4/5/6, en ajoutant sa collection, choisira le bon espace / la bonne table (COLLECTIONS_IDENTIFIEES vs LISTES_REQUISES vs aucune des deux si elle a une bonne raison d'exclure ses elements). C'est une revue humaine a ce moment-la, pas un jest d'aujourd'hui.

Verdict C5 : je retire ma preference pour une table dediee. La derivation est recevable a condition que (a) le test-grep « pas de seconde liste » (T16) existe, (b) le test d'extension synthetique (T15) existe, (c) la scission des codes que narratif-ia a trouvee (element-non-objet pour les 13 chemins generiques, delta-malforme pour un element non-objet DANS un des 4 chemins de deltas) est ecrite dans le plan et non laissee a l'arbitrage de l'ouvrier.

## C13 - les trois blocs sont verifiables ensemble, sous reserve de ne pas confondre deux echelles

Oui, verifiables ensemble, et ma propre matrice de tour 1 le demontrait deja sans le dire : ses 8 lignes couvraient (a) DELTAS (lignes 1-4), (b) les trois champs de savoirs[] (lignes 5-7) et (c) BUG-050 (ligne 8) dans la meme matrice. Le but reecrit par pm-produit (« voir refuse tout effet ou savoir mal forme... ») porte les trois sous un seul verbe, ce qui est observable au sens de mon mode A.

Precision que j'ajoute pour eviter une confusion en revue finale : le nombre de criteres d'acceptation (bullets du plan, a garder court) et le nombre de tests nommes (implementation, peut legitimement depasser 8) sont deux echelles differentes. Ma liste definitive ci-dessous compte 21 tests nommes pour trois criteres d'acceptation - ce n'est pas un depassement, c'est la granularite normale d'un test unitaire par cause. Ne pas lire le plafond de lots/lignes du tech-lead comme un plafond de tests.

## C12 - un predicat que rien ne peut rendre vrai : constatable par Grep aujourd'hui, pas verrouille par un test - je referme l'ecart

J'ai verifie independamment ce que narratif-ia a mesure : une recherche sur jalons_atteints, indices_connus, evenements_consommes dans src/ ne remonte aucune occurrence hors commentaires/JSDoc/fixture/spec - ni dans src/player/** (le seul moteur qui existe), ni ailleurs. C'est un fait, verifiable la, tout de suite, par n'importe qui, mais c'est une lecture ponctuelle, pas un test commis.

Reponse directe a la question posee : aujourd'hui, c'est une revue humaine (Grep), pas un instrument de la porte de commit. Le test de fermeture lecture/ecriture que narratif-ia propose (tout refKinds de DELTAS inclus dans l'union des refKinds de PREDICATES) est un bon test, mais il ne teste pas cette propriete-la : il teste que le vocabulaire d'espace de noms est coherent entre lecteurs et ecrivains, pas que le champ vise a un site d'ecriture reel. Il n'aurait pas empeche reveler_indice/atteindre_jalon d'entrer avec un champ jamais ecrit - narratif le reconnait elle-meme (ses deux deltas n'ont pas ce defaut au sens du test de fermeture, et pourtant monde.jalons_atteints n'existe pas).

Ce que j'ajoute, pour transformer le constat en decision tracee plutot qu'en fait qui s'oubliera : un test-grep de reservation, meme doctrine que celui de l'ANNEXE C narratif sur l'export de DELTAS (KR-169) - aucun fichier de src/player/** n'ecrit monde.jalons_atteints, monde.indices_connus ou monde.evenements_consommes aujourd'hui. Non bloquant pour it4 (le defaut est anterieur, herite de jalon_atteint/indice_connu livres en it3), mais si reveler_indice/atteindre_jalon entrent dans DELTAS en it4 comme le propose l'ANNEXE A du narratif, ce test-la devient la seule chose qui empeche le trou de rester invisible jusqu'au tour 40 - le jour ou n9 ecrit l'un des trois champs, ce test-grep doit etre supprime pour committer, ce qui force la decision au lieu de la subir. Je le demande en test, pas en commentaire (T21, annexe).

## C6 - un nom : element-non-objet

Je retire element-liste-invalide (tour 1). Motif propre a mon terrain, independant de celui de l'UX (« malforme » reserve a la forme d'un delta) : le message qu'un test asserte doit nommer la cause exacte pour que issue.code seul suffise a discriminer sans lire la phrase francaise (doctrine deja ecrite dans issues.ts:26-28, « un code par CAUSE »). « Liste invalide » aurait laisse un lecteur croire a un defaut de longueur ou de type de conteneur ; « non-objet » nomme exactement ce qui est corrompu : l'element, pas la liste. Convergence 4/4 avec tech-lead, UX, narratif.

---

## ANNEXE - matrice de rejet definitive

| # | Entree fautive | Code | Canal | location nomme |
|---|---|---|---|---|
| 1 | Element non-objet dans une des 13 collections derivees (COLLECTIONS_IDENTIFIEES union LISTES_REQUISES) - ex. savoirs: ["texte"], plan_actions: ["texte"] | element-non-objet | bloquant | l'entite porteuse (ou repli indexe) + l'index fautif - BUG-050 |
| 2 | Element d'une des 4 listes de CHEMINS_DE_DELTAS qui n'est pas un objet, OU qui est un objet sans cle "delta" valide, OU qui porte une cle inconnue | delta-malforme | bloquant | l'entite porteuse (jalon/quete/evenement - climat exclu, sa liste est vide par C9) - scission trouvee par narratif-ia, ratifiee |
| 3 | Delta bien forme (delta + cibles) dont le champ delta n'est pas une cle de DELTAS | delta-inconnu | bloquant | l'entite porteuse (nom) + la valeur fautive |
| 4 | Cle heritee du prototype (toString, constructor, proto, hasOwnProperty) en position de "delta" OU de cible - jamais ok:true | selon position, code 2/3 ou 5/6 | bloquant | regression nommee directe de BUG-053/KR-175 |
| 5 | Cible d'un delta mal formee (mauvais espace de noms/forme) | identifiant-invalide (reutilise) | bloquant | l'entite porteuse + l'id fautif |
| 6 | Cible d'un delta bien formee mais introuvable | reference-pendante (reutilise) | bloquant | l'entite porteuse + l'id fautif |
| 7 | savoirs[].indice_id pointant un indice absent | reference-pendante | bloquant | le personnage porteur |
| 8 | revele_si.contrepartie.objet_id pointant un objet absent | reference-pendante | bloquant | le personnage porteur |
| 9 | revele_si.apres_indice_id pointant un indice absent | reference-pendante | bloquant | le personnage porteur |

## ANNEXE - liste definitive des tests nommes

Unitaires - deltas.test.ts / validate.test.ts

1. DELTAS compte 4 entrees - jumeau discriminant de « PREDICATES compte sept entrees » (it3) - KR-117/165.
2. un element non-objet d'une des collections derivees est refuse par element-non-objet, nommant le porteur et l'index - couvre au moins savoirs, plan_actions, resolutions - KR-158, regression BUG-050.
3. un element non-objet d'une liste de deltas (jalons[].effet) est refuse par delta-malforme, jamais element-non-objet - discriminance de la scission narratif-ia - KR-158.
4. une cle inconnue sur un objet-delta bien forme est refusee par delta-malforme - jumeau exact de "refuse une cle inconnue sur un noeud" (expr.test.ts:62) - KR-158, contrepartie de l'arret derive (C8).
5. un delta dont le champ "delta" n'est pas une cle de DELTAS est refuse par delta-inconnu, nommant l'entite et la valeur - KR-158.
6. DELTAS['toString'] et DELTAS['constructor'] ne resolvent jamais une operation via la chaine de prototype - KR-175, regression nommee directe BUG-053.
7. une cible de delta mal formee est identifiant-invalide - unitaire.
8. une cible de delta bien formee mais introuvable est reference-pendante - unitaire.
9. savoirs[].indice_id pointant un indice inexistant est bloquant, nommant le personnage porteur - unitaire.
10. revele_si.contrepartie.objet_id pointant un objet inexistant est bloquant, nommant le personnage porteur - unitaire.
11. revele_si.apres_indice_id pointant un indice inexistant est bloquant, nommant le personnage porteur - unitaire.
12. test de fermeture lecture/ecriture : tout refKinds de DELTAS est inclus dans l'union des refKinds de PREDICATES (formulation narratif-ia, ratifiee) - unitaire, rend le veto « aucun refKinds ne porte bestiaire » derive plutot qu'assertee a part.

Instrument de couverture - couverture.test.ts

13. Sonde obligatoire (discriminance C8) : implementer d'abord CHEMINS_D_ARRET avec les chemins nus de CHEMINS_DE_DELTAS (sans suffixe), constater que "aucune ligne morte dans DESTINATION_DES_CHAMPS" rougit (verifie par moi, reponse nommee 1) ; corriger en suffixant chaque chemin par [] et constater le retour au vert. Le journal d'iteration porte les deux captures (rouge puis vert), meme doctrine que BUG-051.
14. couverture.test.ts : assertion symetrique de "l arret du balayage est derive de FAMILLES_DE_CONDITIONS", pour CHEMINS_DE_DELTAS - (a) comportement : aucun chemin interne (cle "delta" ou "cibles[]") n'apparait dans cheminsDeLaFixture() ; (b) source : aucune seconde liste litterale de chemins de delta dans le fichier.
15. Discriminance : retirer synthetiquement une entree de COLLECTIONS_IDENTIFIEES (ou LISTES_REQUISES) fait rougir un cas connu de la derivation BUG-050 - jumeau exact de "la 4e assertion rougit sur un chemin de table absent de la fixture" (couverture.test.ts:320-329), applique a la derivation plutot qu'a une table.
16. Test-grep : la derivation BUG-050 lit COLLECTIONS_IDENTIFIEES.map / LISTES_REQUISES.map, jamais un litteral recopie des 13 chemins - meme patron que le volet (b) de "l arret du balayage est derive de FAMILLES_DE_CONDITIONS".
17. couverture.test.ts : la ligne destinations.ts de monde.conditions.climat[].effets_regles est reecrite SANS son suffixe [] (climat vide, C9) ; assertion que ce chemin precis, sans suffixe, a une destination moteur.
18. Docstring de couverture.test.ts, section "CE QUE LE BALAYAGE NE COUVRE PAS" : la mention BUG-050 est corrigee (mecanisme reel nomme - derivation, pas "table dediee"), PAS retiree - je corrige ici ma propre proposition de tour 1 ("retirant la mention") : la limite structurelle du balayage (il corrompt des feuilles, jamais des elements de liste) reste vraie apres le fix, seul le mecanisme qui compense change de nom.

Test-grep transverses

19. Aucun acces a DELTAS ne passe par "in" ou un index direct hors estCleDe - KR-175, convergence 3/3.
20. DELTAS n'est referencee par aucun fichier hors src/brain/dossier/ et n'est pas re-exportee par brain/index.ts (seuls Delta/DeltaId sortent) - KR-169, ANNEXE C narratif.
21. Reservation nouvelle (ma contribution, reponse C12) : aucun fichier de src/player/** n'ecrit monde.jalons_atteints, monde.indices_connus ou monde.evenements_consommes - non bloquant pour it4, mais requis si reveler_indice/atteindre_jalon entrent dans DELTAS (ANNEXE A narratif), pour que n9 supprime le test au lieu de decouvrir le trou.

## Non verifiable par aucun instrument existant

- relations, presences, acces, mene_a - non observables par construction, hors it4 (convergence 5/5).
- La fidelite de l'inventaire DELTAS a actionEngine.ts/usePlaySession.ts au-dela de ce qu'un test unitaire nomme explicitement - lecture humaine a chaque revue, pas un instrument permanent.
- « BUG-050 traite avant la premiere ligne de code » - aucun horodatage exploitable sur un arbre non commite.
- « Un delta est applique par le moteur, jamais injecte » - l'evaluateur n'existe pas avant n9 ; invariant non testable avant son existence.
- C9 : que climat[].effets_regles n'a structurellement aucun delta admissible - rien dans validateDelta ne l'empecherait mecaniquement d'accepter un donner_objet sous un climat aujourd'hui ; c'est une correction de la checklist d'it5 (documentation), pas une regle testee par le validateur d'it4.
- Que n4/5/6 choisira le bon registre (COLLECTIONS_IDENTIFIEES vs LISTES_REQUISES vs aucun) en ajoutant sa collection - revue humaine au moment venu, aucun instrument d'it4 ne peut l'anticiper.
- Que quelqu'un pense a supprimer le test-grep de reservation (T20, T21) plutot que de le laisser bloquer une commit legitime en n9/n11 - c'est le comportement voulu ("prendre la decision"), mais sa bonne execution reste une revue, pas un fait mecanique.

## Verdict

Recevable sous reserve : (1) but reecrit dans specification.json avant tout lot (objection 1, non encore satisfaite) ; (2) scission des codes element-non-objet / delta-malforme ecrite dans le plan, pas laissee a l'ouvrier ; (3) sonde rouge/vert de l'arret derive (T13) journalisee ; (4) test de fermeture lecture/ecriture (T12) et test-grep de reservation src/player/** (T21) au plan ecrit. Aucun veto de mon fait.
