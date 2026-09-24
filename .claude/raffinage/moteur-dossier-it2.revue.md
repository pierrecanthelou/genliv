# Revue d'itération — `moteur-dossier` · itération 2

> Livrée le 2026-09-24 · 2 lots séquentiels (L1 `contrat`, L2) · plan : `.claude/raffinage/moteur-dossier-it2.plan.md`

## En une ligne

**L'auteur déplace son héros d'un lieu à un autre en tapant `ALLER <lieu>` dans la console de l'aperçu, et voit le pas s'inscrire au journal** — ce qu'il ne pouvait pas faire hier, où l'écran de partie ne savait que lire le texte d'ouverture.

## Les six critères

| # | Statut | Preuve |
|---|---|---|
| **1** — déplacement le long d'un accès orienté, cible **non-première** | **VÉRIFIÉ** | `commandes.test.ts` « déplacement le long d'un accès orienté, cible en SECONDE position » : `lieu_courant === 'lieu.tour-effondree'`, `lieux_visites` inclut la cible, `horloge.tour` +1, journal à deux entrées de même `tour`, `'origine' in journal[0] === false`, invariant `every(e => e.origine === undefined \|\| e.role === 'moteur')`. Séparateur réel : la fixture `dossier-reference.json` porte 2 accès et le test vise le **second** |
| **2** — refus sur arête asymétrique, **aucun pas consommé** | **VÉRIFIÉ**, avec un écart de forme acté (§ Écarts, E-1) | `commandes.test.ts` « refus sur une arête asymétrique » : refus `acces_absent`, `horloge.tour` / `journal` / `lieu_courant` / `lieux_visites` inchangés |
| **3** — auto-référence légale, sans doublon | **VÉRIFIÉ** | `commandes.test.ts` : commande **acceptée**, `lieux_visites` reste `['lieu.val-cendre']`, `horloge.tour` avance quand même — la DEMANDE consomme le pas, pas l'effet |
| **4** — `JournalRow` rend les deux rôles, `[aller]` sur la seule ligne moteur | **VÉRIFIÉ** *(après correction — voir BUG-120)* | `deplacement.test.tsx` : état vide disparu, badges `↪ JOUEUR` / `↻ MOTEUR`, `[aller]` présent sur la ligne moteur et **absent** sur la ligne joueur (l'entrée sans `origine` est l'état séparateur), et aucune ligne n'affiche le mot « tour » — **assertion réécrite, trois mutants vus rouges sur elle** |
| **5** — refus de commande inconnue, liste **dérivée** du registre | **VÉRIFIÉ** | `commandes.test.ts` (unité) + `consoleCommandes.test.tsx` (composant). Mutant du 2ᵉ verbe fictif écrit, vu ROUGE, révoqué dans un `finally` **plus** une assertion post-`finally` que le registre est bien restauré |
| **6** — la session n'entre pas dans la file de synchronisation | **VÉRIFIÉ, contre-épreuve authentique** | `MagasinDeSession.test.ts` : `createBrain({ transport })` avec un `push` qui ne résout jamais — transport **réellement branché** —, `pendingCount()` à **0** après une écriture de session puis à **1** après une écriture de dossier, **dans le même test**. Sans quoi l'assertion à 0 serait vraie par construction (`queuePush` sort tôt sans transport) |

## Diff par lot

**L1 `session-commandes` (`contrat`)** — 15 fichiers, exactement la liste du plan.
(N) `brain/dossier/commandes.ts` · `commandes.test.ts` · `brain/MagasinDeSession.ts` · `MagasinDeSession.test.ts` · `brain/components/Field.test.tsx`
(R) `brain/dossier/session.ts` · `sessionDestinations.ts` · `__fixtures__/session-saturee.ts` · `sessionCouverture.test.ts` · `brain/components/Field.tsx` · `brain/BrainContext.tsx` · `brain/index.ts` · `brain/persistenceKeys.ts` · `docs/EXIGENCE-APERCU-DU-JEU.md` · `docs/REGLES-PLAY.md`
`deplacement.ts` **non créé** — `commandes.ts` tient en 250 lignes, le nom reste libre pour it3.

