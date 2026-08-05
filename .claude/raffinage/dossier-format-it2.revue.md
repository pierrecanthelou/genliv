# Revue d'itération — `dossier-format` · itération `2`

> Exécutée le 2026-08-04 · plan `.claude/raffinage/dossier-format-it2.plan.md` (marqué `validé`)
> Exécution : **1 lot `contrat`, sans worktree** · `dev-contrat` seul · intégration + QA mode B
> Verdict QA : **RECEVABLE**

## En une ligne

**L'auteur peut voir refusé un dossier dont une donnée mécanique est mal formée** — une référence de monstre qui ne résout pas, une valeur hors énumération, un effet écrit en prose, une porte de révélation inconnue.

## Critères d'acceptation

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | `monstre_ref` pendant → bloquant, OÙ = l'événement, `{champ}` résolu | `VÉRIFIÉ` | 3 tests, dont le repli indexé et les **deux** textes distincts (`lieu_id` / `monstre_ref`) |
| 2 | `portee` / `certitude` hors énumération | `VÉRIFIÉ` | Assertions explicites `not.toContain('|')` et `not.toContain('string')` — aucun nom de type TypeScript ne fuit vers l'auteur |
| 3 | Les 4 chemins de delta, **séparément** | `VÉRIFIÉ` — casse-restaure | QA a cassé `charpente.jalons[].effet` isolément : **seul** ce test rougit, les 3 autres restent verts. Prouve l'indépendance, pas seulement la présence |
| 4 | `porte-inconnue` ; 4 portes absentes → avertissement seul | `VÉRIFIÉ` | `une seule porte posee reste calme` boucle sur les **quatre** portes individuellement |
| 5 | `enonce_texte` absent / 20 / 21 mots | `VÉRIFIÉ` — casse-restaure | QA a passé `<=` en `<` : le cas « à la borne exacte, rien » rougit exactement |
| 6 | `confiance_min` aux bornes et hors bornes | `VÉRIFIÉ` | `CONFIANCES` est **dérivé** des deux constantes nommées ; aucun nombre en dur au site de validation |
| 7 | Balayage de couverture pleine profondeur | `VÉRIFIÉ` — **éprouvé deux fois** | Code lu ligne à ligne : entre dans les tableaux, objet/tableau **vide** traité comme feuille, `AND` sur toutes les instances. QA a retiré une entrée de `CHEMINS_DE_DELTAS` puis une de `ENUMERES_FERMES` : le test **nomme** à chaque fois le chemin exact |
| 8 | Round-trip des formes neuves | `VÉRIFIÉ` | Champ par champ, re-validation, `Object.isFrozen` à 3 profondeurs |

**8 / 8.** Cinq critères éprouvés par casse-restaure — au-delà des trois demandés.

## Diff

| | |
|---|---|
| Lot 1 `contrat-dossier-it2` | **11 fichiers** (2 créés, 9 remplacés), conformes au § 5 à la ligne près |
| Touchés **en revue de PR**, hors lot | **3** — `DossierService.ts` (docstring, BUG-048) · `CloudSyncService.test.ts` (`climat: []`, BUG-049) · `read.test.ts` (renommage du code) |
| Tests | 559 → **603** (+44), 46 → 47 suites |
| `src/features/**` et `src/player/**` | **zéro ligne de code** |

## Ce qui a été refusé (invisible dans le diff)

- **`ProjectionCharpente`, type et fonction** — reportée n° 9. Elle dépend de `session.jalons_atteints` : ce n'est pas une projection du *dossier*. Le tech-lead a reconnu qu'il réintroduisait sous un autre nom le `construireContexte` déjà rejeté en it1.
- **Injecter `declencheur_texte` / `condition_texte`** — veto `narratif-ia`, retenu. C'est `declencheur_expr` en français : la même règle dans le code **et** dans le prompt, et un narrateur qui lit « quand le joueur brise le sceau » y conduit le joueur.
- **Fusionner les trois sources de vérité du schéma** — trois questions disjointes (quelle forme, quoi refuser, qui lit). Les fondre produirait un DSL de schéma à spécifier, versionner et tester.
- **Recréer un golden du bestiaire** — il existe déjà (`rules.golden.test.ts`, **22** `templateId` ; `narratif-ia` avait mesuré 23, la QA a mesuré juste).
- **`meta` comme racine** · **`BUDGET_CONTEXTE`** · **le protocole de révélation** (sa *décision* est écrite, son *code* est reporté).

## Ce qui a été reporté

`ProjectionCharpente` → **n° 9** · protocole de révélation → **n° 9-12** · `BUDGET_CONTEXTE` et `MAX_SAVOIRS_PAR_PNJ` → **n° 4 / n° 9** · forme complète des racines → **n° 3 à n° 6** (décision A) · `Delta` → **it4**.

