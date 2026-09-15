# Tour 2 — `narratif-ia` (contre-lecture)

## 0. Élément neuf, à traiter avant les neuf désaccords

**LA PHRASE DE DÉMO ENCODE LA DÉFINITION QUE LE COMITÉ EST EN TRAIN DE REJETER.** Le cadrage § 2 et `specification.json` écrivent tous deux : « l'auteur voit qu'un indice **que personne ne détient** rend son aventure **injouable** ». Sous la définition retenue (six chemins, compteur unifié), c'est **mesurément faux** : `indice.cendres-tiedes` n'est détenu par personne et l'aventure reste **jouable** (1 producteur → alerte).

Un ouvrier qui lit la fiche de validation et code pour satisfaire la phrase de démo **écrira la règle étroite** — celle que les cinq rôles viennent d'écarter. C'est la duplication d'une règle en deux endroits avec deux vérités, **au seul endroit du plan que tout le monde lit**.

**Correction, une ligne** : « …qu'**aucune source ne produit** rend son aventure injouable. » Le mot *détient* sort de la phrase de démo, de `iterations[3].goal` et du cadrage dans le même geste.

## 1. Contre-lecture

**1.1 — à l'UX, sa règle 2 (goulot) : mesurément fausse.** Elle écrit « Cet indice **n'est détenu que par un seul personnage** ». Le cas mesuré le plus proche est `cendres-tiedes` : **zéro personnage, un delta d'événement**. Le message annoncerait un détenteur **qui n'existe pas**, sur la fixture même de toutes les preuves.

C'est **le trou de la QA reparu dans la prose** : la formulation à deux branches laissait « 0 savoir + 1 delta » tomber entre les branches ; le texte UX fait la même erreur un cran plus loin, en **nommant une famille de source** là où le code en compte six. **Règle de mon poste, non amendable** : *l'énumération des sources dans le message est isomorphe à l'ensemble des producteurs que le code compte* — sinon la définition de « source » vit à deux endroits et dérive au premier ajout. D'où « **un seul chemin** » : un mot qui couvre les six sans en nommer aucune.

Tout le reste de l'annexe UX est **meilleur que ma table** et je m'y range : `localiserEntite` plutôt que ma refonte en capitales, et les libellés de blocs recopiés verbatim des composants.

**1.2 — au PM, motif d'audience : accepté, affiné, et il doit AMENDER, pas gloser.** Trois rôles convergent — **prenez la formulation du tech-lead**, la plus courte, **et ajoutez le discriminant constatable**, sans quoi la clause se re-plaide au troisième cas. Ce que je n'accorde pas : que cette clause s'**ajoute** à la phrase d'it1. **La phrase d'it1 est fausse.** Un motif faux qui survit à côté du bon est la famille BUG-080 exacte.

**1.3 — au tech-lead, R-3 / B-6 : l'orchestrateur a raison, je RETIRE.** Nos deux positions produisent **un seul parcours à tout instant** ; mon rejet visait une ré-implémentation que personne ne propose. Et son motif est meilleur que le mien sur son terrain. **Ce qui subsiste n'est pas un désaccord, c'est une condition de mémoire** : la charge d'extraction vit dans une note de tour 1, et le comité d'it6 lit la **spec**, pas ma note (précédent BUG-082). Deux lignes à écrire : `brain_contracts` corrigé (« itération 4 » → « **par extraction**, jamais ré-implémenté ») — telle qu'elle est, la ligne **invite** exactement ce que mon rejet visait — et la signature recopiée au plan comme **contrat d'extraction**.

**1.4 — B-4 : `depart`, contre l'UX.** L'entité qui **subit** l'absence est le **choix du point de départ**, pas le lieu — le lieu est irréprochable. Allumer `lieux` désignerait une section où rien n'est à corriger.

## 2. Statut de mes sept rejets