**L2 `console-deplacement`** — 8 fichiers, territoire `src/features/play-mode/**` respecté.
(R) `EcranPartie.tsx` (**388 → 243 lignes**, KR-112 soldé) · `hooks/useSessionPersistee.ts`
(N) `CadrePartie.tsx` · `EcranRefus.tsx` · `ConsoleCommandes.tsx` · `JournalRow.tsx` · `tests/consoleCommandes.test.tsx` · `tests/deplacement.test.tsx`
`ouvertureVerbatim.test.tsx` et `porteJouable.test.tsx` **non modifiés et verts** — la scission n'a rien eu à compenser.

**Contrôle de propriété** : **15 (L1) + 8 (L2) = 23 fichiers**, correspondance **exacte** avec l'union des deux listes, dans les deux sens — puis **+2 en correction de PR** (`brain/dossier/amorce.ts`, `amorce.test.ts`), hors des deux lots et assumés : la scission de L2 avait rendu FAUSSE la prose de `brain/` qui nommait `EcranPartie.tsx` lecteur profond de `MARQUEUR_A_ECRIRE`. **25 au total.**

## Le défaut trouvé après les deux lots — BUG-120, majeur

La QA en mode B a posé le mutant que le plan prescrivait lui-même, et **le témoin du critère 4 était VERT sous les deux implémentations fautives qu'il était écrit pour attraper**.

Deux causes indépendantes sur la même ligne, `expect(journal.textContent).not.toMatch(/\btour\b/)` :
1. **Portée** — le `textContent` d'une *section* concatène les nœuds de texte **sans séparateur**, donc le mot se colle au précédent (`JOURNALtour 1…`, `…bassetour 1…`) et `\b` ne trouve **jamais** de frontière avant lui. L'ancre échouait par construction, jamais par absence du mot.
2. **Casse** — sans le drapeau `i`, `Tour 1` passait aussi.

Le test *échouait* bien sous les mutants — mais à la **ligne suivante** (`getByText('#1')`), qui teste le format du préfixe et non la clause. Le critère était donc protégé **par accident** : une régression laissant `#{n}` intact tout en écrivant le mot ailleurs (libellé, `aria-label`, `title`) serait passée inaperçue.

**Correctif** : l'assertion passe de la section à **chaque ligne**, de `textContent` à **`outerHTML`** (qui voit aussi les attributs), et gagne le drapeau **`i`**. Trois clauses, trois trous distincts.
**Mesuré, pas déduit** — trois mutants écrits, vus ROUGES **sur la ligne corrigée** (`:123`), puis révoqués : `Tour {n}`, `tour {n}`, et **un troisième que personne n'avait demandé** — le mot en `aria-label` seul, avec `#{n}` intact, qui isole précisément ce que la portée `outerHTML` ajoute.

## Ce qui a été refusé, et pourquoi — un diff ne le dit pas

