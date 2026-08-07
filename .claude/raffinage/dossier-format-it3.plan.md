# Plan d'itération — `dossier-format` · itération `3`

> **VALIDÉ** par l'auteur du produit le 2026-08-06. Porte 1 (mécanique) verte, porte 2 (humaine) franchie. Reporté dans `src/features/dossier-format/specification.json`.

**Composition du comité** : les quatre rôles socles **+ `narratif-ia`**.
**Motif** : l'itération pose le langage de conditions que le moteur évaluera au Temps 2 et ajoute dix champs au schéma du dossier d'aventure — frontière code/IA, contrat de sortie aval, destinations d'injection. L'omettre laissait `PREDICATES` se remplir sans gardien.

**Tours tenus** : tour 1 et tour 2, cinq rôles, notes dans `.claude/raffinage/dossier-format-it3/`. Aucune note sans objection. **Aucun `ESCALADE`** : les quatre vetos émis sont tous dans le domaine de leur émetteur et tous `RETENU`.

---

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

**Phrase de démo** — À la fin de cette itération, l'auteur peut voir refusée une condition qui référence une entité inexistante.

**La tranche** — Il n'y a pas d'écran : la tranche va du **fichier JSON déposé** (`dossier-minimal.json`, lu du disque) au **rapport d'anomalie rédigé** que la modale d'import affiche déjà, en traversant le type (`ExprNode`), le registre (`PREDICATES`), le validateur de forme (`validateExpr`), la résolution référentielle (`collectRefs` × `collectIds`) et la persistance (le round-trip import → export). L'affordance d'import existante rend le résultat sans qu'une ligne de `src/features/` change.

**Les lots**

| id | titre | fichiers | type |
|---|---|---|---|
| 1 | `contrat-dossier-it3` | 15 (4 N / 11 R) | **`contrat`** |

Un seul lot, et c'est une contrainte, pas un choix : tout fichier de code touché vit dans `brain/`, donc tout lot serait `contrat` — or un lot `contrat` s'exécute seul et en premier, et deux « premiers » est une contradiction déjà tranchée en it1. Couper autrement nommerait `types.ts` ou `validate.ts` deux fois, ou séparerait les tests de leur code.

**Hors périmètre** — la sixième famille `contre_mesures[]` (→ n° 4) · l'évaluation `evaluate(state, expr)` (→ n° 9) · toute UI de composition de condition (→ n° 3/6/7) · le champ `lieux[].acces` (→ n° 5, son orientation étant tranchée ici à coût nul) · l'élément de liste non-objet qui traverse le validateur (→ it4, journalisé BUG-050) · l'affordance de téléchargement (→ raffinage d'it5) · tout parseur d'expression, sous quelque nom que ce soit.

**Reports et innovation**

- `REPORTÉ n° 4` — la famille `contre_mesures[].declencheur_expr` : elle vit **sous `personnages[]`**, pas en racine ; elle arrive avec sa feature éditrice, en quatre lignes.
- `REPORTÉ n° 7` — l'alerte « `…_expr` sans `…_texte` » : trou de documentation d'auteur, affaire du linter, pas du validateur.
- `REPORTÉ n° 9/12` — les prédicats à opérande entier (`confiance_au_moins`, `tour_au_moins`, `etape_plan_au_moins`) et le champ `lit: CheminDeSession[]`.
- `REPORTÉ it4` — BUG-050, journalisé **dans ce lot**, corrigé au suivant.
- `REPORTÉ raffinage d'it5` — nommer l'itération qui livre le téléchargement, ou retirer la promesse d'export du `goal`.
- **`INNOVATION` : aucune.** Le budget d'une par itération n'est pas consommé — le seul candidat (`lit: CheminDeSession[]`) a été retiré par son propre auteur.

**Plan écrit dans `.claude/raffinage/dossier-format-it3.plan.md`. Valide, ou dis ce qui doit changer.**

---

## 1 — But raffiné

> L'auteur peut voir refusée une condition qui référence une entité inexistante.

Le `goal` de la spec est **purgé de deux scories** relevées au tour 1 :

- « le type `Revelation` à portes » en sort : il est **livré depuis it2** (`types.ts:135`). Le laisser dans le `goal` fait dupliquer du travail fait ou gonfler un critère sur du déjà-livré.
- « les **six** familles » devient « les **cinq** familles » : la sixième n'a pas d'hôte dans le dépôt (voir § 8, désaccord C1).

`ExprNode`, `PREDICATES`, `validateExpr` et `collectRefs` ne sont pas un second livrable : ils sont l'**outillage qui rend cette phrase vraie**.

## 2 — Hors périmètre

