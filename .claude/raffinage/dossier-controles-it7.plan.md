# Plan d'itération — `dossier-controles` · itération `7`

> **Statut : VALIDÉ par l'humain le 2026-09-16 (porte 2 franchie).**
> Comité à **5 rôles** (PM, Tech Lead, UX, QA, **Narratif & IA**), 2 tours, **aucun veto tenu**, **aucun bloc `ESCALADE`**.
> **Motif du 5e rôle** : l'itération définit ce que « accomplir un objectif » veut dire, consomme `PREDICATES` — le vocabulaire de conditions que le moteur de la n° 9 évaluera — et fige ce que le code tient pour une aventure gagnable.
> Notes de tour : `.claude/raffinage/dossier-controles-it7/tour{1,2}-<rôle>.md`.

---

## Fiche de validation *(deux minutes — le reste du plan est pour l'ouvrier)*

**Phrase de démo** — à la fin de cette itération, **l'auteur voit qu'un objectif qu'il a posé n'a aucun chemin qui puisse l'accomplir.**

**⚠ Le périmètre a été RÉDUIT au tour 2.** Le goal portait **deux** règles. `canon-sans-objectif` **part à l'itération 8** — décision du PM, recommandée par le tech-lead, quantifiée par la QA. Trois motifs mesurés :

1. elle s'allume sur **100 % des dossiers neufs** (`amorce.ts` sème `objectifs: []`) ;
2. elle porte **tout** le rayon d'explosion inter-features — elle seule casse `panneauControles.test.tsx` (l'état calme devient inatteignable pour qui vient de créer un livre) et `dossierEditorScreen.test.tsx` de **`bascule-editeur`**, une seconde feature ;
3. elle rouvrirait **sans le dire** la doctrine écrite « le linter se tait sur les collections vides », sans qu'aucun rôle n'explique pourquoi `objectifs` diffère de `personnages` / `indices`.

`objectif-sans-chemin` seule **suffit à la phrase de démo** et **suffit à forcer la réécriture de KR-226** (mesuré : elle déclare seule `section: 'canon'` sur un `path` en `canon.*`). Le critère d'acceptation AC1 de la feature reste **intact**, sans réécriture.

**La tranche, de l'écran à la persistance** — aucune écriture : `controlerDossier` est pure et se rappelle à chaque rendu. Elle traverse le **calcul** (`atteignabilite.ts`), la **règle** (`controles.ts`), le **rendu déjà livré** (it1/it2/it4), et **la fixture de référence**, qu'elle répare.

**Les lots**

| id | titre | fichiers | `contrat` |
|---|---|---|---|
| **L1** | `objectif-sans-chemin` | **6** (0 N, 6 R) | **oui** — seul, **pas d'essaim** |

**Hors périmètre** — § 2.

**Désaccords `REPORTÉ`** — quatre, § 8.

**Proposition `INNOVATION`** — **aucune**.

### Ce que l'humain doit savoir, et qui ne se devine pas d'un diff

**Le linter a trouvé trois défauts réels dans l'aventure de référence du dépôt**, qu'aucun humain n'avait vus :

- `objectif.proteger-le-sceau` exige de **posséder un objet qu'aucun `donner_objet` ne donne jamais** ;
- `charpente.fins[0].condition_expr` porte la **même feuille morte** — une fin inatteignable ;
- `canon.objectifs[1].echoue_si_expr = NON(possede_objet(sceau))` est **vrai au tour zéro** : l'objectif est **échoué dès l'ouverture**.

Le premier est **réparé dans ce lot**. Les deux autres sont des **causes distinctes** et partent en `open_questions`. Le narratif a cherché la lecture narrative qui sauverait la fixture — elle n'existe pas au schéma — et la fixture porte elle-même la preuve de l'intention : son texte de fin, **émis verbatim au joueur**, dit « *Tu poses le sceau de cendre sur la table de la vigie* ».

**Une règle écrite à deux endroits a déjà divergé dans `brain/`.** `predicates.ts` dit que `pnj_a_revele` lit le carnet d'un personnage ; `deltas.ts` dit que `reveler_indice` l'écrit. Les deux ne peuvent pas être vraies : `reveler_indice` est d'**arité 1**, il n'a aucun opérande `pnj` par lequel nommer qui a parlé. Corrigé dans ce lot, une ligne de commentaire.

