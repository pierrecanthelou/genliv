# Revue d'itération — `dossier-controles` · itération `7`

**2026-09-16** · plan : `.claude/raffinage/dossier-controles-it7.plan.md` · notes de comité : `.claude/raffinage/dossier-controles-it7/`

---

## En une ligne

**L'auteur voit désormais qu'un objectif qu'il a posé n'a aucun chemin qui puisse l'accomplir** — et le linter l'a prouvé dès le premier jour en trouvant ce défaut dans l'aventure de référence du dépôt.

---

## Les 8 critères

Tous **VÉRIFIÉS**, chacun rejoué par la QA en mode B avec un contexte neuf.

| # | Critère | Preuve |
|---|---|---|
| 1 | Le `non` ne descend pas | Mutant « `non` descend et inverse » → **rouge** sur le test dédié **et** sur 12 assertions de `controles.test.ts` |
| 2 | Le `ou` suffit à une branche | Mutant « `ou` exige toutes les branches » → **rouge** exactement sur le test qui le nomme |
| 3 | Le vrai positif de la fixture, et sa réparation | Les deux états dans le même test via `cloneReferenceAvantReparation()` ; **13 suites** lisant la fixture vertes sans modification |
| 4 | La table est totale, et dit ce qu'elle décide | 8ᵉ prédicat fictif → `tsc` rouge sur **deux** fichiers ; flip de `jalon_atteint` simulant it8 **sans toucher au test** → rouge |
| 5 | KR-226 durcit | Mutant `split('.')[0]` → **rouge sur deux gardes distinctes** |
| 6 | `pnj_a_revele` s'évalue par paire | Mutant « deux feuilles indépendantes » → rouge sur le test H3 **et** 5 assertions |
| 7 | Les sept suites voisines ne bougent pas | **313/313 verts**, `0 ligne` sur les deux fichiers de features |
| 8 | Le message nomme la feuille, verbatim | Arité 1 **et** 2 assertées mot pour mot ; « prédicat », clés techniques et ids bruts testés **absents** |

---

## Le défaut trouvé — et il était dans un INSTRUMENT, pour la troisième fois en deux itérations

**Une garde de source protégeait moins que ce qu'elle énonçait.** `expr.test.ts` épinglait « `op` et `predicat` ne sont interprétés qu'au SEUL site `validateExpr` », au motif qu'« un second lecteur de l'arbre serait une seconde grammaire ». Son relevé ne cherchait qu'**une seule forme d'écriture** — la cascade `op === '…'`. Un `switch` sur le même discriminant, c'est-à-dire **un lecteur d'arbre à part entière**, n'était **même pas compté**.

Conséquence mesurée, et c'est elle qui rend le défaut sérieux : la garde **serait repassée au vert toute seule** dès que la nouvelle traversée aurait été écrite en `switch` — en laissant passer exactement ce qu'elle prétendait interdire.

**Et le typage ne rattrapait rien.** Contrefactuel rejoué trois fois, par l'ouvrier puis par la QA :

- 5ᵉ opérateur ajouté à `ExprNode`, `switch` + `never` en place → **`tsc` rouge**, à l'appel exact, dans le bon fichier ;
- même 5ᵉ opérateur, cascade de `if` équivalente → **`tsc` exit 0, zéro erreur dans tout le dépôt**. Le nœud inconnu tombait dans le repli et **se faisait traiter comme un `ou`**.

**Arbitrage de l'orchestrateur, au niveau du plan** (l'ouvrier avait correctement refusé de contourner, et je n'ai pas pris la correction qu'il proposait) : son amendement admettait un second porteur **sans rien exiger de lui** — un élargissement, exactement ce que le plan avait refusé pour KR-226 deux heures plus tôt. Retenu à la place : le relevé **s'élargit** (il voit désormais les deux formes) pendant que la règle **se resserre** (le second porteur n'est admis **que** s'il porte la marque d'exhaustivité `never`), et la condition **se dérive du relevé** plutôt que de nommer un fichier. L'exemption de `expr.ts` est mécanique — il lit `noeud: unknown`, où l'exhaustivité n'est pas même exprimable — et les deux signatures sont **lues dans la source**, jamais affirmées en prose.