1. **`contre_mesures[]`** — n'existe nulle part dans le dépôt : ni type, ni racine, ni ligne de table. La créer sans feature éditrice est la « forme sans producteur ni consommateur » que la décision A interdit nommément.
2. **`evaluate(state, expr)`** — déjà rejeté en it1 ; part en n° 9 comme **champ du descripteur**, jamais un `switch` sur `PredicatId`.
3. **Toute UI de composition de condition** — `Select` alimenté par `label`, `TargetPicker` filtré par `refKinds` : c'est le rendu piloté par le registre, il arrive avec les écrans (n° 3/6/7). Aucun `Field` ne se lie jamais à une syntaxe d'expression (KR-168).
4. **`lieux[].acces`** — le champ appartient à la n° 5. Son **orientation** est tranchée ici (§ 8, C10) parce qu'elle coûte zéro ligne ; le champ, non.
5. **L'élément de liste non-objet** (`savoirs: ["du texte"]` sort `ok:true`) — défaut réel, même famille que BUG-049, hors de la tranche : il se corrige par une table dédiée en it4. **Journalisé BUG-050 dans ce lot.**
6. **L'affordance de téléchargement** — `downloadJson` reste sans appelant ; à trancher au raffinage d'it5.
7. **Tout parseur.** `parseExpr` sous quelque nom que ce soit, et **tout élargissement de la grammaire de `sitesDe`** (segments pointés et `[]`, rien d'autre) : les deux réintroduisent une grammaire à spécifier, versionner et tester.
8. **Le score de mutation** — aucun des quatre fichiers mutés n'est touché (KR-161).

## 3 — Contrat de design

Il n'y a **aucune surface neuve** : la modale d'import d'it1 rend ces anomalies telle quelle, par `DOSSIER_ISSUE_LABELS` + `dossierIssueRemediation`. Ce que l'itération écrit, ce sont des **textes**, et ils sont arbitrés ici, pas au code.

**Aucune valeur visuelle n'est introduite** — pas un fichier CSS, pas un composant, pas un token : le lot ne touche ni `styles.css`, ni `tokens/`, ni `components/`, ni `src/features/`. La règle « jamais une couleur en dur » n'a aucun site d'application ici, et le linter le vérifiera à vide.

### 3.1 — Casse et vocabulaire des clés (tranché, UX)

`snake_case` et **français jusqu'à la clé** — le croquis initial écrivait `args` / `arg` / `refs`, de l'anglais dans un document que l'auteur tape à la main jusqu'à la n° 3.

| rôle | clé retenue | jamais |
|---|---|---|
| opérateur | `op` | — |
| enfants d'un `et` / `ou` | `enfants` | `args` |
| enfant unique d'un `non` | `enfant` | `arg` |
| identifiant du prédicat | `predicat` | `pred`, `predicateId` |
| références du prédicat | `cibles` | `refs`, `args` |

`cibles` reste un **tableau même à l'arité 1** : le prédicat d'arité 2 (`pnj_a_revele`) ne cassera pas le type le jour où il entre.

### 3.2 — La matrice de rejet (KR-158 — écrite AVANT le code)

Quatre codes neufs, union `DossierIssueCode` **12 → 16**. Les deux cas de référence réutilisent des codes **existants** : une cible mal formée est le même défaut qu'un identifiant d'entité mal formé, une cible non portée est le même défaut qu'une référence pendante.

| entrée fautive | `code` | canal | QUOI (interpolé au site d'appel) |
|---|---|---|---|
| `op` hors `{et, ou, non, predicat}` | `expr-malformee` | error | « Le champ « `{champ}` » utilise l'opérateur « `{valeur}` », qui n'existe pas (attendu : et, ou, non ou predicat). » |
| clé inconnue sur un nœud | `expr-malformee` | error | « Le champ « `{champ}` » contient une clé « `{clé}` » que les conditions ne reconnaissent pas. » |
| profondeur > `PROFONDEUR_MAX_EXPR` | `expr-malformee` | error | « Le champ « `{champ}` » imbrique les conditions trop profondément (maximum `{n}` niveaux). » |
| `predicat` absent de `PREDICATES` | `predicat-inconnu` | error | « Le champ « `{champ}` » utilise le prédicat « `{valeur}` », qui n'existe pas dans le registre des conditions. » |
| `cibles.length` ≠ `refKinds.length` | `arite-invalide` | error | « Le champ « `{champ}` » fournit `{n}` cible(s) au prédicat « `{label}` », qui en attend `{attendu}`. » |
| `et` / `ou` à moins de 2 `enfants` | `arite-invalide` | error | « Le champ « `{champ}` » utilise « `{op}` » avec `{n}` condition(s) : il en faut au moins deux. » |
| `non` sans `enfant` | `arite-invalide` | error | « Le champ « `{champ}` » utilise « non » sans condition à nier : il en faut exactement une. » |
| cible dont l'espace de noms ≠ `refKinds[i]`, ou mal formée | `identifiant-invalide` *(existant)* | error | « Le champ « `{champ}` » fournit « `{valeur}` » au prédicat « `{label}` », qui attend une référence de type « `{libellé de l'espace}` ». » |
| cible bien formée qu'aucune entité ne porte | `reference-pendante` *(existant)* | error | « Le prédicat « `{label}` » de « `{champ}` » pointe « `{valeur}` », qui n'existe pas dans ce dossier. » |
| `…_texte` présent sans son `…_expr`, sur une **fin** ou un **objectif** | `condition-sans-expr` | **warning** | « Le champ « `{champ}` » décrit une condition en prose, mais aucune condition structurée correspondante n'est posée : elle ne sera jamais vérifiée automatiquement. » |

**OÙ (`location`), pour toutes les lignes** : l'entité qui **PORTE** le champ fautif — Objectif, Fin, Jalon, Événement, et **le Personnage** pour `plan_actions[]` (jamais l'étape, qui n'a pas de nom). Jamais le nœud d'expression, qui n'en a pas non plus.
**`path`, pour toutes les lignes** : le chemin du champ **porteur** (`charpente.fins[0].condition_expr`). Il **ne descend jamais** dans l'arbre — le seul consommateur déclaré (le badge de section de la n° 7) ne sait pas badger un sous-nœud, et `feuilleDe(path)` doit rendre la clé que l'auteur cherchera dans son fichier.

### 3.3 — QUOI FAIRE : quatre lignes de registre, quatre consignes distinctes

Le tech-lead objectait que quatre codes produiraient « quatre fois la même ligne ». Réponse par construction — elles disent quatre gestes différents :

```ts
'expr-malformee':     '↪ Corrigez la forme de « {champ} » dans le fichier (opérateur, clé ou imbrication), puis réimportez-le.',
'predicat-inconnu':   '↪ Remplacez le prédicat de « {champ} » par l’un de ceux que le moteur reconnaît, puis réimportez-le.',
'arite-invalide':     '↪ Ajustez le nombre de cibles ou de conditions de « {champ} », puis réimportez-le.',
'condition-sans-expr':
  '↪ Ajoutez la condition structurée correspondante si le moteur doit la vérifier, ou laissez tel quel si elle reste une intention d’auteur.',
```

Les marqueurs `{racine}` et `{champ}` restent les **deux seuls** du registre, résolus par `dossierIssueRemediation`. Les marqueurs de la colonne QUOI (`{valeur}`, `{label}`, `{n}`) sont interpolés au site d'appel et **ne transitent jamais** par le registre.

### 3.4 — `PREDICATES` : sept entrées, et la propriété qu'elles achètent

Règle d'admission appliquée (relevé, pas conception) : un prédicat n'entre que si **un champ nommé de l'état de session** y répond, et si **tous ses arguments sont des identifiants stables**.

| id | `label` | `refKinds` | ce qui y répond |
|---|---|---|---|
| `possede_objet` | « possède l'objet » | `['objet']` | déjà implémenté : `sessionEngine.filterChoicesByPrereq` |
| `indice_connu` | « connaît l'indice » | `['indice']` | `monde.indices_connus[]` ; alimenté par la sortie R4 |
| `jalon_atteint` | « le jalon est atteint » | `['jalon']` | `monde.jalons_atteints[]` |
| `lieu_visite` | « le lieu a été visité » | `['lieu']` | `monde.lieux_visites[]` |
| `lieu_courant_est` | « se trouve dans le lieu » | `['lieu']` | `monde.lieu_courant` |
| `evenement_consomme` | « l'événement a déjà eu lieu » | `['evenement']` | `monde.evenements_consommes[]` |
| `pnj_a_revele` | « le personnage a déjà révélé l'indice » | `['pnj','indice']` | `monde.pnj.<id>.a_dit[]` |

Le **seul prédicat d'arité 2 est délibéré** : sans lui, la dérivation `refKinds.length` et le `TargetPicker` par position restent des théories.

**La propriété qu'aucune docstring n'aurait garantie** : tout `refKinds[i]` est un espace ayant une ligne dans `COLLECTIONS_IDENTIFIEES`, et `bestiaire` n'en a pas. Donc **aucun prédicat ne peut désigner un monstre, donc aucun ne peut ouvrir un combat** — mécaniquement, pas par convention. Épinglé par un test.

**Écartés, motif à lever avant réouverture** : `jet_reussi` / `carac_au_moins` (**veto** — un jet n'évalue pas, il ÉMET une demande qui change le tour ; un évaluateur qui en contient lance le dé) · `quete_achevee` (aucun état de quête en session) · `objectif_atteint` (circulaire : un objectif EST défini par son `reussi_si_expr`) · `confiance_au_moins`, `tour_au_moins`, `etape_plan_au_moins` (opérande entier — reportés n° 9/12, leur retour est additif) · `etat_heros(…)` (vocabulaire non fermé → l'argument redeviendrait un nom libre) · `atteignable(lieu)` (calcul de linter n° 7).

### 3.5 — Destinations : dix lignes neuves, **zéro** ajoutée à l'ensemble injecté

| clé | destination | motif |
|---|---|---|
| `canon.objectifs[].reussi_si_expr` | `moteur` | seule autorité sur ce qui se déclenche (D1) |
| `canon.objectifs[].reussi_si_texte` | `auteur` | = l'expr en français ; injecté, il apprend au modèle à **faire réussir** l'objectif |
| `canon.objectifs[].echoue_si_expr` | `moteur` | |
| `canon.objectifs[].echoue_si_texte` | `auteur` | pire : conduire à l'échec |
| `charpente.fins[].condition_expr` | `moteur` | jumeau de `condition_texte`, déjà `auteur` |
| `charpente.jalons[].declencheur_expr` | `moteur` | jumeau de `declencheur_texte`, déjà `auteur` |
| `monde.evenements[].declencheur_expr` | `moteur` | |
| `monde.evenements[].declencheur_texte` | `auteur` | injecté, le narrateur **provoque** l'embuscade |
| `monde.personnages[].plan_actions[].declencheur_expr` | `moteur` | l'avancement d'étape est n° 14, du code |
| `monde.personnages[].plan_actions[].declencheur_texte` | `auteur` | à ne pas confondre avec `plan_actions[].action`, qui reste `ia` |

**Réservé n° 4 `dossier-fiches`**, écrit ici en **commentaire** pour que personne ne le re-dérive — jamais des lignes de table : `personnages[].contre_mesures[].action` → `ia` · `…declencheur_expr` → `moteur` · `…declencheur_texte` → `auteur` · `…delai` → `moteur` · `…portee` → `moteur`. Aucun espace de noms : le OÙ est le Personnage porteur, exactement comme `savoirs[]` et `plan_actions[]`.

### 3.6 — JSDoc à exemple écrit (l'auteur tape ce JSON à la main jusqu'à la n° 3)

```ts
/** ExprNode — quatre opérateurs français, union exhaustivement vérifiée par le
 *  compilateur (KR-117), jamais un registre. `cibles` reste un TABLEAU même à
 *  l'arité 1 partout en schéma 1 : un prédicat à deux cibles ne cassera pas le
 *  type le jour où il entre. */

/** Un objectif de l'aventure. `reussi_si_expr` / `echoue_si_expr` sont MOTEUR —
 *  jamais injectés. `reussi_si_texte` / `echoue_si_texte` sont AUTEUR : la même
 *  règle en français, pour que l'auteur qui relit le JSON sache ce qu'il déclenche.
 *  Exemple : reussi_si_expr: { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.gouffre-scelle'] }
 *  Exemple : reussi_si_texte: 'Le héros a atteint le fond du Gouffre scellé.' */

/** MOTEUR — jumeau structuré de condition_texte. Jamais injecté : un narrateur
 *  qui connaît la condition de fin y conduit.
 *  Exemple : condition_expr: { op: 'et', enfants: [
 *    { op: 'predicat', predicat: 'possede_objet', cibles: ['objet.clef-de-basalte'] },
 *    { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-nuit'] } ] } */

/** DEUX optionnels, PAIRÉS — un événement peut rester déclenché par la seule main
 *  du narrateur, sans condition formalisée : c'est calme, jamais une alerte.
 *  Exemple : declencheur_texte: 'Le joueur revient à Val-Cendre après la tempête.'
 *  Exemple : declencheur_expr: { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.val-cendre'] } */
```

## 4 — Contrats `brain/` touchés

| contrat | sens | forme |
|---|---|---|
| `brain/dossier/expr.ts` | **fourni** | `ExprNode`, `PROFONDEUR_MAX_EXPR`, `validateExpr`, `collectRefs`, `SiteExpr`, `RefCollectee` |
| `brain/dossier/predicates.ts` | **fourni** | `PREDICATES` (Record fermé), `PredicatId`, `PredicatDescripteur` |
| `brain/dossier/tables.ts` | **fourni** | les 6 tables d'it2 déplacées **verbatim** + `FAMILLES_DE_CONDITIONS` |
| `brain/dossier/types.ts` | **étendu** | `Objectif`, + 6 champs `…_expr`, + 4 champs `…_texte` |
| `brain/dossier/issues.ts` | **étendu** | union 12 → 16, + 4 lignes de `DOSSIER_ISSUE_LABELS` |
| `brain/index.ts` | **étendu** | **types seuls** : `ExprNode`, `Objectif`, `PredicatId` |
| `COLLECTIONS_IDENTIFIEES`, `estIdentifiantBienForme`, `collectIds`, `feuilleDe` | **consommés** | inchangés — `identifiers.ts` est **hors lot** |

**Ce qui ne sort PAS du baril** : les **valeurs** `PREDICATES`, `validateExpr`, `collectRefs`, `FAMILLES_DE_CONDITIONS`, `DESTINATION_DES_CHAMPS`. Aucun consommateur hors `brain/dossier/` avant les n° 3/6/7 ; les types sortent, les valeurs restent.

**Ordre des modules, acyclique** : `identifiers` → `issues` → `predicates` → `expr` → `types` → `tables` → `validate`. `expr.ts` n'importe **jamais** `types.ts` ; `sitesDe` **reste** dans `validate.ts` (c'est le lecteur, pas la table).

## 5 — Lots

### Lot 1 — `contrat-dossier-it3` `contrat`

**Ouvrier** : `dev-contrat`, effort élevé. Seul, sans essaim, sans fusion.

| fichier | N/R | rôle |
|---|---|---|
| `src/brain/dossier/predicates.ts` | **N** | le registre fermé, 7 entrées |
| `src/brain/dossier/expr.ts` | **N** | `ExprNode`, la borne, `validateExpr`, `collectRefs` |
| `src/brain/dossier/tables.ts` | **N** | 6 tables déplacées verbatim + `FAMILLES_DE_CONDITIONS` |
| `src/brain/dossier/expr.test.ts` | **N** | forme, arité, profondeur, clé inconnue, `collectRefs` |
| `src/brain/dossier/types.ts` | **R** | `Objectif` + les 10 champs |
| `src/brain/dossier/validate.ts` | **R** | tables sorties, section « conditions » ajoutée, **≤ 650 lignes mesuré** |
| `src/brain/dossier/issues.ts` | **R** | 4 codes + 4 QUOI FAIRE |
| `src/brain/dossier/destinations.ts` | **R** | 10 lignes + le commentaire « réservé n° 4 » |
| `src/brain/dossier/couverture.test.ts` | **R** | arrêt du walker, 4ᵉ assertion, docstring de frontière |
| `src/brain/dossier/validate.test.ts` | **R** | intégrité référentielle par famille, alerte D1 |
| `src/brain/dossier/roundtrip.test.ts` | **R** | un arbre à 3 niveaux traverse import → export intact |
| `src/brain/dossier/__fixtures__/dossier-minimal.json` | **R** | instancie les 6 couples et les 7 prédicats |
| `src/brain/index.ts` | **R** | **types seuls** |
| `docs/ROADMAP-BASCULE-IA.md` | **R** | **deux lignes** du tableau § D1 (veto narratif) |
| `bug_history.json` | **R** | BUG-050 journalisé (condition QA) |

**Hors lot, à ne pas ouvrir** : `identifiers.ts`, `freeze.ts`, `read.ts`, `DossierService.ts`, `src/features/**`, `src/player/**`, `stryker.config.json`.

**Deux phases DANS le lot** — des phases, pas des lots :

- **A** — `tables.ts` extrait, arrêt du walker câblé, 4ᵉ assertion posée. Porte verte, **zéro changement de comportement**.
- **B** — `expr.ts`, `predicates.ts`, les champs, la section « conditions » de `validate.ts`.

Sortir les tables **avec leur bénéficiaire** est la condition d'entrée (a) posée par it2 : la 4ᵉ assertion a besoin de les importer, et c'est le dernier chemin de contournement du garde de `DESTINATION_DES_CHAMPS` — aujourd'hui, un champ ajouté aux types et aux tables mais **pas à la fixture** reste invisible aux deux assertions.

## 6 — Critères d'acceptation

1. **Étant donné** un `…_expr` dont le `predicat` est absent de `PREDICATES`, **quand** on valide, **alors** une erreur bloquante de `code` `predicat-inconnu` est produite, son `path` est le champ **porteur** et sa `location` nomme l'entité porteuse par son nom. *(unitaire + contrat)*
2. **Étant donné** les **cinq** familles de conditions, **quand** un `…_expr` référence un identifiant bien formé qu'aucune entité du dossier ne porte, **alors** une erreur bloquante `reference-pendante` nomme le champ porteur et l'identifiant fautif — **un test par famille**, échouant par **nom de famille absente**, jamais par un compte. *(contrat)*
3. **Étant donné** un `…_texte` présent sans son `…_expr`, **quand** on valide, **alors** un `condition-sans-expr` **non bloquant** (`ok` reste `true`) sort sur une **fin** et un **objectif** seulement ; jalon, événement et étape de plan restent **calmes** — assertion discriminante, pas seulement positive (KR-162). *(contrat)*
4. **Étant donné** un nœud d'expression mal formé — `op` hors des quatre, clé inconnue, `cibles.length` ≠ `refKinds.length`, `et`/`ou` à moins de 2 `enfants`, `non` sans `enfant`, profondeur > `PROFONDEUR_MAX_EXPR` — **quand** on valide, **alors** une erreur bloquante sort et le test asserte son **`code`** (`expr-malformee` ou `arite-invalide`), **jamais une sous-chaîne de message** ; la borne est éprouvée à `PROFONDEUR_MAX_EXPR` (calme) et à `+1` (bloquant), l'arité à `n-1 / n / n+1` (KR-165). *(unitaire)*
5. **Étant donné** une cible dont l'espace de noms diffère de `refKinds[i]`, **quand** on valide, **alors** `identifiant-invalide` sort en nommant le type de référence attendu — **distinct** de `reference-pendante`, qui ne sort que sur une cible bien formée et non portée. *(unitaire + contrat)*
6. **Étant donné** `PREDICATES`, **quand** on l'inspecte, **alors** chaque entrée a **au moins une instance dans la fixture**, chaque `refKinds[i]` a une ligne dans `COLLECTIONS_IDENTIFIEES`, et `bestiaire` n'y figure jamais — aucun prédicat ne peut désigner un monstre. *(contrat)*
7. **Étant donné** les tables de `tables.ts`, **quand** `couverture.test.ts` s'exécute, **alors** tout chemin de `CHAMPS_REQUIS` / `ENUMERES_FERMES` / `LISTES_REQUISES` / `CHEMINS_DE_DELTAS` / `FAMILLES_DE_CONDITIONS` a au moins une instance dans la fixture **par préfixe normalisé**, tout chemin finissant par `_expr` a une destination valant `moteur`, et l'ensemble des chemins où le balayage s'arrête est **dérivé de `FAMILLES_DE_CONDITIONS`**, jamais re-listé. *(contrat)*
8. **Étant donné** la fixture lue **du disque** et portant un arbre `…_expr` d'au moins trois niveaux, **quand** on l'importe puis on l'exporte par les fonctions publiques, **alors** le document réimporté est deep-equal à l'export et reste valide. *(contrat, fichier réel — KR-156)*

## 7 — Tests nommés

| test | fichier | niveau | KR |
|---|---|---|---|
| `refuse un op hors et/ou/non/predicat` → `expr-malformee` | `expr.test.ts` | unitaire | KR-117 · KR-164 |
| `refuse une cle inconnue sur un noeud` → `expr-malformee` | `expr.test.ts` | unitaire | KR-117 |
| `refuse un predicat absent du registre` → `predicat-inconnu` | `expr.test.ts` | unitaire | KR-117 |
| `refuse une arite differente aux bornes n-1 / n / n+1` → `arite-invalide` | `expr.test.ts` | unitaire | KR-165 |
| `refuse et ou ou a 0 et a 1 enfant` → `arite-invalide` | `expr.test.ts` | unitaire | KR-165 |
| `refuse un non sans enfant, et un non portant la cle enfants` *(le second par clé inconnue)* | `expr.test.ts` | unitaire | KR-165 |
| `accepte a la profondeur PROFONDEUR_MAX_EXPR, refuse a +1` | `expr.test.ts` | unitaire | KR-165 |
| `refuse une cible dont l espace differe de refKinds` → `identifiant-invalide` | `expr.test.ts` | unitaire | KR-164 |
| `validateExpr est totale : du bruit ne leve jamais et rend des anomalies rédigées` | `expr.test.ts` | unitaire | KR-116 · KR-169 |
| `aucun message d anomalie d expression ne contient expected, undefined ou is not a function` | `expr.test.ts` | unitaire | KR-164 |
| `collectRefs collecte toutes les references sur au moins 3 niveaux imbriques` | `expr.test.ts` | unitaire | KR-169 |
| `collectRefs rend une liste vide sur du bruit et n est appelee que si validateExpr est vide` | `expr.test.ts` | unitaire | KR-169 |
| `chaque entree de PREDICATES a au moins une instance dans la fixture` | `couverture.test.ts` | contrat | § 3.4 |
| `tout refKinds a une ligne dans COLLECTIONS_IDENTIFIEES, et bestiaire n y figure jamais` | `expr.test.ts` | unitaire | KR-169 |
| `un test PAR FAMILLE : reference absente bloquante, nommant le champ porteur et l identifiant` | `validate.test.ts` | contrat | KR-021 · KR-164 |
| `la location d une anomalie de plan_actions nomme le PERSONNAGE, jamais l etape` | `validate.test.ts` | contrat | KR-164 |
| `un …_texte sans …_expr avertit sans bloquer, pilote par alerteSansExpr` *(+ discriminant : jalon / evenement / plan restent calmes)* | `validate.test.ts` | contrat | D1 · KR-162 |
| `4e assertion : tout chemin de table a une instance dans la fixture, par prefixe normalise` | `couverture.test.ts` | contrat | condition d'entrée it2-a |
| `tout chemin finissant par _expr a une destination valant moteur` | `couverture.test.ts` | contrat | § 3.5 |
| `l arret du balayage est derive de FAMILLES_DE_CONDITIONS` *(test-grep : aucune seconde liste de chemins d expr)* | `couverture.test.ts` | statique | **veto tech-lead** · KR-169 |
| `docstring nommant ce que le balayage ne couvre PAS` *(conteneurs intermédiaires, elements de liste non-objet)* | `couverture.test.ts` | contrat | KR-173 |
| `op et predicat ne sont interpretes qu au SEUL site validateExpr` *(test-grep)* | `expr.test.ts` | statique | KR-117 · KR-169 |
| `aucune fonction de parsing d expression dans brain/dossier/` *(test-grep : aucun identifiant `parseExpr`)* | `expr.test.ts` | statique | KR-168 |
| `un arbre a 3 niveaux traverse import puis export intact` | `roundtrip.test.ts` | contrat | KR-156 |
| BUG-050 journalisé avant la première ligne de code | `bug_history.json` | traçabilité | KR-173 |

**Ce que personne ne vérifiera, à écrire tel quel dans la revue** : la cohérence du tableau § D1 de `docs/ROADMAP-BASCULE-IA.md` (aucun instrument ne relit une prose `.md` — revue humaine seule) · l'orientation de `lieux[].acces` (aucun code touché) · toute assertion sur `contre_mesures[]` (racine inexistante) · l'exhaustivité des voies d'élargissement d'un nœud (`validateExpr` prouve que les formes **nommées** sont rejetées, pas l'absence de toute autre).

## 8 — Registre des désaccords

| # | désaccord | statut | motif / porteur |
|---|---|---|---|
| C1 | 5 ou 6 familles de conditions | **RETENU : cinq** · **REPORTÉ n° 4** pour la sixième | `contre_mesures` n'a ni type, ni racine, ni feature éditrice ; elle vit **sous `personnages[]`**, donc n° 4, pas n° 6. Coût du report mesuré : quatre lignes. |
| C2 | `declencheur` nu vs `…_expr` / `…_texte` partout | **RETENU : `_expr`/`_texte` partout** | Un `declencheur` nu suivi d'un `declencheur_texte` en n° 4 serait un **renommage de clé persistée**, sans `migrateDossier`. Objection UX retirée par son auteur. |
| C3 | `args`/`arg`/`refs` vs `enfants`/`enfant`/`cibles` | **RETENU : français** | Concédé par le tech-lead. Le `path` s'arrête au champ porteur, donc aucun nom interne ne remonte dans un message : le choix est gratuit, la cohérence ne l'est pas. |
| C4 | cardinalité et contenu de `PREDICATES` | **RETENU : les 7 du relevé** | Le contenu est du ressort du narratif (« c'est un relevé »), le plafond du tech-lead. `quete_achevee` et `objectif_atteint`, proposés par le tech-lead, **sortent** : aucun état de session pour l'un, circularité pour l'autre. |
| C5 | arité stockée vs dérivée | **RETENU : dérivée** de `refKinds.length` | Deux champs pour un seul nombre est la dérive que `CONFIANCES` a déjà refusée (KR-165). La QA a retiré son objection : le pouvoir de test est identique. |
| C6 | `lit: CheminDeSession[]` au descripteur | **REJETÉ** | Table sans lecteur avant la n° 9 — motif exact du retrait de `BUDGET_CONTEXTE` en it2. **Retirée par son propre auteur.** Substitut : un commentaire par entrée. |
| C7 | 2 codes d'anomalie (tech-lead / UX) ou 4 (QA) | **RETENU : 4** | Domaine QA — un test doit asserter `issue.code` ; grouper opérateur, prédicat et arité sous un code unique force ce test au *string-matching* sur du français, fragile à toute reformulation. Le coût invoqué (« quatre fois la même ligne ») est **annulé au § 3.3** : quatre consignes distinctes. **Aucun code neuf** pour les deux cas de référence — `identifiant-invalide` et `reference-pendante` sont réutilisés. |
| C8 | `…_expr` sans `…_texte` = bloquant | **REJETÉ**, **REPORTÉ n° 7** | Motif faux, démontré : les `…_texte` sont `auteur`, **jamais injectés** — l'IA n'a la phrase dans aucun cas. Ce qui reste est un trou de documentation d'auteur, affaire du linter. **Retirée par son auteur.** |
| C9 | le balayage de couverture face à un arbre récursif | **RETENU : arrêt sur les `…_expr`, dérivé** *(veto tech-lead)* **+ refus de toute clé inconnue** *(contrepartie narratif)* | Un `…_expr` peuplé produirait des chemins qui **varient avec la forme de l'arbre** : la table des destinations ne pourrait jamais être exhaustive. L'arrêt est donc codé, pas déclaré — et **dérivé** de `FAMILLES_DE_CONDITIONS`, sans quoi deux listes de chemins divergeraient en silence. Sans la contrepartie, l'opacité devient une **cachette** : un champ de prose vivrait dans un `…_expr`, échapperait au balayage des destinations et serait injecté par la n° 10 sans qu'un test rougisse. |
| C10 | orientation de `lieux[].acces` | **RETENU : arête ORIENTÉE** — une entrée = un sens ; un passage réciproque = deux entrées. **Champ en n° 5.** | Ferme la question ouverte que la spec assignait nommément à ce raffinage. Une bidirectionnalité implicite obligerait chaque lecteur (linter n° 7, canevas n° 2, moteur n° 9) à matérialiser l'arête inverse — état dérivé recalculé en trois endroits (KR-013) — ou à la dédoubler par script, soit une **seconde source de vérité dans le document**. Zéro ligne en it3. |
| C11 | le tableau § D1 du roadmap écrit « `…_texte` \| l'IA \| injectée telle quelle » | **RETENU** *(veto narratif, dans son domaine)* | it3 crée **quatre `…_texte` neufs** sous un document contraignant qui ordonne de les injecter, alors que la décision B et `destinations.ts` les classent `auteur`. Non corrigé, la n° 10 lit ce tableau et met la même règle dans le code **et** dans le prompt. Deux lignes de `.md` dans le lot le ferment. |
| C12 | l'élément de liste non-objet traverse le validateur (`savoirs: ["du texte"]` → `ok:true`) | **REPORTÉ it4**, **journalisé maintenant** *(condition QA)* | Même famille que BUG-049, hors de la tranche. Le report n'est accepté qu'accompagné de BUG-050 dans `bug_history.json` — dit en revue seulement, il disparaît. Le cas **local à une expression** (`et`/`ou` dont un enfant n'est pas un objet) est, lui, refusé **dès it3**. |
| C13 | « `Revelation` à portes » dans le `goal` | **RETENU : purgé** | Livré depuis it2 (`types.ts:135`). Non contesté. |
| C14 | annexe des destinations du narratif adoptée verbatim | **RETENU** | Réserve du tech-lead tenue : le bloc « réservé n° 4 » reste un **commentaire**, jamais des lignes de table — une ligne morte ferait rougir `couverture.test.ts` par construction. |

**Arbitrages de l'orchestrateur** — points que les deux tours ont laissés implicites et qu'un ouvrier aurait dû inventer :

- **`non` n'a pas d'arité au sens des autres.** Le type porte `enfant` au **singulier** : « un `non` à deux enfants » n'est pas exprimable — c'est un `enfants` inconnu **plus** un `enfant` manquant. Deux codes distincts, deux assertions explicites (§ 7). Ne pas transformer `enfant` en tuple pour uniformiser : le type tient déjà l'arité 1.
- **Frontière `expr.ts` / `validate.ts`** : `validateExpr` porte **toute la FORME**, y compris le préfixe d'espace de noms d'une cible (via `estIdentifiantBienForme`, qui est une fonction de forme) ; `validate.ts` porte **la seule RÉSOLUTION** (`collectIds`). Conséquence utile : `collectRefs` n'étant appelée que si `validateExpr` est muette, elle ne voit que des identifiants bien formés, et la résolution devient une simple appartenance à un ensemble.
- **`RefCollectee` porte trois champs**, pas deux : `{ id, espace, predicat }`. Le `predicat` est requis par le message arbitré (« Le prédicat « `{label}` » de … ») ; sans lui, `validate.ts` devrait re-parcourir l'arbre pour retrouver le label — une seconde traversée, donc une seconde source de vérité.
- **Les quatre `…_texte` neufs sont optionnels et non contraints** : leur corruption (`"…"` → `42`) ne fait rien rougir. Il faut **quatre dispenses `LIBRES`**, dont le motif nomme la question ouverte **déjà possédée par la n° 2** (« présent → doit être une chaîne »). Ne pas inventer une table de textes optionnels ici : ce serait trancher à la place de son propriétaire.
- **La fixture doit instancier les SIX `…_expr` et les QUATRE `…_texte` neufs**, sans exception — c'est l'assertion « aucune ligne morte dans `DESTINATION_DES_CHAMPS` » qui l'impose, chaque champ ayant sa ligne. Deux contraintes s'y ajoutent, dans deux directions opposées : `charpente.fins[].condition_texte` est **requis** depuis it2 et `alerteSansExpr` vaut `true` sur les fins, donc **toute fin doit porter `condition_expr`** sans quoi « la fixture est valide **et sans avertissement** » rougit ; et les cibles de tous ces `…_expr` doivent résoudre vers des entités **réellement présentes** dans la fixture, sans quoi c'est `reference-pendante` qui la fait rougir. Il faut donc aussi **au moins une instance de chacun des sept prédicats** (§ 6, critère 6) : la fixture est le seul document dont on sait qu'il est complet, et c'est elle qui ferme la boucle.
- **Le décompte de chemins de tables ne se recopie pas d'ici.** Les chemins de `LISTES_REQUISES`, `CHEMINS_DE_DELTAS` et `RACINES` sont des **conteneurs** — aucune feuille de fixture ne leur est égale — d'où le préfixe normalisé (`===` ∨ `+'.'` ∨ `+'['`). Le nombre exact est à **mesurer** par l'ouvrier, jamais à reprendre d'un tour de comité (KR-159 : un décompte énonce son prédicat).

## 9 — Innovation

**Aucune.** Le budget d'une proposition hors-cadre par itération n'est pas consommé : le seul candidat, `lit: CheminDeSession[]`, a été retiré par son auteur au tour 2 au motif qu'une table sans lecteur est la dette qu'il reprocherait à quelqu'un d'autre.

## 10 — Définition de fini

1. Prettier → `tsc --noEmit` → `npm run lint` → `jest` **complet** verts. La porte de commit (`tsc` + `jest`) n'est jamais contournée.
2. `validate.ts` **≤ 650 lignes, mesuré** — pas estimé (KR-112 : au-delà de 400 c'est un signal, le fichier est déjà au-dessus et doit redescendre par l'extraction, pas grossir).
3. Les **huit critères** du § 6 constatés par un test **nommé** du § 7, et **chaque propriété affirmée dans une docstring du § 4 a son propre test** — « totale », « ne résout aucune référence », « seul site d'interprétation », « dérivé de `FAMILLES_DE_CONDITIONS` » (KR-169 : une propriété affirmée sans test est une intention, pas un contrat).
4. Chaque test existant touché est classé **PORTÉ** ou **SUPPRIMÉ** dans le journal d'itération — jamais silencieusement absent du diff (KR-162).
5. BUG-050 présent dans `bug_history.json` **avant** la première ligne de code.
6. `grep` de fini : aucun `parseExpr` ni équivalent · aucune conversion `Book` ↔ `Dossier` (KR-167) · aucun `switch` sur `op` ou `predicat` hors `validateExpr` · aucun élargissement de la grammaire de `sitesDe`.
7. **Budget de contexte relevé** à l'étape 4 des Build Steps. Deux fichiers sont à surveiller nommément dans ce lot : `docs/ROADMAP-BASCULE-IA.md` (32 911 o mesurés le 2026-08-06, plafond 35 kio — le lot **corrige deux lignes existantes, il n'en ajoute pas**) et `src/features/dossier-format/specification.json` — **le point serré** : le report du raffinage l'a fait franchir le plafond (67 782 o), il a été **compacté dans le même geste** à **65 472 o** le 2026-08-06, laissant **1 088 o** sous le plafond de 65 kio. Le journal d'it3 ne tient pas dans cette marge : il s'écrit **compacté** (phrase d'arbitrage + renvoi à `dossier-format-it3.revue.md`, la revue étant le dossier et la spec son index), et s'il franchit quand même, la compaction se fait **dans ce lot-ci**. Ce qui a déjà été compacté — et qu'il ne faut donc pas re-détailler : la scission `types.ts`, le passage à 5 itérations, la décision B, la suppression de `contraintes`, le `rayon_scission` d'it1 (KR-159 le porte).
8. Score de mutation : **sans objet** (KR-161) — aucun des quatre fichiers mutés n'est touché, et les registres d'identifiants n'entrent pas dans `stryker.config.json`.

## 11 — Signatures

### `src/brain/dossier/predicates.ts` (N)

```ts
import type { EspaceDeNoms } from './identifiers'

export interface PredicatDescripteur {
	/** Libellé français — la valeur du Select des n° 3/6/7. Jamais une syntaxe. */
	label: string
	/** L'espace de noms attendu à CHAQUE position. L'ARITÉ est `refKinds.length`,
	 *  DÉRIVÉE et jamais stockée (dérive déjà refusée par `CONFIANCES`, KR-165).
	 *  SCHÉMA 1 : slots de RÉFÉRENCE uniquement — tout espace listé ici a une ligne
	 *  dans `COLLECTIONS_IDENTIFIEES`, propriété tenue par un test, et `bestiaire`
	 *  n'en a pas : aucun prédicat ne peut désigner un monstre. Un opérande littéral
	 *  (`entier`) gagnera un champ au DESCRIPTEUR, jamais un `switch` (KR-117). */
	refKinds: readonly EspaceDeNoms[]
}