- **La reprise d'une session** (`lire`, `effacer`, `validerSession`, le chemin « Reprendre / Relancer ») : elle traîne un validateur, un écran et la comparaison d'estampille — **c'est une seconde phrase de démo**. Le PM a refusé la coupe d'it2 en deux qu'elle aurait exigée : aucune capacité auteur nouvelle tant que la reprise n'est pas elle-même démontrable.
- **Un port à trois méthodes** : `lire`/`effacer` sans appelant, c'est KR-109. L'exemption « ça ne se rétro-ajoute pas » (qui a payé `graine_alea` et `dossier_maj`) vaut pour une **donnée persistée**, jamais pour une **interface** — une méthode ajoutée plus tard ne laisse aucune session illisible derrière elle.
- **Un `rejouer()` de production** : un seul appelant, et aucun scénario séparateur avant les dés. Le pliage vit dans le test.
- **Renommer `horloge.tour`** malgré la réserve de vocabulaire : 9 sites, dont un dans le territoire exclusif de L2 (la disjonction des lots serait tombée), et `schema: 1` sans chemin de migration ferait **deux représentations du même pas**. Le champ garde son nom en **dette de nommage datée** ; l'écran, lui, n'écrit jamais le mot.
- **Une console qui valide** par appartenance à l'ensemble fini : deux décideurs, donc deux règles du jeu, qui divergeront. La console soumet la **chaîne brute**.
- **Journaliser un refus** (convergence indépendante des trois rôles) : le journal est un constat **du monde**, une faute de frappe n'est pas un événement, et la borne mesurée porterait sur du bruit.
- **Filtrer ou dédoublonner les accès** : une référence pendante doit être **exposée et nommée** par un refus — masquée, elle ne se corrige jamais. Le dédoublonnage appartient à l'injection (n° 10).
- **`origine` sur les deux entrées** d'un déplacement : le verbe est déjà dans le `texte` de l'entrée joueur — dérivable stocké.
- **`journal[].texte` basculé en `'ia'`** : la prévision d'it1 est **révoquée en commentaire**. Il ne porte que des *handles*, et une table indexée par chemin ne peut pas discriminer par valeur de `role` — la n° 10 donnera à sa prose **son propre chemin**.
- **Rendre `lieux[].description` / `ambiance` / `dangers`** à l'arrivée : trois champs d'audience `'ia'`, **injectés, jamais récités**. Garde-fou nommé au plan précisément parce que l'écran est nu ; la QA a vérifié qu'aucun rendu ne les touche.
- **`Field.list` / `<datalist>`** : jsdom rend l'élément mais **ne témoigne d'aucune autocomplétion** — aucun test ne sépare un champ qui filtre d'un qui ne filtre pas. Une prop sans appelant aurait été KR-109. La découverte passe par la ligne ambiante « Accès disponibles ».

## Ce qui a été reporté, et où

| Quoi | Où | Pourquoi |
|---|---|---|
| Le critère de **replay déterministe** | **n° 11** (premier tirage de dé) | Reporté d'it1 faute d'actions ; reporté d'it2 faute d'**entropie**. Rien à faire diverger tant que personne ne lance un dé — le témoin aurait épinglé une coïncidence |
| `lire` / `effacer` / `validerSession` | l'itération de la **reprise**, propriétaire à nommer | Seconde phrase de démo |
| L'**infobulle du CTA désactivé** | toujours en attente de son relevé navigateur | `EditorTopBar.tsx` n'a été ouvert par aucun lot |
| Le **dédoublonnage des accès** | **n° 10**, à l'injection | Comme `mene_a[]` |
| Les deux cellules de `tourzero.ts` | **it3**, lot `contrat`, ensemble | Inchangé |

## Ce que personne n'a vérifié — à ne jamais compter vert

- **KR-242, replay déterministe** : aucun critère. Aucune source d'entropie n'existe en it2.
- **KR-243** : `commandes.ts`, la transition et le port sont **hors du score de mutation**. `npm run test:mutation` n'a **pas** été lancé — confirmé : aucun des 4 fichiers mutés n'est au diff. `jest` en couverture de lignes est leur unique instrument.
- **Le couplage console ↔ règle d'horloge** *(dette neuve, nommée)* : le vidage du champ repose sur `key={session.horloge.tour}`, donc entièrement sur « toute commande acceptée consomme un pas » (`§ J1`). Avec un seul verbe, **rien ne peut séparer** un moteur qui respecte la règle d'un moteur qui cesserait de la respecter. Le jour où une commande acceptée n'avançant pas l'horloge entre au registre, la console cesserait de se vider **en silence**. Aucun instrument ne couvre ça aujourd'hui.
- **L'immutabilité runtime de `S0`** : portée par le typage (`readonly` de bout en bout) **plus** le mutant M2 — mais **pas par l'assertion qu'on croyait**. Sous M2, `expect(second).toEqual(premier)` reste **vert** ; c'est l'assertion sur `S0` qui sauve la mise. Le filet tient, pas au fil qu'on croyait.
- **Le clic bout en bout** éditeur → console → journal : couvert **en deux moitiés**, jamais en une. Aucun instrument E2E au dépôt.
- **La collision de clé de `JournalRow`** (BUG-121) : corrigée, mais **non séparable avant it3** — avec un seul verbe, aucun état du monde ne produit deux entrées `moteur` d'un même pas. Écrit comme non vérifié plutôt que compté vert.
- **L'annonce d'un refus de commande à un lecteur d'écran** : le message apparaît sans `role="status"` / `aria-live`. **Connu, non corrigé, et c'est une décision** : l'accessibilité n'est pas un critère par décision projet, et le gabarit signé par l'UX ne le prévoyait pas — l'ajouter serait étendre le contrat de design après signature. Renvoyé à la passe visuelle, avec le reskin.
- **`src/brain/MagasinDeSession.ts` échappe au garde `moteurSansIA.test.ts` par sa LOCALISATION** : c'est le premier fichier de production de la n° 9 à vivre hors des trois racines balayées (`player`, `features/play-mode`, `brain/dossier`). Aucun risque aujourd'hui — un port de stockage n'a aucune raison d'appeler le réseau — mais c'est un mode d'évasion que la docstring du test n'anticipe pas, à garder en tête le jour où un fichier de la n° 9 naîtra ailleurs dans `brain/`.

