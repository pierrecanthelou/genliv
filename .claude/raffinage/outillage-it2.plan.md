# Plan d'itération — tranche B2 `outillage-2` *(hors cycle de feature, pas de `specification.json`)*

> Statut : **`validé`** — porte 2 franchie le 2026-09-20, validation humaine explicite.
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-09-20
> Composition : **4 rôles** — motif : la tranche ne touche **ni le dossier d'aventure, ni un prompt, ni une sortie de modèle, ni la mémoire de session, ni le mode jeu**. Aucun des cinq terrains de veto de `narratif-ia` n'est en jeu : zéro appel IA, zéro identifiant narratif, zéro contexte injecté. Le roadmap § 2 bis concentre l'effort sur `tech-lead` — honoré par un effort élevé sur ce poste, les quatre socles restant le plancher de la skill.
> Exécution : `essaim` (3 lots, **2 vagues**) **ou** séquentiel `A → B → C` dans un seul worktree — la disjonction des listes rend les deux modes sûrs et n'impose pas de paralléliser.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin de cette tranche, l'équipe peut committer une itération sur `combat.ts`, `challenge.ts`, `xp.ts` ou `characteristics.ts` sans qu'aucun survivant non annoté ne se cache dans le score affiché. » |
| **Tranche** | doc des règles (`§ 3`) → 4 fichiers de test `src/brain/` → mesure Stryker → seuil `stryker.config.mjs` → doc de process. **Aucune ligne de production n'est modifiée.** |
| **Lots** | **3 lots** · dont `contrat` : **non** *(motivé au § 4)* |
| **Hors périmètre** | toute modification de logique dans les 4 fichiers mutés · le seed du `rng` · toute autre clause de `REGLES-DU-JEU.md` · le test instable `panneauPersonnages.test.tsx:800` · BUG-035 · un KR neuf · une entrée de `bug_history` pour le ±1 · `kinds.ts`/`equipment.ts`/`bestiary.ts` |
| **Reporté** | fusion de `gameSystem.test.ts` avec les 4 fichiers-modules → n° 11 · égalité d'AT × Garde aiguisée → `open_questions`, n° 11 · test instable `dossier-fiches` → dette à déclencheur |

---

## 1 — But raffiné

À la fin de cette tranche, l'équipe peut committer une itération sur `combat.ts`, `challenge.ts`, `xp.ts` ou `characteristics.ts` sans qu'aucun survivant non annoté ne se cache dans le score affiché.

**Pourquoi maintenant** : la n° 11 `moteur-arbitre` modifie `challenge.ts` et `xp.ts`, donc relève `break` de 80 à 85 (cliquet). À **81,40 %** mesurés le 2026-09-20 — `combat.ts` à **62,50 %** — la porte ne passerait pas. C'est la seule dette du § 2 bis qui bloque pour de bon.

**La cible est un état sur une liste fermée**, pas un score : zéro survivant non annoté parmi les **48 mutants nommés par le cadrage**. Le seuil n'est pas une cible, c'est une **transcription** : `break = min(floor(S/5)×5, 90)`. Aucun 49ᵉ mutant n'est chassé, aucun test n'est écrit pour faire monter un chiffre. Si un mutant des 48 résiste, **on n'abaisse pas le seuil pour qu'il rentre** : on ne l'écrit pas → `ESCALADE`.

> **Le seuil est sans enjeu de sévérité, et c'est ce qui éteint le désaccord.** Si B2 écrit 85, la n° 11 touche `challenge.ts`+`xp.ts` → cliquet +5 → 90. Si B2 écrit 90, la n° 11 est déjà au plafond → 90. **La n° 11 hérite de 90 dans les deux branches.** Ce qui se joue est seulement si la config porte un chiffre **mesuré** ou **prudentiel** — et `docs/WORKFLOW.md` a tranché ça, dans les deux sens.

## 2 — Hors périmètre

- **Toute modification de logique** dans `combat.ts`, `challenge.ts`, `xp.ts`, `characteristics.ts`. La tranche n'écrit **aucune ligne de production**, pas même une annotation (§ 8, désaccords 1 et 11).
- **Seeder le `rng`** ou rendre `rng` obligatoire dans `PostureDescriptor.computeAT` — le ±1 se règle par une **borne de test**, jamais par une signature `brain/`.
- Toute clause de `docs/REGLES-DU-JEU.md` **autre que les deux du § 3 ci-dessous**. Aucune autre section n'est réécrite, la **table d'Écart n'est pas modifiée**.
- Le test instable `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx:800` — hors `brain/`, donc **hors du périmètre de `jest.mutation.cjs`** : il ne peut pas toucher la mesure. Consigné, **pas réparé**.
- Un KR neuf dans `code-knowledge.json` (marge 72 o) ; une entrée de bogue dans `bug_history.json` pour le ±1.
- BUG-035, scission de `controles.ts`, toute autre ligne de la dette à déclencheur du § 2 bis.
- Élargir le périmètre muté (`kinds.ts`, `equipment.ts`, `bestiary.ts`, `monsterCapacities.ts`, `brain/dossier/**`, `src/features/**`).
- `gameSystem.test.ts` : **gelé**, base de comparaison et seul tueur actuel du mutant 192.

## 3 — Contrat de design

**Aucune surface visuelle.** Zéro composant, zéro token, zéro texte d'interface : la règle « chaque valeur visuelle est un token `--*` » est **sans objet** ici et n'est pas contournée. Ce qui suit est le contrat **de rédaction**, seul livrable lisible par un humain.

### 3.1 — `docs/REGLES-DU-JEU.md` § 3, ajout 1 — **note de borne**, sous la table d'Écart