/** Factory d'identité LOCALE, jumelle de `defineEspaces` (identifiers.ts) —
 *  recopiée et non extraite : deux appelants, trois lignes. Extraction au troisième. */
const definePredicats =
	<V>() =>
	<K extends string>(map: Record<K, V>): Record<K, V> =>
		map

export const PREDICATES = definePredicats<PredicatDescripteur>()({ /* les 7 du § 3.4 */ })
export type PredicatId = keyof typeof PREDICATES
```

Chaque entrée porte **en commentaire** le champ d'état de session qui y répond — un relevé en prose, pas une table : `CheminDeSession` n'a aucun lecteur avant la n° 9 (C6).

### `src/brain/dossier/expr.ts` (N)

```ts
/** Borne de récursion — un fichier écrit à la main ne fait pas sauter la pile d'un
 *  validateur qui se promet total. Testée à 8 (calme) et 9 (bloquant), KR-165. */
export const PROFONDEUR_MAX_EXPR = 8

export type ExprNode =
	| { op: 'et' | 'ou'; enfants: ExprNode[] }            // ≥ 2 enfants, tenu au runtime
	| { op: 'non'; enfant: ExprNode }                     // arité 1 tenue PAR LE TYPE
	| { op: 'predicat'; predicat: PredicatId; cibles: string[] }