## L'instrument qui tient à une ligne — à lire avant tout « nettoyage »

L1 a rapporté, et la QA a **remesuré en écrivant la variante**, que le témoin de pliage **ne sépare que parce que le premier état est sérialisé avant que le second ne s'exécute**. Sur deux objets **vivants**, sous le mutant M2, `toEqual` est **VERT** : les deux pliages partagent le même tableau muté, donc ils sont profondément égaux.

Conséquence : **retirer les deux `JSON.stringify` pour « comparer les objets directement » — ce qui a l'air plus propre — éteindrait le témoin sans qu'une seule ligne ne rougisse.** Le motif est écrit en commentaire dans le test. C'est la troisième fois de la feature qu'un instrument se révèle vert pour une raison qui n'est pas celle qu'on lui prêtait.

## Le motif du port de stockage a été SUBSTITUÉ — noir sur blanc

Le port `MagasinDeSession` **ne se justifie pas** par l'extractibilité : sa prémisse n'est **pas armée**, `src/player/` n'a reçu aucun fichier en it2 non plus. Il se justifie par la **frontière magasin brut / décorateur de synchronisation**, qu'aucune feature ne peut franchir autrement puisque `local` n'est pas exposé sur `Brain` — et il ne le sera pas.

Trois mesures qui fondent la décision « la session est un **état d'appareil** » : `CloudSyncService.get` délègue à `local.get` (donc un critère de *relecture* aurait été vert dans les deux magasins — coïncidence), `remove()` ne propage rien, `set()` pousse toute clé non-livre. C'est la **quatrième** famille d'état par appareil sur le magasin brut, après les préférences d'interface, la librairie de monstres et les réglages du worker.

**Un lot qui hériterait du motif périmé livrerait trois méthodes vides.** D'où cette section.

## La borne de persistance du journal — MESURÉE, jamais un seuil

Mesure sur la forme réelle des entrées, `Buffer.byteLength(JSON.stringify(session), 'utf8')`, script jetable non committé :

| entrées | pas | octets | kio |
|---:|---:|---:|---:|
| 0 (socle) | 0 | 364 | 0,36 |
| 10 | 5 | 1 288 | 1,26 |
| 50 | 25 | 4 991 | 4,87 |
| 100 | 50 | 9 626 | 9,40 |
| 500 | 250 | 47 029 | 45,93 |

**Coût marginal ~93,5 o par entrée, soit ~187 o par pas** (régression 100 → 500). Extrapolation à ~200 pas : **36,9 kio**. Face aux quotas usuels de `localStorage` (~5 Mio) : **~5 600 pas** avant 1 Mio, **~28 000 pas** avant 5 Mio. Le poids est **linéaire, sans terme quadratique** : aucune borne n'est nécessaire à cette itération.

Cette mesure **ne dit rien** de la borne d'**injection**, qui appartient à la n° 10 : l'unité n'est pas la même, et la n° 10 n'injectera pas `texte`.

## Écarts assumés

