# Tour 2 — `qa`

**Objection 1 (obligatoire) — je cède intégralement, mesuré.** Lecture de `mutation.json` (ids 190/191/193/194) et recomptage des colonnes sur `combat.ts:107`. Nœud `[74,91)` = `!!attacker.shield` ; nœud `[75,91)` = `!attacker.shield`. Le mutant 191 ne remplace **que** le second nœud : le `!` de la colonne 74 reste dans la source. Les deux mutants produisent le même texte appliqué, `shield: !attacker.shield` — **quatre négations, zéro équivalent**. Mon annotation d'équivalence est retirée. **Défaut de méthode** : j'ai jugé le mutant sur son `replacement` **isolé** (motif `!!x → x`) sans reconstruire `source[:start] + replacement + source[end:]` autour du fragment — je n'ai pas vu que la négation externe survivait hors du nœud muté. **Leçon à porter au plan : toute lecture de colonnes Stryker doit recomposer le texte source complet, jamais juger sur le `replacement` seul.**

**M1 — je cède aussi, motif changé, conclusion tenue.** Mon `REJETÉ` n° 1 disait l'égalité des AT absente de toute doc ; mon `grep` n'a porté que sur `REGLES-DU-JEU.md`. `REGLES-PLAY.md:61` (D2) la documente déjà. L'ajout au § 3 **retranscrit** une règle déjà tranchée — motif à réécrire, conclusion inchangée.

**Borne contre `spyOn` — mesuré par un run Stryker réel** (scopé `combat.ts`, 15 s) : le test borné du tech-lead tue `107:64/74/75` et `108:64/74/75` en `Killed` **déterministe** (test id 80, seul test coloré). **Je retire ma proposition `jest.spyOn(Math,'random')`** : pouvoir séparateur inférieur et risque de fuite du spy vers d'autres mutants du même fichier si l'`afterEach` est oublié.

---

## ANNEXE

### 1. Vérifications exécutées

**Colonnes 107/108** — reconstruction du texte source (colonnes comptées sur le fichier réel) : `line107[73:90] = '!!attacker.shield'`, `line107[74:90] = '!attacker.shield'`. Le mutant 190 remplace `[74,91)` par `!attacker.shield` ; le 191 remplace `[75,91)` par `attacker.shield` en laissant le `!` de la colonne 74 → **même résultat dans les deux cas**. Confirmé : quatre négations, zéro équivalent.

**Run Stryker réel scopé `combat.ts`** (15 s), avec pour seul test additionnel le témoin borné du tech-lead — `defensive` + `shield: true` des deux côtés, `rng = fixed(0.999)` → `atA = atD = 18`, `winner:'tie'`, `ecart:0`, `damage:0` :

```
55 ObjectLiteral  107:64→98 {}                Killed (test 80)
56 BooleanLiteral 107:74→91 !attacker.shield  Killed (test 80)
57 BooleanLiteral 107:75→91 attacker.shield   Killed (test 80)
58 ObjectLiteral  108:64→98 {}                Killed (test 80)
59 BooleanLiteral 108:74→91 !defender.shield  Killed (test 80)
60 BooleanLiteral 108:75→91 defender.shield   Killed (test 80)
```

**6 mutants, un seul test, déterministe pour tout `rng() ∈ [0,1)`** (original `MC+8`, mutant `∈ [MC+1, MC+4]`, intervalles disjoints). Fichier temporaire créé, vert sur source réelle avant le run, puis **supprimé** (`rm`, untracked, jamais `git checkout`) ; `git status --short` propre après nettoyage.

**Verdict : la borne l'emporte.** Risque supplémentaire du `spyOn` : un `jest.spyOn(Math,'random')` non restauré fuit vers les `it` suivants du même fichier et peut fausser le statut d'un mutant sans rapport (`26:45`, `31:45`, qui retombent aussi sur `Math.random` par défaut). La borne ne touche aucun global.