/** Le champ PORTEUR de l'expression — le `path` et le `location` de toute anomalie
 *  produite par l'arbre. Le chemin NE DESCEND PAS dans l'arbre : le seul
 *  consommateur déclaré (badge de section, n° 7) ne sait pas badger un sous-nœud,
 *  et `feuilleDe(path)` doit rendre la clé que l'auteur cherchera dans son fichier. */
export interface SiteExpr { path: string; location: string }

/** LA FORME, toute la forme, rien que la forme — frontière de confiance (KR-116).
 *  Totale sur `unknown`, ne lève jamais. Elle vérifie l'opérateur, l'absence de clé
 *  inconnue, l'arité, la profondeur et la BONNE FORME d'une cible (préfixe d'espace
 *  compris) — mais elle ne RÉSOUT rien : seule `validate.ts` connaît `collectIds`. */
export function validateExpr(valeur: unknown, site: SiteExpr): DossierIssue[]

export interface RefCollectee {
	id: string
	/** L'espace ATTENDU à cette position, lu dans `refKinds[i]`. */
	espace: EspaceDeNoms
	/** Le prédicat porteur — requis par le message de `reference-pendante`, qui le
	 *  nomme par son `label`. Sans ce champ, `validate.ts` devrait re-parcourir
	 *  l'arbre pour le retrouver : une seconde traversée, donc une seconde vérité. */
	predicat: PredicatId
}

