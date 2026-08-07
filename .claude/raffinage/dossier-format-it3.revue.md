# Revue d'itération — `dossier-format` · itération `3`

**Date** : 2026-08-06 · **Plan** : `dossier-format-it3.plan.md` · **Lot unique** : `contrat-dossier-it3` (`contrat`, `dev-contrat`, sans worktree)

## En une ligne

**L'auteur peut voir refusée une condition qui référence une entité inexistante** — et il la voit refusée en français, sur l'entité qui la porte, dans la modale d'import qui existait déjà.

## Ce qui a changé, mesuré

| grandeur | avant | après |
|---|---:|---:|
| suites / tests | 47 / 603 | **48 / 662** |
| `src/brain/dossier/validate.ts` | 723 l. | **607 l.** |
| `DossierIssueCode` | 12 | **16** |
| `DESTINATION_DES_CHAMPS` | 52 l. | **62 l.** |
| `PREDICATES` | — | **7** |
| chemins balayés par la 4ᵉ assertion | — | **62 entrées / 57 distincts** |

Les 662 tests se décomposent en : 603 avant l'itération, +3 en phase A (extraction, **zéro changement de comportement**), +52 en phase B, +2 en réponse à la QA mode B, +2 à la revue de PR.

## Les huit critères, un par un

| # | critère | statut | preuve |
|---|---|---|---|
| 1 | `predicat-inconnu` bloquant, `path`/`location` corrects | **VÉRIFIÉ** | `expr.test.ts › refuse un predicat absent du registre` + `validate.test.ts › un predicat inconnu … nomme le champ porteur` |
| 2 | intégrité référentielle des 5 familles, échec **par nom** | **VÉRIFIÉ** | boucle sur `FAMILLES_DE_CONDITIONS` générant `famille ${expr} : une reference absente…`, gardée par `les familles … aucune de plus`. Discriminance prouvée : retirer une famille fait échouer 5 tests **en nommant le chemin manquant** |
| 3 | `condition-sans-expr` non bloquant, fin/objectif seuls | **VÉRIFIÉ** | `… avertit sans bloquer, pilote par alerteSansExpr` + le discriminant `jalon, evenement et etape de plan restent calmes`. Inverser `alerteSansExpr` casse 3 tests |
| 4 | forme malformée, `code` asserté jamais par sous-chaîne | **VÉRIFIÉ** | 7 tests de `expr.test.ts`. Désactiver le refus de clé inconnue casse 3 tests ; décaler `>` en `>=` casse la borne |
| 5 | `identifiant-invalide` distinct de `reference-pendante` | **VÉRIFIÉ** | `expr.test.ts` + `validate.test.ts › une cible de mauvais espace est identifiant-invalide, distinct de reference-pendante` |
| 6 | `PREDICATES` : instance en fixture, `refKinds` porté, `bestiaire` absent | **VÉRIFIÉ** | `couverture.test.ts` + `expr.test.ts › tout refKinds a une ligne dans COLLECTIONS_IDENTIFIEES` |
| 7 | couverture des tables · `_expr`→`moteur` · arrêt **dérivé** | **VÉRIFIÉ** | les trois tests de `couverture.test.ts`. Casser la dérivation du walker fait rougir 4 tests |
| 8 | round-trip fichier réel, arbre à 3 niveaux | **VÉRIFIÉ** | `roundtrip.test.ts › un arbre a 3 niveaux traverse import puis export intact`, lecture disque (KR-156) |

Tous les tests nommés au § 7 du plan existent sous un nom reconnaissable et éprouvent ce qu'ils annoncent. Aucun absent du diff.

## Ce que la QA mode B a trouvé, et qui est corrigé

**BUG-051 (`major`) — la moitié non protégée du couple.** Les quatre lignes `…_texte` neuves de `DESTINATION_DES_CHAMPS` n'étaient tenues par aucun test de **valeur** : basculer `canon.objectifs[].reussi_si_texte` de `auteur` à `ia` laissait les 168 tests du périmètre **verts**. Or c'est exactement la propriété que le veto narratif (C11) a fait inscrire, et pour laquelle deux lignes du § D1 du roadmap ont été corrigées dans ce même lot.

Le trou était **dans le plan avant d'être dans le code** : le critère 7 n'exigeait que le symétrique (`…_expr → moteur`). La moitié protégée était celle qui risque le moins — un `…_expr` injecté serait du bruit pour le modèle ; un `…_texte` injecté lui **apprend la règle**. Correctif : une assertion jumelle, **dérivée de `FAMILLES_DE_CONDITIONS[].texte`** comme sa sœur l'est de `[].expr`. Discriminance prouvée par sonde, restauration vérifiée exacte.

