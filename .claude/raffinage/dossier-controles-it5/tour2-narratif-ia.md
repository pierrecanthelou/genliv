# TOUR 2 — Narratif & IA — `dossier-controles` itération 5

**RISQUE** — mesuré par lecture des **quatre** `warnings.push` de `validate.ts` (l. 697, 728, 764, 806) : **aucun avertissement ne porte `entityId`** — cinq arguments à `anomalie`, jamais six, alors que le sixième existe. Et **cinq des dix messages sont des constantes** : « Le champ « si_bloque » … » n'interpole rien. Leur `location` vaut « Personnages » (×3), « Objectifs » (×2), « Fins », « Jalons », « Climat », « Canon (MJ) », « Canon (partagé) ». Conséquence non vue au tour 1 : deux personnages dont l'étape manque sa `duree` produisent **deux lignes identiques dans leurs trois étages** — même OÙ, même QUOI, même pastille, même destination de clic. **Sept des dix sites** peuvent produire ces jumelles ; seuls `canon.mj` et `canon.partage` (singletons) et `revelation-sans-porte` (qui désigne son savoir) en sont exempts. Un rapport où l'auteur ne sait pas **laquelle** des deux lignes corriger coûte plus qu'un rapport muet.

**OBJECTION** — **R7 du tech-lead, sa seconde moitié : « `location` repris tel quel ».** M1 a cassé la moitié `message` ; la moitié `location` n'a été mesurée par personne. Elle importe le OÙ de **l'écran d'import** — un seau grossier, choisi pour une liste sans navigation — dans un étage dont `controles.ts` l. 72-79 documente un **autre** contrat : « le repère que l'auteur cherche en premier », entité nommée par `localiserEntite`. Reprendre `location` n'évite pas une seconde vérité : il **importe le mauvais registre**, sous une anatomie identique — la rupture exacte que l'UX redoute pour le trailing.

**PROPOSITION** — un discriminant mécanique, pas un goût : **on reprend un message si et seulement s'il porte une valeur lue dans le dossier** (les quatre décomptes de `texte-trop-long`, la désignation du savoir de `revelation-sans-porte` = **5 sites**) ; **on écrit les cinq `condition-sans-expr`**, dont les messages ne contiennent rien à copier. Dix `location` **déclarées**, dix remédiations **écrites**, une sonde sur les dix lignes rendues.

**VERDICT** — **recevable sous réserve** — quatre réserves, § 7 de l'annexe.

---

# ANNEXE (hors quota)

## 0. Contrat de sortie IA concerné

Inchangé depuis le tour 1, et je le reconduis mot pour mot : **aucune sortie de modèle n'est en jeu**. `controlerDossier` reste pure, totale, synchrone, sans appel de modèle (`controles.ts` l. 641-644 le dit déjà). Le veto d'it3 (« une règle dont le verdict n'est pas décidable par une fonction pure du `Dossier` n'est pas une règle de linter ») tient sans amendement.

| | |
|---|---|
| **Entrée injectée** | `canon.mj` + `canon.partage` = le seul bloc **toujours** chargé, borné à `BUDGET_MOTS_CANON = 600`. `charpente.jalons[].enonce_texte` (20) : injectés **cumulativement**. `monde.conditions.climat[].manifestation` (20) : injectée **seule**, pour le seul climat actif. |
| **Schéma de sortie** | sans objet. |
| **Échec de validation** | la borne **n'a aucun effet moteur** aujourd'hui : dépassement ⇒ `warning`, `ok` reste vrai, le texte est persisté et serait injecté **en entier**. Ni assembleur, ni troncature, ni budget dur — n° 10. |

**Invariant neuf que ce lot doit écrire, et qui est de mon poste** : la prose de `SITES_AVERTISSEMENT` est une **prose de surface d'éditeur**. Elle n'entre dans aucun contexte injecté, ne compte dans aucun budget de mots, et ne doit **rien promettre que le moteur ne fait pas** — « sera tronqué », « sera coupé », « le moteur ignorera » sont interdits dans les dix lignes. La prose autorisée dit ce qui **ne se produira pas** (« ne sera jamais vérifiée », « ne partira jamais »), jamais ce que le moteur ferait du surplus.

---

