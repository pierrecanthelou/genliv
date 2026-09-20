# Tour 1 — `tech-lead` (effort élevé)

RISQUE — Le livrable final de cette tranche n'est pas un test, c'est un **nombre** dans `stryker.config.mjs`, et ce nombre ne se mesure qu'après fusion. Un `break` écrit depuis un run partiel (`--mutate` d'un seul lot) ou recopié du cadrage est faux **pour toujours** : le cliquet ne redescend jamais, et la n° 11 hérite soit d'une porte infranchissable, soit d'une porte relâchée. Toute la tranche tient à ce qu'un **seul** lot, **après** fusion, ait le droit d'écrire ce chiffre.

OBJECTION 1 — Le trou n° 2 est **faux tel qu'il est écrit**. Dans `mutation.json` : mutant **190**, `start.column 74 → end 91`, remplacement `!attacker.shield` ; mutant **191**, `start.column 75 → end 91`, remplacement `attacker.shield` — le `!` de la colonne 74 **reste en place**. Les deux produisent le **même source appliqué** : `shield: !attacker.shield`. Ce ne sont pas des équivalents, ce sont des **négations**, tuables par une seule assertion. Les annoter aurait blanchi quatre mutants vivants au moment précis où le seuil est à son plafond.

OBJECTION 2 — Dès **23 mutants tués sur 48**, `floor(S/5)×5` dépasse 90 : le seuil est **plafonné d'office**. La définition de fini cesse donc d'être un score et devient « **zéro survivant non annoté sur les 4 fichiers** ». Le plan doit l'écrire ainsi, sinon un lot se croira fini à 85.

PROPOSITION — Un seul `it` tue **7 mutants** avec une **borne totale**, sans toucher une ligne de `combat.ts` : `resolveAssault` avec les deux combattants en posture `defensive`, `shield: true`, `rng = fixed(0.999)`. Original : `MC + 4 + 4`. Mutant `{}` (107:64 / 108:64) : `shield` perdu **et** `rng` retombé sur `Math.random`, donc `MC + randInt(1,4)` ∈ `[MC+1, MC+4]` — strictement séparé de `MC+8` **pour tout tirage possible**. Le ±1 disparaît par borne, pas par probabilité.

VERDICT — **recevable sous réserve** : que le trou n° 2 soit retourné (mutants à tuer, pas à annoter) et que l'écriture du seuil soit réservée à un lot unique de seconde vague.

---

## ANNEXE

## 1 — Découpage : 3 lots, 2 vagues, listes strictement disjointes

### Vague 1 — deux lots parallèles

#### Lot A · `combat-bornes` — type `outil` (PAS `contrat`)

| Fichier | État |
|---|---|
| `src/brain/combat.rules.test.ts` | **(N)** |
| `docs/REGLES-DU-JEU.md` | **(R)** — § 3 uniquement, texte verbatim fourni par le plan |

**But** : les **27 mutants** de `combat.ts` tombent. **9 blocs `it`** (sous le seuil de 12).

Interface consommée : `POSTURES`, `ecartBand`, `pfBase`, `resolveAssault`, `maitriseDesCoups` depuis `./combat`. **Interface exposée : aucune** — un `.test.ts` n'exporte rien.

| # | `it` | Mutants tués |
|---|---|---|
| 1 | `POSTURES.normale.computeAT`, `rng` max → `MC − 6` | `26:45` |
| 2 | `POSTURES.precise.computeAT`, `rng` min → `MC − 4` | `31:45`, `31:14` |
| 3 | **assaut défensive + bouclier, `rng` max → `atAttacker = MC+8`, `atDefender = MC+8`, `damage 0`** | `36:53`, `107:64`, `107:74`, `107:75`, `108:64`, `108:74`, `108:75` (+ `121:14` en second témoin) |
| 4 | `pfBase` avec arme de multiplicateur ≠ 1 | `75:9` |
| 5 | assaut gagné en posture `precise` (facteur 2) | `121:14` |
| 6 | `ecartBand(0)` et `ecartBand(-3)` → `'rate'`, `'Manqué'`, `0` | `61:6` ×2, `61:25`, `61:36`, `61:51` |
| 7 | libellés des 4 bandes + codes de qualité | `62:37`, `62:54`, `63:36`, `63:52`, `64:36`, `64:56`, `65:39` |
| 8 | AT égales → `'tie'`, `band 'rate'`, `ecart 0`, `damage 0` | `110:6`, `110:26`, `110:36`, `110:93` |
| 9 | le **défenseur** l'emporte → `winner 'defender'` | `125:39` |

