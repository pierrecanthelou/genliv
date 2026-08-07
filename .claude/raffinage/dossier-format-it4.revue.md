# Revue d'itération — `dossier-format` · itération `4`

**Date** : 2026-08-07 · **Plan** : `dossier-format-it4.plan.md` · **Lot unique** : `contrat-dossier-it4` (`contrat`, `dev-contrat`, sans worktree)

## En une ligne

**L'auteur peut voir refusé tout effet ou savoir de son dossier qui pointe une entité inexistante ou qui n'a pas la forme attendue** — et le voir refusé en français, sur l'entité qui le porte.

## Ce qui a changé, mesuré

| grandeur | avant | après |
|---|---:|---:|
| suites / tests | 48 / 662 | **49 / 716** |
| `validate.ts` | 607 l. | **677 l.** (consigne locale 700, jamais franchie) |
| `DossierIssueCode` | 16 | **19** |
| `DELTAS` | — | **4** |
| chemins de la dérivation BUG-050 | — | **3**, remesurés |

## Les huit critères

Les huit sont **VÉRIFIÉS**, chacun par un test nommé — la QA les a repris un par un et a retrouvé 19 des 20 tests du § 7 du plan, dont plusieurs éclatés en un `it` par chemin plutôt qu'un générique (mieux, pas moins). Le vingtième était la **sonde**, qui n'est pas un test mais un acte : elle est journalisée ci-dessous.

## La sonde de C8 — les deux états, journalisés

C'est ce que le § 10.4 du plan exigeait, et ce que la QA a signalé comme manquant : sans elle, la correction de C8 est un raisonnement.

**État 1** — `CHEMINS_D_ARRET` écrit avec `CHEMINS_DE_DELTAS.map(c => c.path)`, **sans suffixe** → **ROUGE**. `aucune ligne morte dans DESTINATION_DES_CHAMPS` remonte trois chemins orphelins : `monde.quetes[].recompense[]`, `monde.evenements[].resolutions[].consequence[]`, `charpente.jalons[].effet[]`.

**État 2** — avec `` `${c.path}[]` `` → **VERT**, 14/14.

**Exécutée deux fois, indépendamment** : par l'ouvrier à l'implémentation, puis par la QA en mode B avec sa propre sauvegarde de fichier (KR-172 : jamais `git checkout`, restauration vérifiée par `diff`). La QA mesure **5 tests rouges** contre 3 pour l'ouvrier — écart de périmètre d'exécution, pas de résultat : les trois lignes mortes sont identiques.

**Le plan avait un chiffre daté** : son § 8 annonçait **quatre** lignes mortes. Le fait est **trois**, parce que la décision C9 — `effets_regles: []` — fait perdre son `[]` à la quatrième *dans le même plan*, sans que le § 8 en ait été repris. Le code porte le chiffre mesuré. C'est KR-159 appliqué contre le plan par l'ouvrier, ce qui est exactement l'usage.

## Ce que la QA a trouvé, et qui est fermé

- **`element-non-objet` / `delta-malforme`** : scission confirmée et testée.
- **Trois défauts mineurs**, tous corrigés avant la revue humaine : le QUOI de la clé inconnue n'était asserté que par `toContain` alors que ses quatre voisins le sont **verbatim** (une phrase livrée sans être épinglée dérive à la première reformulation, qu'elle ait été arbitrée ou non) ; le **changement de comportement de C7** — `depart.lieu_id` cesse d'être silencieusement exempté quand `monde.lieux` manque — n'avait **aucun test**, alors que le plan le nommait comme un changement voulu ; et un chiffre de budget périmé dans le CHANGELOG.
- **Deux majeurs de définition de fini**, qui étaient de mon fait : la sonde non journalisée (ci-dessus) et l'étape 4 des Build Steps non faite (spec, README, roadmap, CHANGELOG). Fermés dans ce lot.

## Ce que l'ouvrier a décidé seul, et que je retiens

