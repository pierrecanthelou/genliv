# Roadmap — bascule « arbre de choix » → « dossier d'aventure joué par une IA »

> Source : `docs/PLAN-BASCULE-IA.dc.html` (le plan de cible) + les deux prompts d'intention de l'auteur.
> Ce document est le **plan exécutable** et un **index**, jamais un journal : il dit ce qui reste à faire et qui le porte. Le raisonnement d'une décision livrée vit dans le `specification.json` de sa feature et dans `.claude/raffinage/<feature>-it<N>.revue.md` ; l'histoire des recadrages vit dans `CHANGELOG.md` et dans git.
>
> **Compacté le 2026-09-19** (budget de contexte, `docs/WORKFLOW.md`) : le § 1 ter « journal de bascule », les corrections de cadrage feature par feature et les trous déjà tranchés sont sortis d'ici. Rien de contraignant n'a été perdu — ce qui suit est la totalité de ce qui engage un cadrage à venir.

---

## 0 — Ce qui est déjà tranché

Ne pas rouvrir sans motif.

| # | Décision | Portée |
|---|---|---|
| 1 | **Pas de migration.** Aucun livre existant ; le format d'arbre n'est pas maintenu en parallèle. Le dossier JSON est le seul format persisté. | tout |
| 2 | **Un seul modèle, un seul niveau d'effort en v1**, mais le code prévoit un **routeur de modèle et d'effort** — point d'extension nommé, pas abstraction livrée. | Temps 2 |
| 3 | **La version la plus bête qui marche**, à chaque fourche, pourvu que le point d'extension soit nommé. | tout |
| 4 | **L'IA ne lance jamais les dés** et ne modifie jamais une statistique. Elle *demande* un jet, le moteur le résout, elle raconte. Hasard, PV, PE, inventaire, XP restent du code déterministe. | tout |
| 5 | **L'arbre est conservé, pas supprimé** — il change de nature : le canevas est repointé sur un graphe de lieux, d'accès et d'indices (§ 2 bis, D10–D11). | Temps 1 |
| 6 | **Identifiants stables partout** (`pnj.aldur`, `lieu.caverne-basse`). Toute relation, condition ou révélation pointe un identifiant, jamais un nom libre. | tout |
| 7 | **Le dossier est en lecture seule pendant la partie.** Tout ce qui bouge vit dans un second JSON (session), porteur de la graine et du journal. | Temps 2 |

### D1 — Le langage de conditions : **un champ pour chaque**

Les **six** familles de conditions (`canon.objectifs[].reussi_si` / `.echoue_si`, `charpente.fins[].condition`, `charpente.jalons[].declencheur`, `monde.evenements[].declencheur`, `monde.personnages[].plan_actions[].declencheur`, `.contre_mesures[].declencheur`) portent chacune **deux champs** :

| Champ | Pour qui | Rôle |
|---|---|---|
| `…_texte` | l'auteur | phrase en français, écrite en premier. **Jamais injectée** — c'est `…_expr` en français, et l'injecter mettrait la même règle dans le code **et** dans le prompt. |
| `…_expr` | le moteur | **arbre JSON, jamais une chaîne, et il n'existe aucun parseur** : `{ op: 'et' / 'ou' / 'non' / 'pred' }`, prédicats du registre fermé `PREDICATES`. L'auteur ne saisit jamais d'expression — `label` pilote le `Select`, `refKinds` le `TargetPicker`. Facultative : absente, la condition ne se déclenche jamais automatiquement. |

Un `…_expr` pointant un identifiant inconnu est une **erreur bloquante** du linter ; un `…_texte` sans `…_expr` sur une fin ou un objectif est une **alerte**. `savoirs[].revele_si` n'est PAS de cette famille : un `jet` n'évalue pas, il **émet** une demande qui change le tour (décision n° 4) — c'est `Revelation`, à portes fermées.

### D2 — Les appels IA passent tous par le worker

Clé d'API jamais côté client ; une route par rôle IA ; SSE pour la narration au Temps 2. Chaque route neuve suit la checklist **Worker Route Parity** de `docs/WORKFLOW.md` (KR-233 fait foi, `worker/index.test.ts` la tient). Le hors-ligne n'est pas traité : sans worker joignable, le mode jeu s'arrête sur un message, il ne dégrade pas vers un narrateur local.

### D3 — Versionnement