**Ordre imposé DANS le lot** (KR-130) : 1) écrire les deux ajouts à `docs/REGLES-DU-JEU.md` § 3 ; 2) écrire les `it` 6 et 8 **depuis la doc**, jamais depuis `combat.ts` ; 3) citer la section source dans la revue, une ligne par valeur.

**Vérification isolée** : `npx stryker run --mutate src/brain/combat.ts` → attendu **72 mutants, 72 détectés, 0 survivant, 0 `# errors`**. Le lot **n'écrit aucun seuil**.

#### Lot B · `progression-bornes` — type `outil` (PAS `contrat`)

| Fichier | État |
|---|---|
| `src/brain/progression.rules.test.ts` | **(N)** |

**But** : les **21 mutants** de `challenge.ts` (5), `characteristics.ts` (2), `xp.ts` (14). **11 blocs `it`**.

| # | `it` | Mutants |
|---|---|---|
| 1 | `rollTier({ difficulty: 2 }) === 'TC2'` | `challenge 52:6`, `52:22` |
| 2 | `rollTier({ difficulty: 3 }) === 'TC3'` | `challenge 53:6`, `53:22` |
| 3 | `resolveChallenge` à la frontière `roll === carac` → `success true` | `challenge 88:26` |
| 4 | `enduranceMalus` à `pe === EN/5` (EN 10, pe 2 → `-1`) | `characteristics 80:6` |
| 5 | `enduranceMalus` à `pe === EN/3` (EN 15, pe 5 → `0`) | `characteristics 81:6` |
| 6 | `deltaBand(-1) === 'facile'` | `xp 27:6` |
| 7 | `challengeXp` bande `facile`, succès → `1` | `xp 45:3` |
| 8 | `challengeXp` bande `equilibre`, **marge < 3** → `baseXp` sans bonus | `xp 48:41` |
| 9 | `combatXp` `insignifiant` → 0 et `facile` → 1 | `xp 68:6`, `68:15`, `69:6`, `69:15` |
| 10 | `characteristicUpgradeCost(6)=3`, `(8)=7`, `(10)=15` | `xp 86:6` ×2, `87:6` ×2, `88:6` ×2 |
| 11 | `mcUpgradeCost(0) === null` | `xp 99:6` |

**À écrire dans le plan** : `challenge.ts:69:29` (`Update i--`) est en **Timeout = détecté. Rien à faire.**

**Vérification isolée** : `npx stryker run --mutate "src/brain/{challenge,xp,characteristics}.ts"` → **186 mutants, 186 détectés**, 0 survivant, 0 `# errors`.

### Vague 2 — un lot, seul, après fusion

#### Lot C · `seuil-et-residus` — type `outil`, seul détenteur du chiffre