1. **`arite-invalide` réutilisé** pour l'arité des `cibles` d'un effet. Le plan n'avait pas de ligne d'arité ; le motif tient — l'arité étant **dérivée**, ne pas la contrôler ferait sauter une cible manquante en silence dans `collectDeltaRefs`, et le libellé existant dit déjà « Ajustez le nombre de **cibles** ». Un code par cause, pas un code de plus.
2. **`estDeltaId`, une garde de type** non prévue, privée au module. Motif : le plan interdit les `as` sur une valeur non fiable, or `estCleDe` seul **ne restreint pas le type** — c'est précisément la forme qui a produit BUG-053. Avec une garde, le compilateur porte la restriction et `deltas.ts` ne contient aucun `as` sur le registre. **KR-175 appliqué plus loin que ce que le plan écrivait.**
3. **Le champ `espace` de `REFERENCES_SIMPLES` rendu porteur** — il aurait été une ligne morte. Ferme un trou réel que personne n'avait vu : `charpente.depart.lieu_id = "pnj.aldur-le-sage"` **résolvait** (l'identifiant existe) et passait en silence, alors qu'un personnage n'est pas un lieu. Désormais `identifiant-invalide`, avec son test.

## Le registre des refus

| refusé | motif |
|---|---|
| les quatre champs fantômes du `goal` | 0 occurrence ; décision A → n° 4/5/6. Le `goal` lui-même a été réécrit **avant** le lot : un consensus qui ne redescend pas dans le fichier lu par l'essaim n'existe pas |
| **tout opérande entier** | deux motifs indépendants : la doc des règles **ne pose aucune magnitude d'auteur** (elle *calcule* les PV et l'XP) — KR-130 ; et une magnitude sans **borne nommée** ne peut recevoir aucun test à la limite — KR-165. Le second tient même si la doc gagnait sa section |
| `modifier_bonus_defense` | il vient d'`action-pnj`, **feature supprimée** : ressusciter une sémantique effacée par un contrat que quinze features consomment |
| une 5ᵉ table pour BUG-050 | la dérivation s'adosse à deux tables **déjà maintenues pour d'autres raisons** ; une table dédiée serait le seul endroit où l'oubli passerait inaperçu |
| écrire la section « effets de climat » | inventer une règle de jeu dans une itération de **format** |
| un champ `cible` ou `grandeur` au descripteur | aucun lecteur avant la n° 9 — motif qui avait retiré `lit:` en it3 |

## Ce qui a été reporté

**n° 9** — les champs de session que les deltas écrivent (`indices_connus`, `jalons_atteints`), avec un **test-grep de réservation** : le jour où la n° 9 en écrit un, elle devra **supprimer un test**. · **n° 9/12** — les opérandes entiers, retour additif. · **n° 12** — `modifier_confiance`. · **it5** — la checklist se lit « sur chaque cible **admissible** ».

## Classement KR-162 des tests touchés

**Aucun SUPPRIMÉ. Tous PORTÉS**, et vérifié par la QA : `identifiers.test.ts` (étendu, `defineRegistre` et `decrireValeur` à leur 3ᵉ appelant) · `roundtrip.test.ts` (les `toEqual([{}])` remplacés par des vérifications typées, le deep-equal global intact) · `validate.test.ts` (« un objet aux quatre chemins passe » **inversé**, la prose refondue sur la frontière du § 3.2, seize → dix-neuf codes, `DeltaBrut` → `Delta`) · `couverture.test.ts` (étendu, en-tête réécrit). Non modifiés et toujours verts : `expr.test.ts`, `read.test.ts`, `importDossier.test.tsx`.

## Porte qualité

Prettier conforme · `tsc` **0 erreur** · `lint` **0 erreur** (1 warning pré-existant hors lot) · `jest` **49 suites / 716 tests** · mutation **sans objet** (KR-161, vérifié) · table dorée **hors jeu** — `DELTAS` ne porte aucune valeur de règle, et `docs/REGLES-DU-JEU.md` n'a **aucune modification**.

Intégrateur **CONFORME**, zéro incident. QA mode B **NON RECEVABLE** sur la définition de fini, **fermée** ici.

## Budget de contexte — relevé, publié, re-dérivé

Exigé par le § 10.8 du plan et par l'étape 4 des Build Steps. Il manquait : le mineur de la QA sur un chiffre périmé avait été fermé **en retirant sans remplacer**, ce qui laisse le cliquet s'arrêter en silence — le seul mode de panne que `CLAUDE.md` désigne lui-même comme sans bruit. Relevé à la clôture d'it4 (`wc -c`, 1 kio = 1024 o) :

