# Tour 1 — `qa`

RISQUE — Deux trous mesurés menacent une table dorée fausse-verte avant sa naissance : 9 des 21 tests (`ecartBand(ecart<=0)`, le cas `tie` `atA===atD`) épingleraient une valeur absente de `docs/REGLES-DU-JEU.md` §3 — recopiée du code, contraire à KR-130. Et le mutant `ObjectLiteral` `combat.ts:107/108` n'est « Killed » aujourd'hui que par une coïncidence **1/7** (vérifié : test id 915, `ecart=9` seulement si `randA=randD` sur les deux `randInt(0,6)` non contrôlés) — sans fixer `Math.random`, « aucun fichier ne recule » restera un vœu.

OBJECTION — Le cadrage renvoie à `outillage-it1.revue.md` §3 (55 suites/644 tests/15,6s) comme socle « aucune régression ». `npx jest` relancé en entier aujourd'hui : **102 suites/1750 tests/~21s**, un échec isolé et flaky (`dossier-fiches`, hors `brain/` — repassé seul, vert). `git ls-tree` confirme 102 fichiers `*.test.ts(x)` avant le dernier commit de feature : le socle « 55/644 » ne correspond à aucun run complet mesurable.

PROPOSITION — (1) Amender `docs/REGLES-DU-JEU.md` §3 en premier, puis épingler depuis la doc corrigée. (2) Le test qui tue 107/108 pour TOUT tirage : `jest.spyOn(Math,'random')` fixé à une valeur ≠ 0 pendant que `resolveAssault` reçoit `fixed(0)`, assertion sur `ecart`. (3) `xp.ts:45:3` : `challengeXp({challengeTier:2, heroTier:3, success:true, baseXp:3, margin:5})` doit valoir `1` — `baseXp+bonus≠1` démasque le fall-through. (4) Adopter **102 suites/1750 tests/~21s** comme socle réel.

VERDICT — recevable sous réserve.

---

## ANNEXE

### 1. Comment un critère se formule quand l'instrument est Stryker

L'observable n'est jamais « le test passe » mais **le statut du mutant nommé dans le rapport** : `Killed`/`Ignored` (avec motif) = critère tenu ; `Survived`/`NoCoverage`/`Timeout` = non tenu ; `RuntimeError` = panne d'instrument. Forme : « Étant donné le mutant `<fichier>:<ligne>:<col>` `<Mutateur>` (remplacement `<X>`), quand `npm run test:mutation` tourne, alors son statut dans `reports/mutation/mutation.json` est `Killed`, tué par un test qui assert sur `<champ divergent>` — ou `Ignored` avec annotation si équivalence démontrée. » Un critère « le score de `combat.ts` monte » n'est pas observable seul.

### 2. Le piège du faux vert — mesuré

