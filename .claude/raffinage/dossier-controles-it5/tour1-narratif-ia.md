## TOUR 1 — Narratif & IA — `dossier-controles` itération 5

**RISQUE** — it5 fait entrer dans le rapport un canal dont la **grammaire de `path`** et le **registre de prose** ne sont pas ceux du rapport, et les deux écarts sont silencieux au raffinage. Mesuré : `DossierIssue.path` porte les **indices réels** (`charpente.jalons[0].enonce_texte`) là où `DESTINATION_DES_CHAMPS` est à indices effacés, et **trois** des dix sites (`canon.mj`, `canon.partage`, `…savoirs[].revele_si`) sont des **conteneurs** qui ne sont clés de rien. La garde de forme que j'ai fait poser à it1 (`controles.test.ts` → « les path sont des cles de DESTINATION_DES_CHAMPS ») rougit donc sur **8 sites sur 10**. C'est ma garde ; c'est à moi de dire comment elle bouge.

**OBJECTION** — le § 8 du cadrage motive « aucun ne peut être `bloquant` **par construction** — ce sont des `warning` ». C'est la **confusion d'axes que KR-217 existe pour interdire** : `severity` dit si le *document* s'écrit, `niveau` si l'*aventure* se joue ; un `warning` promu `bloquant` est parfaitement cohérent. Le verdict est bon, le motif est faux — et un motif faux cède au premier contradicteur (BUG-080, et it4 en a coûté trois). Le motif juste : **aucun de ces dix sites, PRIS SEUL, ne rend l'aventure injouable** ; les règles de collection qui le feraient (toutes les fins sans `_expr`) sont la charge d'it6. Laisser l'ancien motif interdirait à it6 la règle qu'elle doit écrire.

**PROPOSITION** — une table **DÉCLARÉE de dix sites** dans `controles.ts`, clé = chemin normalisé, valeur = `{ niveau, section, prose }` ; effacement d'indices en **une expression** ; exhaustivité balayée depuis `BUDGETS_DE_MOTS` + `FAMILLES_DE_CONDITIONS.filter(alerteSansExpr)` + les 2 sites isolés (KR-199). Garde d'it1 **amendée, jamais retirée** : clé de `DESTINATION_DES_CHAMPS` **ou préfixe strict normalisé sur séparateur** d'au moins une clé — patron déjà en place dans `couverture.test.ts`.

**VERDICT** — **recevable sous réserve** (les trois réserves : niveaux de l'annexe, motif du non-bloquant réécrit, garde d'it1 amendée dans le même lot).

---

# ANNEXE

## 0. Contrat de sortie IA concerné

**Aucune sortie de modèle n'est en jeu dans cette itération** — `controlerDossier` est pure et totale, et le veto que j'ai fait retenir à it3 (« une règle dont le verdict n'est pas décidable par une fonction pure du `Dossier` n'est pas une règle de linter ») tient sans amendement. Le contrat qui est réellement touché est celui du **contexte**, à l'entrée :

| | |
|---|---|
| **Entrée injectée** | `canon.mj` + `canon.partage` = **le seul bloc toujours chargé**, borné à `BUDGET_MOTS_CANON = 600`. Les `charpente.jalons[].enonce_texte` (20 mots) sont injectés **cumulativement**, un par jalon atteint ; la liste croît monotonement avec la durée de la session. `monde.conditions.climat[].manifestation` (20 mots) est injectée **seule**, pour le seul climat actif. |
| **Schéma de sortie** | sans objet ici. |
| **Comportement en cas d'échec** | la borne **n'a aucun effet moteur** aujourd'hui : dépassement ⇒ `warning`, `ok` reste vrai, le texte est persisté et sera injecté **en entier**. Il n'existe ni assembleur, ni troncature, ni budget dur — n° 10. **Conséquence pour it5 : la prose du rapport ne doit rien promettre que le moteur ne fait pas** (« sera tronqué », « sera coupé » = interdits). |

C'est précisément parce que la borne du canon est la seule chose qui tienne aujourd'hui lieu de garde-fou de contexte que `canon.mj` / `canon.partage` ne peuvent pas descendre à `info` (§ 1).

## 1. LE NIVEAU DES DIX SITES — mon apport principal

**Le discriminant, un seul, appliqué aux dix sans exception :**

