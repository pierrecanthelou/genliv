# Revue d'itération — `moteur-dossier` · itération `3`

> Livrée le 2026-09-24 (`0.7.3`). Plan : `.claude/raffinage/moteur-dossier-it3.plan.md` (marqué `validé`).
> Deux lots séquentiels, arbre unique : `dev-contrat` (L1) puis `dev-lot` (L2), vérification `qa` en **mode B**.

## En une ligne

**L'auteur voit un jalon de son dossier s'atteindre en cours de partie** : il tape `ALLER lieu.tour-effondree` puis `ALLER lieu.vigie-du-nord`, et `jalons_atteints : jalon.premiere-vigie` s'écrit au journal avec ses pastilles d'effet, **au même tour que la commande**.

---

## 1 — Critères

| # | Verdict | Preuve |
|---|---|---|
| **1** — `evaluerExpr` **lève** sur un `op` hors registre, nu et sous `non` | **VÉRIFIÉ** | `evaluate.test.ts` › « leve sur une entree non reconnue, NUE et sous une negation ». Nœud **fabriqué** (`{ op: 'xor' } as unknown as ExprNode`), **trois** positions (nu, sous `non`, enfoui sous un `ou`). Mutant `default: return false` **re-mesuré ROUGE par la QA** (1 échec). Discriminance : les quatre opérateurs réels répondent, les deux valeurs de vérité représentées — sans quoi les trois `.toThrow()` seraient verts sur une fonction qui lève *toujours*. |
| **2** — idempotence : deux jalons, un seul indice | **VÉRIFIÉ** | `evaluate.test.ts` › « idempotence : deux jalons, le MEME indice, une seule revelation ». Monté sur un **clone muté en test**, le disque intact. `atteints[1].deltas` porte `reveler_indice → sans_effet`, `indices_connus` sans doublon. Mutant spread inconditionnel **ROUGE sous les deux mécanismes** (3 échecs). |
| **3** — la ligne de jalon à l'écran, au même tour, avec ses pastilles | **VÉRIFIÉ**, avec une déviation nommée (§ 4) | `jalonAuJournal.test.tsx`. Côté état : 5 entrées, `origine` **undefined** sur la ligne de jalon, `deltas` exactement les deux attendus. Côté écran : `pastillesDe(ligneJalon)` par `toEqual` sur la liste entière. Clause de non-récitation **par ligne, sur `outerHTML`, drapeau `i`**, sur fragments de 3 mots **dérivés du dossier**, **avec sa sonde canari**. |
| **4** — jalons résolus à l'ouverture, oracle, table, contrôles | **VÉRIFIÉ**, écart de lettre (§ 4) | `session.test.ts` › « les jalons d ouverture sont RESOLUS avant la premiere action » + discriminance sur `dossier-reference`. Oracle : plancher **4**, re-dérivé. `controles.test.ts` : perte assertée **en négatif**, et la sonde QA (remettre `possede_objet: 'faux'`) la fait **rougir** — le silence a un propriétaire. |
| **5** — quatrième lecteur d'`ExprNode` | **VÉRIFIÉ** | `expr.test.ts` : `lecteurs` → 4, `semantiques` → 3. **Vu ROUGE avant amendement**, reproduit par la QA : la seule création d'`evaluate.ts` fait rougir `expr.test.ts:420`, une assertion et une seule. |
| **6** — table d'audience de session étendue | **VÉRIFIÉ** | `sessionCouverture.test.ts` : les 3 chemins `journal[].deltas[].*` normalisés, dispense `journal` « quatre » → **sept**, **8 racines**, `[...new Set(values)] === ['moteur']`. **`every(d => d !== 'ia')` verte et sans hunk** au `git diff -U0`. |
| **7** — point fixe borné, chaîne en ordre inverse | **VÉRIFIÉ** | `evaluate.test.ts` › « point fixe : une chaine en ordre INVERSE se resout ». Mutant passe unique **ROUGE sur la branche `inverse` SEULE**, la branche `direct` restant verte — c'est exactement le pouvoir séparateur annoncé. |

---

## 2 — Ce qui a été refusé, et pourquoi *(un diff ne le dit pas)*