Insertion **après** la ligne `| ≥6 | Coup critique | ×2 | **dégrade l'armure cible de 1 point** |`, **avant** « Dégâts finaux subis = … ». **La table elle-même n'est pas modifiée.**

```
> L'Écart se mesure entre un vainqueur et un perdant **désignés** : il est toujours ≥ 1. La
> fonction qui classe les bandes est néanmoins **totale** — en deçà de 1, elle rend la qualité
> **Manqué** (×0, aucun dégât), le cas de l'égalité d'AT ci-dessus. La résolution d'un assaut
> ne produit jamais cette borne : l'égalité est traitée avant.
```

### 3.2 — `docs/REGLES-DU-JEU.md` § 3, ajout 2 — **égalité des AT**

Insertion dans le blockquote de « Résolution d'un assaut », **après** le paragraphe `Rand(a,b)` / bouclier, **avant** « **Garde aiguisée** ».

```
> **AT égales** — si les deux AT sont identiques, l'assaut est **nul** : l'Écart vaut 0, la
> qualité est **Manqué** (multiplicateur ×0) et aucun dégât n'est infligé de part ni d'autre.
> La suite — rejouer un round — est de l'orchestration : `docs/REGLES-PLAY.md` § D2.
```

**Ces deux textes ne décident rien.** L'ajout 2 **transcrit** la moitié arithmétique d'une règle **déjà tranchée** — `docs/REGLES-PLAY.md:61` § D2, « AT égales → assaut nul (aucun dégât), on rejoue un round », marquée *Défaut : OK* — vers le document que KR-130 nomme source de vérité de l'arithmétique. L'ajout 1 énonce une **borne de fonction**, pas un scénario jouable. La clause de rejeu **n'est pas recopiée** : chaque document garde sa moitié, aucune seconde source de vérité n'est créée.

### 3.3 — Convention de libellés

Les quatre fichiers sont **neufs** et ne prolongent pas `gameSystem.test.ts` : **ASCII strict, zéro accent, zéro apostrophe** — la convention de `rules.golden.test.ts` et des commentaires `// Stryker disable`. Les libellés exacts sont au § 7.

## 4 — Contrats `brain/` touchés

**Aucun.** La tranche ne crée, ne modifie et ne supprime **aucune** signature, aucun service, aucun événement, aucun registre.

**Pourquoi aucun lot n'est marqué `contrat`**, alors que quatre fichiers vivent sous `src/brain/` : la marque existe pour figer une signature que des agents qui ne peuvent pas se parler consommeront sans pouvoir la renégocier. Un `.test.ts` **n'exporte rien**, n'est importé par personne, et `jest.mutation.cjs` le découvre par glob — couplage nul. `CLAUDE.md` nomme d'ailleurs des surfaces de **production** (`types.ts`, `destinations.ts`, `validate.ts`). Un test de `brain/` est un **consommateur** du contrat, jamais le contrat. La contrainte est en outre **sans objet ici** : il n'existe aucun lot `feature` en aval qui attendrait un contrat figé.

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `POSTURES`, `ecartBand`, `pfBase`, `resolveAssault`, `maitriseDesCoups` | registre + fonctions | **consomme** | inchangées — `computeAT(mc: number, opts: { shield: boolean; rng?: () => number }): number` |
| `WEAPONS`, `WeaponId` | registre | **consomme** | inchangées |
| `rollTier`, `resolveChallenge` | fonctions | **consomme** | inchangées |
| `enduranceMalus` | fonction | **consomme** | inchangée |
| `deltaBand`, `challengeXp`, `combatXp`, `characteristicUpgradeCost`, `mcUpgradeCost` | fonctions | **consomme** | inchangées |
| `thresholds: { high, low, break }` | configuration | **expose** *(lot C seul)* | `break = min(floor(S/5)×5, 90)` · `low = break` · `high = 95` |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. **Aucun lot n'est `contrat`** (§ 4). Les trois sont de type `outil`.

### Vague 1 — lots A et B, sans rendez-vous

Aucune signature partagée, aucun fichier partagé, aucun import entre les deux. **Le seul point de contact est `docs/REGLES-DU-JEU.md` : A n'écrit que le § 3, B ne lit que les §§ 1, 2 et 5.** Zéro lecture-après-écriture — le parallélisme est déjà vrai, il n'a pas à être orchestré.

### Lot A — `bornes-combat` `outil`

- **Ouvrier** : `dev-lot`
- **But** : les 27 mutants vivants de `combat.ts` tombent, et les 2 tués par coïncidence cessent de l'être.
- **Fichiers** : `src/brain/combat.test.ts` **(N)** · `docs/REGLES-DU-JEU.md` **(R — § 3 uniquement, deux insertions, texte verbatim du § 3 de ce plan)**
- **Consomme** : `import { POSTURES, ecartBand, pfBase, resolveAssault, maitriseDesCoups } from './combat'` · `import { WEAPONS, type WeaponId } from './equipment'`
- **Expose** : rien.
- **Ordre imposé À L'INTÉRIEUR du lot** (KR-130, non négociable) : **1)** écrire les deux ajouts au § 3 ; **2)** écrire les `it` 6, 7 et 8 **depuis la doc**, jamais depuis `combat.ts` ni depuis le `received` d'un test rouge ; **3)** citer la section source dans la revue, **une ligne par valeur**.
- **Trois précisions opposables** :
  - `it` 3 — **MC distincts** entre attaquant et défenseur, pour que l'assaut ne prenne pas le retour anticipé de la l.110 et n'empiète pas sur l'`it` 8.
  - `it` 8 — **n'assertit rien sur le rejeu du round.** `resolveAssault` rend un résultat, il ne boucle pas.
  - `it` 7 — **un `expect` par champ** (`quality` puis `label`), jamais un `toEqual` sur l'objet entier : un `toEqual` laisserait un `StringLiteral` mutant indiscernable d'un autre champ.