Deux sondes de discriminance, rejouées par la QA : marque `never` retirée → rouge ; troisième lecteur fictif en forme `switch` → rouge, **là où l'ancien marqueur serait resté vert**.

Journalisé **BUG-089**. Le lot est passé de 6 à 7 fichiers sur ma décision.

---

## Diff, comparé à la liste du plan

| fichier | plan | livré |
|---|---|---|
| `atteignabilite.ts` | **R** | +242 / −21 (492 l.) |
| `atteignabilite.test.ts` | **R** | +192 / −1 |
| `controles.ts` | **R** | +122 / −2 (999 l.) |
| `controles.test.ts` | **R** | +320 / −36 |
| `__fixtures__/dossier-reference.json` | **R** | +4 / −1 |
| `deltas.ts` | **R** | +6 / −1 |
| `expr.test.ts` | **hors plan — ajouté sur arbitrage** | +62 / −7 |

**0 ligne** : `panneauControles.test.tsx`, `dossierEditorScreen.test.tsx`, `brain/index.ts`, `dossier-minimal.json`, **`expr.ts`**. Vérifié par moi et par la QA.

---

## Ce qui a été refusé — ce qu'un diff ne dit pas

Les **35 `REJETÉ`** du registre ont été vérifiés un par un par la QA contre le code livré : **aucun rouvert**. Les plus structurants :

- **« toutes les feuilles doivent être productibles »** et **descendre sous `non`** — faux positifs bloquants, la seule direction d'erreur que tout le module s'interdit ;
- **réutiliser `collectRefs`** — elle aplatit `ou` et descend dans `non` : correcte pour les références, fausse pour la satisfiabilité ;
- **dériver le producteur d'objet de `refKinds.includes('objet')`** — `retirer_objet` partage ce `refKind` et est un producteur **négatif** ; trou déjà réel, pas hypothétique ;
- **un champ neuf sur `ConstatControle`** — état illégal représentable, arbitrage d'it6 reconduit ;
- **que `controles.ts` importe `PREDICATES` ou `ExprNode`** — il conclut et raconte, il ne compte pas ;
- **corriger la fixture en changeant le prédicat de l'objectif** — la prose émise verbatim au joueur établit l'intention inverse ;
- **une remédiation renvoyant à « Objectifs → Condition de réussite »** — cet écran n'écrit pas `reussi_si_expr`.

---

## Ce qui a été reporté, et où

- **→ it8** : `canon-sans-objectif`, **avec sa question doctrinale** (le linter se tait-il sur `objectifs` vide comme sur les autres collections ?), à trancher à froid.
- **→ it8** : la scission de `controles.ts` (999 lignes), **en tête d'itération**, avant ses règles.
- **→ it8** : la condition d'**échec vraie au tour zéro** — défaut réel de la fixture, cause distincte.
- **→ `open_questions`** : `charpente.fins[0].condition_expr` porte la même feuille morte — « aucune fin atteignable » est une cause distincte.

---

## Écarts assumés

1. **Le périmètre est passé de 6 à 7 fichiers** — `expr.test.ts`, sur ma décision d'orchestrateur après un `BLOCAGE` que l'ouvrier a correctement refusé de contourner.
2. **`effetsDeRegle` extraite** dans `atteignabilite.ts` — structure interne, hors signature, motivée par l'interdiction d'une seconde copie des quatre accès typés. Iso-comportement mesuré.
3. **Aucune mémoïsation** : la fonction recalcule l'état par objectif. Coût assumé, conforme au plan.
4. **`git stash` employé au premier tour** (commande mutante, KR-172) — **détecté et réparé par l'ouvrier**, réparation **vérifiée par la QA** : 0 CRLF sur les 8 fichiers, index cohérent, aucune altération.
5. **La branche `default` n'est pas testée** — elle est inatteignable par construction, et `tsc` en est l'instrument. La tester exigerait un `as` qui éteindrait le garde-fou qu'on vient de poser.

