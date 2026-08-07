# Plan d'itération — `dossier-format` · itération `4`

> **VALIDÉ** par l'auteur du produit le 2026-08-07. Porte 1 (mécanique) verte, porte 2 (humaine) franchie. Reporté dans `src/features/dossier-format/specification.json`.

**Composition** : les quatre rôles socles **+ `narratif-ia`**. Motif : l'itération livre `DELTAS`, le vocabulaire de ce que le moteur **écrit** dans l'état de session — frontière code/IA, et contrat que quinze features consommeront.

**Tours tenus** : deux tours, cinq rôles, notes dans `.claude/raffinage/dossier-format-it4/`. **Aucun `ESCALADE`** : le seul veto maintenu (aucun delta ne peut nommer un monstre) est dans le domaine de son émetteur et devient **dérivé** d'un test.

---

## Fiche de validation *(à lire en deux minutes)*

**Phrase de démo** — À la fin de cette itération, l'auteur peut voir refusé tout effet ou savoir de son dossier qui pointe une entité inexistante ou qui n'a pas la forme attendue.

**La tranche** — Du fichier JSON déposé au rapport d'anomalie rédigé, en traversant le registre (`DELTAS`, 4 entrées), son validateur de forme, la résolution référentielle des deltas **et** des trois champs de `savoirs[]` encore ouverts, plus le garde d'éléments de liste que BUG-050 réclame depuis it3. Aucun écran.

**Les lots**

| id | titre | fichiers | type |
|---|---|---|---|
| 1 | `contrat-dossier-it4` | 14 (2 N / 12 R) | **`contrat`** |

Un lot, **mesuré et non supposé** : `validate.test.ts` épingle à lui seul la cardinalité d'`issues.ts`, le comportement à la compilation de `types.ts` et le comportement du validateur — tout découpage le nommerait deux fois.

**Hors périmètre** — `relations`, `presences`, `acces`, `mene_a` (n'existent pas ; décision A → n° 4/5/6) · `monstre_ref` (résolu depuis it2) · tout opérande **entier** (`gagner_xp`, `modifier_pv`, les deux bonus) · `applyDelta` et tout évaluateur (n° 9) · toute section neuve de `docs/REGLES-DU-JEU.md` · l'extraction de `references.ts` · tout élargissement de `sitesDe`.

**Reports** — n° 9 : les champs de session écrits par les deltas, et le test-grep de réservation qui forcera la décision · n° 9/12 : les opérandes entiers, retour **additif** · n° 12 : `modifier_confiance` · it5 : la branche « delta sur chaque cible » de la checklist se lit « sur chaque cible **admissible** ».

**`INNOVATION` : aucune.**

**Plan écrit dans `.claude/raffinage/dossier-format-it4.plan.md`. Valide, ou dis ce qui doit changer.**

---

## 0 — Deux corrections à porter AVANT la première ligne de code

1. **Le `goal` d'it4 dans `specification.json` est fautif** et le restera tant qu'il n'est pas réécrit : il nomme `relations`, `presences`, `acces`, `mene_a` — qui n'existent nulle part — et `monstre_ref`, résolu depuis it2. Condition de recevabilité posée par le PM **et** la QA : *un consensus de comité qui ne redescend pas dans le fichier que l'essaim va lire n'est rien.* Texte retenu (PM) :

   > « L'auteur peut voir refusé tout effet ou savoir mal formé de son dossier — référence à une entité qui n'existe pas, opération que le moteur ne reconnaît pas, ou élément de liste qui n'est pas un objet — sans que rien ne passe silencieusement en `ok:true`. »

2. **Le symptôme de BUG-050 sur-déclare.** Il affirme « … et pour toute entité d'une collection identifiée ». **Faux, vérifié** : un élément non-objet dans une collection de `COLLECTIONS_IDENTIFIEES` donne `id: null` dans `collectIds`, donc `champ-requis-vide`, **bloquant depuis it1**. Le trou réel est de **trois** chemins. À corriger dans `bug_history.json` dans ce lot.

## 1 — But raffiné

Le registre `DELTAS`, son validateur, la résolution des références qu'il porte, celle des trois derniers champs de `savoirs[]`, et le garde d'éléments de liste. Une seule propriété : **rien ne traverse le validateur sans être nommé**.

## 2 — Hors périmètre

1. **`relations`, `presences`, `acces`, `mene_a`** — 0 occurrence dans `types.ts`. Les inscrire serait une forme sans éditeur **et** un rougissement mécanique : une ligne de table sans instance en fixture échoue par construction.
2. **`monstre_ref`** — le rouvrir créerait un **second site de résolution**.
3. **Tout opérande entier.** Deux motifs indépendants : (a) KR-130 — `docs/REGLES-DU-JEU.md` § 1 *calcule* `PV = FO+AG+EN`, § 5 *calcule* tout gain d'XP depuis ΔT, le bonus d'attaque est plafonné à +5 par la seule boutique, et le bonus de défense **n'apparaît dans aucune section** (il vient d'`action-pnj`, feature supprimée) ; (b) KR-165 (QA) — une magnitude sans **borne nommée** ne peut recevoir aucun test à la limite, donc aucun critère observable. Le second tient même si la doc gagnait sa section demain.
4. **Toute section neuve de `docs/REGLES-DU-JEU.md`** — écrire une règle de jeu dans une itération de format est l'inversion exacte que KR-130 interdit.
5. **`applyDelta`, tout évaluateur** — n° 9, comme **champ du descripteur**, jamais un `switch`.
6. **L'extraction de `references.ts`** — une boucle, un appelant. Si la porte mesure **> 700 lignes**, l'ouvrier **s'arrête et rapporte** ; il n'improvise pas de coupe.
7. **Tout élargissement de `sitesDe`** — grammaire FIGÉE ; la forme d'un delta appartient à `validateDelta`.
8. **Le score de mutation** — sans objet (KR-161).

