# Roadmap — bascule « arbre de choix » → « dossier d'aventure joué par une IA »

> Ce document est le **plan exécutable** et un **index**, jamais un journal : il dit ce qui reste à faire et qui le porte. Le raisonnement d'une décision livrée vit dans le `specification.json` de sa feature et dans `.claude/raffinage/<feature>-it<N>.revue.md` ; l'histoire des recadrages vit dans `CHANGELOG.md` et dans git.
>
> **État au 2026-10-08 (`0.7.31`)** : **Temps 1 ET Temps 2 sont livrés** — l'éditeur produit un dossier d'aventure (n° 1–8, 48 itérations), le moteur le joue (n° 9–16, 29 itérations). Il ne reste que la **dette à déclencheur** du § 2 bis, le **repointage de `tree-canvas`** (sur go) et le protocole **`/playtest`**. Le plan de cible `docs/PLAN-BASCULE-IA.dc.html` est intégralement traduit : **archive**, ne plus le charger.
>
> **Compacté le 2026-09-19** (§ 1 ter sorti) puis le **2026-10-08** (les paragraphes des features n° 9–16 livrées sont partis vers leurs revues ; rien de contraignant n'a été perdu).

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

Clé d'API jamais côté client ; une route par rôle IA ; SSE pour la narration reste un point d'extension nommé, non livré. Chaque route neuve suit la checklist **Worker Route Parity** de `docs/WORKFLOW.md` (KR-233 fait foi, `worker/index.test.ts` la tient). Le hors-ligne n'est pas traité : sans worker joignable, le mode jeu s'arrête sur un message, il ne dégrade pas vers un narrateur local.

### D3 — Versionnement

`0.6.x` = **Temps 1 et sa dette** (features n° 1–8 et § 2 bis), `0.7.x` = **Temps 2** (n° 9–16). **PATCH +1 par itération livrée**, dans l'ordre de ce document. Les corrections de bogue ne bumpent pas seules. Plancher de session : PATCH +1 minimum.

### Décision A (2026-08-04) — chaque racine reçoit sa forme dans la feature qui l'édite

Corollaire non négociable (veto tech-lead), **toujours en vigueur** : `brain/dossier/types.ts`, `destinations.ts` et `validate.ts` ne sont **jamais** dans un lot de type `feature`. Toute tranche qui touche le schéma ouvre un lot `contrat`, **seul et en premier**.

---

## 0 bis — L'existant qu'on garde

`src/player/` reste le **runtime joueur extractible** (`docs/EXIGENCE-APERCU-DU-JEU.md`) : combat, création de personnage, boutique d'XP — conservés et branchés sur l'état de session. Les consommateurs 100 % arbre (`sessionEngine`, `usePlaySession`, les 5 écrans de nœud, `playExport`, `buildAdventureDocument`) ont été **éteints en n° 9 it4** ; `actionEngine.ts` survit, 0 partie arbre mesurée.

**KR-181 est AMENDÉ par KR-240** : la n° 9 a éteint les **consommateurs** du modèle d'arbre, **jamais le modèle**.

| Sort | Modules |
|---|---|
| **Survivent en sommeil** — extinction avec le repointage de `tree-canvas`, après le Temps 2 | `brain/types.ts` (moitié arbre) · `kinds.ts` · `tree.ts` · `BookService` · les 4 hooks de `brain/hooks.ts` · `automaticEdges.ts` · `NodeBadge` · les 11 événements `book:*`/`node:*`/`edge:*` · `Router {name:'editor'}` · `src/EditorScreen.tsx` (unique point de montage de `tree-canvas`) |
| **Repointé, pas démoli** | `src/features/play-mode/` — le shell de partie, la console et le journal du Temps 2, qui ne descendent **jamais** dans `src/player/` (copié en entier à l'extraction) |

La donnée source survivant, **la ligne d'avis « vos anciens livres restent stockés » reste vraie** : son retrait part avec la démolition physique de `BookService`, au repointage.

---

## 1 — Temps 1 · l'éditeur produit un dossier — **terminé**

Huit features, **48 itérations livrées**, `0.6.50` (plus l'it5 de `dossier-canon`, livrée au § 2 bis, B1).

| # | Feature | « À la fin, l'auteur peut… » | Statut |
|---|---|---|---|
| 1 | `dossier-format` | …importer un dossier d'aventure validé contre un schéma versionné | **5/5 ✅** |
| 2 | `bascule-editeur` | …naviguer dans son aventure par une liste de sections | **3/3 ✅** |
| 3 | `dossier-canon` | …rédiger la vérité immuable de son histoire | **5/5 ✅** (it5 = B1) |
| 4 | `dossier-fiches` | …écrire une fiche de personnage exploitable par l'IA | **8/8 ✅** |
| 5 | `dossier-objets` | …tenir le registre des objets de son aventure | **2/2 ✅** |
| 6 | `dossier-registres` | …tenir les quêtes, les indices, les événements de son aventure | **5/5 ✅** |
| 7 | `dossier-controles` | …voir pourquoi son aventure n'est pas encore jouable | **10/10 ✅** — 9 règles ; le décompte cible de 11 est caduc depuis it8 |
| 8 | `dossier-copilote` | …faire proposer un texte par l'IA, champ par champ | **6/6 ✅** — 7 assistants ; pose `/ia/:role`, l'enveloppe de sortie et le rejeu-une-fois, dont le Temps 2 hérite |

**Colonne `Statut`** — itérations **livrées / prévues**, *projetées* depuis `plan.iterations[].status` du `specification.json` : elle se recopie, elle ne se décide pas ici (source unique, étape 4 des Build Steps).

---

## 2 bis — La dette du Temps 1

Un inventaire de dettes n'est pas autant d'itérations dues. Le **chemin bloquant** (4 tranches) est **payé** — B1 `dossier-canon` it5 / `lieux[].acces` (`0.6.52`), B2 `outillage-2` / mutation `combat.ts` 100 % (`0.6.53`), B3 `budget-de-contexte` (`0.7.2`), B4 `eol-lf` (`0.7.4`) ; dossiers : `.claude/raffinage/dossier-canon-it5.revue.md`, `…/outillage-it2.revue.md`, `…/budget-it1.revue.md`, `…/eol-lf.revue.md`. Le reste est une **dette à déclencheur** que rien ne planifie.

### La dette à déclencheur — rien n'est planifié, tout est armé

Chaque ligne part **toute seule** quand son déclencheur se présente. Le lot qui le fait partir l'absorbe ; il ne la reporte pas une seconde fois.

| Dette | Portée mesurée | Déclencheur armé |
|---|---|---|
| **`BUG-055` à `BUG-058` sont AMBIGUS** — quatre ids pour **huit** défauts distincts, récidive de BUG-062 dans les deux sens. L'instrument existe (`codeKnowledge.test.ts`, égalité EXACTE) ; c'est la **renumérotation** qui reste impayée | `bug_history.features-terminees.json`, `bug_history.dossier-canon.json` | le premier lot qui rouvre une entrée citant l'un des quatre. BUG-123 |
| **Scission de `controles.ts`** (1 348 l.) — refactor à **vert trompeur**, deux gardes bornées par `indexOf` | `brain/dossier/controles.ts` | le premier lot qui rouvre ce fichier |
| **BUG-090** (major) — remédiation circulaire de `condition-sans-expr` ; **aucune surface n'écrit `reussi_si_expr`**. Se règle en cessant de promettre une condition structurée | idem | idem — part avec la scission |
| **Rider `validate.ts`** — (a) 4 sites d'avertissement sans `entityId` (lignes jumelles indésignables) ; (b) `designerSavoir` met un identifiant dans la prose ; (c) **`nom` non textuel** — `nom: 42` traverse `validateDossier` (sonde 2026-09-19) | `brain/dossier/validate.ts` | le premier lot qui rouvre ce fichier |
| **Chaîne vide au blur** — quitter un champ de prose vide écrit `''` là où il y avait un **absent**, et émet `dossier:updated`. Prouvé sur `dossier-registres` ; **non mesuré** sur les 3 autres features de même forme | les chemins d'écriture de 4 features | le premier lot qui rouvre un `Panneau*`/`Fiche*` concerné — **mesurer d'abord, corriger la feature entière ensuite** |
| **Constantes de refus** — `EYEBROW_REFUS`/`TEXTE_ABSENT` déclarées **10 fois dans 4 features** (KR-109/110) | 10 sites + `brain/` | le premier lot qui rouvre l'un des 9 `Fiche*` fautifs |
| **`depart.inventaire_initial`** — absent de `Charpente.Depart` | `types.ts` + `PanneauDepart.tsx` | un besoin réel. **Gratuit à ajouter** : tout champ de `schema: 1` est optionnel à vie |
| **Retrait dans les registres** — les 6 registres de la n° 6 sont en **ajout seul** ; `PanneauJalonsFins` (435 l.) dépasse le signal de scission | 11 fichiers, 3 012 l. | un besoin exprimé — **une tranche par registre**, jamais un lot global |
| **`Indice.portee` + règle « Intrigue en second plan »** — le type existe, l'écran et la règle non | `FicheIndice` + `controles.ts` | un besoin exprimé — **après** la scission de `controles.ts` |
| **Levée de KR-224** — l'hypothèse de monde ouvert reste câblée dans `atteignabilite.ts` alors que `lieux[].acces` existe depuis B1 | `atteignabilite.ts` (743 l.) | **armé** (B1 livrée) — le premier lot qui rouvre ce fichier |
| **Renommer / dupliquer un dossier** — `DossierService.rename`/`duplicate` n'existent pas ; **deux capacités, deux tranches** | `book-library` | un besoin exprimé |
| **Saut au champ fautif** depuis le panneau Contrôles — motif « Cross-feature UI action registration » (`docs/WORKFLOW.md`), mais **10 panneaux adoptants dans 4 features** : au moins trois tranches | registre `brain/` + 10 `Panneau*` | un besoin exprimé |
| **BUG-035** — `var(--surface-raised)` n'existe dans aucun `tokens/*.css`, et rien ne détecte un token qui ne résout vers rien | `ImageUpload.tsx` + une règle ESLint | le premier lot qui touche `ImageUpload.tsx` |
| **Tenue des specs** — `book-creation` (2 logs / 3 itér.) et `tree-canvas` (3 / 6) ont un `iterations_log` incomplet | 2 fichiers JSON, zéro code | le premier lot qui rouvre l'une des deux |
| **Fusion de `gameSystem.test.ts`** avec les quatre fichiers-modules. ⚠ **`gameSystem.test.ts:86` est le SEUL tueur du mutant `margin >= 3 → > 3` de `xp.ts:48`** : la fusion reprend cette borne **avant** de geler le fichier, sinon le score retombe sous 90 — et le cliquet ne redescend pas | `src/brain/gameSystem.test.ts` | le prochain lot qui rouvrira `challenge.ts`/`xp.ts` |
| **Égalité d'AT × compteur de Garde aiguisée** (D2-bis, `docs/REGLES-PLAY.md`) — rien ne l'implémente ni ne la teste | `combatEngine.ts` | le prochain lot qui rouvrira la boucle de round de `combatEngine.ts` |
| **Test instable `panneauPersonnages.test.tsx:800`** — rouge ~1 run sur 5, cause non établie | `dossier-fiches/tests/panneauPersonnages.test.tsx` | le prochain lot qui rouvre `dossier-fiches` |
| **Le mot « manqué » en double emploi** — `capacityEffects.ts:104` vs la qualité **Manqué** d'un assaut à AT égales | `capacityEffects.ts` + affichage de `combatEngine.ts` | le lot qui rouvrira cet affichage |
| **R3 manifestation — bloc CLIMAT narrateur** (reporté n° 14 it4, PM O5) | `contexte/narrateur.ts`, `horloge.ts` | un besoin exprimé |
| **Éditeur `climat_id` + `effets_regles`** (reporté n° 14 it4, PM O3) | `FicheEvenement`, `FicheClimat` | un besoin exprimé |
| **Reportés du cadrage n° 14** (veto PM) — transfert d'indices entre PNJ co-localisés · armement des contre-mesures · modificateurs numériques PE/jets (KR-208 : `REGLES-DU-JEU.md` → table dorée → code) | moteur/R4, `contre_mesures`, `DELTAS` | un besoin exprimé |
| **`useTourDeJeu.ts` > 400 l.** (562, KR-112). Coupe : `lancerLeDe` | `useTourDeJeu.ts` | le prochain lot qui le rouvre |

### Le repointage de `tree-canvas` — **après le Temps 2, sur go explicite**

Décision du 2026-09-19. **Rien n'en dépend.** Et il coûte le double — **1 131 lignes** non-test à repointer (Dagre, culling de viewport, drag de sous-arbre) **plus une pile de test navigateur qui n'existe pas** (aucun dossier e2e, Playwright non installé). La **décision n° 5 tient** : l'arbre est conservé — `src/features/tree-canvas/` reste sur disque, intact, en sommeil. Le jour où on le rouvre : choisir la pile de test navigateur, puis le graphe des lieux et accès, puis les personnages, puis les relations, puis le chaînage des indices — **cinq tranches, jamais deux**. L'extinction physique du modèle d'arbre (§ 0 bis) part avec ce chantier.

---

## 3 — Temps 2 · le moteur joue le dossier — **terminé**

`0.7.x`, 29 itérations. Le détail de chaque feature vit dans sa spec (l'index) et ses revues (le dossier) : `.claude/raffinage/<feature>-cadrage*` et `…-it<N>.revue.md`.

| # | Feature | « À la fin, le joueur peut… » | Statut |
|---|---|---|---|
| 9 | `moteur-dossier` | …jouer une session pilotée par un dossier, sans IA | **4/4 ✅** — évaluateur bivalent qui LÈVE (KR-238), `jouable` en précondition (KR-239), extinction des consommateurs d'arbre (KR-240) |
| 10 | `moteur-interprete` | …écrire ce qu'il veut faire en langage libre | **4/4 ✅** — R1 traduit / R3 narre, mémoire (fenêtre 5-14, résumé /10), budget en cascade à 4 paliers (KR-275) |
| 11 | `moteur-arbitre` | …voir le code lancer le dé que l'IA a demandé | **3/3 ✅** — héros + `alea(graine,domaine,indice)`, R2 ne voit jamais la fiche, marge→XP ; mutation 100 % |
| 12 | `moteur-acteurs` | …parler à un PNJ qui ne révèle que ce qu'il sait | **4/4 ✅** — R4, 4 portes de révélation fail-closed (KR-280), échelle de confiance (KR-279), carnet dérivé (KR-286) |
| 13 | `moteur-combat` | …lire un combat raconté que l'IA n'arbitre pas | **3/3 ✅** — `combatEngine` intact, projection structurée (KR-293/294), R5 commentateur 400 car. sans chiffre (KR-296) |
| 14 | `moteur-horloge` | …découvrir que le monde a avancé sans lui | **4/4 ✅** — `tickHorloge` pur, PENDANT CE TEMPS, `etapeBloqueeAuPas`, climat actif (KR-298/301) |
| 15 | `moteur-fins` | …reprendre sa partie là où il l'a laissée | **4/4 ✅** — `finAtteinte` (KR-302/303), reprise `validerSession` (KR-305), relance à graine égale (KR-304) |
| 16 | `dossier-repetition` | *(auteur)* …faire jouer son aventure par un joueur synthétique | **3/3 ✅** — `repeter` pure, 5 motifs d'arrêt, PAS_MAX=20 (KR-309→316) |

---

## 4 — Ce qui est CLOS et ne se rouvre pas

Relevé au balayage du 2026-09-19. Ces points ont traversé plusieurs cadrages comme « trous » ; ils sont tranchés **sans travail**, et les rouvrir coûterait une seconde source de vérité.

| Point | Décision |
|---|---|
| **Références croisées de `Lieu`** vers personnages / objets / indices / événements | **Aucun champ, jamais.** Le lien personnage↔lieu **existe déjà** (`presence[].lieu_id`) ; les trois autres s'expriment en **déclencheur**, par le prédicat `lieu_courant_est` (un objet entre en jeu par un `Delta`, un indice par une `Revelation`, un événement par son `declencheur_expr`). Un tableau stocké en serait l'inverse, que rien ne re-synchronise — **cinquième occurrence** de l'anti-patron déjà rejeté pour `tier` (KR-192), `Quete.lie_au_canon` (KR-206), `scene`/`obstacle`/`monstre`, et `Indice.portee` comme classement. Seul `acces` survit : la topologie n'est exprimable par aucun prédicat (→ B1, livrée). |
| **`rattachement.quete_id`** sur un personnage de second plan | **Aucun champ.** `Quete.donneur_id` porte déjà le lien personnage↔quête ; l'inverse se calcule au rendu (KR-013). Si un besoin d'une autre nature que « donneur » émerge, il s'ouvre avec son consommateur nommé. |
| **Possession d'un objet par un personnage**, jet requis pour l'utiliser | **Hors du dossier.** Un inventaire est un état de SESSION (décision n° 7) ; son unique contrepartie Temps 1 est `depart.inventaire_initial` (§ 2 bis, dette à déclencheur). Un objet n'a pas de lieu : il entre en jeu par un `Delta`, jamais par une position initiale. |
| **Migration `schema: 1` → `schema: 2`** | **Aucun chemin, et c'est définitif pour `schema: 1`** (KR-160/191) : une migration n'est pas testable avant qu'un schéma 2 existe, et le seul critère recevable — le rejet de toute valeur autre que 1, avec un code distinct — est livré. Conséquence assumée : **tout champ ajouté à `schema: 1` est optionnel à vie**. Le jour où une rupture est nécessaire, elle crée `schema: 2` et son convertisseur, tous deux propriété de la feature qui rompt. |
| **`savoirs[].revele_si` comme septième famille de conditions** | Hors D1, définitivement : un `jet` émet une demande, il n'évalue pas. Type à part (`Revelation`, portes fermées). |
| **Éditer le texte « après » avant de l'accepter** (copilote) | Différé par l'UX à quatre tours de comité successifs ; le `Field` « APRÈS » reste en lecture seule, `onChange` explicite et commenté. À rouvrir sur un besoin exprimé, pas avant. |

---

## 5 — Hors périmètre

Mode multi-joueur · internationalisation · thème sombre · accessibilité (décision projet ; l'opérabilité clavier reste exigée comme ergonomie de rédaction) · undo / historique d'édition · le routage vers la section du remède dans le panneau Contrôles.

---

## 6 — Comment on exécute

**Le § 3 est clos.** Tout travail neuf est l'un de ces quatre : une **dette à déclencheur** quand son déclencheur se présente (elle entre directement en `/raffiner`, sans `/cadrer`, et journalise dans `CHANGELOG.md` + `bug_history.*.json`) ; le **repointage de `tree-canvas`** (sur go, cinq tranches) ; un **`/playtest`** (protocole, rien ne se code) ; ou une **feature nouvelle** sur go explicite, par le cycle complet :

```
/cadrer <feature> "<intention en une phrase>"   → specification.json + découpage en itérations
    puis, pour chaque itération n :
/raffiner <feature> n                           → plan signé, découpé en lots → tu valides
/essaim   <feature> n                           → exécution + intégration + qa + dossier de revue
```

Une tranche à la fois, jamais deux en parallèle. **Ne pas cadrer plusieurs features d'avance** : le format bouge au contact du code.

**Composition du comité** : les 4 rôles socles partout, **plus `narratif-ia`** dès qu'une tranche touche le dossier d'aventure, le moteur, les prompts ou le mode jeu.

**Définition de fini** : celle de `templates/plan-iteration.md`. Toute itération touchant `challenge`, `combat`, `xp` ou `characteristics` passe `npm run test:mutation` au-dessus du `break` en vigueur.

**Au franchissement d'un plafond de contexte** (`docs/WORKFLOW.md`), la compaction se fait **dans le lot qui l'a franchi**. Pour ce document, la moitié qui part est l'archive — motifs d'une décision livrée, corrections de cadrage, historique des recadrages — jamais les colonnes `Statut` ni le § 4.

> **Ce fichier n'est pas dans le périmètre Prettier du dépôt** (`npm run format` ne vise que `{src,worker}/**/*.{ts,tsx,css}`). Ne pas lancer `prettier --write` dessus : l'alignement des tables lui coûterait ~8 kio de budget de contexte pour zéro lisibilité.
