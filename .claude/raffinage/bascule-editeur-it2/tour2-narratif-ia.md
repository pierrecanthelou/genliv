# Tour 2 — Narratif & IA — bascule-editeur it2

## Réponse nommée — Tech Lead, objection 2 et annexe A.3

**Je confirme l'objection, et je corrige sa moitié technique.** Le `design_contract.registres_de_langue` (« aucun champ ici n'est lu ou entendu par le joueur ») est bien faux dès que `create()` écrit ; c'est le seul endroit de la spec qui devienne mensonger cette itération. Mais le tech-lead écrit en A.3 « `accroche_joueur` **et** `texte_ouverture_joueur` sont de registre joueur — ils sortent vers le modèle au Temps 2 ». Les deux ne sortent pas au même endroit, et l'écart décide de la gravité :

| champ | `destinations.ts` | chemin réel au Temps 2 |
|---|---|---|
| `canon.partage.accroche_joueur` | `ia` | entre dans le **contexte** du modèle. Le modèle peut le reformuler, l'ignorer, le contourner. |
| `charpente.depart.texte_ouverture_joueur` | **`moteur`** (l. 157-160) | **n'atteint jamais le modèle** : le moteur l'émet **verbatim**. |

Conséquence pratique, et c'est elle qui compte : une amorce dans `accroche_joueur` est du mauvais contexte — le modèle la blanchit à moitié. Une amorce dans `texte_ouverture_joueur` est **la première phrase de la partie, affichée telle quelle**, sans qu'aucun modèle ne passe dessus. Il n'y a pas de rattrapage en aval. C'est le champ le plus exposé des quatre, et c'est celui dont l'amorce doit être la plus manifestement non jouable.

Sur le reste de A.3, **convergence** : « chaque valeur se désigne elle-même comme un texte à écrire, jamais une phrase qu'un joueur pourrait plausiblement entendre » est exactement ma proposition 1, écrite en parallèle et dans les mêmes termes. Le propriétaire de détection qu'il nomme (linter n° 7) est le mien. Nous ne sommes en désaccord sur rien ici, sauf sur `nom` — voir ci-dessous.

## Statut de mes objections de tour 1

**(a) « seed valide » ≠ « seed jouable » — MAINTENUE, requalifiée en risque nommé, pas en réserve bloquante.** L'assertion que le tech-lead pose en A.2 (`expect(v.warnings).toEqual([])`, « un seed qui avertit dès sa naissance est un défaut ») est le bon instrument et je la signe des deux mains : c'est la seule assertion de l'itération qui rougira le jour où une famille d'avertissement future tirera sur le seed. Sa limite doit être **écrite dans le plan**, sinon elle sera lue comme une preuve qu'elle n'est pas : `errors: []` + `warnings: []` **ne dit rien** de l'amorce, parce qu'aucun code d'anomalie ne connaît la notion d'amorce. Un seed intégralement composé de textes-modèles est vert sur les deux. La détection appartient à la n° 7, le refus d'ouverture à la n° 9 — nommés, pas construits ici.

**(b) `nom` du lieu semé — DURCIE.** Le tech-lead écrit `lieux: [{ id: LIEU_INITIAL, nom: AMORCE.nom_lieu }]`. Quatre motifs, dont le dernier est celui que je ne lâche pas :