**Aucune valeur visuelle** : le lot ne touche ni CSS, ni composant, ni token, ni `src/features/**` (hors un test qui lit la même fixture).

## 3 — Contrat de design

Aucune surface neuve. La modale d'import rend ces anomalies telles quelles.

### 3.1 — Vocabulaire des clés (tranché)

Le littéral est `{ delta: DeltaId, cibles: string[] }`. **`op` est refusé** : dans ce module, `op` désigne les quatre **opérateurs structurels** d'`ExprNode`, jamais une clé de registre — celle d'un prédicat est `predicat`, celle d'un delta est donc `delta`. Trouvé par l'UX **en s'appliquant sa propre objection**, ratifié par le tech-lead et le narratif contre leurs positions du tour 1. `cibles` reste un **tableau même à l'arité 1** ; l'arité est **dérivée** de `refKinds.length`.

**Le descripteur est `{ label, refKinds }`** — ni `cible`, ni `grandeur`. La grandeur mutée vit en **JSDoc par entrée, en prose**. Un champ typé n'aurait aucun lecteur avant la n° 9 : c'est le motif qui a retiré `lit:` en it3.

### 3.2 — La matrice de rejet (KR-158 — écrite avant le code)

| entrée fautive | `code` | canal | `location` nomme |
|---|---|---|---|
| élément d'une des **3** listes dérivées qui n'est pas un objet (`savoirs: ["texte"]`, `plan_actions`, `resolutions`) | `element-non-objet` | error | l'entité porteuse (ou repli indexé) + l'index fautif |
| élément d'une des **4** listes de `CHEMINS_DE_DELTAS` non-objet, sans clé `delta`, ou portant une clé inconnue | `delta-malforme` | error | l'entité porteuse (jalon / quête / événement) |
| `delta` absent de `DELTAS` | `delta-inconnu` | error | l'entité porteuse + la valeur fautive |
| clé héritée du prototype en position de `delta` ou de cible | selon la position — **jamais `ok:true`** | error | régression nommée de BUG-053 / KR-175 |
| cible de delta mal formée ou de mauvais espace | `identifiant-invalide` *(réutilisé)* | error | l'entité porteuse + l'id |
| cible de delta bien formée non portée | `reference-pendante` *(réutilisé)* | error | l'entité porteuse + l'id |
| `savoirs[].indice_id` pointant un indice absent | `reference-pendante` | error | **le personnage** porteur |
| `revele_si.contrepartie.objet_id` pointant un objet absent | `reference-pendante` | error | **le personnage** porteur |
| `revele_si.apres_indice_id` pointant un indice absent | `reference-pendante` | error | **le personnage** porteur |

**La scission `element-non-objet` / `delta-malforme` est écrite ici, pas laissée à l'ouvrier** : `charpente.jalons[].effet` étant dans `CHEMINS_DE_DELTAS`, il est **exclu** de la dérivation, donc `effet: ["du texte"]` et `savoirs: ["du texte"]` **n'ont pas le même code**. Trouvé par le narratif, ratifié par la QA.

### 3.3 — Les trois codes neufs (union 16 → 19)