---

## 1 — But raffiné

Livrer **`objectif-sans-chemin`** : une règle **bloquante** qui signale un objectif dont la condition de réussite désigne un fait qu'aucun producteur du dossier ne peut établir.

Le verdict est rendu par une fonction neuve d'`atteignabilite.ts`, adossée à une **table de productibilité totale par compilation sur `PREDICATES`**, et il est **bottom-up** — jamais un relevé plat de feuilles.

---

## 2 — Hors périmètre

- **`canon-sans-objectif`** → **itération 8**, avec la question doctrinale « le linter se tait-il sur `objectifs` vide comme sur les autres collections ? », à trancher à froid.
- **Les portes de racine** (savoir sans `revele_si`, jalon/événement sans `declencheur_expr`) → **it8**. Quatre des sept lignes de la table sont donc **constantes vraies** à cette itération, et **doivent être écrites « non évaluée à it7 », jamais « toujours vraie »**.
- **`echoue_si_expr`** — une condition d'échec inaccomplissable ne rend rien injouable.
- **La condition d'échec vraie au tour zéro** (défaut réel de la fixture) → cause distincte, `open_questions`.
- **`charpente.fins[].condition_expr`** — « aucune fin atteignable » est une cause distincte (KR-164).
- **Tout export par `brain/index.ts`** · **tout champ neuf sur `ConstatControle`** · **toute mémoisation**.
- **Scinder `controles.ts`** (880 → ~980 l.) → reporté en tête d'it8.

---

## 3 — Contrat de design

Zéro composant neuf, zéro token neuf, zéro `NiveauControle` neuf. `PASTILLES` et l'élision d'it2 sont **déjà génériques par section, `canon` compris** — vérifié, pas supposé.

### Le message NOMME la feuille fautive

**Arbitrage de l'orchestrateur, § 8 · C4.** Gabarit **unique**, valable pour l'arité 1 **et** 2, par **apposition** (aucun article à accorder) :

> « Cette condition de réussite exige « {libellé} » — {cibles localisées, jointes par « , »} —, et rien dans ce dossier ne peut le produire. »

- arité 1 → « Cette condition de réussite exige « possède l'objet » — Objet « Le sceau de cendre » —, et rien dans ce dossier ne peut le produire. »
- arité 2 → « Cette condition de réussite exige « le personnage a déjà révélé l'indice » — Personnage « Corvin le marchand », Indice « La lettre de la vigie » —, et rien dans ce dossier ne peut le produire. »

`{libellé}` est `PREDICATES[id].label`, **résolu dans `atteignabilite.ts`** — c'est le mot de l'auteur, celui-là même que le `Select` de la n° 3 lui présentera (`dossier-format`, `resolved_decisions.expr_jamais_saisie`), jamais la clé technique. `{cibles localisées}` passe par `collectIds` / `localiserEntite`, déjà à la portée de `controles.ts`.

**Le mot « prédicat » est PROSCRIT du texte** — terme de schéma. **Contrôle anti-BUG-088** : la condition établit « la première feuille du parcours bottom-up n'a aucun producteur » ; le message dit exactement cela — il ne prétend **pas** que l'objectif entier est perdu, ni que le remède suffit (sous un `et` à plusieurs branches mortes, il ne suffit pas).

### La remédiation

> « Donnez un producteur à ce fait : un effet de règle « donne l'objet » ou « révèle l'indice » (Quêtes, Événements, Jalons), ou un savoir de personnage (Personnages → Savoirs). »

**Arbitrage de l'orchestrateur, § 8 · C4 bis.** Le narratif voulait **trois** remédiations isomorphes aux trois prédicats qui mordent ; cela exigerait un discriminant sur `ConstatControle`, rejeté deux fois (it6, puis it7 n° 16). Une remédiation **unique mais accurate** est possible **parce que le message nomme désormais le fait** : l'auteur sait lequel, la consigne dit seulement où les faits se produisent, et **chaque membre de la phrase est vrai d'au moins un des trois prédicats** — aucune suggestion fausse, ce que le narratif exigeait.

