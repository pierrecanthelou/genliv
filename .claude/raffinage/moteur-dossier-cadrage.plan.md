# Cadrage — feature n°9 `moteur-dossier`

Statut : **validé** (2026-09-20). Écrit dans `src/features/moteur-dossier/specification.json` et répercuté dans `docs/ROADMAP-BASCULE-IA.md` (§ 0 bis — la liste de démolition était fausse ; § 3 paragraphe « 9 · moteur-dossier » ; § 3 tableau, colonne `Statut`). Prochaine étape : `/raffiner moteur-dossier 1`.

Comité : **5 rôles** (PM, Tech Lead, UX, QA, **Narratif & IA**) — `docs/ROADMAP-BASCULE-IA.md` § 6 convoque le cinquième rôle sur tout le § 3. Première feature du **Temps 2** (`0.7.x`) ; le § 2 bis est clos (B1 `0.6.52`, B2 `0.6.53`).

Notes brutes : `.claude/raffinage/moteur-dossier-cadrage/tour{1,2}-{pm-produit,tech-lead,ux-designer,qa,narratif-ia}.md`.

## Intention

> Le joueur joue une session entièrement pilotée par le dossier d'aventure, **sans qu'une seule ligne soit générée par un modèle**.

## Ce que l'orchestrateur a MESURÉ, et qui a changé le cadrage

Six affirmations de rôle ont été rejouées contre le dépôt avant d'entrer au plan — la skill interdit de croire une phrase sur la couleur d'un test ou sur l'état d'un fichier.

| Affirmation | Vérifiée comment | Conséquence |
|---|---|---|
| `tree-canvas` lit le modèle d'arbre | 5 fichiers non-test sur 6 importent `BookNode`, `Edge`, `NODE_KINDS`, `EDGE_KINDS`, `nodeTitle`, `textLines`, `effectiveKind`, `endLabel`, `NodeBadge`, `useBookLayoutSpacing` ; `TreeCanvas.tsx` y ajoute `useRoute`, `useSelectedNode`, `useOpenBook`, `useBookNodePositions`, `deriveAutomaticEdges`, `deriveMonsterEdges` | **KR-181 est inapplicable tel qu'écrit** — veto tech-lead fondé |
| `brain/hooks.ts` s'abonne aux événements d'arbre | `BOOK_MUTATION_EVENTS` + `BOOK_LIST_EVENTS` = 8 des 11 | les événements survivent |
| `expr.test.ts:420` épingle une liste close de lecteurs d'`ExprNode` | `expect([...lecteurs].sort()).toEqual([ATTEIGNABILITE, SITE_DE_LA_GRAMMAIRE, TOUR_ZERO].sort())`, balayage borné à `brain/dossier/` | l'évaluateur ne peut pas vivre ailleurs que dans `brain/dossier/` |
| Le contre-exemple de `tourzero` existe au dépôt | `dossier-minimal.json` : `depart.lieu_id = lieu.val-cendre` → `jalon.premiere-nuit` sur `lieu_visite(val-cendre)` → `effet: reveler_indice(sceau-brise)` → consommateur `indice_connu(sceau-brise)` | H6 devient fausse **par son unique canal de faux positif** |
| **Rien ne rougit** si `tourzero.ts` n'est pas amendé | `tourzero.test.ts:106` **recopie la table dans le test** (il la compare à un double d'elle-même) ; `:260` ne tire que sur un 8ᵉ prédicat ; `tsc` ne voit rien | la dette est **invisible** : elle entre au lot `contrat`, pas en dette à déclencheur |
| `OutcomeBlock` n'existe pas | `brain/components/index.ts` exporte 18 primitives, il n'en fait pas partie | à construire, premier consommateur réel |
| `persist.ts` duplique une clé de persistance | `persist.ts:4-5`, sous un commentaire « *Must stay in sync with … (KR-134)* » | le port injecté n'est pas une préférence, c'est la réparation d'une duplication existante |
| Les `Controle.message` sont-ils lisibles dans un `title` ? | phrases complètes (« Ce texte porte encore le marqueur ⟨…⟩ : le moteur le lira au joueur mot pour mot, marqueur compris. ») | **réserve UX levée** |

## Arbitrage (tour 3, orchestrateur)

