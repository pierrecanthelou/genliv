# Tour 2 — `tech-lead` (effort élevé)

**VERDICT — recevable, sans veto.** Trois mesures retournent le tour 1 ; deux vont dans mon sens, une me fait réviser.

**À la QA, nommément.** M3 confirme : sur `107:75`/`108:75`, le mutant remplace le nœud **interne**, le `!` de la colonne 74 reste, la source appliquée est `shield: !attacker.shield`. Ton raisonnement de type est juste — il porte sur un mutant que Stryker n'a pas produit. La faille est cernable : tu as lu le champ `replacement` sans reconstruire la **ligne mutée** depuis `start.column`/`end.column`. Le plan l'écrit en règle, et exige qu'aucune équivalence ne soit signée avant un **essai de meurtre écrit et échoué**. L'erreur allait dans la seule direction dangereuse : blanchir des mutants vivants.

Ton espion `Math.random` marche ; je ne le retiens pas. Non restauré — `restoreMocks` n'est posé dans aucune config — il retombe sans bruit sur l'assertion vraie une fois sur sept : **un témoin instable pour réparer une instabilité**. La borne est vraie **pour tout tirage** et tue sept mutants au lieu de deux.

**À l'UX** : tu as raison, `progression.rules.test.ts` est un nom de thème. Je retire mes deux noms pour **quatre fichiers, un par module**.

**Au PM** : je ne vise pas 90. C'est une transcription, pas une cible, et la n° 11 hérite de 90 dans les deux branches.

**Révision** : je retire la ligne `| ≤ 0 |` de la table d'Écart — elle rendrait la table fausse.

---

## ANNEXE

## 1 — Découpage définitif : 3 lots, 2 vagues, listes strictement disjointes

### Vague 1 — deux lots parallèles, type `outil` (aucun n'est `contrat`)

#### Lot A · `bornes-combat`

| Fichier | État |
|---|---|
| `src/brain/combat.test.ts` | **(N)** |
| `docs/REGLES-DU-JEU.md` | **(R)** — § 3 **uniquement**, deux emplacements, texte verbatim fourni § 4 |

**But** : les **27** mutants vivants de `combat.ts` tombent, **+2** (`107:64`/`108:64`) cessent d'être tués par coïncidence. **9 blocs `it`** (plafond mesuré : 12).

**Interface consommée** : `POSTURES`, `ecartBand`, `pfBase`, `resolveAssault`, `maitriseDesCoups` depuis `./combat` ; `WEAPONS`/`WeaponId` depuis `./equipment`. **Interface exposée : aucune.**

| # | `it` | Mutants visés | Source de la valeur |
|---|---|---|---|
| 1 | `POSTURES.normale.computeAT`, `rng` max → `MC − 6` | `26:45` | § 3 Postures, Normale |
| 2 | `POSTURES.precise.computeAT`, `rng` min → `MC − 4` | `31:45`, `31:14` | § 3 Postures, Précise |
| 3 | **borne** : les deux en `defensive`, `shield: true`, **MC distincts**, `rng = fixed(0.999)` → `atAttacker = MC_A+8`, `atDefender = MC_D+8`, `damage 0` | `36:53`, `107:64`, `107:74`, `107:75`, `108:64`, `108:74`, `108:75` | § 3 Postures + Équipement/Bouclier |
| 4 | `pfBase` avec arme de multiplicateur ≠ 1 | `75:9` | § 3 PF_base + table Armes |
| 5 | assaut gagné en posture `precise` (facteur 2) | `121:14` | § 3 Postures « Effet sur les dégâts » |
| 6 | `ecartBand(0)` et `ecartBand(-3)` → `'rate'`, `'Manqué'`, `0` | `61:6` ×2, `61:25`, `61:36`, `61:51` | **note de borne du § 3** (ajout 1 révisé) |
| 7 | libellés + codes des 4 bandes | `62:37`, `62:54`, `63:36`, `63:52`, `64:36`, `64:56`, `65:39` | § 3 table d'Écart, **inchangée** |
| 8 | AT égales → `winner 'tie'`, `ecart 0`, `band 'rate'`, `damage 0` | `110:6`, `110:26`, `110:36`, `110:93` | **ajout 2** (transcription de `REGLES-PLAY.md` § D2) |
| 9 | le **défenseur** l'emporte → `winner 'defender'` | `125:39` | § 3 « le score le plus élevé remporte » |

