# Roadmap — bascule « arbre de choix » → « dossier d'aventure joué par une IA »

> Source : `docs/PLAN-BASCULE-IA.dc.html` (le plan de cible) + les deux prompts d'intention de l'auteur.
> Ce document est le **plan exécutable** : il traduit la cible en features au sens de ce dépôt, dans un ordre tenable.
> Il **remplace** l'ancien `docs/ROADMAP.md` (modèle en paliers horizontaux de l'éditeur d'arbre), supprimé le 2026-08-03 avec le reste du tri — il est dans l'historique git si besoin.
>
> **Les trois décisions bloquantes (D1, D2, D3) sont tranchées le 2026-08-03.** § 1 les enregistre ; la carte D3 feature par feature est en § 1 bis, et le tri qu'elle commande est **exécuté** (voir le journal de bascule en § 1 ter).

---

## 0 — Ce qui est déjà tranché

Tiré des prompts de l'auteur et des arbitrages du plan de bascule. Ne pas rouvrir sans motif.

| # | Décision | Portée |
|---|---|---|
| 1 | **Pas de migration.** Aucun livre existant ; le format d'arbre n'est pas maintenu en parallèle. Le dossier JSON est le seul format persisté. | tout |
| 2 | **Un seul modèle, un seul niveau d'effort en v1**, mais le code prévoit un **routeur de modèle et d'effort**. On part simple, l'évolution est prévue dans la structure, pas livrée. | Temps 2 |
| 3 | **On part sur du simple, facilement modifiable dans le code.** Vaut comme règle de tranchage : à chaque fourche, la version la plus bête qui marche, pourvu que le point d'extension soit nommé. | tout |
| 4 | **L'IA ne lance jamais les dés** et ne modifie jamais une statistique. Elle *demande* un jet, le moteur le résout, elle raconte. Hasard, PV, PE, inventaire, XP restent du code déterministe, testable, rejouable. | tout |
| 5 | **L'arbre est conservé, pas supprimé** — il change de nature : jalons facultatifs, scènes écrites, fins conditionnelles. Le canevas existant est **repointé** sur un graphe de relations et d'indices : même composant, autre source de données. | Temps 1 |
| 6 | **Identifiants stables partout** (`pnj.aldur`, `lieu.caverne-basse`, `indice.sceau-brise`). Toute relation, condition ou révélation pointe un identifiant, jamais un nom libre. C'est ce qui rend le lint et la validation des sorties IA possibles. | tout |
| 7 | **Le dossier est en lecture seule pendant la partie.** Tout ce qui bouge vit dans un second JSON (session), porteur de la graine aléatoire et du journal. | Temps 2 |

## 0 bis — L'existant qu'on garde (et que le plan de bascule ignore)

Le plan de cible a été écrit sans nommer une seule feature du dépôt. Or il y en a **treize** dans `src/features/`, plus un **runtime joueur de ~4 400 lignes** dans `src/player/`. Ce runtime n'est pas à écrire : il est à **repointer**.