- **`combat.ts:107:64`/`108:64` (`ObjectLiteral {}`)** — lecture directe de `mutation.json` (id 189/192) : `status: Killed`, `killedBy: ["915"]`, `statusReason` = `Expected: 9, Received: 3` / `Received: 10`. Avec `{}`, `computeAT` retombe sur `rng = Math.random` ; `ecart = |9 + (randD − randA)|` = 9 **uniquement** si `randA = randD` → 7 issues sur 49 = **exactement 1/7**, par calcul.
- **`107:75`/`108:75` (`!!x → x`)** — `shield` n'est consommé qu'en position de vérité (`shield ? … : 0`, l.36). **Équivalent réel.** `107:74`/`108:74` (`!!x → !x`) inverse la valeur : **pas équivalent**, test à écrire (aucun test n'exerce Défensive+bouclier via `resolveAssault`).
- `xp.ts:27:6` et `xp.ts:45:3` survivent **pour la même raison** — ΔT=-1 n'est jamais testé. Un seul scénario tue les deux.

### 3. Source des valeurs attendues — KR-130

| Bucket | Ligne | Valeur attendue | Section source |
|---|---|---|---|
| a1/a2 | `challenge.ts:52-53` | mapping legacy `difficulty→tier` | **Aucune** — migration KR-021/116, source = JSDoc du fichier |
| a3 | `challenge.ts:88` | `roll === carac → success:true` | §2 « inférieur ou égal » |
| a5 | `combat.ts:26` | `AT = MC − Rand(0,6)` | §3 Postures, Normale |
| a6 | `combat.ts:31` | `AT = MC − Rand(4,10)` | §3 Postures, Précise |
| a7 | `combat.ts:36` | `AT = MC + 1D4 (+1D4 si bouclier)` | §3 Défensive + Équipement/Bouclier |
| a8 | `combat.ts:107-108` | `!x` inverse shield ; `x` seul = équivalent | §3 Équipement, Bouclier |
| a9 | `combat.ts:75` | `(FO+MC/2) × mult.` avec arme ≠1 | §3 PF_base + tableau Armes |
| a10 | `combat.ts:121` | `pfBase × postureFactor` | §3 + Postures « Effet sur les dégâts » |
| a11 | `combat.ts:61` | **absente** | §3 tableau Écart commence à 1 : **veto tant que non amendée** |
| a12 | `combat.ts:62-65` | labels + facteurs 0.5/1/1.5/2 | §3 tableau Écart |
| a13 | `combat.ts:110` | **absente** | **veto tant que non amendée** |
| a14 | `combat.ts:125` | `winner:'defender'` si `atD>atA` | §3 « le score le plus élevé remporte » |
| a16/a17 | `characteristics.ts:80-81` | `PE<EN/5→-2`, `PE<EN/3→-1` | §1 Malus d'épuisement |
| a18 | `xp.ts:27` | `deltaBand(-1)='facile'` | §5 tableau ΔT |
| a19 | `xp.ts:45` | `challengeXp(ΔT=-1, réussite)=1` | §5 ΔT, colonne hors combat |
| a20 | `xp.ts:48` | `+1 seulement si margin≥3` | §5 « +1 si marge ≥ 3 » |
| a21 | `xp.ts:68-69` | 0 si insignifiant, 1 si facile | §5 ΔT, colonne combat |
| a22 | `xp.ts:86-88` | 1/3/7/15/30 aux paliers 4/6/8/10/12 | §5 Coût caractéristique |
| a23 | `xp.ts:99` | MC 5/10/15/20/25 pour +1..+5 | §5 Coût MC |

### 4. Ce qui ne doit pas reculer

- **Porte** : `tsc` 0 sortie ; `npx jest` **102 suites / 1750 tests / ~21 s**, un échec isolé (`panneauPersonnages.test.tsx`, « Force se clampe aux deux bornes 1 et 12 »), **passant seul** (3934 ms) → flaky de timing préexistant, hors `brain/`. **Ne pas utiliser 55/644.**
- **Mutation par fichier**, recompté depuis `mutation.json` : `challenge.ts` 86,84 (32K/1T/3S/2NC) · `characteristics.ts` 94,12 (32K/2S) · `combat.ts` 62,50 (45K/20S/7NC) · `xp.ts` 87,72 (100K/14S). Tolérance ±1 mutant.
- **`RuntimeError`** : 0 aujourd'hui, doit rester 0.

### 5. Mutants à risque de résister

- `107:75`/`108:75` — **équivalent démontré** : annotation `// Stryker disable next-line BooleanLiteral: shield consomme en position de verite, !!x et x sont indiscernables`.
- Aucun autre n'est structurellement résistant une fois la doc amendée ; a11/a13 sont bloqués **par absence de source**, pas par difficulté technique.

### 6. `xp.ts:45:3`

`expect(challengeXp({challengeTier:2, heroTier:3, success:true, baseXp:3, margin:5})).toBe(1)`. Correct → `deltaBand(-1)='facile'` → `1`. Mutant (case vidé, fallthrough vers `'equilibre'`) → `4`. Non tué aujourd'hui car ΔT=-1 n'est jamais couvert (id 247, `Survived`).

### 7. Refus motivés

1. **REJETÉ** : épingler `ecartBand(ecart<=0)` et le cas `tie` depuis le code ou un test rouge — violerait KR-130 et figerait un défaut possible.
2. **REJETÉ** : utiliser 55 suites/644 tests comme socle — non reproductible aujourd'hui, comparer contre un chiffre non re-mesurable est aveugle par construction.
3. **REJETÉ** : compter le mutant `ObjectLiteral 107/108` comme « tenu » sur la foi du rapport du jour — vert par coïncidence 1/7, démontré par calcul.
4. Hors domaine (signalé, non tranché) : « un lot qui ne touche que `*.test.ts` est-il `contrat` » relève du Tech Lead.