1. `destinations.ts` classe `monde.lieux[].nom` en **`auteur`**. Un `nom` semé est un nom d'auteur que l'auteur n'a pas écrit.
2. `types.ts:88` le dit déjà : « Absent n'est pas vide : un `nom` omis est un état informationnel calme, jamais une alerte. » Le validateur ne le réclame pas — la ligne d'`AMORCE` coûte, elle n'achète rien à la validité.
3. Le repli existe **et il est calculé** : `localiserEntite()` rend « Lieu n°1 (sans nom) » (`identifiers.ts:209-214`). Stocker un nom, c'est figer dans le document un état dérivé qui a déjà son calcul — le défaut KR-013 transposé au niveau du fichier. Et il désynchronise l'affichage : le rapport d'anomalie dirait « Lieu « ⟨à écrire⟩ … » » au lieu de « Lieu n°1 (sans nom) ».
4. **Le motif décisif** : un `nom` semé n'est distinguable d'un nom d'auteur par la n° 7 que s'il porte lui aussi le marqueur. Or un nom marqué s'affichera dans **tous** les sélecteurs d'entités des n° 3 à n° 6 (« Lieu « ⟨à écrire⟩ … » »), là où une absence s'affiche proprement. Les deux seules options cohérentes sont *omettre* ou *marquer* ; marquer coûte plus cher et rend moins bien. **Le seed omet `nom`.** Si l'UX veut plus tard un libellé visible dans la liste des lieux, il se **calcule** avec le même repli — il ne se stocke pas.

C'est aussi mon propre biais que je surveille ici : le lore que l'auteur n'a pas écrit n'existe pas, et un nom de lieu offert par le logiciel est du lore offert.

## Question 1 — export de la constante seule : **ACCEPTÉ**

Je retire `estTexteDeSeed()` de ma proposition, et le motif est celui du tech-lead, pas une concession diplomatique : **zéro appelant aujourd'hui**, et sa forme finale (une inclusion de sous-chaîne, une ligne) sera écrite par son premier lecteur réel, la n° 7, qui saura s'il lui faut un prédicat, un chemin, ou une liste de champs à balayer. L'écrire ici, c'est deviner la signature d'un lecteur qui n'existe pas — le défaut même que la docstring de `DossierService` invoque contre `rename`/`update`.

Je maintiens l'export de **`MARQUEUR_A_ECRIRE`**, et ce n'est pas du YAGNI : il a **deux appelants dans ce lot-ci** — le littéral du seed et le test qui l'assert. Sans lui, le test recopie la chaîne d'amorce, c'est-à-dire exactement le défaut que le tech-lead refuse pour `FORME_ID_DOSSIER` (« ne pas recopier la regex dans un test, KR-117 ») et que la QA relève dans son RISQUE (a). Une constante à deux appelants dans le même lot est un contrat ; une fonction à zéro appelant est une dette. La doctrine du tech-lead et ma proposition disent la même chose, elles tombent juste de part et d'autre de la même ligne.

**Placement — je me range sur sa carte des lots, pas sur la mienne.** La constante vit dans `src/brain/DossierService.ts`, exportée, et `src/brain/dossier/**` reste intouché comme il l'a écrit en annexe B. Motif de fond, pas de commodité : **le marqueur n'est pas une règle du schéma.** Le validateur ne le connaît pas et ne doit pas le connaître — un dossier écrit à la main n'en porte jamais. C'est une propriété de ce que `create()` écrit, donc elle appartient au module qui sème. La n° 7 et la n° 9 l'importeront de `brain/DossierService` ; c'est un `brain/` dans les deux cas.

**L'invariant qui survit, et le seul que je demande d'écrire au plan** : une chaîne, un endroit. Aucune amorce re-tapée nulle part — ni dans un test, ni dans une rédaction UX dupliquée, ni plus tard dans la n° 7. Les valeurs d'`AMORCE` sont la rédaction de l'UX (je ne la revendique pas) sous deux contraintes : chacune contient `MARQUEUR_A_ECRIRE`, et aucune n'est une phrase qu'un joueur pourrait plausiblement entendre — la formulation d'A.3, mot pour mot. Mes quatre textes de tour 1 restent disponibles comme brouillon, pas comme exigence.

## Question 2 — id du lieu semé : **je me corrige, `lieu.premier-lieu` l'emporte**

Je retire `lieu.point-de-depart`. Le tech-lead a raison et le motif mérite d'être écrit, parce qu'il vaut pour toutes les entités semées des n° 3 à n° 6 :