| # | Rejet | Statut |
|---|---|---|
| 1 | « orphelin » depuis `savoirs[]` seul | **MAINTENU** — plus personne ne le conteste |
| 2 | Maintien tel quel de la phrase d'audience d'it1 | **MAINTENU** — c'est la condition de mon « recevable sous réserve ». Durcissable sur mon terrain ; je ne le durcis pas, **un veto sur un point convergé est du théâtre** — mais sans l'amendement écrit, c'est le seul point sur lequel je reviens en blocage |
| 3 | Une exception d'audience pour un chemin | **MAINTENU**, sans objet sur le cas d'espèce (le path retenu est `monde.indices[].id`) ; reste vivant comme **doctrine** |
| 4 | Toute règle jugeant la QUALITÉ d'une prose | **DURCI EN VETO** (§ 3) |
| 5 | « sans voix » à un niveau autre qu'`info` | **MAINTENU** — on l'éteint en rédigeant de la prose `ia` ; le monter inverserait les audiences |
| 6 | Deux parcours des producteurs | **RETIRÉ** (§ 1.3). Je retire **aussi ma proposition** d'`atteignabilite.ts` dès it3 |
| 7 | Exclure `climat[].effets_regles` | **MAINTENU**, et son **coût est mesuré à zéro** : les deux fixtures le portent **vide** |

## 3. Le veto durci — formulation mécanique, coût nul

> **Une règle du linter dont le verdict n'est pas décidable par une fonction PURE et TOTALE du `Dossier` n'est pas une règle de linter : c'est un appel de modèle.** Un appel de modèle dans le linter est une sortie sans schéma, non reproductible, qui ferait **changer de couleur un rapport entre deux ouvertures du même dossier**.

Couvre « longueur de `parler` », « voix distinctive », « réplique creuse », **et tout ce que la formule attrapera demain sans qu'on ait à re-plaider**. `controlerDossier` est déjà documentée « pure, totale et synchrone » — le veto ne fait qu'en rendre la violation **nommable**. Personne ne le proposait ; la ligne existe pour que les comités d'it4, it5, it6 et de la n° 16 n'aient pas à la redécouvrir.

## 4. B-5 — je RETIRE ma borne, pour une raison plus forte que le chiffre

Vos 83 % → 75 % suffisaient à me faire douter. Mais `types.ts` l. 271-278 dit le motif réel :

> « La portée **POSÉE À LA CRÉATION** d'un personnage par l'éditeur — **le PLANCHER DU SCHÉMA, jamais une intention d'auteur** […] Il faut donc écrire une valeur, et `'premier'` est celle qu'on écrit. »

Sur le dossier d'un auteur qui n'a jamais touché ce champ, **tous** les personnages sont `'premier'` : la borne est **inerte**. Les 8 points gagnés sont un **artefact de `dossier-reference.json`**, seule fixture où des `'second'` ont été rédigés. Je proposais de conditionner une règle à une valeur **que personne n'a choisie** — et d'écrire au passage une fausseté de runtime : le modèle improvise la voix de **tout** personnage qu'il fait parler.

Ce qui subsiste, et qui n'est pas une borne : le **relevé de volume**, que je soutiens **à une condition** — qu'il soit **ventilé par niveau**, jamais un total. Un total ne dit rien du risque réel, qui est qu'un **bloquant se noie**.

## 5. B-3 — la prémisse exacte, si le PM choisit « bloquant »

> « Le premier tour est le seul que l'auteur ne puisse pas rattraper : le moteur y pose le joueur au lieu de `charpente.depart.lieu_id` sans qu'aucun choix antérieur ait pu l'en détourner, et sans personne présent le modèle n'a que deux issues — tenir un monologue dont rien ne sort, ou **inventer une direction que l'auteur n'a pas écrite** ; l'hypothèse de monde ouvert (KR-224) ne rattrape pas ce cas, car elle dit qu'un lieu déclaré est **atteignable**, jamais que le joueur **sache qu'il existe**. »