> **`alerte`** = le jeu en souffre **à chaque partie**, et l'auteur ne s'en apercevra **qu'en jouant**.
> **`info`** = le jeu n'en souffre pas **aujourd'hui** — soit le consommateur du manque n'existe pas encore, soit l'absence est un **état d'auteur légitime** écrit au dépôt.

Aucun `bloquant` : non pas « parce que ce sont des `warning` » (§ objection), mais parce qu'**aucun de ces dix sites pris seul ne rend une aventure injouable**.

### Les quatre budgets (`texte-trop-long`)

| # | Site | Niveau | Motif, en une phrase |
|---|---|---|---|
| 1 | `canon.mj` | **alerte** | C'est le **seul bloc chargé à tous les tours** (`destinations.ts` : « tout le canon est injecté : c'est sa raison d'être ») — un dépassement se paie au tour 1 comme au tour 40, et l'auteur ne peut l'amortir par aucune façon de jouer. |
| 2 | `canon.partage` | **alerte** | Identique, même borne, même bloc permanent — la séparation `mj`/`partage` change le **rôle** qui reçoit, jamais la fréquence d'injection. |
| 3 | `charpente.jalons[].enonce_texte` | **alerte** | Le seul site du schéma dont le dépassement est **non borné dans le temps** : `types.ts` l'écrit déjà — « les énoncés des jalons atteints sont injectés TOUS ENSEMBLE, et leur liste croît monotonement avec la durée de la partie ». Un énoncé de 60 mots au lieu de 20 est multiplié par le nombre de jalons franchis. |
| 4 | `monde.conditions.climat[].manifestation` | **info** | `types.ts` fait lui-même le contraste : « une manifestation est injectée **SEULE**, pour le SEUL climat que `horloge.climat_actif` désigne » — dépassement borné à quelques dizaines de mots pendant qu'un climat est actif ; **et aucun moteur ne sait appliquer un climat** (réserve narratif d'it3, propriétaire n° 14). Allumer une alerte sur un champ dont le consommateur n'existe pas est du bruit. |

**Ce n'est délibérément pas « tous les budgets au même niveau ».** Trois `alerte` / un `info` : c'est la **fréquence d'injection** qui les sépare, pas le mot « budget » qu'ils partagent.

### Les quatre familles D1 `alerteSansExpr: true` (`condition-sans-expr`)

| # | Site | Niveau | Motif |
|---|---|---|---|
| 5 | `canon.objectifs[].reussi_si_texte` | **alerte** | L'auteur a écrit une condition de **victoire** que **rien n'évaluera** : le moteur ne pourra jamais constater cet objectif accompli. Intention posée, morte au runtime. |
| 6 | `canon.objectifs[].echoue_si_texte` | **alerte** | Symétrie **assumée et non mécanique** : sans elle, on pourrait livrer une aventure **qu'on ne peut pas perdre** sans qu'un seul voyant s'allume. Même cause, même ligne de table, même geste (KR-164). |
| 7 | `charpente.fins[].condition_texte` | **alerte** | La **plus conséquente des dix** au runtime : une fin dont la condition reste en prose est une fin que le moteur **n'atteindra jamais**. Elle n'est pas `bloquant` parce que la règle est **par fin** — « aucune fin atteignable » est une règle de **collection**, donc it6. |
| 8 | `monde.personnages[].contre_mesures[].declencheur_texte` | **alerte** | L'arbitrage de jouabilité est **déjà écrit dans `tables.ts`**, mot pour mot : « une riposte que rien n'arme ne partira jamais — l'auteur a écrit une menace qui ne se produira pas, et il ne l'apprendrait qu'en jouant ». it5 **n'a pas à la rejuger**, seulement à ne pas la contredire. |

### Les deux sites isolés