**BUG-052 (`minor`) — une propriété affirmée sans test.** La docstring de `validateExpr` affirmait « elle ne RÉSOUT rien ». Vraie, et démontrée **par accident** dans un test qui vérifiait autre chose, jamais revendiquée. C'est KR-169 dans son mode de panne le plus discret : les trois autres propriétés absolutistes du lot avaient chacune leur test ; celle-ci a été oubliée **parce qu'un test existant la rendait vraie sans la nommer**. Correctif en deux volets, comportemental et structurel, le motif structurel portant son propre discriminant.

## Ce que la revue de PR a trouvé, et qui est corrigé

**BUG-053 (`critical`) — un validateur qui se promet total, et qui lève.** `validateDossier` **jetait** sur un `…_expr` valant `{ op: "toString" }` — ou `constructor`, `__proto__`, `hasOwnProperty`. Reproduit avant correctif, et le chemin produit est celui qui compte : `inspectDossierFile` n'entoure pas `validateDossier` d'un `try`, et son appelant l'invoque dans `reader.onload`. La modale d'import — **seul écran de la feature** — restait donc bloquée sur « lecture », sans anomalie, sans message et sans sortie, à partir d'un fichier écrit à la main. Second site de la même cause : `monstre_ref: "bestiaire.toString"` sortait **`ok: true`**, référence pendante acceptée, un combat qui s'ouvrirait en n° 13 sur une fonction.

**La cause.** `in` et le test d'index remontent la **chaîne de prototypes** : tout registre écrit comme littéral d'objet (`CLES_PAR_OPERATEUR`, `PREDICATES`) ou construit par `Object.fromEntries` (`BESTIARY_BY_TEMPLATE`) hérite d'`Object.prototype`, donc `'toString' in PREDICATES` vaut `true` et le descripteur qu'on en tire est une **fonction**. Deux `as` consécutifs empêchaient `tsc` de le voir : ils **affirment au compilateur ce que le garde était censé vérifier**.

**Ce qui rend ce défaut instructif** : le trou n'était pas dans la couverture des propriétés — le test de totalité existait, et il était vert. Il était dans le **choix du bruit** : aucune des seize entrées de sa liste n'était une clé héritée. La question à se poser en écrivant une liste de bruit n'est pas « cette valeur est-elle absurde ? » mais « par quelle porte le code peut-il répondre oui à ce qu'il devrait refuser ? ». C'est KR-175.

**Correctif** : `estCleDe` dans `identifiers.ts`, auprès de `estObjet` — même famille, un lecteur défensif d'un document que personne n'a validé. Posé aux **quatre** sites. `identifiers.ts` était hors lot au plan : ouvert délibérément, parce que le domicile correct d'un lecteur défensif partagé est le module bas, et qu'un troisième site l'aurait recopié.

**Cinq mineurs**, tous fermés : un décompte périmé (« onze codes » alors que le validateur en produit quinze), la copie locale de `feuille` supprimée au profit de `feuilleDe` (l'arête existait déjà, la copie n'avait pas le motif que `decrire` a), la docstring d'`issues.ts` qui ne nommait qu'un site d'interpolation sur deux, « les quatre assertions » remplacé par une formule qui ne se périme pas, et l'absolu de `collectRefs` **qualifié** (« totale *sur un arbre déjà accepté par `validateExpr`* ») — elle ne porte aucune borne de récursion, c'est `validateExpr` qui la lui garantit.

**Un majeur de documentation** : le veto C11 n'était corrigé qu'à moitié. Le § D1 du roadmap était bien repris, mais le § 5 portait toujours « `…_texte` pour l'IA » — le document se contredisait, et c'est ce tableau-là que la n° 10 lira. Une ligne.

## Le registre des refus — ce qu'un diff ne dit pas

| refusé | motif |
|---|---|
| **la 6ᵉ famille `contre_mesures[]`** | ni type, ni racine, ni feature éditrice : la « forme sans producteur ni consommateur » que la décision A interdit. Correction de fait au passage : ce n'est pas une racine, elle vit **sous `personnages[]`** — donc n° 4, pas n° 6 |
| **`lit: CheminDeSession[]`** au descripteur | table sans lecteur avant la n° 9. **Retirée par son propre auteur** au tour 2, au motif qu'il l'avait reprochée à quelqu'un d'autre en it2 |
| **`…_expr` sans `…_texte` = bloquant** | motif faux, démontré : les `…_texte` ne sont injectés dans **aucun** cas, donc « l'IA n'a pas la phrase » ne distingue rien. **Retirée par son auteur** |
| **`jet_reussi` et `carac_au_moins`** | veto narratif : un jet n'évalue pas, il **émet** une demande qui change le tour ; un évaluateur qui en contient lance le dé. Motif exact qui avait sorti `revele_si` de D1. La QA a ajouté un motif indépendant : l'arité 0 casse le patron de test `n-1 / n / n+1` |
| **`quete_achevee`, `objectif_atteint`** | proposés par le tech-lead, écartés par le relevé : aucun état de quête en session pour l'un, circularité pour l'autre (un objectif **est** défini par son `reussi_si_expr`) |
| **2 codes d'anomalie au lieu de 4** | arbitré pour 4, dans le domaine QA : un test doit asserter `issue.code`, jamais une sous-chaîne française. Le coût invoqué est annulé — quatre consignes réellement distinctes |
| **un registre d'opérateurs** | 4 entrées, zéro donnée. Les quatre opérateurs sont une **union de types**, vérifiée par le compilateur ; KR-117 porte sur les identifiants de prédicat |
| **tout `parseExpr`, tout élargissement de `sitesDe`** | vérifié : `sitesDe` est **identique octet pour octet à HEAD**, et un test-grep interdit `parseExpr` en position de code |