`0.6.x` = **Temps 1 et sa dette** (features n° 1–8 et § 2 bis), `0.7.x` = **Temps 2** (n° 9–16). **PATCH +1 par itération livrée**, dans l'ordre de ce document. Les corrections de bogue ne bumpent pas seules. Plancher de session : PATCH +1 minimum.

### Décision A (2026-08-04) — chaque racine reçoit sa forme dans la feature qui l'édite

Corollaire non négociable (veto tech-lead), **toujours en vigueur** : `brain/dossier/types.ts`, `destinations.ts` et `validate.ts` ne sont **jamais** dans un lot de type `feature`. Toute tranche qui touche le schéma ouvre un lot `contrat`, **seul et en premier**.

---

## 0 bis — L'existant qu'on garde

`src/player/` porte un **runtime joueur de ~4 400 lignes** qui n'est pas à écrire mais à **repointer**.

| Existant | Lignes | Sort |
|---|---|---|
| `player/engine/combatEngine.ts` + `combatTypes` + `capacityEffects` + `useCombat` + `CombatScreen` | ~1 500 | **conservé tel quel.** Le Temps 2 n'y ajoute qu'un commentaire IA par round (n° 13). |
| `player/engine/charCreation.ts` + `heroGen.ts` + `CharacterCreationScreen` | ~475 | **conservé.** 2D4 + 1D4 réparti ; le plan de cible la laissait en trou. |
| `player/engine/actionEngine.ts`, `sessionEngine.ts`, `usePlaySession.ts`, `PlayerRuntime.tsx` | ~1 000 | **repointés** sur le dossier + les jalons — c'est le cœur de la n° 9. |
| `player/components/XpShopScreen`, `EndScreen`, `HeroStatusBar`, `persist.ts` | ~440 | **conservés**, branchés sur l'état de session. |
| `player/components/NodeScreen`, `ChoiceList`, `DecorScreen`, `PnjScreen`, `TrapScreen` | ~765 | **remplacés** par la boucle narrative (n° 10). |
| `brain/challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`, `bestiary.ts`, `equipment.ts`, `monsterCapacities.ts` | — | **conservés, intouchés.** Tenus par le score de mutation. |

**Encore debout, avec leur date de démolition** : `brain/types.ts` (moitié arbre) + `kinds.ts` + `BookService` + `brain/utils/playExport.ts` + `buildAdventureDocument` + `src/features/play-mode/` → tous en **n° 9**, seule propriétaire d'extinction (KR-181), **y compris la ligne d'avis « vos anciens livres restent stockés »** de la bibliothèque, à retirer dans le même lot que sa donnée source. `src/features/tree-canvas/` n'est pas de cette liste : il est **repointé** en D10–D11, pas démoli.

---

## 1 — Temps 1 · l'éditeur produit un dossier — **terminé**

Huit features, **48 itérations livrées**, `0.6.50`.

| # | Feature | « À la fin, l'auteur peut… » | Itér. | Statut |
|---|---|---|---|---|
| 1 | `dossier-format` | …importer un dossier d'aventure validé contre un schéma versionné | 5 | **5/5 ✅** |
| 2 | `bascule-editeur` | …naviguer dans son aventure par une liste de sections | 3 | **3/3 ✅** |
| 3 | `dossier-canon` | …rédiger la vérité immuable de son histoire | 4 | **4/4 ✅** |
| 4 | `dossier-fiches` | …écrire une fiche de personnage exploitable par l'IA | 8 | **8/8 ✅** |
| 5 | `dossier-objets` | …tenir le registre des objets de son aventure | 2 | **2/2 ✅** |
| 6 | `dossier-registres` | …tenir les quêtes, les indices, les événements de son aventure | 5 | **5/5 ✅** |
| 7 | `dossier-controles` | …voir pourquoi son aventure n'est pas encore jouable | 10 | **10/10 ✅** — 9 règles livrées ; le décompte cible de 11 est caduc depuis it8 |
| 8 | `dossier-copilote` | …faire proposer un texte par l'IA, champ par champ | 6 | **6/6 ✅** — 7 assistants ; pose la route `/ia/:role`, l'enveloppe de sortie et le rejeu-une-fois, dont le Temps 2 hérite |

**Colonne `Statut`** — itérations **livrées / prévues**, *projetées* depuis `plan.iterations[].status` du `specification.json` : elle se recopie, elle ne se décide pas ici (source unique, étape 4 des Build Steps). Ce tableau ne dit rien d'un raffinage en cours.