- **La cellule `lieu_visite` GARDÉE** (`unJalonPeutEcrire`, proposition tech-lead) — elle aurait fait de `tourzero.ts` un **second lecteur de `charpente.jalons`**, cassant le test-grep KR-246 **au moment même où il était posé**, et exigé une correspondance `delta → champ écrit` qui n'existe dans aucun descripteur. Son seul avantage était de tenir `controles.test.ts` hors du lot : l'arête l'y faisait entrer de toute façon.
- **L'export au baril de `projeterJalonsAtteints` / `JalonAtteint`** — zéro consommateur, et exporter une valeur qui porte `enonce_texte` à toutes les features **sans garde** ouvre le verbatim sans que rien ne rougisse.
- **Un composant `JalonsAtteints.tsx`**, un panneau, un compteur — **veto UX** : rendrait `enonce_texte` sans lecteur légitime.
- **Deux lignes de journal** (jalon puis effet) — l'effet vivrait **deux fois**, en donnée et en prose, et un consommateur qui lit les deux compterait la révélation deux fois.
- **Un `catch` ou tout repli `false`** autour de l'évaluateur — rouvre exactement le faux positif que KR-238 ferme. La parade est la porte `jouable` **en amont** (KR-239), pas un filet local.
- **Ajouter un JALON neuf à `dossier-reference.json`** — un `effet[]` de plus déplace les producteurs d'`atteignabilite.ts` ; **une arête suffit**.
- **Toucher `dossier-minimal.json`** — l'oracle en dépend cellule par cellule.
- **`enonce_texte` ou `jalons[].nom` dans le journal** · **l'extension du vocabulaire aux `PredicatId`** (un prédicat est une *question*, pas un fait) · **une couleur pour distinguer `applique`/`sans_effet`** (couleur sémantique par la bande) · **un 3ᵉ membre de `RoleJournal`** · **`monde.pnj.<id>.sait`** (KR-253) · **toute ligne `'ia'`** dans `sessionDestinations.ts` (une ligne `'ia'` est une *autorisation*, pas une prévision).
- **Prouver KR-247 par un jalon rejoué** — **mécaniquement impossible** : un jalon atteint n'est jamais réévalué. D'où les deux porteurs.

## 3 — Ce qui a été reporté, et où

- **L'export de la projection** → **n° 10**, avec son premier consommateur, sa borne d'agrégat et son comportement sur handle pendant.
- **La surface d'édition de `declencheur_expr` / `effet[]`** → **`dossier-registres`** (2ᵉ occurrence de BUG-090 ; mesuré : zéro écrivain dans `src/features/**`).
- **« Un handle pendant s'expose, jamais il ne se filtre »** → **aucun KR du dépôt ne le porte** ; écrit en toutes lettres, à armer par la n° 10. La n° 9 rend `enonce: ''` pour un handle pendant — la *politique* appartient à la n° 10.

---

## 4 — Écarts assumés

1. **BUG-124 — le plan portait une affirmation fausse.** Le § 7 commandait « `evaluate.ts`, seul lecteur de `charpente.jalons` **du dépôt** » : ils sont **trois** en position de code (`atteignabilite.ts:217`, `sections.ts:144`, `evaluate.ts:189`). **Le test serait né rouge.** Remplacé par une garde plus forte et vraie — recensement par valeur des trois porteurs, plus **porteur unique** de `.enonce_texte` et `.declencheur_expr`, ce que KR-246 protège réellement. La QA a posé la sonde : une lecture ajoutée dans `sections.ts` la fait rougir nommément. L'ouvrier avait recopié la phrase en docstring, **fausse dans ses deux moitiés** — corrigée sur la portée réellement tenue. → **KR-258**.
2. **BUG-125 — le « Étant donné » du critère 3 était insatisfiable.** `dossier-reference.json` n'est **pas `jouable`** (contrôle bloquant `depart-desert`). Le comité avait mesuré l'atteignabilité du jalon dans le graphe des accès — et fait entrer l'arête pour ça — mais **personne n'a rejoué la porte en amont**, que le plan nomme pourtant à l'arbitrage A-8. Le témoin sème un habitant au départ par `brain.dossiers.update` (chemin public, par spread) ; **le disque n'est pas touché**, et la bascule `jouable` false→true est **mesurée dans le témoin**, donc elle rougira si `depart-desert` change. **Le « Étant donné » réel est : `dossier-reference.json` PLUS un habitant placé au lieu de départ.**
3. **`validate.test.ts` modifié hors liste de lot** — incident de discipline relevé par la QA. Territoire L1, disjonction intacte, contenu mécanique (la carte des `acces` passe de 3 à 5). Mais le plan listait `controles.test.ts` explicitement **pour la même raison** ; celui-ci a été omis.
4. **`tourzero.test.ts` est à 9/9, non 8/8** comme le critère 4 l'écrivait — le balayage des sept n'exerce que le **premier** bras de la cellule devenue trivalente. Et **deux** témoins Kleene ont dû être réassignés, pas un : `FAUX` (`possede_objet` → `pnj_a_revele`, prévu par A-7) **et** `INDECIS` (`lieu_visite` → `evenement_consomme`, non prévu).
5. **`resoudreJalons` rend deux champs, non trois.** Le § 5 écrivait `{ faits, atteints, deltas }` ; les `deltas` sont **descendus sur `JalonResolu`**, parce que le § 3.A impose une entrée de journal **par jalon**. Un `deltas` plat serait soit une seconde écriture de la même donnée, soit un tableau parallèle à invariant d'alignement non écrit. Sans effet sur L2 : le type ne sort pas du baril.
6. **`DELTA_DU_JALON_ATTEINT` ajouté à `deltas.ts`**, non prévu — le § 7 interdit tout identifiant de registre en chaîne dans `evaluate.ts`, or la passe doit émettre `atteindre_jalon`.
7. **`integrateur` non lancé.** L'exécution séquentielle en arbre unique n'a produit **aucun worktree à fusionner** ; le contrôle de propriété des fichiers et la porte globale ont été faits mécaniquement par l'orchestrateur (§ 6). Lancer un fusionneur sur zéro branche aurait été un instrument incapable d'échouer.
8. **Régression produit assumée** : la règle `objectif-perdu-a-l-ouverture` perd son vrai positif `objectif.proteger-le-sceau`. Direction permise (silence, jamais alerte fausse), **assertée en négatif** par un test qui **sait échouer** — sonde QA vérifiée.