/** Relevé plat des références d'un arbre BIEN FORMÉ. Totale : `[]` sur du bruit.
 *  N'est appelée QUE si `validateExpr` n'a rien produit — deux anomalies pour une
 *  seule cause, c'est du bruit dans le rapport. */
export function collectRefs(valeur: unknown): RefCollectee[]
```

Les **quatre opérateurs sont une union de types**, exhaustivement vérifiée par le compilateur — **pas** un registre. KR-117 porte sur les identifiants de prédicat, pas sur une union close de quatre littéraux.

### `src/brain/dossier/tables.ts` (N)

Les six tables d'it2 déplacées **verbatim** avec leurs interfaces — `RACINES`, `CHAMPS_REQUIS`, `ENUMERES_FERMES`, `LISTES_REQUISES`, `CHEMINS_DE_DELTAS`, `BUDGETS_DE_MOTS` — plus :

```ts
export interface FamilleDeCondition {
	/** Chemin du `…_expr` — segments pointés et `[]`, la grammaire FIGÉE de `sitesDe`. */
	expr: string
	/** Chemin du jumeau prose. */
	texte: string
	location: string
	/** D1 : un `…_texte` sans `…_expr` AVERTIT — sur une FIN et un OBJECTIF seulement. */
	alerteSansExpr: boolean
}