| # | Écart | Statut |
|---|---|---|
| **E-1** | `executerCommande` ne porte **aucun champ `session`** sur le bras `{ ok: false }`. Le § 5 du plan figeait cette signature **tout en** illustrant la propriété par `expect(resultat.session).toBe(session)` — **contradiction interne au plan**, non satisfiable sous ce type. L'ouvrier a implémenté la signature et prouvé la propriété sur l'**argument** (instantané JSON avant/après + champ par champ) | **Légitime**, acté ici plutôt que silencieux. Avertissement en docstring pour qu'on ne « répare » pas le type |
| **E-2** | `commandes.ts` ajoute une dépendance d'extraction **en valeur** (`defineRegistre` ← `identifiers.ts` ← `brain/utils/id.ts`), non prévue au § 6 d'`EXIGENCE-APERCU-DU-JEU.md` | **Acté** : le § 6 est amendé — deux fichiers de plus à copier, « leurs dépendances de type » devient « leurs dépendances » |
| **E-3** | `autoFocus` sur le `Field` de la console, absent du gabarit JSX du plan. Mécanisme retenu : remontage par `key={session.horloge.tour}` plutôt qu'un effet miroir (contrainte « zéro site neuf ») | **Légitime**, mais **extension tacite** : la console reçoit aussi le focus au tout premier montage. La QA a vérifié qu'aucun autre élément ne revendique le focus initial — rien n'est volé. À contester si le comité le souhaite |
| **E-4** | Fixture `lieu.foret-basse` au lieu de `lieu.tour-effondree` dans `deplacement.test.tsx` | **Légitime** — le critère 1 exige `tour-effondree` et `commandes.test.ts` l'utilise bien. L'ironie relevée par la QA : cette précaution contre le mot « tour » masquait exactement le trou de BUG-120 |
| **E-5** | Deux comptes de prose devenus faux (« les onze lignes de feuille » → douze), et une docstring d'it1 annonçant « trois points que it2 tranche » alors qu'it2 **reporte** la reprise | **Corrigés** dans le même lot |

**Blocages** : aucun, dans les deux lots.

## Budget de contexte — deux plafonds franchis, payés ici

- **`bug_history.json`** : 9 678 o → **11 720 o** avec BUG-120, au-dessus du plafond de 10 kio. **SCINDÉ** sur l'axe de son `_about` — quatre entrées dont la leçon est **déjà promue** dans un instrument en lecture obligatoire (BUG-101, 106, 108 : un test permanent ; BUG-107 : `docs/WORKFLOW.md § Worker Route Parity`, toujours chargé) partent dans `bug_history.dossier-copilote.json`. Restent `BUG-074` (le `_about` le nomme : correctif non fait, leçon non promue) et `BUG-120` (leçon non promue). **4 945 o**, plafond re-dérivé vers le bas : **5 kio**.
- **`bug_history.json`, deuxième franchissement — dans la même tranche.** Les deux défauts de la revue de PR (BUG-121, BUG-122) le portent à **8 075 o pour le plafond de 5 120 qui venait d'être posé**. **Non résolu, et délibérément** : scinder un fichier de **quatre** entrées dont deux datent du jour serait improviser une seconde fois sur un axe qu'on vient d'appliquer. C'est la friction annoncée au `RETOUR-COMITÉ` 4, déclenchée exactement où il l'annonçait — **remontée à l'utilisateur**.
- **`features_history.json` : 11 931 / 10 240 — FRANCHI et NON RÉSOLU.** Les deux conditions de son `_about` sont **conjointes** ; seule la seconde est remplie. La seule candidate au volume utile (`dossier-copilote`, 4 379 o) a des leçons de **process**, promues dans la skill `raffinage-iteration` et non en KR de code — l'y déplacer serait une scission sur un axe que le fichier **récuse** (précédent BUG-086, corrigé en revue de PR). Le débloquer exige une compaction de `code-knowledge.json` (~113 o de marge), donc un **arbitrage de doctrine**. **Remonté à l'utilisateur, non traité par cette itération.**
- **Le couple toujours-chargé** : 45 880 o pour 46 080 — tient, marge 200 o.
- **`docs/ROADMAP-BASCULE-IA.md`** : 30 546 / 30 720 — tient. Mon premier ajout le franchissait de 158 o : il a été raccourci, le roadmap étant un **index** et non un journal.
- **`src/features/moteur-dossier/specification.json`** : 65 677 → **64 591** / 66 560 après compaction — les quinze arbitrages d'it2 réduits à leur phrase + renvoi à cette revue, le code étant livré et le raisonnement porté ici.

