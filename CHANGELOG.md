# Changelog

## 0.6.14 — un lieu se choisit, il ne se retape pas

`dossier-canon` itération 2/4. L'auteur fixe le point de départ de son aventure : un `Select` qui liste les lieux existants et une ouverture rédigée pour le joueur.

- **`PanneauDepart`** : premier consommateur réel de `Select` (`brain/components/Select.tsx`, générique depuis toujours mais sans appelant) — `charpente.depart.lieu_id` se lit en ligne depuis le dossier ouvert et commit **immédiatement** au changement, sans brouillon local : une référence n'a pas de mi-chemin éditable. Le texte d'ouverture garde le patron brouillon+blur de `PanneauCanon` (refus sans revert, bandeau nommé).
- **`localiserEntite()`** exportée depuis `brain/index.ts` (jusqu'ici privée à `dossier/identifiers.ts`) pour libeller un lieu sans nom (« Lieu n°1 (sans nom) ») dans les options du `Select`, plutôt que dupliquer la règle de repli côté feature.
- Aucun chemin d'avertissement sur ce panneau — ni `lieu_id` ni `texte_ouverture_joueur` ne figurent dans `BUDGETS_DE_MOTS` — contrairement au Canon.
- 1 seul lot, marqué contrat (une ligne d'export du baril), exécuté par `dev-contrat` sans essaim parallèle après mesure de son poids réel.
- 61 suites / 835 tests. Score de mutation sans objet (aucun des 4 fichiers mutés touché).

## 0.6.13 — le canon cesse d'être un JSON tapé à la main

`dossier-canon` itération 1/4. L'auteur réécrit le canon de son histoire — synopsis MJ, accroche joueur, ton, interdits de ton — dans un vrai formulaire, à travers le premier chemin d'écriture réel du dossier.

- **`DossierService.update(id, recette)`** : `get` re-validé → recette → enveloppe recomposée par le service (`updatedAt` jamais depuis l'appelant) → `validateDossier` → un candidat invalide n'écrit rien (`{statut:'refuse'}`), un candidat valide persiste même avec des avertissements (`{statut:'ecrit', warnings}`) puis émet `dossier:updated`.
- **`PanneauCanon`** tient un brouillon local (seedé une fois, jamais resynchronisé) : un refus ne réinitialise jamais le champ — l'auteur garde ce qu'il a tapé, un bandeau nomme l'anomalie. Le compteur de mots (`BUDGET_MOTS_CANON`, 600) reste local au panneau — pas une extension générique de `Field`, faute d'un second appelant réel.
- **`IssueList`** et **`compterMots`** promus dans `brain/` (2e consommateur réel, même règle que `ListRow`) ; `dossier-format` en reste le premier appelant, repointé sans changement de comportement.
- Slot d'injection `panneaux` sur `DossierEditorScreen` (précédent `LibraryScreen.importEntry`) : `App.tsx` câble `PanneauCanon` pour la section Canon, sans aucun import direct entre les deux features. Départ et Lieux gardent leur état vide jusqu'à leurs propres itérations (2 et 4).
- 60 suites / 826 tests. Score de mutation sans objet (aucun des 4 fichiers mutés touché).

## 0.6.12 — dix sections remplacent le canevas, qui s'endort intact

`bascule-editeur` itération 3/3 (dernière de la feature). L'auteur navigue dans son dossier ouvert par une liste de dix sections avec compteur de fiches ; le canevas d'arbre cesse d'être atteint depuis l'écran d'édition.

- **Nav à deux colonnes** dans `DossierEditorScreen` : dix `ListRow` (Canon, Départ, Personnages, Lieux, Objets, Indices, Quêtes, Événements, Conditions, Jalons & fins), dans l'ordre du schéma Dossier, chacune avec un compteur lu depuis le registre `SECTIONS` (`brain/dossier/sections.ts`) — jamais recalculé localement. Canon et Départ affichent `—` (ni l'un ni l'autre n'est une collection de fiches) ; les sept sections-listes affichent `N fiche(s)` ; Jalons & fins affiche `N jalon(s) · N fin(s)`. Aucun badge de complétion coloré — réservé au futur linter n° 7.
- **`ListRow`** (`brain/components`, portée depuis le design système) sans sa poignée de glisser source — sans appelant réel cette itération, la n° 5 l'ajoutera avec son vrai câblage.
- **État vide honnête par section** : le panneau droit affiche « {Section} — l'écran d'édition arrive avec la feature n°{X}. », jamais le gabarit générique « Aucun·e {section} » qui mentait pour Canon/Départ/Lieux, déjà peuplées par `DossierService.create()`.
- **`useOpenDossier`** (`brain/hooks.ts`) rafraîchit le titre et les dix compteurs en direct sur `dossier:updated` (réconciliation cloud), sans remontage — honore un report de l'itération précédente.
- **`src/EditorScreen.tsx`, `src/App.tsx` et le type `Route` restent intouchés** : le raffinage a mesuré que les vider ou les supprimer casserait dix tests d'intégration de `tree-canvas`, hors périmètre. La preuve de sortie devient un verrou anti-régression (aucun code de production ne navigue plus vers l'écran Book) plutôt qu'un grep de contenu de fichier ; `tree-canvas` reste sur disque, intact, marqué « en sommeil depuis n° 2, repointage hérité par n° 6 ».
- 58 suites / 804 tests. Score de mutation sans objet (aucun des 4 fichiers mutés touché).

## 0.6.11 — un dossier vide vaut mieux qu'une page blanche

`bascule-editeur` itération 2/3. L'auteur crée un dossier d'aventure valide depuis sa bibliothèque et atterrit sur l'écran d'édition minimal qui s'ouvre dessus ; il peut y revenir à tout moment en rouvrant, depuis la bibliothèque, ce dossier ou tout autre déjà présent.

- **`DossierService.create(titre)`** sème un dossier qui passe le validateur sans erreur NI avertissement — canon, un lieu (`lieu.amorce`, sans `nom`), un point de départ qui y résout. L'id est conforme à `FORME_ID_DOSSIER` via un frappeur privé (`randomToken()`, extrait de `brain/utils/id.ts` et partagé avec `createId()`) — jamais le générique qui préfixe `_`.
- **Les quatre textes de prose du seed portent `⟨à écrire⟩`** (`src/brain/dossier/amorce.ts`) : un dossier « valide » n'est pas un dossier « jouable », et cette marque — unique dans tout `src/` — empêche qu'une amorce non rédigée soit jouée ou lue au joueur sans que rien ne le signale. `charpente.depart.texte_ouverture_joueur` est le champ le plus exposé : le moteur l'émettra un jour verbatim, sans jamais passer par le modèle.
- **« + Nouveau dossier » de retour dans la bibliothèque**, repointé sur `Dossier` (`book-creation`) ; l'écran d'édition (`DossierEditorScreen`, fichier neuf de `bascule-editeur`, `EditorScreen.tsx` historique non touché) affiche le titre du dossier et « Aperçu du jeu » visible mais désactivé, avec l'explication nommée renvoyant à la feature n° 9.
- **Rouvrir un dossier** : le titre d'une carte lisible devient cliquable (jamais une carte illisible — interdit par le type de `DossierResume`, pas une convention de rendu) et ramène l'auteur sur ce même écran.
- **Garde morte retirée** : `src/App.tsx` ne s'abonne plus à `book:deleted` (KR-071, inarmable depuis qu'`it1` a repointé la suppression sur `dossier:deleted`) — épinglé par un test-grep, faute de chemin fonctionnel atteignable.
- 54 suites / 765 tests. Score de mutation sans objet (aucun des 4 fichiers mutés touché).

## 0.6.10 — la bibliothèque retrouve un dossier plutôt qu'un livre

`bascule-editeur` itération 1/3. La bibliothèque (`book-library`) cesse de lister des `Book` et liste des dossiers d'aventure : `DossierService` gagne `list()`/`remove()`, et un dossier devenu illisible n'y bloque plus rien — il s'affiche nommément, se télécharge (s'il est encore lisible) ou se supprime pour libérer son identifiant.

- **BUG-048 fermé pour de bon** : l'import constate la présence d'un identifiant occupé par sa CLÉ, plus jamais par un `get()` qui re-valide — un document devenu invalide n'écrase plus silencieusement, il refuse l'import avec un message dédié.
- **`DossierResume` est une union discriminée** (`{lisible:true,titre,updatedAt}` | `{lisible:false}`), zéro compteur : afficher un nombre d'entités aurait exigé une re-validation complète de chaque dossier à chaque rendu de l'accueil.
- **« + Nouveau livre » retiré de l'accueil** pour cette itération — `book-creation` n'est repointée sur `Dossier` qu'à l'itération 2, et créer un `Book` que la bibliothèque n'affiche plus aurait été un bouton mort. Un avis nommé apparaît si des livres existent encore mais qu'aucun dossier n'est importé, tant que `BookService` n'est pas démonté (n° 9).
- **`tree-canvas` mis en sommeil**, pas détruit : son repointage sur un vrai graphe de relations et d'indices n'a pas de données avant la n° 6 `dossier-registres` — correction actée dans `docs/ROADMAP-BASCULE-IA.md`.
- 50 suites / 730 tests. Score de mutation sans objet (aucun des 4 fichiers mutés touché).

## 0.6.9 — le dossier de référence remplace la page blanche

`dossier-format` itération 5, **dernière de la feature (5/5)**. Un second fichier réel, `dossier-reference.json` (six personnages, cinq lieux), prouve par une construction narrative réelle — jamais un littéral inline — que le schéma livré en it1-it4 porte assez pour un dossier complet.

- **Une checklist à sept branches nommées**, `src/brain/dossier/suffisance.test.ts` : `portee=second` · une fin avec `condition_expr` · un savoir avec porte `apres_indice` · un jalon sans `declencheur_expr` mais atteignable par un delta `atteindre_jalon` **porté ailleurs** (la récompense d'une quête) · un événement sans `declencheur_texte` ni `declencheur_expr` · une certitude non-`sait` (`croit`/`soupçonne`) · un delta sur chaque cible **admissible** de `CHEMINS_DE_DELTAS` (les trois emplacements réels — `climat[].effets_regles` reste structurellement sans delta admissible, décision d'it4). Chaque échec se nomme par branche, jamais par un contrôle à l'œil.
- **`dossier-minimal.json` reste intouchée** — sept suites de tests existantes la lisent. Le dossier de référence est un second fichier, lu par une seule suite neuve ; une garde mécanique (`aucune cle en trop face a dossier-minimal`) vérifie que ses clés JSON profondes n'introduisent aucune surface de schéma que la fixture minimale ne porte déjà.
- **`ok:true, errors:[], warnings:[]`** — aucun avertissement caché : chaque `Savoir.revele_si` du dossier porte au moins une porte posée, et les budgets de mots (`canon.mj` + `canon.partage` ≤ 600 mots, chaque `jalons[].enonce_texte` ≤ 20 mots) sont mesurés, pas supposés.
- **Round-trip prouvé** par les fonctions publiques de `DossierService` (`importDossier` / `exportDossier`) — import puis export deep-equal à la lecture disque, aucun écran nécessaire (KR-156).
- **Aucun fichier de production `src/brain/dossier/*.ts` touché** — un consommateur pur des cinq contrats déjà stables (`validateDossier`, `DELTAS`/`CHEMINS_DE_DELTAS`, `CERTITUDES`/`PORTEES`, `Dossier`/`DossierValidation`).
- **50 suites / 728 tests** (49 / 716 avant). `specification.json` a franchi son plafond au report (69 553 o) et a été **compacté dans le même geste** : onze décisions déjà closes, dont le raisonnement vit dans une revue d'itération ou une docstring de production (`deltas.ts`, `predicates.ts`, `tables.ts`), réduites à leur phrase d'arbitrage + renvoi — **66 346 o**, sous le plafond de 66 560 o.
- `docs/ROADMAP-BASCULE-IA.md` — `dossier-format` passe à **5/5, terminée** : la feature n° 1 (le contrat entre les deux temps) est close.
- **`features_history.json` scindé par temps** (même patron que `bug_history.json` le 2026-08-06) : les 14 features de l'ère 0.5 partent dans `features_history.0.5.json`, hors lecture obligatoire ; le fichier courant ne garde que `dossier-format`. Plafond de budget de contexte re-dérivé vers le bas (`docs/WORKFLOW.md` § Budget de contexte).

## 0.6.8 — un effet qui pointe une entité inexistante est refusé par son nom

`dossier-format` itération 4. Les **effets de règle** deviennent un registre fermé `DELTAS` — quatre entrées, **slots de référence uniquement** — avec son validateur de forme, la résolution de ses cibles, celle des trois derniers champs de `savoirs[]`, et le garde d'éléments de liste que BUG-050 réclamait depuis it3.

- **Aucun opérande entier**, sur deux motifs indépendants. `docs/REGLES-DU-JEU.md` **ne pose aucune magnitude d'auteur** : le § 1 *calcule* `PV = FO+AG+EN`, le § 5 *calcule* tout gain d'XP depuis ΔT, le bonus d'attaque est plafonné par la seule boutique, et le bonus de défense n'apparaît dans aucune section — il vient d'`action-pnj`, feature supprimée. Écrire `gagner_xp: 3` dans le format, ce serait poser une règle de jeu **avant** de l'écrire dans la source de vérité (KR-130). Second motif, indépendant : une magnitude **sans borne nommée** ne peut recevoir aucun test à la limite, donc aucun critère observable (KR-165). Réouverture : doc → table dorée → code, dans cet ordre.
- **Une propriété mécanique** : tout `refKinds` d'un effet est inclus dans l'union des `refKinds` des prédicats. `bestiaire` n'étant dans aucun, **aucun effet d'auteur ne peut nommer un monstre**, donc aucun ne peut ouvrir un combat — par inclusion, plus par convention.
- **BUG-050 fermé par une dérivation**, jamais une cinquième table : `LISTES_REQUISES` moins `COLLECTIONS_IDENTIFIEES`, soit **trois** chemins. Mesure qui tranche : un élément non-objet d'une collection identifiée donne `id: null`, donc `champ-requis-vide`, bloquant depuis it1 — le symptôme journalisé sur-déclarait, il est corrigé.
- **KR-175 est arrivé en amont pour la première fois.** Découvert en revue de PR à it3 sur un `critical`, il a été exigé **au plan** d'it4 par la QA, avant qu'une ligne soit écrite. L'ouvrier l'a poussé plus loin : `estCleDe` seul ne restreint pas le type, donc une garde `estDeltaId` porte la restriction par le compilateur et `deltas.ts` ne contient aucun `as` sur le registre.
- **Un trou que personne n'avait vu** : `charpente.depart.lieu_id = "pnj.…"` **résolvait** — l'identifiant existe — et passait en silence. Le champ `espace` de la table de références, rendu porteur, le refuse désormais.
- **KR-176** — un seuil chiffré cité dans un plan nomme sa source, sinon il n'existe pas. Le « plafond de 650 lignes » d'it3 était né d'une note de comité, promu critère par l'orchestrateur, puis reporté par la revue comme une règle du projet. Corrigé rétroactivement, avec le décompte périmé qui l'accompagnait.
- **49 suites / 716 tests** (48 / 662 avant). `validate.ts` : 607 → 677 lignes.
- **Budget de contexte relevé et publié** (le détail est dans `dossier-format-it4.revue.md`) : tous les fichiers sous plafond, marges de 58 o (couple toujours chargé) à 6 985 o. Re-dérivation appliquée — **aucun plafond ne descend**, et les deux qui voudraient monter restent bloqués par le cliquet. `specification.json` a demandé **trois** passes de compaction dans ce lot : quinze décisions livrées réduites à leur renvoi vers la revue qui les porte, deux règles d'orchestration déplacées vers `code-knowledge.json`, les journaux d'it1 et it2 ramenés à leurs choix d'architecture.

## 0.6.7 — une condition qui pointe une entité inexistante est refusée par son nom