export const FAMILLES_DE_CONDITIONS: readonly FamilleDeCondition[] = [
	{ expr: 'canon.objectifs[].reussi_si_expr',  texte: 'canon.objectifs[].reussi_si_texte',  location: 'Objectifs',    alerteSansExpr: true  },
	{ expr: 'canon.objectifs[].echoue_si_expr',  texte: 'canon.objectifs[].echoue_si_texte',  location: 'Objectifs',    alerteSansExpr: true  },
	{ expr: 'charpente.fins[].condition_expr',   texte: 'charpente.fins[].condition_texte',   location: 'Fins',         alerteSansExpr: true  },
	{ expr: 'charpente.jalons[].declencheur_expr', texte: 'charpente.jalons[].declencheur_texte', location: 'Jalons',   alerteSansExpr: false },
	{ expr: 'monde.evenements[].declencheur_expr', texte: 'monde.evenements[].declencheur_texte', location: 'Événements', alerteSansExpr: false },
	{ expr: 'monde.personnages[].plan_actions[].declencheur_expr',
	  texte: 'monde.personnages[].plan_actions[].declencheur_texte', location: 'Personnages',    alerteSansExpr: false },
]
// SIXIÈME famille `contre_mesures[]` : absente du schéma 1. Elle vit SOUS
// `personnages[]` et arrive avec sa racine en n° 4 `dossier-fiches` — quatre
// lignes. Ne PAS l'anticiper ici.
```

**Cinq familles, six couples** : `objectifs` en porte deux (`reussi_si`, `echoue_si`).

### `src/brain/dossier/types.ts` (R)

```ts
export interface Objectif extends Entite {
	reussi_si_texte?: string   // AUTEUR — optionnel : sa forme complète est n° 3 (décision A)
	reussi_si_expr?: ExprNode  // MOTEUR
	echoue_si_texte?: string
	echoue_si_expr?: ExprNode
}