**Un identifiant est permanent ; il doit donc nommer un fait immuable, jamais un rôle mobile.** « Premier lieu créé » est un fait historique qui ne devient jamais faux. « Point de départ » est un **rôle**, porté par `charpente.depart.lieu_id`, et l'auteur le déplacera vers un autre lieu à la première refonte de son ouverture. Ce jour-là, `lieu.point-de-depart` désigne définitivement un lieu qui n'est plus le point de départ — un identifiant menteur, dans les `…_expr` (`lieu_visite`, `lieu_courant_est`), dans le rapport de la n° 7 et dans les journaux de session du Temps 2, sans aucun moyen de le corriger puisqu'un id ne se renomme pas.

Bénéfice secondaire, et il tombe juste : `lieu.premier-lieu` s'accorde avec le repli d'affichage « Lieu **n°1** (sans nom) ». Le même lieu se dit « premier » à deux endroits. Un `nom` semé aurait cassé cet accord — troisième fois que la même ligne d'`AMORCE` pose problème.

**Note pour la QA** (son RISQUE (a)) : sur *cet* identifiant-là, il n'y a pas de regex à recopier. `FORME_IDENTIFIANT` et `estIdentifiantBienForme()` sont **déjà exportés** de `src/brain/dossier/identifiers.ts` — l'assertion s'écrit `expect(estIdentifiantBienForme(d.monde.lieux[0].id, 'lieu')).toBe(true)`, contre la source de vérité, sans rien exporter de neuf. Le débat sur `FORME_ID_DOSSIER` (id **racine**) reste entier et n'est pas de mon domaine.

## Correction de spec à porter (rappel de tour 1, non contesté à ce jour)

KR-178 écrit « repli "Lieu n°1 (sans nom)" si l'auteur n'a rien nommé ». C'est une **sortie de `localiserEntite()`**, jamais une valeur à écrire dans `monde.lieux[0].nom`. Le KR doit être reformulé avant l'ouverture du lot 1, sinon l'ouvrier le lira comme une consigne d'écriture — la note du tech-lead montre que c'est déjà arrivé une fois, sur une lecture pourtant attentive.

## VERDICT

**Recevable sous réserve** — trois réserves, toutes tenables dans le lot 1 tel qu'il est découpé :

1. `MARQUEUR_A_ECRIRE` exporté de `src/brain/DossierService.ts`, présent dans les quatre valeurs d'`AMORCE`, jamais re-tapé (`estTexteDeSeed()` **retiré**, reporté à la n° 7).
2. `monde.lieux[0]` = `{ id: 'lieu.premier-lieu' }`, **sans `nom`**.
3. Écrit au plan : `errors: []` + `warnings: []` ne prouve pas qu'un dossier est jouable ; propriétaires nommés — n° 7 alerte, n° 9 refuse d'ouvrir sur un `texte_ouverture_joueur` encore marqué.

Aucun dé, aucune statistique, aucun inventaire, aucune sortie modèle : **rien dans cette itération n'appelle mon veto**, et je n'en poserai pas au tour 3.

---

Chemins absolus des notes lues à ce tour : `.claude/raffinage/bascule-editeur-it2/tour1-pm-produit.md`, `tour1-tech-lead.md`, `tour1-ux-designer.md`, `tour1-qa.md`.

Trois éléments load-bearing pour l'arbitrage du tour 3, à ne pas perdre : (1) `charpente.depart.texte_ouverture_joueur` est `moteur` et **n'atteint jamais le modèle** — le tech-lead l'a rangé avec `accroche_joueur` en A.3, c'est le seul point factuel à corriger dans sa note ; (2) je **retire** `estTexteDeSeed()` et **maintiens** `MARQUEUR_A_ECRIRE`, placé dans `DossierService.ts` pour laisser `src/brain/dossier/**` intouché comme son annexe B le prévoit ; (3) je **me range sur `lieu.premier-lieu`** et **durcis** l'omission de `nom` — c'est le seul désaccord ouvert entre nos deux notes.