**Trois précisions opposables au lot A :**
- `it` 3 — **MC distincts**, pour que l'assaut ne prenne pas le retour anticipé de la l.110 et n'empiète pas sur l'`it` 8.
- `it` 8 — **n'assertit rien sur le rejeu du round.** `resolveAssault` rend un résultat, il ne boucle pas.
- **Ordre imposé DANS le lot** (KR-130) : 1) écrire les deux ajouts au § 3 ; 2) écrire les `it` 6, 7 et 8 **depuis la doc** ; 3) citer la section source dans la revue, une ligne par valeur.

**Vérification isolée** : `npx stryker run --mutate src/brain/combat.ts` → **72 mutants, 72 détectés, 0 survivant, 0 `# errors`**. Le lot **n'écrit aucun seuil**.

#### Lot B · `bornes-challenge-characteristics-xp`

| Fichier | État |
|---|---|
| `src/brain/challenge.test.ts` | **(N)** |
| `src/brain/characteristics.test.ts` | **(N)** |
| `src/brain/xp.test.ts` | **(N)** |

Les quatre noms sont **libres** (vérifié) et colocalisés comme les 14 précédents du dépôt.

**But** : les **21** mutants de `challenge.ts` (5), `characteristics.ts` (2), `xp.ts` (14). **11 blocs `it`**, répartis 3 / 2 / 6.

| Fichier | # | `it` | Mutants |
|---|---|---|---|
| `challenge.test.ts` | 1 | `rollTier({ difficulty: 2 }) === 'TC2'` | `52:6`, `52:22` |
| | 2 | `rollTier({ difficulty: 3 }) === 'TC3'` | `53:6`, `53:22` |
| | 3 | `resolveChallenge` à la frontière `roll === carac` → `success true` | `88:26` |
| `characteristics.test.ts` | 4 | `enduranceMalus` à la frontière `pe === EN/5` | `80:6` |
| | 5 | `enduranceMalus` à la frontière `pe === EN/3` | `81:6` |
| `xp.test.ts` | 6 | `deltaBand(-1) === 'facile'` | `27:6` |
| | 7 | `challengeXp` bande `facile`, succès → `1` (scénario QA : `challengeTier 2 / heroTier 3 / margin 5`) | `45:3` |
| | 8 | `challengeXp` bande `equilibre`, **marge < 3** → `baseXp` sans bonus | `48:41` |
| | 9 | `combatXp` `insignifiant` → 0 et `facile` → 1 | `68:6`, `68:15`, `69:6`, `69:15` |
| | 10 | `characteristicUpgradeCost` aux paliers | `86:6` ×2, `87:6` ×2, `88:6` ×2 |
| | 11 | `mcUpgradeCost(0) === null` | `99:6` |

**`challenge.ts:69:29`** (`Update i--`) est en **Timeout = détecté. Rien à faire.**

**Sources** : `docs/REGLES-DU-JEU.md` §§ 1, 2, 5. Pour `52:6`/`53:6`, aucune section ne porte le mapping legacy `difficulty→tier` : la source est le **JSDoc du fichier** (migration KR-021/116) — **valeur d'implémentation, pas valeur de jeu**.

**Vérification isolée** : `npx stryker run --mutate "src/brain/{challenge,xp,characteristics}.ts"` → **186 mutants, 186 détectés**, 0 survivant, 0 `# errors`.

#### Ce qui rend `A ∥ B` sûr