| Existant | Lignes | Sort |
|---|---|---|
| `player/engine/combatEngine.ts` + `combatTypes` + `capacityEffects` + `useCombat` + `CombatScreen` | ~1 500 | **conservé tel quel.** Le combat est déjà piloté par le code. Le Temps 2 n'y ajoute qu'un commentaire IA par round. |
| `player/engine/charCreation.ts` + `heroGen.ts` + `CharacterCreationScreen` | ~475 | **conservé.** La création de personnage (2D4 + 1D4 réparti) existe ; le plan la laissait en trou. |
| `player/engine/actionEngine.ts`, `sessionEngine.ts`, `usePlaySession.ts`, `PlayerRuntime.tsx` | ~1 000 | **repointés** : la source passe d'un arbre de nœuds à un dossier + jalons. C'est le cœur de `moteur-dossier`. |
| `player/components/XpShopScreen`, `EndScreen`, `HeroStatusBar`, `persist.ts` | ~440 | **conservés**, branchés sur l'état de session. |
| `player/components/NodeScreen`, `ChoiceList`, `DecorScreen`, `PnjScreen`, `TrapScreen` | ~765 | **remplacés** par la boucle narrative (champ libre au lieu d'une liste de boutons). |
| `brain/` : `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`, `bestiary.ts`, `equipment.ts`, `monsterCapacities.ts` | — | **conservés, intouchés.** Ce sont les règles ; elles sont désormais tenues par le score de mutation (`npm run test:mutation`, `break: 80`). |

---

## 1 — Les trois décisions bloquantes — **tranchées le 2026-08-03**

Elles étaient courtes à trancher et coûteuses à repousser, parce qu'elles atterrissent toutes dans la première feature, qui est le contrat entre les deux temps. Ne pas les rouvrir sans motif.

### D1 — Le langage de conditions → **un champ pour chaque**

Le schéma compte **six** familles de conditions : `canon.objectifs[].reussi_si` / `.echoue_si`, `fins[].condition`, `jalons[].declencheur`, `evenements[].declencheur`, `personnages[].plan_actions[].declencheur`, `contre_mesures[].declencheur`. *(Le plan de cible en comptait sept ; le cadrage du 2026-08-03 a fait sortir `savoirs[].revele_si` — un `jet` n'évalue pas, il **émet** une demande qui change le tour. Aplati en prédicat booléen, il forcerait l'évaluateur à lancer le dé, ce que la décision n° 4 interdit. C'est un type à part, `Revelation` à portes fermées.)* « Langage lisible » seul ne suffisait pas : « tester les conditions de fin » est dans la colonne **code** du plan (§ 2.1 étape 7), et le linter doit décider si un objectif est **atteignable**, ce qui exige du calculable.

**Décision** : chacune des six familles porte **deux champs**, pas un.

| Champ | Pour qui | Rôle |
|---|---|---|
| `…_texte` | l'IA | phrase en français, injectée telle quelle dans le contexte. Toujours rédigée ; c'est ce que l'auteur écrit en premier. |
| `…_expr` | le moteur | expression évaluable, seule autorité sur ce qui se déclenche. Facultative — absente, la condition n'est jamais déclenchée automatiquement (elle reste une intention narrative). |

Conséquences à tenir au cadrage de `dossier-format` :

- **Le moteur ne lit jamais `…_texte` pour décider**, l'IA ne lit jamais `…_expr` pour raconter. C'est la même frontière que la décision n° 4 (l'IA ne lance pas les dés) appliquée aux conditions.
- `…_expr` est **un arbre JSON, jamais une chaîne**, et **il n'existe aucun parseur** (cadrage du 2026-08-03) : `{ op: 'et' | 'ou' | 'non' | 'pred' }`, prédicats sur identifiants stables tirés d'un registre fermé. Supprimer la chaîne supprime la grammaire à spécifier, versionner et tester, toute la classe des erreurs de syntaxe, et la question de la syntaxe montrée à l'auteur — le registre `PREDICATES` pilote directement le rendu des formulaires (`label` → `Select`, `refKinds` → `TargetPicker`). L'auteur ne saisit jamais d'expression.
- Un `…_expr` présent référençant un identifiant inconnu est une **erreur bloquante** du linter (n° 7), pas un avertissement — c'est ce que D1 achète.
- Un `…_texte` sans `…_expr` sur une **fin** ou un **objectif** est une **alerte** du linter : l'aventure reste jouable, mais rien ne la terminera automatiquement.

### D2 — Où vivent les appels IA → **tous par le worker**

**Décision** : confirmée telle qu'elle était proposée. Les appels IA passent par `worker/index.ts` ; la clé d'API n'atteint jamais le client ; une route par rôle IA ; réponses en SSE pour la narration. Le « routeur de modèle et d'effort » (décision n° 2) est un **point d'extension nommé dans le worker**, pas une abstraction livrée en v1.

Chaque route nouvelle suit la checklist **Worker Route Parity** de `docs/WORKFLOW.md` — handler, entrée `ROUTE_LIMITS`, rate limit KV, garde de taille de corps, forme de réponse alignée sur le service `brain/`. Le hors-ligne n'est pas traité en v1 : sans worker joignable, le mode jeu s'arrête proprement sur un message, il ne dégrade pas vers un narrateur local.

### D3 — Le sort des features existantes, et le versionnement → **carte appliquée**

**Décision** : la carte est en § 1 bis, et le tri qu'elle commande est exécuté immédiatement (§ 1 ter) plutôt que reporté à la feature n° 2 — l'app n'est pas en service, la démolition n'a donc pas à attendre son remplacement.

**Versionnement** : le modèle en paliers horizontaux (`0.MINOR` = un palier traversant *toutes* les features) est **retiré**. Il ne survivait pas à l'arrivée de seize features neuves au stade squelette pendant que les anciennes sont à l'itération 4. À la place :

- `0.6.x` = **Temps 1** (l'éditeur produit un dossier), `0.7.x` = **Temps 2** (le moteur joue le dossier) ;
- **PATCH +1 par itération de feature livrée**, dans l'ordre de ce document ;
- les corrections de bogue ne bumpent pas seules, elles se replient dans l'itération qui les a produites ;
- plancher de session inchangé : toute session bump au minimum PATCH +1.

---

## 1 bis — La carte D3, feature par feature

Treize features au départ. **Cinq survivent**, huit sont supprimées. La colonne « pourquoi » dit ce qui, dans la bascule, décide du sort.

| Feature | Lignes | Sort | Pourquoi |
|---|---|---|---|
| `tree-canvas` | 1 703 | **repointée** (n° 2) | Décision n° 5 : même composant, autre source. Le graphe passe de nœuds + arêtes à relations + indices. |
| `book-library` | 842 | **repointée** (n° 2) | La bibliothèque liste désormais des dossiers d'aventure. Vignette = illustration du canon, plus la couverture du `sommaire`. |
| `cloud-sync` | 598 | **repointée** (n° 1) | Le transport, la file hors-ligne et la résolution de conflit sont agnostiques du document. Seule la forme persistée change. |
| `book-creation` | 346 | **repointée** (n° 2) | Créer un dossier vide au lieu d'amorcer un arbre à deux nœuds. |
| `play-mode` | 95 | **repointée** (n° 9) | Coquille modale au-dessus de `src/player/` ; elle suit le runtime. |
| `outline-view` | 1 907 | **supprimée** | Affiche l'arborescence indentée d'un arbre qui n'existe plus. Remplacée par la liste de sections (n° 2). |
| `action-decor` | 1 251 | **supprimée** | Câblée sur le type de nœud `décor`. L'`ObjectEditor` qu'elle utilisait vit déjà dans `brain/components/` : c'est la graine de `dossier-objets` (n° 5). |
| `node-editor` | 1 218 | **supprimée** | Édite un nœud d'arbre par type. Les formulaires du dossier (n° 3 à 6) n'en partagent ni l'anatomie ni les champs. |
| `choice-linking` | 994 | **supprimée** | Câble des choix ; les choix disparaissent au profit du champ libre. |
| `action-pnj` | 901 | **supprimée** | Le PNJ devient une **fiche** de 8 blocs (n° 4), pas une action attachée à un nœud. |
| `action-monster` | 807 | **supprimée** | Le bestiaire et `MonsterLibraryService` sont dans `brain/` et restent ; seule l'attache au nœud part. |
| `book-export` | 559 | **supprimée** | Exporte un `genliv-play` bâti sur nœuds + arêtes et importe le format scénario. Les deux formats sont abandonnés (décision n° 1 : pas de migration). |
| `action-trap` | 361 | **supprimée** | Idem `action-pnj` : le piège devient une entrée de registre, pas une action de nœud. |

**Ce qui n'est pas dans la carte et ne bouge pas** : `src/brain/` (règles, services, primitives) et `src/player/` (runtime joueur, ~4 400 lignes) — voir § 0 bis. Le runtime est **repointé au Temps 2**, jamais supprimé : ses écrans de combat, de création de personnage et de boutique d'XP survivent tels quels, seuls `NodeScreen` / `ChoiceList` / `DecorScreen` / `PnjScreen` / `TrapScreen` cèdent la place à la boucle narrative en n° 10.

## 1 ter — Journal de bascule (2026-08-03)

Le tri commandé par D3, exécuté. À lire avant de cadrer `dossier-format` : plusieurs points ci-dessous **sont** du travail de la n° 1.

**Supprimé — code** : les 8 features ci-dessus (~9 500 lignes, tests et `specification.json` compris) ; `brain/ActionRegistry.ts` et `brain/SlotRegistry.ts`, devenus des registres sans inscrivant ; `brain/utils/scenarioExport.ts` et `BookService.importBook()`, seul chemin d'entrée du format scénario ; les trois événements de `EventBus` devenus sans émetteur ni observateur (`action:changed`, `monster:savedToLibrary`, `book:exported`) ; le chemin « Centrer dans l'arbre » de `tree-canvas` (`RevealRequest`, la prop `reveal`, l'effet de recentrage, `useViewport.centerOn`), dont l'unique producteur était `outline-view` ; les préférences d'affichage de l'ancienne vue plan (`viewMode`, `outlineCollapsed`, `outlineDisplayMode`) dans `UIPreferencesService` ; le sélecteur arbre ↔ plan de `EditorTopBar`.

**Le modèle d'arbre survit sans producteur.** Les champs d'action de `brain/types.ts` (`actionType`, `decor`, `pnj`, `monster`, `trap`, `Edge.prereq`, `Edge.countdown`) et les écritures correspondantes de `BookService` (`updateNode`, `addEdge`, `updateEdge`, `addChoiceBranch`, `deleteNode`) n'ont plus **aucun appelant d'interface** : seules des fixtures de test les atteignent. Les branches de `bookHealth.ts`, `playExport.ts` et `automaticEdges.ts` qui en dépendent ne sont donc plus prouvées sur un chemin réel. C'est le prix assumé de garder le modèle pour que la n° 1 ait un point de comparaison — **mais il faut le savoir en cadrant la n° 1 : la couverture de ces fichiers ne vaut plus garantie d'usage.**

**Supprimé — documents** : `PROMPT_SCENE_IA.md` et sa copie `public/` (prompt du format scénario abandonné — la règle « triplet lié » de `CLAUDE.md` tombe avec) ; `docs/ROADMAP.md` (périmé, remplacé par ce document) ; les bundles de livraison déjà appliqués (`claude-design/`, `livraison/`, `specifications-jeu/`) ; les copies périmées dans `design_handoff_gamebook_editor/` (`features/`, `CLAUDE.md`, `code-knowledge.json`) ; les artefacts locaux (`dist/`, `reports/`, captures, exports de scénario).

**Promu dans le dépôt** — quatre documents contraignants ne vivaient que dans des dossiers ignorés par git, dont la source de vérité des règles du jeu (KR-130) :

| Document | Venait de | Rôle |
|---|---|---|
| `docs/REGLES-DU-JEU.md` | `specifications-jeu/` | **Source de vérité des règles** (KR-130). Toute ambiguïté de mécanique se tranche ici avant le code. |
| `docs/REGLES-PLAY.md` | `specifications-jeu/REGLES-PLAY-A-COMPLETER.md` | Complément d'orchestration du mode jeu. |
| `docs/EXIGENCE-APERCU-DU-JEU.md` | `specifications-jeu/` | Le CTA « Aperçu du jeu » et l'exigence de **runtime extractible** — contraignante pour les n° 9 et 15. |
| `docs/PLAN-BASCULE-IA.dc.html` | `claude-design/project/` | Le plan de cible, source de ce document. |
| `docs/SPEC-game-system.json` | `features/` (racine) | La spec du pack de règles — elle documentait la seule couche que la roadmap déclare conservée et intouchée, depuis un dossier racine que plus rien ne référençait. |

**Outillage réaligné** : `.eslintrc.cjs` — `FEATURE_DIRS` réduit aux cinq survivants, et le sélecteur d'import dynamique construit depuis cette même liste au lieu de la répéter en dur. Les prompts d'agents et de commandes qui citaient `features/README.md` (supprimé) sont repointés sur ce document : `/cadrer`, la skill `raffinage-iteration`, les agents `pm-produit` et `tech-lead` — dont l'invariant « les `action-*` s'enregistrent auprès d'`ActionRegistry` », devenu producteur de faux positifs.

`.gitignore` ne masque plus `docs/` (`WORKFLOW.md` y est pourtant importé par `CLAUDE.md` à chaque session) ; seul le bundle `claude-design/`, re-téléchargeable, reste ignoré.

**Laissé debout volontairement**, parce que `dossier-format` (n° 1) doit les remplacer et non les trouver déjà démolis :

- `brain/types.ts` + `kinds.ts` + `BookService` — tout le modèle d'arbre. C'est **l'objet du contrat de la n° 1** ; le démonter avant d'avoir le format cible ne laisserait rien à quoi comparer.
- `brain/utils/playExport.ts` — `src/player/types.ts` en dépend pour son `AdventureDocument`. Il tombe quand la n° 9 repointe le runtime sur le dossier.
- `brain/utils/download.ts` (`downloadJson` / `downloadText` / `slugifyFilename`) — plus aucun appelant depuis la disparition de `book-export`. Repris par la n° 1, qui livre l'import/export JSON du dossier.
- `brain/MonsterLibraryService.ts` + le `seedDefaults(BESTIARY)` de `createBrain()` — **producteur sans lecteur** : le bestiaire s'écrit une fois dans le stockage local (garde KR-132, pas de ré-injection) pour une librairie qu'aucun écran n'ouvre plus. Repris par la n° 6, dont les événements se branchent sur ce même bestiaire.
- `brain/components/` — huit primitives sans consommateur (`ObjectEditor`, `OutcomesEditor`, `Stepper`, `TargetPicker`, `ImageUpload`, `Toggle`, `Select`, `Card`). Ce sont les briques des formulaires du dossier (n° 3 à 6) ; `ObjectEditor` est nommément la graine de la n° 5.
- Les clés de préférences de l'ancienne vue plan déjà écrites chez un développeur (`viewMode`, `outlineCollapsed`, `outlineDisplayMode`) ne sont plus lues, mais `UIPreferencesService.commit()` les **recopie à chaque écriture** puisqu'il étale l'objet chargé. Aucune migration due (décision n° 1 : aucun livre existant) ; pas de routine de nettoyage non plus — une abstraction à un seul appelant est une dette. C'est la n° 2 qui réécrit `BookUIPrefs` et les fera disparaître.
- L'écran d'édition est désormais une **coquille** : barre + canevas d'arbre, sans panneau d'édition. Il tient jusqu'à la n° 2, il ne prétend à rien de plus.

---

## 2 — Temps 1 · l'éditeur produit un dossier

Huit features. Une phrase de démo par feature, sans « et » : c'est le test de dimensionnement.

| # | Feature | « À la fin, l'auteur peut… » | Itér. | Comité | Dépend de |
|---|---|---|---|---|---|
| 1 | `dossier-format` | …importer un dossier d'aventure validé contre un schéma versionné | **5** | 5 rôles | — |

| 2 | `bascule-editeur` | …naviguer dans son aventure par une liste de sections | 3 | 4 rôles | 1 |
| 3 | `dossier-canon` | …rédiger la vérité immuable de son histoire | 3 | 4 rôles | 2 |
| 4 | `dossier-fiches` | …écrire une fiche de personnage exploitable par l'IA | 5 | 5 rôles | 3 |
| 5 | `dossier-objets` | …tenir le registre des objets de son aventure | 2 | 4 rôles | 1 |
| 6 | `dossier-registres` | …tenir les quêtes, les indices, les événements de son aventure | 4 | 4 rôles | 4 · 5 |
| 7 | `dossier-controles` | …voir pourquoi son aventure n'est pas encore jouable | 3 | 5 rôles | 6 |
| 8 | `dossier-copilote` | …faire proposer un texte par l'IA, champ par champ | 3 | 5 rôles | 6 |

> **Décision A du 2026-08-04 — la forme complète des racines n'est plus portée par la n° 1.** Mesure faite sur le schéma cible § 1.4 : **~100 champs terminaux**, soit plus de 8 critères et plus de 4 lots — l'itération 2 telle qu'elle était cadrée ne passait pas le contrôle de taille. Chaque racine reçoit donc sa **forme complète dans la feature qui l'édite** : `canon` en **n° 3**, `personnages` (9 blocs) en **n° 4**, `lieux`/`objets`/`indices` en **n° 5**, `quetes`/`evenements`/`conditions` en **n° 6**. La n° 1 ne pose que ce qui est **irréversible** — ce qu'aucune migration ne rattrape. Motif : une forme sans producteur ni consommateur est la dette qui a déjà fait reporter `Delta[]` et sortir `list`/`remove` du service ; même règle, appliquée pareil. Conséquence à tenir : **`dossier-format` reste à cinq itérations**, et le contrat n'est pleinement figé qu'à la n° 6 — sans conséquence, le Temps 2 arrivant après. Corollaire non négociable (veto tech-lead) : `brain/dossier/types.ts`, `destinations.ts` et `validate.ts` ne sont **jamais** dans un lot de type `feature` — toute feature qui ajoute un champ au schéma ouvre un lot `contrat`, seul et en premier.

**1 · `dossier-format`** — schéma `schema: 1`, validateur, dossier de référence écrit à la main (6 PNJ, 5 lieux), import/export JSON. Aucun écran neuf. C'est **le contrat entre les deux temps** : tout le reste en dépend. Y atterrissent la grammaire `…_expr` de D1 et son registre de prédicats, le registre `objets[]` manquant, et les entités que le plan met au schéma sans leur donner de section (`jalons`, `fins`, `meta`). **Correction du cadrage (2026-08-03) : la n° 1 crée, elle ne détruit pas.** J'avais écrit ici qu'elle remplaçait `brain/types.ts` + `kinds.ts` + `BookService` — c'est faux : `types.ts` ne porte pas que le modèle d'arbre, il porte aussi `GameObject`, `SkillRoll`, `MonsterConfig`, `CreatureType`, importés par douze fichiers de `src/player/`, couche déclarée conservée et intouchée en § 0 bis. Un remplacement littéral emporte le combat et la création de personnage. La n° 1 livre le format **en parallèle**, sous ses propres clés, et **scinde** `types.ts` en règles (survivent) / `tree.ts` (condamné). Rayon de cette scission, **mesuré le 2026-08-04** : **26 fichiers**, une ligne d'import chacun — **21 dans `src/brain/`**, **5 dans `src/player/`** (`Edge` seul), et **zéro dans `src/features/`**, qui consomment toutes par le baril `brain/index.ts`. *(J'avais écrit ici « neuf lignes d'import à déplacer dans `src/player/` » : une estimation jamais mesurée, qui confondait le rayon de la scission avec les douze fichiers de `src/player/` important les types de règles — lesquels, eux, ne bougent pas. Le décompte se remesure, il ne se recopie pas.)* La démolition se répartit : la moitié arbre de `BookService` + `kinds.ts` en **n° 2**, `playExport` + `Book`/`Edge` en **n° 9**. Invariant du cadrage : **aucune fonction ne convertit un `Book` en `Dossier` ni l'inverse**, dans aucun sens (KR-167).

> **À porter au cadrage de cette feature** (remonté par la revue du 2026-08-03) : `FEATURE_DIRS` dans `.eslintrc.cjs` était un sur-ensemble tolérant, il est désormais exact — cinq entrées pour cinq dossiers. Seize features neuves arrivent, et **la première créée sous `src/features/` sans être ajoutée à cette liste sera silencieusement exemptée des deux règles d'isolation** : ni erreur, ni avertissement, juste une garde qui ne s'applique pas. Le commentaire porte l'intention, rien ne la vérifie. Un test unique — `readdirSync('src/features')` inclus dans `FEATURE_DIRS` — ferme la boucle. Hors périmètre d'un lot de démolition, à livrer avec la première feature neuve.

**2 · `bascule-editeur`** — la navigation latérale passe de l'arbre à une liste de sections avec compteur de fiches. L'arbre devient jalons + scènes écrites + fins conditionnelles. Le canevas est repointé sur le graphe de relations et d'indices. La démolition prévue ici a **déjà eu lieu** (§ 1 ter) : il ne reste que la construction, plus le repointage de `tree-canvas`, `book-library` et `book-creation`.

**3 · `dossier-canon`** — sections 01 synopsis & canon (synopsis MJ vs accroche joueur), 02 objectifs des camps, 07 lieux, 10 point de départ.

**4 · `dossier-fiches`** — sections 03 et 04. **Le gros morceau**, et le plan de cible le dit deux fois : « l'écran le plus important du produit ». 8 blocs, deux axes `camp` × `plan`, 6 curseurs de caractère, l'éditeur de plan d'actions (5 champs par étape), l'éditeur de savoirs avec `revele_si` à 4 conditions, le sélecteur de relations à intensité signée. Un seul formulaire pour tous les personnages. **5 itérations, pas moins.** Le bloc 3 (« caractère exploitable ») est décrit comme « le bloc qui décide de tout » — d'où `narratif-ia` au comité, et le mapping des 6 curseurs sur CA/IN/IG, aujourd'hui indéfini, est à produire ici.

**5 · `dossier-objets`** — **absente du plan de cible.** `objet_id` y est référencé à quatre endroits sans qu'aucun tableau racine ne le définisse, alors que `CLAUDE.md` en fait une règle de domaine. `action-decor` est supprimée, mais l'`ObjectEditor` qu'elle utilisait vit dans `brain/components/` et reste disponible comme graine.

**6 · `dossier-registres`** — sections 05 quêtes, 06 indices + son graphe, 08 événements (deux listes séparées par l'interrupteur « lié à l'histoire », branchées sur le bestiaire existant), 09 climat & conditions.

**7 · `dossier-controles`** — le linter d'aventure. 8 règles (4 bloquantes, 3 alertes, 1 info), badges par section. Deux règles sont fixées par D1 : un `…_expr` référençant un identifiant inconnu **bloque**, un `…_texte` sans `…_expr` sur une fin ou un objectif **alerte**. Deux règles demandent un vrai algorithme : l'atteignabilité d'un objectif et la calibration de difficulté. Nommée `controles` et non `lint` : dans ce dépôt `npm run lint` désigne ESLint depuis l'itération outillage-1.

**8 · `dossier-copilote`** — 3 assistants (Éclater le synopsis, Compléter une fiche, Tisser les indices), toujours en proposition, panneau de diff accepté champ par champ. **La « Répétition à blanc » n'est pas ici** : elle simule 20 tours joués par un joueur synthétique, donc elle exige le moteur. Elle est déplacée en n° 16.

---

## 3 — Temps 2 · le moteur joue le dossier

| # | Feature | « À la fin, le joueur peut… » | Itér. | Comité | Dépend de |
|---|---|---|---|---|---|
| 9 | `moteur-dossier` | …jouer une session pilotée par un dossier, sans IA | 4 | 5 rôles | 1 |
| 10 | `moteur-interprete` | …écrire ce qu'il veut faire en langage libre | 4 | 5 rôles | 9 |
| 11 | `moteur-arbitre` | …voir le code lancer le dé que l'IA a demandé | 3 | 5 rôles | 10 |
| 12 | `moteur-acteurs` | …parler à un PNJ qui ne révèle que ce qu'il sait | 4 | 5 rôles | 11 · 4 |
| 13 | `moteur-combat` | …lire un combat raconté que l'IA n'arbitre pas | 2 | 5 rôles | 11 |
| 14 | `moteur-horloge` | …découvrir que le monde a avancé sans lui | 3 | 5 rôles | 12 |
| 15 | `moteur-fins` | …reprendre sa partie là où il l'a laissée | 3 | 5 rôles | 14 |
| 16 | `dossier-repetition` | *(auteur)* …faire jouer son aventure par un joueur synthétique | 2 | 5 rôles | 10 · 7 |

**9 · `moteur-dossier`** — machine à états, JSON de session (10 clés racine), horloge, journal, application des deltas, console de commandes typées. Aucune génération de texte : on valide la mécanique seule. **Beaucoup plus petit que ce que le plan laisse croire** : `sessionEngine`, `actionEngine`, `usePlaySession` et `PlayerRuntime` existent — c'est un repointage de la source, pas une écriture.

**10 · `moteur-interprete`** — rôles R1 (interprète) et R3 (narrateur), cadrage de contexte, mémoire à trois niveaux (5 derniers tours intégraux / résumé glissant réécrit tous les 10 tours / faits établis jamais résumés). Pose l'infrastructure de prompt et les garde-fous du § 2.8 : sortie structurée obligatoire, aucune création d'entité, anti-complaisance, budget par tour.

**11 · `moteur-arbitre`** — rôle R2, protocole à deux appels (l'IA annonce le jet, le moteur le lance, un second appel raconte l'issue avec la marge). Branchement sur `challenge.ts` et `xp.ts`. Panneau de dés.

**12 · `moteur-acteurs`** — rôle R4, un appel par PNJ qui parle, savoirs filtrés par point de vue, conditions de révélation, échelle de confiance, carnet d'indices. C'est ce lot qui consomme les blocs 3, 6 et 7 de la fiche produite en n° 4.

**13 · `moteur-combat`** — **petit lot** : `combatEngine.ts` fait déjà tout. L'IA commente chaque round en 2–3 phrases à partir du log d'assaut, gère la sortie de combat. Une capacité spéciale de monstre reste du code, jamais une consigne de prompt.

**14 · `moteur-horloge`** — avancement des étapes de plan des PNJ, transfert d'indice entre PNJ co-localisés, armement des contre-mesures, application du climat, résumé perceptible au narrateur.

**15 · `moteur-fins`** — conditions de fin, mort du personnage, reprise, rejeu par graine, bouton « lancer le test » depuis l'éditeur. C'est ce bouton qui referme la boucle auteur → joueur.

---

## 4 — Comment on exécute

Une feature à la fois, jamais deux en parallèle.

```
/cadrer <feature> "<intention en une phrase>"   → specification.json + découpage en itérations
    puis, pour chaque itération n :
/raffiner <feature> n                           → plan signé, découpé en lots → tu valides
/essaim   <feature> n                           → exécution + intégration + qa + dossier de revue
```

**Ne pas cadrer plusieurs features d'avance.** Le format bougera au contact du code : tout ce qui aura été cadré avant sera à refaire. `dossier-format` d'abord, jusqu'au bout de ses itérations, puis la suivante.

**Composition du comité** : les 4 rôles socles partout, **plus `narratif-ia`** dès qu'une feature touche le dossier d'aventure, le moteur, les prompts ou le mode jeu — soit les n° 1, 4, 7, 8, et tout le Temps 2.

**Définition de fini** : celle de `templates/plan-iteration.md`. Toute itération touchant `challenge`, `combat`, `xp` ou `characteristics` passe `npm run test:mutation` au-dessus de `break: 80`.

---

## 5 — Les trous du plan de cible, à combler au cadrage

Relevés en lecture intégrale. Chacun est affecté à la feature qui doit le traiter.

| Trou | À traiter dans |
|---|---|
| ~~Aucun registre `objets[]` racine~~ → **tranché au cadrage** : le dossier a **treize** racines, `objets[]` comprise — sans elle l'intégrité référentielle de l'itération 3 n'a pas de cible | n° 1 (la racine) · n° 5 (son éditeur) |
| ~~Grammaire des conditions non définie~~ → **D1 tranchée** : deux champs par famille (`…_texte` pour l'IA, `…_expr` pour le moteur) | n° 1 (grammaire + registre de prédicats) |
| `jalons`, `fins`, `meta` au schéma sans section ni écran — `jalons` et `fins` sont groupées sous `charpente` ; `meta` n'est **pas** une racine (tranché le 2026-08-04). `charpente` n'est plus « **jamais** injectée » mais « **jamais injectée ENTIÈRE** » : une projection nommée en porte **une** feuille — l'`enonce_texte` des jalons **déjà atteints** —, jamais les déclencheurs ni les conditions de fin, qui sont la même règle en français et apprendraient au modèle à provoquer le jalon ou à conduire à la fin | n° 1 (la forme + `enonce_texte`) · n° 2 (les écrans) · n° 9 (la projection) |
| « Scènes écrites » : le format porte un texte et un drapeau (n° 1), mais leur propriété définissante est un **chemin de code** — une scène verbatim est **émise** par le moteur, jamais demandée au modèle | n° 1 (le champ) · n° 10 (l'émission) |
| Mapping des 6 curseurs sur CA / IN / IG non donné | n° 4 |
| Atteignabilité d'un objectif, calibration de difficulté : aucune formule | n° 7 |
| Échelle de confiance : bornes, valeur initiale, amplitude d'un delta | n° 12 |
| `ΔT` invoqué pour le calcul d'XP, jamais défini | n° 11 |
| Choix de posture du monstre « selon sa capacité et son IG » non spécifié | n° 13 — vérifier `combatEngine.ts`, c'est peut-être déjà fait |
| ~~Format de `evenements[].monstre_ref`~~ → **tranché au cadrage** : `bestiaire.<templateId>`, second espace de noms résolu contre `BESTIARY` ; référence pendante = bloquante à l'import **et** au démarrage de session | n° 1 |
| ~~Fournisseur, modèle, clé, coût, latence, hors-ligne~~ → **D2 tranchée** : tout par le worker, clé jamais côté client, une route par rôle, SSE pour la narration, pas de hors-ligne en v1 | n° 10 (modèle et budget concrets) |
| Persistance du dossier, bibliothèque multi-livres, `cloud-sync` | n° 1 (forme persistée) · n° 2 (bibliothèque) |
| Migration `schema: 1` → `schema: 2` | n° 1 |
| Champs laissés en `[ … ]` : `quetes[].etapes`, `journal[].deltas`, `memoire.faits_etablis` | n° 1 · n° 9 |

**Incohérences internes du plan de cible**, à corriger et non à propager : I2 annonce « les trois sections les plus simples » pour quatre sections ; le compteur de règles de lint dit 7 pour 8 règles définies ; la clé `plan` est utilisée deux fois dans l'objet `personnages` — **tranché au cadrage du 2026-08-03** : `portee: 'premier' | 'second'` et `plan_actions[]` ; le préfixe d'identifiant `pnj.` cohabite avec la collection `personnages`.

---

## 6 — Hors périmètre de cette roadmap

Mode multi-joueur · internationalisation · thème sombre · accessibilité (décision projet : retirée du cadre, l'opérabilité clavier reste exigée comme ergonomie de rédaction) · undo/historique d'édition · le troisième instrument de vérification différé (specs navigateur pour le canevas, cf. skill `raffinage-iteration`).