`path: 'canon.objectifs[].reussi_si_expr'` · `entityId: objectif.id` · `location: localiserEntite('objectif', objectif, index)` · `section: 'canon'` · `niveaux: ['bloquant']`.

---

## 4 — Contrats `brain/` touchés

`atteignabilite.ts` gagne une fonction exportée **au module seul**. **Aucune signature de `brain/index.ts` ne bouge.** `controles.ts` n'importe **ni `PREDICATES`, ni `ExprNode`** — il reçoit du **français** et des **identifiants**, résout l'entité, écrit la prose. La couture d'it6 (« il conclut et raconte, il ne compte pas ») est préservée.

---

## 5 — Lot

### L1 — `objectif-sans-chemin` — **`contrat`**, seul, **pas d'essaim, pas de worktree**

| | fichier |
|---|---|
| **R** | `src/brain/dossier/atteignabilite.ts` |
| **R** | `src/brain/dossier/atteignabilite.test.ts` |
| **R** | `src/brain/dossier/controles.ts` |
| **R** | `src/brain/dossier/controles.test.ts` |
| **R** | `src/brain/dossier/__fixtures__/dossier-reference.json` |
| **R** | `src/brain/dossier/deltas.ts` — **une ligne de commentaire** (§ 8 · C7). **Mesurer avant de l'écrire** qu'aucune garde de source ancrée sur ce fichier n'en dépend |

Un seul lot : 6 fichiers, `brain/` seul ; deux lots seraient tous deux `contrat` donc séquentiels, et ne révéleraient aucun parallélisme.

---

## 6 — Critères d'acceptation

Valeurs **mesurées** au tour 2 (QA, M1/M2/M3), jamais prédites.

1. **Le `non` ne descend pas.** *Étant donné* `dossier-minimal.json`, dont `reussi_si_expr` vaut `ET(jalon_atteint(…), NON(evenement_consomme(…)))`, *quand* la condition est évaluée, *alors* elle est accomplissable et la fixture reste **silencieuse** ; *et* un mutant où `non` descend et inverse son enfant est **démontré rouge sur ce même dossier**. — *unitaire.*

2. **Le `ou` suffit à une branche.** *Étant donné* un objectif `ou(A, B)` dont seule `B` est productible et un objectif `et(A, B)` de mêmes feuilles, *quand* le rapport est calculé, *alors* seul le second produit un constat — les deux dans le **même test** ; *et* un mutant où `ou` exige toutes les branches est **démontré rouge**. — *unitaire. KR-197/202.*

3. **Le vrai positif de la fixture, et sa réparation.** *Étant donné* `dossier-reference.json` **tel qu'il est aujourd'hui**, *quand* le rapport est calculé, *alors* `objectif-sans-chemin` est BLOQUANT sur `objectif.proteger-le-sceau` ; *et* la fixture est **réparée dans ce lot** par un `donner_objet` ciblant `objet.sceau-de-cendre` dans `monde.evenements[0].resolutions[0].consequence`, après quoi la règle s'y tait. — *unitaire.*

4. **La table est totale, et elle dit ce qu'elle décide.** *Étant donné* le registre `PREDICATES`, *quand* la table de productibilité est balayée, *alors* les **7** identifiants y sont représentés **par compilation** (un 8ᵉ prédicat ⇒ `tsc` rouge) ; *et* un `Record<PredicatId, 'mord' | 'non-evaluee-a-it7'>` est épinglé **valeur par valeur**, de sorte qu'it8 faisant passer `jalon_atteint` de l'un à l'autre **rougisse** au lieu de glisser en silence. — *unitaire. KR-199.*

5. **KR-226 arrive à échéance et la garde DURCIT.** *Étant donné* `objectif-sans-chemin` ajoutée — première règle à déclarer `section: 'canon'` sur un `path` en `canon.*` —, *quand* la suite tourne, *alors* le prédicat `path.split('.')[0] !== section` est **remplacé** par une table épinglant `path → section` valeur par valeur, totale par compilation, **plus** `expect(SOURCE_CONTROLES).not.toContain("split('.')")` **dans le même `it`** ; *et* le mutant `section: constat.path.split('.')[0]` est **démontré rouge**. — *unitaire.*