Aucune signature partagée, aucun fichier partagé, aucun import entre les deux. **Le seul rendez-vous est `docs/REGLES-DU-JEU.md` : lot A n'écrit que le § 3 ; lot B ne lit que les §§ 1, 2 et 5.** Zéro lecture-après-écriture ⇒ le parallélisme n'a pas à être orchestré, il est déjà vrai.

Chaque fichier déclare **sa propre** ligne `const fixed = (v: number) => () => v`. Quatre duplications d'une ligne : refus n° 6 **maintenu et renforcé**.

### Vague 2 — Lot C · `seuil-et-residus`, seul détenteur du chiffre

`stryker.config.mjs` (R) · `docs/WORKFLOW.md` (R, **net ≤ 0 octet**) · `CLAUDE.md` (R, deux mots) · `docs/ROADMAP-BASCULE-IA.md` (R) · `CHANGELOG.md` (R) · `bug_history.json` (R, **`_about` seulement**) · `.claude/raffinage/outillage-it2/revue.md` (N)

**Retirés par rapport au tour 1** : `code-knowledge.json` (§ 5.2) et **les 4 fichiers mutés** (§ 4.2). **Aucun lot de cette tranche n'écrit une ligne de production.**

**Procédure** :
1. `npm run test:mutation` complet sur l'arbre fusionné. Relever `S` **et** les 4 scores par fichier.
2. Garde-fou « aucun fichier ne recule », ±1 mutant, contre la base du 2026-09-20.
3. `# errors` = **0** sur les 4.
4. `break = min(floor(S/5) × 5, 90)` · `low = break` · `high = 95` (**couleur de rapport seulement** — le seul chiffre soumis à « aucun chiffre non mesuré » est `break`).
5. **Second run complet.** Il doit rendre **exactement les mêmes 4 scores** : preuve mesurée que le ±1 est soldé, et **condition d'autorisation de la compaction**. S'il diffère d'un mutant, lot C **n'écrit pas « soldé »** : il nomme le résidu.
6. Relevé du budget en LF, avant/après, recopié dans la revue.
7. Porte comparée au socle **mesuré** : 102 suites / 1750 tests / ~21 s. Le rouge connu est `panneauPersonnages.test.tsx:800`, 1 run sur 5, vert seul, **hors `brain/` donc hors du périmètre de `jest.mutation.cjs`** — il ne peut pas toucher la mesure. On le relance seul, on le consigne, **on ne le répare pas**.

**Ordonnancement** : `A ∥ B` → intégrateur → `C` seul. **Et le découpage ne mandate pas l'essaim** : `A → B → C` en séquence dans un seul worktree est aussi valide. La disjonction rend les **deux** modes sûrs.

## 2 — Réponses nominatives

### 2.1 — QA : ce qui, dans la méthode, a produit le faux

1. **Le champ `replacement` est le texte du NŒUD, pas celui de la ligne résultante.** → **Règle** : toute affirmation d'équivalence cite la **ligne mutée reconstruite** par découpe de la source sur `[start.column, end.column)`.
2. **Une équivalence a été affirmée sans tentative de réfutation.** Un mutant équivalent est celui qu'aucun test ne peut tuer — proposition **falsifiable et bon marché**. → **Règle** : `Ignored` n'est recevable qu'après un **essai de meurtre écrit et échoué**, consigné.
3. **La direction de l'erreur n'était pas neutre** : elle blanchissait 4 mutants vivants au moment où le seuil est à son plafond — la seule direction qui surestime la couverture.

Ce que je retiens d'elle et qui porte la tranche : le calcul **1/7** est juste, vérifiable, et c'est la démonstration de la dette. Sans lui, la borne n'aurait pas de motif.

### 2.2 — Espion contre borne

| | Espion (QA) | Borne (retenue) |
|---|---|---|
| Mutants tués par le geste | 2 | **7** |
| Vrai pour | **un** tirage forcé | **tout** tirage |
| État global touché | `Math` du fichier de test | aucun |
| Mode de panne | **silencieux et vert** | rouge |