**`docs/REGLES-PLAY.md:61`** — confirme M1 tel quel.
**`docs/REGLES-DU-JEU.md` § 3** (l. 73-95) — table Écart commence à `1`, aucune ligne `≤ 0`, aucune mention d'égalité sous « Résolution d'un assaut ».
**M2 — 5 sites d'appel d'`ecartBand`** : `combat.ts:117` (gardé par le `return` l.110), `capacityEffects.ts:106` (gardé l.104), `combatEngine.ts:94` (gardé l.92), `:249`, `:354`. **Inatteignable en production sur les 5 sites actuels.**

### 2. Statut des quatre `REJETÉ` du tour 1

1. **Épingler `ecartBand(ecart<=0)` / le cas `tie` depuis le code** — **scindé** :
   - volet `ecart <= 0` (a11) : **MAINTENU** — absent de `REGLES-DU-JEU.md` § 3, le texte doit être écrit **avant** l'assertion ;
   - volet `tie` (a13) : **RETIRÉ** — mon `grep` n'a porté que sur un fichier ; la règle est déjà tranchée dans `REGLES-PLAY.md:61`. Conclusion bonne, motif faux, je le retire.
2. **Refuser 55 suites / 644 tests comme socle** — **MAINTENU**. Socle adopté : **102 / 1750**.
3. **Refuser de compter le mutant `ObjectLiteral` 107/108 comme tenu sur la foi du rapport du jour** — **DURCI EN VETO**. C'est le cœur du mandat : aucun lot ne clôt l'itération en laissant `107:64`/`108:64` « Killed » par la seule assertion `ecart === 9` (1/7). Le témoin borné doit être présent en lot A avant fusion, sans quoi le lot C rejette.
4. **« Un lot `*.test.ts` est-il `contrat` ? »** — **RETIRÉ** : le tech-lead a tranché (non).

### 3. `ecartBand` inatteignable — tranché

**Ce n'est pas une annotation d'équivalence déguisée : c'est un test unitaire légitime d'une fonction pure exportée.** `ecartBand` est exportée, appelée directement par `gameSystem.test.ts` hors tout combat orchestré, et rien n'empêche un futur appelant (n° 11, ou un nouveau `capacityEffect`) de l'invoquer sans garde. Un mutant de la l.61 change le comportement observable pour un input que la fonction **déclare accepter** (`ecart: number`, pas `PositiveNumber`) — le tuer est un test de **contrat de fonction**. Ce qui reste à trancher (PM/UX) est seulement la **formulation documentaire** : une note « plancher défensif, n'apparaît jamais en jeu » plutôt qu'une ligne de table présentée comme scénario jouable — **déjà ce que propose le texte verbatim de l'UX**.

### 4. Critères d'acceptation proposés