6. **La paire de `pnj_a_revele` s'évalue jointement.** *Étant donné* un personnage qui existe et un indice qui existe, mais **aucun savoir** du premier portant le second, *quand* la condition est évaluée, *alors* elle n'est **pas** accomplissable ; *et* un mutant évaluant les deux feuilles indépendamment est **démontré rouge**. — *unitaire. H3.*

7. **Les sept suites voisines ne bougent pas d'une assertion.** *Étant donné* `validate`, `couverture`, `suffisance`, `amorce`, `roundtrip`, `panneauControles.test.tsx`, `dossierEditorScreen.test.tsx`, *quand* l'itération est livrée, *alors* les **sept** sont vertes **sans aucune modification** — les deux dernières sont **entièrement hors du lot**. — *porte de commit. KR-217.*

8. **Le message nomme la feuille, et il est asserté verbatim.** *Étant donné* un constat d'`objectif-sans-chemin` d'arité 1 et un d'arité 2, *quand* le rapport est rendu, *alors* chaque message est asserté **VERBATIM par scénario**, contient le **libellé français** du prédicat et la **localisation résolue** de chaque cible, et ne contient ni clé technique, ni identifiant brut, ni le mot « prédicat ». — *unitaire.*

---

## 7 — Tests nommés (KR cités → test qui les tient)

| KR | Test |
|---|---|
| **KR-199** | critère 4 — totalité par compilation **et** par valeur |
| **KR-197 / KR-202** | critères 2 et 6 — deux entités dans le même test |
| **KR-226** | critère 5 — la garde durcit, elle ne se relâche pas |
| **KR-224** | critère 4 — les deux prédicats de lieu épinglés `'non-evaluee-a-it7'` |
| **KR-217 / KR-225** | critère 7 ; et la garde « feuille dont la cible ne résout pas → **zéro constat** » |
| **KR-164** | § 2 — `echoue_si_expr`, les fins et la condition d'échec au tour zéro sont des causes distinctes |
| **KR-013/113** | § 2 — aucune mémoisation |

---

## 8 — Registre des désaccords

> Tout `REJETÉ` d'annexe est recopié ici : un refus resté en annexe n'existe pas pour l'essaim (BUG-082).

### C1 — le périmètre → **RETENU : `canon-sans-objectif` REPORTÉ à it8** (porté par le § 2)

Tranché par le **PM**, recommandé par le **tech-lead** (qui est passé de « je ne bloque pas » à « je recommande », sur un motif d'architecture), **quantifié** par la QA (M3 : la coupe retire quatre assertions et **deux fichiers de test entiers**, exactement et sans modification). L'UX maintient, **recevable sur la lettre**, que le refus de l'it1 visait un bandeau global et non une ligne de rapport — cela ne répond pas aux motifs 1 et 2, suffisants seuls.

### C2 — AC1 contre AC10 → **SANS OBJET** sous la coupe. AC1 reste intact.

### C3 — la fixture → **RETENU : vrai positif, réparation dans le lot** (critère 3)

Le narratif a cherché la lecture narrative qui sauverait la fixture : **elle n'existe pas au schéma** (ni inventaire de départ, ni objet posé dans un lieu ; KR-159 : quatre portes sur un id d'objet, **une seule** écrit en positif). La seule lecture restante confie l'inventaire au narrateur — sa ligne de veto.

**Site retenu : `monde.evenements[0].resolutions[0].consequence`**, et c'est un arbitrage de l'orchestrateur entre deux sites tous deux mesurés à zéro coût. Le tech-lead recommandait `charpente.jalons[0].effet` en écartant le site événement comme « non mesuré » ; **la QA l'a mesuré depuis** (`panneauEvenements.test.tsx:332` épingle `resolutions.toHaveLength(3)` au niveau **résolutions**, pas au niveau `consequence[]`), et **j'ai vérifié moi-même** que les deux porteurs ont un `declencheur_expr`, donc que **les deux sont immunisés à it8**. Les deux propriétés étant égales, le départage revient à la justesse narrative, établie par le narratif : la résolution dit « le squelette s'effondre **en cendres** devant la tour ».