## 1. C1 — par quel mécanisme « 601 mots » traverse sans être retapé, et qui se reprend

**Le décompte ne traverse pas par une interpolation : il traverse par une affectation.**

```
constat.message = avertissement.message
```

`validate.ts` l. 810 est le **seul** site qui compose cette phrase (`${budget.sujet} compte ${mots} mots ; le budget conseillé est de ${budget.budget}.`). `controles.ts` n'écrit ni `${}`, ni `600`, ni `mots ;`, ni un import de `BUDGET_MOTS_*` : pour ces quatre sites, **`SITES_AVERTISSEMENT` ne porte pas de champ `message` du tout**. C'est la forme la plus forte de KR-165 — non pas « la constante est nommée », mais « il n'y a rien à nommer ici ».

**La garde qui distingue une reprise d'une recopie** (une recopie littérale passerait un `===` à une seule fixture) : **deux mutations de volumes différents dans le même test** — `synopsis_mj` à 601 mots puis à 650 — produisent **deux messages différents**, chacun égal à celui que `validateDossier` rend sur le même clone. Un littéral retapé fige la première et rougit la seconde. Patron « rouge puis calme dans le même test » déjà en place dans ce fichier.

**Le partage, confirmé, et il est par SITE (M2), pas par code :**

| | Sites | Motif mécanique |
|---|---|---|
| **`message` REPRIS** — 5 sites | 1 `canon.mj`, 2 `canon.partage`, 3 `jalons[].enonce_texte`, 4 `climat[].manifestation` (le décompte) · 9 `savoirs[].revele_si` (la désignation du savoir, seule donnée d'instance des six autres) | le message porte une **valeur lue dans le dossier** ; la réécrire la perdrait ou la retaperait |
| **`message` ÉCRIT** — 5 sites | 5 `reussi_si_texte`, 6 `echoue_si_texte`, 7 `fins[].condition_texte`, 8 `contre_mesures[].declencheur_texte`, 10 `plan_actions[].si_bloque` | ces messages sont des **constantes** : leur seul morceau variable est `feuilleDe(famille.texte)`, c'est-à-dire **la clé JSON elle-même**, venue de `tables.ts` et non du dossier. Il n'y a **rien à copier** — donc pas de seconde vérité possible — et c'est exactement là que la clé JSON entre dans la prose lue par l'auteur |
| **`location` DÉCLARÉE** — 10 sites | toutes | deux surfaces, deux contrats documentés (§ RISQUE) ; arbitrage d'it1 reconduit |
| **`remediation` ÉCRITE** — 10 sites | toutes | M3 + le `↪` + « ce n'est pas bloquant » à côté d'une pastille ALERTE |

**Ce que ça répond à R7 (« une copie serait une seconde vérité qui dérive »)** : il n'y a **aucune copie**. Les cinq reprises sont prises **par référence** ; les cinq écritures portent sur des sites dont le message du validateur ne contient **aucune donnée à dupliquer**. La crainte de R7 est juste et ne trouve, sur les dix sites mesurés, **aucun site où s'appliquer**.

**La sonde qui tient l'ensemble** (elle rougit aujourd'hui, et elle doit être exécutée **avant** d'écrire la phrase d'itération — précédent BUG-084) : sur les **dix** lignes rendues, `controle.message` et `controleRemediation(controle)` ne contiennent ni `'↪'`, ni `'_texte'`, ni `'_expr'`, ni `'si_bloque'`, ni `'revele_si'`, ni « réimport », **et ne sont jamais vides**. Cas négatif exigé : la sonde **doit échouer** si l'on branche `issue.message` verbatim sur un site `condition-sans-expr`. Cette sonde rend inutile toute table « qui est repris / qui est écrit » : quelle que soit la provenance, une ligne portant une clé JSON rougit.