```ts
'delta-inconnu':      '↪ Remplacez l’effet de « {champ} » par l’un de ceux que le moteur reconnaît, puis réimportez-le.',
'delta-malforme':     '↪ Corrigez la forme de « {champ} » dans le fichier (clé « delta » et ses cibles), puis réimportez-le.',
'element-non-objet':  '↪ Remplacez cet élément de « {champ} » par un objet, puis réimportez-le.',
```

**QUOI**, interpolé au site d'appel :
- `delta-inconnu` : « Le champ « {champ} » utilise l'effet « {valeur} », qui n'existe pas dans le registre des effets. »
- `delta-malforme` : « Le champ « {champ} » attend un effet structuré reconnu (une clé « delta », puis ses cibles) ; il contient « {valeur} ». »
- `element-non-objet` : « Le champ « {champ} » attend une liste d'objets ; l'un de ses éléments n'en est pas un (« {valeur} »). »
- `reference-pendante` sur une cible : « L'effet « {label} » de « {champ} » pointe « {valeur} », qui n'existe pas dans ce dossier. »
- `identifiant-invalide` sur une cible : « L'effet « {label} » de « {champ} » fournit « {valeur} », qui n'est pas un identifiant valide. »

### 3.4 — `DELTAS` : quatre entrées, et la règle d'admission

| `delta` | `label` | `refKinds` | ce qui y répond |
|---|---|---|---|
| `donner_objet` | « donne l'objet » | `['objet']` | **existe** — `usePlaySession.ts:181`, `actionEngine.ts:213` |
| `retirer_objet` | « retire l'objet » | `['objet']` | **existe** — `usePlaySession.ts:256`, `actionEngine.ts:106` |
| `reveler_indice` | « révèle l'indice » | `['indice']` | **n'existe pas encore** — lu par `indice_connu` et `pnj_a_revele` |
| `atteindre_jalon` | « marque le jalon atteint » | `['jalon']` | **n'existe pas encore** — lu par `jalon_atteint` |

**Règle d'admission** : un delta n'entre que si (a) il écrit un champ que le runtime mute déjà **ou** qu'un prédicat de `PREDICATES` lit ; (b) tous ses opérandes sont des identifiants stables ; (c) son `refKinds` est **inclus dans l'union des `refKinds` de `PREDICATES`** ; (d) le moteur peut l'appliquer **sans lancer un dé**.

La clause (c) fait du veto « aucun delta ne peut nommer un monstre » un **corollaire dérivé** plutôt qu'une assertion isolée : `bestiaire` n'étant dans le `refKinds` d'aucun prédicat, aucun delta ne peut l'atteindre.

**Écartés, motif à lever avant réouverture** : `gagner_xp`, `modifier_pv`, `modifier_pe`, `modifier_bonus_attaque`, `modifier_bonus_defense`, `modifier_carac`, `equiper_objet`, `deplacer_vers`, `consommer_evenement`, `modifier_confiance`, `ouvrir_combat`. Réouverture d'un opérande entier : **une section de `docs/REGLES-DU-JEU.md` → `rules.golden.test.ts` → le code, dans cet ordre**.

## 4 — Contrats `brain/` touchés

| contrat | sens | forme |
|---|---|---|
| `brain/dossier/deltas.ts` | **fourni** | `DELTAS`, `DeltaId`, `DeltaDescripteur`, `Delta`, `SiteDelta`, `validateDelta`, `collectDeltaRefs`, `RefDeltaCollectee` |
| `brain/dossier/identifiers.ts` | **étendu** | `defineRegistre` (3ᵉ appelant), `decrireValeur` (3ᵉ appelant) — **deux dettes que le code avait datées lui-même** |
| `brain/dossier/tables.ts` | **étendu** | `REFERENCES_SIMPLES` (neuve), `LISTES_A_ELEMENTS_STRUCTURES` (**dérivée**) |
| `brain/dossier/types.ts` | **étendu** | `DeltaBrut` **disparaît** → `Delta` aux quatre emplacements |
| `brain/dossier/issues.ts` | **étendu** | union 16 → 19 |
| `brain/index.ts` | **étendu** | **types seuls** : `Delta`, `DeltaId` ; `DeltaBrut` sort |

**Ordre acyclique** : `identifiers` → `issues` → `predicates` → `expr` → **`deltas`** → `types` → `tables` → `validate`. `deltas.ts` n'importe **ni `expr.ts` ni `predicates.ts`** : deux registres frères ne se dépendent pas ; `SiteDelta` est recopié.