### C4 — le message → **RETENU : il NOMME la feuille fautive** (§ 3)

**Trois rôles ont bougé, et dans les deux sens.** L'UX a d'abord voulu nommer, puis **cédé** au tech-lead. Le narratif a **maintenu** en mesurant que la remédiation retenue renvoyait à « Objectifs → Condition de réussite » — **un écran qui n'écrit pas `reussi_si_expr`** —, donc qu'elle nommerait une surface inexistante, et que « *fais produire un fait* sans dire lequel n'est pas actionnable ». Le tech-lead a alors **retiré sa propre moitié refusante** (« un refus juste sur un motif faux ne tient pas deux tours ») et **rejeté sa propre proposition de tour 1**. La QA a tranché sur la testabilité : un message générique n'est vérifiable que par « non vide + registre de langue » — un test **qui passe déjà sur toute règle existante**, donc incapable de distinguer « la bonne feuille a été désignée » de « la mauvaise ».

### C4 bis — la remédiation → **arbitrage de l'orchestrateur : UNE seule, mais accurate** (§ 3)

Le narratif en voulait **trois**, isomorphes aux trois prédicats qui mordent. Cela exigerait un discriminant sur `ConstatControle` — rejeté à it6 puis ici (n° 16). La remédiation unique devient possible **parce que le message nomme le fait** : chaque membre de la phrase est vrai d'au moins un prédicat, aucune suggestion n'est fausse. C'est l'exigence de fond du narratif, satisfaite autrement que par sa forme.

### C5 — 1 lot ou 2 → **RETENU : 1 lot**. Sous la coupe, 5 fichiers `brain/` ; deux lots `contrat` ne révéleraient aucun parallélisme.

### C6 — H3 → **RETENU**, rédaction finale dans `tour2-narratif-ia.md`, annexe C. L'en-tête du bloc d'hypothèses passe à « itérations 6 **et 7** ».

### C7 — `deltas.ts` contredit `predicates.ts` → **RETENU : corrigé dans ce lot**

`predicates.ts` a raison, et l'argument est **mécanique** : `reveler_indice.refKinds = ['indice']`, arité 1 — aucun opérande `pnj`, donc aucun moyen d'écrire un carnet **par personnage**. Livrer H3 pendant que le fichier voisin la contredit en toutes lettres est exactement la panne que les hypothèses datées existent pour éviter.

### `REJETÉ` — Tech Lead

1. **Un module neuf `productibilite.ts`** — il ferait rougir la garde de population d'`atteignabilite.test.ts` (la **mention** suffit à faire un porteur), et it6 a écrit que la clause KR-224 rejoint les hypothèses **d'`atteignabilite.ts`**.
2. **La productibilité dans `controles.ts`** — elle y remettrait du CALCUL dans le module qui conclut et raconte.
3. **Exporter `ETABLISSEMENT` pour la balayer** — « l'exporter pour un test en ferait un contrat ».
4. **Un relevé plat des feuilles à la `collectRefs`, filtré ensuite** — faux positifs sous `ou` et sous `non`.
5. **Descendre sous `non`.**
6. **Dériver le producteur d'objet de `refKinds.includes('objet')`** — `retirer_objet` partage ce `refKind` et est un producteur **NÉGATIF** ; trou **déjà réel**, pas hypothétique. Une garde dédiée est due.
7. **Un champ STRUCTURÉ neuf sur `ConstatControle`** — état illégal représentable. *(La composition du `message` à l'émission, elle, n'est pas refusée : `message: string` est déjà libre.)*
8. **Une troisième entrée de registre** — deux causes = deux `ControleId`, mais pas trois.
9. **Sortir la fonction par `brain/index.ts`** — un seul appelant.
10. **Scinder `controles.ts`** dans cette itération — collision avec les gardes ancrées sur `SOURCE_CONTROLES`. **REPORTÉ** en tête d'it8.
11. **Étendre à `echoue_si_expr`.**
12. **Un troisième lot « réparation des lignes de base »** — il nommerait `controles.test.ts`, déjà possédé.
13. **Réparer la fixture via `monde.quetes[0].recompense`** — mesuré : `panneauQuetes.test.tsx:301` porte en dur « 2 récompenses » et `:323` épingle à **3** ; la réparation rougirait dans une **seconde feature**.
14. **Donner un `declencheur_expr` à `jalon.second-guet`** — `panneauJalonsFins.test.tsx:285-290` s'appuie **nommément** sur son absence.
15. **Réaligner `controles.test.ts:1236-1245` sur le constat** — ce serait épingler un défaut d'auteur comme état normal de la référence.
16. **Sa propre proposition de tour 1**, `conditionAccomplissable(…): boolean` — un booléen rendrait l'exigence de nommage inatteignable sans une **seconde traversée**.
17. **Que `controles.ts` importe `PREDICATES` ou `ExprNode`** — le libellé est résolu par le module qui possède le registre.
18. **Un lot dédié à la fixture** — elle est nommée par le seul lot qui allume la règle qui s'y voit.