- `restoreMocks` n'est posé dans **aucune** config jest (vérifié). La restauration est manuelle et son absence invisible. Honnêteté : jest crée un environnement **par fichier**, donc la fuite est **intra-fichier**, pas inter-suites. Réel, je ne l'exagère pas.
- **Le mode de panne est vert.** Espion non appliqué ⇒ l'assertion redevient celle d'aujourd'hui : vraie une fois sur sept. On aurait réparé une instabilité par un témoin qui peut redevenir instable **sans que rien ne rougisse**.
- **L'espion épingle le mécanisme de repli, pas le comportement.** La n° 11 pourrait rendre `rng` obligatoire : le pouvoir séparateur s'évaporerait **en silence**. La borne assert une **séparation d'intervalles sur l'observable**, qui survit à tout changement de repli.

### 2.3 — PM, `break = 90` : la formulation qui honore les deux

- Si B2 écrit **85**, la n° 11 touche `challenge.ts` + `xp.ts` → cliquet **+5** → **90**.
- Si B2 écrit **90**, la n° 11 est déjà au plafond → **90**.

**La n° 11 hérite de 90 dans les deux branches.** Ce qui se joue n'est pas la sévérité de la porte, seulement si la config porte un chiffre **mesuré** ou **prudentiel** — et `WORKFLOW.md` a tranché, dans les deux sens.

> La cible est un **état sur une liste fermée** : zéro survivant non annoté parmi les **48 mutants nommés par le cadrage**. Le seuil n'est pas une cible, c'est une **transcription** : `break = min(floor(S/5)×5, 90)`. Aucun 49ᵉ mutant n'est chassé, aucun test n'est écrit pour faire monter un score. Si un mutant des 48 résiste, **on n'abaisse pas le chiffre pour qu'il rentre** : on ne l'écrit pas → `ESCALADE`.

Le refus n° 1 du PM est **RETENU tel qu'il est écrit**. Mon refus n° 8 est **MAINTENU**. Les deux tiennent ensemble.

### 2.4 — UX, « axe = le module » : je tranche pour elle, contre moi

`combat.rules.test.ts` passerait de justesse mais l'infixe `.rules.` le met en **fausse famille** avec `rules.golden.test.ts`. **`progression.rules.test.ts` échoue franchement** : « progression » est un **thème** recouvrant trois modules.

**Tranché : quatre fichiers, un par module** — `combat.test.ts`, `challenge.test.ts`, `characteristics.test.ts`, `xp.test.ts`. Bénéfices non prévus : chaque fichier se greppe depuis son module, aucun n'approche 12 `it`, et A/B reste disjoint sans effort.

**Libellés** : fichiers neufs ⇒ **ASCII strict**, zéro accent, zéro apostrophe.

**Dette à déclencheur ouverte par ce choix** : `gameSystem.test.ts` devient un agrégat hérité recouvrant quatre fichiers-modules. Sa fusion part **quand la n° 11 rouvrira `challenge.ts`/`xp.ts`**. Hors périmètre B2.

## 3 — Statut de mes deux objections

| # | Objection | Statut | Motif |
|---|---|---|---|
| 1 | Les 4 booléens sont des **négations à tuer** | **MAINTENUE — délibérément pas durcie en veto** | Confirmée par M3. Mes domaines de veto sont l'isolation, le contournement d'un contrat `brain/`, la duplication du SSOT, la dépendance croisée, l'encapsulation. **Blanchir un mutant vivant n'en fait pas partie** — un veto hors domaine serait requalifié. Je demande un **interdit nominatif** et le report du `REJETÉ` de la QA au registre, corrigé : c'est le mode de panne BUG-082. |
| 2 | La définition de fini est un **état**, pas un score | **MAINTENUE, reformulée** | La liste des 48 est **fermée**, le seuil est transcrit et non visé. |

## 4 — Les deux ajouts au § 3, révisés

### 4.1 — Ajout 2 (égalité des AT) : confirmé, motif corrigé, texte réécrit