**Aucun `BLOCAGE` non résolu.**

### 4 bis — Revue de PR : `REQUEST CHANGES`, puis corrigé

Le tech-lead a rendu **1 `major` + 3 `minor`**, sans veto architectural (ni import inter-features, ni contournement de contrat `brain/`, ni seconde source de vérité). **Les quatre sont corrigés.**

- **`major` — BUG-126**, la prémisse rétrécie sans garde (§ 5). C'est le seul des sept trous déclarés par cette revue qui était un **défaut** et non une limite — et la revue elle-même le classait à tort en limite.
- **`minor`** — l'invariant « `atteints` vide ⇒ `faits` est la MÊME référence », sur lequel `commandes.ts` s'appuie, n'était écrit **nulle part sur le contrat** : un appelant s'appuyait sur un détail d'implémentation du callee. Écrit sur `ResolutionJalons`.
- **`minor`** — `appliquerDelta` qualifiée comme ses trois sœurs (A-8 en faisait un livrable du lot ; la troisième fonction du même chemin avait été oubliée).
- **`minor`** — `avecDossierNeutre()`, abstraction à un seul appelant rendant une constante déjà en portée : inlinée.

**Ce que la PR apprend sur le découpage, et que le § 8 reprend** : `dossier-reference.json` est lu par **treize suites**. Un lot qui liste une fixture partagée doit lister **l'ensemble de ses lecteurs, dérivé du disque** — `controles.test.ts` avait été listé, `validate.test.ts` non. C'est l'énumération manuelle qui a échoué, pas la vigilance.

---

## 5 — Ce qu'AUCUN instrument ne tient *(la partie qu'un relecteur ne peut pas deviner)*