1. **Étant donné** `docs/REGLES-DU-JEU.md` avant tout test du lot A, **quand** on lit § 3, **alors** il porte la clause d'égalité des AT et la note bornant l'Écart, verbatim. — *vérification documentaire ; précondition bloquante. Lot A, en premier.*
2. **Étant donné** `resolveAssault` avec les deux combattants en `defensive`, `shield:true`, `rng=fixed(0.999)`, **quand** `npm run test:mutation` tourne, **alors** `107:64`, `107:74`, `107:75`, `108:64`, `108:74`, `108:75` sont `Killed` par ce test nommément. — *mutation. Lot A.* **(empiriquement confirmé, test id 80)**
3. **Étant donné** `ecartBand(0)` / `ecartBand(-3)` appelés directement et `resolveAssault` avec `atA === atD`, **quand** le run tourne, **alors** `61:6`(×2), `61:25`, `61:36`, `61:51`, `110:6`, `110:26`, `110:36`, `110:93` sont `Killed`. — *unitaire + mutation. Lot A.*
4. **Étant donné** les bandes 1, 3, 5, 6, **quand** le run tourne, **alors** `62:37`, `62:54`, `63:36`, `63:52`, `64:36`, `64:56`, `65:39` sont `Killed` par des assertions sur `quality` **et** `label` — **un `expect` par champ, jamais un `toEqual` sur l'objet entier**. — *unitaire + mutation. Lot A.*
5. **Étant donné** `challenge.ts:88` à `roll === carac` et `characteristics.ts:80/81` à `pe === EN/5` et `pe === EN/3`, **quand** le run tourne, **alors** `88:26`, `80:6`, `81:6` sont `Killed`. — *unitaire + mutation. Lot B.*
6. **Étant donné** `challengeXp({challengeTier:2, heroTier:3, success:true, baseXp:3, margin:5})`, **alors** le résultat vaut **1**, et `xp.ts:27:6` et `45:3` sont `Killed` par ce scénario. **ΔT = -1 est l'état qui sépare** `facile` de `equilibre` (1 contre 4). — *unitaire + mutation. Lot B.*
7. **Étant donné** `characteristicUpgradeCost` appelé **exactement** aux frontières 6, 8, 10, **alors** 3, 7, 15, et `86:6`, `87:6`, `88:6` sont `Killed`. — *unitaire + mutation. Lot B.*
8. **Étant donné** l'arbre fusionné, **quand** le run complet et `npx jest` tournent, **alors** aucun des 4 scores ne recule (±1 mutant, base 2026-09-20), `# errors` = 0, tout survivant restant porte une annotation nommée, `break = min(floor(S/5)×5, 90)` recopié depuis la mesure, `npx jest` = 102 suites / 1750 tests verts, `tsc` et `lint` propres. — *mutation + porte complète. Lot C, seul.*

### 5. Pouvoir séparateur — les trois témoins les plus chers

| Témoin | Implémentation fautive nommée | État du monde séparateur | Preuve |
|---|---|---|---|
| Assaut `defensive`+bouclier | `{}` (perte de `shield` **et** du `rng` injecté) **ou** `!attacker.shield` (bouclier inversé) | les deux en `defensive`, `shield:true`, `rng=fixed(0.999)` : correct → `MC+8` ; fautif → `MC + [1,4]`. **Intervalles disjoints pour tout tirage** — séparation garantie, pas probabiliste | **mesurée** : run scopé, 6/6 `Killed` par ce seul témoin |
| `challengeXp` bande `facile` | `case 'facile':` vidé → tombe dans `case 'equilibre'` | ΔT = **-1 précisément**, `success:true`, `baseXp:3`, `margin:5` : correct → `1` ; fautif → `4`. **À ΔT = 0 les deux formules coïncident — ne sépare pas**, donc ΔT = -1 est obligatoire | dérivée du code réel, valeurs recalculées à la main |
| `characteristicUpgradeCost` aux 3 frontières | `<=6` → `<6` (idem 8, 10) | appel **exactement** à 6 (ou 8, 10) : correct → 3 (7, 15) ; fautif → tombe au palier suivant → 7. **Un appel intérieur au palier (5, 7) ne sépare rien** : `5<6` et `5<=6` sont tous deux vrais | dérivée du code réel, trois branches explicites |

### 6. Ce que je n'ai pas pu vérifier

- Le run **complet** (258 mutants) après fusion — aucun code de lot n'existe encore ; charge du lot C. **Le critère 8 est non vérifiable avant l'essaim**, à re-vérifier en mode B.
- Le risque de fuite du `jest.spyOn(Math,'random')` — **argumenté, non mesuré** (mécanique Jest documentée : un spy non restauré persiste entre `it` d'un même fichier). Je le signale comme tel, à la différence du reste de cette note.
- Le budget de contexte (M7) — hors domaine ; je note seulement qu'il contraint le lot C, dont le critère 8 implique des écritures dans trois fichiers à moins de 600 o de leur plafond.