## Ce qui a été reporté, et où

- **n° 4** — la famille `contre_mesures[]`, avec ses destinations déjà arbitrées et écrites **en commentaire** dans `destinations.ts` (jamais des lignes de table : une ligne morte ferait rougir `couverture.test.ts` par construction).
- **n° 7** — l'alerte « `…_expr` sans `…_texte` », trou de documentation d'auteur.
- **n° 9 / n° 12** — les prédicats à opérande entier ; leur retour est **additif** et sa forme est connue.
- **it4** — **BUG-050**, journalisé dans ce lot avant la première ligne de code : un élément de liste non-objet traverse le validateur (`savoirs: ["du texte"]` sort `ok:true`). Même famille que BUG-049. Le cas **local à une expression** est, lui, fermé dès it3.
- **raffinage d'it5** — nommer l'itération qui livre le téléchargement, ou retirer « export » du `goal`.

## Écarts assumés

1. **Un fichier hors § 5** — `src/features/dossier-format/tests/importDossier.test.tsx`, une valeur attendue (`'2 anomalies'` → `'3 anomalies'`) et des commentaires. **PORTÉ** (KR-162). La cascade est la règle établie du module depuis it1 (`depart.lieu_id` se comporte pareil) : casser l'`id` du seul personnage rend pendante la condition qui le référence. Les deux contournements coûtaient plus cher — supprimer la cascade contredirait la matrice arbitrée, ajouter un second personnage rendrait la fixture fausse au sens du domaine. QA : la nouvelle valeur est la bonne, le test garde son pouvoir discriminant.
2. **Le `path` de `condition-sans-expr` est celui du `…_texte`**, pas du `…_expr` absent. Décision interprétative de l'ouvrier, retenue : le plan exige que `feuilleDe(path)` rende « la clé que l'auteur cherchera dans son fichier », et la clé absente n'y est pas. QA : cohérent avec le contrat que la n° 7 consommera — pointer un champ absent ne badge rien.
3. **Six symboles passent de privés à exportés** (`GenreDeRacine`, `RacineObligatoire`, `ChampRequis`, `EnumereFerme`, `BudgetDeMots`, `CONFIANCES`) : conséquence mécanique de l'extraction de `tables.ts`. Aucun ne sort de `brain/dossier/`.
4. **`expr.ts` porte un `decrire()` et un `feuille()` locaux**, jumeaux de ceux de `validate.ts` / `identifiers.ts`. Deux appelants, quelques lignes — extraction au troisième, même doctrine que `definePredicats` face à `defineEspaces`.
5. **`validate.test.ts`** : « douze » → « seize » codes. **PORTÉ**, discriminance vérifiée.

## Porte qualité