---

## 2 bis — Temps 1 bis · la dette du Temps 1 — **le travail en cours**

Onze tranches, `0.6.51` → `0.6.61`. Chacune ferme une dette que le Temps 1 a laissée **sans propriétaire** : elle n'apparaîtrait dans aucun cadrage à venir si elle n'était pas écrite ici. Ordre = dépendances d'abord, puis coût croissant. **Une tranche à la fois**, même rituel que les features.

| # | Tranche | « À la fin… » | Itér. | Statut | Comité | Dépend de |
|---|---|---|---|---|---|---|
| D1 | `dette-correctifs` *(hors cycle)* | …plus aucune consigne de remédiation ne nomme une surface inexistante | 1 | — | 4 rôles | — |
| D2 | `dossier-canon` it5 | …relier ses lieux les uns aux autres | 1 | — | 4 rôles | — |
| D3 | `dossier-canon` it6 | …composer l'inventaire de départ du héros | 1 | — | 4 rôles | — |
| D4 | `dossier-registres` it6 | …retirer une entrée de ses registres | 1 | — | 4 rôles | — |
| D5 | `dossier-registres` it7 | …voir signalée une intrigue laissée en second plan | 1 | — | 5 rôles | D4 |
| D6 | `book-library` it4 | …renommer et dupliquer un dossier | 1 | — | 4 rôles | — |
| D7 | `dossier-controles` it11 | …sauter au champ fautif depuis le panneau Contrôles | 1 | — | 4 rôles | — |
| D8 | `outillage-2` *(hors cycle)* | *(outillage)* le score de mutation cesse de mentir sur `combat.ts` | 1 | — | tech-lead | — |
| D9 | `outillage-3` *(hors cycle)* | *(outillage)* le canevas devient vérifiable par un instrument | 1 | — | tech-lead | D8 |
| D10 | `tree-canvas` it7 | …voir son aventure comme un graphe de lieux et d'accès | 1 | — | 4 rôles | D2 · D9 |
| D11 | `tree-canvas` it8 | …y lire aussi les personnages, leurs relations et le chaînage des indices | 1 | — | 4 rôles | D10 |

**D1 · `dette-correctifs`** — quatre défauts connus, aucun lié, tous dans des fichiers déjà livrés ; un lot par feature touchée, propriété disjointe. (a) **BUG-090** (major) : la remédiation de `condition-sans-expr` envoie l'auteur vers une surface dont it7 a mesuré l'inexistence **dans le même fichier** — consigne circulaire ; on réécrit le texte vers une surface qui existe, on ne construit pas la surface. (b) Un passage de tabulation dans un champ de prose vide **écrit la chaîne vide** là où il y avait un absent, et émet `dossier:updated` — le `commit()` des `Panneau*` doit distinguer absent et vide. (c) Un `nom` d'entité **non textuel** (`nom: 42`) traverse `validateDossier` : dernier écart type/validateur connu, lot `contrat`. (d) `EYEBROW_REFUS` / `TEXTE_ABSENT` sont recopiés **à l'identique dans trois features** — promotion vers `brain/components/` (KR-109). **Charge de tenue incluse** : `book-library` et `cloud-sync` passent à `status: "done"` (toutes leurs itérations le sont depuis leur repointage) ; `book-creation` (2 logs / 3 itérations) et `tree-canvas` (3 / 6) reçoivent leurs `iterations_log` manquants.

**D2 · `dossier-canon` it5 — `lieux[].acces`** — la seule dette du Temps 1 qui en bloque deux autres, et la seule référence croisée de `Lieu` qu'aucun prédicat n'exprime (§ 4). Assignée par erreur de proximité à la n° 5 puis refusée (KR-200), déclarée impossible en n° 6 (KR-205), reconfirmée sans propriétaire par la n° 7 : **elle revient à `dossier-canon`, qui possède `PanneauLieux.tsx` et `FicheLieu.tsx`**. Forme déjà tranchée au raffinage d'it3 de la n° 1, à ne pas re-débattre : **arête ORIENTÉE**, une entrée = un sens, un passage réciproque = deux entrées (une bidirectionnalité implicite obligerait linter, canevas et moteur à matérialiser l'arête inverse à chaque lecture — KR-013). Lot `contrat` d'abord. **Effet de bord à tenir dans la même tranche** : `atteignabilite.ts` câble aujourd'hui une **hypothèse de monde ouvert** (KR-224) faute de graphe à interroger, et le bloquant « lieu de départ désert » repose sur cette prémisse — la tranche qui livre le graphe lève l'hypothèse, ou écrit pourquoi elle la garde.