- **Les quatre cellules `indecidable` de `tourzero.ts` ne sont confrontées à aucun état réel.** L'oracle les tait **par construction** (solidité seule) — la QA l'a prouvé en dumpant ses 4 assertions. Elles **sont** épinglées par `VALEUR_ATTENDUE` dans `tourzero.test.ts`, mais **contre un double d'elles-mêmes** : cet épinglage prouve la **cohérence**, jamais la **justesse**. *(La prose livrée sur-affirmait « assertées par AUCUN instrument » ; corrigée.)*
- ~~**`pnj_a_revele: 'faux'` n'est gardé par rien.**~~ → **CORRIGÉ à la revue de PR, BUG-126** (`major`). Le tech-lead a vu ce que ni le comité ni la QA n'avaient vu : **la prémisse a été RÉTRÉCIE PAR CE DIFF MÊME**. Avant it3 la cellule reposait sur la clause LARGE de H6 ; it3 la tue et lui substitue « `reveler_indice` est d'arité 1, sans opérande `pnj` » — le motif exact pour lequel ses **deux voisines** ont été dégradées en `indecidable`, alors que celle-ci restait déterminée. La garde sœur ne couvrait pas le cas, **mesuré** : `'pnj'` EST dans l'union des `refKinds` de `PREDICATES`. Garde dérivée du registre ajoutée à `deltas.test.ts`, **vue ROUGE nommément** sous le mutant `refKinds: ['pnj','indice']`, fichier restauré et **md5 vérifié**. KR-259 passe de note à **cliquet**.
- **KR-243** : `evaluate.ts`, les `ecrit` de `deltas.ts` et la passe sont **hors du score de mutation**. `jest` est leur **unique** instrument — d'où les 7 mutants écrits à la main, dont **6 re-mesurés par la QA**. Aucun rapport de couverture n'a été lancé : les trous autres que ces 6 ne sont pas mesurés.
- **« PURE, totale » est devenue CONDITIONNELLE** — *totale sur un dossier accepté par `validateDossier`*. **La précondition est structurellement tenue sur le seul chemin de production, et c'est MESURÉ** (revue de PR) : `DossierService.get` rend `null` sur un document non conforme, et `EcranPartie.tsx:97-99` refuse un dossier non `jouable` **avant** `ouvrirSession`, tenu par `porteJouable.test.tsx`. À lire comme mesuré, non supposé. `appliquerDelta` était **la seule des quatre fonctions du chemin** à ne pas qualifier sa totalité (`minor` de la PR) — corrigé.
- **Le rendu visuel des pastilles.** `jsdom` ne rend rien. Le témoin compare l'attribut `style` des deux pastilles **entre elles** (BUG-084 évité), mais que `metaJournal` produise un rendu lisible à côté de `[origine]` n'est vérifié par **aucun** instrument du dépôt.
- **Portée réelle de la garde KR-246** : `fichiersDuModule()` ne lit que `src/brain/dossier/*.ts` non-test. Un lecteur dans `src/features/**` ou `src/player/**` lui est **structurellement invisible** — et il en existe un, légitime : `dossier-registres/hooks/useEcritureJalons.ts`.
- **Nuance sur le baril** : l'identifiant `FaitsDeSession` ne sort pas, mais **le type** est public via `export type { FaitsDeSession as EtatMonde }`, déjà le cas depuis it1. Aucune surface neuve — mais la garantie est **nominale, pas structurelle**.

---

## 6 — Diff par lot, comparé au plan

**L1 `faits-evaluateur-jalons` (`contrat`)** — (N) `faits.ts` · `evaluate.ts` · `evaluate.test.ts` — (R) `predicates.ts` · `deltas.ts` · `deltas.test.ts` · `expr.test.ts` · `session.ts` · `session.test.ts` · `commandes.ts` · `commandes.test.ts` · `sessionDestinations.ts` · `__fixtures__/session-saturee.ts` · `sessionCouverture.test.ts` · `tourzero.ts` · `tourzero.test.ts` · `tourzeroOracle.test.ts` · `controles.test.ts` · `__fixtures__/dossier-reference.json` · `brain/index.ts` · `docs/EXIGENCE-APERCU-DU-JEU.md` · **`validate.test.ts` (hors liste, § 4.3)**.

**L2 `jalon-au-journal`** — (R) `JournalRow.tsx` (+32/−1, 79 lignes) · (N) `tests/jalonAuJournal.test.tsx`. **`deplacement.test.tsx` non touché** (prévu « si rouge », il est resté vert — mesuré). `EcranPartie.tsx` **inchangé**, aucun composant neuf.

**Propriété disjointe : vérifiée.** L1 ∩ L2 = ∅. Tous les INTERDITS du § 5 **absents du diff** : `types.ts`, `destinations.ts`, `validate.ts` (module), `controles.ts` (module), `atteignabilite.ts`, `couverture.test.ts`, `feuilles.ts`, `dossier-minimal.json`, `src/player/**`.

## 7 — Porte qualité

| | |
|---|---|
| `npx tsc --noEmit` | **0** |
| `npm run lint` | **0 erreur** (1 warning préexistant, `src/player/components/CharacterCreationScreen.tsx`, hors diff) |
| `npx jest` | **121 suites / 1870 tests, verts** (1869 avant la garde de BUG-126) |
| `npm run test:mutation` | **NON lancé — et c'est mesuré, pas déduit** : `git diff --stat` sur les 4 fichiers de `FICHIERS_MUTES` rend une sortie **vide** (KR-243) |
| `evaluate.ts` | **243 lignes** (< 400, KR-112) — `jalons.ts` non nécessaire, nom resté libre |
| État dérivé (KR-013/113) | **zéro site neuf** ; les 7 remontées du relevé sont toutes préexistantes et hors diff |