M1 a raison et j'avais tort. **Le motif change et s'affaiblit dans le bon sens** : ce n'est même plus une clarification, c'est une **transcription de la moitié arithmétique d'une décision déjà prise**, vers le document qui fait foi pour l'arithmétique. Rien n'est décidé ici.

**« On rejoue un round » ? Non.** `resolveAssault` rend un résultat, il ne boucle pas ; un ouvrier qui lit la clause de rejeu dans le § 3 écrirait un test impossible ou ouvrirait un faux bogue. **Partage retenu, sans duplication** : le § 3 porte l'arithmétique, `REGLES-PLAY.md` § D2 garde l'orchestration, et le § 3 **renvoie** à D2 au lieu de le recopier.

```
> **AT égales** — si les deux AT sont identiques, l'assaut est **nul** : l'Écart vaut 0, la
> qualité est **Manqué** (multiplicateur ×0) et aucun dégât n'est infligé de part ni d'autre.
> La suite — rejouer un round — est de l'orchestration : `docs/REGLES-PLAY.md` § D2.
```

**Pourquoi la qualité doit y figurer** : le mutant `110:93` est un `StringLiteral` sur `band: 'rate'`. Sans source, il **survit** et la définition de fini tombe. Et ce n'est pas un choix libre : `damage 0` est décidé par D2, et la seule qualité de multiplicateur ×0 est **Manqué** — conséquence forcée. C'est **ici**, et non dans la table d'Écart, que le terme naît : à AT égales, « manqué » est **vrai**.

**Non décidé** : l'interaction de l'égalité avec la **Garde aiguisée** (D2-bis). → `open_questions`, propriétaire n° 11.

### 4.2 — `ecartBand(ecart ≤ 0)` : trois options chiffrées

| Option | Coût | Verdict |
|---|---|---|
| **(i)** la ligne de table `≤ 0` — *mon propre ajout 1* | L'en-tête de la table **définit** l'Écart comme `AT_vainqueur − AT_perdant` : y écrire « ≤ 0 » affirme qu'un écart entre vainqueur et perdant désignés peut être nul ou négatif — **c'est faux**. Le manuel a double public dont « l'IA de développement, formules sans ambiguïté » : on introduirait l'ambiguïté là où ce fichier existe pour l'éliminer. **Une erreur dans la source de vérité.** | **REFUSÉE — je retire mon propre ajout** |
| **(ii)** une note de borne sous la table | ~2 lignes. `docs/REGLES-DU-JEU.md` n'a **pas** de plafond de contexte : coût budgétaire nul. Table inchangée donc toujours vraie ; 5 mutants sourcés ; dénominateur intact à 258. | **RETENUE** |
| **(iii)** annoter les 5 mutants hors dénominateur | **(a)** écriture dans `combat.ts`, interdite aux lots A et B, et lot C **constate** ; **(b)** motif **faux au sens de Stryker** : ces mutants sont **tuables** (`ecartBand` est exportée) — annoter, c'est blanchir 5 mutants vivants, **exactement ce que j'ai refusé pour les 4 booléens** ; **(c)** le dénominateur passerait de 258 à **253** : l'instrument rétrécirait en silence au moment où on le lit. | **REFUSÉE** |

```
> L'Écart se mesure entre un vainqueur et un perdant **désignés** : il est toujours ≥ 1. La
> fonction qui classe les bandes est néanmoins **totale** — en deçà de 1, elle rend la qualité
> **Manqué** (×0, aucun dégât), le cas de l'égalité d'AT ci-dessus. La résolution d'un assaut
> ne produit jamais cette borne : l'égalité est traitée avant.
```

**Ce que cette note achète** : les 5 mutants de la l.61 **et** les 4 de la l.110 deviennent sourçables depuis une doc **vraie**, sans annotation, sans écriture de production, sans rétrécir le dénominateur.

**Vérifié par lecture directe** : les bornes `disable` (l.21) / `restore` (l.39) encadrent **exactement** `POSTURES`. Les libellés d'`ecartBand` (l.61-65) sont donc **dans** le dénominateur. Mon refus n° 3 est **confirmé par la mesure**.