| # | Site | Niveau | Motif |
|---|---|---|---|
| 9 | `monde.personnages[].savoirs[].revele_si` (`revelation-sans-porte`) | **info** | **Et c'est l'arbitrage sur lequel je me sépare de la note de convocation.** L'absence des quatre portes est un **état d'auteur explicitement légitime**, écrit deux fois au dépôt : `validate.ts` (« c'est peut-être un savoir que l'auteur ne veut jamais voir se révéler de lui-même ») et la consigne d'`issues.ts` (« **ou laissez tel quel** »). Une `alerte` qu'on dit à l'auteur de laisser allumée est un voyant qui **entraîne à ignorer tous les autres** — même famille que le voyant tautologiquement vert refusé sous `SANS_COMPTE` et que le bandeau rouge refusé à it1. |
| 10 | `monde.personnages[].plan_actions[].si_bloque` (`condition-sans-expr`) | **info** | Ce qui manque n'est pas une condition mais une **horloge** (`duree`), et `validate.ts` écrit que **son unité n'est pas décidée** (n° 9 / n° 14) : aucun consommateur n'existe. De plus, le `declencheur_texte` du **même bloc d'écran** porte `alerteSansExpr: false` — le schéma a déjà arbitré qu'une étape de plan jouée à la main du narrateur est légitime ; alerter sur son voisin à un champ de distance contredirait cet arbitrage. |

**Total : 7 `alerte`, 3 `info`, 0 `bloquant`.**

### Sur « un savoir jamais dévoilé ≠ une prose trop longue » — ce qui est vrai dans la prémisse, et où je la renvoie

La note de convocation a raison sur un point que personne d'autre ne verra, et **il ne se règle pas par le niveau** : `producteursParIndice` (it3) compte `savoirs[].indice_id` **sans regarder `revele_si`**. Un indice dont l'unique producteur est un savoir **sans porte** est donc compté comme produit, alors que **rien ne le révélera jamais automatiquement** — c'est un **faux négatif d'une règle bloquante**, exactement le sens d'erreur qu'it3 a accepté en connaissance de cause.

Conséquence : `revelation-sans-porte` n'est pas qu'un avertissement de confort, c'est le **terme correcteur** d'`indice-sans-source`. Mais le croisement des deux est une **cause distincte** (KR-164 : « savoir sans porte, seul producteur d'un indice ») — il appartient à **it6**, avec la saturation, et **surtout pas** à it5 sous la forme d'un relèvement de niveau de ce site. Monter le site à `alerte` « pour ne pas perdre l'information » achèterait un voyant permanent sur tous les savoirs manuels au prix de la règle qu'il faut réellement écrire. → à porter aux `open_questions` sous le nom **« porte morte, producteur fantôme »**, propriétaire it6.

## 2. La clause d'audience d'it3 s'applique-t-elle ? — **Oui, mais comme PLAFOND, jamais comme CLASSEMENT**

C'est moi qui l'ai réécrite, je la borne donc moi-même.

Ce qu'elle dit : « le critère n'est pas l'audience de la clé lue, c'est la **nature du geste** qui éteint le voyant. Rédiger de la prose n'est jamais bloquant ; poser une référence entre deux entités existantes peut l'être. »

Ce qu'elle **ne dit pas** : rien sur `alerte` contre `info`. L'employer comme règle de classement donnerait mécaniquement « rédiger → `info`, structurer → `alerte` », donc **les quatre budgets en `info` et les quatre familles D1 en `alerte`** — et cette table-là mettrait `canon.mj` (600 mots, tous les tours, tous les tours de toutes les sessions) **au même rang** que `climat[].manifestation` (20 mots, un climat, aucun moteur pour l'appliquer). Ce serait une fausse précision : une règle exacte appliquée à une question qu'elle n'a jamais traitée.

**Donc :** la clause d'it3 **plafonne** — elle interdit `bloquant` sur les quatre budgets (ils s'éteignent en **resserrant une prose**) et l'autoriserait sur les six autres (ils s'éteignent en **posant une structure** : un `…_expr`, une porte, une `duree`). Le **classement** entre `alerte` et `info` se fait au discriminant du § 1, qui est de **conséquence de jeu**. Vérification utile : le discriminant du § 1 ne contredit la clause d'it3 **nulle part** — aucune ligne du § 1 ne met en `bloquant` un voyant qui s'éteint en rédigeant.

Et le discriminant de it3 se relit encore ici, littéralement : les quatre budgets lisent la valeur **comme de la prose** (`compterMotsDe`) ; les six autres la lisent **comme une présence/identité** (`=== undefined`, appartenance aux quatre portes). Le test est stable.

## 3. KR-222 et la dette d'it6 — **il y a un trou, et it5 doit l'écrire**