## Écarts assumés

**Cinq**, enregistrés dans `specification.json` → `deviations_from_plan` — deux entrées de plus y figuraient, qui recopiaient des `architecture_choices` : une liste rallongée par recopie déclare moins qu'une liste courte et honnête. Les trois qui comptent :

1. ~~`monde.conditions.climat` n'est pas une racine obligatoire alors que le type promet `climat: Climat[]`~~ → **fermé à la revue de PR, et il n'était pas seul** : il y avait **quatre** endroits du module où le type était plus strict que son validateur — l'ouvrier n'en avait vu qu'un, la revue de PR a trouvé les trois autres (`plan_actions`, `savoirs`, `resolutions`). **Corrigé** : la table `LISTES_REQUISES` les ferme tous les quatre. Exiger la liste faisait rougir `CloudSyncService.test.ts` : une ligne, corrigée. **Conséquence désormais FERMÉE** : un `Dossier` validé porte les quatre tableaux, la n° 6 peut itérer `climat` sans garde — le typage la protège réellement. Le dernier écart type/validateur connu est ailleurs, et il est écrit : un `nom` **non textuel** traverse encore le validateur → `open_questions`, propriétaire n° 2.
2. ~~Le budget de mots du jalon réutilise `canon-trop-long`~~ → **fermé à la revue de PR** : renommé `texte-trop-long`. Le tech-lead a fait observer que la fenêtre était **maintenant** — le code est exporté du baril et la n° 7 badgera par code, mais aucun consommateur ne branche encore dessus. Reporter un renommage jusqu'à l'arrivée de son premier consommateur, c'est le rendre impossible (BUG-046).
3. **`validate.ts` approche 700 lignes.** Signal de scission, pas blocage. `tables.ts` entre en **it3 avec son bénéficiaire** — la quatrième assertion du balayage a besoin des tables *importables* ; le sortir aujourd'hui serait un déplacement sans lecteur.

## Défauts traités pendant la revue

| Sévérité | Origine | Traitement |
|---|---|---|
| mineur | **QA** — la branche `champ-requis-vide` des 4 chemins de delta n'était exercée par **aucun** test. Prouvé : neutraliser la branche laissait les 85 tests du module verts. L'argument « la corruption subsume la suppression » ne vaut que pour les **optionnels** ; ces quatre champs sont obligatoires | **Corrigé** — 4 tests, une seconde boucle sur la table existante. Discriminance prouvée : les 4 rougissent quand la branche est neutralisée → **BUG-047** |

## Revue de PR — ce que le tech-lead a bloqué

Verdict initial : **`REQUEST_CHANGES`**, deux majeurs. Tous deux du même genre — **un contrat qui promet plus que le code ne tient** — et tous deux fermés avant que la tranche atteigne la revue humaine.

| # | Constat | Traitement |
|---|---|---|
| **M1** | **Quatre** listes non optionnelles de `types.ts` étaient acceptées **absentes**, pas une. `sitesDe` fait `continue` sur un segment `[]` dont la valeur n'est pas un tableau — ce qui le rend total, et rend muettes toutes les règles portées par les descendants d'une liste absente. `plan_actions`, `savoirs`, `resolutions` passaient donc `ok:true`, et le dossier gelé promettait trois tableaux valant `undefined`. **Et la revue affirmait que `conditions.climat` était « le seul endroit »** — faux d'un facteur quatre | Table `LISTES_REQUISES` (4 entrées), lue par le même expanseur, émettant `champ-requis-vide` — **aucun treizième code**, le message existant est exact. 8 tests : chaque liste **absente** bloque, chaque liste **vide** reste calme (c'est l'absence qui ment au typage, pas le vide). Plus une ligne dans `CloudSyncService.test.ts` → **BUG-049** |
| **M2** | La docstring de `DossierService.importDossier` garantit qu'« un import ne se substitue jamais à un dossier déjà présent ». **Faux depuis it2** : la présence est constatée par `get()`, qui **re-valide**, et it2 a durci le schéma 1 **sans changer son numéro**. Un document stocké devenu invalide rend `null` → pas d'anomalie → `set` **écrase**. Le test existant ne peut pas le voir : il réimporte le même contenu, donc toujours valide | Rayon **nul** aujourd'hui, **réel** dès la n° 2, et **réarmé** par chaque resserrement de schéma en n° 3 à n° 6. Docstring corrigée pour cesser d'affirmer une propriété fausse et nommer la portée exacte ; correctif de fond porté à la n° 2, avec l'écran qui montrera le second message → **BUG-048** |