**Budget de contexte, relevé et payé dans ce lot-ci** :

| Fichier | Avant | Après | Plafond | Marge |
|---|---:|---:|---:|---:|
| couple `CLAUDE.md`+`WORKFLOW.md` | 46 066 | **46 063** | 46 080 | 17 o |
| `code-knowledge.json` | 67 649 | **69 042** | 71 680 | 2,58 kio |
| `bug_history.json` | 13 101 *(dépassé)* | **9 678** | 10 240 | 562 o |
| `features_history.json` | 11 934 | **14 950** | 25 600 | 10,40 kio |
| `moteur-dossier/specification.json` | 67 630 *(dépassé)* | **65 263** | 66 560 | 1,29 kio |
| `docs/ROADMAP-BASCULE-IA.md` | 30 660 | **30 184** | 30 720 | 536 o |

Trois compactions **payées dans ce lot**, jamais reportées : la spec (33 décisions **livrées** réduites à leur phrase d'arbitrage + renvoi, après vérification que leur motif est bien dans les revues), le roadmap (motifs d'une décision livrée sortis vers les revues, **−476 o tout en inscrivant it3**), et la **scission** de `bug_history.json` → `bug_history.moteur-dossier.json` (9ᵉ journal). Plafonds re-dérivés par la formule, **plancher append-only inclus** : `bug_history` 10 kio (5 × BUG-124 = 8 675), `features_history` 25 kio (5 × `dossier-copilote` = 21 480). Aucun ne monte.

---

## 8 — `RETOUR-COMITÉ`

1. **Le plan a affirmé deux fois sans mesurer, dans le plan même dont le § 7 recopie la règle.** Une **phrase de portée** (« seul lecteur de X du dépôt ») et une **précondition citée sans être exercée** (`jouable`, nommée à l'arbitrage A-8). Les deux ont traversé deux tours de comité, la porte mécanique et la relecture. **Le geste manquant est le même dans les deux cas : un `grep` et un `jest`, quelques secondes chacun.** → KR-258, et à porter à l'étape 0 du prochain raffinage : *tout « seul / unique / aucun » et tout « Étant donné <fixture> » se mesurent avant d'entrer au plan.*
2. **Le comité a mesuré la bonne chose au mauvais niveau.** La réserve n° 1 du narratif — « aucune fixture ne peut atteindre un jalon après une commande » — était juste, a été mesurée, et a fait entrer l'arête. Mais elle portait sur le **graphe des accès**, une couche en dessous de la **porte d'entrée**. Mesurer une couche n'immunise pas celles d'au-dessus.
3. **L'ordre causal peut coïncider avec l'ordre alphabétique** : sur la fixture, `atteindre_jalon` précède ses voisins, donc un tri y est **indétectable**. Le témoin qui sépare est celui monté sur une **entrée fabriquée** — l'ouvrier l'a vu seul, et la QA a confirmé que c'est bien lui qui rougit. Famille BUG-113 : *un résultat ne discrimine que dans un état du monde où les candidats divergent.*
4. **Un arbitrage structurant peut manquer sans que personne ne le voie** : « qui écrit `jalons_atteints` » n'a été tranché ni par les cinq rôles ni par le plan, et **les deux formes compilent**. Il a fallu mesurer que `atteindre_jalon` est un `DeltaId` pour que la question existe. → à l'étape 4 du raffinage, pour chaque champ d'état écrit par la tranche : **nommer son écrivain unique**.
5. **Une prémisse peut être RÉTRÉCIE par la tranche elle-même sans que personne ne le voie.** `pnj_a_revele` a survécu à deux tours de comité, à la QA en mode B et à cette revue — qui l'a même écrite comme une *limite assumée* — parce que tout le monde a vérifié que la nouvelle prémisse était VRAIE, et personne qu'elle était TENUE. → quand une tranche dégrade une hypothèse large en hypothèse étroite, **l'hypothèse étroite repart avec sa garde dans le même lot**, ou la cellule suit ses voisines.
6. **Le découpage 2 lots / arbre unique était le bon** : zéro collision, zéro relais entre ouvriers, zéro fusion. Le lot `contrat` a absorbé 21 fichiers et rendu une signature que L2 a consommée sans une question. Le prix payé est ailleurs — dans les **deux affirmations non mesurées du plan**, pas dans le parallélisme.