`stryker.config.mjs` (R) · `docs/WORKFLOW.md` (R) · `docs/ROADMAP-BASCULE-IA.md` (R) · `CHANGELOG.md` (R) · `code-knowledge.json` (R, conditionnel) · le `bug_history*.json` concerné (R, conditionnel) · les 4 fichiers mutés (R, **conditionnel — annotations d'équivalence SEULES**) · `.claude/raffinage/outillage-it2/revue.md` (N)

**Procédure exacte** :
1. `npm run test:mutation` complet sur l'arbre fusionné. Relever `S` global **et** les 4 scores par fichier.
2. Garde-fou « aucun fichier ne recule », ±1 mutant, contre la base du 2026-09-20.
3. `# errors` = **0** sur les 4. Non nulle → panne d'instrument, on répare.
4. `break = min(floor(S/5) × 5, 90)` · `low = break` · `high = min(break + 10, 95)`.
5. Second run de vérification → `exit 0` + la ligne `Final mutation score…` recopiée dans la revue.
6. Relevé du budget de contexte (Build Steps étape 4).

**Ordonnancement** : `A ∥ B` → intégrateur (fusion sans conflit par construction) → `C` seul. **Deux vagues, trois ouvriers.**

## 2 — Réponses aux six points

**(1) Où vivent les 21 tests** — **2 nouveaux fichiers**, pas `gameSystem.test.ts` étendu. Décisif : deux lots ne peuvent pas nommer le même fichier. Plus : 114 l. + 21 `it` ≈ 380-420 l. → signal KR-112 atteint ; `gameSystem.test.ts` porte **le seul tueur actuel du mutant 192**, le geler donne une base de comparaison stable ; un fichier par § des règles se greppe. Chaque fichier déclare **sa propre** ligne `const fixed = …`.

**(2) Un lot de `*.test.ts` est-il `contrat` ?** — **Non.** La marque existe parce que des agents qui ne se parlent pas consommeront une signature sans pouvoir la renégocier. Un `.test.ts` n'exporte rien, n'est importé par personne, et `jest.mutation.cjs` le découvre par glob : couplage nul. `CLAUDE.md` nomme des surfaces de **production**. Un test de `brain/` est un **consommateur** du contrat, jamais le contrat.

**(3) Qui écrit le seuil** — **Lot C, seul, vague 2.** Un run `--mutate` scopé a un **dénominateur différent** (72 ou 186, pas 258) : `floor(S_partiel/5)×5` est plausible et faux, et le cliquet le rend définitif. Chaque lot reste vérifiable seul par son run scopé, sans tenir le stylo du seuil.

**(4) Le ±1 — borne, pas probabilité.** Original defensive+bouclier, `rng = fixed(0.999)` → `AT = MC + 4 + 4 = MC + 8`. Mutant `{}` → `shield === undefined` **et** `rng = Math.random` → `AT ∈ [MC+1, MC+4]`. `MC+4 < MC+8` **pour tout tirage**. Le même `it` tue aussi `107:74/75`, `108:74/75` (négation → `MC+4`) et `36:53` (`+`→`-` → `MC`). Aujourd'hui le tueur est l'assertion `ecart === 9` de `gameSystem.test.ts`, vraie 1 fois sur 7.

**(5) Trou n° 2 — mutants à tuer.** Le mutant 191 remplace le nœud **interne** (col. 75→91) ; le `!` de la col. 74 reste. Source appliquée identique au 190 : `shield: !attacker.shield`. Preuve en trois niveaux : (a) les colonnes du rapport du jour, sans run ; (b) au lot A, 190/191/193/194 doivent rendre `Killed` — un équivalent ne peut pas être tué ; (c) **cas négatif** : écrire à la main `shield: !attacker.shield`, lancer le seul fichier, constater le rouge, **restaurer par copie d'une sauvegarde vérifiée par empreinte** (jamais `git checkout`, KR-172), empreintes recopiées dans la revue.

**(6) Quel `break`** — dénominateur inchangé **258** ; détectés 210 ; si les 48 tombent `S = 100,00 %` → `floor(100/5)×5 = 100`, plafonné → **`{ high: 95, low: 90, break: 90 }`**. Le seuil bascule au plafond dès **K ≥ 23**. Donc la définition de fini n'est **pas** « atteindre 90 » mais **« zéro survivant non annoté »**. Les 48 sont tous tuables, vérifiés un par un contre la source. À `break: 90` il reste 25 mutants de marge — assez pour que la n° 11 ajoute du code, pas assez pour qu'elle le fasse sans tests. **Si des survivants résistent, on n'abaisse pas le chiffre : on ne l'écrit pas → `ESCALADE`.**

**(7) Interdits d'écriture**

| Interdit à | Fichier | Motif |
|---|---|---|
| tous | `src/brain/gameSystem.test.ts` | base de comparaison, seul tueur actuel du mutant 192 |
| tous | `src/brain/rules.golden.test.ts` | `ecartBand` est un **calcul**, pas un registre ; ses libellés ne sont pas neutralisés. Piège « plus » du § 3 de `table-doree`, dont `ecartBand` est le précédent cité |
| tous | `src/player/engine/*.test.ts` | ils tournent dans `jest.mutation.cjs` ; les modifier déplace l'attribution des tueurs |
| tous | `jest.mutation.cjs`, `jest.config.cjs`, `pre-commit-gate.sh`, `.eslintrc.cjs` | changer l'instrument pendant qu'on le lit |
| tous | `.claude/raffinage/outillage-it1.revue.md` | c'est la spécification. Lecture seule |
| tous | `bestiary.ts`, `equipment.ts`, `monsterCapacities.ts`, `brain/dossier/**`, `src/features/**` | hors périmètre muté par décision documentée |
| A et B | `stryker.config.mjs` | un seuil sur mesure partielle est définitif |
| A et B | les 4 fichiers mutés | toute écriture invalide la mesure de l'autre lot et déclenche le `+5`. Un lot qui croit devoir annoter **ne le fait pas** : il l'écrit dans sa note, lot C tranche |
| B | `docs/REGLES-DU-JEU.md` | propriété exclusive du lot A |
| C | les deux `*.rules.test.ts` | lot C **constate**, il ne répare pas |

## 3 — Texte exact pour `docs/REGLES-DU-JEU.md` § 3 (lot A, en premier)

**Ajout 1** — première ligne de la table d'Écart : `| ≤ 0 | Manqué | ×0 | aucun dégât |`

**Ajout 2** — sous la table de « Résolution d'un assaut » :

```
> **AT égales** — si les deux AT sont identiques, **personne ne remporte l'assaut** :
> l'Écart vaut 0, la qualité est **Manqué**, et aucun dégât n'est infligé de part ni d'autre.
```

**Qualification à signer par l'orchestrateur** : ce sont des **clarifications**, pas des règles neuves. Si l'orchestrateur juge que cela dépasse une clarification, la tranche **s'arrête** et la question remonte.

**Non décidé, à laisser non décidé** : l'interaction de l'égalité avec le compteur de **Garde aiguisée**. → `open_questions`, propriétaire n° 11.

**Les codes de qualité** (`'rate'`, `'erafle'`…) sont des **identifiants d'implémentation** : épinglables depuis le code sans violer KR-130. Les **libellés** sont des valeurs de jeu, affichées au joueur par `combatEngine.ts` : ils se relisent dans la table du § 3.

## 4 — Refus motivés

| # | Refusé | Motif |
|---|---|---|
| 1 | Annoter `107:74/75`, `108:74/75` comme équivalents | Réfuté par `mutation.json` : la source appliquée est `shield: !attacker.shield` — une **négation**. Quatre mutants vivants blanchis au moment où le seuil est plafonné |
| 2 | Corriger `combat.ts` (seed du `rng`, ou `rng` obligatoire) | Change `PostureDescriptor.computeAT`, signature `brain/` consommée par `combatEngine.ts` et `capacityEffects.ts` ; **MODIFIE** un fichier muté → `+5` du cliquet et dénominateur déplacé en cours de tranche. Un test borné règle le même problème à **zéro ligne de production** |
| 3 | Étendre `rules.golden.test.ts` aux bandes d'écart | `ecartBand` est un calcul, pas un registre ; piège « plus » du § 3 de `table-doree`, précédent nommément cité |
| 4 | Écrire les 21 tests dans `gameSystem.test.ts` | Deux lots nommeraient le même fichier ; 114 → ~400 l. (KR-112) ; ce fichier porte le seul tueur actuel du mutant 192 |
| 5 | Un 4ᵉ lot `contrat` pour `docs/REGLES-DU-JEU.md` | Un seul consommateur. Un lot `contrat` qui ne fige rien que personne d'autre ne lit est un lot inventé pour remplir l'essaim |
| 6 | Un helper `fixed()` partagé dans `brain/utils/` | Fichier partagé entre deux lots (collision) pour une ligne. Abstraction à deux appelants = dette |
| 7 | Qu'un lot de vague 1 lance le run complet et consigne son score | Mesure sur arbre partiel, rendue définitive par le cliquet. Runs `--mutate` scopés autorisés pour la vérification du lot seulement |
| 8 | Écrire `break: 85` « par prudence » alors que `S` donne 90 | Le seuil s'écrit mécaniquement, aucun chiffre non mesuré **dans aucun des deux sens**. Si des survivants résistent et ne sont pas honnêtement annotables : `ESCALADE` |
| 9 | Toucher `src/player/engine/*.test.ts` | Ils tournent dans `jest.mutation.cjs` |

## 5 — Demandes avant la porte 1

1. La définition de fini écrite comme « **zéro survivant non annoté sur les 4 fichiers** », pas comme un score.
2. Le trou n° 2 **retourné** dans le corps du plan : les 4 booléens sont **à tuer**.
3. L'interdiction d'écrire un seuil, **nominativement** dans les lots A et B.
4. Le texte verbatim des deux ajouts à `docs/REGLES-DU-JEU.md`, **avant** que le lot A n'écrive une assertion.
5. La ligne « `challenge.ts:69:29` = Timeout = détecté, **rien à faire** ».

**Prédiction chiffrée et falsifiable** : `All files 100.00 %`, **258/258**, 0 survivant, 0 `# errors`, `break: 90`. Si le run final rend moins, la revue **nomme chaque mutant qui a résisté** — c'est cette liste, pas le score, qui dit si B2 est finie.