**Blocages non résolus : aucun.**

---

## Ce que personne n'a pu mesurer — et qui se démontre sans mesure

**La narration « M3 bis » de KR-226.** L'ouvrier affirmait avoir mesuré qu'un mutant *faux mais non dérivable* (`section: 'jalons-fins'`) rougit sur la table épinglée là où l'ancien prédicat serait resté vert. La QA **n'a pas pu reproduire la comparaison** : sa propre tentative casse 19 tests pour des raisons indépendantes. J'avais donc écrit ici que la démonstration restait « plausible et non prouvée ».

**C'était une erreur de ma part, relevée en revue de PR, et la correction vaut d'être notée** : il n'y avait pas de mesure à faire. La propriété **se démontre en deux lignes**, et elle ne dépend que des deux formes d'assertion :

- l'ancien prédicat était `racine(path) ≠ section`. Sur `path: 'canon.objectifs[].reussi_si_expr'` et `section: 'jalons-fins'`, il évalue `'canon' ≠ 'jalons-fins'` → **vrai** → **vert** ;
- la nouvelle forme asserte l'**égalité à une valeur écrite** : `→ jalons-fins` ≠ `→ canon` → **rouge**.

Le reste de la suite n'entre pas dans la démonstration, ce qui explique aussi pourquoi les 19 tests cassés de la tentative de reproduction étaient hors sujet. Ajouté à ce que la QA avait établi par lecture — la table appelle `CONTROLES[id].controler()` **directement**, jamais `controlerDossier`, donc un mutant confiné à l'agrégateur lui est structurellement invisible —, **le point est clos par construction**.

**Ce qui reste vrai** : le critère 5 lui-même était prouvé indépendamment, son mutant réel ayant été vu rouge deux fois. **Ce que j'en retiens** : « non mesuré » et « non démontré » ne sont pas la même chose, et j'ai classé le premier comme le second.

---

## Porte qualité

| | |
|---|---|
| Prettier | conforme |
| `tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur** (1 avertissement **préexistant**, `CharacterCreationScreen.tsx`, jamais touché) |
| `npx jest` | **86 suites / 1249 tests verts** (1237 avant) |
| Score de mutation | **non requis, confirmé plutôt que lancé** |

---

## `RETOUR-COMITÉ`

1. **Le comité mesure les gardes qu'il connaît, pas celles qu'il ignore.** Cinq rôles ont vérifié quatre gardes de source et manqué la cinquième — celle sur `ExprNode` —, alors que la signature du plan créait précisément un second lecteur de cet arbre. Le trou n'a été trouvé qu'en écrivant le code. **Règle à ajouter au cadrage : quand un plan crée un second lecteur d'une structure du module, relever les gardes de source qui portent sur cette structure, avant le tour 1.** C'est greppable, et ça coûte une commande.
2. **Une garde peut être plus étroite que son propre énoncé, et le rester des mois.** Celle-ci disait « un seul site interprète `op` » et ne cherchait qu'une seule forme d'écriture. Le symptôme à reconnaître : **un relevé par marqueur textuel énonce un invariant sémantique**. À chaque fois qu'on en croise un, se demander quelle *autre* écriture du même geste lui échapperait.
3. **Un ouvrier qui refuse de contourner vaut plus qu'un ouvrier qui livre vert.** Un `switch` posé pour échapper au marqueur aurait rendu la garde verte et fausse, et personne ne l'aurait su. Le refus a coûté un aller-retour et a acheté un durcissement réel.
4. **Mon propre arbitrage a dû corriger la correction.** L'amendement proposé par l'ouvrier était un élargissement — la faute que le plan avait refusée pour KR-226 deux heures plus tôt. La discipline « on durcit, on ne desserre pas » ne se transmet pas par l'exemple : elle se redemande à chaque fois.
5. **La QA a dit ce qu'elle n'avait pas pu vérifier**, au lieu de compter une affirmation plausible comme prouvée. C'est le bon comportement et il faut le dire, parce que c'est exactement l'inverse de ce qui a produit BUG-087.