## Porte qualité

| | |
|---|---|
| `npm run format` | vert, aucun fichier à reformater au 2ᵉ passage |
| `npx tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur** · 1 warning **préexistant hors diff** (`src/player/components/CharacterCreationScreen.tsx:35`) |
| `npx jest` | **118 suites / 1830 tests, tout vert** (it1 : 113 / 1805) |
| `npm run test:mutation` | **non lancé** — aucun des 4 fichiers mutés au diff (KR-243) |
| Table dorée | **non déclenchée** — aucun registre de données touché, `rules.golden.test.ts` et `bestiary.ts` hors diff |
| État dérivé (KR-013/113) | 7 sites, **tous préexistants**, zéro site neuf |

## `RETOUR-COMITÉ` — ce que ce découpage a appris

1. **Deux faits que le tour 1 n'avait pas vus sont sortis d'une mesure de l'orchestrateur entre les deux tours**, et les deux ont changé la forme de l'itération : `Field.tsx` vit dans `brain/`, donc le contrat de design de l'UX n'était réalisable par **aucun lot** ; et `REGLES-PLAY.md § J1` réserve le mot « tour » **tout en** désignant cette feature propriétaire du pas d'horloge. **Le geste — rejouer au dépôt les affirmations porteuses avant d'ouvrir le tour 2 — a payé pour la deuxième itération consécutive. À inscrire comme étape, pas comme réflexe.**
2. **Deux rôles ont écrit en parallèle des positions incompatibles, et le comité ne pouvait pas le voir** : l'UX a retiré le `<datalist>` pendant que le tech-lead ajoutait la prop `list` ; l'UX a exclu `origine` de `JournalRow` pendant que le tech-lead cédait sur son admission. Les deux ont dû être arbitrés par l'orchestrateur **après** le tour 2. **Un tour 2 simultané produit des angles morts symétriques** — la contre-lecture ne les attrape pas, puisque chacun lit les notes du tour **1**.
3. **Le plan s'est contredit lui-même sur une signature** (E-1) : il figeait un type et illustrait une propriété que ce type rend non satisfiable. C'est la **seconde fois** qu'une signature dictée par le comité est prise en défaut par l'ouvrier (it1 : `dossier === undefined` contre `Dossier | null`). *Mesure d'abord* doit s'appliquer aux **exemples d'assertion** du plan, pas seulement à ses signatures.
4. **Le cliquet de budget produit un plafond plus petit qu'une entrée.** Après scission, `bug_history.json` retombe à 4 945 o et la formule mécanique re-dérive à **5 kio — 175 o de marge**, alors qu'une entrée de défaut pèse 1,4 à 2 kio. **Le prochain défaut journalisé refranchira le plafond immédiatement** et forcera une scission d'un fichier à deux entrées. La règle a été appliquée à la lettre ; la friction est réelle et appartient à qui possède la doctrine de budget, pas à l'itération suivante.
5. **Le mode B a de nouveau trouvé ce que trois agents n'avaient pas vu**, et par le même geste qu'à it1 : poser le mutant que **personne ne lui avait demandé**. Ici, le mot en `aria-label` seul — celui qui isole la portée `outerHTML` de la portée `textContent`. La question « quel mutant personne ne m'a demandé de poser ? » est ce qui distingue le mode B d'une relecture, et elle a payé deux fois sur deux.
6. **Une assertion textuelle sur un DOM concaténé est un faux ami structurel.** `not.toMatch(/\bmot\b/)` sur un `textContent` de conteneur **ne peut pas** séparer : le DOM colle les nœuds, donc `\b` n'a jamais de frontière à trouver. La leçon est portable au-delà de ce test et mériterait un KR — **elle n'a pas été promue**, `code-knowledge.json` n'ayant que ~113 o de marge sous son plafond. C'est le même blocage que les 17 KR du cadrage jamais mirrorés : le rattrapage exige une compaction, donc un arbitrage, pas un geste de fin d'itération.