- **Déclare sa propre** ligne `const fixed = (v: number) => () => v`. Aucun helper partagé.
- **Vérification isolée** : `npx stryker run --mutate src/brain/combat.ts` → **72 mutants, 72 détectés, 0 survivant, 0 `# errors`**. Le résultat va **dans la note de lot**, jamais dans `stryker.config.mjs`.
- **Critères couverts** : #1, #2, #3, #4

### Lot B — `bornes-challenge-characteristics-xp` `outil`

- **Ouvrier** : `dev-lot`
- **But** : les 21 mutants de `challenge.ts` (5), `characteristics.ts` (2) et `xp.ts` (14) tombent.
- **Fichiers** : `src/brain/challenge.test.ts` **(N)** · `src/brain/characteristics.test.ts` **(N)** · `src/brain/xp.test.ts` **(N)** — les trois noms sont **libres** (vérifié), colocalisés comme les 14 `<Module>.test.ts` déjà sur disque.
- **Consomme** : `rollTier`, `resolveChallenge` (`./challenge`) · `enduranceMalus` (`./characteristics`) · `deltaBand`, `challengeXp`, `combatXp`, `characteristicUpgradeCost`, `mcUpgradeCost` (`./xp`)
- **Expose** : rien.
- **Sources des valeurs** : `docs/REGLES-DU-JEU.md` §§ 1 (Malus d'épuisement), 2 (« inférieur ou égal »), 5 (tableau ΔT, coûts). **Exception écrite** : pour `challenge.ts:52-53`, aucune section ne porte le mapping legacy `difficulty → tier` — la source est le **JSDoc du fichier** (migration KR-021/116). C'est une **valeur d'implémentation, pas une valeur de jeu** ; la revue le dit ainsi.
- **`challenge.ts:69:29`** (`UpdateOperator → i--`) est en **`Timeout` = détecté. Rien à faire, aucun test à écrire.**
- **Chaque fichier déclare sa propre** ligne `const fixed`.
- **Vérification isolée** : `npx stryker run --mutate "src/brain/{challenge,xp,characteristics}.ts"` → **186 mutants, 186 détectés** (185 tués + 1 timeout), 0 survivant, 0 `# errors`. Résultat **dans la note de lot** seulement.
- **Critères couverts** : #5, #6, #7

### Lot C — `seuil-et-residus` `outil` · **vague 2, seul détenteur du chiffre**

- **Ouvrier** : `dev-lot`, **seul, après fusion des lots A et B**
- **Fichiers** : `stryker.config.mjs` **(R)** · `docs/WORKFLOW.md` **(R)** · `CLAUDE.md` **(R)** · `docs/ROADMAP-BASCULE-IA.md` **(R)** · `CHANGELOG.md` **(R)** · `bug_history.json` **(R — `_about` seulement)** · `.claude/raffinage/outillage-it2.revue.md` **(N)**
- **Expose** : `thresholds: { high, low, break }`
- **Procédure exacte** :
  1. `npm run test:mutation` complet sur l'arbre fusionné. Relever `S` global **et** les 4 scores par fichier.
  2. Garde-fou « aucun fichier ne recule », **à ±1 mutant près**, contre la base du 2026-09-20 : `challenge` 86,84 · `characteristics` 94,12 · `combat` 62,50 · `xp` 87,72.
  3. Colonne `# errors` = **0** sur les 4. Non nulle → **panne d'instrument** : on répare, on ne contourne pas.
  4. `break = min(floor(S/5) × 5, 90)` · `low = break` · `high = 95`. **Seul `break` est soumis à « aucun chiffre non mesuré »** ; `high` est une couleur de rapport, aucune porte.
  5. **Second run complet.** Il doit rendre **exactement les mêmes 4 scores** — c'est la preuve mesurée que le ±1 est soldé, **et la condition d'autorisation de la compaction du point 7**. S'il diffère d'un seul mutant, le lot **n'écrit pas « soldé »** : il nomme le résidu.
  6. Porte de commit contre le socle **mesuré ce jour** : `npx jest` → **102 suites / 1750 tests / ~21 s**. Le rouge connu (`panneauPersonnages.test.tsx:800`, ~1 run sur 5, vert seul) est **hors `brain/`** : relancé seul, consigné, **pas réparé**.
  7. **Droit d'écriture sur les fichiers à marge courte**, avec compaction **dans le même geste** — mesure en LF (`git show :fichier | wc -c`) **avant et après**, les deux chiffres recopiés dans la revue :
     - `CLAUDE.md` : `break: 80` → `break: 90` ; `SEPT` → `HUIT` fichiers `bug_history` (§ 6 du registre).
     - `docs/WORKFLOW.md` : la valeur du cliquet ; **compaction** du paragraphe « Le score varie de ±1 mutant… correctif assigné : B2 » (~430 o) en une phrase gardant le seul garde-fou (« … se lit à ±1 mutant près ») ; **une ligne neuve** : *« Un mutant n'est équivalent qu'après un essai de meurtre écrit et échoué ; l'équivalence se lit sur la ligne mutée reconstruite, jamais sur le champ `replacement`. »*
     - **Net attendu ≤ 0 octet sur le couple.** Si le net est positif, le lot compacte davantage dans le même geste ; candidat désigné et **unique** : le rappel des deux réglages `tempDirName` / `cleanTempDir`, déjà commentés dans `stryker.config.mjs`. **Pas de troisième candidat inventé sur place.**
     - `bug_history.json` : **`_about` seulement** — ajouter `bug_history.dossier-copilote.json` à l'énumération « OÙ SONT LES AUTRES », `SEPT` → `HUIT`. **Aucune entrée de bogue.**
     - `docs/ROADMAP-BASCULE-IA.md` : `Statut` de B2 au § 2 bis, plus **deux** lignes de dette à déclencheur (§ 8, reports 1 et 3).
  8. **Conditionnel** : si l'auto-revue (Build Steps étape 5) ou la revue de PR produit un **défaut réel** distinct de la dette du ±1, il **est** journalisé dans le `bug_history*.json` de la feature concernée — identifiant = `max(BUG-xxx)` sur les **huit** fichiers, soit **BUG-119** et non BUG-113. Si ce fichier est alors à moins de 900 o de son plafond, la **scission** écrite dans son `_about` part dans le même lot.
- **Lot C constate, il ne répare pas.** Un test à réécrire renvoie à son lot d'origine.
- **Critères couverts** : #8

**Hors de toute propriété — un lot qui croit en avoir besoin s'arrête et remonte** : les **4 fichiers mutés** (aucune ligne de production, pas même une annotation) · `gameSystem.test.ts` · `rules.golden.test.ts` et les bornes `disable`/`restore` de `combat.ts` · `src/player/engine/*.test.ts` · `jest.mutation.cjs` · `jest.config.cjs` · `.claude/hooks/pre-commit-gate.sh` · `.eslintrc.cjs` · `code-knowledge.json` · `package.json` (le bump PATCH est l'étape 8 des Build Steps, après approbation) · `README.md` (**mesuré** : il ne cite aucun seuil de mutation) · `.claude/raffinage/outillage-it1.revue.md` (c'est la spécification, lecture seule) · `src/features/**`.

## 6 — Critères d'acceptation

> **Quand l'instrument est Stryker, l'observable n'est jamais « le test passe » mais le statut du mutant nommé dans `reports/mutation/mutation.json`** : `Killed`/`Ignored` (avec motif) = tenu ; `Survived`/`NoCoverage` = non tenu ; `RuntimeError` = panne d'instrument, zéro toléré.

1. **Étant donné** `docs/REGLES-DU-JEU.md` avant l'écriture de tout test du lot A, **quand** on lit le § 3, **alors** il porte les deux textes du § 3 de ce plan, verbatim, la table d'Écart restant inchangée. — *documentaire ; **précondition bloquante*** — *lot A*
2. **Étant donné** `resolveAssault` avec les deux combattants en posture `defensive`, `shield: true`, MC distincts et `rng = fixed(0.999)`, **quand** `npm run test:mutation` tourne, **alors** `combat.ts` `107:64`, `107:74`, `107:75`, `108:64`, `108:74`, `108:75` sont tous `Killed`, par ce test nommément. — *mutation* — *lot A* — **déjà mesuré : 6/6 `Killed`, run scopé du 2026-09-20**
3. **Étant donné** `ecartBand(0)` et `ecartBand(-3)` appelés directement, plus `resolveAssault` avec `atA === atD`, **quand** le run tourne, **alors** `61:6` (×2), `61:25`, `61:36`, `61:51`, `110:6`, `110:26`, `110:36`, `110:93` sont `Killed`. — *unitaire + mutation* — *lot A*
4. **Étant donné** les écarts 1, 3, 5 et 6 passés à `ecartBand`, **quand** le run tourne, **alors** `62:37`, `62:54`, `63:36`, `63:52`, `64:36`, `64:56`, `65:39` sont `Killed`, par des assertions **champ par champ** sur `quality` puis `label`. — *unitaire + mutation* — *lot A*
5. **Étant donné** `resolveChallenge` à la frontière `roll === caractéristique` et `enduranceMalus` aux frontières exactes `pe === EN/5` et `pe === EN/3`, **quand** le run tourne, **alors** `challenge.ts:88:26`, `characteristics.ts:80:6` et `81:6` sont `Killed`. — *unitaire + mutation* — *lot B*
6. **Étant donné** `challengeXp({ challengeTier: 2, heroTier: 3, success: true, baseXp: 3, margin: 5 })`, **quand** le test tourne sur le code réel, **alors** le résultat vaut **1** — et **quand** le run tourne, `xp.ts:27:6` et `45:3` sont `Killed`. **ΔT = -1 est l'état qui sépare** `facile` de `equilibre` (1 contre 4) ; à ΔT = 0 les deux implémentations coïncident et le critère ne prouverait rien. — *unitaire + mutation* — *lot B*
7. **Étant donné** `characteristicUpgradeCost` appelé **exactement** aux frontières 6, 8 et 10 — jamais à l'intérieur d'un palier, où `<` et `<=` coïncident et où le critère ne prouverait rien — **quand** le test tourne sur le code réel puis que le run de mutation tourne, **alors** les résultats valent 3, 7 et 15, et `xp.ts:86:6`, `87:6`, `88:6` sont `Killed`. — *unitaire + mutation* — *lot B*
8. **Étant donné** l'arbre fusionné, **quand** `npm run test:mutation` tourne **deux fois** et `npx jest` une fois, **alors** : les **48 mutants nommés au cadrage** sont `Killed`, **zéro survivant non annoté** sur les 4 fichiers ; les deux runs rendent **les mêmes 4 scores au mutant près** ; aucun fichier ne recule (base du 2026-09-20, ±1) ; `# errors` = 0 ; `break` = `min(floor(S/5)×5, 90)` **transcrit depuis la mesure** ; `npx jest` = 102 suites / 1750 tests ; `tsc --noEmit` et `npm run lint` (0 erreur / 1 avertissement) propres. — *mutation + porte complète* — *lot C*

*Le critère 8 est celui qui couvre les mutants sans critère propre (`26:45`, `31:45`, `31:14`, `75:9`, `121:14`, `125:39`, `52:*`, `53:*`, `48:41`, `68-69`, `99:6`) : c'est pourquoi la définition de fini est un **état sur liste fermée**, pas un score.*

## 7 — Tests nommés

**ASCII strict, zéro accent, zéro apostrophe.**

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `combat.test.ts › posture normale : AT vaut MC moins le jet maximal` | `computeAT(MC, { shield:false, rng:fixed(0.999) }) === MC - 6` | jest + mutation | — | A |
| `… › posture precise : AT vaut MC moins 4 au jet minimal` | `=== MC - 4`, et la valeur est un nombre (tue `ArrowFunction`) | jest + mutation | — | A |
| `… › assaut defensif avec bouclier : AT vaut MC plus 8, aucun degat` | `atAttacker === MC_A + 8` · `atDefender === MC_D + 8` · `damage === 0` | jest + mutation | **KR-235** (borne mesurée, pas déduite) | A |
| `… › pfBase multiplie par le multiplicateur, il ne divise pas` | arme `tranchante-2m` (1,3) ou `mains-nues` (0,3) — jamais un multiplicateur de 1 | jest + mutation | — | A |
| `… › degats = PF x facteur de posture x facteur d ecart` | vainqueur en posture `precise` (facteur 2) | jest + mutation | — | A |
| `… › ecartBand en deca de 1 rend la bande Manque` | `ecartBand(0)` et `ecartBand(-3)` → `quality 'rate'`, `label 'Manqué'`, `factor 0` | jest + mutation | **KR-130** (valeur relue au § 3, note de borne) | A |
| `… › ecartBand : qualite et libelle des quatre bandes` | écarts 1, 3, 5, 6 — **un `expect` par champ** | jest + mutation | **KR-130** (table d'Écart, § 3) | A |
| `… › AT egales : assaut nul, aucun vainqueur, zero degat` | `winner 'tie'` · `ecart 0` · `band 'rate'` · `damage 0` — **rien sur le rejeu du round** | jest + mutation | **KR-130** (§ 3 ajout 2, transcrit de `REGLES-PLAY.md` D2) | A |
| `… › le defenseur remporte l assaut quand son AT est plus haute` | `winner === 'defender'` | jest + mutation | — | A |
| `challenge.test.ts › rollTier : la difficulte 2 devient TC2` | `rollTier({ difficulty: 2 }) === 'TC2'` | jest + mutation | **KR-021/116** (source = JSDoc, valeur d'implémentation) | B |
| `… › rollTier : la difficulte 3 devient TC3` | `=== 'TC3'` | jest + mutation | KR-021/116 | B |
| `… › resolveChallenge : reussite a egalite avec la caracteristique` | `roll === carac` → `success true` ; un cran au-dessus → `false`, marge négative | jest + mutation | **KR-130** (§ 2, « inférieur ou égal ») | B |
| `characteristics.test.ts › enduranceMalus : frontiere exacte EN sur 5` | `EN 10, pe 2 → -1` (et non `-2`) | jest + mutation | **KR-130** (§ 1, Malus d'épuisement) | B |
| `… › enduranceMalus : frontiere exacte EN sur 3` | `EN 15, pe 5 → 0` (et non `-1`) | jest + mutation | KR-130 (§ 1) | B |
| `xp.test.ts › deltaBand : le delta -1 est la bande facile` | `deltaBand(-1) === 'facile'` | jest + mutation | **KR-130** (§ 5, tableau ΔT) | B |
| `… › challengeXp : bande facile, reussite rapporte 1` | `{2, 3, true, baseXp 3, margin 5}` → `1` — **`baseXp ≠ 1` et marge ≥ 3 obligatoires** pour séparer du `case 'equilibre'` | jest + mutation | KR-130 (§ 5) | B |
| `… › challengeXp : la marge 2 ne donne pas le bonus` | bande `equilibre`, `margin 2` → `baseXp` sans `+1` | jest + mutation | KR-130 (§ 5, « +1 si marge ≥ 3 ») | B |
| `… › combatXp : bandes insignifiant et facile` | `insignifiant → 0` · `facile → 1` | jest + mutation | KR-130 (§ 5, colonne combat) | B |
| `… › characteristicUpgradeCost : les trois frontieres de palier` | `6 → 3` · `8 → 7` · `10 → 15` — **jamais une valeur intérieure au palier** | jest + mutation | KR-130 (§ 5, coûts) | B |
| `… › mcUpgradeCost : le bonus 0 rend null` | `mcUpgradeCost(0) === null` | jest + mutation | KR-130 (§ 5, table +1…+5) | B |

**KR cités, et par quoi ils sont tenus** — la distinction est explicite pour qu'aucun lot ne croie devoir écrire un test là où il n'y en a pas à écrire :

| KR | Tenu par | Où |
|---|---|---|
| **KR-130** — sens d'écriture `docs/REGLES-DU-JEU.md` → test → code | critère 1 (précondition bloquante) **plus** 11 des 20 tests nommés ci-dessus, chacun avec sa section source | § 6 · § 7 |
| **KR-235** — un instrument non mesuré n'est pas un instrument | `combat.test.ts › assaut defensif avec bouclier…`, dont le pouvoir séparateur est **déjà mesuré** (6/6 `Killed`, run scopé du 2026-09-20) | § 7 |
| **KR-021/116** — migration d'une `difficulty` numérique héritée | les deux tests `rollTier` ; **valeur d'implémentation**, source = JSDoc du fichier, écrit comme tel dans la revue | § 7 |
| **KR-112** — signal de scission à 400 lignes | **cité comme motif d'un refus, pas comme risque gardé** : il justifie de ne pas gonfler `gameSystem.test.ts` (désaccord 13). Aucun test ne lui est dû — les quatre fichiers neufs font 2 à 9 `it` chacun. | § 8 |

**Cas limites couverts** : frontière exacte (5 tests) · branche jamais prise (`ecart ≤ 0`, égalité d'AT, défenseur vainqueur) · valeur nulle/négative (`mcUpgradeCost(0)`, `ecartBand(-3)`) · multiplicateur ≠ 1 · **tirage aléatoire non contrôlé** (la borne de l'`it` 3). *Sans objet ici : hors ligne, référence orpheline, annulation, double soumission, très long, doublon.*

**Non vérifiable en l'état — à recopier dans la revue** :
- **Le critère 8 ne peut pas être vérifié avant l'essaim** : aucun code de lot n'existe, et le run complet sur arbre fusionné est la charge exclusive du lot C. À re-vérifier par la QA en mode B.
- **Le risque de fuite du `jest.spyOn(Math,'random')`** (option écartée) est **argumenté, non mesuré** : la mécanique jest est documentée — un spy non restauré persiste entre les `it` d'un même fichier, et `restoreMocks` est absent des trois configs (vérifié) — mais aucune répétition Stryker dédiée ne l'a démontré. Le motif du rejet n° 12 tient sur d'**autres** appuis mesurés (pouvoir séparateur 2 contre 7, mode de panne vert).
- **Le test instable** `panneauPersonnages.test.tsx:800` : observé rouge 1 fois sur 5 runs complets, vert quand relancé seul. **Sa cause n'est pas établie.** L'hypothèse initiale de l'orchestrateur — `capacityEffects.test.ts`, qui passe le vrai `Math.random` à plus de 20 sites — a été **infirmée par sonde : 12 runs ciblés, 12 verts**. À ne pas redécouvrir.

## 8 — Registre des désaccords

*Tous les `REJETÉ` d'annexe sont recopiés ici — un refus qui reste en annexe n'existe pas pour l'essaim (précédent BUG-082).*

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | tech-lead ↔ **qa** | `107:74/75`, `108:74/75` : équivalents à annoter (qa, tour 1) **ou** négations à tuer (tech-lead) | **RETENU** — à tuer, lot A | **Mesuré** : le nœud `[74,91)` est `!!attacker.shield`, le nœud `[75,91)` est `!attacker.shield` ; le mutant interne laisse le `!` extérieur en place. Les deux appliquent `shield: !attacker.shield`. **Quatre négations, zéro équivalent.** La qa a cédé au tour 2. |
| 1 bis | **qa** (tour 1, annexe § 5) | « `107:75`/`108:75` — équivalent réel démontré : annotation `// Stryker disable next-line BooleanLiteral` » | **REJETÉ** | Renversé par la mesure. Raisonnement de type juste, appliqué à un mutant que Stryker n'a pas produit : le champ `replacement` porte le texte du **nœud**, pas de la ligne résultante. Recopié ici parce qu'une recommandation d'annotation survit très bien à une condensation de notes. |
| 2 | tech-lead | Seeder le `rng` de `combat.ts:107`, ou rendre `rng` obligatoire | **REJETÉ** | Change `PostureDescriptor.computeAT`, signature `brain/` consommée par `combatEngine.ts` et `capacityEffects.ts` ; **modifie** un fichier muté, donc déplace le dénominateur en cours de tranche. La borne règle le même problème à **zéro ligne de production**. |
| 3 | qa | Tuer `107:64`/`108:64` par `jest.spyOn(Math, 'random')` | **REJETÉ** | Retiré par son auteur après mesure. Tue 2 mutants contre 7 pour la borne ; vrai pour **un** tirage contre **tout** tirage ; mode de panne **vert** (`restoreMocks` absent des trois configs) ; épingle le **mécanisme de repli**, que la n° 11 pourrait supprimer, pas le comportement. |
| 4 | pm | Viser `break = 90` comme **cible** du plan | **RETENU tel qu'écrit** | 90 n'est pas une cible : c'est une **transcription** de `min(floor(S/5)×5, 90)`, plafonnée d'office dès 23 mutants tués sur 48. La liste des 48 reste **fermée** ; aucun 49ᵉ n'est chassé. |
| 5 | tech-lead | Écrire `break: 85` « par prudence » alors que la mesure donne 90 | **REJETÉ** | « Aucun chiffre non mesuré dans la config » vaut **dans les deux sens**. Et c'est sans conséquence : la n° 11 hérite de 90 dans les deux branches. Si un mutant des 48 résiste sans être honnêtement annotable → `ESCALADE`, pas un chiffre abaissé. |
| 6 | **tech-lead** (son propre ajout du tour 1) ↔ ux | La ligne `\| ≤ 0 \| Manqué \| ×0 \|` en tête de la table d'Écart | **REJETÉ** | L'en-tête de la table **définit** l'Écart comme `AT_vainqueur − AT_perdant` : y écrire « ≤ 0 » y affirme du faux, dans un document dont le second public exige des formules sans ambiguïté. Remplacée par la **note de borne** (§ 3.1). |
| 7 | tech-lead | Sortir les 5 mutants de `combat.ts:61` du dénominateur par annotation « branche inatteignable » | **REJETÉ** | Ils sont **tuables** — `ecartBand` est exportée, un appel direct suffit : annoter serait blanchir 5 mutants vivants, symétrique exact du désaccord 1. Et le dénominateur tomberait de 258 à 253 : l'instrument rétrécirait **en silence** au moment où on le lit. |
| 8 | qa | Épingler `ecartBand(≤0)` et le cas `tie` depuis le code | **RETENU, scindé** | Volet `tie` : **retiré par son auteur** — la règle est déjà tranchée dans `REGLES-PLAY.md` § D2, que le `grep` initial n'avait pas couvert. Volet `ecart ≤ 0` : **maintenu** — la doc est écrite **avant** l'assertion (critère 1, précondition bloquante). |
| 9 | qa | Prendre `55 suites / 644 tests` (revue d'`outillage-1`) comme socle de non-régression | **REJETÉ** | Chiffre de l'état du dépôt au 2026-08-02, non reproductible. Socle adopté : **102 suites / 1750 tests / ~21 s**, mesuré ce jour. |
| 10 | qa | Compter `107:64`/`108:64` comme « tenus » sur la foi du rapport du jour | **RETENU** *(veto qa, dans son domaine)* | Ils sont `Killed` par **coïncidence 1 sur 7** (`ecart = 9` seulement si les deux tirages non contrôlés coïncident). Le témoin borné doit être présent en lot A avant fusion, sans quoi le lot C rejette. |
| 11 | tech-lead | Écrire une annotation d'équivalence dans l'un des 4 fichiers mutés | **REJETÉ** | Aucune n'est due (désaccords 1 et 7). **La tranche ne modifie aucune ligne de production.** Un lot qui croit devoir annoter **ne le fait pas** : il l'écrit dans sa note → `ESCALADE`. |
| 12 | tech-lead | Étendre `rules.golden.test.ts` aux bandes d'écart | **REJETÉ** | `ecartBand` est un **calcul**, pas un registre ; **vérifié** : les bornes `disable` (l.21) / `restore` (l.39) encadrent `POSTURES` seul, rien n'est neutralisé sur `ecartBand`. C'est le piège « plus » du § 3 de la skill `table-doree`, dont `ecartBand` est le précédent nommément cité. |
| 13 | tech-lead | Écrire les 21 tests dans `gameSystem.test.ts` | **REJETÉ** | Deux lots nommeraient le même fichier ; 114 → ~400 lignes (KR-112) ; et ce fichier porte le **seul tueur actuel du mutant 192**, donc la base de comparaison. Il reste **gelé**. |
| 14 | tech-lead | Un 4ᵉ lot `contrat` pour `docs/REGLES-DU-JEU.md` | **REJETÉ** | Un seul consommateur (lot A). Un lot `contrat` qui ne fige rien que personne d'autre ne lit est un lot inventé pour remplir l'essaim. |
| 15 | tech-lead | Un helper `fixed()` partagé dans `brain/utils/` | **REJETÉ** | Avec quatre fichiers, ce serait un **cinquième fichier nommé par deux lots**. Une ligne dupliquée quatre fois coûte moins qu'une collision de propriété. |
| 16 | tech-lead | Qu'un lot de vague 1 lance le run complet et consigne son score | **REJETÉ** | Dénominateur partiel (72 ou 186, pas 258) : `floor(S_partiel/5)×5` est plausible et faux, et le cliquet le rend **définitif**. Runs scopés autorisés pour la vérification du lot, **jamais consignés comme score**. |
| 17 | **ux** (son propre nom du tour 2) ↔ tech-lead | Noms de fichiers : `combat.rules.test.ts` + `progression.rules.test.ts` (tech-lead), puis `hors-combat.rules.test.ts` (ux) | **RETENU : quatre `<module>.test.ts`** | La règle ux « l'axe est le module » est bonne et les deux propositions y échouaient — « progression » est un **thème** couvrant trois modules ; et `hors-combat` est inexact **aussi**, le lot B portant les tests de `combatXp`. Quatre fichiers-modules règlent les deux objections d'un coup. L'infixe `.rules.` est retiré : il mettait les fichiers en fausse famille avec `rules.golden.test.ts`. |
| 18 | ux | Recopier « on rejoue un round » dans `docs/REGLES-DU-JEU.md` | **REJETÉ** | Décision de **boucle de jeu** que `resolveAssault` n'implémente pas ; la dupliquer créerait deux sources pour le même fait. `REGLES-PLAY.md` § D2 en reste l'unique porteur, **référencé par pointeur**. |
| 19 | pm | Corriger le test instable `panneauPersonnages.test.tsx:800` dans B2 | **REPORTÉ** → roadmap, dette à déclencheur | Hors `brain/`, hors les 4 fichiers mutés, découvert par accident. Déclencheur : **le prochain lot qui rouvre `dossier-fiches`**. |
| 20 | pm | Compacter **préventivement** les fichiers proches du plafond | **REJETÉ** | La compaction est **conditionnelle et interne au lot C** : elle part si, et seulement si, une écriture réelle de B2 franchit le plafond mesuré. |
| 21 | tech-lead | Ajouter un KR à `code-knowledge.json` | **REJETÉ** | Marge **72 octets**, un KR en pèse 400–1 200. La leçon est une **procédure d'instrument** : son foyer est `docs/WORKFLOW.md` § Score de mutation, en lecture obligatoire chaque session — plus fort qu'un KR. **Conséquence assumée : B2 ne crée aucun `known_risks`, donc l'étape 4 des Build Steps n'a rien à recopier.** |
| 22 | tech-lead | Journaliser la dette du ±1 dans `bug_history.json` | **REJETÉ** | Ce n'est pas un défaut découvert : c'est une **dette déjà documentée et assignée** par le roadmap § 2 bis, dont le record est `CHANGELOG.md` + la revue. L'`_about` du fichier le confirme mot pour mot : « si la leçon est promue [dans un instrument en lecture obligatoire, dont un **test permanent**], l'entrée part à l'archive — la garder ici la ferait relire deux fois ». Ici elle est promue **deux fois dans la même tranche**. |
| 23 | **tech-lead** (constat neuf) | La numérotation des `BUG-xxx` est armée sur une liste **périmée** | **RETENU** — lot C, ≤ 60 octets | **Vérifié** : l'`_about` dit « NUMEROTATION GLOBALE aux **SEPT** fichiers » et n'en énumère que six plus lui-même ; `bug_history.dossier-copilote.json` en est **absent** et porte le maximum global (**BUG-118**). Le max sur les sept documentés est **BUG-112** → la règle appliquée à la lettre écrit **BUG-113**, **déjà pris**. Ce n'est pas théorique : c'est **le prochain identifiant**. Le repli « dette à déclencheur » est refusé pour un motif structurel : son déclencheur serait « le prochain lot qui écrit un BUG-xxx », c'est-à-dire **exactement le lot qui se trompera**. Le correctif tient en 60 octets dans deux fichiers que le lot C ouvre déjà. |

**Reportés** — à inscrire au roadmap par le lot C :
1. **Fusion de `gameSystem.test.ts`** avec les quatre fichiers-modules, dont il devient un agrégat hérité. Déclencheur : **la n° 11, quand elle rouvrira `challenge.ts`/`xp.ts`**.
2. **Égalité d'AT × compteur de Garde aiguisée** (D2-bis) : rien ne l'implémente ni ne la teste. → `open_questions`, propriétaire **n° 11**.
3. **Test instable `panneauPersonnages.test.tsx:800`** → déclencheur : le prochain lot qui rouvre `dossier-fiches`.
4. **Observation ux, non bloquante** : `capacityEffects.ts:104` écrit déjà `'manqué'` (minuscule) dans un journal joueur, pour un cas **différent** de la qualité **Manqué** d'un assaut à AT égales. Pas un conflit aujourd'hui ; à distinguer le jour où un écran affichera les deux journaux côte à côte. → lot qui rouvrira l'affichage de `combatEngine.ts` / `capacityEffects.ts` (n° 9+).

## 9 — Innovation

**Aucune.** Rien dans cette tranche n'infléchit une règle existante : elle applique le cliquet, la doctrine de la table dorée et le sens d'écriture KR-130 tels qu'ils sont écrits.

## 10 — Définition de fini

> **La définition de fini n'est pas un score : c'est un état sur une liste fermée** — zéro survivant non annoté parmi les 48 mutants nommés au cadrage. Le seuil en est la transcription, pas la cible.

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` (0 erreur / 1 avertissement) → `npm test` (**102 suites / 1750 tests**)
- [ ] Les **48 mutants nommés** sont `Killed` ; **zéro survivant non annoté** sur les 4 fichiers
- [ ] **Deux runs complets rendent les mêmes 4 scores au mutant près** — preuve que le ±1 est soldé
- [ ] Aucun des 4 scores par fichier ne recule (base du 2026-09-20, à ±1 mutant près), les 4 recopiés dans la revue
- [ ] `# errors` (`RuntimeError`) = **0** sur les 4 fichiers
- [ ] `break = min(floor(S/5)×5, 90)`, **transcrit depuis la mesure**, `low = break`, `high = 95`
- [ ] **Aucune ligne de production modifiée** — `git diff --stat src/brain/{combat,challenge,xp,characteristics}.ts` **vide**
- [ ] Les deux ajouts au § 3 écrits **avant** les tests qu'ils sourcent ; la revue **cite la section source, une ligne par valeur**
- [ ] Budget de contexte relevé en LF **avant et après**, net ≤ 0 sur le couple `CLAUDE.md` + `docs/WORKFLOW.md`
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/outillage-it2.revue.md` — avec les motifs de rejet du § 8, les trois « non vérifiable en l'état » du § 7, et la liste **nommée** de tout mutant qui aurait résisté
- [ ] `CHANGELOG.md` + colonne `Statut` de B2 au roadmap + les 4 reports du § 8

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **levée** | Le chiffre 90 retiré comme cible ; le principe « liste fermée de 48 » repris au § 1 et au désaccord 4. |
| Tech Lead | recevable, **sans veto** | Ses 8 demandes sont au plan (définition de fini en état, trou n° 2 retourné, textes verbatim, interdits nominatifs, ligne du Timeout, socle 102/1750, droit d'écriture du lot C, décision sur le § 6 → désaccord 23). |
| UX | recevable sous réserve → **levée** | Amendement du § 3 **avant** les tests (critère 1) ; aucune ligne de table ; « on rejoue un round » non recopié ; axe de nommage = le module. |
| QA | recevable sous réserve → **levée**, **un veto retenu** | Veto du désaccord 10 (le ±1 ne se clôt pas sur le rapport du jour) — **retenu**, dans son domaine. Son erreur du tour 1 est corrigée au désaccord 1 bis, et sa leçon de méthode part en ligne de `docs/WORKFLOW.md` (lot C). |
