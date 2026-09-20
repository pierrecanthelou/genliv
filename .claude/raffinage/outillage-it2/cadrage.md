# Cadrage — tranche B2 `outillage-2` (hors cycle, pas de `specification.json`)

**Goal brut** (roadmap § 2 bis) : *le score de mutation cesse de mentir sur `combat.ts`*. Écrire les **21 tests du bucket (a)**, déjà spécifiés — **ne pas les re-spécifier** : `.claude/raffinage/outillage-it1.revue.md` § 2 porte la table de correspondance (numéros de ligne **vérifiés exacts aujourd'hui**). Plus : supprimer le **±1 mutant** entre deux runs, causé par le `rng` non seedé de `combat.ts:107`.

**Pourquoi maintenant** : la n° 11 `moteur-arbitre` modifie `challenge.ts` + `xp.ts`, donc **relève `break` 80 → 85** (cliquet, `docs/WORKFLOW.md`). À 81,40 % la porte ne passerait pas. C'est la seule dette du § 2 bis qui bloque pour de bon.

**Mesure du 2026-09-20** (`npm run test:mutation`, run complet, exit 0, 1 min 23 s) — **identique au 2026-08-02** :

| Fichier | score | tués | timeout | survécu | sans couv. | RuntimeError |
|---|---:|---:|---:|---:|---:|---:|
| **All files** | **81,40** | 209 | 1 | 39 | 9 | **0** |
| `challenge.ts` | 86,84 | 32 | 1 | 3 | 2 | 0 |
| `characteristics.ts` | 94,12 | 32 | 0 | 2 | 0 | 0 |
| `combat.ts` | **62,50** | 45 | 0 | 20 | 7 | 0 |
| `xp.ts` | 87,72 | 100 | 0 | 14 | 0 | 0 |

**Les 49 mutants restants, extraits du `mutation.json` du jour** (48 à tuer + 1 `Timeout` = détecté, rien à faire) :

```
challenge.ts   52:6 Conditional(false) · 52:22 String("") · 53:6 Conditional(false) · 53:22 String("")
               69:29 Update(i--) TIMEOUT=détecté · 88:26 Equality(roll < carac)
characteristics 80:6 Equality(pe <= EN/5) · 81:6 Equality(pe <= EN/3)
combat.ts      26:45 Arith(mc + randInt(0,6)) · 31:45 Arith(mc + randInt(4,10)) · 31:14 ArrowFunction(()=>undefined)
               36:53 Arith(... - (shield ? 1D4 : 0))
               61:6 Conditional(false) · 61:6 Equality(ecart < 0) · 61:25 Object({}) · 61:36 String("") · 61:51 String("")
               62:37 · 62:54 · 63:36 · 63:52 · 64:36 · 64:56 · 65:39  String("") ×7  (quality + label des 4 bandes)
               75:9 Arith((force + MC/2) / multiplier)
               107:74 Bool(!attacker.shield) · 107:75 Bool(attacker.shield) · 108:74 Bool(!defender.shield) · 108:75 Bool(defender.shield)
               110:6 Conditional(false) · 110:26 Object({}) · 110:36 String("") · 110:93 String("")
               121:14 Arith(pfBase(winner,rng) / postureFactor) · 125:39 String("")
xp.ts          27:6 Conditional(false) · 45:3 Conditional(case 'facile': vidé) · 48:41 Conditional(true)
               68:6 Conditional(false) · 68:15 String("") · 69:6 Conditional(false) · 69:15 String("")
               86:6 Conditional(false)+Equality(< 6) · 87:6 Conditional(false)+Equality(< 8) · 88:6 Conditional(false)+Equality(< 10)
               99:6 Conditional(false)
```

**Cause mesurée du ±1** : `combat.ts:107:64` et `108:64`, mutateur `ObjectLiteral` `{ shield: …, rng } → {}`. Ils sont **`Killed` aujourd'hui** mais par un test (`resolveAssault: higher AT wins`, `fixed(0)`) dont l'assertion a **1 chance sur 7** de coïncider avec un tirage `Math.random` : ils survivent aléatoirement. Le garde-fou « aucun fichier ne recule » se lit donc à ±1 mutant près — c'est la dette à solder.

**Contraintes qui s'appliquent, à ne pas re-débattre**
- `docs/WORKFLOW.md` § « Score de mutation » : cliquet (`break` ne descend **jamais**), seuil = `floor(score mesuré / 5) × 5`, **plafond 90**, « aucun fichier ne recule », **`RuntimeError` : zéro toléré**, annotation `// Stryker disable next-line <Mutator>: <motif>` pour un équivalent, neutralisation **par mutateur, jamais un fichier entier**, contrepartie table dorée obligatoire dans le **même lot**.
- **KR-130 — sens d'écriture permanent** : `docs/REGLES-DU-JEU.md` → `rules.golden.test.ts` → le code. Une valeur recopiée depuis le code (ou depuis le `received` d'un test rouge) **fige le défaut au lieu de le verrouiller**. Valeur absente de la doc : on corrige la doc, jamais l'inverse.
- KR-235 : un instrument non mesuré n'est pas un instrument. Toute phrase « ce test rougirait » se **mesure** (ici, le rapport Stryker EST la mesure).
- Style : tabs, quotes simples, pas de point-virgule, **labels de test sans apostrophe**.
- `jest.mutation.cjs` n'exécute que `src/brain/**` + `src/player/**` : un mutant que seul un test RTL pouvait tuer est, par définition, un survivant.

**Fichiers probablement concernés** : `src/brain/gameSystem.test.ts` (R) et/ou de nouveaux `src/brain/*.test.ts` (N) · `stryker.config.mjs` (R, seuil) · `src/brain/combat.ts` (R, **annotations d'équivalence seules**) · `docs/REGLES-DU-JEU.md` (R ?) · `docs/WORKFLOW.md`, `CHANGELOG.md`, `code-knowledge.json`, `bug_history.json`.

**Cinq trous que le comité doit arbitrer** *(ne pas les traiter comme acquis)*
1. `ecartBand(ecart <= 0) → { quality: 'rate', label: 'Manqué', factor: 0 }` et le cas d'égalité `atA === atD → winner 'tie', band 'rate', damage 0` **ne figurent NULLE PART dans `docs/REGLES-DU-JEU.md` § 3** (sa table d'Écart commence à 1 ; l'égalité des AT n'y est pas décrite). Or 9 des 49 mutants sont précisément là. Les épingler depuis le code viole le sens d'écriture KR-130.
2. `107:75` / `108:75` (`!!x → x`) : plausiblement **équivalents** (`shield?: boolean`, consommé par `shield ? … : …`, truthiness seule). Équivalent → annotation ; sinon → test. À trancher **et à mesurer**.
3. Quel `break` viser ? Formule `floor(S/5)×5` **et** plafond 90 **et** « au-delà du plafond, tout survivant restant porte une annotation ». Si les 48 tombent, S = 100 % : `break` 90 et **zéro survivant non annoté**. Est-ce tenable, ou faut-il s'arrêter avant ?
4. Où vivent les 21 tests ? Le seuil mesuré à l'itération précédente est de **12 tests par lot** ; `gameSystem.test.ts` fait 114 lignes aujourd'hui.
5. Un lot qui ne touche que des `src/brain/**/*.test.ts` est-il un lot **`contrat`** au sens de la règle « tout lot touchant `brain/` » ? (Deux lots `contrat` sont impossibles : le contrat s'exécute **seul** et en premier.)