**Ne sortent PAS du baril** : `DELTAS`, `validateDelta`, `collectDeltaRefs`. Tenu par un test-grep — le jour où la n° 11 voudra câbler le registre dans un schéma de sortie, elle devra **supprimer un test**, c'est-à-dire prendre la décision au lieu de la subir.

## 5 — Lot unique — `contrat-dossier-it4` `contrat`

**Ouvrier** : `dev-contrat`, effort élevé, **sans worktree**, séquentiel.

**N** : `src/brain/dossier/deltas.ts` · `src/brain/dossier/deltas.test.ts`
**R** : `identifiers.ts` · `predicates.ts` · `expr.ts` · `types.ts` · `tables.ts` · `issues.ts` · `validate.ts` · `destinations.ts` · `couverture.test.ts` · `validate.test.ts` · `__fixtures__/dossier-minimal.json` · `src/brain/index.ts`

`predicates.ts` et `expr.ts` entrent **pour les deux renommages seuls** (`defineRegistre`, `decrireValeur`) — leur propre docstring avait écrit « extraction au troisième ».

**Ouvrables sous KR-162**, classement `PORTÉ`/`SUPPRIMÉ` obligatoire : `roundtrip.test.ts`, `read.test.ts`, `identifiers.test.ts`, `expr.test.ts`, `src/features/dossier-format/tests/importDossier.test.tsx` (il lit **la même fixture**). Deux tests **portés** : « un objet aux quatre chemins de delta passe » s'**inverse** ; `toHaveLength(16)` → `19`. Plus `bug_history.json` (correction du symptôme de BUG-050).

## 6 — Critères d'acceptation

1. **Étant donné** un effet dont la clé `delta` n'est pas une entrée de `DELTAS`, **quand** on valide, **alors** `delta-inconnu` bloquant nomme l'entité porteuse par son nom et la valeur fautive. *(unitaire + contrat)*
2. **Étant donné** un effet non-objet, sans clé `delta`, ou portant une clé inconnue, **quand** on valide, **alors** `delta-malforme` bloquant sort — **distinct** d'`element-non-objet`, la frontière étant `CHEMINS_DE_DELTAS`. *(contrat)*
3. **Étant donné** une cible d'effet, **quand** elle est mal formée ou d'un mauvais espace **alors** `identifiant-invalide` ; **quand** elle est bien formée et qu'aucune entité ne la porte **alors** `reference-pendante`, le message nommant le **label** de l'effet. *(unitaire + contrat)*
4. **Étant donné** l'un des trois champs `savoirs[].indice_id`, `…contrepartie.objet_id`, `…apres_indice_id` pointant une entité absente, **alors** `reference-pendante` bloquant nomme **le personnage** porteur — jamais le savoir, qui n'a pas de nom. Un test **par champ**, échouant par nom de champ. *(contrat)*
5. **Étant donné** un élément non-objet dans l'une des listes de `LISTES_A_ELEMENTS_STRUCTURES`, **alors** `element-non-objet` bloquant nomme le porteur et l'index ; **et** cet ensemble est **dérivé** de `LISTES_REQUISES` moins `COLLECTIONS_IDENTIFIEES`, jamais une cinquième table — vaut **3 chemins** aujourd'hui, à remesurer. *(contrat)*
6. **Étant donné** `DELTAS`, **quand** on l'inspecte, **alors** il compte 4 entrées, chacune instanciée en fixture ; tout `refKinds[i]` a une ligne dans `COLLECTIONS_IDENTIFIEES` et est **inclus dans l'union des `refKinds` de `PREDICATES`** ; `bestiaire` n'y figure jamais ; et toute indexation passe par `estCleDe` — une clé de prototype ne résout aucune entrée (KR-175). *(unitaire)*
7. **Étant donné** la fixture portant de vrais effets, **quand** `couverture.test.ts` s'exécute, **alors** le balayage s'arrête sur **chaque élément** de delta — points d'arrêt **dérivés** de `CHEMINS_DE_DELTAS` **suffixés `[]`** —, aucune feuille ne descend dans un effet, et tout chemin d'effet a une destination valant `moteur`. *(contrat, avec sa sonde rouge/vert)*
8. **Étant donné** la fixture lue **du disque**, **quand** on l'importe puis l'exporte, **alors** le document réimporté est deep-equal et reste valide. *(contrat, fichier réel — KR-156)*

## 7 — Tests nommés