### `REJETÉ` — Narratif & IA

19. **« Toutes les feuilles doivent être productibles »** — faux positif bloquant sous `ou` et sous `non`.
20. **Réutiliser `collectRefs`** — elle aplatit `ou` et descend dans `non` : correcte pour les références, fausse pour la satisfiabilité.
21. **Exiger un mécanisme pour `lieu_visite` / `lieu_courant_est`** — KR-224, monde ouvert.
22. **Exiger `declencheur_expr` sur le jalon ou l'événement ici** — charge d'it8, sens d'erreur inverse.
23. **Évaluer `pnj_a_revele` comme deux feuilles indépendantes** — seule la paire produit ce fait.
24. **Un second parcours des producteurs d'indices.**
25. **Une ligne de rapport par feuille en défaut** — ≤ 1 constat par objectif.
26. **Nommer la fonction `evaluateExpr`** — deux traversées, deux sémantiques.
27. **Injecter `reussi_si_expr` ou `reussi_si_texte` dans un contexte de modèle** *(veto préventif)* — un narrateur qui connaît la condition de réussite y conduit.
28. **Affirmer au plan la couleur d'un test sans l'avoir exécuté.**
29. **Étendre à « une condition d'ÉCHEC satisfaite dès le tour zéro »**, alors même que le cas est **réel** dans le dépôt — cause différente, sens d'erreur inverse.
30. **Assouplir la ligne `possede_objet`** au motif qu'un objet pourrait être porté au départ ou ramassé — aucune des deux formes n'existe au schéma.
31. **Corriger la fixture en changeant le prédicat de l'objectif** — la prose émise verbatim établit l'intention inverse.
32. **Une remédiation renvoyant à « Objectifs → Condition de réussite »** — cet écran n'écrit pas `reussi_si_expr`.
33. **Laisser le commentaire de `deltas.ts` en l'état** — voir C7.

### `REJETÉ` — UX

34. **Nommer le prédicat par sa clé technique** (`indice_connu`…) plutôt que par son libellé français.
35. **Nommer la cible par son id brut** — le seul précédent qui le fait sert un autre axe (`severity: error`, jamais persisté).

### `REPORTÉ`

- **→ it8** : `canon-sans-objectif`, **avec** la question doctrinale « le linter se tait-il sur `objectifs` vide ? ».
- **→ it8** : la scission de `controles.ts` en registre + proses, **en tête d'itération, avant ses règles**.
- **→ `open_questions`** : la condition d'ÉCHEC vraie au tour zéro (`canon.objectifs[1].echoue_si_expr` de la fixture) — défaut réel, cause distincte.
- **→ `open_questions`** : `charpente.fins[0].condition_expr` porte la même feuille morte — « aucune fin atteignable » est une cause distincte (KR-164), que la réparation de fixture soigne incidemment sans la couvrir.

---

## 10 — Définition de fini