Aucun veto ne tient après le tour 2 → **pas de bloc `ESCALADE`**. Trois rôles ont retiré une position avec motif : le PM son découpage, la QA sa trivalence, le Tech Lead sa propre ligne sur `play-mode`.

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| 1 | Découpage en itérations | **RETENU** — N=4, ordre tech-lead | Le PM retire le sien au tour 2 ; convergence explicite des deux rôles concernés |
| 2 | « La n°9 démolit le modèle d'arbre » (KR-181) | **REJETÉ — veto tech-lead, mesuré** | `tree-canvas` est **conservé** (décision n°5) et lit le modèle. KR-181 **amendé** : la n°9 éteint les CONSOMMATEURS, jamais le MODÈLE |
| 3 | `features/play-mode/**` démolissable | **REJETÉ** — le tech-lead retire sa propre ligne | Contredisait `CLAUDE.md` (play-mode = survivant, « suit le runtime, n°9 ») ; le répertoire tient **un** fichier ; et la console doit avoir un domicile hors de `src/player/` |
| 4 | Évaluateur du moteur trivalent (QA critère 3 / KR-237) | **REJETÉ** — la QA retire, faute de contre-exemple | Les 7 prédicats répondent à 6 appartenances + 1 égalité : un état bien formé les décide. Une 3ᵉ valeur y serait un état malformé avalé en valeur de vérité |
| 5 | Le critère 3 disparaît-il ? | **RETENU dédoublé** — 3a (`tourzero.ts`, it1, non-régression) / 3b (moteur, it3, l'aiguillage par défaut **LÈVE**) | Le critère était juste et **mal adressé**. `Trivalent` (`tourzero.ts:89`) est privé au module avec son motif écrit ; l'exporter fabriquerait l'évaluateur unique rejeté en R7 |
| 6 | `jouable` : ergonomie ou correction ? | **RETENU — précondition**, et **DURCI par l'orchestrateur** : re-vérifiée **au montage du shell**, pas seulement au CTA | La variante de `Route` `partie` crée un chemin d'accès direct ; une porte posée au seul CTA serait contournable par l'URL. Ferme la question que la QA avait laissée ouverte |
| 7 | Domicile de `sessionDestinations` | **RETENU — composite** : domicile tech-lead (`brain/dossier/`), forme narratif (exhaustive **par compilation** sur les clés racines) + balayage de fixture pour les feuilles | Module pur, donc il part avec l'extraction, et voisin de `session.ts` qui porte son sujet. `Record<keyof EtatSession, …>` est strictement plus fort que `destinations.ts`, dont la docstring dit elle-même que ses clés sont des chaînes |
| 8 | Fusionner dans `destinations.ts` | **REJETÉ** | Fichier `contrat` du schéma du DOSSIER, et `couverture.test.ts` balaie une fixture de DOSSIER : une clé de session y serait une **ligne morte** que l'assertion « aucune ligne morte » ferait rougir. Deux tables, deux gardes, deux fixtures |
| 9 | `tourzero.ts` dans le lot contrat (narratif C6) | **RETENU** — le tech-lead l'avait omis et le reprend | Chaîne vérifiée au dépôt, et **rien ne rougit** sans l'amendement (voir le tableau de mesures) |
| 10 | Décision (ii) — le départ compte comme visité | **RETENU : OUI** | Forme à trois bras déjà écrite pour `lieu_courant_est`. Exercée par it2 |
| 11 | Décision (i) — `declencheur_expr` résolus avant la 1ʳᵉ action | **RETENU : OUI**, correctif **une seule passe, aucun point fixe** | Sens d'erreur : sur-prudence → faux négatif seul. Dossier sans déclencheur vrai au tour zéro → table inchangée. `jalon_atteint` / `evenement_consomme` restent `indecidable` |
| 12 | `faits.ts` en it1 ou it3 | **RETENU : it3** — le tech-lead corrige son tour 1 | Abstraction sans lecteur dans son itération |
| 13 | Un ou deux lots `contrat` | **RETENU : deux** (it1, it3), chacun seul et premier **dans son itération** | La règle de la skill est par itération, pas par feature |
| 14 | Champ de session ajouté après it1 | **RETENU : optionnel à vie** | `schema: 1` n'a aucun chemin de migration (KR-160/191) et la session est **persistée dès it1** : une session d'it2 deviendrait illisible en it3 |
| 15 | `monde.pnj.<id>.sait` | **REJETÉ — ni champ, ni clé réservée** | Aucun prédicat ne le lit ; aucun delta ne peut l'écrire (`reveler_indice` est d'arité 1, sans opérande `pnj`). Copie d'un champ de document en lecture seule → **6ᵉ occurrence de KR-013**. Le besoin de la n°14 s'écrira en **delta** (`savoirs_acquis[]`), pas en miroir |
| 16 | `quetes[].etapes` (le roadmap l'assigne à la n°9) | **REJETÉ du périmètre** | Aucun delta ni prédicat n'atteint l'état de quête ; `quete_achevee` est écarté nommément dans `predicates.ts`. Coûterait un 3ᵉ lot `contrat` → **correction du roadmap § 3** |
| 17 | `memoire` | **RETENU : clé racine typée `null`** ; forme interne **REJETÉE** | La clé racine est le point d'extension nommé (décision n°3) ; la forme interne appartient à la n°10, propriétaire de la politique de mémoire à trois niveaux |
| 18 | `attente` | **RETENU : variante par variante** | L'union complète poserait trois états illégaux représentables |
| 19 | `journal[].deltas` | **RETENU** — `{ delta, cibles, origine, effet }` avec le scénario séparateur **« delta demandé deux fois »** | Au nominal, demandé et appliqué **coïncident** : sans cet état, le critère épingle une coïncidence (BUG-113) |
| 20 | Rejouer en relisant `journal[].deltas` | **REJETÉ** | Le journal est un **constat**, jamais une **entrée** : un rejeu qui relit son propre résultat ne peut pas révéler un bug d'application |
| 21 | `origine` en prose libre | **REJETÉ** | Décision n°6. `'jalon.<id>' \| 'evenement.<id>' \| 'commande.<id>'` |
| 22 | Projection des jalons par `Jalon[]` filtré ou `Pick<Jalon,…>` | **REJETÉ** — type **nominal** `{ jalon_id, enonce }[]` | Les deux se ré-élargissent sans geste visible, et `destinations.ts` ne prouve pas le confinement. Garde **par valeur** + mutant `jalons.filter(atteint)` vu rouge + lecteur unique |
| 23 | Une famille d'événements `partie:*` | **REJETÉ** — remplacée par une variante de `Route` | Zéro abonné externe ; une route en a déjà un. Et c'est ce qui monte le shell sans import `bascule-editeur` → `play-mode` |
| 24 | `src/player/` écrit `localStorage` en direct | **REJETÉ** — port injecté `{ lire, écrire, effacer }` | Preuve mesurée (`persist.ts:4-5`). Deux appelants nommés, donc pas une abstraction à appelant unique |
| 25 | Domicile de `OutcomeBlock` / `JournalRow` | **RETENU : `features/play-mode/components/`** | KR-109 : un seul consommateur. Déménagement futur à **deux branches** : 2ᵉ consommateur dans le runtime → `src/player/components/` (jamais `brain/components/`, dont les modules CSS ne sont pas dans la liste des purs du § 6) ; 2ᵉ consommateur dans l'éditeur → `brain/components/` |
| 26 | Les deux composants en it1 ? | **RETENU : `OutcomeBlock` it1, `JournalRow` it2** | En it1 le journal n'a aucune ligne à rendre |
| 27 | Les proses verbatim sont-elles des entrées de journal ? | **RETENU : NON** — l'ouverture se rend dans `OutcomeBlock` **au-dessus** d'un journal qui démarre vide | Garde vivant l'état vide rédigé par l'UX, et répond à C4 **plus fort** que par le `role` : la n°10 ne peut pas résumer au tour 40 un texte qui n'a jamais été dans le journal. `journal[].role` reste posé au contrat pour la n°10 |
| 28 | Fiction générée à la volée pour habiller l'écran transitoire | **REJETÉ** (UX + narratif, contresigné) | 3ᵉ source de prose, hors du contrat « deux proses seulement, émises verbatim » |
| 29 | `ListRow` pour les lignes de journal | **REJETÉ** | Son contrat exige `onSelect` ; un `onSelect` no-op le romprait pour un premier appelant qui ne l'utilise pas |
| 30 | CTA désactivé actionnable au clic | **REJETÉ** | Hors périmètre explicite, roadmap § 5 |
| 31 | Texte du CTA désactivé | **RETENU** — `message` du **premier** `Controle` bloquant + « (et {n} de plus) », en lecture dérivée pure | Réserve UX **levée par mesure** : les `Controle.message` sont des phrases complètes |
| 32 | Vocabulaire des commandes | **RETENU** — registre **clos** `commande.<verbe>`, propriété du moteur ; it2 n'en pose **qu'un** : `aller` | **Correction de l'orchestrateur** : le texte de refus garde la forme rédigée par l'UX, mais sa liste est **dérivée du registre**, jamais écrite en dur — écrite en dur elle mentirait dès it2, où un seul verbe existe |
| 33 | Console qui interprète du texte libre | **REJETÉ** | Même discipline que « aucun parseur » pour les conditions de l'auteur |
| 34 | Console dans `src/player/` | **REJETÉ** (UX, contresigné tech-lead + narratif) | `src/player/` est copié **en entier** à l'extraction : un outil de développeur voyagerait jusqu'au build mobile. Et c'est la surface par laquelle un canal d'entrée en texte libre s'installerait sans revue |
| 35 | Créer un dossier `brain/session/` | **REJETÉ** | `expr.test.ts:420` borne sa liste close à `brain/dossier/` : mieux vaut payer un nom de dossier qui s'étire qu'un instrument perdu |
| 36 | Promouvoir `OutcomeBlock` dans `brain/components/` en n°9 | **REJETÉ** | KR-109, un seul consommateur |
| 37 | La n°9 absorbe la scission de `controles.ts` | **REJETÉ** | Déclencheur **non armé** : lire un type exporté n'ouvre pas le fichier |
| 38 | Borne de persistance du journal | **RETENU en it2, NON-CRITÈRE** | Pas observable par un instrument existant : c'est une **mesure**, consignée dans la revue d'itération, jamais en `acceptance_criteria` pass/fail. Constante écrite **depuis le relevé** |
| 39 | « Reproductible bug pour bug » comme critère | **REJETÉ** — reformulé en **replay intra-process** | Aucun instrument du dépôt ne rejoue un process |
| 40 | Hausse de couverture comme preuve de démolition | **REJETÉ** | Une couverture qui monte parce qu'on a supprimé du code non couvert n'est pas un progrès |
| 41 | Critères de spec navigateur / Playwright | **REJETÉ** | Instrument absent du dépôt |
| 42 | Critères d'accessibilité sur la console | **REJETÉ** | Hors cadre par décision projet ; l'opérabilité clavier reste exigée comme ergonomie |
| 43 | it4 sans phrase « à la fin, l'auteur peut… » | **RETENU AVEC DÉROGATION NOMMÉE** | La démolition n'a aucune valeur auteur directe. PM et tech-lead y convergent indépendamment ; précédent B2 `outillage-2`. La dérogation est **écrite**, pas contrebandée |

## Le découpage

| # | Phrase de démonstration (sans « et ») |
|---|---|
| **1** | *L'auteur lit le texte d'ouverture de son dossier dans une partie lancée depuis l'éditeur.* |
| **2** | *L'auteur déplace son héros d'un lieu à un autre par les accès de son dossier.* |
| **3** | *L'auteur voit un jalon s'atteindre parce que sa condition est devenue vraie.* |
| **4** | *Le modèle d'arbre n'a plus aucun consommateur de jeu.* (dérogation n°43) |

## Corrections répercutées dans `docs/ROADMAP-BASCULE-IA.md`

1. **§ 0 bis** — la ligne « Encore debout, avec leur date de démolition … tous en n°9 » était **fausse**. Seuls `playExport.ts` et `buildAdventureDocument` y partent ; `brain/types.ts` (moitié arbre), `kinds.ts`, `BookService` et les 11 événements **survivent** tant que `tree-canvas` vit. `src/features/play-mode/` sort de la liste : **repointé**, pas démoli.
2. **§ 3, paragraphe « 9 · moteur-dossier »** — `quetes[].etapes` et `memoire.faits_etablis` retirés ; « toute la démolition du modèle d'arbre » remplacé par l'extinction des **consommateurs** ; amendement de KR-181 écrit.
3. **§ 3, tableau** — colonne `Statut` de la ligne 9 : `0/4`.