Canon.objectifs: Objectif[]                                    // était Entite[]
Fin        + condition_expr?: ExprNode
Jalon      + declencheur_expr?: ExprNode
Evenement  + declencheur_texte?: string  + declencheur_expr?: ExprNode
PlanAction + declencheur_texte?: string  + declencheur_expr?: ExprNode
```

**Tous les champs neufs sont optionnels**, et il n'existe **aucune règle de symétrie** `…_expr` ⇒ `…_texte` (C8 rejetée). `condition_texte` et `declencheur_texte` de `Jalon` restent **requis**, comme it2 les a livrés.

### `src/brain/dossier/issues.ts` (R)

Union **12 → 16** : `+ 'expr-malformee' | 'predicat-inconnu' | 'arite-invalide' | 'condition-sans-expr'`, plus les quatre lignes de `DOSSIER_ISSUE_LABELS` écrites verbatim au § 3.3. Le `Record` étant fermé, ajouter un code sans son libellé **ne compile pas**.

### `docs/ROADMAP-BASCULE-IA.md` (R) — deux lignes, pas une de plus

Le tableau du § D1 écrit aujourd'hui `…_texte` | **l'IA** | « phrase en français, injectée telle quelle dans le contexte ». La décision B l'a démenti pour deux familles ; it3 pose les quatre autres. La ligne devient **auteur / jamais injectée**, et la ligne suivante (« le moteur ne lit jamais `…_texte` pour décider ») gagne sa réciproque : **le modèle ne le lit pas non plus**. Aucun paragraphe neuf : le roadmap est un index, sa croissance est un défaut.