`condition-sans-expr` ne fire **que si le jumeau prose est une chaîne non vide** — `validate.ts` : `if (!famille.alerteSansExpr || typeof texte !== 'string' || texte.trim() === '') continue`.

Or `canon.objectifs[].reussi_si_texte` est **optionnel** — vérifié : `couverture.test.ts` le range en `TEXTE_OPTIONNEL_LIBRE`, il n'est dans aucune ligne de `CHAMPS_REQUIS`.

Donc le cas « objectif sans `reussi_si_expr` » **se scinde en deux** :
- **(a1)** pas d'`_expr`, **mais** une prose → l'avertissement part ✅ — c'est le cas que KR-222 décrit ;
- **(a2)** pas d'`_expr` **et** pas de prose → **silence total**, indistinguable du cas (b) « `_expr` présent et atteignable ».

**KR-222 est donc vrai pour les objectifs que l'auteur a commencé à rédiger, et faux pour les autres** — et c'est précisément sur un objectif à peine posé que le trou s'ouvre. Ce que it5 **doit** garantir, et qui ne coûte aucun code :

1. **Amender le texte de KR-222** dans `specification.json` : le signal sépare (a1) de (b), **pas** (a2) de (b) ; la troisième discrimination est due à it6, qui a de toute façon la collection en main (`canon.objectifs` vide → « canon sans objectif », déjà bloquant chez elle).
2. **Un test de silence mesuré**, classe KR-197/202, deux entités dans le même test : un clone de `dossier-minimal` où un objectif perd **`reussi_si_expr` ET `reussi_si_texte`** → **zéro ligne** au rapport ; un second objectif gardant sa prose → **une ligne**. C'est la mutation d'un seul champ (ici deux clés du même objectif), conforme au patron de preuve retenu au cadrage.
3. **Ne pas combler le trou dans it5.** Une règle « objectif sans condition du tout » serait une **cause neuve** (KR-164), donc une entrée de registre, donc hors de la phrase de démo — et elle recouperait « canon sans objectif » d'it6.

Contre-vérification faite au passage, pour qu'it6 ne la refasse pas : `charpente.fins[].condition_texte` **est** dans `CHAMPS_REQUIS` (`tables.ts` l.137) — le trou (a2) **n'existe pas** sur les fins, l'avertissement y part toujours dès que `condition_expr` manque. Le trou est **propre aux objectifs**.

## 4. Message et remédiation — **reprendre deux, réécrire deux, et retirer le glyphe partout**

Le précédent d'it1 est le bon cadre (« deux registres assumés pour le même fait ») mais il ne commande pas de tout réécrire — il commande de **vérifier chaque texte contre la surface où il atterrit**. Fait, code par code :

| Code | `message` | `remediation` |
|---|---|---|
| `texte-trop-long` | **REPRENDRE.** « Le canon compte 812 mots ; le budget conseillé est de 600. » — aucun terme interne, et il porte le **décompte mesuré**, la seule information que le rapport ne peut pas reconstituer. La réécrire perdrait le chiffre ou le retaperait (KR-165). | **RÉÉCRIRE.** « ↪ Resserrez le texte si possible ; **ce n'est pas bloquant.** » — cette demi-phrase parle du **canal** `warning` et **contredit frontalement la pastille ALERTE** posée à sa gauche. Défaut mesurable, pas une nuance de style. |
| `revelation-sans-porte` | **REPRENDRE.** « Le savoir « X » n'a aucune condition de révélation (ni confiance, ni jet, ni contrepartie, ni indice préalable) : il ne sera jamais dévoilé automatiquement. » — quatre portes nommées **en français**, zéro clé JSON. | **RÉÉCRIRE a minima** (glyphe) ; le « ou laissez tel quel » **se conserve** : c'est exactement le motif du niveau `info` (§ 1, site 9). |
| `condition-sans-expr` (5 sites) | **RÉÉCRIRE — obligatoire.** Le message est bâti sur `feuilleDe(famille.texte)` et sort donc **« Le champ « reussi_si_texte » … »**, **« Le champ « si_bloque » … »** : une **clé JSON dans la prose lue par l'auteur**. `controles.ts` l'interdit dans sa propre docstring : « aucun terme interne n'y entre : ni `Delta`, ni `refKinds`, ni `savoirs[].indice_id` — l'auteur lit le geste, nommé par les intitulés que ses écrans portent vraiment ». Le laisser passer casse la doctrine du fichier au moment même où on l'étend. | **RÉÉCRIRE.** Une consigne unique pour cinq gestes différents (poser un `…_expr` / poser une `duree`) est déjà trop large ; elle le devient trop dans un rapport qui promet un QUOI FAIRE par cause. |

