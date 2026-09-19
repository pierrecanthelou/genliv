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
| 5 | **L'arbre est conservé, pas supprimé** — il change de nature. Le canevas reste sur disque, en sommeil ; son repointage sur un graphe de lieux et d'accès est **différé après le Temps 2** (§ 2 bis), rien n'en dépendant. | Temps 1 |
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

**Encore debout, avec leur date de démolition** : `brain/types.ts` (moitié arbre) + `kinds.ts` + `BookService` + `brain/utils/playExport.ts` + `buildAdventureDocument` + `src/features/play-mode/` → tous en **n° 9**, seule propriétaire d'extinction (KR-181), **y compris la ligne d'avis « vos anciens livres restent stockés »** de la bibliothèque, à retirer dans le même lot que sa donnée source. `src/features/tree-canvas/` n'est pas de cette liste : il est **repointé après le Temps 2** (§ 2 bis), pas démoli.

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

## 2 bis — La dette du Temps 1

**Corrigé le 2026-09-19, au premier `/raffiner`.** La version précédente de cette section ordonnançait onze tranches `D1` → `D11`. Passées au contrôle de taille de la skill `raffinage-iteration`, **trois sur onze** étaient correctement dimensionnées ; appliqué à la lettre, le découpage en donnait ~25. La faute n'était pas le dimensionnement : c'était d'avoir **ordonnancé un inventaire**. Onze dettes recensées ne font pas onze itérations dues avant le Temps 2.

Ce que ce § 2 bis dit maintenant : **deux tranches se paient avant le Temps 2**, tout le reste est une **dette à déclencheur** — attachée au moment où quelqu'un rouvre son fichier, idiome que ce dépôt pratique déjà (« le premier lot qui rouvrira X »). Ce n'est pas un report : un calendrier que personne ne tient est moins fiable qu'un déclencheur qui part tout seul.

### Le chemin bloquant — 2 tranches, `0.6.51` → `0.6.52`

| # | Tranche | « À la fin… » | Statut | Comité | Dépend de |
|---|---|---|---|---|---|
| B1 | `dossier-canon` it5 | …relier ses lieux les uns aux autres | — | 5 rôles | — |
| B2 | `outillage-2` *(hors cycle)* | *(outillage)* le score de mutation cesse de mentir sur `combat.ts` | — | tech-lead | — |

**B1 · `lieux[].acces`** — pas bloquante au sens strict, mais la n° 9 doit **choisir son modèle de déplacement** : sans topologie elle code le monde ouvert (KR-224, déjà câblé dans `atteignabilite.ts` faute de graphe), et l'ajouter ensuite réécrit son moteur de déplacement. On paie avant, pas après. Sans propriétaire depuis trois cadrages (refusée en n° 5, KR-200 ; impossible en n° 6, KR-205 ; reconfirmée par la n° 7) : elle revient à `dossier-canon`, qui possède `PanneauLieux.tsx` et `FicheLieu.tsx`. Forme déjà tranchée au raffinage d'it3 de la n° 1, à ne pas re-débattre : **arête ORIENTÉE**, une entrée = un sens, un passage réciproque = deux entrées (KR-013). Lot `contrat` d'abord — et il **arme le rider `validate.ts`** (ci-dessous). **La levée de KR-224 dans le linter n'est PAS dans cette tranche** : poser le champ et corriger `atteignabilite.ts` sont deux démonstrations, donc deux itérations ; la seconde passe en dette à déclencheur.

**B2 · `outillage-2`** — la seule dette qui bloque pour de bon. La n° 11 touche `challenge.ts` et `xp.ts`, donc **relève `break` de 80 à 85** (cliquet, `docs/WORKFLOW.md`) ; le score global est à 81,40 % et `combat.ts` traîne à **62,50 %** — la porte ne passerait pas. Spécification **déjà écrite**, à ne pas réécrire : `.claude/raffinage/outillage-it1.revue.md` porte la table de correspondance complète (numéros de ligne **après** le lot A). **21 tests — donc au moins deux lots** : le seuil mesuré à l'itération précédente est de 12 tests par lot, au-delà un lot ne passe plus la porte isolément. Plus le **`rng` non seedé de `combat.ts:107`**, mutant `ObjectLiteral` qui fait retomber le tirage sur `Math.random` et cause le ±1 mutant entre deux runs. Hors périmètre : la règle ESLint du token non résolu (BUG-035), qui est un autre instrument.