`dossier-format` itération 3. Les conditions du dossier (`…_expr`) deviennent un **arbre `ExprNode`** — quatre opérateurs français, aucune chaîne, **aucun parseur** — piloté par le registre fermé `PREDICATES`. L'auteur qui écrit `{ op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.qui-n-existe-pas'] }` voit son import refusé sur « Objectif « Refermer le sceau » », pas sur un chemin JSON.

- **Cinq familles de conditions, pas six.** `contre_mesures[]` n'a ni type, ni racine, ni feature éditrice : la créer serait la « forme sans producteur ni consommateur » que la décision A interdit. Correction de fait au passage — ce n'est **pas** une racine, elle vit **sous `personnages[]`** : elle arrive donc en **n° 4**, en quatre lignes, et ses destinations sont déjà arbitrées en commentaire.
- **Sept prédicats, et une propriété que le compilateur tient.** Tout `refKinds[i]` a une ligne dans `COLLECTIONS_IDENTIFIEES`, et `bestiaire` n'en a pas : **aucun prédicat ne peut désigner un monstre, donc aucun ne peut ouvrir un combat**. Mécanique, pas conventionnel. `jet_reussi` est **veto** — un jet n'évalue pas, il *émet* une demande qui change le tour ; un évaluateur qui en contient lance le dé.
- **Deux vetos indissociables.** Le balayage de couverture s'arrête sur les `…_expr`, et ses points d'arrêt sont **dérivés** de `FAMILLES_DE_CONDITIONS` — deux listes de chemins divergeraient en silence. Contrepartie non négociable : `validateExpr` refuse **toute clé inconnue** sur un nœud, sans quoi l'opacité devient une **cachette** où un champ de prose serait injecté par la n° 10 sans qu'un test rougisse.
- **Le § D1 du roadmap cesse de contredire le code** : il ordonnait d'injecter les `…_texte` que `destinations.ts` classe `auteur` depuis la décision B. Deux lignes, aucun paragraphe neuf.
- **`validate.ts` : 723 → 607 lignes** *(corrigé au raffinage d'it4 : le « 602 » publié ici était vrai à la mesure, faux après les correctifs de la revue de PR ; et le « plafond 650 » qui l'accompagnait n'existait nulle part — KR-176)*. `tables.ts` sort **avec son bénéficiaire**, la 4ᵉ assertion du balayage — dernier chemin de contournement du garde de `DESTINATION_DES_CHAMPS`, où un champ ajouté aux types et aux tables mais pas à la fixture restait invisible.
- **BUG-051, trouvé par la QA et corrigé avant la revue humaine** : les quatre lignes `…_texte` neuves n'étaient tenues par **aucun test de valeur** — les basculer en `ia` laissait 168 tests verts. Le trou était **dans le plan**, pas dans le code (KR-174 : une assertion d'*existence* n'est jamais une assertion de *valeur*). Aussi : BUG-052 (propriété affirmée en docstring sans test) et BUG-050 (élément de liste non-objet, reporté it4, journalisé avant la première ligne de code).
- **BUG-053, critique, trouvé par la revue de PR** : `validateDossier` **levait** sur un `…_expr` valant `{ op: "toString" }` — `in` remonte la chaîne de prototypes, donc `'toString' in PREDICATES` vaut `true` et le descripteur qu'on en tire est une fonction. La modale d'import, seul écran de la feature, restait bloquée sur « lecture » sans message. Second site : `bestiaire.toString` passait pour un monstre existant. Corrigé par `estCleDe` aux quatre sites (KR-175). Le test de totalité **existait et était vert** : le trou était dans le choix de sa liste de bruit.
- **`bug_history.json` a franchi son plafond et a été SCINDÉ**, comme la règle le prescrit pour un journal append-only : BUG-001 à 027 (l'ère éditeur d'arbre, dont quatre features supprimées par D3) partent dans `bug_history.0.5.json`, hors lecture obligatoire. Numérotation globale, aucun défaut perdu, continuité vérifiée. Plafond re-dérivé **vers le bas** : 75 → 55 kio.
- **48 suites / 662 tests** (47 / 603 avant). Budget de contexte : `specification.json` a franchi son plafond au report et a été **compacté dans le même geste**.

## 0.6.6 — la table dorée cesse d'être un exemple et devient une méthode

La doctrine de la table dorée était écrite (pourquoi, quand, sens d'écriture) ; **sa construction ne l'était nulle part**. Elle n'existait que sous deux formes non réutilisables : une instance qui marche (`src/brain/rules.golden.test.ts`) et un récit dans `outillage-it1.revue.md`. Un agent à qui on demande d'en poser une n'avait aucune méthode — et `/outillage`, qui portait le raisonnement, est à usage unique.

- **`.claude/skills/table-doree/SKILL.md`** (nouveau) — recette extraite de l'instance en place, pas inventée. Arbre de décision (calcul → mutation ; donnée neutralisée → table obligatoire ; donnée sans source → rien), structure en cinq assertions, cinq anti-patrons, le seul chemin d'évolution autorisé, liste de contrôle de revue. Skill **à la demande** : elle ne sert qu'à qui en écrit une, elle n'a rien à faire dans le toujours-chargé.
- **Deux règles qui étaient enfouies deviennent explicites.** (1) *La couverture doit égaler exactement la surface neutralisée, libellés compris* — c'était une ligne de tableau de revue, et c'est le piège cher : sans l'extension aux libellés, **31 `StringLiteral`** (24 de `CHARACTERISTICS`, 4 de tiers, 3 de postures) sortaient du dénominateur **et** de tout test, le score montant pendant que la couverture réelle baissait. (2) *La sonde* — modifier une valeur, vérifier que le test rougit **et nomme le champ**, restaurer par copie vérifiée par empreinte. Jamais `git checkout` (KR-172). Le précédent à imiter est daté et chiffré : `outillage-it1.revue.md` § 3, `b0b6273e…` avant et après.
- **Câblage** — `dev-contrat` (règle 4 ter), `qa` (mode B, étape 2 bis : la sonde a-t-elle été exécutée), le tableau des instruments de `raffinage-iteration`, et un renvoi d'une ligne dans `docs/WORKFLOW.md`. Couple toujours chargé : **45 992 o** sous 46 080.

## 0.6.5 — le roadmap porte le statut, et la parité worker cesse de décrire un autre projet

Suite du lot de process — toujours aucun fichier de `src/`. Le budget de contexte posé en 0.6.4 a été appliqué à lui-même dès sa première utilisation : les trois ajouts ci-dessous ont dû être payés par une compaction, pas par un desserrage du plafond.

### Le statut d'une feature devient lisible d'un coup d'œil

Constat : l'état réel de `dossier-format` — deux itérations livrées sur cinq, une troisième en raffinage — n'était écrit **nulle part en un seul endroit**. Il se reconstituait depuis quatre sources dont aucune ne fait autorité (`plan.iterations[].status`, la version `package.json`, l'entête du CHANGELOG, et un dossier `.claude/raffinage/` non commité). Les tableaux § 2 / § 3 du roadmap portaient l'ordre, la taille et le comité — jamais l'état.

- **`docs/ROADMAP-BASCULE-IA.md`** — colonne **`Statut`** aux deux tableaux (`k/n` itérations livrées, `—` si pas commencée), **projetée** depuis `plan.iterations[].status` : elle se recopie, elle ne se décide pas là. Réparé au passage : une ligne vide coupait le tableau du § 2 en deux, la n° 1 d'un côté et les n° 2 à 8 de l'autre — Markdown en rendait deux tableaux distincts.
- **`docs/WORKFLOW.md`** (Build Steps, étape 4) — la répercussion s'accroche à l'étape qui écrit déjà spec + CHANGELOG + `features_history.json`, **pas à `/cadrer`** : `/cadrer` tourne une fois par feature, le statut bouge à chaque itération.
- **Vocabulaire de statut inchangé** — `planned | in-progress | done` reste tel quel. Un `next` serait de l'état dérivé mis en miroir (c'est la plus petite feature non `done` dans l'ordre du § 2, déjà verrouillé par « une feature à la fois »), et un `hold` n'a aucune instance à couvrir.

### La parité worker décrivait un worker qui n'est pas le nôtre

- **`docs/WORKFLOW.md`** (§ Worker Route Parity, § Failure Paths) — la règle était vivante mais **tous ses crochets mécaniques rataient le seul appelant réel** : le motif `Cloudflare*Service.ts` et la commande de scan `workerUrl}/` ne voient pas `brain/CloudflareKVTransport.ts`, qui construit `` `${base}/kv/…` ``. Le worker de ce dépôt fait 111 lignes, une seule famille de routes `/kv/:key` reconnue par regex — ni `ROUTE_LIMITS`, ni limiteur de débit, ni SSE, ni réponse JSON d'IA. La liste de contrôle en sept points et les occurrences BUG-065/066 venaient d'ailleurs. Remplacées par l'état mesuré, un relevé qui marche, et le renvoi à D2 pour écrire la vraie liste **sur le worker qu'on aura**.

### Compaction — la place a été payée, pas empruntée

- **`docs/ROADMAP-BASCULE-IA.md`** entre à la table du budget : 32 911 o, plafond **35 kio**, **sans marche** — un index n'a pas vocation à grossir. C'est le document non-toujours-chargé le plus lu du rituel (3 rôles × 2 tours par raffinage) et il n'avait aucun plafond. Ce qui en sortira quand il tombera est nommé : l'archive (§ 1 ter, lignes barrées du § 5, paragraphes de correction), jamais la colonne `Statut`.
- **`docs/WORKFLOW.md`** — *Architecture Vocabulary* supprimée (un tableau **vide** sous une consigne d'usage). *Hover-reveal row actions* : la règle garde sa valeur, son exemple était en MUI `sx` / `IconButton` — il n'y a pas de MUI dans ce dépôt, l'exemple apprenait une stack qui n'existe pas. *Design Patch Processing* condensée en deux phrases : procédure dormante (`genliv_changes/` n'existe pas), elle garde sa capacité et perd sa cérémonie.
- Couple toujours chargé : **45 830 o** sous un plafond de 46 080 — resté sous la barre en libérant plus que ce que les trois ajouts coûtaient.

## 0.6.4 — outillage : la valeur de registre relue à la source, et un budget de contexte chiffré

Lot de process — aucun fichier de `src/`, aucun comportement utilisateur, aucun contrat `brain/` modifié. Deux angles morts fermés, tous deux à l'endroit où un dispositif par ailleurs sain peut se relâcher **sans bruit**.

### Le sens d'écriture d'une valeur de registre devient permanent

`/outillage` avait identifié le bon risque — « une table dorée qui recopie une valeur fausse fige le défaut au lieu de le verrouiller » — mais cette commande est **à usage unique** : la règle disparaissait avec elle. Elle vaut désormais pour **toute entrée ajoutée ou modifiée** dans un registre couvert par la table dorée (`BESTIARY`, `CHALLENGE_TIERS`, `CHARACTERISTICS`, libellés de `POSTURES`) — un monstre de plus au bestiaire la déclenche autant que la mise en place initiale. Sens d'écriture : **`docs/REGLES-DU-JEU.md` → `rules.golden.test.ts` → le code**, jamais l'inverse.

- **`docs/WORKFLOW.md`** (§ score de mutation) — la règle, son motif, et le cas d'absence : valeur que la doc ne porte pas ⇒ on corrige la doc, jamais l'inverse (KR-130).
- **`.claude/agents/dev-contrat.md`** — règle dure 4 ter : la valeur se lit dans la doc, `BLOCAGE — règle absente de REGLES-DU-JEU.md` sinon. Le compte rendu **cite la section source de chaque entrée** — sans cette liste, la QA ne peut que constater que tout est vert.
- **`.claude/agents/qa.md`** — mode A : un critère touchant un registre **nomme sa section source**, sinon veto (« le monstre X est au bestiaire » n'est pas observable, « les stats de X sont celles du § 4, tier 2 » l'est). Mode B, étape 2 bis : confrontation champ à champ contre la doc, jamais contre le code ni contre le compte rendu de l'ouvrier. Une table dorée verte ne prouve **rien** si elle a été écrite depuis la sortie du code — le vert est ce qu'elle produit dans les deux cas.
- **`.claude/skills/raffinage-iteration/SKILL.md`** — le sens d'écriture entre au tableau des instruments, ligne « table dorée ».

### Budget de contexte — un plafond chiffré plutôt qu'une intention

Charger par référence (KR dans la spec de leur feature, lecture du comité bornée à 3–6 fichiers, canon narratif injecté par identifiant) est ce qui évite le contexte monolithique. Mais ces fichiers n'ont **que des écrivains, jamais de compacteur** : le seul moment où l'un rétrécit est celui où quelqu'un le décide.

- **`docs/WORKFLOW.md`** (§ Budget de contexte, nouveau) — trois strates de lecture obligatoire, formule `plafond = ceil(mesure ÷ 5 kio) × 5 kio` posée avant la mesure, plus **une marche de 5 kio** pour les seuls fichiers dont grossir est le fonctionnement normal — le couple toujours chargé n'y a pas droit, sa croissance est un défaut. **Cliquet inversé** de celui du score de mutation : le plafond ne monte jamais, il se re-dérive vers le bas après compaction. Le franchir ne bloque pas la livraison — il déclenche la compaction **dans le lot de doc lui-même** (Build Steps, étape 4), la reporter au lot suivant c'est ne jamais la faire. Ce que « compacter » veut dire est écrit fichier par fichier.
- Mesure du 2026-08-06 (`wc -c`) : couple `CLAUDE.md` + `docs/WORKFLOW.md` **46 047 o → plafond 45 kio** ; `code-knowledge.json` 70 876 → 75 kio ; `bug_history.json` 67 700 → 75 kio ; `features_history.json` 66 133 → 70 kio ; `specification.json` par feature 60 937 (max `dossier-format`) → 65 kio.
- **Le couple toujours chargé est livré à saturation, délibérément** : cette section a elle-même dû être resserrée deux fois pour tenir sous son propre plafond. C'est le comportement attendu — une règle qui entre ici en remplace une.
- **`.claude/skills/raffinage-iteration/SKILL.md`** — la boucle de mémoire écrit dans la spec à chaque itération, donc c'est elle qui la fait grossir : la compaction se fait dans le même geste que le report. Une décision livrée se réduit à sa phrase d'arbitrage + le renvoi à sa revue ; une `open_questions` tranchée **part** — la garder ouverte est un mensonge d'état. Ce qui ne se compacte jamais : un arbitrage encore structurant pour une itération non livrée, un `REPORTÉ` sans repreneur.

## 0.6.3 — `dossier-format` itération 2 : les corrections irréversibles du schéma

**L'auteur peut voir refusé un dossier dont une donnée mécanique est mal formée** — une référence de monstre qui ne résout pas, une valeur hors énumération, un effet écrit en prose, une porte de révélation inconnue. Revue : `.claude/raffinage/dossier-format-it2.revue.md`.

### Décidé — deux arbitrages qui changent le plan

- **La forme complète des racines quitte la n° 1.** Mesure faite sur le schéma cible : **~100 champs terminaux**, soit bien plus que 8 critères et 4 lots. Chaque racine reçoit désormais sa forme complète **dans la feature qui l'édite** — `canon` en n° 3, `personnages` en n° 4, `lieux`/`objets`/`indices` en n° 5, `quetes`/`evenements`/`conditions` en n° 6. La n° 1 ne pose que ce qui est **irréversible**. Même règle que celle qui avait déjà fait reporter `Delta[]` et sortir `list`/`remove` du service : une forme sans producteur ni consommateur est de la dette.
- **`charpente` n'est plus « jamais vue par l'IA » mais « jamais vue entière ».** L'ancienne formulation était contredite par le code à venir ; la nouvelle est plus honnête et plus étroite. Une projection nommée en portera **une** feuille — l'**énoncé des jalons déjà atteints** (`enonce_texte`, champ neuf) — et jamais les déclencheurs ni les conditions de fin : ceux-là sont la même règle en français, et un narrateur qui les lit conduit le joueur au jalon ou à la fin. La projection elle-même part en n° 9, car elle dépend de l'état de session.

### Ajouté — le schéma

`personnages[].portee` + `plan_actions[]` (la collision de clé `plan` du plan de cible, tranchée) · `savoirs[].certitude` **obligatoire** — sans elle une rumeur entre au carnet d'indices comme un fait établi · `Revelation` à **quatre portes fermées**, dont `contrepartie` **structurée** (le moteur ne peut pas constater qu'un serment a été tenu : ce n'est pas une porte, c'est une intention) · les **quatre emplacements de deltas typés**, jamais de la prose · `monstre_ref` résolu contre le bestiaire · `jalons[].enonce_texte` · `evenement` et `climat` comme espaces de noms.

### Ajouté — quatre codes d'anomalie

`valeur-hors-enumeration` (sans lui, une `portee` valant « troisieme » passait **en silence**), `delta-en-prose`, `porte-inconnue`, `revelation-sans-porte` (avertissement, jamais bloquant). Et `reference-pendante` est **généralisé** : son QUOI FAIRE était câblé en dur sur `depart.lieu_id`, `monstre_ref` en aurait hérité une consigne trompeuse — même famille que BUG-042.

### Ajouté — `DESTINATION_DES_CHAMPS`

Un registre `chemin → ia | moteur | auteur`, sous test d'exhaustivité. Il existe parce que `Pick<Dossier,'canon'|'monde'>` **ne confine rien dans `monde`** — et cette itération y fait justement entrer des deltas et une référence qui résout vers les points de vie d'un monstre. Chaque feature qui ajoutera un champ devra déclarer son audience, sinon la porte rougit.

### Corrigé

- **BUG-047** — la branche « chemin de delta **absent** » n'était exercée par aucun test. L'instrument de couverture était passé de la suppression à la **corruption** : juste pour les champs optionnels, faux pour les obligatoires. Une bascule d'instrument doit nommer **ce qu'elle cesse de couvrir**.
- **BUG-045** (processus, journalisé) — deux agents lancés en parallèle sur le même arbre non commité : la casse-restaure de l'un a effacé le fichier que l'autre relisait. Aucune perte, mais la règle est écrite (KR-172).
- **BUG-049** — **quatre** listes non optionnelles du type étaient acceptées absentes, pas une seule : le dossier gelé promettait des tableaux valant `undefined`. La revue affirmait qu'il n'y avait qu'un cas ; se méfier de toute phrase qui dit « c'est le seul endroit où ».
- **BUG-046** — le budget de mots du jalon réutilisait le code `canon-trop-long` : renommé `texte-trop-long` **pendant que la fenêtre est ouverte**, aucun consommateur ne branchant encore dessus.
- **BUG-048** (journalisé, propriétaire n° 2) — la garantie « un import n'écrase jamais un dossier existant » est fausse dès qu'un document stocké devient invalide, ce que ce durcissement de schéma vient de rendre possible.

### Porte

`tsc` propre · lint **0 erreur** · **47 suites / 603 tests verts** (46 / 559 avant). L'instrument d'exhaustivité d'it1 est **remplacé** : il s'arrêtait à deux niveaux et n'entrait pas dans les tableaux — où vivent tous les champs de cette itération. Il serait resté vert sur du code faux.

## 0.6.2 — `dossier-format` itération 1 : importer un dossier d'aventure

**L'auteur peut importer un dossier d'aventure dans sa bibliothèque** — déposer un fichier `.json`, voir en français ce qui l'empêche d'être jouable, et confirmer. Première itération de la feature n° 1, **le contrat entre les deux temps**. Revue complète : `.claude/raffinage/dossier-format-it1.revue.md`.

### Ajouté — le format

- **`brain/dossier/`** — `Dossier` (`schema: 1`) en **trois racines** : `canon` (avec `mj` et `partage` **séparés**), `monde`, `charpente`. Le regroupement n'est pas cosmétique : il rend `Pick<Dossier, 'canon' | 'monde'>` sûr **par construction**, donc une fuite de charpente vers le contexte IA sera une erreur de compilation en n° 10, pas un test d'exécution.
- **`validateDossier(input: unknown)`** — pur, ignorant du magasin, refuse **en français rédigé**. Huit codes d'anomalie dans une union fermée, chacun avec son OÙ (l'entité résolue **par son nom**, jamais le chemin JSON seul), son QUOI et son QUOI FAIRE. Le budget de canon (`BUDGET_MOTS_CANON = 600`) produit un **avertissement**, jamais un blocage.
- **`inspectDossierFile`** — le `JSON.parse` vit dans `brain/`, pas dans le composant : « fichier vide » et « JSON malformé » deviennent observables sous la porte au lieu de rester hors instrument.
- **`DossierService`** — **quatre** méthodes (`get`, `open`, `importDossier`, `exportDossier`). `get()` **re-valide** et ne rend jamais le document brut du magasin.
- **Gel en profondeur** dès l'import : `Object.freeze` n'apparaît qu'en **un seul endroit du module dossier** (`freeze.ts`), et deux tests épinglent cette unicité — le dépôt en porte deux autres, sans rapport, dans `BrainContext` et `UIPreferencesService`. `validateDossier` gèle une **copie** : l'argument de l'appelant ressort intact, et un test le prouve.
- **`CloudSyncService` reconnaît la forme dossier** et arme sa réconciliation sur `dossier:opened` — sans quoi un dossier serait retombé en poussée monolithique **sans aucune réconciliation cloud, et sans qu'un seul test rougisse**. Le test a été constaté **rouge avant correctif**, puis re-vérifié deux fois indépendamment.

### Ajouté — l'écran

- **« ⬚ Importer un dossier »** dans la bibliothèque, et une modale à cinq états (vide, validation, fichier illisible, anomalies, valide). Injectée depuis `App.tsx`, la racine de composition : **`book-library` n'est pas touché**, son isolation tient jusqu'à son repointage en n° 2.
- Les cinq états se **dérivent** du discriminant de l'inspection au rendu — aucun miroir `useEffect` (KR-013).

### Modifié — la scission `brain/types.ts`

`Book`, `BookNode`, `Edge`, `ChoicePrereq`, `ChoiceCountdown`, `NodeActionType` partent dans **`brain/tree.ts`** (condamné : n° 2 puis n° 9). `types.ts` **survit** avec les types de règles que `src/player/` consomme. `tree.ts` importe depuis `./types`, **jamais** l'inverse — c'est cette asymétrie qui rend vérifiable l'invariant **aucune conversion `Book` ↔ `Dossier`, dans aucun sens** (KR-167).

**26 fichiers** voient leur ligne d'import changer (21 `src/brain/`, 5 `src/player/`, **0 `src/features/`** — le baril ré-exporte sous les mêmes noms). Mesuré trois fois. 23 ne changent **que** cela ; les 3 autres portent aussi du contenu contractuel neuf — nuance désormais écrite dans KR-159, parce que « 26 fichiers, une ligne d'import chacun » était exact et pourtant trompeur.

### Corrigé

- **BUG-037** — `validate.test.ts` déléguait par commentaire la couverture du 8e code d'anomalie à `DossierService.test.ts`, qui ne la portait pas. Une promesse écrite dans un fichier n'était pas tenue dans l'autre : **aucun grep ne trouve ça**, seule la QA en contexte neuf l'a vue.
- **BUG-035** (journalisé, non corrigé — hors périmètre) — `ImageUpload.tsx:185` utilise `var(--surface-raised)`, un token qui n'existe nulle part. Rien ne détecte un `var(--nom)` qui ne résout vers rien ; trois relectures manuelles ont contourné le trou ici, ça ne tiendra pas sur seize features.
- **BUG-036** — `FEATURE_DIRS` n'est pas lisible par `require()` (ESLint 8 rejette toute clé de premier niveau inconnue). Le test la lit comme texte : sans lui, la première feature créée sans être déclarée serait **silencieusement exemptée** des règles d'isolation.

### Porte

`tsc` propre · lint **0 erreur** · **46 suites / 559 tests verts** (39 / 485 avant) — +7 suites, +74 tests. Score de mutation **sans objet** : aucun des quatre fichiers de règles n'est touché (KR-161).

## 0.6.1 — cadrage et raffinage de `dossier-format`, décomptes remesurés

Aucun code d'application. Cette version pose le **plan de la feature n° 1** et **corrige trois chiffres** que `0.6.0` avait écrits sans les mesurer. Rien n'est déployé de neuf : c'est de la documentation exécutable par `/essaim`.

### Ajouté

- `src/features/dossier-format/specification.json` — le cadrage de la feature n° 1 : cinq itérations découpées **par profondeur de schéma** (et non par couche), quatorze critères d'acceptation, treize risques connus (KR-156 → KR-168), seize décisions arbitrées.
- `.claude/raffinage/dossier-format-it1.plan.md` — le plan signé de l'itération 1 par le comité à cinq rôles : deux lots à propriété disjointe, huit critères, quinze désaccords tranchés.
- **KR-156 → KR-168** mirrorés dans `code-knowledge.json`.

### Corrigé — trois décomptes énoncés sans mesure

- **Le rayon de la scission `brain/types.ts` → `brain/tree.ts`.** La roadmap annonçait « neuf lignes d'import à déplacer dans `src/player/` ». Relevé du 2026-08-04 : **26 fichiers**, une ligne d'import chacun — **21 dans `src/brain/`**, **5 dans `src/player/`** (`Edge` seul), **zéro dans `src/features/`**, qui consomment toutes par le baril `brain/index.ts`. Le « neuf » confondait le rayon de la scission avec les **douze** fichiers de `src/player/` important les types de **règles** — lesquels, eux, ne bougent pas. Corrigé dans `docs/ROADMAP-BASCULE-IA.md`, **KR-159** (`code-knowledge.json` + spec), le critère d'acceptation n° 13 et la décision de scission de la spec.
- **Le nombre de familles de conditions de D1** : **six**, pas sept. `savoirs[].revele_si` en sort et devient un type à part (`Revelation` à portes fermées) — un jet n'évalue pas, il **émet** une demande qui change le tour, et l'aplatir en prédicat booléen forcerait l'évaluateur à lancer le dé, ce que la décision n° 4 interdit.
- **Le critère d'acceptation n° 12 de `dossier-format`** disait « les treize critères ci-dessus » là où **onze** le précèdent.

> Leçon portée dans KR-159 : **un décompte se remesure, il ne se recopie pas.** Le grep qui le produit est écrit dans le risque.

### Modifié — `docs/ROADMAP-BASCULE-IA.md`

- `…_expr` est **un arbre JSON, jamais une chaîne**, et **il n'existe aucun parseur** : supprime la grammaire à spécifier, versionner et tester, et toute la classe des erreurs de syntaxe. Le registre `PREDICATES` pilote le rendu des formulaires — l'auteur ne saisit jamais d'expression.
- La n° 1 **crée, elle ne détruit pas** : elle livre le format en parallèle et scinde `types.ts` ; la démolition se répartit en n° 2 et n° 9. Invariant : **aucune fonction ne convertit un `Book` en `Dossier` ni l'inverse** (KR-167).
- `dossier-format` passe de **3 à 5 itérations**.
- Quatre trous du plan de cible tranchés au cadrage : la racine `objets[]` (le dossier a **treize** racines), `evenements[].monstre_ref` en `bestiaire.<templateId>`, la collision de clé `plan` (→ `portee` + `plan_actions[]`), et le groupement de `jalons`/`fins` sous `charpente`.

### Tranché — question ouverte fermée

- **`depart.personnage_joueur.contraintes` est supprimé du schéma.** Pas de contrainte de création de personnage propre à une aventure : la règle est une constante du runtime, déjà appliquée par `src/player/engine/charCreation.ts`. Le typer aurait créé un second endroit où la règle vit ; le garder en prose laissait du texte que le code ne peut pas appliquer. La suppression est la seule des trois options à coût nul.

## 0.6.0 — bascule IA : décisions D1/D2/D3 tranchées, tri du dépôt exécuté

Ouverture du **Temps 1** (`0.6.x` = l'éditeur produit un dossier d'aventure). Aucune fonctionnalité neuve : cette version **enregistre les trois décisions bloquantes** et **exécute le tri** qu'elles commandent. Plan de référence : `docs/ROADMAP-BASCULE-IA.md`.

### Décisions

- **D1 — langage de conditions : un champ pour chaque.** Les sept familles de conditions du schéma portent désormais **deux champs** : `…_texte` (français, pour l'IA, toujours rédigé) et `…_expr` (évaluable, pour le moteur, facultatif). Le moteur ne lit jamais le texte pour décider, l'IA ne lit jamais l'expression pour raconter. La grammaire de `…_expr` — prédicats sur identifiants stables + `et`/`ou`/`non`, registre extensible, pas de langage généraliste — est fixée par la feature n° 1 `dossier-format`.
- **D2 — appels IA : tous par le worker.** Position par défaut confirmée. Clé d'API jamais côté client, une route par rôle IA, SSE pour la narration, checklist **Worker Route Parity** pour chaque route neuve. Le routeur de modèle et d'effort reste un point d'extension nommé, pas une abstraction livrée. Pas de hors-ligne en v1.
- **D3 — carte des features + versionnement.** Carte conservée/repointée/supprimée en § 1 bis de la roadmap. Le modèle en paliers horizontaux est **retiré** : `0.6.x` = Temps 1, `0.7.x` = Temps 2, PATCH +1 par itération livrée.

### Supprimé — code (~9 500 lignes dans `src/features/`)

- **Huit features** avec leurs tests et leurs `specification.json` : `outline-view`, `action-decor`, `node-editor`, `choice-linking`, `action-pnj`, `action-monster`, `book-export`, `action-trap`. Toutes câblées sur des types de nœuds, des choix ou des formats d'export que la bascule abandonne (décision n° 1 : pas de migration).
- **`brain/ActionRegistry.ts`** et **`brain/SlotRegistry.ts`** — registres sans plus aucun inscrivant, retirés de `BrainContext` et du baril.
- **`brain/utils/scenarioExport.ts`** + **`BookService.importBook()`** — seul chemin de lecture du format scénario, devenu inatteignable.
- **`UIPreferencesService`** — préférences de l'ancienne vue plan (`viewMode`, `outlineCollapsed`, `outlineDisplayMode`) et les trois hooks correspondants ; le sélecteur arbre ↔ plan de `EditorTopBar` part avec.
- `App.tsx` et `EditorScreen.tsx` ramenés à une coquille : barre supérieure + canevas d'arbre, sans panneau d'édition. Elle tient jusqu'à la n° 2 `bascule-editeur`.

### Supprimé — documents

`PROMPT_SCENE_IA.md` + sa copie `public/` (prompt du format scénario abandonné — **la règle « triplet lié » de `CLAUDE.md` tombe avec**) · `docs/ROADMAP.md` (périmé) · les bundles de livraison déjà appliqués (`claude-design/`, `livraison/`, `specifications-jeu/`) · les copies périmées de `design_handoff_gamebook_editor/` (`features/`, `CLAUDE.md`, `code-knowledge.json`) · les artefacts locaux (`dist/`, `reports/`, captures, exports de scénario).

### Promu dans le dépôt

Quatre documents contraignants ne vivaient que dans des dossiers ignorés par git — dont la **source de vérité des règles du jeu** (KR-130) : `docs/REGLES-DU-JEU.md`, `docs/REGLES-PLAY.md`, `docs/EXIGENCE-APERCU-DU-JEU.md`, `docs/PLAN-BASCULE-IA.dc.html`. `.gitignore` ne masque plus `docs/` ; seul le bundle `claude-design/`, re-téléchargeable, reste ignoré.

### Documents mis à jour

`docs/ROADMAP-BASCULE-IA.md` (§ 1 décisions, § 1 bis carte D3, § 1 ter journal de bascule) · `docs/WORKFLOW.md` (versionnement et build steps) · `CLAUDE.md` (bandeau de bascule, la règle du prompt scénario remplacée par la règle « `REGLES-DU-JEU.md` fait foi », ordre de construction, où regarder) · `README.md` · `.claude/agents/narratif-ia.md` + `.claude/skills/raffinage-iteration/SKILL.md` (chemins des documents promus) · `code-knowledge.json` (**KR-154** documents de référence hors dépôt, **KR-155** supprimer le chemin de lecture entier d'un format abandonné).

### Revue tech-lead — `REQUEST_CHANGES` puis `APPROVE`

La revue de PR a remonté cinq must-fix, tous corrigés (BUG-028 à BUG-033 dans `bug_history.json`) :

- **Chemin mort dans une feature vivante** — `tree-canvas` gardait tout le chemin « Centrer dans l'arbre » (`RevealRequest` exporté dans son API publique, prop `reveal`, `useEffect` de recentrage, `useViewport.centerOn`) alors que son unique producteur, `outline-view`, était supprimé. L'effet ne pouvait plus jamais s'exécuter.
- **Trois événements de `EventBus` sans émetteur ni observateur** (`action:changed`, `monster:savedToLibrary`, `book:exported`) — un nom d'événement est un contrat à deux extrémités, il survit à la suppression des deux parce qu'aucun import de fichier ne le porte.
- **Consigne périmée dans la porte de commit** — `rules.golden.test.ts` demandait encore de répercuter toute évolution du bestiaire dans `PROMPT_SCENE_IA.md`, supprimé par ce même lot. Repointé sur `docs/REGLES-DU-JEU.md`.
- **§ 1 ter incomplet** — trois modules survivaient sans consommateur et sans être nommés (`brain/utils/download.ts`, `MonsterLibraryService` + son `seedDefaults` producteur-sans-lecteur, les huit primitives de `brain/components/`). Nommés, avec leur repreneur.
- **Test recentré devenu creux** — l'anneau d'avertissement d'une carte avait perdu son contrôle négatif : il n'affirmait plus que sa présence, donc il serait passé même si l'anneau était peint sur toutes les cartes. Contrôle négatif rétabli sur le nœud `mort`.

Un second tour a fermé un dernier blocage : **`CLAUDE.md` annonçait comme contrats vivants trois événements inexistants** — deux supprimés par ce lot même, et `object:granted`, qui n'a jamais été déclaré dans `AppEvents`. La ligne est alignée sur `brain/EventBus.ts` et se déclare désormais dérivée de lui plutôt que de prétendre être une énumération autonome (BUG-034).

Et un défaut de même nature trouvé en élargissant la recherche : **`.eslintrc.cjs` listait encore les treize features** (dont huit supprimées) et **quatre fichiers de `.claude/` pointaient `features/README.md`** — `/cadrer` demandait même d'y mettre à jour un tableau, ce qui aurait fait échouer la commande suivante. `FEATURE_DIRS` réduit aux cinq survivants et le sélecteur d'import dynamique construit depuis cette liste (fin de la duplication) ; les trois règles d'isolation re-testées par sonde `eslint --stdin` (import dynamique bloqué, import statique bloqué, import `brain/` accepté).

### Porte

`tsc --noEmit` propre · ESLint 0 erreur (1 avertissement pré-existant sur `CharacterCreationScreen`, non touché) · **485 tests verts sur 39 suites**, contre 55 fichiers de test avant le tri : les 16 suites parties couvraient les huit features supprimées. Aucun test survivant n'a été affaibli ; trois ont été **reciblés** sur ce qui subsiste — la persistance des préférences porte désormais sur l'espacement du canevas, et l'anneau d'avertissement d'une carte est vérifié sur la santé structurelle vive plutôt qu'au retour d'un export.

## 0.5.34 — outillage : score de mutation sur les règles + 3 invariants dans ESLint

Itération d'outillage — aucun comportement utilisateur, aucun contrat `brain/` modifié, aucune dépendance de production ajoutée.

### Lot A — score de mutation (`outil-mutation`)

- **`package.json`** — script `test:mutation` (`stryker run`), **hors** porte de commit : le hook `pre-commit-gate.sh` continue de n'exécuter que `tsc --noEmit` + `jest`. Deux devDependencies : `@stryker-mutator/core` et `@stryker-mutator/jest-runner` en `^9.6.1`.
- **`stryker.config.json`** (nouveau) — périmètre muté restreint aux 4 fichiers de règles (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) ; `enableFindRelatedTests: true` (run de 12 h ramené à ~46 s) ; `tempDirName: "stryker-tmp"` **sans point** (un segment de chemin commençant par un point rend `testMatch` aveugle et Stryker sort sur `No tests were executed`) ; `cleanTempDir: true` ; seuils posés sur une mesure, jamais arrondis à un chiffre rond.
- **`jest.mutation.cjs`** (nouveau) — projet Jest dédié au run de mutation, restreint à la couche logique (`src/brain/**`, `src/player/**`). Les tests RTL de features en sont exclus : ils maquilleraient un trou d'arithmétique en mutant tué.
- **`src/brain/rules.golden.test.ts`** (nouveau, 5 tests dans la **porte de commit**) — table dorée des registres : les 22 lignes du bestiaire champ à champ (11 champs), unicité des `templateId`, `CHALLENGE_TIERS` + `DEFAULT_CHALLENGE_TIER`, les 8 caractéristiques + `MONSTER_CHARACTERISTICS` + `CHARACTERISTIC_MAX`, les 3 postures et leurs facteurs de dégâts.
- **`src/brain/challenge.ts`, `src/brain/characteristics.ts`, `src/brain/combat.ts`** — commentaires `// Stryker disable`/`restore` **par mutateur** (`StringLiteral,ObjectLiteral,ArrayDeclaration`) sur les seuls registres, et annotation d'équivalence sur `atA > atD` (l'égalité est déjà traitée au-dessus, le mutant `>=` est équivalent). Aucune ligne de logique modifiée : les `ArithmeticOperator` des postures restent générés. 69 mutants de données sortent d'un dénominateur qui mesurait une densité de littéraux, pas la qualité des tests — la contrepartie est la table dorée ci-dessus, qui, elle, tourne à chaque commit.
- **`docs/WORKFLOW.md`** — le score hors porte, le cliquet du seuil (+5 par itération touchant les 4 fichiers, plafond 90, annotation obligatoire au-delà), le garde-fou « aucun fichier ne recule », la règle « zéro `RuntimeError` » (Stryker les exclut du dénominateur : ils rétrécissent la base en silence) et l'heuristique de revue de l'état dérivé (KR-013/113).
- **`.gitignore`** — `stryker-tmp/`, `.stryker-tmp/`, `reports/`, `stryker-run.log`.
- Mesure : score de mutation **66,67 % → 81,40 %** sur les 4 fichiers de règles (`challenge.ts` 63,33 → 86,84 ; `characteristics.ts` 44,59 → 94,12 ; `combat.ts` 59,49 → 62,50 ; `xp.ts` 87,72, stable). Seuil `break` posé à **80**. Aucun fichier n'a reculé, zéro `RuntimeError`.

### Lot B — invariants d'architecture dans ESLint (`lint-invariants`)

- **`.eslintrc.cjs`** — trois invariants de `CLAUDE.md` descendus dans ESLint, messages en français, sans aucune dépendance ajoutée : stockage brut interdit dans une feature (`no-restricted-globals` + `no-restricted-properties`, KR-011/111), import inter-features interdit (`no-restricted-imports` + `no-restricted-syntax` pour l'import dynamique), couleur en dur interdite (`no-restricted-syntax`, sélecteurs ancrés début-fin pour ne jamais viser une ancre `'#main'`). Les sélecteurs sont factorisés en constantes et _spreadés_ dans chaque bloc : les options d'une règle ne fusionnent pas entre la racine et un `overrides`.
- **`src/styles/tokens/colors.css`** — nouveau token `--overlay-soft` à la valeur exacte d'origine (aucun changement visuel).
- **`src/brain/components/Modal.tsx`**, **`src/features/node-editor/components/NodePreviewModal.tsx`** — les 2 couleurs en dur passent par un token.
- **Base ESLint remise à zéro** — 12 erreurs préexistantes mécaniques corrigées (apostrophes non échappées, `prefer-const`, variable morte `_wD`, `@typescript-eslint/no-explicit-any` résolu en remplaçant `(global as any).Image` par `globalThis.Image`) dans `ObjectEditor.tsx`, `TrapEditor.tsx`, `CloudSyncSettings.tsx`, `CharacterCreationScreen.tsx`, `combatEngine.ts`, `ImageUpload.test.tsx`. La 13ᵉ (`react-hooks/exhaustive-deps` sur `CharacterCreationScreen.tsx`) passe en dette tracée : `overrides` ciblé sur ce seul fichier avec le motif en commentaire + entrée `bug_history.json` (BUG-025) — pas de `eslint-disable-next-line`, interdit par `CLAUDE.md`.
- **`code-knowledge.json`** — KR-151 (zones d'import), KR-152 (stockage), KR-153 (heuristique d'état dérivé : pas de règle ESLint, l'AST voit une forme et pas une sémantique).

## 0.5.33 — fix : portrait PNJ manquant dans l'aperçu

- **`src/features/node-editor/components/NodePreviewModal.tsx`** — `PnjPreview` affiche désormais `pnj.portrait` comme avatar circulaire (80 × 80 px) au-dessus du nom/rôle (BUG-024).
- **`src/player/components/PnjScreen.tsx`** — même correctif appliqué en dehors du périmètre de l'erreur : `PnjScreen` affiche aussi `pnj.portrait` (même cause racine — champ présent dans `PnjConfig`, câblé dans l'éditeur, omis dans les deux vues de rendu).

## 0.5.32 — feat(cloud-sync iter 5) + fix : KV payload splitting + suppression image/nœud

- **`src/brain/CloudSyncService.ts`** — splitting KV : au push, `illustration` et `pnj.portrait` extraits dans des clés séparées (`bookImageKey`), manifest (`bookImagesManifestKey`) + contenu sans images (`bookContentKey`). Les données d'image ne transitent plus dans la clé contenu, éliminant les blobs de plusieurs Mo ; chaque clé image est adressable et remplaçable individuellement. Pull reconcile : essaie d'abord le format splitté (vérifie `nodes` array), retombe sur la clé legacy pour migration transparente.
- **`src/brain/persistenceKeys.ts`** — 3 nouvelles fonctions : `bookContentKey`, `bookImageKey`, `bookImagesManifestKey`.
- **`src/brain/BrainContext.tsx`** — `useBookPending` mis à jour pour matcher les clés splittées (`startsWith(bookKey+':')`).
- **`src/brain/BookService.ts`** — correctif BUG-022 : `updateNode` accepte `undefined` comme signal de suppression de champ (`else if (key in patch)` → `delete`), de sorte que `patch({ illustration: undefined })` efface vraiment l'illustration. BUG-023 (critique) : garde `key in patch` plutôt que `else` nu — le filtre structurel injecte synthétiquement `illustration: undefined` pour le sommaire, la première tentative détruisait silencieusement la couverture à chaque frappe.
- **`src/brain/BookService.ts`** — nouvelle méthode `deleteNode` : supprime un nœud non-structurel et tous ses liens entrants/sortants, émet `node:deleted` puis `edge:deleted`, rejette `sommaire` et `mort` (KR-055).
- **`src/features/node-editor/components/DeleteNodeDialog.tsx`** (nouveau) — dialog de confirmation (règle action dangereuse : `confirmTone="error"`, chemin d'annulation).
- **`src/features/node-editor/components/NodeEditorPanel.tsx`** — bouton 🗑 dans l'en-tête (invisible pour nœuds structurels), ouvre `DeleteNodeDialog`.

## 0.5.30 — fix : Missing X-Sync-Key header + TargetPicker clic souris

- **`CloudflareKVTransport.ts`** — timeout AbortController 45 s sur push/pull, corps de réponse inclus dans les erreurs, objet `headers` unifié (pattern projetx).
- **`main.tsx`** — garde chaîne vide : des credentials vides (`''`) ne créent plus de transport.
- **`TargetPicker.tsx`** — sélection déplacée vers `onMouseDown` sur chaque bouton candidat (`e.preventDefault()` + `choose()`); `onClick` conservé pour le clavier. Cause : `<ul onMouseDown={e.preventDefault()}>` annulait le `mousedown` de l'enfant ce qui, selon la spec UIEvents, supprime le `click` suivant — le clic souris était muet, Tab+Entrée fonctionnait car `click` s'y déclenche sans `mousedown`.
- **`TargetPicker.test.tsx`** (nouveau) — 4 tests dont le test de non-régression exact (`fireEvent.mouseDown`).

## 0.5.29 — feat(cloud-sync iter 4) : transport Cloudflare KV + UI de configuration

- **`worker/index.ts`** (nouveau) — proxy KV Cloudflare Worker : GET/PUT/DELETE `/kv/{key}`, auth via `X-Sync-Key`, namespacing par clé base64, CORS configurable via `ALLOWED_ORIGINS`, limite corps 2 Mo, erreurs 500 génériques.
- **`wrangler.toml`** (nouveau) — configuration Cloudflare Workers pour déploiement en < 5 min.
- **`src/brain/CloudflareKVTransport.ts`** (nouveau) — `createCloudflareKVTransport(workerUrl, syncKey)` : implémente `CloudTransport` en appelant le worker via fetch.
- **`src/brain/CloudSettingsService.ts`** (nouveau) — `createCloudSettings` : lit/écrit les credentials (URL worker + clé sync) dans le store local brut (jamais syncé, KR-114/KR-022).
- **`src/brain/persistenceKeys.ts`** — deux nouvelles clés `CLOUDSYNC_WORKER_URL_KEY` et `CLOUDSYNC_KEY_KEY` (marquée `// SENSITIVE`).
- **`src/brain/BrainContext.tsx`** — `cloudSettings: CloudSettingsService` ajouté au contexte brain.
- **`src/main.tsx`** — lit les credentials AVANT `createBrain` et injecte le transport KV si configuré, sinon offline.
- **`src/features/cloud-sync/components/CloudSyncSettings.tsx`** (nouveau) — modal de configuration : champs URL + clé, bouton « Générer une clé » (UUID), validation URL, double confirmation avant Désactiver (règle action dangereuse).
- **`src/features/cloud-sync/components/SyncIndicator.tsx`** — état `offline` devient un bouton ouvrant `CloudSyncSettings`.

## 0.5.28 — fix(cloud-sync) : supprime le bruit « en attente » après chaque frappe

- **`src/features/cloud-sync/components/SyncIndicator.tsx`** — le compteur « N sauvegarde(s) en attente » n'apparaît plus pendant le cycle debounce normal (syncing). Il n'est affiché que lorsque `status === 'error'` où il est actionnable (bouton Réessayer). Les états nominaux (idle / syncing / synced / offline) continuent d'afficher leur label de statut brut.
- **`src/features/cloud-sync/tests/SyncIndicator.test.tsx`** — test ajouté : en état `syncing`, le label est « Synchronisation… » et non un compteur ; test renommé pour refléter que « en attente » est spécifique à l'état error.

## 0.5.27 — fix(cloud-sync) : indicateur de synchronisation descriptif et actionnable

- **`src/features/cloud-sync/components/SyncIndicator.tsx`** — « changement » → « sauvegarde » (terme métier — c'est toujours une sauvegarde de livre) ; en état `error` la pastille devient un `<button>` qui appelle `sync.retry()` et affiche « N sauvegarde(s) en attente · Réessayer ». Accès à `sync.retry()` via `useBrain()`.
- **`src/features/cloud-sync/tests/SyncIndicator.test.tsx`** — test mis à jour + nouveau cas « bouton Réessayer en état error → sync.retry() → badge disparaît ».

## 0.5.26 — feat(node-editor) : Aperçu d'un écran avec contenu action complet

- **`src/features/node-editor/components/NodePreviewModal.tsx`** (nouveau) — modal de preview : illustration + texte + section action (PNJ : dialogue + don ; Monstre : carte nom/PV + boutons posture + Fuir ; Piège : description + jet + fatal ; Décor : libellé interaction + objets) + choix sortants. Tous les boutons d'action et de choix ferment la modal sans naviguer. Focus trap Tab + restore focus sur fermeture. Fermeture via ✕, Escape, clic backdrop.
- **`src/features/node-editor/components/NodeEditorPanel.tsx`** — bouton « Aperçu » dans le header du panneau.
- **`src/EditorScreen.tsx`** — `key={selectedNodeId ?? ''}` sur `<NodeEditorPanel>` : reset complet du panel (dont `previewOpen`) à chaque changement de sélection (BUG-019).
- **`src/features/node-editor/tests/NodeEditorPanel.test.tsx`** — 3 nouveaux cas : ouverture/fermeture via choix, via ✕/Escape, et via clic backdrop.

## 0.5.25 — fix : alerte en direct sur les boutons de choix sans texte

- **`src/brain/utils/bookHealth.ts`** — nouveau code `'unlabeled-choice'` dans `StructuralWarningCode` + boucle de détection dans `checkBookHealth` : toute `choice` edge sans libellé (ou libellé vide/espace) émet un avertissement sur le nœud source. Les edges `relink` et `flee` (non visibles par le joueur) sont exemptées.
- **`src/brain/bookHealth.test.ts`** — 6 nouveaux cas couvrant : pas de label, label vide, label espaces seuls, label valide, relink/flee exemptés, plusieurs edges non-labellisées sur un même nœud.
- **`src/features/outline-view/tests/outline.test.tsx`** + **`src/features/tree-canvas/tests/TreeCanvas.test.tsx`** — edges de test labellisées pour éviter les faux positifs `unlabeled-choice` dans les scénarios ciblant d'autres warnings.

## 0.5.24 — fix : drag & drop déplace les enfants + TargetPicker combobox

- **`src/features/tree-canvas/layout/geometry.ts`** — `collectSubtreeIds(rootId, edges)` : BFS sur les edges non-fatales depuis `rootId`, avec garde contre les cycles. Utilisé par `moveNode` pour propager le delta à tous les descendants.
- **`src/features/tree-canvas/components/TreeCanvas.tsx`** — `allLayoutEdges` useMemo (edges + `deriveMonsterEdges`) partagé ; `moveNode` applique le delta à tout le sous-arbre avant de déplacer le nœud racine.
- **`src/brain/components/TargetPicker.tsx`** — refonte en combobox : `<input type="text">` avec `role="combobox"` / `aria-controls` / `role="listbox"` sur la liste ; filtre temps réel par titre de nœud ; fermeture sur Escape et sur `onBlur` hors du composant.

## 0.5.23 — fix(tree-canvas) : nœuds de résultat de combat placés dans l'arbre

- **`src/brain/utils/automaticEdges.ts`** — `deriveMonsterEdges(book)` : dérive des edges layout-hint (`relink` pour `victoryTarget`, `flee` pour `fleeTarget`) à partir des configs des nœuds monstre. Ces champs sont stockés sur le nœud (pas comme edges explicites) donc les nœuds de résultat de combat n'avaient pas de parent reconnu par le BFS Dagre et tombaient dans la grille libre.
- **`src/brain/index.ts`** — exporte `deriveMonsterEdges`.
- **`src/features/tree-canvas/components/TreeCanvas.tsx`** — passe `deriveMonsterEdges(book)` à `resolvePositions` (layout uniquement — pas à `resolveEdges`, aucune flèche visuelle ajoutée).
- Tests : 6 nouveaux cas dans `automaticEdges.test.ts` + 2 cas de layout dans `geometry.test.ts`.

## 0.5.22 — hotfix : panneau nœud tronqué + suggestions TargetPicker

- **`src/features/node-editor/components/NodeEditorPanel.tsx`** — `flex: 1, minHeight: 0` sur `panelBody` : le corps du panneau remplit maintenant l'espace restant et devient scrollable. Corrige le panneau apparemment « en lecture seule » et l'impossibilité d'éditer les choix sortants d'un nœud Piège (sections coupées silencieusement par le shell, BUG-015).
- **`src/brain/components/TargetPicker.tsx`** — prop optionnelle `suggestedIds: ReadonlySet<string>` : affiche les nœuds contextuels (« Nœuds proches ») en tête du picker avec séparateur, avant la liste complète. Hauteur max portée à 240 px.
- **`src/features/action-monster/components/MonsterEditor.tsx`** — calcule `suggestedTargetIds` (prédécesseurs + leurs autres cibles) avec `useMemo` et les passe aux deux TargetPickers (victoire / fuite). Rend la sélection de la suite du combat intelligente et contextualisée.

## 0.5.21 — outline-view iter 4 : vue colonnes horizontales (Miller columns)

- **`src/features/outline-view/utils/buildColumnNodes.ts`** (nouveau) — `buildColumnNodes(book, path)` pure : only choice edges; `seenAt` map pour les convergences (↪ reference); ancestors set par profondeur pour les back-links (↩); outcomes monstre (victoryTarget/fleeTarget). `findChoicePath(book, from, to)` : BFS cycle-safe (KR-080) pour réconcilier la sélection externe avec le chemin courant.
- **`src/features/outline-view/components/ColumnPanel.tsx`** (nouveau) — colonne 220 px scrollable : NodeBadge + titre, prefix ↩/↪, chips outcomes monstre, `aria-pressed` sur la ligne active.
- **`src/features/outline-view/components/OutlineColumns.tsx`** (nouveau) — layout Miller columns : `useReducer` pour la navigation locale ; réconciliation de la sélection externe en render (dispatch-during-render, KR-013) ; `useLayoutEffect` auto-scroll à droite ; keyed sur `bookId` pour reset inter-livres.
- **`src/brain/UIPreferencesService.ts`** — `OutlineDisplayMode` + `setOutlineDisplayMode(bookId, mode)` dans `BookUIPrefs` ; pattern parallèle à `setLayoutSpacing`.
- **`src/brain/BrainContext.tsx`** — hook `useBookOutlineDisplayMode(bookId)` via `useSyncExternalStore`.
- **`src/brain/index.ts`** — export `OutlineDisplayMode` + `useBookOutlineDisplayMode`.
- **`src/features/outline-view/components/OutlineView.tsx`** — toggle [≡ Liste] [⦿ Colonnes] (SegmentedControl) ; rendu conditionnel `OutlineColumns` / vue liste existante ; mode persisté par livre via `UIPreferencesService`.
- Tests : `buildColumnNodes.test.ts` (15 tests) + `OutlineColumns.test.tsx` (6 tests) + `UIPreferencesService.test.ts` (`setOutlineDisplayMode`).

## 0.5.20 — book-export iter 4 : validation structurelle en direct (cul-de-sac + cibles fantômes)

- **`src/brain/utils/bookHealth.ts`** (nouveau) — `checkBookHealth(book)` pure : détecte les nœuds sans sortie (`dead-end`) et les arêtes pointant vers un nœud inexistant (`dangling-edge-target`) ; la sommaire est exempt (racine toujours valide vide)
- **`src/brain/hooks.ts`** — `useBookHealth(bookId)` : hook réactif sur `useOpenBook` ; relance `checkBookHealth` à chaque mutation du livre
- **`src/brain/index.ts`** — export du hook + des types `StructuralWarning` / `StructuralWarningCode`
- **`src/EditorScreen.tsx`** — `warnedNodeIds` = union des avertissements live (`useBookHealth`) + export (`onResult`) ; le rouge dans l'arbre et le plan s'allume sans cliquer sur « Exporter »
- **`src/brain/bookHealth.test.ts`** (nouveau) — 17 tests couvrant tous les cas : nœud mort, fin victoire/échec, monstre avec victoryTarget/fleeTarget, PNJ avec target, piège fatal (garde actionType), objectTrap, cul-de-sac, cible fantôme, livre propre

> **Versioning re-baselined to the horizontal-slice model** (see `docs/ROADMAP.md`): MINOR = capability tier (`0.1` MVP / `0.2` V1 / `0.3` V2 …), PATCH = one feature advanced within the tier. `package.json` reset `0.3.1 → 0.1.0`. The `0.2.0`/`0.3.0`/`0.3.1` entries below were produced under the earlier depth-first scheme and are kept for history; their work (tree-canvas iter 1–2, node-editor iter 1) is "banked depth" the slice plan won't redo.

## 0.5.19 — sommaire illustration : vignette bibliothèque + lightbox éditeur + header mode jeu

- **`src/brain/BookService.ts`** — `updateNode` accepte `{ text, illustration }` pour les nœuds structurels non-verrouillés (sommaire) ; mort reste text-only (KR-055)
- **`src/features/node-editor/components/NodeEditorPanel.tsx`** — section Illustration visible pour tous les nœuds sauf mort (`node.kind !== 'mort'`)
- **`src/brain/components/ImageUpload.tsx`** — lightbox sur clic de la vignette : overlay fixe, fermeture via Escape ou clic extérieur
- **`src/features/book-library/components/BookCard.tsx`** — illustration du sommaire affichée en vignette de couverture (140 px, object-fit: cover, coins arrondis haut)
- **`src/player/components/NodeScreen.tsx`** — illustration rendue en header pleine largeur avant le texte (maxHeight 360, edge-to-edge dans le conteneur 680 px)
- **`code-knowledge.json` / `CLAUDE.md`** — KR-055 mis à jour : sommaire = text + illustration ; mort = text uniquement

## 0.5.18 — book-export: nœuds problématiques surlignés en rouge après export

- **`src/features/book-export/hooks/useExportBook.ts`** — `ExportResult` gagne `warningList: PlayWarning[]`
- **`src/features/book-export/components/ExportGameButton.tsx`** — prop `onResult?` ; statut d'avertissement sans auto-hide ; tooltip `title` avec les messages
- **`src/EditorScreen.tsx`** — état `exportWarnings`, `warnedNodeIds` dérivé via `useMemo` (KR-013) ; `edgeId` résolu vers `edge.from` ; passé à `TreeCanvas` + `OutlineView`
- **`src/features/tree-canvas/components/NodeCard.tsx`** — prop `warned` ; bordure + fond + anneau `--bad` quand actif
- **`src/features/outline-view/components/OutlineView.tsx`** — prop `warnedNodeIds` ; badge `⚠` + fond `--bad-bg` + texte `--bad` sur les lignes concernées

## 0.5.17 — tree-canvas iter 6: SpacingToggle compact / aéré

- **`src/brain/UIPreferencesService.ts`** — `LayoutSpacing` type + `setLayoutSpacing()` dans `BookUIPrefs`
- **`src/brain/BrainContext.tsx`** — hook `useBookLayoutSpacing` (useSyncExternalStore, KR-013)
- **`src/features/tree-canvas/layout/geometry.ts`** — `resolvePositions` accepte un 4e param `spacing` ; constantes `SPACING.compact/spacious` (×2.9 V, ×3.1 H)
- **`src/features/tree-canvas/components/SpacingToggle.tsx`** — bouton toggle compact ↔ aéré avec `aria-pressed`, état actif en bleu accent
- **`src/EditorScreen.tsx`** — `<SpacingToggle>` affiché en vue canvas à côté de « Réorganiser »

## 0.5.16 — tree-canvas iter 5: Dagre auto-layout + bouton Réorganiser

- **`src/features/tree-canvas/layout/geometry.ts`** — remplace le DFS tidy-tree par Dagre/Sugiyama (DAG-aware) ; BFS pour les nœuds connectés ; grid inchangée pour les isolés
- **`src/brain/UIPreferencesService.ts`** — ajout `clearNodePositions(bookId)` : efface tous les overrides de position pour un livre
- **`src/features/tree-canvas/components/AutoLayoutButton.tsx`** — bouton « Réorganiser » affiché en vue canvas ; statut transitoire « ✓ Réorganisé »

## 0.5.15 — Field: auto-grow multiline textareas (4× cap + scroll)

- **`src/brain/components/Field.tsx`** — `useEffect` mount hook snapshots `offsetHeight × 4` as the cap; `useEffect([value])` resizes on every keystroke; `overflowY: auto` scrolls beyond the cap

## 0.5.14 — book-export iter 1: image upload, scenario import/export, AI prompt download; remove Méduse

- **`src/brain/bestiary.ts`** — Méduse removed (22 monsters; `regard-petrifiant` capacity kept in type union)
- **`src/brain/types.ts`** — `portrait?` on `PnjConfig`; `illustration?` on `BookNode`
- **`src/brain/components/ImageUpload.tsx`** (NEW) — brain primitive for image pick → data URL; `portrait` and `illustration` UI wired
- **`src/brain/components/index.ts`** — exports `ImageUpload`
- **`src/brain/utils/scenarioExport.ts`** (NEW) — `ScenarioExport` type, `exportScenario`, `isScenarioExport`
- **`src/brain/utils/download.ts`** — `downloadText` added alongside `downloadJson`
- **`src/brain/BookService.ts`** — `importBook(data: unknown): Book | null` (KR-143); `illustration` on `NodePatch`
- **`src/brain/index.ts`** — exports `exportScenario`, `isScenarioExport`, `ScenarioExport`, `downloadText`
- **`src/features/book-export/hooks/useExportScenario.ts`** (NEW) — pure scenario export hook
- **`src/features/book-export/components/ExportScenarioButton.tsx`** (NEW) — top-bar scenario export with timer-safe status
- **`src/features/book-export/components/ImportScenarioButton.tsx`** (NEW) — library import from `.scenario.json`
- **`src/features/book-export/components/DownloadAiPromptButton.tsx`** (NEW) — force-downloads `/PROMPT_SCENE_IA.md`
- **`src/features/book-library/components/LibraryScreen.tsx`** — optional `importEntry` ReactNode prop
- **`src/EditorScreen.tsx`** — adds `DownloadAiPromptButton` + `ExportScenarioButton` to actions bar
- **`src/App.tsx`** — injects `ImportScenarioButton` into `LibraryScreen` (composition root)
- **`PROMPT_SCENE_IA.md`** + **`public/PROMPT_SCENE_IA.md`** (NEW) — AI scenario-writing prompt (rules + bestiary + JSON format)
- **`CLAUDE.md`** — always-on rule: rule/bestiary/format changes must update both PROMPT_SCENE_IA copies
- **Tests** — `ImageUpload.test.tsx` (4); `scenarioExport.test.ts` (9); `pnj.test.tsx` portrait affordance updated; `gameSystem.test.ts` bestiary count 23→22

## 0.5.13 — action-trap iter 4: inventory loss on échec (KR-142)

- **`src/brain/types.ts`** — `TrapInventoryLossKind`, `TrapInventoryLoss` interface, `inventoryLoss?` on `TrapConfig`; `scenario?` on `GameObject`
- **`src/brain/index.ts`** — exports `TrapInventoryLoss`, `TrapInventoryLossKind`
- **`src/brain/components/ObjectEditor.tsx`** — `scenario` toggle ("Objet de scénario"); `ObjectDraft` extended
- **`src/player/engine/actionEngine.ts`** — `computeInventoryLoss(loss, outcome, inventory, objects): string[]` pure function
- **`src/player/components/TrapScreen.tsx`** — derives `lostObjectIds` inline; shows lost object names in result panel; `onFinish` extended with `lostObjectIds`
- **`src/player/hooks/usePlaySession.ts`** — `finishTrap` filters `session.inventory` by `lostObjectIds`
- **`src/player/components/PlayerRuntime.tsx`** — threads `lostObjectIds` to `finishTrap`
- **`src/features/action-trap/components/TrapEditor.tsx`** — inventory loss SegmentedControl (4 kinds) + object picker for Spécifique
- **`src/player/engine/actionEngine.test.ts`** + **`src/brain/components/ObjectEditor.test.tsx`** — 9 new tests (8 computeInventoryLoss, 1 scenario toggle)

## 0.5.12 — play-mode iter 6: object reinforcement (AC C5, KR-141)

- **`src/brain/types.ts`** — `ReinforcementBonus` interface; `reinforcementBonus?` field on `GameObject`.
- **`src/brain/components/ObjectEditor.tsx`** — Stepper 0–5 for BONUS DE JET (renforcement d'action section); `ObjectDraft` extended.
- **`src/player/engine/actionEngine.ts`** — `rollBonus` as 4th param (default 0) on `resolveTrap`, `resolveTakeableRoll`, inner `resolveRoll` — no breaking change to existing call sites.
- **`src/player/components/ReinforcementPicker.tsx`** (NEW) — toggle-select applicable inventory objects before a roll; returns null when none applicable.
- **`src/player/components/TrapScreen.tsx`** — two-phase UX: pick phase (result=null) when trap has a roll; resolves on "Affronter le piège" click with chosen rollBonus.
- **`src/player/components/DecorScreen.tsx`** — `ReinforcementPicker` above object list for prendre; rollBonus injected into `resolveTakeableRoll` per click.
- **`src/player/components/PlayerRuntime.tsx`** — passes `inventory` and `adventureObjects` to `TrapScreen`; hardcoded paddings → tokens.
- **`src/player/engine/actionEngine.test.ts`** — 2 new rollBonus tests (resolveTrap lifts fail, resolveTakeableRoll characteristicValue offset).
- **`src/brain/components/ObjectEditor.test.tsx`** — 1 new test (reinforcementBonus Stepper + onChange).

## 0.5.11 — play-mode iter 5: full action resolution (décor/PNJ/piège/XP shop, choice prereq/countdown)

- **`src/player/engine/actionEngine.ts`** (NEW) — pure functions: `resolveTrap`, `resolveDecorReveal`, `resolveTakeableRoll`, `applyPnjGift`, `autoEquipObject`, `computeCaracUpgrade/applyCaracUpgrade`, `computeMcUpgrade/applyMcUpgrade`. EN upgrade increments both `pvMax` and `peMax` (§ 1, KR-140).
- **`src/player/engine/actionEngine.test.ts`** (NEW) — 48 tests covering all branches including deterministic RNG, EN/peMax invariant, prereq filtering.
- **`src/player/components/ChoiceList.tsx`** (NEW) — choice list with `CountdownChoice` per-choice setInterval (stable `onChoiceRef`, primitive deps, cleanup on unmount — KR-139).
- **`src/player/components/TrapScreen.tsx`** (NEW) — piège screen; random result fixed once via lazy `useState` initializer.
- **`src/player/components/PnjScreen.tsx`** (NEW) — PNJ dialogue + optional gift preview; `applyPnjGift` returns additive deltas.
- **`src/player/components/DecorScreen.tsx`** (NEW) — décor reveals + per-object takeable roll; `autoEquipObject` wired via `session: SessionEquipmentState` prop.
- **`src/player/components/XpShopScreen.tsx`** (NEW) — bottom-sheet XP progression modal (caracs + MC, IN ≥ 6 gate).
- **`src/player/hooks/usePlaySession.ts`** — `takeObject`, `finishDecor`, `finishPnj`, `finishTrap`, `spendXpOnCarac`, `spendXpOnMc` callbacks added.
- **`src/player/components/NodeScreen.tsx`** — uses `ChoiceList` instead of inline buttons.
- **`src/player/components/HeroStatusBar.tsx`** — optional `onProgressionClick` prop → "Progression" button.
- **`src/player/components/PlayerRuntime.tsx`** — routes décor/PNJ/piège screens with anti-farm visited-node guard; XpShopScreen overlay; PNJ ref resolution.
- **`src/styles/tokens/colors.css`** — `--overlay: rgba(0, 0, 0, 0.45)` token added.
- **`src/player/engine/sessionEngine.test.ts`** — 3 new tests for `filterChoicesByPrereq` (satisfied, unsatisfied, empty objectId).

## 0.5.10 — play-mode iter 4: CAPACITY_HOOKS registry (23 capacités, magic/silver)

- **`src/player/engine/combatTypes.ts`** (NEW) — shared combat types extracted to avoid circular imports (CombatState, MonsterInstance, CombatEffectsState, defaultEffectsState).
- **`src/player/engine/capacityEffects.ts`** (NEW) — `CAPACITY_HOOKS: Record<MonsterCapacityId, CapacityHooks>` — all 23 capacités wired as pure lifecycle hooks (KR-133). Covers: maladie, vol, se-relève, chant-stressant, fureur, poison/venin (DoT), renversement, étreinte (×2 on 3rd win), malédiction (disarm), intangible, force-écrasante, insensible, piques (pre-combat), régénération/argentée, séisme (stun), magie/rayon (armour bypass + per-round effects), vol-de-vie.
- **`src/player/engine/capacityEffects.test.ts`** (NEW) — 35 targeted hook tests.
- **`src/player/engine/combatEngine.ts`** (rewrite) — dispatches all monster behaviour through `CAPACITY_HOOKS`; KR-136 magic bonus + silver armour bypass wired.
- **`src/brain/monsterCapacities.ts`** — `bypassedBySilver?: boolean` on descriptor; `magie` description corrected to match implementation.
- **`src/player/types.ts`** — `activeMagicBonus: number`, `activeSilverWeapon: boolean` on `SessionEquipmentState`.
- **`src/player/engine/sessionEngine.ts`** — defaults for new session fields.
- **`src/player/hooks/useCombat.ts`** — `onVictory` extended with `enMaxDelta/pvMaxDelta/volTriggered`.
- **`src/player/hooks/usePlaySession.ts`** — `finishCombat` applies post-combat permanent mutations.
- **`src/player/components/PlayerRuntime.tsx`** — updated combat callbacks.

## 0.5.9 — play-mode iter 3: combat engine (CREATURE_TYPES, posture AI, flee, E1, XP)

- **`src/brain/creatureTypes.ts`** — `CREATURE_TYPES` KR-135 registry: flee threshold/strategy, posture weights, `immuneToFatigue` per creatureType. Mort-vivants have `immuneToFatigue: true` (no PE gauge).
- **`src/player/engine/combatEngine.ts`** — pure RNG-injectable combat engine: `startCombat`, `pickMonsterPosture` (AI weights + lowHp shift), `resolveCombatRound` (simultaneous AT, Garde aiguisée D2-bis, monster PE drain, armour degradation, E1 unconscious), `tryHeroFlee` (free assault then hero-fled).
- **`src/player/hooks/useCombat.ts`** — `useCombat` hook wiring combat state + 4 end callbacks (onVictory, onFlee, onDeath, onSurvivedUnconscious).
- **`src/player/components/CombatScreen.tsx`** — combat UI: monster PV/PE bars, hero PV/PE bars, posture buttons, flee button, round log, end panel.
- **`src/player/components/PlayerRuntime.tsx`** — routes unvisited monster nodes to `CombatScreen`; visited nodes show `NodeScreen` (anti-farm G2).
- **`src/player/hooks/usePlaySession.ts`** — `finishCombat` (updates hero PV/PE/XP, loot, armorDeg, visited set, navigates) + `navigateToMort`.

## 0.5.8 — play-mode iter 2: character creation screen + equipment state

- **`src/player/engine/charCreation.ts`** — pure creation logic: `rollCreationPool` (8×2D4 + 1D4 bonus), `emptyAssignment`, `isAssignmentComplete`, `baseValue/totalValue`, `buildHeroFromCreation`. `CREATION_CAP = 10`.
- **`src/player/components/CharacterCreationScreen.tsx`** — interactive pool assignment (click pool die → click carac), bonus stepper per carac (capped at CREATION_CAP), 1-reroll, name input, "Valider →" enabled when complete.
- **`src/player/hooks/usePlaySession`** — `UsePlayRuntimePhase = 'start' | 'creating' | 'playing'`; `goToCreation`, `rerollCreation`, `confirmHero` replace `startNew`; `restart` now goes to creation screen.
- **`src/player/engine/sessionEngine`** — `createSessionFromHero(adventure, hero)` + `defaultSessionFields()` (inventory + equipment defaults).
- **`src/player/utils/persist`** — `loadSession` migrates pre-iter-2 sessions (defaults inventory/equipment fields).
- **`src/player/types`** — `SessionState` extended with `inventory`, `activeWeapon`, `activeProtection`, `activeShield`, `armorDegradation`.
- 380 tests passing (+25 new).

## 0.5.7 — play-mode: walking skeleton + iter 1 (node traversal, auto-save, end screens)

- **`src/player/`** — new isolated play runtime (zero editor imports; extractible to another webapp/mobile):
  - `engine/heroGen.ts` — auto-roll hero (2D4 per carac); `pvMax = FO+AG+EN`, `peMax = EN`.
  - `engine/sessionEngine.ts` — pure state machine: `createSession`, `navigate` (+5 PE per transition, capped at peMax), `listChoices`, `determinePhase` (victory / failure / mort).
  - `utils/persist.ts` — per-book save/load via `localStorage` key `genliv:play:session:{bookId}` (KR-134).
  - `components/PlayerRuntime.tsx` — start prompt (Continuer / Nouvelle partie) → NodeScreen → EndScreen.
- **`brain/utils/buildAdventureDocument.ts`** — pass-through over `exportBookForPlay`; no file download.
- **`features/play-mode/components/PlayerModal.tsx`** — fullscreen overlay; Escape key closes.
- **EditorTopBar** — `onPreview?` prop makes « Aperçu du jeu ▷ » active when wired.
- **EditorScreen** — wires `onPreview → buildAdventureDocument(book) → PlayerModal`.
- 355 tests passing (+33 new).

## 0.5.6 — game-system: XP steppers, capacity registry, auto-tier

- **XP attribué** (0–5) Stepper added to the PNJ editor and the Décor editor (`xp?:number` on `PnjConfig` / `DecorConfig`).
- **Capacités monstres** — replaced the free-text capacity Field with a picker from the new `MONSTER_CAPACITIES` KR-117 registry (`brain/monsterCapacities.ts`): 24 ids (`aucune` + 23 named abilities from the bestiary). The bestiary now seeds all 23 monsters with typed capacity ids. Legacy free-text values fall back to `aucune` in the editor.
- **Tier auto-calculé** — the Tier SegmentedControl is replaced by a read-only badge computed from `tierOf(maitriseDesCoups(stats))`. Changing a carac stepper writes the new tier to `MonsterConfig.tier`. Tier is never manually editable.
- **ObjectEditModal & TrapEditor** — characteristic picker migrated from `Select` (combobox) to `SegmentedControl` (abbr labels); `ObjectEditor` select options now show weapon multiplier and protection reduction values; invalid CSS tokens (`--border`, `--surface-2`, `--font-body`) replaced with correct tokens.
- 321 tests passing (+5 new).

## 0.5.5 — game-system: full genliv rules pack (iter 1)

- **7 caractéristiques** (FO/AG/DX/EN/IN/IG/CA, capped 12) replace the 3-trait placeholder via the `CHARACTERISTICS` KR-117 registry in `brain/characteristics.ts`.
- **4 Tiers de Challenge** (TC1·1D6 / TC2·2D5 / TC3·3D4 / TC4·4D4) replace numeric `difficulty` via the `CHALLENGE_TIERS` registry in `brain/challenge.ts`. Legacy `SkillRoll.difficulty` is migrated via `rollTier()` on read and dropped on write (KR-021).
- **WEAPONS & PROTECTIONS** registries in `brain/equipment.ts`; `EquipmentEffect` added to `GameObject` and authored via a new section in the shared `ObjectEditor`.
- **23-monster canonical bestiary** in `brain/bestiary.ts`, seeded once into `MonsterLibraryService` on first launch via the new `seedDefaults(BESTIARY)` method (idempotent, deletion-safe, KR-132).
- **Pure play-mode helpers** in `brain/combat.ts` (POSTURES, `resolveAssault`) and `brain/xp.ts` (`challengeXp`, `combatXp`, upgrade costs), all with injectable RNG for deterministic tests.
- **Editor UI updates**: `TrapEditor` and `ObjectEditModal` now use SegmentedControl for trait (abbr labels) + tier (TC·notation); `MonsterEditor` renders the full § 4 stat block (FO/AG/DX/EN/IG steppers, MC, PV, variance, armure, natural-weapon multiplier, tier, capacité).
- 316 tests passing (+17 new in `gameSystem.test.ts` + `seedDefaults` test in `MonsterLibraryService.test.ts`).

## 0.5.4 — book-export: play-ready file export (new feature, walking skeleton)

- **« Exporter le jeu ⬇ »** — a new control in the editor top bar downloads the book as a **self-contained, versioned play file** (`<titre>.jeu.json`, format `genliv-play` v1) destined for the (deferred) play runtime.
- **Pure brain transform `exportBookForPlay(book)`** — bakes in everything a runtime needs without recomputation: nodes (minus the editor-only `position`), authored edges **plus the config-derived automatic edges** (échec→Mort, KR-067) folded into one list, and the **resolved object catalog** (`collectObjects`). Reuses the existing derivations, so the export can never disagree with the canvas/outline.
- **Non-blocking referential-integrity report (KR-021)** — the export always succeeds and surfaces **dangling references** (deleted edge targets, prereq objects, countdown fallbacks, monster/PNJ targets, décor object refs, unconfigured rules) as structured `warnings` in the file; a transient status beside the button shows **« ✓ Export réussi »** or **« ⚠ N avertissement(s) »** and `book:exported` is emitted with the count.
- New brain utils `downloadJson` / `slugifyFilename` (Blob + object URL, **always revoked**; no-op outside a DOM). `EditorTopBar` gained a generic **`actions` slot** (KR-120) the editor shell fills with `<ExportGameButton>` — the bar never imports the feature. 299 tests passing (+17). New capability outside the ragged-iteration plan; play mode itself stays deferred.

## 0.5.3 — choice-linking refinement: lineage-scoped hidden-prereq picker (KR-118)

- **« Pré-requis caché » now offers only objects in the choice node's lineage** — the required-object picker used to list **every** acquirable object in the whole book; it now offers only objects collectable on the **path that reaches this screen** (the node itself + its ancestors), because a player can only own an object they could have found on the lineage they chose.
- New pure brain util **`collectLineageObjects(book, nodeId)`** — reverse-reachability over `book.edges` (all kinds count; cycles handled by a visited set), reusing `collectObjects` over the lineage-scoped node subset so de-dup/migration stay single-sourced. The whole-book `collectObjects` still **resolves** an existing reference.
- **Narrowing never silently drops a rule** — an already-set reference that resolves but lies outside the lineage stays selectable and is flagged **« ⓘ hors lignée »** (distinct from a deleted **« ⚠ introuvable »**); the dangling warning still renders when the lineage picker is empty. The empty state distinguishes « no objects in the book » from « none in this lineage ».
- `ChoicePrereqEditor` gained an `options` prop (lineage) beside `catalog` (full, for resolution). 282 tests passing (+7). User-requested refinement; no new tier.

## 0.5.2 — choice-linking iteration 4 (V4 slice — tier complete 🏁)

- **Per-choice countdown (§ 05)** — a choice can now carry a **« compte à rebours »**: a **délai** (Stepper clamped 5–60s, default 15) + a **fallback node** it expires to. The rule rides the choice edge as `Edge.countdown?: { delay, fallback }`, persisted via `BookService.updateEdge` (`EdgePatch` gained `countdown: ChoiceCountdown | null`); label, prereq, and countdown are independent.
- **Referential-integrity sweep (KR-063)** — the row validates **both** rules against the live book: the prereq vs `collectObjects` (⊘ / ⚠), and the countdown fallback vs `getNode` — **« ⏱ Ns »** when it resolves, **« ⏱ repli manquant »** when unset or deleted. A choice may hold both a prereq and a countdown (KR-065). The fallback is picked via the shared brain `TargetPicker` (excludes structural/self, surfaces a deleted target).
- New `ChoiceCountdownEditor` (mirrors the iter-3 `ChoicePrereqEditor`). The play-mode ticking/expiry is out of editor scope.
- **choice-linking is complete (n=4).** 275 tests passing (+3). **🏁 The 0.5.x / V4 tier is complete** — iteration 4 of every n≥4 feature (tree-canvas, node-editor, choice-linking). **All features are now at their full iteration depth.**

## 0.5.1 — node-editor iteration 4 (V4 slice)

- **Debounced Description commits** — typing in a node's Description now updates a fast local draft and writes through `BookService` only after the typing settles (or on blur), so a keystroke no longer fires `updateNode → node:updated → a canvas/outline re-read` per character. **No data loss**: a pending edit is flushed on blur **and** on the selection-swap unmount (the panel is keyed by node id, KR-053); the debounce timer is ref-tracked + cleared on unmount.
- New `useDebouncedText` hook + a `NodeDescription` component (so the hook stays unconditional past the panel's empty-state guard); the brain `Field` gained an optional `onBlur`. The rest of iter 4 (clean content swap, choices slot, deferred illustration, keyboard a11y) was already in place.
- **node-editor is complete (n=4).** 272 tests passing (+1).

## 0.5.0 — tree-canvas iteration 4 (V4 tier opens 🚀)

- **Off-screen culling for large books** — the canvas now measures its surface (a `ResizeObserver`) and renders **only the node cards + edges intersecting the visible viewport** (+ a `CULL_MARGIN` so panning never pops a card in), so a big book stays at 60fps. Pure, testable geometry: `viewportRect` maps the surface back to canvas space through the `translate scale` transform; `nodeInView` / `edgeInView` are box/segment intersection tests. Until the surface is measured (first paint / jsdom) nothing is culled — small cases are unchanged.
- Culling is a pure **view filter** (derived inline with `useMemo`, KR-013) over the existing layout + orphaned-edge drop (KR-021) — the SSOT and layout are untouched. Edge-label overlap avoidance deferred (minor visual).
- **tree-canvas is complete (n=4).** 271 tests passing (+3). **🚀 The 0.5.x / V4 tier opens** — iteration 4 of the features whose n≥4 (tree-canvas, node-editor, choice-linking).

## 0.4.9 — cloud-sync iteration 3 (V3 slice — tier complete 🏁)

- **Conflict handling instead of silent last-write-wins** — when a book diverged on **both** sides (local has unpushed edits **and** the cloud copy is newer), `book:opened` reconciliation no longer silently overwrites either side (KR-098). It stashes the cloud copy, emits a new **`sync:conflict`** event, and surfaces a resolution affordance. A clean local (no unpushed edits) still adopts a newer cloud via safe LWW — nothing to lose.
- **Resolution** — new `CloudSyncService.conflicts()` + `resolveConflict(bookId, 'local' | 'cloud')`: **« Garder ma version »** re-queues local to push over the cloud; **« Prendre la version du cloud »** adopts the cloud copy and drops the queued local edit. A new **`ConflictDialog`** (mounted once by App, a VIEW over `useSyncConflict`) presents the choice for the open book.
- **Deferred:** queued deletes/tombstones + cloud-only list reconciliation (need new `CloudTransport` delete + list capabilities) — shared with the book-library iter-3 deferral.
- 268 tests passing (+7). **🏁 The 0.4.x / V3 tier is complete** — iteration 3 of every feature that has one (`node-editor` iter 3 superseded).

## 0.4.8 — action-trap iteration 3 (V3 slice)

- **Trap-on-object** — a décor « Prendre » object's « jet requis » can now be marked **« Variante piège : échec → mort »**: taking the object and failing the roll is lethal. It reuses the **shared roll model** (`SkillRoll` gained a `fatal` flag) and the trap's **derived fatal → Mort edge** — `deriveAutomaticEdges` now emits the same `auto-fatal-<node>` edge for a décor node with a fatal takeable roll as for a « échec sanctionné » trap (KR-067/092). View-derived from config, never authored.
- The two features share only the brain `SkillRoll` + `deriveAutomaticEdges` (and the toggle lives in décor's `ObjectEditModal`) — neither imports the other.
- 261 tests passing (+4).

## 0.4.7 — action-monster iteration 3 (V3 slice)

- **Reusable monster library** — « Ajouter à la librairie du générateur » now actually **persists** a monster to a new cross-book **`MonsterLibraryService`** (brain, raw local store, not synced), and a searchable **`MonsterLibraryPicker`** (« ↪ Choisir dans la librairie… ») **instantiates** a saved monster onto a node. The long-wired `monster:savedToLibrary` event is now consumed (no longer a stub).
- **Copy, not reference** — unlike the within-book PNJ/object references (resolved live), a library monster is reused **across books**, so it's instantiated as an independent **copy**: node-specific targets are stripped on save, and loot gets a **fresh id** on instantiate (KR-097/003). New `useMonsterLibrary` external-store hook.
- 257 tests passing (+7).

## 0.4.6 — action-pnj iteration 3 (V3 slice)

- **Reuse a PNJ « du livre » by stable id** — a PNJ node can now reference an existing PNJ authored elsewhere instead of re-typing it. A new searchable **`PnjPicker`** (« ↪ Réutiliser un PNJ du livre… », mirrors the décor reuse picker) lists the book's other PNJs; picking one stores a **reference**.
- **The owner node id IS the PNJ's stable id** — no new id field, no minting, no migration (KR-096). `PnjConfig` gained `pnjRef?: string` (the owner node id). A reference resolves its identity **live** via the new derived `collectPnjs` / `resolvePnj` (`action-pnj/utils/pnjCatalog.ts`), so the PNJ stays single-sourced on its origin node (no desync, KR-020).
- **Read-only + dangling-safe** — a referenced PNJ renders read-only (resolved name/role/dialogue/gift + **« réutilisé »** badge + « défini sur <owner> », with a **« Ne plus réutiliser »** detach). A dangling reference (origin deleted, no longer a PNJ, or itself a ref — refs don't chain) shows **« ⚠ PNJ introuvable »** (KR-021).
- 250 tests passing (+6).

## 0.4.5 — action-decor iteration 3 (V3 slice)

- **Reuse an object « dans la liste » by stable id** — a décor « Prendre » can now reference an existing acquirable object (a décor takeable, PNJ gift or monster loot anywhere in the book) instead of authoring a duplicate. A new searchable **`ReuseObjectPicker`** (mirrors the relink popover) lists `collectObjects(book)` minus the objects already present here; picking one adds a **reference** takeable.
- **Reference, not copy** — `TakeableObject` is now `own { object }` **or** `ref { objectRef }` (`object` became optional; exactly one set). A ref is **resolved live** via `findObject`, so the object stays single-sourced on its authoring node (no desync, KR-020); `collectObjects` skips refs (no phantom catalog entry). A ref row is read-only (shows the resolved name + **« réutilisé »**) and a dangling reference (owner deleted) surfaces **« ⚠ objet supprimé »** (KR-021).
- **Not an owned `ObjectCatalogService`** — the derived `collectObjects` catalog (built for choice-linking iter 3) IS the catalog; this slice adds the décor authoring side over the same foundation. New `takeables.ts` helpers `refTakeable` / `isRefTakeable` / `takeableId` / `resolveTakeableObject`. `ReuseObjectPicker` extracted to keep `DecorEditor` under 400 lines (KR-112).
- 243 tests passing (+7).

## 0.4.4 — outline-view iteration 3 (V3 slice)

- **Outline expand/collapse state now persists per book** — collapsing a node in the outline survives switching to the canvas and back (and a reload). The collapsed-node set is a per-device, **non-synced** UI preference (KR-022): `BookUIPrefs` gained `outlineCollapsed?: string[]`, `UIPreferencesService.setOutlineCollapsed`, and a new brain **`useBookOutlineCollapsed(bookId)`** external-store hook (returns a `Set` memoised on the cache-stable array, KR-013). `OutlineView` dropped its local `useState<Set>` for the hook.
- **The view-mode half was already done** — `EditorScreen` has persisted the canvas↔outline view-mode via `useBookViewMode` since tree-canvas iter 3; this slice completes iter 3 with the remaining expand-state persistence.
- A stale collapsed id (its node was deleted) is harmless — `computeVisibleRows` simply never matches it (no cleanup needed, KR-021 spirit).
- 236 tests passing (+2).

## 0.4.3 — book-library iteration 3 (V3 slice)

- **Per-book cloud-sync status on each card** — a small chip reflects whether that book is **« ✓ à jour »**, **« ⏳ en attente »** (its write is still queued to the cloud), or **« ⚠ non synchronisé »** (last push errored). A local-only build (no transport) shows no chip — there's no cloud state to reflect. A live VIEW over `CloudSyncService`, never a private mirror (KR-095/020/013).
- **`CloudSyncService.pendingKeys()`** (new, generic) returns the queued storage keys; the decorator stays **book-agnostic** (KR-094). The book→key mapping lives in a new brain **`useBookPending(bookId)`** external-store hook (`bookKey(id) ∈ pendingKeys`), re-read on each `sync:status` emit (same cadence as the global indicator).
- **Deferred (transport-capability work, cloud-sync's domain):** list reconciliation (pulling cloud-only books needs a `CloudTransport` enumerate/list) and offline **delete** propagation (the decorator's `remove()` pushing a tombstone needs `CloudTransport` delete). `CloudTransport` currently has `push`/`pull` only.
- 234 tests passing (+5).

## 0.4.2 — choice-linking iteration 3 (V3 slice)

- **Hidden prerequisite on a choice (§ 05, KR-062)** — a choice can now require the player to own an object before it appears. Per-row **« pré-requis caché »** toggle + an object picker; the rule rides the choice edge as `Edge.prereq?: { objectId }`, persisted via `BookService.updateEdge` (`EdgePatch` gained `prereq: ChoicePrereq | null` — `null` clears, omitted leaves untouched; the label and prereq are independent).
- **Object catalog is a derived VIEW, not an owned store** — new pure brain `collectObjects(book)` / `findObject(book, id)` (`brain/utils/objects.ts`) union every acquirable object already authored on a node (décor « prendre » takeables, the PNJ gift, the monster loot), de-duped by stable id. Objects stay owned where they're authored (KR-020, no `ObjectCatalogService` to desync); everything references by id, so a future owned catalog could swap in transparently.
- **Dangling references surfaced, never silent** — the row shows a **⊘ « pré-requis »** badge when the id resolves and a **⚠ « pré-requis »** badge when it dangles (object deleted, or none chosen yet), validated at the view against the live catalog (KR-062/021/013).
- Per-row rule UI extracted to `ChoicePrereqEditor` so `OutgoingChoices` stays under the 400-line split signal (KR-112).
- 229 tests passing (+7). node-editor iter 3 was superseded; choice-linking iter 3 is the V3 tier's third shipped slice.

## 0.4.1 — tree-canvas iteration 3 (V3 slice)

- **New brain `UIPreferencesService`** — the single gateway for per-device, **non-synced** editor view state (pan/zoom, canvas↔outline view-mode, dragged node positions, KR-022/025). Wired in `createBrain` over the **raw local store, never the `CloudSyncService` decorator**, so this state can't enter the cloud queue (KR-093); its `genliv:ui:book:<id>` key stays out of `listBooks`. Reads are **cache-backed** for `useSyncExternalStore` snapshot stability; each write makes a new prefs object and notifies subscribers. New hooks `useUIPreferences` / `useBookViewMode` / `useBookNodePositions` (KR-013, external-store).
- **Pan/zoom persists per book** — `useViewport` seeds the live viewport from the service and **persists on settle** (drag-release, each zoom step, a centre request), not every pan frame.
- **Canvas↔outline view-mode persists per book** — `EditorScreen` reads/writes it through the service, so the switch survives a reload.
- **Drag a node to reposition it** — a new `useNodeDrag` hook (window pointer listeners, ref-tracked + unmount-cleaned, the BUG-001 pattern): travel past a threshold commits the position (persisted via `UIPreferencesService`) and consumes the click so a drag never selects; a press without travel stays a select. The dragged position is a **UI preference, not synced `node.position`**, and **overrides** the auto-layout slot in `resolvePositions` (only for nodes still in the book — a deleted node's stale override leaves no ghost, KR-021/023).
- 220 tests passing (+14). This unblocks the long-deferred tree-canvas layout-persistence work (the iter-3 dependency that needed `UIPreferencesService`).

## 0.4.0 — book-creation iteration 3 (V3 slice — tier opens 🚀)

- **Cloud-first create, surfaced + locked in.** The cloud-first persistence the iter-3 goal describes was already satisfied transparently by the `CloudSyncService` decorator (KR-093): `createBook` writes through `brain.sync`, so a new book is **local-first** (synchronous local write) and **queued for the background cloud push**, and `listBooks`/`getBook` **restore it on reload**. This slice surfaces that to the author and pins it with tests rather than re-plumbing persistence.
- **Sync-aware cloud-first hint** in `NewBookDialog`: a muted line reads the brain `useSyncStatus` external store (KR-013, no `useEffect` mirror) and derives its reassurance copy from a closed-set `Record<SyncStatus, string>` (KR-117) — **offline** promises a later sync (« Enregistré sur cet appareil, synchronisé au retour en ligne »), **online** an immediate one — so « Créer » visibly works without a connection and the book is saved on-device first. The copy Record lives in the feature (not brain): book-creation owns this author-facing string, distinct from `SyncIndicator`'s badge-label Record (KR-109).
- **Integration tests** pin the contract: a created book **persists + survives a reload** (a fresh brain over the same store re-reads it); a configured-but-unreachable transport **queues the create** (`pendingCount() >= 1`) while the book stays **readable locally**; the offline hint renders.
- 206 tests passing (+3). **🚀 The 0.4.x / V3 tier opens** — iteration 3 of each feature that has one, in build order, starting with `book-creation`.

## 0.3.8 — cloud-sync iteration 2 (V2 slice — tier complete 🏁)

- **Offline write queue**: the pending pushes are now a **persisted queue** (`CLOUDSYNC_QUEUE_KEY`, local namespace via the underlying store — no echo, not a book key) loaded at startup, so an **unconfirmed write survives a reload**. A failed push **keeps the queue** (status → `error`) instead of dropping the batch; on success only the entries actually pushed are dequeued (a newer write to the same key during the in-flight push stays queued), guarded by a `flushing` flag against double-push.
- **Flush on reconnect**: three triggers — the next write, an explicit `retry()`, and **startup** (a persisted backlog schedules a flush). New `CloudSyncService.pendingCount()` / `retry()`; the `sync:status` payload carries `pending`; a new `useSyncPending` external-store hook (KR-013).
- **« N changements en attente »**: the `SyncIndicator` surfaces the queued count (via `plural()`), keeping the status tone — derived, no new `SyncStatus` value (KR-095). Emits stay status-change-only (no per-keystroke noise).
- **Unblocks `book-creation` iteration 3** (cloud-first offline create). Conflict handling remains iter 3.
- 202 tests passing (+3). **🏁 The 0.3.x / V2 tier is complete — every feature has its iteration 2.**

## 0.3.7 — action-trap iteration 2 (V2 slice)

- **The « échec sanctionné » fatal flag now wires the automatic →Mort link (§ 05, KR-067)** — the long-deferred "dedicated combat/trap path". Built as a **view-derived** edge, never stored and never the manual `addEdge` API (which rejects a Mort target): a new pure brain **`deriveAutomaticEdges(book)`** emits a synthetic `{ kind: 'fatal' }` edge from each fatal-trap node (`actionType === 'piege' && trap.fatal`) to the Mort leaf; `TreeCanvas` resolves authored + derived edges together. The config stays the SSOT, so the link can never desync (KR-020/013) and is present iff fatal.
- New **`fatal` edge kind** in the `EDGE_KINDS` registry (one entry, KR-068): the canvas draws it as a dashed **« ✕ Mort »** edge (`EdgeLayer` already dashes every non-`choice` kind). The `TrapEditor` shows a « lien automatique vers la Mort » note when fatal.
- Scoped to the trap fatal→Mort link; `deriveAutomaticEdges` generalises to the deferred monster/PNJ outcome targets (a follow-up).
- 199 tests passing (+4). Trap-on-object variant remains iter 3.

## 0.3.6 — action-monster iteration 2 (V2 slice)

- **« Butin lâché » loot (§ 4D)**: a « Le monstre lâche un butin » toggle reveals the shared brain **`ObjectEditor`** (its **4th** reuse, after décor/pnj/the gift — KR-052/109) for the object dropped on victory, persisted on `monster.loot` with a stable id (`blankLoot`/`createId`, KR-003); toggling off drops it. Live-edited (no modal — a toggle-gated single object has no cancel-a-new-item need).
- **Combat reinforced by an inventory object deferred**: « si le joueur possède … → victoire automatique » is the **same by-id inventory reference** as choice-linking's hidden prerequisite (KR-062), so it pairs with the `ObjectCatalogService` work rather than introducing a by-name reference now (which KR-062 forbids). Recorded as a deviation.
- 195 tests passing (+1). Reusable `MonsterLibraryService` remains iter 3.

## 0.3.5 — action-pnj iteration 2 (V2 slice)

- **Richer identity (§ 4A)**: the PNJ editor gains a **RÔLE** field (`pnj.role` — « Marchand », « Gardien du seuil »…), carried through the canonical `patchPnj` write so editing one facet never drops another.
- **Portrait** ships as a **deferred dropzone** affordance (disabled, `aria-disabled`) — the actual image **upload is deferred project-wide** (no image scope yet, exactly like node-editor's illustration). The « dialogue affordance » in the iter-2 goal was already the skeleton's DIALOGUE field; the net-new is the role + the portrait affordance. (Recorded as a spec-vs-project-rule deviation.)
- 194 tests passing (+1). Reusable-PNJ catalog deferred to iter 3.

## 0.3.4 — action-decor iteration 2 (V2 slice)

- **« Écouter » / « Fouiller » reveal (§ 4B)**: the two décor interactions (previously stubs) gain a `RevealEditor` — the heard/found text plus an optional **« jet requis »** that gates it behind a skill roll: a **caractéristique** (`SegmentedControl` from the brain `CHARACTERISTICS` registry) + a **difficulté** `Stepper` + the shared brain **`OutcomesEditor`** for the réussite/échec reveal (the only semantic outcomes, KR-091/117). Toggling the gate off drops the roll + outcomes but keeps the base text.
- New `DecorReveal` domain type on `DecorConfig.reveal`; the per-interaction field copy lives in the `DECOR_INTERACTIONS` `Record` (KR-117), extended to carry `revealLabel`/`revealPlaceholder`. The third reuse of the extracted `OutcomesEditor` (after monster + trap) needed zero new shared code.
- All décor writes unified through one canonical `writeDecor(patch)` that re-emits `{ interaction, objects, reveal }` (legacy `object` dropped, KR-090), so editing one facet never drops the others.
- 193 tests passing (+2). Shared `ObjectCatalogService` remains iter 3.

## Code-health — inline-note cleanup (no version bump)

Resolved two flagged inline notes in `tree-canvas`:

- **Top-down tree canvas layout**: the canvas now **auto-lays-out** the book as a classic top-down tree (`resolvePositions` reads the `choice`-edge structure): the **sommaire sits at the top**, each node's direct children form **one evenly-spaced row beneath it** (parent centred over them), recursively, with downward links — so a branching book reads as proper triangles with sub-branches and leaves. **Linkless nodes** (the isolated `mort`, any page not reached from the sommaire by a `choice` edge) **wrap into a grid below the tree** — never a single horizontal row nor a single descending column. This fixes both the prior grid (children beside parents, unreadable sideways links) and the intermediate attempts that collapsed loose-page books into one line. The canvas stays a pure VIEW (KR-020); the layout is deterministic (KR-023). Manual drag + per-book position persistence is a later iteration (a stored position will then override the computed slot).
- **Per-kind snippet to the registry**: the node-card empty-state placeholder moved from an inline `kind === 'sommaire' ? … : …` test in `nodeView.ts` to an `emptySnippet` field on the `NODE_KINDS` registry, so the per-kind copy self-describes (KR-068).
- 188 tests passing.

## 0.3.3 — outline-view iteration 2 (V2 slice)

- **Node inspector (§ 03 B)**: focusing or hovering an outline row previews its structural relations in a pinned card — **« entre depuis »** (every edge leading here + its kind) and a monstre node's combat outcomes (**victoire / fuite** targets), built by a new pure `buildNodeInspector` (resolved by stable id; a deleted source/target surfaces as ⚠, never a crash — KR-021). The previewed node is local UI state (the focused row, falling back to the selection), so the card previews **without** committing selection.
- **Éditer**: selects the previewed node (drives the node-editor panel). Row-click selection (the iter-1 contract) is unchanged.
- **« Centrer dans l'arbre »**: reveals + centres the node on the canvas. Wired at the composition root (`EditorScreen` owns a `{nodeId, seq}` `RevealRequest`): the outline calls an `onRevealInTree` callback, the shell switches to the tree view and passes the request to `TreeCanvas`, which centres via the new `useViewport.centerOn`. outline-view and tree-canvas never import each other; the shell-owned prop survives the view switch (no event-before-mount loss), and a `seq` + consumed-seq ref makes repeat reveals work without re-centring on unrelated re-renders (**KR-081**).
- 187 tests passing (+7). View-mode/expand-state persistence remains iter 3 (needs `UIPreferencesService`).

## 0.3.2 — book-library iteration 2 (V2 slice)

- **Search + sort (list ergonomics)**: the library gains a **search** box (brain `Field`, case-insensitive title filter) and a **sort** toggle (brain `SegmentedControl`: « Récent » = `updatedAt` desc / « A→Z » = title). Both are derived inline over the live `useBooks` list (KR-013) — the cached snapshot array is never mutated (sorts a copy). The toolbar appears only when the library is non-empty.
- **Empty states**: a dashed, inviting « votre bibliothèque est vide » panel when there are zero books (alongside the always-present create affordance, KR-072), and a « aucun livre ne correspond » status line when a search matches nothing — never a blank void.
- **Open-book delete guard (KR-071)**: a composition-root subscription (in `App`) navigates home if the book currently open in the editor is deleted, so the editor never strands on a removed book. The route is read fresh in the handler (no stale-closure dependency); the guard lives at the root, not in book-library, so no feature owns cross-route navigation.
- 176 tests passing (+4). Per-book sync status + offline delete queue remain in iter 3 (need `cloud-sync`).

## 0.3.1 — choice-linking iteration 2 (V2 slice — tier 0.3.x opens)

- **Self-link + duplicate-edge guards at the SSOT (KR-061)**: `BookService.addEdge` now rejects a self-link (`from === to`) and any **duplicate identical edge** (same `from`/`to`/`kind` already present), returning `null` and emitting nothing. Identity is `from+to+kind`, so a second edge to the same target of a **different** kind (e.g. a `relink` then the future automatic `flee`) is legitimate convergence, not a duplicate.
- **Searchable relink popover (§ 06 B)**: « Relier… » gains a brain `Field` search box that filters candidates by title (case-insensitive), autofocused on open for keyboard use; a non-matching query shows « Aucun nœud ne correspond », distinct from the « Aucun autre nœud » no-candidates state. The picker mirrors both SSOT guards — the current node and any **already-relinked** target are excluded — so it never offers a rejected edge (SSOT is the law; the picker is convenience). Filtering is derived inline (KR-013), no `useEffect` mirror.
- 170 tests passing (+3). Hidden-prerequisite (iter 3) and countdown (iter 4) still await `ObjectCatalogService`. **Tier 0.3.x / V2 begins.**

**Follow-up refinements (user-requested, fold into 0.3.1 — no bump):**

- **Confirmation-gated branch deletion (dangerous-action rule + KR-064)**: the « Choix sortants » row ✕ no longer removes the edge immediately — it opens a `DeleteBranchDialog` (brain `Modal`, `confirmTone="error"`, labelled « Annuler »). The dialog states the destination **node is not deleted** (only the link) and, when this is the node's **sole incoming link**, warns it will become unreachable (the KR-064 orphan prompt, computed live). Removal still only deletes the edge; the orphaned node survives.
- **Removed the deferred « Libellé du choix » note** from the node-editor panel: it was a skeleton-era hint pointing authors to the parent's « Choix sortants », rendered read-only on **every** non-structural node. Now that the label is editable there (iter 1), the note was pure clutter — the panel drops the libellé section entirely.
- 172 tests passing (+2).

## Code-health — P4 (registry predicates + book lookups) — no version bump

Cross-cutting cleanup from a review of inline `// FIX:`/`// TODO:` notes (folds into the touched code; see `docs/ROADMAP.md` § Code-health sweep, P4):

- **Domain-invariant predicates**: new `kinds.ts` helpers `isStructural` / `canHaveOutgoing` / `canBeTarget` / `edgeNests` replace `NODE_KINDS[kind].flag` indexing at ~8 call sites (BookService, OutgoingChoices, TargetPicker, NodeEditorPanel, nodeKind) — callers stop importing the registry to ask a domain question (Law of Demeter; registry stays the SSOT, KR-068). Presentational reads (label/mark/tone/…) unchanged.
- **`getNode`/`getEdge`** (`brain/utils/book.ts`) hide the book's internal arrays, removing the repeated `book?.nodes.find(n => n.id === …) ?? null` from BookService + the four action editors + OutgoingChoices.
- **`buildOutline`** nests via `EDGE_KINDS.nests`, not `edge.kind === 'choice'`.
- **Decisions recorded** (KR-068/117 extended): event-name lists in `hooks.ts` are typed curated subsets (not magic strings — kept); per-variant behaviour (gift `apply`, caractéristique `compute/test`) is deferred to PLAY MODE as registry descriptor fields, never if/switch. 167 tests passing (+7); all inline notes resolved/removed.

## 0.2.8 — cloud-sync iteration 1 (V1 slice — tier complete 🏁)

- **Real transport machinery, local-target « cloud »**: per the production-target swap, the LOCAL build wires a new **`LocalStorageTransport`** — a `CloudTransport` backed by a separate `cloudsync:` localStorage namespace (a fake remote) — so the full local-first sync machinery runs with **no server**. The Cloudflare build target swaps in a worker-backed transport (client + worker route + SENSITIVE auth, KR-114) via the same interface later.
- **Debounced + batched pushes**: `set()` writes local synchronously, then rapid writes coalesce into one background push cycle (status syncing → synced/error once per batch; timer-safe, default 300ms).
- **Last-write-wins reconciliation on `book:opened`** (KR-094): `CloudTransport` gained `pull`; on open, the cloud copy is compared by `updatedAt` — a newer cloud copy is **adopted** locally (written underneath, never re-pushed → no echo loop) and `book:updated` is emitted so the open view re-reads; a newer local copy is **pushed up**; an empty cloud is seeded.
- `createBrain` stays transport-optional (a new `syncDebounceMs` option), so every existing test is transparent (offline). 160 tests passing (6 new). The real Cloudflare client/worker/auth + offline queue + conflict handling are iters 1(CF)/2/3. **🏁 The 0.2.x / V1 tier is complete — every feature has its iteration 1.**

## 0.2.7 — action-trap iteration 1 (V1 slice)

- **Skill roll (§ 05)**: the trap gains a **CARACTÉRISTIQUE** select + a **DIFFICULTÉ** stepper (shared brain `Stepper`) on `trap.roll`, beside the existing réussite/échec reveal texts (shared `OutcomesEditor`) and the « échec mène à la Mort » toggle.
- Caractéristiques are now a brain **`CHARACTERISTICS`** registry (Habileté / Endurance / Chance — a closed-set `Record`, KR-117), placed in brain like `ROLL_OUTCOMES` because skill-roll editors reuse it (trap now; décor « jet requis » later). The select derives from it — no hardcoded list. `SkillRoll.failureText` made **optional** so trap (outcomes-based) and décor (failureText-based) share one roll shape.
- `TrapConfig` gained `roll`; a skeleton trap migrates the default roll in on read (KR-116) and canonicalises on write. The automatic échec→Mort edge stays deferred to iter 2 (KR-067). 153 tests passing (1 new). **🏁 All four action editors have their V1 — only `cloud-sync` remains in the 0.2.x tier.**

## 0.2.6 — action-monster iteration 1 (V1 slice)

- **Combat mechanics (§ 4D)**: the monster gains **PV / Attaque / Défense** stats (shared brain `Stepper`) and **outcome targets** — **victoire → poursuivre** and **fuite → relier** via the shared brain `TargetPicker` (structural screens excluded KR-067, deleted target surfaced KR-021/063). **Défaite → Mort** is shown as the **automatic** combat path (KR-067) — surfaced read-only, never an authored edge.
- Two brain extractions at their **second consumer** (KR-109, same rule as `ObjectEditor`/`OutcomesEditor`): the value **`Stepper`** (pnj gift + monster stats) and the **`TargetPicker`** (pnj « mène à » + monster targets) moved to `brain/components`; `action-pnj` refactored to import them (feature-local `TargetPicker` deleted, `GiftSection`'s local stepper removed). `TargetPicker` gained `label`/`emptyLabel` props.
- `MonsterConfig` gained `pv`/`attack`/`defense` + `victoryTarget`/`fleeTarget`; a skeleton monster (name + outcomes) normalises with stat defaults on read (KR-116) and canonicalises on write. réussite/échec reveal texts still derive from `ROLL_OUTCOMES` (KR-091/117). Loot + reusable library deferred to iters 2–3. 152 tests passing (3 new + the pnj refactor).

## 0.2.5 — action-pnj iteration 1 (V1 slice)

- **Gift effect (§ 4A)**: the « Le PNJ donne un objet » gift now carries an **effect** — **+PV / +Attaque / +Défense / objet de scénario** (a closed-set `Record`, KR-117) — with a **− N + value stepper** (clamped 1–99) for the stat bonuses; a plot object hides the stepper. The gift's identity still uses the shared brain `ObjectEditor` (KR-052).
- **« Ensuite, le PNJ mène à »**: a target picker wires the PNJ to a follow-up node (a non-choice screen change). Structural screens are excluded (KR-067) and a deleted target is surfaced « ⚠ cible supprimée » (KR-021/063). Stored on `pnj.target` for now; promotion to a rendered tree edge pairs with the dedicated action-edge path (like trap's deferred échec→Mort edge).
- Domain model gained **`PnjGift`** (object + `effect` + `value`) and **`PnjGiftEffect`**; the skeleton's bare-object gift **migrates** on read (pure `giftOf`) and canonicalises on the next write (KR-116). `PnjEditor` split into `GiftSection` + `TargetPicker` (SRP), each a VIEW over `BookService`; gift ids stable (KR-003). Portrait + reusable-PNJ catalog stay in iters 2–3. 147 tests passing (9 new).

## 0.2.4 — action-decor iteration 1 (V1 slice)

- **« Prendre » full (§ 4B)**: the décor « prendre » action is now a **list of takeable objects** as rows — add / remove / reorder (↑↓), each with a **utile / leurre** badge and an optional **« jet requis »** marker. Each object is edited in a **modal** with real commit/cancel semantics (a local draft; « Annuler » discards, so a cancelled new object never lands), composing the shared brain `ObjectEditor` (KR-052) + a utile/leurre `SegmentedControl` + a « jet requis » `Toggle` revealing caractéristique / difficulté / texte d'échec.
- Domain model gained **`TakeableObject`** (object + `kind` + optional `roll`), **`SkillRoll`** (trait/difficulty/failureText), and **`TakeableKind`** (`'utile' | 'leurre'`, a closed-set `Record` per KR-117, non-semantic tones — good/bad reserved for réussite/échec, KR-091). The walking-skeleton single `decor.object` is **migrated** to `decor.objects` on read (pure `takeablesOf`) and canonicalised on the next write (KR-090/116 spirit), so old persisted books still load.
- `DecorEditor` stays a VIEW over `BookService` (KR-020): all list ops write the canonical `{ interaction, objects }` via `updateNode`; object ids are stable (KR-003). Écouter/Fouiller stay stubs (iter 2); shared `ObjectCatalogService` is iter 3. 138 tests passing (12 new).

## 0.2.3 — outline-view iteration 1 (V1 slice)

- **Expand/collapse** in the « plan du livre »: each node with nested children gets a ▸/▾ disclosure (≥44px, aria-labelled with the node title); collapsing hides the exact subtree while later siblings stay. The rule is a new **pure `computeVisibleRows`** helper (unit-tested, KR-080 spirit) over the flat pre-order rows; collapsed ids are local UI state derived with `useMemo` (no `useEffect` mirror, KR-013).
- **Hover preview**: each row's `title` tooltip previews the screen's authored text (via the shared `textLines`, placeholder for an empty screen); reference rows instead read « Aller au nœud … » (or « Cible supprimée » for a dangling target, KR-021). End-leaf labels already render through `NodeBadge`.
- Deferred (documented): per-row rule badges ⊘/⏱ (the edge rules land with choice-linking iters 3–4 — nothing to badge yet) and « centrer dans l'arbre » (needs canvas viewport centering — pairs with the iter-2 node inspector). 126 tests passing (7 new).

## 0.2.2 — book-library iteration 1 (V1 slice)

- **Richer book cards**: each card now shows écrans · liens · fins counts (the « fins » count derives from `effectiveKind === 'fin'`, consistent with the FIN badge, KR-054/068) plus a « Modifié le {date} » line (feature-local timezone-stable `formatDate`).
- **In-place rename** + **duplicate** + delete, revealed on hover/focus via a CSS-only `.book-card` rule (the canonical hover-reveal pattern — no `isHovered` JS state, keyboard-reachable). Rename edits the title in place (Enter/blur commits, Esc cancels; blank is a no-op).
- Two new SSOT mutations on **`BookService`**: **`renameBook`** (trims, rejects blank, persist → new **`book:updated`** event) and **`duplicateBook`** (deep copy with a fresh book id + fresh node/edge ids, edge endpoints remapped by stable id so the copy references its own nodes, KR-003; « (copie) » title; persist → `book:created`). `book:updated` is wired into `useBooks` (list re-reads on rename) and `useOpenBook` (KR-020/013/071/004).
- 117 tests passing (7 new). Search/sort + open-book-delete guard stay in iteration 2; per-book sync status in iteration 3.

## 0.2.1 — choice-linking iteration 1 (V1 slice — first of the 0.2.x tier 🚀)

- **Editable « libellé du choix » per outgoing row** — the player-facing button text now rides the edge (`Edge.label`) and persists through a new **`BookService.updateEdge`** (`EdgePatch`), the SSOT for every edge mutation (KR-060/020). A **blank label is dropped** at the SSOT so the canvas falls back to the kind's label (an empty `edge.label` never renders as a blank button); the field shows an inviting placeholder when empty.
- New brain **`edge:updated`** event, wired into `useOpenBook`'s mutation list, so the panel row **and** the canvas (which already renders `edge.label ?? canvasLabel`) reflect a label change live — no `useEffect` mirror (KR-013). Each row is now a two-line card (→ destination + kind badge + delete · libellé `Field` with an `ariaLabel` naming its destination).
- The libellé renders on every outgoing row (choice + relink), consistent with the canvas honouring `edge.label` for all kinds. Per-choice **rule badges** (⊘ prereq / ⏱ countdown) stay deferred to iterations 3–4 (need `ObjectCatalogService`). 110 tests passing (4 new). **🚀 Opens the 0.2.x / V1 tier** — `book-creation` / `tree-canvas` / `node-editor` iter-1 were banked depth-first, so `choice-linking` is the first V1 slice.

## 0.1.8 — cloud-sync walking skeleton (MVP slice — tier complete 🏁)

- New **`CloudSyncService`** (brain) — a **local-first Decorator** over `PersistenceService` (Liskov; `BookService` + every feature unchanged), wired once in `createBrain`. Writes hit local **synchronously** (offline-ready, KR-004), then push to a cloud transport in the background: status `idle → syncing → synced` (or `error`, local write preserved). With no transport the store is **`offline`** (local-only) and emits no per-write noise — so the existing suite is fully transparent. New **KR-093**.
- New `sync:status` event + `useSyncStatus` hook; the **`cloud-sync`** feature's `SyncIndicator` (a corner Badge pill, aria-live) surfaces the live state, derived from a `SyncStatus`→label/tone `Record` (KR-117), mounted once by `App` over both routes. Real cloud transport / offline queue / reconciliation deferred to iterations.
- 106 tests passing (7 new). **🏁 The 0.1.x MVP tier is complete — every feature now has a walking skeleton.**

## 0.1.7 — action-trap walking skeleton (MVP slice)

- New **`action-trap`** feature — the fourth and last `action-*`: self-registers a « Piège » editor with the brain **ActionRegistry**, so node-editor now offers **all four** action types (Décor / PNJ / Monstre / Piège) with zero changes. `TrapEditor` is a VIEW over `BookService`: a DESCRIPTION + réussite/échec reveal texts + a « L'échec mène à la Mort » toggle (the « échec sanctionné » variant), persisted on `node.trap`.
- Extracted a shared **`brain/components/OutcomesEditor`** (KR-109) at the **second consumer** of the réussite/échec rows: monster + trap now render outcomes from one component derived from `ROLL_OUTCOMES` (KR-117/091); `MonsterEditor` refactored to use it (rows de-duplicated). New **KR-092**.
- The automatic `échec → Mort` edge is deferred (KR-067) — the skeleton captures the `fatal` intent. Domain model gained `node.trap` (`TrapConfig`); `NodePatch` carries `trap` (text-only guard covers it, KR-055/090, regression-tested). 99 tests passing (2 new + MonsterEditor refactor). **All MVP action editors complete; only `cloud-sync` remains in the 0.1.x tier.**

## 0.1.6 — action-monster walking skeleton (MVP slice)

- New **`action-monster`** feature — third `action-*`: self-registers a « Monstre » editor with the brain **ActionRegistry** (node-editor now offers Décor / PNJ / Monstre with zero changes). `MonsterEditor` is a VIEW over `BookService`: a NAME + a player-facing reveal text per combat outcome, persisted on `node.monster`.
- **réussite / échec** — the only semantic outcomes/colours — modelled as a new brain **`ROLL_OUTCOMES`** registry (`Record<RollOutcome, {label, tone}>`, an instance of **KR-117**), placed in brain so trap/skill-roll editors reuse it (KR-109). The editor **derives** both outcome rows (good/bad `Badge` + field) from it — no hardcoded labels. New **KR-091**.
- The monster-library is **stubbed** via a new `monster:savedToLibrary` event on the brain EventBus (wired now, consumed later). Added `ariaLabel` to the shared `Field` so Badge-captioned fields keep an accessible name. Domain model gained `node.monster` (`MonsterConfig`) + `RollOutcome`; `NodePatch` carries `monster` (text-only guard covers it, KR-055/090, regression-tested). 97 tests passing (3 new). Stats / loot / outcome targets / real library deferred to iterations.

## 0.1.5 — action-pnj walking skeleton (MVP slice)

- New **`action-pnj`** feature — second `action-*`: self-registers a « PNJ » editor with the brain **ActionRegistry** (node-editor offers « Décor » + « PNJ » with zero changes, KR-050/051). `PnjEditor` is a VIEW over `BookService` (KR-020): a NAME + player-facing DIALOGUE, persisted on `node.pnj`.
- The « Le PNJ donne un objet » switch reveals the **shared `brain/components/ObjectEditor`** — the very primitive action-decor introduced — imported from brain with **no cross-feature import** (validates KR-052/109). The gift carries a stable id (KR-003); toggling off drops it.
- Domain model gained `node.pnj` (`PnjConfig`); `NodePatch` carries `pnj` so the text-only guard keeps it off structural screens (KR-055/090, now regression-tested for `pnj` too). 94 tests passing (3 new). Gift effects / « mène à » / reusable-PNJ catalog deferred to iterations.

## 0.1.4 — action-decor walking skeleton (MVP slice)

- New **`action-decor`** feature — the first real `action-*` feature: it **self-registers** a « Décor » editor with the brain **ActionRegistry** (Open/Closed seam, KR-050/051), so node-editor offers and mounts it with zero changes. `DecorEditor` is a VIEW over `BookService` (KR-020): a Prendre / Écouter / Fouiller `SegmentedControl` persisted on the node.
- New shared **`brain/components/ObjectEditor`** (KR-052/109) — internal NAME + player-facing DESCRIPTION — owned/introduced by action-decor's « prendre » and reusable by future PNJ/monster editors without a cross-feature import. The takeable object gets a stable id minted via `createId` (KR-003, now exported from brain).
- Domain model gained `node.decor` (`DecorConfig`) + `GameObject`; `NodePatch` carries `decor` so the text-only guard keeps it off structural screens (KR-055). New **KR-090**. 91 tests passing (4 new). Écouter/Fouiller + multi-object + skill rolls deferred to iterations 1–2; shared ObjectCatalogService to iteration 3.

## 0.1.3 — outline-view walking skeleton (MVP slice)

- New **`outline-view`** feature: the open book as an indented « plan » (`OutlineView`), a DFS from the sommaire that nests `choice` edges and renders `relink`/`flee`/convergence/cycle back-edges as `↪` reference rows (cycle-safe, **KR-080**); unreachable nodes (isolated `mort`) listed flat; dangling targets flagged `⚠ cible supprimée`.
- Hoisted the shared editor chrome to **`brain/components/EditorTopBar`** (KR-109) with a canvas ↔ outline **view-mode switch**; a new **`src/EditorScreen`** shell owns the (non-synced, KR-022) view-mode and swaps `TreeCanvas` ↔ `OutlineView` while keeping the node-editor panel mounted. `tree-canvas` is now the canvas body only; `CanvasTopBar` removed.
- Selection is shared via the brain `SelectionService` (KR-024): picking an outline row reflects on the canvas and the panel. `buildOutline` is pure + tested. 87 tests passing (9 new).

## Unreleased — unknown-kind boundary guard (KR-116)

- Hardened the persistence trust boundary: `PersistenceService.get` casts JSON unchecked, so a corrupted store / schema drift could carry a kind outside the registry and crash a `NODE_KINDS[kind]` lookup. New `isNodeKind` / `isEdgeKind` guards (derived from the registry keys) + a single `BookService.loadBook` validation: a book with an unknown node/edge kind is surfaced (`console.warn`) and treated as **unreadable** (`getBook`/`openBook` → null, omitted from `listBooks`, mutations refused) rather than throwing — but stays **deletable** so it can be cleaned up. New **KR-116**. 78 tests passing (5 new).
- Removed the three `book!` non-null assertions in `TreeCanvas` (captured a narrowed `activeBookId` after the guard, matching the `NodeEditorPanel` pattern) — no `!` assertions remain in source. Recorded the defensive-boundary + view-tolerance rules (KR-021/116) in the `livre-jeu-design` skill.

## Unreleased — magic numbers, plural & kind single-source (P3 of the code-health sweep)

- **`NodeKind` / `EdgeKind` are now derived from the kind registry** via a `defineKinds` factory + `keyof typeof` (KR-068): the registry is the single source for the kind _set_ as well as its behaviour — no parallel union to keep in sync. (Answers "a builder to add a kind without duplicating the union".)
- Killed the remaining geometry/dimension magic numbers as **named constants**: canvas bounds → `resolveBounds` + `CANVAS_MIN_W/H` + `CANVAS_MARGIN` (geometry); `DOT_GRID_SIZE`, `HINT_INSET`, `HINT_GAP` (TreeCanvas); `LAYOUT_ORIGIN` (BookService autoSlot); `CARD_MIN_HEIGHT`, `PAGE_MAX_WIDTH`, `GRID_MIN_COL` (book-library); `MODAL_MAX_WIDTH`, `CLOSE_BUTTON_SIZE` (Modal); `PICKER_MAX_HEIGHT` (choice-linking).
- New shared **`plural()`** helper (FR: 0 & 1 singular) replaces the inline `n > 1 ? …` ternaries (CanvasTopBar, BookCard).
- Extracted the large inline `style={{…}}` objects in `LibraryScreen` and `BookCard` to named `React.CSSProperties` consts (readability, matching the `panelShell`/`monoControl` pattern). 71 tests passing (3 new plural tests). No bump.

## Unreleased — hit-target token (P2 of the code-health sweep)

- New **`--hit-target: 44px`** token + mirrored **`HIT_TARGET_MIN`** brain constant for the WCAG ≥44px interactive minimum. Replaced the `44` literal repeated across 9 files (NodeEditorPanel, CanvasTopBar, ZoomControls, NewBookButton, OutgoingChoices ×5, Modal ×2, Toggle, SegmentedControl, BookCard) — CSS strings use the token, the one numeric `size` prop uses the constant. No behaviour change; 68 tests passing.

## Unreleased — kind registry refactor (P1 of the code-health sweep)

- **New `brain/kinds.ts`** — one data-driven registry (`NODE_KINDS` / `EDGE_KINDS`) holding each kind's label, default title, badge mark and domain flags (`structural` / `canHaveOutgoing` / `canBeTarget`). New **KR-068**.
- Removed the scattered `if (kind === …)` tests and the silent `Partial<Record<NodeKind>>` badge map: `NodeBadge`, `nodeView`/`nodeTitle`, `effectiveKind`, `NodeEditorPanel`, `BookService` (text-only / outgoing / target guards), `EdgeLayer`, `OutgoingChoices` now read the registry. Three duplicate per-kind tables collapsed into one.
- Pure refactor, behaviour preserved exactly; 68 tests passing (5 new registry tests). No version bump. Remaining magic-number / style TODO markers are tracked in `docs/ROADMAP.md` (code-health sweep P2/P3), not shipped as inline comments.

## 0.1.2 — book-library walking skeleton (MVP slice)

- The home screen is now `book-library`'s **`LibraryScreen`**: a grid of book cards listing every persisted book (live VIEW via the new brain **`useBooks()`** hook), newest first, each with a title + screen count.
- Click a card → `openBook` + navigate to its editor. Each card has a delete ✕ gated behind a **confirmation dialog** (dangerous action, error-toned confirm); confirming calls the new **`BookService.deleteBook`** (persist-remove → `book:deleted`, KR-004) and the card drops from the live list.
- `book-creation` refactored: the create affordance is now **`CreateBookEntry`** (button + dialog); `App` composes it into `LibraryScreen` as a prop so the two features never import each other (KR-072). `HomeScreen` removed (chrome moved to the library).
- Shared `Modal` gains `confirmTone='error'` for dangerous-action confirms. New KRs KR-070/071/072. 61 tests passing.
- **Refinement (choice-linking domain):** structural screens are never authored choice targets — the `sommaire` root and `mort` leaf are excluded from the « Relier… » candidates and rejected by `BookService.addEdge` (`mort` is reached only automatically in combat). New **KR-067**. 63 tests passing.

## 0.1.1 — choice-linking walking skeleton (MVP slice)

- `choice-linking` mounts in node-editor's choices slot via a new brain **`SlotRegistry`** (OCP seam, KR-066) — neither feature imports the other.
- Outgoing-choice rows (live VIEW over `BookService`); « + branche » creates a child + `choice` edge and selects it; « Relier… » adds a `relink` edge to an existing node (cycles/convergence); remove deletes only the edge, never the target node.
- `BookService` gains `addChoiceBranch` / `addEdge` / `removeEdge` (SSOT, KR-060); `edge:created` payload now carries `from`/`to`/typed `EdgeKind`. Mort's no-outgoing rule enforced at the SSOT (KR-055/060).
- Hidden-prerequisite + countdown (iters 3–4) deferred — they need `ObjectCatalogService` (lands with action-decor). 52 tests passing.

## 0.1.0 — re-baseline + roadmap (no app code change)

- Adopted the breadth-first slice roadmap (`docs/ROADMAP.md`); rewrote `WORKFLOW.md` build-steps + versioning accordingly.
- Added the `tech-lead` review subagent and the per-feature stop-and-review gate.

## 0.3.1 — node-editor: structural screens (Sommaire / Mort)

- Sommaire (root) and Mort (death leaf) are structural: the panel hides « libellé du choix », « action requise » and the Fin victoire/échec toggles for both, and hides « choix sortants » for Mort. Only their text is editable.
- Enforced at the SSOT too: `BookService.updateNode` accepts a text-only patch for `sommaire`/`mort` (generalises the locked-Mort rule, KR-002 → KR-055), so the invariant holds even if a caller sends end flags/action.
- Docs updated (CLAUDE.md domain rules, node-editor spec, code-knowledge KR-055). 43 tests passing.

## 0.3.0 — node-editor (walking skeleton + iteration 1)

- `node-editor` side panel (§ 02): mounted beside the canvas by the app shell. Sticky header (NodeBadge + ref + title + ✕), editable Description `Field`, Fin victoire/échec `Toggle`s, the « Action requise » `SegmentedControl`, and deferred slots (libellé, illustration, inventory, choix sortants).
- **Selection promoted to a brain `SelectionService`** (single source of truth, KR-024): tree-canvas and node-editor both read via `useSelectedNode` and write via `selection.select`; the service is the sole emitter of `node:selected` and clears on `book:opened`. The panel's ✕ deselects without desyncing the canvas highlight.
- **`ActionRegistry`** (brain): the Open/Closed seam (KR-051) — action-\* features self-register editors; node-editor mounts them with zero action-specific code. SegmentedControl emits `action:changed`.
- `BookService.updateNode` commits Description + end flags + action type, emitting `node:updated`; a locked node accepts only text edits (KR-002). End flags drive the FIN badge everywhere via `effectiveKind`/`endLabel` (KR-054).
- Shared view logic (`useOpenBook`, `nodeTitle`) and new DS primitives (`Toggle`, `SegmentedControl`) promoted to brain (KR-109/110). Libellé du choix decided to live on the incoming edge (deferred to choice-linking). 41 tests passing.

## 0.2.0 — tree-canvas (walking skeleton + iterations 1–2)

- `tree-canvas` is now the editor surface, rebuilding wireframe § 02 from design-system tokens/primitives: top bar (back · title · node-count badge · disabled « Aperçu du jeu » · « + Nœud »), dot-grid canvas, node cards (`NodeBadge` + ref + title + 1-line snippet), SVG connectors (solid `choice`, dashed `relink`/`flee`, arrowheads, mono label chips), bottom-right zoom controls.
- Live data binding: the canvas is a pure VIEW over `BookService` (KR-020), kept current via a `useSyncExternalStore` subscription to `node:*` / `edge:*` / `book:opened` (no `useEffect` mirror, KR-013).
- `BookService.addNode(bookId, kind)` adds a free-floating node with a deterministic auto-layout slot (KR-023) and emits `node:created` (payload now carries `kind`).
- Single-select owned by the canvas and broadcast as `node:selected{nodeId|null}` (KR-024); clears on empty-canvas click. Orphaned edges are dropped, never drawn to nowhere (KR-021).
- Local pan/zoom shipped (not synced, KR-022); persisting view-state + dragged positions via `UIPreferencesService` deferred to iteration 3. Retired `EditorStub`. 29 tests passing.
- BUG-001 (minor): drag listeners now cancel on unmount mid-gesture.

## 0.1.0 — book-creation walking skeleton

- Initialized the Vite + React 18 + TypeScript app (ESLint, Prettier, Jest + RTL).
- Stood up the design system: tokens (`styles/`) + cross-feature primitives in `brain/components` (NodeBadge, Modal, Field, Card, Badge, IconButton).
- Built the `brain/` core: domain types, EventBus, Router, PersistenceService + persistenceKeys, BookService (single source of truth + atomic seed factory), DI via BrainContext.
- `book-creation` walking skeleton: home → « Nouveau livre » dialog (focus, inline validation, Enter-to-submit, Esc/scrim dismiss) → `BookService.createBook` seeds exactly a Sommaire + an isolated, locked Mort node → emits `book:created` then `book:opened` → navigates to the editor. 16 tests passing.