**D3 · `dossier-canon` it6 — `depart.inventaire_initial`** — `Charpente.Depart` ne porte que `lieu_id` et `texte_ouverture_joueur` ; rien ne dit avec quoi le héros commence. C'est le **seul placement initial légitime** du dossier (sur le héros, jamais dans un lieu — § 4), et la n° 9 en a besoin pour amorcer l'inventaire de session. Écran : `PanneauDepart.tsx`. Lot `contrat` d'abord.

**D4 · `dossier-registres` it6 — le retrait** — les six registres de la feature (indices, quêtes, événements, climats, jalons, fins) sont **en ajout seul** : aucun `RetirerXDialog`, contrairement à `dossier-objets` et `dossier-fiches` qui en ont chacune reçu un. Action dangereuse au sens de `docs/WORKFLOW.md` → dialogue de confirmation, `color="error"`, chemin « Annuler » nommé. Le refus par référence pendante au SSOT est déjà couvert depuis la n° 4 it6 — cette tranche le consomme, elle ne le réécrit pas.

**D5 · `dossier-registres` it7 — « Intrigue en second plan »** — les deux moitiés reviennent **ensemble**, et la même feature les porte : `Indice.portee` (`PORTEES_INDICE = ['canon','quete']`) existe dans le type **sans écran ni lecteur** depuis la n° 6, et la règle de lint du plan-cible § 1.6 qui devait la consommer n'a jamais été écrite. L'écran est dans `PanneauIndices.tsx` / `FicheIndice.tsx` (lot feature) ; la règle est dans `brain/dossier/controles.ts` (lot contrat) — **aucun fichier de `dossier-controles` n'est touché**, son panneau rend le rapport génériquement. Dixième règle du linter. Comité à 5 rôles : la règle décide de ce qui entre dans un contexte de modèle.

**D6 · `book-library` it4 — renommer et dupliquer** — `DossierService.rename` / `duplicate` n'existent pas ; ils étaient laissés dehors « tant que personne ne les appelle », propriétaire écrit comme « la prochaine feature qui touche `book-library` ». C'est celle-ci. Précédent exact à imiter : `book-library` avait elle-même reçu `rename`/`duplicate` après son walking skeleton, pas dedans.

**D7 · `dossier-controles` it11 — le saut au champ fautif** — déclaré sans lot étanche possible au cadrage du 2026-09-15 parce qu'il traverse les `Panneau*` de quatre features. **Il l'est avec le motif que `docs/WORKFLOW.md` documente déjà** (« Cross-feature UI action registration ») : un registre dans `brain/` où chaque section inscrit son gestionnaire de focus, que le panneau Contrôles appelle par identifiant de champ. Une itération, cinq lots à propriété disjointe — le registre, puis un lot par feature adoptante. La valeur noop par défaut garde chaque section sûre tant qu'elle n'a pas adopté, donc les lots tombent dans n'importe quel ordre. **Reste hors périmètre, explicitement** : le routage vers la section du *remède* — s'il arrive un jour, le critère de navigation d'it4 sera SUPERSEDED, jamais régressé.

**D8 · `outillage-2`** — sa spécification **est écrite** et ne se réécrit pas : `.claude/raffinage/outillage-it1.revue.md` porte la table de correspondance complète (les numéros de ligne du dépôt **après** le lot A, pas ceux du plan). **21 tests**, concentrés sur `combat.ts`, seul fichier sous les 80 % (**62,50 %**, 20 survivants + 7 sans couverture). Deux charges de plus, au même endroit : le **`rng` non seedé de `combat.ts:107`** — mutant `ObjectLiteral` qui fait retomber le tirage sur `Math.random`, cause identifiée du ±1 mutant entre deux runs, à corriger en passant un `rng` explicite plutôt qu'en s'appuyant sur le défaut ; et **BUG-035** — `var(--surface-raised)`, référencé dans `ImageUpload.tsx:185`, n'existe dans aucun fichier de `src/styles/tokens/`, avec la règle ESLint qui manque pour détecter un token qui ne résout vers rien. `thresholds.break` se relève de +5 sur la mesure finale, plafond 90, et **aucun fichier ne recule** (lecture à ±1 mutant près).