**Un détail à ne pas laisser passer dans le repli `remediation`** : le `: ''` proposé par le tech-lead est un troisième étage vide dans une ligne à trois étages. Il doit être **inatteignable par la forme** (le constat n'existe que si la clé existe) et la sonde « jamais vide » le prouve. Un QUOI FAIRE vide sur une liste qui promet un geste par cause est un défaut, pas un repli.

---

## 2. C2 — réponse nominale à l'UX (§ 2 de sa note : « REPRENDRE tels quels, vérifié mot pour mot »)

**Ta vérification est exacte et je ne la conteste pas** : aucun des trois textes ne dit « réimportez-le », et le commentaire d'`issues.ts` documente bien que `texte-trop-long` a été corrigé pour être rendu hors de tout import (BUG-042/075, KR-171). Sur **ce** défaut-là, tu as raison contre une crainte que j'aurais pu avoir.

**Mais la question n'était pas seulement celle-là, et M3 la tranche contre ta conclusion.** La remédiation partagée de `condition-sans-expr` dit « Ajoutez la **condition structurée** correspondante » ; sur `si_bloque`, ce qui manque est une **`duree`**, et **le message de la ligne juste au-dessus le dit lui-même** (« aucune durée n'est posée »). Ce n'est ni un registre, ni un ton, ni une nuance : **le QUOI FAIRE contredit le QUOI de la même ligne**. Un auteur qui suit la consigne à la lettre ira poser une condition structurée qui n'existe pas à cet endroit du schéma, et l'avertissement ne s'éteindra pas. « Reprendre tel quel » ne peut pas s'appliquer à un texte **faux à l'un de ses deux sites mesurés** — et il n'y a pas de version « à moitié reprise » : le registre partagé est partagé par **cinq** sites, dont deux seulement ont été mesurés.

**Et il y a un second défaut, de ton terrain cette fois, que ta vérification n'a pas couvert** : `location`. Reprendre « Personnages » verbatim met un **nom de section** dans l'étage OÙ, là où les cinq règles livrées y mettent soit un champ en capitales (« DÉPART · TEXTE D'OUVERTURE — … »), soit une **entité nommée** par `localiserEntite`. C'est la même rupture silencieuse que celle que tu défends sur le trailing, à un étage de distance : deux classes de lignes sous une anatomie identique, l'une désignant une entité, l'autre un seau. **Je te rejoins donc sur ton objection ferme (C4) et je te demande de l'étendre d'un cran : la table fermée et déclarative doit porter `location` autant que `section`.**

**Ce que je ne demande pas** : que `location` nomme l'entité. Elle ne le peut pas — voir § 6, c'est la limite nommée de ce lot.

---

## 3. C3 — la table des niveaux : **TENUE**, sans amendement. 7 `alerte` / 3 `info` / 0 `bloquant`

Discriminant unique, appliqué aux dix sans exception :
> **`alerte`** = le jeu en souffre **à chaque partie**, et l'auteur ne s'en apercevra **qu'en jouant**. · **`info`** = le jeu n'en souffre pas **aujourd'hui** — soit le consommateur du manque n'existe pas, soit l'absence est un **état d'auteur légitime écrit au dépôt**.

| # | Site | Niveau |
|---|---|---|
| 1 | `canon.mj` | **alerte** |
| 2 | `canon.partage` | **alerte** |
| 3 | `charpente.jalons[].enonce_texte` | **alerte** |
| 4 | `monde.conditions.climat[].manifestation` | **info** |
| 5 | `canon.objectifs[].reussi_si_texte` | **alerte** |
| 6 | `canon.objectifs[].echoue_si_texte` | **alerte** |
| 7 | `charpente.fins[].condition_texte` | **alerte** |
| 8 | `monde.personnages[].contre_mesures[].declencheur_texte` | **alerte** |
| 9 | `monde.personnages[].savoirs[].revele_si` | **info** |
| 10 | `monde.personnages[].plan_actions[].si_bloque` | **info** |

Motifs en une ligne chacun : au § 1 de ma note du tour 1, inchangés. **Elle est totale par compilation** dans la forme que le QA exige : `SITES_AVERTISSEMENT` est un `Record<string, SiteAvertissement>` dont `niveau: Exclude<NiveauControle,'bloquant'>` interdit `bloquant` **au typage**, et dont la totalité est balayée depuis `BUDGETS_DE_MOTS` + `FAMILLES_DE_CONDITIONS.filter(alerteSansExpr)` + les deux sites isolés (KR-199). Un cinquième budget ou une cinquième famille alertante ne compile pas sans sa ligne.

### Site 9 (`revele_si` → `info`) — je maintiens, et je me sépare toujours de la note de convocation

Le dépôt écrit **deux fois** que l'absence des quatre portes est un état légitime : `validate.ts` l. 673-675 (« c'est peut-être un savoir que l'auteur ne veut jamais voir se révéler de lui-même ») et la consigne d'`issues.ts` (« **ou laissez tel quel** »). **Une `alerte` dont la consigne officielle est de la laisser allumée entraîne l'auteur à ignorer toutes les autres** — même famille que le voyant tautologiquement vert refusé sous `SANS_COMPTE` et que le bandeau rouge refusé à it1. La prémisse de la convocation (« un savoir jamais dévoilé n'est pas une prose trop longue ») est **vraie**, et elle ne se règle pas par le niveau : elle se règle par le **croisement** avec `indice-sans-source` — `producteursParIndice` compte `savoirs[].indice_id` **sans regarder `revele_si`**, donc un indice dont l'unique producteur est un savoir sans porte est compté comme produit. C'est un **faux négatif d'une règle bloquante**, c'est une **cause distincte** (KR-164), et c'est **it6**, sous le nom **« porte morte, producteur fantôme »**, à porter aux `open_questions`. Monter le site à `alerte` achèterait un voyant permanent sur tous les savoirs manuels au prix de la règle qu'il faut réellement écrire.