### La dette à déclencheur — rien n'est planifié, tout est armé

Chaque ligne part **toute seule** quand son déclencheur se présente. Le lot qui le fait partir l'absorbe ; il ne la reporte pas une seconde fois.

| Dette | Portée mesurée | Déclencheur armé |
|---|---|---|
| **Scission de `controles.ts`** (1 348 l.) — refactor à **vert trompeur**, deux gardes bornées par `indexOf` | `brain/dossier/controles.ts` | le premier lot qui rouvre ce fichier après la n° 7 |
| **BUG-090** (major) — remédiation circulaire de `condition-sans-expr` : elle renvoie vers un champ qui écrit la prose ayant déclenché l'avertissement, et **aucune surface n'écrit `reussi_si_expr`** (0 occurrence). Se règle en cessant de promettre une condition structurée, **pas** en construisant l'écran | idem | idem — part avec la scission |
| **Rider `validate.ts`** — (a) les 4 sites d'avertissement appellent `anomalie` sans `entityId`, d'où des lignes jumelles indésignables ; (b) `designerSavoir` met un identifiant dans la prose de l'auteur | `brain/dossier/validate.ts` | le premier lot qui rouvre ce fichier — donc **B1** |
| **`nom` non textuel** — `nom: 42` traverse `validateDossier` (mesuré par sonde le 2026-09-19) | idem | idem |
| **Chaîne vide au blur** — quitter un champ de prose vide écrit `''` là où il y avait un **absent**, et émet `dossier:updated`. Prouvé sur `dossier-registres` ; **non mesuré** sur les 3 autres features, qui ont la même forme | les chemins d'écriture de 4 features | le premier lot qui rouvre un `Panneau*`/`Fiche*` de la feature concernée — **le mesurer d'abord, corriger la feature entière ensuite** |
| **Constantes de refus** — `EYEBROW_REFUS`/`TEXTE_ABSENT` déclarées **10 fois dans 4 features** (KR-109/110) ; seule `dossier-canon` a un module partagé | 10 sites + `brain/` | le premier lot qui rouvre l'un des 9 `Fiche*` fautifs |
| **`depart.inventaire_initial`** — absent de `Charpente.Depart` | `types.ts` + `PanneauDepart.tsx` | un besoin réel. **Gratuit à ajouter plus tard** : tout champ de `schema: 1` est optionnel à vie |
| **Retrait dans les registres** — les 6 registres de la n° 6 sont en **ajout seul**. Précédent mesuré : `dossier-objets` a passé **une itération entière sur un seul** registre ; six en une est hors d'échelle. `PanneauJalonsFins` (435 l.) dépasse déjà le signal de scission de 400 l. | 11 fichiers, 3 012 l. | un besoin exprimé de l'auteur — **une tranche par registre**, jamais un lot global |
| **`Indice.portee` + règle « Intrigue en second plan »** — le type existe, l'écran et la règle non | `FicheIndice` + `controles.ts` | un besoin exprimé — **après** la scission de `controles.ts` |
| **Levée de KR-224** — l'hypothèse de monde ouvert reste câblée, et le bloquant « lieu de départ désert » repose sur une prémisse qu'aucun instrument ne vérifie | `atteignabilite.ts` (739 l.) | **B1 livrée** (le graphe existe alors) |
| **Renommer / dupliquer un dossier** — `DossierService.rename`/`duplicate` n'existent pas ; **deux capacités, deux tranches** | `book-library` | un besoin exprimé |
| **Saut au champ fautif** depuis le panneau Contrôles — faisable par le motif « Cross-feature UI action registration » de `docs/WORKFLOW.md` (registre `brain/`, défaut noop, adoptants dans n'importe quel ordre), mais **10 panneaux adoptants dans 4 features** : jamais une tranche, au moins trois | registre `brain/` + 10 `Panneau*` | un besoin exprimé |
| **BUG-035** — `var(--surface-raised)` n'existe dans aucun `tokens/*.css`, et rien ne détecte un token qui ne résout vers rien | `ImageUpload.tsx` + une règle ESLint | le premier lot qui touche `ImageUpload.tsx` |
| **Unicité des `BUG-xxx`** à travers les **sept** `bug_history*.json` — la règle ne vit que dans leurs `_about` et a déjà dérivé en silence une fois (BUG-062) | un instrument à écrire | le prochain franchissement de plafond d'un `bug_history*` |
| **Tenue des specs** — `book-library` et `cloud-sync` sont `in-progress` alors que toutes leurs itérations sont `done` ; `book-creation` (2 logs / 3 itér.) et `tree-canvas` (3 / 6) ont un `iterations_log` incomplet | 4 fichiers JSON, zéro code | la prochaine étape 4 des Build Steps |

### Le repointage de `tree-canvas` — **après le Temps 2**

Décision du 2026-09-19. **Rien n'en dépend** : ni une feature du Temps 2, ni une règle de contrôle, ni le moteur. Et il coûte le double — **1 131 lignes** non-test à repointer (Dagre, culling de viewport, drag de sous-arbre) **plus une pile de test qui n'existe pas** : `docs/WORKFLOW.md` nomme Playwright pour l'E2E, il n'est **pas installé** et il n'y a aucun dossier e2e. Repointer un composant que rien ne couvre, sur une pile à choisir, pour une vue dont personne n'a besoin, est l'inverse de l'ordre de construction.

La **décision n° 5 tient** : l'arbre est conservé, pas supprimé — `src/features/tree-canvas/` reste sur disque, intact, en sommeil, et la n° 9 ne le démolit pas (§ 0 bis). Le jour où on le rouvre, ce sera dans cet ordre : choisir la pile de test navigateur, puis le graphe des lieux et de leurs accès, puis les personnages, puis les relations, puis le chaînage des indices — **cinq tranches, jamais deux**.

---

## 3 — Temps 2 · le moteur joue le dossier

Le Temps 2 ne commence qu'une fois le § 2 bis clos, sur go explicite. `0.7.x`.

| # | Feature | « À la fin, le joueur peut… » | Itér. | Statut | Comité | Dépend de |
|---|---|---|---|---|---|---|
| 9 | `moteur-dossier` | …jouer une session pilotée par un dossier, sans IA | 4 | — | 5 rôles | B1 |
| 10 | `moteur-interprete` | …écrire ce qu'il veut faire en langage libre | 4 | — | 5 rôles | 9 |
| 11 | `moteur-arbitre` | …voir le code lancer le dé que l'IA a demandé | 3 | — | 5 rôles | 10 · **B2** |
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
| **Références croisées de `Lieu`** vers personnages / objets / indices / événements | **Aucun champ, jamais.** Le lien personnage↔lieu **existe déjà** (`presence[].lieu_id`) ; les trois autres s'expriment en **déclencheur**, par le prédicat `lieu_courant_est` (un objet entre en jeu par un `Delta`, un indice par une `Revelation`, un événement par son `declencheur_expr`). Un tableau stocké en serait l'inverse, que rien ne re-synchronise — **cinquième occurrence** de l'anti-patron déjà rejeté pour `tier` (KR-192), `Quete.lie_au_canon` (KR-206), `scene`/`obstacle`/`monstre`, et `Indice.portee` comme classement. Seul `acces` survit : la topologie n'est exprimable par aucun prédicat (→ B1). |
| **`rattachement.quete_id`** sur un personnage de second plan | **Aucun champ.** `Quete.donneur_id` porte déjà le lien personnage↔quête ; l'inverse se calcule au rendu (KR-013). Si la n° 12 a besoin d'un rattachement d'une autre nature que « donneur », elle l'ouvrira avec son consommateur nommé. |
| **Possession d'un objet par un personnage**, jet requis pour l'utiliser | **Hors du dossier.** Un inventaire est un état de SESSION (décision n° 7) ; son unique contrepartie Temps 1 est `depart.inventaire_initial` (§ 2 bis, dette à déclencheur). Un objet n'a pas de lieu : il entre en jeu par un `Delta`, jamais par une position initiale. |
| **Migration `schema: 1` → `schema: 2`** | **Aucun chemin, et c'est définitif pour `schema: 1`** (KR-160/191) : une migration n'est pas testable avant qu'un schéma 2 existe, et le seul critère recevable — le rejet de toute valeur autre que 1, avec un code distinct — est livré. Conséquence assumée, à connaître avant d'ajouter un champ : **tout champ ajouté à `schema: 1` est optionnel à vie**, un champ requis de plus invaliderait rétroactivement tout dossier déjà écrit. Le jour où une rupture est nécessaire, elle crée `schema: 2` et son convertisseur, tous deux propriété de la feature qui rompt. |
| **`savoirs[].revele_si` comme septième famille de conditions** | Hors D1, définitivement : un `jet` émet une demande, il n'évalue pas. Type à part (`Revelation`, portes fermées). |
| **Éditer le texte « après » avant de l'accepter** (copilote) | Différé par l'UX à quatre tours de comité successifs ; le `Field` « APRÈS » reste en lecture seule, `onChange` explicite et commenté. Amélioration réelle, à rouvrir sur un besoin exprimé, pas avant. |

---

## 5 — Hors périmètre

Mode multi-joueur · internationalisation · thème sombre · accessibilité (décision projet ; l'opérabilité clavier reste exigée comme ergonomie de rédaction) · undo / historique d'édition · le routage vers la section du remède dans le panneau Contrôles.

---

## 6 — Comment on exécute

Une tranche à la fois, jamais deux en parallèle, dans l'ordre de ce document : **§ 2 bis B1 puis B2, puis § 3 n° 9 → n° 16.**

```
/cadrer <feature> "<intention en une phrase>"   → specification.json + découpage en itérations
    puis, pour chaque itération n :
/raffiner <feature> n                           → plan signé, découpé en lots → tu valides
/essaim   <feature> n                           → exécution + intégration + qa + dossier de revue
```

Les tranches **hors cycle de feature** (B2, et toute dette à déclencheur qui part seule) n'ont pas de `/cadrer` : leur périmètre est écrit ci-dessus, elles entrent directement en `/raffiner` et journalisent dans `CHANGELOG.md` + `bug_history.*.json`, sans `specification.json` propre.

**Ne pas cadrer plusieurs features d'avance.** Le format bouge au contact du code : tout ce qui aura été cadré avant sera à refaire.

**Composition du comité** : les 4 rôles socles partout, **plus `narratif-ia`** dès qu'une tranche touche le dossier d'aventure, le moteur, les prompts ou le mode jeu — soit **B1** (elle ajoute un champ au dossier, donc une ligne d'audience) et tout le § 3.

**Définition de fini** : celle de `templates/plan-iteration.md`. Toute itération touchant `challenge`, `combat`, `xp` ou `characteristics` passe `npm run test:mutation` au-dessus du `break` en vigueur.

**Au franchissement d'un plafond de contexte** (`docs/WORKFLOW.md`), la compaction se fait **dans le lot qui l'a franchi**. Pour ce document, la moitié qui part est l'archive — motifs d'une décision livrée, corrections de cadrage, historique des recadrages — jamais les colonnes `Statut` ni le § 4.

> **Ce fichier n'est pas dans le périmètre Prettier du dépôt** (`npm run format` ne vise que `{src,worker}/**/*.{ts,tsx,css}`). Ne pas lancer `prettier --write` dessus : l'alignement des tables lui coûterait ~8 kio de budget de contexte pour zéro lisibilité.
