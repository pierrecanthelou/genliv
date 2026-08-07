# Tour 1 — QA · `dossier-format` it3

**RISQUE** — `contre_mesures[].declencheur` est cité comme sixième famille par D1 (`docs/ROADMAP-BASCULE-IA.md` § D1) mais **n'existe nulle part dans le dépôt** : ni racine dans `types.ts`, ni ligne dans `RACINES`, ni dans `DESTINATION_DES_CHAMPS`. Le seul autre point où le terme apparaît est « armement des contre-mesures » au lot n° 14 `moteur-horloge` (Temps 2). Sans forme fixée maintenant, aucune matrice de rejet ne peut se rédiger pour cette famille — le risque n'est pas le code, c'est un critère qui se rédigerait APRÈS coup faute de contrat écrit ici (KR-158 exactement).

**OBJECTION** — `couverture.test.ts` (le balayage de corruption) ne corrompt que des **feuilles scalaires**, jamais un conteneur entier. Un `ExprNode` est récursif : `enfants[]` manquant, un `non` à deux enfants, un enfant remplacé par une feuille non-`ExprNode` — aucune de ces corruptions n'est produite par le balayage actuel, qui répète leaf par leaf sans jamais muter la forme du conteneur. C'est le même angle mort que BUG-049 (KR-173), pas encore nommé pour it3 alors que la **condition d'entrée (c) posée par it2 le dit explicitement**.

**PROPOSITION** — (1) le `tech-lead` fige la forme de `contre_mesures` dans ce tour, sinon elle sort **explicitement** vers it4/it5 plutôt que de rester un critère fantôme ; (2) une table `ARITES_EXPR` dédiée (hors `sitesDe`, qui ne l'exprime pas) avec ses cas testés à l'arité exacte et arité±1 pour `non`/`pred` (KR-165) ; (3) une constante `MAX_PROFONDEUR_EXPR` **nommée**, ou son absence justifiée par écrit — sinon aucune borne sur une donnée récursive.

**VERDICT** — recevable sous réserve : `contre_mesures` figée ou reportée nommément, et l'angle mort du balayage de couverture nommé ou couvert avant le tour 2.

---

## ANNEXE — Matrice de rejet exigée (KR-158, écrite avant le code)

| Entrée fautive | Code attendu | Canal | `location` doit nommer |
|---|---|---|---|
| `canon.objectifs[].reussi_si` référence une entité absente | `reference-pendante` | error | « Objectif « {nom} » » (repli « Objectif n°{index} (sans nom) ») |
| `canon.objectifs[].echoue_si` référence une entité absente | `reference-pendante` | error | idem, `path` distinct |
| `charpente.fins[].condition` référence une entité absente | `reference-pendante` | error | « Fin « {nom} » » |
| `charpente.fins[]` porte `condition_texte` sans `condition` | code NEUF (nom à trancher, ex. `condition-sans-expr`) | warning | « Fin « {nom} » » |
| `charpente.jalons[].declencheur` référence une entité absente | `reference-pendante` | error | « Jalon « {nom} » » |
| `charpente.jalons[]` porte `declencheur_texte` sans `declencheur` | même code neuf | warning | « Jalon « {nom} » » |
| `monde.evenements[].declencheur` référence une entité absente | `reference-pendante` | error | « Événement « {nom} » » |
| `monde.personnages[].plan_actions[].declencheur` référence une entité absente | `reference-pendante` | error | « Personnage « {nom} » » (pas l'étape) |
| `contre_mesures[].declencheur` référence une entité absente | **INDÉTERMINÉ** — conteneur non typé | **BLOQUANT KR-158** tant que non tranché | idem |
| `ExprNode.op` hors `{et, ou, non, pred}` | code neuf (`op-inconnu`) ou `valeur-hors-enumeration` réutilisé — à trancher, jamais improvisé au code | error | le champ porteur |
| `{op:'pred', pred}` avec `pred` absent de `PREDICATES` | `reference-pendante` ou code neuf `predicat-inconnu` — à trancher | error | idem |
| `{op:'pred', args}` d'arité ≠ `PREDICATES[pred].arity` | code neuf `arite-invalide` | error | idem |
| `{op:'pred', args[i]}` hors des `refKinds` attendus | `identifiant-invalide` ou `reference-pendante` — à trancher | error | idem |
| `{op:'non', enfants}` avec `enfants.length !== 1` | `arite-invalide` | error | idem |
| `{op:'et'\|'ou', enfants: []}` (0 enfant) | **cas limite non arbitré** | à trancher | idem |
| Expression au-delà de `MAX_PROFONDEUR_EXPR` | code neuf ou décision explicite de « pas de borne » | à trancher | idem |

## Tests nommés exigés

- `expr.test.ts` — `validateExpr refuse un op hors {et, ou, non, pred}` (unitaire, KR-117/KR-164)
- `expr.test.ts` — `validateExpr refuse un pred absent de PREDICATES` (unitaire, KR-117)
- `expr.test.ts` — `validateExpr refuse une arite differente de celle du descripteur, aux bornes arity-1/arity/arity+1` (unitaire, KR-165)
- `expr.test.ts` — `validateExpr refuse un non a 0 ou 2 enfants` (arête de **conteneur**, pas de feuille)
- `expr.test.ts` — `collectRefs collecte toutes les references d un arbre imbrique sur au moins 3 niveaux` (propriété « total », KR-169)
- `validate.test.ts` — un test **PAR FAMILLE** : `…_expr referencant un identifiant absent est bloquant et nomme le champ porteur + l identifiant fautif` — échoue **par nom de famille absente**, même patron que la checklist de suffisance de KR-157 (KR-021/KR-164)
- `validate.test.ts` — `un …_texte sans …_expr produit un avertissement non bloquant, jamais une erreur` (D1, assertion négative KR-162 : `ok` reste `true`)
- `couverture.test.ts` — 4ᵉ assertion **étendue aux tables neuves d'it3** (condition d'entrée it2-a)
- `couverture.test.ts` — corruption **structurelle** des conteneurs `ExprNode`, **ou** note explicite de non-couverture dans le docstring du fichier (KR-173 / condition d'entrée it2-c)
- test-grep — `op` n'est interprété qu'au **SEUL** site `validateExpr`, aucun `if`/`switch` sur `op` ou `pred` ailleurs dans `brain/` (KR-117/KR-169)
- `roundtrip.test.ts` — un dossier portant les familles, dont au moins un arbre `et`/`ou`/`non`/`pred` sur deux niveaux, se réexporte à l'identique (lecture FICHIER réelle, KR-156)
- `couverture.test.ts` (assertion destination) — chaque `…_expr` a une destination déclarée `moteur`, jamais `ia`

**Non couvert par aucun instrument existant tant que non tranché** : `contre_mesures[]` (forme absente), le code exact des trois anomalies neuves, et la borne de profondeur d'`ExprNode` — à rapporter comme NON VÉRIFIÉ en revue B si le plan les laisse implicites.