## 5 — Droit d'écriture du lot C sur les fichiers à marge courte

### 5.1 — `CLAUDE.md` + `docs/WORKFLOW.md` (marge 159 o) — **net ≤ 0, mesuré**

| Geste | Δ estimé |
|---|---|
| `CLAUDE.md` : `break: 80` → `break: 90` | ≈ 0 |
| `WORKFLOW.md` : la valeur du 2026-08-02 → celle du 2026-09-20 | ≈ 0 |
| `WORKFLOW.md` : **compaction** du paragraphe ±1 (~430 o) → une phrase gardant le seul garde-fou | **≈ −330 o** |
| `WORKFLOW.md` : **une ligne neuve** — *« Un mutant n'est équivalent qu'après un essai de meurtre écrit et échoué ; l'équivalence se lit sur la ligne mutée reconstruite, jamais sur le champ `replacement`. »* | ≈ +180 o |

**Net ≈ −150 o.** Ce n'est pas une compaction arbitraire : **B2 est précisément ce qui rend ce paragraphe obsolète**. Deux gardes :
- La compaction du ±1 n'est **autorisée que si le point 5 est vert** (deux runs complets, 4 scores identiques). Sinon le paragraphe reste et le résidu est nommé.
- Lot C **mesure** avant/après en LF et recopie les deux chiffres. Si le net est positif, il compacte davantage **dans le même geste** ; candidat désigné et **unique** : le rappel des deux réglages `tempDirName`/`cleanTempDir`, déjà commentés dans `stryker.config.mjs` (~600 o). **Pas de troisième candidat inventé sur place.**

### 5.2 — `code-knowledge.json` (marge 72 o) — **aucune écriture. Interdit nominatif.**

72 o ne peuvent pas porter un KR (400–1 200 o). (1) La leçon est une **procédure d'instrument**, pas un risque de code : son foyer est `WORKFLOW.md` § Score de mutation, lecture obligatoire à chaque session — **plus fort** qu'un KR. (2) `CLAUDE.md` le prescrit. (3) Compacter un fichier de 76 kio dans une tranche d'outillage est le gonflement que le PM refuse. **Conséquence : aucun `known_risks` neuf, donc l'étape 4 n'a rien à recopier.** Cohérent, pas éludé.

### 5.3 — `bug_history.json` (marge 599 o) — **pas d'entrée de bogue**

L'`_about` du fichier fixe son axe et l'exclut : « **si la leçon est promue** [dans un instrument en lecture obligatoire, dont un **test permanent**], **l'entrée part à l'archive** — la garder ici la ferait relire deux fois. » La leçon du ±1 est promue **deux fois dans la même tranche** : un test permanent de la porte de commit et une ligne de `WORKFLOW.md`. **Le record de B2 est porté par `CHANGELOG.md` et par la revue.**

**Conditionnel** : si l'auto-revue ou la revue de PR produit un **défaut réel** distinct, il **est** journalisé, dans le `bug_history*.json` de la feature concernée, identifiant calculé selon le § 6. Si ce fichier est à moins de 900 o de son plafond, la **scission** part dans le même lot.

Le flaky `panneauPersonnages.test.tsx:800` **n'est pas journalisé ici** : il appartient à `dossier-fiches`. Il part au roadmap en **dette à déclencheur**, déclencheur *le prochain lot qui rouvre `dossier-fiches`*. M5 a infirmé l'hypothèse `capacityEffects.test.ts` — à recopier dans la revue.

## 6 — Constat neuf, mesuré : la numérotation des BUG est armée sur une liste périmée