C'est le point que je n'avais pas su dire au tour 1 : **KR-224 porte sur l'EXISTENCE d'un chemin, la règle sur la CONNAISSANCE d'une destination.** Rien dans le dossier ne nomme de destination au premier tour — les savoirs n'existent que **portés par un personnage**, et les événements ne sont rattachés à **aucun lieu** (vérifié : `Evenement` n'a ni `lieu_id` ni ancrage spatial). La seule issue non bloquante est que le modèle **invente du monde** — exactement ce que le dossier existe pour empêcher.

**Non négociable quel que soit le niveau** : le message **dit le fait**, il ne dit jamais « votre aventure est injouable ». `jouable` est dérivé dans `RapportControles` et nulle part ailleurs.

## 6. B-7 — `mene_a` à plat : MAINTENU, et le motif est le sens d'erreur

1. **Le pire cas de la lecture à plat n'est pas un silence, c'est une alerte.** Sur un cycle sans autre source, elle donne 1 producteur à chacun → **deux constats**. Le linter ne se tait pas : il dit « un seul chemin » là où la vérité est « aucun ». Un cran en dessous, jamais un silence — **KR-222 ne s'applique donc pas**.
2. **La saturation par `mene_a` seule est une demi-atteignabilité**, et une règle bloquante ne peut pas s'appuyer sur une demi-vérité : elle laisserait l'autre famille de portes (`savoirs[].revele_si`, quatre portes) non saturée. On obtiendrait l'**apparence** d'un calcul d'atteignabilité avec une seule famille modélisée, qu'it6 devrait ensuite réconcilier. La lecture à plat ne prétend rien de tel : propriété **locale et déclarative**.
3. **La saturation n'a pas de preuve admissible à it3** sous les décisions déjà prises.

**Contrepartie acceptée** : le cas est **écrit**, pas implicite — un test nommé, et une ligne d'`open_questions` disant que la saturation d'it6 le fera **délibérément** basculer.

## 7. Les textes — ce qui est de mon terrain, ce qui est libre pour l'UX

**Non amendable (propositionnel, pas stylistique)** : (1) *la force de l'assertion est bornée par l'étendue du prédicat* — « rien ne peut **jamais** » n'est affirmable que parce que le code vérifie les six chemins ; (2) *l'énumération des remèdes est isomorphe aux producteurs comptés* ; (3) « goulot » **ne nomme aucune famille** ; (4) règle 5 : le fait est la **NON-RECONDUCTION**, pas la généricité — « ton générique » est une prédiction esthétique et probablement fausse, un modèle produit volontiers une voix vive ; le fait constatable est qu'**aucun état ne la reconduit d'un tour à l'autre** ; (5) aucun constat ne prononce le verdict global ; (6) registre : constat impersonnel, remédiation à l'impératif — *le linter n'est pas le narrateur*.

**Libre pour l'UX, sans retour de ma part** : les mots et le rythme, la convention du OÙ, les libellés de blocs (mieux sourcés que les miens), la longueur, l'ordre. **Si l'un de mes six points rend une phrase lourde, c'est la phrase qui change, pas le fait.**

## 8. Réserve `climat[].effets_regles`, formulation exacte pour `open_questions`

> Compté parmi les producteurs **par sens d'erreur** — sur une règle bloquante, l'erreur permise est le faux négatif, jamais le faux positif — alors qu'aucun moteur ne peut appliquer un effet de climat (aucun **instant d'application**, aucune idempotence). **Coût mesuré : nul**, les deux fixtures le portent vide. Propriétaire **n° 14**. À rouvrir le jour où un instant d'application est écrit, ou le jour où il est décidé qu'un climat ne portera jamais d'effet : `CHEMINS_DE_DELTAS` perd alors ce site et **la règle le perd avec lui, sans que `controles.ts` soit touché**. C'est la raison de dériver depuis `CHEMINS_DE_DELTAS` plutôt que de re-lister les sites.

## VERDICT

**Recevable sous réserve** — six réserves, toutes écrites et chiffrables : la phrase d'audience **amendée** (jamais glosée) · la **phrase de démo corrigée** partout · les six points propositionnels tenus · la charge d'**extraction** et la signature écrites dans la spec, `brain_contracts` corrigé · la réserve climat en `open_questions` · le test du cycle et sa ligne d'`open_questions`.

**Aucun contrat de sortie IA n'est dû par cette itération** (inchangé) : aucune sortie de modèle consommée, aucun prompt, aucun contexte assemblé, aucune mémoire de session, aucun dé. Ce qu'elle engage de mon poste reste la **frontière d'audience** et le **budget d'attention de l'auteur**.