**D9 · `outillage-3`** — le **troisième instrument de vérification**, différé depuis l'origine : des specs navigateur pour le canevas. Il cesse d'être différable au moment exact où D10 rouvre `tree-canvas` — 1 703 lignes de Dagre, de culling de viewport et de drag de sous-arbre qu'aucun test ne couvre, et que jsdom ne *peut* pas couvrir puisqu'il ne calcule aucun layout (même mur que la largeur rendue d'un badge composé, non vérifiée par personne depuis la n° 7 it2). Une seconde charge y tient, de même nature — **aucun instrument ne vérifie l'unicité des `BUG-xxx` à travers les sept fichiers `bug_history*.json`** : la règle ne vit que dans leurs `_about` et a déjà dérivé en silence une fois (précédent BUG-062).

**D10 · `tree-canvas` it7 — le graphe de lieux et d'accès** — la décision n° 5 tenue enfin : même composant, autre source. Le canevas cesse de lire `BookNode`/`Edge` et lit `monde.lieux[]` + `lieux[].acces` (arêtes orientées, D2). C'est ce qui justifie rétroactivement de l'avoir gardé sur disque, intact, plutôt que supprimé puis reconstruit. Sa `specification.json` perd la mention « en sommeil ».

**D11 · `tree-canvas` it8 — les personnages, les relations, les indices** — la seconde couche du même canevas : les personnages placés par `presence[].lieu_id`, leurs `relations[]` à intensité signée, et le chaînage `indices[].mene_a` que la n° 6 rend aujourd'hui en liste textuelle. Rien de neuf au schéma — **lot `contrat` interdit dans cette tranche** : s'il en faut un, c'est qu'elle a dérivé.

---

## 3 — Temps 2 · le moteur joue le dossier

Le Temps 2 ne commence qu'une fois le § 2 bis clos, sur go explicite. `0.7.x`.

| # | Feature | « À la fin, le joueur peut… » | Itér. | Statut | Comité | Dépend de |
|---|---|---|---|---|---|---|
| 9 | `moteur-dossier` | …jouer une session pilotée par un dossier, sans IA | 4 | — | 5 rôles | D3 · D11 |
| 10 | `moteur-interprete` | …écrire ce qu'il veut faire en langage libre | 4 | — | 5 rôles | 9 |
| 11 | `moteur-arbitre` | …voir le code lancer le dé que l'IA a demandé | 3 | — | 5 rôles | 10 · D8 |
| 12 | `moteur-acteurs` | …parler à un PNJ qui ne révèle que ce qu'il sait | 4 | — | 5 rôles | 11 |
| 13 | `moteur-combat` | …lire un combat raconté que l'IA n'arbitre pas | 2 | — | 5 rôles | 11 |
| 14 | `moteur-horloge` | …découvrir que le monde a avancé sans lui | 3 | — | 5 rôles | 12 |
| 15 | `moteur-fins` | …reprendre sa partie là où il l'a laissée | 3 | — | 5 rôles | 14 |
| 16 | `dossier-repetition` | *(auteur)* …faire jouer son aventure par un joueur synthétique | 2 | — | 5 rôles | 10 · 7 |

**9 · `moteur-dossier`** — machine à états, JSON de session (10 clés racine), horloge, journal, application des deltas, console de commandes typées. Aucune génération de texte : on valide la mécanique seule. **Beaucoup plus petit que le plan de cible ne le laisse croire** — `sessionEngine`, `actionEngine`, `usePlaySession` et `PlayerRuntime` existent. Porte aussi, et c'est du travail réel : **toute la démolition du modèle d'arbre** (§ 0 bis), le branchement de `RapportControles.jouable` sur `previewDisabledReason` du CTA « Aperçu du jeu » (désactivé en dur aujourd'hui), le refus d'ouvrir une partie sur un `texte_ouverture_joueur` encore marqué `MARQUEUR_A_ECRIRE`, la **projection des jalons atteints** (leur `enonce_texte` seul, jamais les déclencheurs ni les conditions de fin), l'avancement de `quetes[].etapes`, et les deux champs que le plan de cible laisse en `[ … ]` : `journal[].deltas` et `memoire.faits_etablis`. La contrainte de **runtime extractible** de `docs/EXIGENCE-APERCU-DU-JEU.md` s'applique à toute la feature.

**10 · `moteur-interprete`** — rôles R1 (interprète) et R3 (narrateur), cadrage de contexte, mémoire à trois niveaux (5 derniers tours intégraux / résumé glissant réécrit tous les 10 tours / faits établis jamais résumés). Pose les garde-fous du § 2.8 : sortie structurée obligatoire, aucune création d'entité, anti-complaisance, budget par tour. **C'est ici que la « scène écrite » devient réelle** : sa propriété définissante est un chemin de code — une prose verbatim est **émise** par le moteur, jamais demandée au modèle. Porte aussi le **balayage du budget de contexte des onze chemins de prose `ia`** — un seul balayage, jamais trois chemins bornés sur onze, sous peine que le silence cesse de signifier « sous budget » ; avertissement non bloquant, aucune migration.

**11 · `moteur-arbitre`** — rôle R2, protocole à deux appels (l'IA annonce le jet, le moteur le lance, un second appel raconte l'issue avec la marge). Branchement sur `challenge.ts` et `xp.ts`. Panneau de dés. **Définit `ΔT`**, invoqué par le plan de cible pour le calcul d'XP et jamais défini — dans `docs/REGLES-DU-JEU.md` d'abord (KR-130), puis `rules.golden.test.ts`, puis le code. Touche les quatre fichiers mutés : `npm run test:mutation` au-dessus du `break` en vigueur.

**12 · `moteur-acteurs`** — rôle R4, un appel par PNJ qui parle, savoirs filtrés par point de vue, conditions de révélation, carnet d'indices. Consomme les blocs 3, 6 et 7 de la fiche produite en n° 4. **Définit l'échelle de confiance** (bornes, valeur initiale, amplitude d'un delta), **arrête les valeurs de `PorteeContreMesure`** (`'personnage' | 'groupe' | 'lieu'`, posées par la n° 4 sans consommateur) et **écrit le contrat de sortie « R4 · acteur »** (`{replique, indices_reveles, delta_confiance}`, échec → rejeu puis repli déterministe), esquissé au raffinage d'it5 de la n° 4 et volontairement non figé alors.

**13 · `moteur-combat`** — **petit lot** : `combatEngine.ts` fait déjà tout. L'IA commente chaque round en 2–3 phrases à partir du log d'assaut, gère la sortie de combat. Une capacité spéciale de monstre reste du code, jamais une consigne de prompt. **Vérifier `combatEngine.ts` avant de spécifier** le choix de posture du monstre « selon sa capacité et son IG » : c'est peut-être déjà fait.

**14 · `moteur-horloge`** — avancement des étapes de plan des PNJ, transfert d'indice entre PNJ co-localisés, armement des contre-mesures, résumé perceptible au narrateur. **Rend enfin vrai le § 09 du plan de cible**, explicitement non tenu à la fin du Temps 1 : `Climat.effets_regles` est une donnée que rien ne sait appliquer — cette feature lui donne son **instant d'application** et son **idempotence**, et consomme `Climat.duree`, dont l'allumage et l'extinction (`horloge.climat_actif`) sont un état de SESSION, jamais du dossier (KR-207).

**15 · `moteur-fins`** — conditions de fin, mort du personnage, reprise, rejeu par graine, bouton « lancer le test » depuis l'éditeur. C'est ce bouton qui referme la boucle auteur → joueur.

**16 · `dossier-repetition`** — vingt tours joués par un joueur synthétique. Dispose donc d'un héros réel plutôt que d'une référence inventée : c'est ce qui rend calculable la règle **« Difficulté non calibrée »**, reportée ici depuis la n° 7.

---

## 4 — Ce qui est CLOS et ne se rouvre pas

Relevé au balayage du 2026-09-19. Ces points ont traversé plusieurs cadrages comme « trous » ; ils sont tranchés **sans travail**, et les rouvrir coûterait une seconde source de vérité.

| Point | Décision |
|---|---|
| **Références croisées de `Lieu`** vers personnages / objets / indices / événements | **Aucun champ, jamais.** Le lien personnage↔lieu **existe déjà** (`presence[].lieu_id`) ; les trois autres s'expriment en **déclencheur**, par le prédicat `lieu_courant_est` (un objet entre en jeu par un `Delta`, un indice par une `Revelation`, un événement par son `declencheur_expr`). Un tableau stocké en serait l'inverse, que rien ne re-synchronise — **cinquième occurrence** de l'anti-patron déjà rejeté pour `tier` (KR-192), `Quete.lie_au_canon` (KR-206), `scene`/`obstacle`/`monstre`, et `Indice.portee` comme classement. Seul `acces` survit : la topologie n'est exprimable par aucun prédicat (→ D2). |
| **`rattachement.quete_id`** sur un personnage de second plan | **Aucun champ.** `Quete.donneur_id` porte déjà le lien personnage↔quête ; l'inverse se calcule au rendu (KR-013). Si la n° 12 a besoin d'un rattachement d'une autre nature que « donneur », elle l'ouvrira avec son consommateur nommé. |
| **Possession d'un objet par un personnage**, jet requis pour l'utiliser | **Hors du dossier.** Un inventaire est un état de SESSION (décision n° 7) ; son unique contrepartie Temps 1 est `depart.inventaire_initial` (→ D3). Un objet n'a pas de lieu : il entre en jeu par un `Delta`, jamais par une position initiale. |
| **Migration `schema: 1` → `schema: 2`** | **Aucun chemin, et c'est définitif pour `schema: 1`** (KR-160/191) : une migration n'est pas testable avant qu'un schéma 2 existe, et le seul critère recevable — le rejet de toute valeur autre que 1, avec un code distinct — est livré. Conséquence assumée, à connaître avant d'ajouter un champ : **tout champ ajouté à `schema: 1` est optionnel à vie**, un champ requis de plus invaliderait rétroactivement tout dossier déjà écrit. Le jour où une rupture est nécessaire, elle crée `schema: 2` et son convertisseur, tous deux propriété de la feature qui rompt. |
| **`savoirs[].revele_si` comme septième famille de conditions** | Hors D1, définitivement : un `jet` émet une demande, il n'évalue pas. Type à part (`Revelation`, portes fermées). |
| **Éditer le texte « après » avant de l'accepter** (copilote) | Différé par l'UX à quatre tours de comité successifs ; le `Field` « APRÈS » reste en lecture seule, `onChange` explicite et commenté. Amélioration réelle, à rouvrir sur un besoin exprimé, pas avant. |

---

## 5 — Hors périmètre

Mode multi-joueur · internationalisation · thème sombre · accessibilité (décision projet ; l'opérabilité clavier reste exigée comme ergonomie de rédaction) · undo / historique d'édition · le routage vers la section du remède dans le panneau Contrôles (D7).

---

## 6 — Comment on exécute

Une tranche à la fois, jamais deux en parallèle, dans l'ordre de ce document : **§ 2 bis D1 → D11, puis § 3 n° 9 → n° 16.**

```
/cadrer <feature> "<intention en une phrase>"   → specification.json + découpage en itérations
    puis, pour chaque itération n :
/raffiner <feature> n                           → plan signé, découpé en lots → tu valides
/essaim   <feature> n                           → exécution + intégration + qa + dossier de revue
```

Les tranches **hors cycle de feature** (D1, D8, D9) n'ont pas de `/cadrer` : leur périmètre est écrit ci-dessus, elles entrent directement en `/raffiner` et journalisent dans `CHANGELOG.md` + `bug_history.*.json`, sans `specification.json` propre.

**Ne pas cadrer plusieurs features d'avance.** Le format bouge au contact du code : tout ce qui aura été cadré avant sera à refaire.

**Composition du comité** : les 4 rôles socles partout, **plus `narratif-ia`** dès qu'une tranche touche le dossier d'aventure, le moteur, les prompts ou le mode jeu — soit D5 et tout le § 3.

**Définition de fini** : celle de `templates/plan-iteration.md`. Toute itération touchant `challenge`, `combat`, `xp` ou `characteristics` passe `npm run test:mutation` au-dessus du `break` en vigueur.

**Au franchissement d'un plafond de contexte** (`docs/WORKFLOW.md`), la compaction se fait **dans le lot qui l'a franchi**. Pour ce document, la moitié qui part est l'archive — motifs d'une décision livrée, corrections de cadrage, historique des recadrages — jamais les colonnes `Statut` ni le § 4.

> **Ce fichier n'est pas dans le périmètre Prettier du dépôt** (`npm run format` ne vise que `{src,worker}/**/*.{ts,tsx,css}`). Ne pas lancer `prettier --write` dessus : l'alignement des tables lui coûterait ~8 kio de budget de contexte pour zéro lisibilité.