**Donc, en une phrase :** la prose du rapport vit dans **une table de dix sites** dans `controles.ts` ; deux `message` y sont **repris de `DossierIssue`** (et l'itération dit qu'ils le sont), huit textes sont **écrits pour le rapport** ; **aucun seuil n'est retapé** (600 / 20 viennent du message repris ou de la constante, jamais d'un littéral) ; **aucun « ↪ »**, aucune mention de canal, aucun « réimportez-le » (BUG-042 / BUG-075 / KR-171 — ces avertissements se rendent pendant qu'on **édite**).

**Sonde correspondante, non tautologique, qui rougit aujourd'hui** : aucun `controle.message` ni `controleRemediation(controle)` du rapport ne contient `'↪'`, `'_texte'`, `'_expr'`, `'si_bloque'`, `'revele_si'`, ni « réimport ». Cas négatif vérifiable : la sonde doit **échouer** si l'on branche `issue.message` verbatim — à exécuter avant d'écrire la phrase, pas après (précédent BUG-084).

Ce n'est **pas** une duplication de règle au sens de mon veto : la **détection** reste à un seul endroit (`validate.ts` + ses deux tables) ; seule la **prose de surface** est propre au rapport, ce qu'it1 a déjà arbitré.

## 5. La mesure du § 4 (zéro avertissement sur tout dossier du dépôt) — **attendue, et elle ne dévalue pas l'itération ; elle déplace la preuve**

De mon poste : **attendue**. Les deux fixtures sont délibérément bien formées (KR-156) et **doivent le rester** — le jour où `dossier-reference.json` porterait un avertissement, huit suites en hériteraient et la feature aurait accroché sa preuve à un fichier que personne ne possède (rejet d'it3, toujours valable).

Ce que ça change quand même, et qu'il faut écrire plutôt que découvrir : **la seule chose de mon domaine qui compte ici — le volume — ne se mesure sur aucun dossier du dépôt.** Deux des dix sites se déclenchent **par élément** et non une fois : `revelation-sans-porte` fire **une ligne par savoir**, `condition-sans-expr` **une par objectif × 2**. Sur une aventure réelle écrite à la main, dix sites peuvent produire trente lignes, et un rapport de trente lignes ne se lit plus.

**Ce que je demande, et rien de plus** : reconduire la discipline `volume_mesure` d'it3 — **un relevé daté, jamais une assertion committée** — sur le **clone muté** qui sert déjà de preuve : nombre de lignes produites, répartition par niveau, **et le nombre de lignes du site le plus prolifique**. Si le prolifique dépasse ~10 lignes, l'arbitrage à rouvrir n'est pas le niveau mais le **groupement** (« 7 savoirs sans porte » en une ligne) — et ce serait alors une itération à part, pas un ajout en passant.

Deuxième point, rassurant et à noter tel quel : les trois `info` ne déplacent **aucune pastille de navigation** sur le dossier de référence (`personnages` y porte déjà une `alerte` via `personnage-sans-presence`, et `plusGrave` retient l'alerte). L'ajout est donc **invisible dans la nav** et visible seulement dans le rapport — ce qui est exactement ce qu'on veut d'un `info`.

## 6. REJETS NOMMÉS — **à recopier au registre des désaccords du plan (§ 8), pas à laisser mourir en annexe** (précédent BUG-082)

1. **REJETÉ — mapper `DossierIssue.path` verbatim sur `Controle.path`.** Indices non effacés sur 8 sites, et 3 conteneurs qui ne sont clés d'aucune ligne de `DESTINATION_DES_CHAMPS` : la garde de forme d'it1 rougit, et un `path` que personne ne résout rend le retour au champ fautif impossible.
2. **REJETÉ — dériver la section (ou le niveau) depuis le `path`, par table ou par découpage.** KR-219 : seconde vérité à tenir en phase avec `SECTIONS`. La section **et** le niveau se **déclarent** par site, comme les cinq règles déjà livrées.
3. **REJETÉ — re-dériver les avertissements dans `controles.ts`** (relire `BUDGETS_DE_MOTS` / `FAMILLES_DE_CONDITIONS` et recompter les mots) pour éviter d'importer le validateur. **Veto de domaine : règle dupliquée.** Deux moteurs pour le même seuil divergeraient au premier changement de borne, et l'auteur verrait un rapport calme sur un texte que l'import signale — panne exacte que l'export de `compterMots` a servi à éviter (n° 3).
4. **REJETÉ — le motif « aucun ne peut être `bloquant` parce que ce sont des `warning` ».** Confusion d'axes que KR-217 existe pour interdire ; motif de remplacement au § objection. Le **verdict** (zéro `bloquant` à it5) est conservé, seul le motif change — et c'est ce qui laisse it6 libre d'écrire une règle de collection bloquante.
5. **REJETÉ — reprendre `dossierIssueRemediation` verbatim.** Le « ↪ » n'existe nulle part dans l'anatomie du rapport, et « ce n'est pas bloquant » contredit la pastille rendue à côté.
6. **REJETÉ — `revelation-sans-porte` en `alerte`.** Le dépôt dit **deux fois** que l'absence de porte est un état légitime et que l'auteur peut « laisser tel quel » : un voyant qu'on prescrit de laisser allumé désapprend à lire les autres. La vraie règle est le croisement avec `indice-sans-source`, reporté à it6 sous « porte morte, producteur fantôme ».
7. **REJETÉ — ajouter `canon.mj`, `canon.partage`, `…revele_si` comme clés de `DESTINATION_DES_CHAMPS`** pour faire passer la garde. La `resolved_decision` du cadrage est explicite : cette feature **n'ouvre aucun lot contrat** sur `types.ts`, `destinations.ts` ou `validate.ts`. La garde s'amende (préfixe strict normalisé sur séparateur), la table ne bouge pas.
8. **REJETÉ — la voie « le panneau reçoit les deux sources ».** Si les avertissements n'entrent pas dans `RapportControles`, `parSection` les ignore, et la seule façon de badger la nav est de **recalculer la gravité côté vue** : seconde règle de jouabilité dans une vue, KR-013 **et** classe BUG-082. L'import dans `controles.ts` est la seule voie admissible de mon poste — avec la phrase de JSDoc « ce module n'importe pas le validateur : il n'a rien à y lire » **réécrite dans le même lot** (précédents it3 et it4).

## 7. Ce que personne n'aura vérifié à la fin d'it5 (à écrire dans la revue, pas à compter comme couvert)

- **Le budget de contexte lui-même** : aucun instrument du dépôt ne mesure ce que pèse réellement un contexte assemblé — il n'y a pas d'assembleur. Les quatre budgets restent des **conseils**, et les niveaux du § 1 sont un **jugement de conséquence**, pas une mesure. À rouvrir à la n° 10.
- **La prémisse « les jalons atteints sont injectés tous ensemble »**, qui porte le niveau `alerte` du site 3, est écrite dans `types.ts` et **vérifiée par aucun test** : aucun code n'injecte quoi que ce soit aujourd'hui. Même statut que la prémisse du bloquant « départ désert » (open_question d'it3, QA).
- **Le volume sur une aventure réelle écrite à la main** — § 5.

Fichiers lus : `C:\Users\pierr\Desktop\genliv\CLAUDE.md` · `C:\Users\pierr\Desktop\genliv\.claude\raffinage\dossier-controles-it5\cadrage.md` · `C:\Users\pierr\Desktop\genliv\src\features\dossier-controles\specification.json` · `C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.ts` · `C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.test.ts` · `C:\Users\pierr\Desktop\genliv\src\brain\dossier\validate.ts` · `C:\Users\pierr\Desktop\genliv\src\brain\dossier\issues.ts` · `C:\Users\pierr\Desktop\genliv\src\brain\dossier\tables.ts` · `C:\Users\pierr\Desktop\genliv\src\brain\dossier\destinations.ts` · `C:\Users\pierr\Desktop\genliv\src\brain\dossier\types.ts` · `C:\Users\pierr\Desktop\genliv\src\brain\dossier\couverture.test.ts`. Aucun fichier écrit, aucune commande exécutée sur l'arbre de travail.