- Prettier → `tsc --noEmit` → ESLint → `jest`, tous verts.
- Les 8 critères du § 6 sont verts, **et les quatre mutants nommés (critères 1, 2, 5, 6) ont été écrits, vus rouges, puis annulés** — le pouvoir séparateur se prouve, il ne se déduit pas.
- `panneauControles.test.tsx` et `dossierEditorScreen.test.tsx` : **0 ligne**, `git diff` le prouve.
- Aucun nouvel export dans `brain/index.ts` — `git diff` le prouve.
- H3 est en tête d'`atteignabilite.ts`, l'en-tête du bloc mentionne les itérations 6 **et** 7, et `deltas.ts` ne contredit plus `predicates.ts`.
- `npm run test:mutation` **non requis** : aucun des quatre fichiers mutés n'est touché.

---

## 11 — Signatures

**`atteignabilite.ts` expose** — au module `brain/dossier/` seul, **rien au baril** :

    export interface FeuilleInaccomplissable {
    	/** Libellé FRANÇAIS du prédicat — `PREDICATES[id].label`, résolu ICI. Jamais la clé. */
    	readonly predicat: string
    	/** Les identifiants visés, DANS L'ORDRE de `refKinds`. Arité 1 ou 2. */
    	readonly cibles: readonly string[]
    }

    export function premiereFeuilleInaccomplissable(
    	dossier: Dossier,
    	condition: ExprNode,
    ): FeuilleInaccomplissable | null

`null` **=** accomplissable. **Docstring imposée** : « Satisfiabilité, pas évaluation — aucun état de session lu ; l'évaluation en session appartient à la n° 9 `moteur-dossier`, et ce module ne la paraphrase pas. SENS D'ERREUR : le FAUX NÉGATIF — dans le doute on rend `null`, seule direction permise sous une règle bloquante. Totale sur un arbre accepté par `validateExpr` ; AUCUNE borne de récursion propre — c'est `PROFONDEUR_MAX_EXPR` chez le validateur qui la lui garantit. »

**Traversée bottom-up, déterministe par ordre du document** : `predicat` → table ; `et` → la feuille du **premier** enfant non `null` ; `ou` → `null` dès qu'**un** enfant rend `null`, sinon la feuille du **premier** ; `non` → **`null` sans descendre**.

**Privé au module**, jamais exporté :

    interface EtatDuDossier { dossier: Dossier; indicesProduits: ReadonlySet<string>; objetsDonnes: ReadonlySet<string> }
    const ETABLISSEMENT: Record<PredicatId, (etat: EtatDuDossier, cibles: readonly string[]) => boolean>

**Les sept lignes de la table** :

| prédicat | it7 |
|---|---|
| `possede_objet` | **mord** — un `donner_objet` ciblant l'objet, aux 4 sites de `CHEMINS_DE_DELTAS`. **Jamais dérivé de `refKinds.includes('objet')`** : `retirer_objet` partage ce `refKind` et est un producteur négatif |
| `indice_connu` | **mord** — `producteursParIndice` **saturé** ≥ 1, réutilisé tel quel, jamais un second parcours |
| `pnj_a_revele` | **mord** — la **PAIRE** : le personnage porte un `savoirs[]` dont l'`indice_id` vaut la cible. Évaluée **jointement** (H3) |
| `jalon_atteint` | **non évaluée à it7** — la porte `declencheur_expr` est charge d'it8 |
| `evenement_consomme` | **non évaluée à it7** — aucun delta ne consomme un événement |
| `lieu_visite` | **non évaluée à it7** — KR-224, monde ouvert |
| `lieu_courant_est` | **non évaluée à it7** — KR-224 |

**Garde de silence** : une feuille dont une cible ne résout aucune entité produit **zéro constat** — c'est une `reference-pendante` de sévérité `error`, structurellement absente d'un dossier persisté (KR-225), et la traiter doublerait le canal (KR-217).

**`controles.ts` consomme `premiereFeuilleInaccomplissable` seule.** Il n'importe **ni `PREDICATES`, ni `ExprNode`** : il reçoit du français et des identifiants, résout l'entité par `collectIds` / `localiserEntite`, écrit la prose.

> ⚠ **Piège de rédaction, mesuré par le tech-lead** : la garde de couture d'`atteignabilite.test.ts` porte sur le **texte brut du fichier, commentaires compris**. Une docstring qui écrirait « ce module ne connaît ni `SectionId` ni `NiveauControle` » **ferait rougir la garde en disant la vérité**. Formuler « ni identifiant de section, ni mot de niveau ».