- `bug_history.json:_about` : « NUMEROTATION GLOBALE aux **SEPT** fichiers », puis énumère 6 fichiers + lui-même. `CLAUDE.md` répète « les **sept** fichiers ».
- **Le disque en porte huit.** `bug_history.dossier-copilote.json` **n'est dans aucune des deux listes**, et contient **BUG-097 … BUG-118**, où vit le maximum global.
- Maximum sur les **sept documentés** : **BUG-112**. Un agent appliquant la règle à la lettre écrit donc **BUG-113** — **déjà pris** (et c'est, ironiquement, le BUG-113 que la skill `raffinage-iteration` cite en précédent). **C'est le tout prochain identifiant.** Récidive exacte du précédent BUG-062 que l'`_about` existe pour empêcher.

**Correctif proposé — ≤ 60 o, dans des fichiers que lot C ouvre déjà** : ajouter `bug_history.dossier-copilote.json` à l'énumération, et passer `SEPT` → `HUIT` dans l'`_about` **et** dans `CLAUDE.md`. Aucun fichier neuf, aucune entrée, aucune scission.

**Repli** : ligne de dette à déclencheur au roadmap, déclencheur *le prochain lot qui écrit un BUG-xxx*. **Ce que je refuse, c'est de laisser le piège armé sans trace** alors qu'on tient le stylo sur les deux fichiers concernés.

## 7 — Interdits d'écriture (mis à jour)

| Interdit à | Fichier | Motif |
|---|---|---|
| **tous** | **les 4 fichiers mutés** | **Durci** : plus de « conditionnel ». Aucune annotation n'est due. **La tranche ne modifie aucune ligne de production.** Un lot qui croit devoir annoter **ne le fait pas** : il l'écrit dans sa note → `ESCALADE`, pas écriture. |
| tous | `src/brain/gameSystem.test.ts` | Base de comparaison gelée, seul tueur actuel du mutant 192. Sa fusion est une dette à déclencheur, propriétaire n° 11. |
| tous | `rules.golden.test.ts` et les bornes `disable`/`restore` de `combat.ts` | `ecartBand` est un calcul ; rien n'y est neutralisé (vérifié l.21/l.39). |
| tous | `src/player/engine/*.test.ts` | Ils tournent dans `jest.mutation.cjs`. |
| tous | `jest.mutation.cjs`, `jest.config.cjs`, `pre-commit-gate.sh`, `.eslintrc.cjs` | Changer l'instrument pendant qu'on le lit. |
| tous | `.claude/raffinage/outillage-it1.revue.md` | C'est la spécification. Lecture seule. |
| tous | `code-knowledge.json` | § 5.2. |
| tous | `package.json` | Le bump PATCH est l'étape 8, après approbation utilisateur. |
| tous | `README.md` | **Mesuré** : il ne cite aucun seuil de mutation. Rien à y écrire. |
| tous | `src/features/**`, `bestiary.ts`, `equipment.ts`, `monsterCapacities.ts`, `brain/dossier/**` | Hors périmètre muté. Inclut le flaky. |
| **A et B** | `stryker.config.mjs` | Un seuil sur mesure partielle est **définitif**. Runs scopés autorisés pour la vérification du lot seulement, **jamais consignés comme score**. |
| **B** | `docs/REGLES-DU-JEU.md` | Propriété exclusive du lot A. |
| **C** | les quatre `*.test.ts` de vague 1 | Lot C **constate**, il ne répare pas. |

## 8 — Refus motivés

| # | Refusé | Motif |
|---|---|---|
| 1 | Annoter `107:74/75`, `108:74/75` comme équivalents | Réfuté par M3 : source appliquée `shield: !attacker.shield`, une **négation**. |
| 1 bis | **(REJETÉ de la QA, tour 1, reporté corrigé)** — « équivalent démontré, annotation `// Stryker disable next-line BooleanLiteral` » | **Renversé par M3.** Raisonnement de type juste, appliqué à un mutant que Stryker n'a pas produit. Reporté ici parce qu'une recommandation d'annotation **survit très bien à une condensation de notes** — précédent BUG-082. |
| 2 | Corriger `combat.ts` (seeder le `rng`, ou le rendre obligatoire) | Change une signature `brain/` consommée par deux fichiers `player/` ; modifie un fichier muté → dénominateur déplacé en cours de tranche. La borne règle le même problème à **zéro ligne de production**. |
| 3 | Étendre `rules.golden.test.ts` aux bandes d'écart | `ecartBand` est un calcul ; ses libellés ne sont **pas** neutralisés (vérifié). |
| 4 | Écrire les 21 tests dans `gameSystem.test.ts` | Deux lots nommeraient le même fichier ; KR-112 ; base de comparaison. |
| 5 | Un 4ᵉ lot `contrat` pour `docs/REGLES-DU-JEU.md` | Un seul consommateur. |
| 6 | Un helper `fixed()` partagé | **Renforcé** : avec quatre fichiers, ce serait un cinquième fichier **nommé par deux lots**. |
| 7 | Qu'un lot de vague 1 consigne un score | Mesure partielle rendue **définitive** par le cliquet. |
| 8 | Écrire `break: 85` par prudence alors que `S` donne 90 | « Aucun chiffre non mesuré », **dans les deux sens**. Et sans conséquence : la n° 11 hérite de 90 dans les deux branches. |
| 9 | Toucher `src/player/engine/*.test.ts` | Ils tournent dans `jest.mutation.cjs`. |
| **10** | **La ligne `≤ 0` dans la table d'Écart** — *mon propre ajout du tour 1* | L'en-tête **définit** l'Écart entre vainqueur et perdant : « ≤ 0 » y affirme du faux, dans un document dont le second public exige des formules sans ambiguïté. |
| **11** | **Sortir les 5 mutants de la l.61 par annotation** | Ils sont **tuables** : annoter, c'est blanchir 5 mutants vivants, symétrique du refus n° 1. Et le dénominateur tomberait à 253 — l'instrument rétrécit en silence. |
| **12** | **Le mock `jest.spyOn(Math,'random')`** | Il marche, mais son mode de panne est **vert** ; et il épingle le **mécanisme de repli**, que la n° 11 pourrait supprimer, pas le comportement. |
| **13** | **`combat.rules.test.ts` / `progression.rules.test.ts`** — *mes propres noms* | « progression » est un thème couvrant trois modules ; `.rules.` met en fausse famille avec `rules.golden.test.ts`. |
| **14** | **Journaliser la dette du ±1 dans `bug_history.json`** | L'`_about` l'exclut : une leçon promue dans un instrument en lecture obligatoire part à l'archive. Et l'entrée franchirait les 599 o de marge. |
| **15** | **Ajouter un KR à `code-knowledge.json`** | 72 o de marge ; la leçon va en `WORKFLOW.md`, où elle **remplace**. |

## 9 — Demandes avant la porte 1

1. Définition de fini = **« zéro survivant non annoté sur les 48 mutants nommés »**, et la phrase du § 2.3 recopiée telle quelle.
2. Trou n° 2 **retourné** ; `REJETÉ` 1 bis au registre.
3. Trou n° 1 **requalifié** : ajout 2 = transcription ; ajout 1 = **note de borne**, table inchangée. Les deux verbatim **dans le plan**.
4. Interdiction d'écrire un seuil, **nominativement** dans A et B ; interdiction d'écrire dans les 4 fichiers mutés, **nominativement dans les trois**.
5. La ligne « `challenge.ts:69:29` = Timeout = détecté, rien à faire ».
6. Socle à **102 / 1750 / ~21 s**, flaky nommé fichier**:**ligne, qualifié « hors `brain/`, donc hors du périmètre de `jest.mutation.cjs` ».
7. Droit d'écriture de lot C **avec sa compaction dans le même geste**, mesure LF avant/après recopiée.
8. Une décision sur le § 6 : **RETENU dans lot C** ou **dette à déclencheur**, mais pas « non traité ».

**Prédiction chiffrée et falsifiable** : `All files 100.00 %`, **258/258**, 0 survivant, 0 `# errors`, `break: 90`, et **deux runs complets identiques au mutant près**.