| instrument | résultat |
|---|---|
| Prettier | conforme |
| `tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur** (1 warning pré-existant hors lot, présent à HEAD) |
| `jest` complet | **48 suites / 662 tests verts** |
| `npm run test:mutation` | **sans objet** (KR-161) — vérifié, pas cru : `git status` sur les 4 fichiers mutés + `bestiary.ts` + `rules.golden.test.ts` + `stryker.config.json` donne **0 fichier** |
| table dorée | **hors jeu** — aucun registre couvert n'est touché ; `PREDICATES` est un vocabulaire de schéma, pas une règle de jeu |
| intégrateur | **CONFORME**, zéro correctif, propriété des fichiers exacte |
| QA mode B | **RECEVABLE** sous réserves — les deux réserves fermées |
| Revue de PR `tech-lead` | **REQUEST_CHANGES** — 1 critique, 2 majeurs, 5 mineurs, **tous fermés**, puis re-soumise |

## Ce que personne n'a pu vérifier

C'est la liste qui compte le plus : un diff vert ne la dit pas.

- **La cohérence du § D1 du roadmap.** Relue à la main, cohérente (le « six familles » global reste vrai : cinq livrées + une réservée n° 4). **Aucun instrument** `jest` / `tsc` / `eslint` ne relit une prose `.md` — toute régression future y passera inaperçue.
- **« BUG-050 journalisé avant la première ligne de code ».** Aucun horodatage exploitable dans une tranche non commitée ne permet de constater l'ordre réel. C'est une affirmation d'ouvrier, pas une mesure.
- **L'orientation de `lieux[].acces`** et **toute assertion sur `contre_mesures[]`** : zéro ligne de code, non observables par construction.
- **L'exhaustivité des voies d'élargissement d'un nœud** : `validateExpr` prouve que les formes **nommées** sont rejetées, jamais l'absence de toute autre.

## `RETOUR-COMITÉ`

1. **Un critère qui protège une moitié de couple doit nommer l'autre.** Le critère 7 exigeait `…_expr → moteur` et laissait `…_texte` sans garde de valeur — alors que c'est le second qui porte le risque nommé par le veto. Quand une décision distingue deux champs jumeaux par leur **audience**, le critère qui l'épingle porte sur **les deux**, sinon il donne l'illusion d'une propriété qu'il ne tient qu'à moitié. Cause racine du seul défaut `major` de l'itération, et elle était dans le plan.
2. **Le lot unique `contrat` était la seule coupe possible** — l'intégrateur n'a eu ni collision ni découpage à renvoyer. Confirmation utile pour les n° 3 à n° 6, que la décision A fait toutes rouvrir `types.ts` / `destinations.ts` / `validate.ts` : elles auront le même lot unique, et il ne faut pas chercher à paralléliser un contrat.
3. **Le couple toujours chargé est à 88 octets de son plafond** (`CLAUDE.md` + `docs/WORKFLOW.md`, 45 992 o pour 46 080). La marge a fondu pendant `0.6.4`–`0.6.6`, sans qu'aucun de ces commits touche une feature. C'est le seul fichier du dispositif dont la croissance est un **défaut par définition**, et le seul sans garde-fou automatique. La prochaine règle qui voudra y entrer devra **en remplacer une**.
4. **Une liste de bruit ne se remplit pas en cherchant des valeurs absurdes.** Le test de totalité de `validateExpr` existait, comptait seize entrées de bruit, et était **vert sur une fonction qui jetait** — parce qu'aucune de ses seize entrées n'était une clé de prototype. La bonne question en écrivant une telle liste n'est pas « cette valeur est-elle absurde ? » mais « **par quelle porte le code peut-il répondre oui à ce qu'il devrait refuser ?** ». Corollaire du même défaut : un `as` posé sur une valeur non fiable est l'endroit exact où le compilateur cesse de protéger — il affirme ce que le garde était censé vérifier. Tout cast qui suit un garde mérite qu'on relise le garde. (KR-175)
5. **Trois instruments, trois défauts, aucun redondant.** La QA mode B a trouvé un trou de *valeur* (BUG-051), la revue de PR un trou de *totalité* (BUG-053) que la QA n'avait pas vu, et l'ouvrier lui-même un test *relatif à sa constante* pendant sa propre sonde. Aucun des trois n'aurait trouvé les deux autres. C'est l'argument pour garder la séquence complète même quand la porte est verte depuis le début — elle l'était.
6. **La sonde qui survit est un résultat, pas un incident.** L'ouvrier a éprouvé la borne de profondeur et l'a vue **survivre** : ses assertions étaient écrites *relativement* à la constante et n'épinglaient que le `>` du garde. Épinglé par `expect(PROFONDEUR_MAX_EXPR).toBe(8)`. C'est le mode de panne exact que la table dorée existe pour nommer — un test vert sur une valeur fausse — rencontré ici hors de son périmètre.

---

## Correction portée au raffinage d'it4 (2026-08-07)

Deux chiffres de cette revue étaient faux, et le second l'était d'une manière qui mérite d'être nommée.

1. **`validate.ts` fait 607 lignes, pas 602.** Les deux valeurs ont été vraies : 602 à la mesure, 607 après les correctifs de la revue de PR — que **personne n'a re-mesurés**. Mode de panne de KR-159 dans sa forme la plus discrète : un nombre vrai à l'instant où il est pris, cité plus tard sans être repris.
2. **Le « plafond de 650 » n'a jamais existé.** Vérifié à it4 : il n'apparaît que dans les trois documents du raffinage d'it3. Il est né d'une phrase de comité, a été promu **critère contraignant** du plan par l'orchestrateur, puis reporté ici comme « (plafond 650) » — c'est-à-dire comme une règle du projet. La seule règle réelle est KR-112 (400 = signal, 800 = bloqueur). Chaque copie était fidèle à la précédente, aucune n'était fautive isolément : c'est la **répétition** qui a créé l'autorité. **KR-176** est posé pour ça.