Les **quatre mineurs exigés** sont fermés : le renommage `canon-trop-long` → `texte-trop-long` pendant que la fenêtre est ouverte ; le compte d'écarts (la revue disait sept, la spec en enregistrait quatre — *un écart non écrit dans la spec n'a pas été assumé, il a été perdu*) ; « probabilités de déclenchement » dans le `CHANGELOG`, champ qui n'existe pas en it2 ; et les conditions d'entrée d'it3 écrites comme telles, pas comme vœu de revue.

**Ce que le tech-lead a validé sans réserve** : l'expanseur `sitesDe` — six lectrices le jour de sa naissance, et le OÙ résolu comme sous-produit de la traversée — et le garde de `DESTINATION_DES_CHAMPS`, dont il a recompté les 52 entrées pour vérifier qu'elles sont **exactement** l'ensemble des feuilles de la fixture.

**Le trou qui reste, nommé** : le garde est borné par la fixture, et rien ne force la fixture à grandir. Un champ ajouté aux types et aux tables mais pas à la fixture reste invisible aux deux assertions. → condition d'entrée d'it3.

## Incident de processus — et c'est le mien

**L'orchestrateur a lancé l'intégrateur et la QA en parallèle sur le même arbre de travail non commité.** Le protocole de casse-restaure de la QA est destructif par nature : son `git checkout -- validate.ts` a effacé les 409 lignes d'it2 du fichier, **pendant que l'intégrateur le relisait**. L'intégrateur a diagnostiqué le revert correctement (hash identique à `HEAD`, neuf autres fichiers intacts), a refusé de reconstituer le fichier à la main — bon réflexe — et a renvoyé le lot. La QA a restauré depuis une sauvegarde de l'ouvrier et vérifié le md5.

Aucune perte : `validate.ts` est à 681 lignes, hash `f992209f…` distinct de `HEAD`, porte verte. Mais l'analyse de l'intégrateur a tourné sur un arbre mouvant, et son verdict porte sur un contenu qu'il ne pouvait plus mesurer à la fin.

**Règle qui en sort** → **BUG-045** : *deux agents ne travaillent jamais en parallèle sur le même arbre non commité dès que l'un d'eux mute des fichiers.* La casse-restaure est un instrument de vérification légitime — mais elle exige l'exclusivité. → également porté en **KR-172**.

## Porte qualité

| Étape | Résultat |
|---|---|
| `npm run format` | propre |
| `npm run typecheck` | **0 erreur** |
| `npm run lint` | **0 erreur**, 1 warning préexistant (`CharacterCreationScreen.tsx:35`) |
| `npm test` | **47 suites / 603 tests, 100 % verts** (46 / 559 avant) |
| `npm run test:mutation` | **sans objet** (KR-161) — `git diff` confirme les 4 fichiers mutés et `stryker.config.json` intacts |

**Invariants** : `Object.freeze` seulement dans `freeze.ts` ✅ · `deepFreeze` appelé une seule fois ✅ · aucune conversion `Book` ↔ `Dossier`, et `../bestiary` n'importe que la couche règles — KR-167 tient ✅ · zéro `switch` et zéro branche sur une valeur d'énuméré (KR-117) ✅ · walker unique, épinglé par test-grep ✅ · `DESTINATION_DES_CHAMPS` non exporté du baril ✅ · `snake_case` partout ✅.

## `RETOUR-COMITÉ`

1. **Le plan a figé une union de 12 codes sans vérifier qu'elle couvrait ses propres exigences.** KR-165 imposait une borne de mots sur `enonce_texte` ; aucune ligne de l'union ne lui correspondait, et l'ouvrier a réutilisé `canon-trop-long`. Un § qui fige un **registre fermé** doit être relu contre les autres § du même plan avant la porte 1 — c'est un contrôle mécanique à ajouter.
2. **« La corruption subsume la suppression » est vrai pour les optionnels, faux pour les obligatoires.** Le changement de critère du balayage de couverture était juste, mais il a créé un angle mort sur les champs obligatoires que seule la QA a vu. Une bascule d'instrument doit nommer **ce qu'elle cesse de couvrir**, pas seulement ce qu'elle couvre en plus.
3. **Un lot unique ne dispense pas de l'intégrateur — mais il change son mandat.** Sans fusion à faire, sa valeur est la cohérence interne et la non-régression. Ici il a instruit les deux écarts et diagnostiqué l'incident ; c'est ce qu'on lui demandera la prochaine fois, explicitement.
4. **Ce qu'it2 laisse de mieux que son code** : le balayage de couverture pleine profondeur, qui remplace un instrument qui **mentait**. Il est réutilisable tel quel en it3 et it4 — et il exige que la fixture porte une occurrence de chaque champ, y compris optionnel, ce qui en fait le vrai document de référence du format.