| fichier | croissance | mesuré | plafond | marge |
| --- | --- | ---: | ---: | ---: |
| `CLAUDE.md` + `docs/WORKFLOW.md` | défaut | 46 022 o | 46 080 | **58 o** |
| `code-knowledge.json` | normale | 74 516 o | 76 800 | 2 284 o |
| `bug_history.json` | normale | 49 335 o | 56 320 | 6 985 o |
| `features_history.json` | normale | 66 133 o | 71 680 | 5 547 o |
| `specification.json` (dossier-format) | normale | 65 322 o | 66 560 | 1 238 o |
| `docs/ROADMAP-BASCULE-IA.md` | défaut | 33 214 o | 35 840 | 2 626 o |

**Re-dérivation appliquée : aucun plafond ne descend.** Deux voudraient *monter* — `code-knowledge.json` (81 920) et la spec (71 680) — et le **cliquet l'interdit** : un plafond ne remonte jamais parce qu'une itération avait beaucoup à dire. Ils restent où ils sont.

**Ce que ce relevé coûte à la feature** : `specification.json` a franchi son plafond **à chaque report depuis it3**, et il a fallu compacter trois fois dans ce lot — quinze décisions livrées réduites à leur renvoi, deux règles d'orchestration renvoyées vers `code-knowledge.json`, et les journaux d'it1 et it2 ramenés à leurs choix. La compaction fonctionne, mais elle coûte un tour complet à chaque itération. C'est le point 4 du `RETOUR-COMITÉ`.

## Ce que personne n'a pu vérifier

- **La fidélité de l'inventaire `DELTAS`** à `actionEngine.ts` / `usePlaySession.ts` : lecture humaine, aucun instrument.
- **Que la n° 4/5/6 rangera une future collection dans la bonne table** — le garde de BUG-050 en dérive ; un mauvais rangement le contourne sans qu'aucun test d'it4 puisse l'anticiper.
- **Que `climat[].effets_regles` n'a structurellement aucun delta admissible** : rien dans `validateDelta` ne l'empêcherait d'accepter un `donner_objet` sous un climat. C'est une correction de la checklist d'it5, pas une règle du validateur.
- **L'ordre chronologique** de la correction de BUG-050.

## `RETOUR-COMITÉ`

1. **Le comité s'est corrigé lui-même quatre fois, et jamais par un débat.** L'UX a retiré ses six entrées après avoir lu la doc des règles ; le tech-lead a mesuré que sa propre dérivation était fausse deux fois et que le plafond de 650 lignes qu'il avait posé en it3 n'existait nulle part ; le narratif a constaté que ses deux deltas portaient le défaut qu'il reprochait aux autres ; l'ouvrier a corrigé un décompte du plan. **Chaque correction est venue de quelqu'un qui est allé ouvrir un fichier.** C'est ce qui distingue un comité qui converge d'un comité qui vérifie.
2. **Une leçon d'itération est arrivée EN AMONT pour la première fois.** KR-175 (l'appartenance propre à un registre) avait été découvert en revue de PR à it3, sur un `critical`. À it4, la QA l'a exigé **au plan**, avant qu'une ligne soit écrite, parce que `DELTAS` est un registre indexé par une valeur du fichier de l'auteur — la classe exacte du défaut. C'est le seul signe fiable que la boucle de mémoire fonctionne : la leçon n'a pas eu à être repayée.
3. **Un plan peut porter un chiffre périmé contre lui-même.** Le § 8 annonçait quatre lignes mortes, le § 9 (C9) rendait la quatrième impossible — deux sections du **même document**, écrites dans le même geste, non réconciliées. Le contrôle mécanique de la porte 1 ne voit pas ça : il vérifie qu'un critère est observable, pas que deux paragraphes sont cohérents entre eux. À surveiller par l'orchestrateur, faute d'instrument.
4. **La spec de cette feature porte quarante décisions pour cinq itérations**, dont la moitié livrées, et son plafond de contexte a été franchi **à chaque report depuis it3**. La compaction fonctionne mais coûte un tour complet à chaque fois. La question qui reste ouverte, et qui n'appartient pas au comité : une décision **livrée et épinglée par un test** a-t-elle encore sa place dans le fichier que le comité relit, ou le code et sa revue suffisent-ils ?