### Site 4 (`climat` → `info`) — je maintiens, et le motif est exactement mon domaine

Deux raisons, toutes deux écrites au dépôt : (a) `types.ts` fait lui-même le contraste — « une manifestation est injectée **SEULE**, pour le SEUL climat que `horloge.climat_actif` désigne », contre des énoncés de jalons « injectés **TOUS ENSEMBLE**, dont la liste **croît monotonement** avec la durée de la partie » ; (b) **aucun moteur ne sait appliquer un climat** (réserve narratif d'it3, propriétaire n° 14). Le niveau d'un budget est une affaire de **fréquence et de permanence d'injection**, pas du mot « budget » que les quatre partagent. Classer les quatre au même rang mettrait 600 mots chargés à **tous les tours de toutes les sessions** au même niveau que 20 mots chargés pendant qu'un climat est actif, par un moteur qui n'existe pas. Ce serait une fausse précision.

**Et cette ligne est faite pour bouger** : le jour où n° 10 livre un assembleur, `climat[].manifestation` acquiert un consommateur et passe à `alerte`. C'est **un mot dans une table déclarée** — précisément ce qu'une dérivation aurait rendu impossible sans re-raisonner.

**Sur les trois `info` et la navigation, correction d'une phrase de ma note du tour 1** : j'y écrivais que les `info` « ne déplacent aucune pastille sur le dossier de référence ». C'est vrai **trivialement** — le dossier de référence produit zéro avertissement (M/§ 1), donc zéro ligne. La phrase juste, vérifiée dans le code : `plusGrave` retient le **plus grave** (`GRAVITE = { bloquant: 0, alerte: 1, info: 2 }`, `controles.ts` l. 632-638), donc un `info` sur une section qui porte déjà une `alerte` ne change pas sa pastille, et un `info` sur une section calme l'allume en `info`. C'est le comportement voulu, et il est épinglé par le test `parSection` existant.

---

## 4. C4 / M5 — **l'amendement de KR-219, mot pour mot**, et le sort de la garde d'it3

### 4.1 — J'ACCEPTE l'amendement. Voici son texte de remplacement

Même texte des deux côtés (`src/features/dossier-controles/specification.json` → `known_risks` **et** `code-knowledge.json`), sans accents comme ses voisins dans ce fichier :

> **KR-219** — « La section d un controle est DECLAREE par la regle qui le produit, jamais DERIVEE de son path. DERIVER vise un CALCUL a l execution : decouper le path, en prendre un prefixe, chercher dans SECTIONS[].cle — SectionDescripteur.cle est un TEXTE D AFFICHAGE, pas un chemin, et la section Jalons & fins en porte deux separes par un point median. Une table ECRITE ligne a ligne par la regle productrice n est PAS un calcul : PROSES_AMORCE en est le precedent dans le meme fichier. Une telle table est licite a DEUX conditions, chacune tenue par un test : sa TOTALITE est balayee depuis le registre qui fait foi (KR-199), et un chemin absent de la table produit ZERO constat — jamais une section de repli. ET LA GARDE NE S ECRIT PAS « racine du path differente de la section » : ce predicat n est satisfaisable que la ou les deux PEUVENT differer, or canon est la SEULE des dix sections dont la cle n a pas de point (sections.ts), si bien qu une regle declarant section: 'canon' sur un path en canon.* fera rougir cette garde EN ETANT CORRECTE. La derivation naive se refute UNE FOIS, par un contre-exemple sur le rapport entier ; la declaration se prouve par un Record de sections attendues, TOTAL PAR COMPILATION. »

**Ce que cet amendement conserve** : l'interdiction d'un résolveur générique (R2 du tech-lead reste juste, et le veto d'it4 « jamais dériver une destination depuis un texte d'affichage » le couvre déjà). **Ce qu'il ajoute** : les deux conditions de licéité — sans elles, la crainte originelle de KR-219 (« une seconde vérité qui dérive en silence ») devient exacte, parce que `SITES_AVERTISSEMENT` est consultée par un `path` **produit par un autre module**, et qu'un raté y est silencieux (`flatMap` → `[]`). **Ce qu'il retire** : la garde par coïncidence.

### 4.2 — M5 : la garde d'it3 se corrige **DANS CE LOT**. Je refuse le report, et je refuse le contournement du § 5.6

**Au tech-lead, nommément, sur son § 5.6 (« le témoin de `NEUVES` doit être choisi, pas tiré au sort »)** : ta phrase est **juste et opérationnellement nécessaire** — elle doit passer telle quelle dans le plan, parce qu'un ouvrier qui prend `canon.mj` livre un test rouge et croira que c'est la table qui est fausse. Je ne la conteste pas. **Mais elle ne répond pas à M5**, et je ne peux pas laisser le plan s'arrêter là.

Soyons exacts, pour ne pas surjouer (classe BUG-084) : **la garde ne rougit pas mécaniquement si le témoin est non-`canon`**. Elle boucle sur les témoins de `NEUVES`, pas sur les dix sites. Le contournement **marche**. C'est précisément ce qui le rend coûteux : il ne coûte rien aujourd'hui et il coûte un test rouge-et-correct plus tard.

**Ce qui rend la correction due ici, et ce n'est pas la proximité du fichier** : ce lot est le **premier** à vouloir déclarer `section: 'canon'` sur des `path` enracinés en `canon.*` — **quatre de ses dix propres lignes** (1, 2, 5, 6). Le lot écrit donc une table dont la garde interdit à quatre lignes d'être jamais prises pour témoin. Laisser ça, c'est livrer une table et, dans le même diff, une garde qui en réfute le quart. Le précédent d'it3/it4 (« une prose rendue fausse par le lot se corrige avec le lot ») vaut **a fortiori** pour une garde : une prose fausse induit en erreur, une garde fausse **bloque une correction future**.

**La correction, et elle tient en un déplacement d'assertion** — `controles.test.ts`, test « la section de chaque controle est celle declaree, jamais derivee du path », l. 235-245 :

- **ce qui reste** : la discriminance par témoin (`constats.length > 0`), et surtout la table `SECTION_ATTENDUE` **totale par compilation** — c'est **elle**, et elle seule, qui prouve que les sections sont les sections déclarées ;
- **ce qui sort de la boucle** : l'inégalité `constat.path.split('.')[0] !== constat.section`, qui devient **une seule assertion sur l'ensemble balayé** — « il existe au moins un constat dont la racine du `path` diffère de sa section ». Une réfutation n'a besoin que d'**un** contre-exemple ; l'exiger de chaque constat encodait la coïncidence que M5 met au jour. Le commentaire qui l'accompagne cite `sections.ts` et la clé sans point de `canon`, pour que personne ne la « restaure » ;
- **ce qui la remplace pour la règle neuve** : le **critère 3 du QA** — un `Record` fermé des dix sites → section attendue, total, qui épingle les **valeurs** plutôt qu'une inégalité. C'est plus fort que ce qu'on retire.

**Coût : zéro critère supplémentaire.** La correction vit à l'intérieur de deux critères déjà budgétés (le critère 3 du QA et la réécriture de garde du critère 4). Le périmètre « 8 critères au plus » n'est pas entamé.

---

## 5. C5 / M6 — la lecture de `.warnings` : **je RATIFIE, sans réserve**, avec une condition de forme

Je ne conteste pas la lecture de `.warnings`. Écris-le `RETENU`.

Le motif est de mon domaine et il est court : **lire un canal n'est pas y écrire.** KR-217 sépare deux axes — `severity` dit si le **document** s'écrit, `niveau` si l'**aventure** se joue — et ce que la règle neuve fait est exactement une **traduction d'axe**, pas une fusion : elle lit un fait « ce document a été écrit malgré ceci » et en produit un fait « cette aventure se jouera moins bien à cause de cela ». Les deux invariants réels de KR-217 survivent et restent testés : `Controle` ne porte jamais `severity` (balayé à l. 275-283 sur un `Record` total), et `controlerDossier` ne lit jamais `.errors`.

**Condition de forme, et elle vient d'un patron déjà écrit dans ce fichier.** Le remplacement ne peut pas être un seul `not.toContain('.errors')` : une garde d'absence passe **tautologiquement** sur un module qui ne mentionnerait pas le validateur du tout — c'est le même « zéro site » que M4 relève sur `↪`. Il faut les **deux moitiés**, comme aux l. 328-329 (`not.toContain(MARQUEUR_A_ECRIRE)` **et** `toContain('MARQUEUR_A_ECRIRE')`) :

- `SOURCE_CONTROLES` **ne contient pas** `.errors` ;
- `SOURCE_CONTROLES` **contient** `.warnings` — la moitié positive, sans laquelle la première ne prouve rien.

Et la JSDoc l. 22-23 (« ce module n'importe pas le validateur : il n'a rien à y lire ») se réécrit **dans le même lot** — elle devient fausse par le fait du lot, précédent it3/it4.

**Note pour l'ouvrier, mesurée par lecture et absente des cinq notes du tour 1** : la garde qui rougit **la première** n'est pas celle-là, c'est `controles.test.ts` **l. 301** — `expect(new Set(controles.map(c => c.id)).size).toBe(Object.keys(CONTROLES).length)`. Une sixième entrée dans `CONTROLES` porte le membre droit à 6 pendant que les quatre rapports balayés n'en représentent que 5. Elle rougit **en faisant son travail** : elle force la règle neuve à entrer dans le balayage des `path`, et c'est **là**, à la l. 307, que les deux grammaires de chemin se rencontrent. Les deux lignes se corrigent ensemble ou pas du tout.

---

## 6. La limite que ce lot ne peut pas lever — à écrire aux `open_questions`, pas à absorber en silence

**« Deux lignes jumelles, aucune n'est désignable. »** Mesuré : les quatre `warnings.push` appellent `anomalie` avec **cinq** arguments, donc `entityId` est `undefined` sur les dix sites ; cinq des dix messages n'interpolent rien ; `location` est un nom de section sur six sites. Sept des dix sites peuvent donc produire N lignes **strictement identiques** dans leurs trois étages rendus.

Les trois issues, et pourquoi deux sont fermées :
- **poser `entityId` sur les quatre `warnings.push`** — c'est la vraie correction, et elle est **hors périmètre** : `validate.ts` est un fichier sur lequel cette feature a juré de n'ouvrir aucun lot contrat. **Propriétaire : le premier lot qui ouvrira `validate.ts`**, nommé comme tel ;
- **grouper les jumelles en une ligne** (« 7 savoirs sans porte ») — **refusé ici** : c'est un changement d'anatomie de la liste, donc une itération à part, jamais un ajout en passant (je l'écrivais déjà au § 5 de ma note du tour 1) ;
- **déclarer une `location` par site**, qui distingue au moins le **champ et la collection** — **retenu**, coût nul, et c'est ce qui remet l'étage OÙ dans le registre du rapport.

**Et le relevé que je reconduis d'it3, discipline `volume_mesure` — un relevé daté dans la revue, jamais une assertion committée** : sur le clone muté qui sert déjà de preuve, noter (a) le nombre de lignes produites, (b) leur répartition par niveau, (c) le nombre de lignes du site le plus prolifique, **et (d) le nombre de lignes indistinguables entre elles** — c'est (d) qui est neuf, et c'est le chiffre qui dira si « porte morte » et le groupement sont dus à it6 ou plus tôt. Si (c) dépasse ~10, l'arbitrage à rouvrir n'est pas le niveau, c'est le groupement.

---

## 7. Mes quatre réserves — le verdict « recevable sous réserve » porte exactement là-dessus

1. **La table des dix niveaux du § 3, déclarée et totale par compilation**, `bloquant` exclu au typage.
2. **Le motif du non-bloquant réécrit** — « aucun de ces dix sites, **pris seul**, ne rend l'aventure injouable », jamais « ce sont des `warning` ». (M9 l'a adopté ; il doit atterrir dans le plan, pas seulement dans les mesures.)
3. **La garde d'it1 (l. 287-309) amendée et la garde d'it3 (l. 241) corrigée dans le même lot** — § 4.2 et § 5.
4. **La sonde des dix lignes rendues**, exécutée **avant** la rédaction de la phrase d'itération, avec son cas négatif vérifié — § 1.

---

## 8. Statut de chacune de mes positions du tour 1

**Mon OBJECTION du tour 1** (le motif « par construction ce sont des `warning` » est une confusion d'axes) → **RETIRÉE**. Motif : elle a été **accordée** — M9 l'inscrit au registre des mesures et corrige le cadrage. Une objection satisfaite se retire ; la maintenir serait compter deux fois le même point. Le **contenu** passe en réserve n° 2 ci-dessus, qui est l'endroit où il doit vivre.

**Mon RISQUE du tour 1** (deux grammaires de `path`, garde d'it1 rouge sur 8 sites) → **MAINTENU**, et désormais **résolu dans sa forme** : normalisation par `cheminDeTable` (`path.replace(/\[\d+\]/g,'[]')`), garde d'it1 amendée en « clé de `DESTINATION_DES_CHAMPS`, **ou préfixe strict normalisé sur séparateur** d'au moins une clé » — patron déjà en place dans `couverture.test.ts`. Il gagne au passage un second volet, le RISQUE du tour 2 : la **grammaire de `location`**, que personne n'avait mesurée.

| # | Mon rejet du tour 1 | Statut au tour 2 |
|---|---|---|
| 1 | mapper `DossierIssue.path` verbatim sur `Controle.path` | **MAINTENU** — et renforcé : c'est la même erreur que le `location` verbatim, un cran plus bas. |
| 2 | dériver la **section** (ou le niveau) depuis le `path` | **MAINTENU**, et **débloqué** : l'amendement KR-219 du § 4.1 rend la table *déclarée* licite sans rouvrir la porte à la dérivation. Converge avec R2 du tech-lead et avec l'objection ferme de l'UX. |
| 3 | re-dériver les avertissements dans `controles.ts` (recompter les mots, relire les tables) | **DURCI EN VETO.** Veto de domaine, et le seul que je pose : **une règle ne vit qu'à un seul endroit**. Deux moteurs pour le même seuil divergent au premier changement de borne, et l'auteur verrait un rapport calme sur un texte que l'import signale. C'est la panne exacte que l'export de `compterMots` a servi à éviter (n° 3). Corollaire opposable : **aucun seuil, aucun nombre, aucune borne ne s'écrit dans `controles.ts`**. |
| 4 | le motif « aucun ne peut être `bloquant` parce que ce sont des `warning` » | **MAINTENU** — verdict conservé (zéro `bloquant`), motif remplacé. C'est ce qui laisse it6 libre d'écrire sa règle de **collection** bloquante. |
| 5 | reprendre `dossierIssueRemediation` verbatim | **MAINTENU et renforcé par M3** : ce n'est plus seulement un registre de langue (R8 du tech-lead), c'est une consigne **factuellement fausse** à l'un de ses deux sites mesurés. |
| 6 | `revelation-sans-porte` en `alerte` | **MAINTENU** — § 3, défense du site 9. |
| 7 | ajouter `canon.mj` / `canon.partage` / `…revele_si` à `DESTINATION_DES_CHAMPS` | **MAINTENU** — la `resolved_decision` du cadrage est explicite ; la garde s'amende, la table ne bouge pas. |
| 8 | la voie « le panneau reçoit les deux sources » | **MAINTENU** — converge avec R1 du tech-lead (recalculer `parSection` côté feature = KR-013 + classe BUG-082) et avec l'UX (le trailing d'it4 n'existerait pas sur la moitié des lignes). |

**Ratifications, en une ligne chacune** (silence = ratification, donc je le dis explicitement) : **C5** ratifié (§ 5). **C6** — la scission me convient : la phrase de démo ne doit rien promettre de plus que ce que l'auteur voit ; le bénéfice it6 est un fait d'ingénierie, il vit dans la section valeur. **C7** — la mesure du § 5 de l'orchestrateur **renforce mon § 4 du tour 1** et doit être écrite comme telle : si l'avertissement est **l'état intermédiaire normal de l'écriture**, alors la prose du rapport s'adresse à un auteur **en train d'écrire**, jamais à un lecteur qui vient d'importer — ce qui rend obligatoires le « ou laissez tel quel » du site 9 et l'interdiction absolue de « réimportez ». **C8** — terrain du QA, je ratifie sans commentaire. **M8** (dette d'it4) — pas mon terrain ; je constate seulement que la condition posée par le tech-lead lui-même est remplie.

---

## 9. Ce que personne n'aura vérifié à la fin d'it5 — à écrire dans la revue, jamais à compter comme couvert

- **Le budget de contexte lui-même** : aucun instrument du dépôt ne mesure ce que pèse un contexte assemblé, parce qu'il n'y a **pas d'assembleur**. Les quatre budgets restent des **conseils** et les niveaux du § 3 un **jugement de conséquence**, pas une mesure. À rouvrir à la n° 10.
- **La prémisse qui porte le niveau `alerte` du site 3** (« les énoncés des jalons atteints sont injectés tous ensemble, leur liste croît avec la durée de la partie ») est écrite dans `types.ts` et **vérifiée par aucun test** — aucun code n'injecte quoi que ce soit aujourd'hui. Même statut que la prémisse du bloquant « départ désert » (open_question d'it3).
- **Le volume, et la nouveauté du tour 2 : le nombre de lignes indistinguables** sur une aventure réelle écrite à la main — § 6, point (d).

---

**Fichiers lus au tour 2** (aucun écrit, aucune commande exécutée sur l'arbre de travail) :
`C:\Users\pierr\Desktop\genliv\.claude\raffinage\dossier-controles-it5\dossier-tour2.md` ·
`…\mesure-orchestrateur.md` · `…\tour1-pm-produit.md` · `…\tour1-tech-lead.md` · `…\tour1-ux-designer.md` · `…\tour1-qa.md` · `…\tour1-narratif-ia.md` · `…\cadrage.md` ·
`C:\Users\pierr\Desktop\genliv\src\brain\dossier\sections.ts` ·
`C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.ts` ·
`C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.test.ts` ·
`C:\Users\pierr\Desktop\genliv\src\brain\dossier\validate.ts` ·
`C:\Users\pierr\Desktop\genliv\src\brain\dossier\tables.ts` ·
`C:\Users\pierr\Desktop\genliv\src\features\dossier-controles\components\ListeControles.tsx` ·
`C:\Users\pierr\Desktop\genliv\code-knowledge.json`

**Faits neufs de ma note, vérifiés par lecture de la source** (à opposer à moi si l'un est faux) : `anomalie` accepte `entityId?` en sixième argument et **les quatre `warnings.push` l'omettent** (`validate.ts` l. 697, 728, 764, 806) · le message de `si_bloque` (l. 732) et celui des familles D1 (l. 768) **n'interpolent aucune valeur du dossier** · `canon.mj` et `canon.partage` partagent le même `sujet: 'Le canon'` (`tables.ts` l. 667-668), leurs deux messages sont donc identiques et seul `location` les sépare · `ListeControles.tsx` l. 64-66 rend `controle.location` comme étage OÙ · `controles.test.ts` **l. 301** rougit avant la l. 307 et avant la l. 340 · `GRAVITE`/`plusGrave` (`controles.ts` l. 632-638) retiennent le plus grave.