| test | fichier | niveau | KR |
|---|---|---|---|
| `DELTAS compte quatre entrees` | `deltas.test.ts` | unitaire | KR-117 |
| `tout refKinds a une ligne dans COLLECTIONS_IDENTIFIEES, et bestiaire n y figure jamais` | `deltas.test.ts` | unitaire | KR-169 |
| `tout refKinds de DELTAS est inclus dans l union des refKinds de PREDICATES` | `deltas.test.ts` | unitaire | **veto narratif, dérivé** |
| `DELTAS toString et constructor ne resolvent aucune entree` | `deltas.test.ts` | unitaire | **KR-175, régression BUG-053** |
| `validateDelta est totale : du bruit ne leve jamais et rend des anomalies redigees` | `deltas.test.ts` | unitaire | KR-116 · KR-169 |
| `refuse une cle inconnue sur un effet` | `deltas.test.ts` | unitaire | contrepartie de l'arrêt dérivé |
| `un delta inconnu nomme l entite porteuse et la valeur` | `validate.test.ts` | contrat | KR-164 |
| `un element non-objet d une liste de deltas est delta-malforme, jamais element-non-objet` | `validate.test.ts` | contrat | **scission § 3.2** |
| `un element non-objet d une des trois listes derivees est element-non-objet` | `validate.test.ts` | contrat | **régression BUG-050** |
| `un test PAR CHAMP : les trois references de savoirs[] nomment le PERSONNAGE` | `validate.test.ts` | contrat | KR-164 |
| `une cible d effet mal formee est identifiant-invalide, une cible non portee est reference-pendante` | `validate.test.ts` | contrat | KR-158 |
| **sonde rouge/vert de l'arrêt dérivé** : sans suffixe `[]`, « aucune ligne morte » **rougit** ; avec, elle passe — **les deux captures au journal** | `couverture.test.ts` | contrat | **KR-174, doctrine BUG-051** |
| `aucune feuille ne descend dans un effet` + test-grep `aucune seconde liste de chemins de delta` | `couverture.test.ts` | statique | veto tech-lead |
| `tout chemin de CHEMINS_DE_DELTAS a une destination valant moteur` | `couverture.test.ts` | contrat | KR-174 |
| `retirer une entree de COLLECTIONS_IDENTIFIEES fait rougir la derivation` | `couverture.test.ts` | contrat | discriminance C5 |
| test-grep `la derivation lit les deux tables, jamais un litteral des trois chemins` | `couverture.test.ts` | statique | KR-169 |
| test-grep `DELTAS n est reference par aucun fichier hors brain/dossier/` | `deltas.test.ts` | statique | **KR-169, clause d'escalade** |
| test-grep `aucun acces a DELTAS hors estCleDe` | `deltas.test.ts` | statique | KR-175 |
| **test-grep de réservation** : `aucun fichier de src/player/** n ecrit jalons_atteints, indices_connus ni evenements_consommes` | `deltas.test.ts` | statique | **C12 — voir § 8** |
| `un dossier portant de vrais effets traverse import puis export intact` | `roundtrip.test.ts` | contrat | KR-156 |

**Ce que personne ne vérifiera, à écrire tel quel dans la revue** : la fidélité de l'inventaire `DELTAS` à `actionEngine.ts` / `usePlaySession.ts` au-delà de ce qu'un test nomme — **lecture humaine, pas instrument** · que la n° 4/5/6 choisira la bonne table en ajoutant sa collection · que `climat[].effets_regles` n'a structurellement aucun delta admissible (rien ne l'empêche mécaniquement — c'est une correction de la checklist d'it5, pas une règle du validateur) · l'ordre chronologique de la correction de BUG-050.

## 8 — Registre des désaccords

| # | statut | motif |
|---|---|---|
| C1 | **RETENU** — hors it4, **et le `goal` corrigé dans la spec avant le lot** | 0 occurrence ; décision A. Le PM et la QA en font une condition de recevabilité : un consensus qui ne redescend pas dans le fichier lu par l'essaim n'existe pas |
| C2 | **RETENU** — `monstre_ref` non re-livré | second site de résolution = deux vérités |
| C3 | **RETENU : 4 entrées, références seules** | l'UX a **retiré ses quatre entrées elle-même** après avoir vérifié qu'aucune section de la doc des règles ne les porte. Deux motifs indépendants tiennent : KR-130 et KR-165 (pas de borne nommée → aucun test à la limite) |
| C4 | **RETENU : clé `delta`** | `op` est déjà l'opérateur structurel d'`ExprNode`. Trouvé par l'UX **contre sa propre position**, ratifié par le tech-lead **contre la sienne** |
| C5 | **RETENU : dérivation `LISTES_REQUISES` − `COLLECTIONS_IDENTIFIEES`** | le tech-lead a mesuré que **sa propre** dérivation du tour 1 était fausse deux fois (soustraction vide, union sur-couvrante). **Vérifié par l'orchestrateur** : un élément non-objet d'une collection identifiée donne `id: null` → `champ-requis-vide`, bloquant depuis it1. Le trou réel vaut **3 chemins**. La QA a retiré sa préférence pour une table dédiée : la dérivation s'adosse à deux tables **déjà maintenues pour d'autres raisons**, une 5ᵉ table serait le seul endroit où l'oubli passerait inaperçu |
| C6 | **RETENU : `element-non-objet`** | trois rôles sur quatre. La collision que craint le tech-lead (`objet` est un espace de noms) porte sur un identifiant **machine**, que l'auteur ne lit jamais — ce qu'il lit, c'est le message, et « liste d'objets » y est le mot juste |
| C7 | **RETENU** — `depart.lieu_id` migre dans `REFERENCES_SIMPLES` | supprime un site de résolution câblé en dur (KR-117). **Changement de comportement nommé** : le § 5a supprimait la pendante quand `monde.lieux` manque, la boucle générique ne le fera pas — cohérent avec le § des conditions. Classé **PORTÉ** |
| C8 | **RETENU : arrêt dérivé, chemins SUFFIXÉS `[]`** | le tech-lead proposait le niveau du **tableau** ; le narratif a montré que la proposition littérale **tue les quatre lignes de destinations**, et la QA l'a **retracé à la main indépendamment**. Le suffixe fait tomber l'arrêt sur l'**élément** : les destinations existantes survivent, et deux effets dans une même liste restent **deux occasions de rougir**. Contrepartie indissociable : `validateDelta` refuse **toute clé inconnue**. **Sonde rouge/vert obligatoire** |
| C9 | **RETENU : `effets_regles: []`**, aucune section de règles écrite ici | un climat « modifie les règles » : sa nature est un opérande entier, qu'on n'admet pas. Conséquence mécanique **vérifiée** : la ligne de destination du climat perd son `[]` — même ligne, retaillée |
| C10 | **RETENU** — `DELTAS` non exportée + test-grep | c'est l'instrument de la clause d'escalade du narratif |
| C11 | **RETENU** — `estCleDe` + test-grep | convergence 3/3. **KR-175 appliqué en amont** pour la première fois, au lieu d'être redécouvert en revue de PR |
| C12 | **REPORTÉ n° 9**, avec son test-grep écrit **maintenant** | fait établi par le narratif puis par la QA : `SessionState` **n'a pas de `monde`** ; cinq des sept prédicats d'it3 lisent des champs qui n'existent que dans la prose. Ce n'est **pas un défaut du code livré** — `PREDICATES` est un contrat pour un moteur qui arrive en n° 9 — mais la règle d'admission enregistrée en it3 (« un champ nommé de l'état de session y répond ») se lisait comme un fait vérifié. Le test-grep de réservation transforme le constat en **décision tracée** : le jour où la n° 9 écrit l'un de ces champs, elle **supprime le test** |
| C13 | **RETENU : une seule itération** | mesuré par le tech-lead (`validate.test.ts` épingle trois choses à lui seul) et par le PM (précédent d'it3 : cinq familles sous un quantificateur universel). La QA distingue deux échelles à ne pas confondre : **8 critères d'acceptation**, 20 tests nommés — la granularité d'un test par cause n'est pas un dépassement |
| C14 | **RETENU : le plafond de 650 était une invention** | **vérifié** : il n'apparaît que dans les trois documents du raffinage d'it3, jamais dans le dépôt. La règle réelle est KR-112 (400 signal, 800 bloqueur). Le tech-lead le retire lui-même et corrige sa base : `validate.ts` fait **607** lignes, pas 602. Remplacé par une consigne qui ne se déguise pas en règle : **> 700 → l'ouvrier s'arrête et rapporte** |

**Arbitrages de l'orchestrateur** :

- **Sur C8, j'ai tranché contre le tech-lead** alors qu'il tenait sa position au tour 2. Motif : deux rôles ont **retracé le walker à la main** et convergé sur le même défaut, alors qu'il affirmait « le seul montage qui survive à C9 » — or les deux montages survivent, le sien coûte quatre renommages et **perd la corruption par élément**. La sonde rouge/vert tranchera par le fait, pas par l'autorité.
- **Un KR à poser (KR-176)** : *un seuil chiffré cité dans un plan doit nommer sa source, sinon il n'existe pas.* Le « ≤ 650 lignes » est né d'une note de comité, est devenu un critère contraignant du plan d'it3, puis a été reporté par la revue comme « (plafond 650) » — chaque copie fidèle à la précédente, aucune fautive isolément, et à l'arrivée une contrainte de projet que personne n'avait décidée. Variante de KR-159 : non pas un décompte au prédicat faux, mais **un seuil sans source qui acquiert l'autorité par répétition**.
- **Correction du dossier d'it3** : la revue et le CHANGELOG portent « 602 lignes » — vrai à la mesure, faux après les correctifs de la revue de PR que je n'ai pas re-mesurés. À corriger dans ce lot.

## 9 — Innovation

**Aucune.** Le budget n'est pas consommé.

## 10 — Définition de fini

1. Prettier → `tsc --noEmit` → `npm run lint` → `jest` **complet** verts.
2. Les **huit critères** constatés par un test **nommé** du § 7, et **chaque propriété affirmée en docstring a son test** (KR-169).
3. `validate.ts` **mesuré** ; **> 700 lignes → arrêt et rapport**, jamais une coupe improvisée. Aucun plafond inventé n'est réintroduit (KR-176).
4. La **sonde rouge/vert** de l'arrêt dérivé est **exécutée et ses deux états journalisés** — sans elle, la correction de C8 est un raisonnement, pas un fait.
5. Chaque test touché classé **PORTÉ** ou **SUPPRIMÉ** (KR-162).
6. `bug_history.json` : symptôme de BUG-050 **corrigé** ; KR-176 mirroité dans `code-knowledge.json`.
7. `grep` de fini : aucun `parseExpr`, aucune conversion `Book` ↔ `Dossier`, aucun élargissement de `sitesDe`, aucune valeur de `DELTAS` hors `brain/dossier/`, aucune indexation de registre hors `estCleDe`.
8. **Budget de contexte relevé.** Points serrés connus : `specification.json` de la feature à **66 272 / 66 560** (288 o) et le couple `CLAUDE.md` + `docs/WORKFLOW.md` à **46 022 / 46 080** (58 o). Le report d'it4 **franchira** le premier : la compaction se fait **dans ce lot-ci**, en réduisant d'abord les décisions d'it3 devenues livrées (leur raisonnement est dans `dossier-format-it3.revue.md`).

## 11 — Signatures

### `src/brain/dossier/deltas.ts` (N)

```ts
export interface DeltaDescripteur {
	/** Libellé français — la valeur du Select des n° 3/6/7. Jamais une syntaxe. */
	label: string
	/** L'espace de noms attendu à CHAQUE position de `cibles`. L'ARITÉ est
	 *  `refKinds.length`, DÉRIVÉE, jamais stockée (KR-165). Tout espace listé ici a une
	 *  ligne dans `COLLECTIONS_IDENTIFIEES` ET est nommé par un `refKinds` de
	 *  `PREDICATES` — c'est ce qui rend « aucun effet ne peut nommer un monstre »
	 *  mécanique plutôt que conventionnel. */
	refKinds: readonly EspaceDeNoms[]
}

export const DELTAS = defineRegistre<DeltaDescripteur>()({
	donner_objet:    { label: "donne l'objet",           refKinds: ['objet'] },
	retirer_objet:   { label: "retire l'objet",          refKinds: ['objet'] },
	reveler_indice:  { label: "révèle l'indice",         refKinds: ['indice'] },
	atteindre_jalon: { label: 'marque le jalon atteint', refKinds: ['jalon'] },
})
export type DeltaId = keyof typeof DELTAS

/** La forme persistée d'un effet de règle. `cibles` reste un TABLEAU même à l'arité 1.
 *  La clé discriminante est `delta`, JAMAIS `op` — `op` est l'opérateur structurel
 *  d'`ExprNode`, et le miroir de `predicat: PredicatId` est `delta: DeltaId`. */
export interface Delta { delta: DeltaId; cibles: string[] }

/** Le champ PORTEUR de l'effet — jumeau de `SiteExpr`, RECOPIÉ : deux registres
 *  frères ne se dépendent pas. Extraction au troisième. */
export interface SiteDelta { path: string; location: string }

/** LA FORME, toute la forme — frontière de confiance (KR-116). TOTALE sur `unknown`,
 *  ne lève JAMAIS. Indexe `DELTAS` par `estCleDe`, jamais par `in` ni par un test
 *  d'index, jamais derrière un `as` (KR-175, BUG-053). Refuse TOUTE clé inconnue sur
 *  l'effet : contrepartie indissociable de l'arrêt du balayage de couverture. */
export function validateDelta(valeur: unknown, site: SiteDelta): DossierIssue[]

export interface RefDeltaCollectee {
	id: string
	/** L'espace ATTENDU à cette position, lu dans `refKinds[i]`. */
	espace: EspaceDeNoms
	/** L'effet porteur — requis par le message, qui le nomme par son `label`. */
	delta: DeltaId
}

/** Relevé plat des références d'un effet BIEN FORMÉ. Totale **sur un effet déjà
 *  accepté par `validateDelta`** — l'absolu est qualifié à dessein. Appelée
 *  UNIQUEMENT si `validateDelta` s'est tue : deux anomalies pour une cause = du bruit. */
export function collectDeltaRefs(valeur: unknown): RefDeltaCollectee[]
```

### `identifiers.ts` (R) — deux extractions **au troisième appelant**

```ts
/** Factory d'identité — 3ᵉ appelant (`ESPACES_DE_NOMS`, `PREDICATES`, `DELTAS`).
 *  `predicates.ts` avait écrit « Extraction au troisième » : c'est maintenant. */
export const defineRegistre = <V>() => <K extends string>(map: Record<K, V>): Record<K, V> => map

/** 3ᵉ appelant (`validate.ts`, `expr.ts`, `deltas.ts`) — même seuil, même geste. */
export function decrireValeur(valeur: unknown): string
```

### `tables.ts` (R)

```ts
export interface ReferenceSimple {
	path: string
	espace: EspaceDeNoms
	location: string
	/** Sujet de la phrase quand il ne se dérive pas du champ. Repli : « Le champ « {feuille} » ». */
	sujet?: string
}
export const REFERENCES_SIMPLES: readonly ReferenceSimple[] = [
	{ path: 'charpente.depart.lieu_id',                                      espace: 'lieu',   location: 'Point de départ', sujet: 'Le point de départ' },
	{ path: 'monde.personnages[].savoirs[].indice_id',                       espace: 'indice', location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id', espace: 'objet',  location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs[].revele_si.apres_indice_id',       espace: 'indice', location: 'Personnages' },
]

/** BUG-050 — DÉRIVÉE, jamais une 5ᵉ table. Les collections identifiées sont DÉJÀ
 *  gardées : un élément non-objet y donne `id: null` dans `collectIds`, donc
 *  `champ-requis-vide`, bloquant depuis l'itération 1 — les inclure produirait deux
 *  anomalies pour une cause. Vaut 3 chemins aujourd'hui (`plan_actions`, `savoirs`,
 *  `resolutions`) ; à REMESURER, jamais à recopier d'ici (KR-159). */
export const LISTES_A_ELEMENTS_STRUCTURES: readonly ChampRequis[] = LISTES_REQUISES.filter(
	(liste) => !COLLECTIONS_IDENTIFIEES.some((collection) => collection.path === liste.path),
)
```

### `couverture.test.ts` (R) — l'arrêt, **suffixé**

```ts
const CHEMINS_D_ARRET = new Set([
	...FAMILLES_DE_CONDITIONS.map((famille) => famille.expr),
	// Le suffixe n'est pas cosmétique : sans lui l'arrêt tombe sur le TABLEAU, les
	// quatre lignes `…[]` de DESTINATION_DES_CHAMPS deviennent mortes, et la
	// corruption cesse d'être par élément. Prouvé par sonde, pas déduit.
	...CHEMINS_DE_DELTAS.map((chemin) => `${chemin.path}[]`),
])
```

### `types.ts` (R)

`DeltaBrut` **disparaît**. Les quatre emplacements passent `Delta[]` : `Resolution.consequence`, `Quete.recompense`, `Climat.effets_regles`, `Jalon.effet`. Symétrie exacte avec `ExprNode`.

### `destinations.ts` (R)

Une seule ligne change : `monde.conditions.climat[].effets_regles[]` perd son `[]` — le climat portant `[]`, sa feuille n'a pas de suffixe. **Même ligne, retaillée** ; les trois autres sont inchangées.

### `issues.ts` (R)

Union 16 → **19** : `delta-inconnu`, `delta-malforme`, `element-non-objet`, avec les trois lignes QUOI FAIRE du § 3.3. Le `Record` étant fermé, ajouter un code sans son libellé **ne compile pas**.
