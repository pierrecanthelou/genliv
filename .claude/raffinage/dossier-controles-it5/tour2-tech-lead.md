# Tech Lead — TOUR 2, `dossier-controles` itération 5

**RISQUE** — Une assertion existante rougira que **ni la ligne de base QA (§ 4 : « zéro ne bascule ») ni ma note du tour 1 n'ont vue** : `controles.test.ts` l. 301, `expect(new Set(controles.map((c) => c.id)).size).toBe(Object.keys(CONTROLES).length)`. Les quatre dossiers témoins de ce test (`seme`, `cloneIndiceOrphelin`, `cloneSansPresence`, `cloneSansVoix`) ne mutent **aucun** champ porteur d'avertissement : la sixième règle y sera muette, la taille vaudra 5 contre 6 attendus. Ce n'est pas une supposition de comportement — c'est de l'arithmétique sur le registre. **Trois** assertions basculent donc, pas deux.

**OBJECTION** — contre la résolution proposée de C4/C8. « Choisir un témoin non-`canon` » (mon § 5.6) et « une phrase qui tient les deux » sont des **reports**. M5 a raison contre moi : `path.split('.')[0] !== section` est insatisfiable pour `canon`, et la première itération qui déclarera `section: 'canon'` sur un `path` en `canon.*` rougira **en étant correcte**. Une garde fausse protégée par le choix de son témoin est une dette à intérêts. Elle se **réécrit dans ce lot** ; le piège de C8 disparaît avec elle.

**PROPOSITION** — architecture inchangée (import dans `controles.ts`, **une** entrée, table déclarée de dix lignes), amendée sur trois points mesurés : `message` **repris** aux 5 sites qui interpolent une valeur du dossier, **écrit** aux 5 qui n'en interpolent aucune ; `location` **repris**, parce que les deux modules appellent **la même `localiserEntite`** ; garde d'it3 réécrite, garde de langue neuve.

**VERDICT** — **recevable**. 1 lot `contrat`, 4 fichiers, zéro code de production de feature, 8 critères.

---

# ANNEXE A — Réponses nommées

## A1. C1 / M1 — **R7 RESTREINT**, et le discriminant est mécanique

R7 est **retiré sur les 5 sites `condition-sans-expr`** (prémisse mesurée fausse : `validate.ts:768` interpole `feuilleDe(famille.texte)`, donc « Le champ « `condition_texte` » … », et `validate.ts:732` écrit « Le champ « `si_bloque` » … » en dur) et **maintenu sur les 5 autres**. Le narratif avait raison, et il l'avait lu dans la source.

**Comment écrire une prose par site sans recréer la seconde vérité que R7 craignait.** R7 ne craignait pas « deux textes », il craignait **la copie d'une valeur**. D'où le discriminant, vérifiable ligne à ligne dans `validate.ts` :

> **REPRIS** ⟺ le message interpole une **valeur lue dans le dossier** que la table ne peut pas reconstituer sans déréférencer un chemin — ce que ce module ne fait jamais.
> **ÉCRIT** ⟺ le message n'interpole **aucune** valeur du dossier (une constante de schéma comme `feuilleDe(famille.texte)` n'en est pas une) : une constante par site ne peut pas dériver d'une valeur, puisqu'il n'y en a pas.

| Sites | Interpolation mesurée | Verdict |
|---|---|---|
| 4 budgets | `${budget.sujet}` · `${mots}` · `${budget.budget}` (`validate.ts:810`) | **REPRIS** — R7 tient |
| `…savoirs[].revele_si` | `${designation}` = `designerSavoir` (`validate.ts:223`) | **REPRIS** — R7 tient |
| 5 `condition-sans-expr` | aucune valeur du dossier | **ÉCRIT** — R7 tombe |

La divergence future entre les 5 constantes du rapport et les phrases du validateur est **l'intention** (précédent it1 : « même fait, deux registres, deux textes assumés »), pas l'accident. Ce qui reste interdit, et ce que R7 protège vraiment : **ne jamais dupliquer une valeur**. La sonde correspondante est en B3-④ ; le critère 1 assertera que la ligne rendue du budget porte bien `601`, ce qui **prouve la reprise** au lieu de l'affirmer.

**Fait neuf, que personne n'a mesuré — le `location`.** `sitesDe` (`validate.ts:196-202`) résout le OÙ **par `localiserEntite`**, la fonction même que `controles.ts` importe déjà de `./identifiers`. Et `COLLECTIONS_IDENTIFIEES` (`identifiers.ts:125-136`) contient `canon.objectifs`, `monde.personnages`, `monde.conditions.climat`, `charpente.jalons`, `charpente.fins`. Conséquence : **8 des 10 sites reçoivent un `location` produit par la fonction du rapport lui-même** (« Personnage « Aldûr le Sage » », « Fin « … » »…). Seuls `canon.mj` et `canon.partage` retombent sur un libellé de table — mesurés : `'Canon (MJ)'` et `'Canon (partagé)'` (`tables.ts:667-668`). Reprendre le `location` n'est donc pas un pari de style : c'est **le même producteur**, et il n'y a par construction aucune seconde vérité.
*Résidu honnête, à l'arbitrage de l'UX :* ces deux libellés-là sont plus secs que le registre des lignes d'amorce (« CANON · SYNOPSIS — matériau du modèle, jamais lu tel quel »). Si le comité veut les relever, c'est un **sixième champ DÉCLARÉ** de la table (aucune valeur du dossier), **jamais** une transformation de la chaîne reprise — une capitalisation calculée sur de la prose serait exactement la classe R2.

## A2. C2 / M4 — R8 **maintenu sur le fond**, son **instrument retiré et remplacé**

M4 a raison : `controles.test.ts:676` n'épingle `startsWith('Rédigez')` que sur la boucle des consignes de `seme()`, donc la seule règle d'amorce. **Je retire cette citation** ; elle relève de la classe BUG-084 et c'est ma faute. La garde qui la remplace vaut mieux qu'elle, parce qu'elle couvre les **six** règles et les deux colonnes (message **et** remédiation) : B3-④.

**Sa discriminance est acquise par construction, et c'est ce qui la sauve de la tautologie** : les chaînes mesurées en M1 contiennent littéralement `_texte` et `si_bloque`. Brancher `issue.message` verbatim la fait **rougir**. Rien à « vérifier avant d'écrire la phrase » : la mesure est déjà au dossier.

**Réponse nommée à l'UX § 2 (« REPRENDRE tels quels, vérifié mot pour mot ») : non, et pas sur un motif de goût.** M3 est un **défaut factuel** : les deux sites `condition-sans-expr` reçoivent « ↪ Ajoutez la condition structurée correspondante… » alors que sur `si_bloque` ce qui manque est une **`duree`** — et le message le dit deux lignes plus haut. Une consigne qui contredit son propre constat n'est pas un registre de langue, c'est une consigne fausse. La vérification de l'UX (« aucun ne dit réimportez-le ») reste juste et sera portée au plan comme telle ; elle a couvert **un** défaut possible sur trois. Les 10 remédiations sont **écrites** dans la table, au registre mesuré en M4 (verbe nu à l'impératif, chemin d'écran entre parenthèses, zéro `↪`).

## A3. C4 / M5 — **je n'assume pas le contournement : la garde se réécrit ici**

Aucun prédicat portant sur **un constat** ne peut distinguer une `section` déclarée d'une `section` dérivée quand le premier segment du `path` **est** l'identifiant de section — pour `canon`, déclaré et dérivé sont indiscernables. La garde ne se répare donc pas, elle se **scinde en deux portées**, et aucune des deux ne déborde son motif (leçon de M6) :

```ts
// L'INVARIANT est « la section est DÉCLARÉE » ; « racine du path ≠ section » n'en
// était qu'un PROXY, insatisfiable pour `canon` — la SEULE des dix sections dont
// la `cle` n'a pas de point (`sections.ts:88`). Deux gardes le remplacent :
//  · EXISTENTIELLE, par règle : le témoin exhibe AU MOINS UN constat dont la
//    racine du path diffère de la section. C'est ce qui rend le témoin
//    discriminant — une dérivation naïve du premier segment casserait la règle.
//  · UNIVERSELLE, sur la SOURCE : ce module ne découpe JAMAIS un chemin. Toute
//    dérivation commencerait par là, `canon.*` compris, où plus aucun prédicat
//    sur un constat ne peut trancher.
for (const id of Object.keys(NEUVES) as (keyof typeof NEUVES)[]) {
	const constats = CONTROLES[id].controler(NEUVES[id])
	expect(`${id} → ${constats.length > 0}`).toBe(`${id} → true`)
	const discriminants = constats.filter((constat) => constat.path.split('.')[0] !== constat.section)
	expect(`${id} · discriminant → ${discriminants.length > 0}`).toBe(`${id} · discriminant → true`)
}
expect(SOURCE_CONTROLES).not.toContain("split('.')")
```

Vérifié : `controles.ts` ne contient aujourd'hui aucun `split(`, et le lot n'en introduit pas — `cheminDeTable` **efface des indices** (`replace(/\[\d+\]/g, '[]')`), il ne découpe pas. Les lignes l. 215-220 du même test (le bloquant `depart` dont le `path` commence par `charpente`) **ne bougent pas** : elles sont satisfiables et portent le même invariant sur un cas où il est décidable.

**Ce que ça règle ailleurs, et c'est ma réponse à C8** : le piège disparaît au lieu d'être documenté. Plus aucun témoin n'est interdit ; la seule exigence est qu'il produise **un** constat discriminant, et `cloneSansPorte()` (`savoirs[0].revele_si = {}` → `monde` ≠ `personnages`) la satisfait. La preuve verticale la moins chère au panneau (`texte-trop-long` sur `canon.mj`, un seul champ, précédent `read.test.ts:62`) reste recommandée **sans mise en garde** : elle vit dans un autre fichier et n'a plus de voisin qui la contredise. La phrase que le QA devait écrire se réduit à : *« le témoin de la règle neuve est `cloneSansPorte()` ; la preuve verticale du panneau est `canon.mj`. »*

## A4. C7 / M7 — lecture **confirmée**, avec deux corrections

1. **R3 : confirmé et durci.** 4 entrées ⇒ 8 `validateDossier` par rendu ⇒ ≈ 5,9 ms sur 13 ko, plus du tiers d'une trame. Mon « dirimant à soi seul » était une intuition ; c'en est une mesure. R3 passe du principe au chiffre.
2. **R6 : confirmé, et c'est le premier rejet de l'itération qui repose sur un nombre.** Le dépôt avait écrit que « c'est cette mesure-là qui décidera » ; elle décide **contre** le cache.
3. **Correction 1 — le facteur n'est pas ce qui décide.** ×41 sur une base négligeable est un énoncé de **marge**, pas de risque. Le nombre qui déciderait est le budget absolu d'un rendu : on est à ~9 % d'une trame. Écrire les deux, comme M7 le fait, est juste ; en tirer une urgence ne le serait pas.
4. **Correction 2 — le multiplicateur réel est le DOUBLE APPEL** (`DossierEditorScreen.tsx:104` + `PanneauControles.tsx:38`), et **ce lot ne l'ouvre pas** et ne doit pas l'ouvrir → **R11** (nouveau rejet, annexe C).
5. **La réserve de M7 est la seule dette vivante** : 13 ko est une fixture. Le plan doit consigner **le protocole** (fichier, taille en octets, machine, JIT chaud) dans la revue, pas seulement le chiffre — même doctrine que le score de mutation : un nombre sans son protocole n'est pas une mesure et ne se compare à rien.

## A5. M8 — **confirmé, condition remplie, voici l'unique changement**

`src/features/dossier-controles/tests/panneauControles.test.tsx` est dans la liste de fichiers de L1 : la dette se corrige ici. Le nom promet **« chaque ligne »** ; l'assertion l. 182 compte **globalement** (`queryAllByRole('button')).toHaveLength(lignes.length)` — 4 boutons dans un seul `<li>` la passeraient — et rien ne vérifie que le bouton est réellement un **arrêt de tabulation** (`tabindex="-1"` la passerait aussi). **Assertion élargie, pas de renommage**, dans la boucle `lignes.forEach` déjà présente (l. 178-181) :

```ts
	const bouton = within(ligne).getByRole('button') // UN par ligne : getByRole lève à 0 comme à 2
	expect(bouton).not.toHaveAttribute('tabindex')   // arrêt de tabulation NATIF, jamais -1
```

et **suppression** de l'agrégat l. 182, que ces deux lignes subsument. Rien d'autre : aucune couverture neuve, aucun rendu neuf, aucun fichier de plus dans le même diff.

## A6. C3 — **je ratifie la table du narratif** (7 alerte / 3 info / 0 bloquant)

Hors de mon terrain de veto : je ne conteste aucune ligne, ni le site 9 ni le site 4. Deux conséquences d'architecture à écrire avec elle :

- **Le motif de M9 rend le zéro-bloquant opérationnel** : le `niveaux: ['alerte','info']` de l'entrée est l'ensemble fermé **de cette entrée**, et la règle de collection bloquante d'it6 (« aucune fin atteignable ») sera une **entrée distincte** (cause distincte, KR-164). it6 n'aura donc jamais à rouvrir ni ce `niveaux`, ni l'`Exclude<NiveauControle, 'bloquant'>` de la table. Le motif juste ne coûte rien et libère bien it6 ; l'ancien l'aurait enfermée.
- **Les dix niveaux ne se redécident pas dans le code** : ils viennent de la table du plan, ligne à ligne — même sens d'écriture que la table dorée (doc → test → code).

## A7. C5 — **personne ne conteste, et surtout pas moi**

Lire `.warnings` est **RETENU**. C'est ma position depuis le tour 1 (§ 2), le QA l'a documentée en critère 4, M6 lui donne sa forme exacte, le narratif la porte en rejet 8. **Aucun contradicteur.**

**Mais je corrige ma propre sonde d'exécution du tour 1**, qui était fausse : j'avais proposé « un dossier porteur d'`errors` ne produit aucun contrôle de la règle neuve ». Faux — `validate.ts` empile `warnings` et `errors` **indépendamment** (`ok = errors.length === 0`, l. 818), donc un dossier fautif peut porter les deux et la sonde mentirait dans les deux sens. Énoncé juste, et discriminant : **un clone dont la seule anomalie est une `error` (référence pendante, aucun avertissement) ne produit aucune ligne de la règle neuve.** Le détail compte : le témoin doit être construit pour ne porter **aucun** `warning`, sinon le test est vert pour la mauvaise raison. Classe BUG-084 évitée de justesse, et je la signale comme mienne.

---

# ANNEXE B — LE LOT

## B1. Découpage — **UN SEUL LOT**, inchangé

Le plafond est 4 ; l'itération en demande 1. Aucun parallélisme à révéler : **exécution séquentielle, sans worktree ni fusion** (précédent it3). Propriété exclusive triviale : un seul lot, donc aucun fichier partagé possible.

### L1 — `avertissements-au-rapport` — **marqué `contrat`** (touche `src/brain/`), s'exécute seul

| Fichier | N/R | Contenu |
|---|---|---|
| `C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.ts` | **R** | l'import, l'entrée de registre, `SITES_AVERTISSEMENT` (10 lignes), `cheminDeTable`, `constatDAvertissement`, les **deux** JSDoc renversées (l. 22-23 et l. 80) |
| `C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.test.ts` | **R** | garde KR-217 rétrécie (l. 336-342), garde de section réécrite (l. 241), garde de `path` amendée (l. 287-309) **+ l. 292-297 : le tableau `rapports` gagne `controlerDossier(cloneSansPorte())`, sans quoi l. 301 rougit**, `TEMOINS`/`NEUVES` gagnent une clé, balayage de totalité, garde de langue, sondes neuves |
| `C:\Users\pierr\Desktop\genliv\src\features\dossier-controles\tests\panneauControles.test.tsx` | **R** | la preuve **verticale** par clone muté d'un seul champ (`canon.mj`) **+ la dette d'it4 (A5)** |
| `C:\Users\pierr\Desktop\genliv\src\brain\dossier\issues.ts` | **R, commentaire seul** | la phrase l. 76 — zéro ligne exécutable |

**Conditionnels** (sans conflit possible, il n'existe qu'un lot) : `…\src\features\bascule-editeur\tests\dossierEditorScreen.test.tsx` (R) **seulement si** un compte de badge rougit — il ne devrait pas, zéro avertissement mesuré sur les trois dossiers ; `…\src\features\bascule-editeur\components\DossierEditorScreen.tsx` (R, commentaire seul) **seulement si** la mesure contredit sa prose l. 97-101 — par défaut la mesure va dans la revue.

**Vérification du tour 1, maintenant FAITE et non plus déduite** : `validate.ts` n'importe pas `controles.ts` (bloc d'import l. 1-34 : `types`, `issues`, `identifiers`, `tables`, `expr`, `deltas`, `predicates`, `freeze`, `../bestiary`). **Aucun cycle.**

## B2. Signatures exactes

```ts
// AJOUTS D'IMPORT — dans `controles.ts`
import type { DossierIssue, DossierIssueCode } from './issues'
import { validateDossier } from './validate'

/**
 * UN SITE d'avertissement du validateur, et ce que le linter en fait.
 */
interface SiteAvertissement {
	/** DÉCLARÉ et jamais lu : la sonde le compare au `code` réellement produit, sinon la table dériverait sans bruit. */
	code: DossierIssueCode
	/** Jamais `bloquant` : aucun de ces dix sites, PRIS SEUL, ne rend l'aventure injouable (motif M9 — et NON « parce que ce sont des warning »). */
	niveau: Exclude<NiveauControle, 'bloquant'>
	/** La section DÉCLARÉE par la règle de mappage — jamais dérivée (KR-219). */
	section: SectionId
	/**
	 * Le QUOI. `null` = le message du validateur est REPRIS tel quel, parce qu'il
	 * interpole une VALEUR LUE DANS LE DOSSIER (un compte, la désignation d'une
	 * entité) que cette table ne peut pas reconstituer sans déréférencer un
	 * chemin — ce que ce module ne fait jamais. Une chaîne = le message du
	 * validateur n'interpole aucune valeur du dossier, et celui-ci est ÉCRIT pour
	 * le rapport. CINQ et CINQ, et la répartition n'est pas un goût : elle se
	 * relit ligne à ligne dans `validate.ts`.
	 */
	message: string | null
	remediation: string
}

/** DIX SITES, QUATRE SECTIONS. Clé = chemin de TABLE (indices effacés). PRIVÉE. */
const SITES_AVERTISSEMENT: Record<string, SiteAvertissement> = { /* les 10 lignes du plan */ }

/**
 * `monde.personnages[2].savoirs[0].revele_si` → `monde.personnages[].savoirs[].revele_si`.
 * Un EFFACEMENT d'indices, jamais un découpage : ce module ne lit aucun segment
 * de chemin, et un balayage de source le tient (§ A3).
 */
function cheminDeTable(path: string): string {
	return path.replace(/\[\d+\]/g, '[]')
}

/**
 * UN avertissement → ZÉRO ou UN constat. Zéro quand le site n'est pas dans la
 * table : silence de classe KR-222, tenu par un TEST de totalité et jamais par
 * une levée — `controlerDossier` se promet pure et totale.
 * `location` est REPRIS : `validate.ts` le produit avec la MÊME `localiserEntite`
 * que ce module importe déjà (8 sites sur 10 ; les deux budgets du canon
 * retombent sur le libellé de `BUDGETS_DE_MOTS`).
 */
function constatDAvertissement(avertissement: DossierIssue): ConstatControle[]
```

Entrée de registre, déclarée **en dernier** dans `CONTROLES` (l'ordre des clés est l'ordre de rendu ; `controles.test.ts:172` épingle l'amorce en tête) :

```ts
'avertissement-de-validation': {
	libelle: 'Avertissement du validateur',
	niveaux: ['alerte', 'info'],
	controler: (dossier) => validateDossier(dossier).warnings.flatMap(constatDAvertissement),
	remediation: (constat) =>
		estCleDe(SITES_AVERTISSEMENT, constat.path) ? SITES_AVERTISSEMENT[constat.path].remediation : '',
}
```

`constat.path` porte le **chemin de table** (`cheminDeTable(avertissement.path)`), comme les cinq règles livrées — d'où la consultation directe, sans seconde normalisation. Conséquence assumée, avec précédent : deux constats du même site à deux index portent le **même `path`** et se distinguent par leur `location`, exactement comme `personnage-sans-presence` (`path: 'monde.personnages[].presence[].lieu_id'` pour chaque personnage). **`entityId` est absent** des constats mappés : les quatre `warnings.push(` appellent `anomalie()` à cinq arguments (le sixième, `entityId`, est optionnel et non passé). Ce n'est pas un défaut à réparer ici — le faire ouvrirait `validate.ts`, exclu (R9).

## B3. Les gardes que le lot doit écrire

① **Totalité par balayage** (KR-199) — et **réponse nommée au critère 3 du QA** : « un `Record` total fermé par compilation » est **impossible** ici. `SITES_AVERTISSEMENT` est indexée par des chemins (`string`), pas par une union ; seule `PROSES_AMORCE` peut être totale par `tsc` parce que ses clés sont `keyof typeof AMORCE`. La totalité se tient donc par balayage, en quatre morceaux :

```ts
for (const budget of BUDGETS_DE_MOTS) /* 4 */ expect(estCleDe(SITES_AVERTISSEMENT, budget.path))…
for (const f of FAMILLES_DE_CONDITIONS.filter((f) => f.alerteSansExpr)) /* 4 sur 7 */ expect(estCleDe(SITES_AVERTISSEMENT, f.texte))…
for (const isole of ['monde.personnages[].savoirs[].revele_si', 'monde.personnages[].plan_actions[].si_bloque'])…
expect(Object.keys(SITES_AVERTISSEMENT)).toHaveLength(10) // 4 + 4 + 2, aucune ligne morte
```

Clés vérifiées à la source : pour une famille, `validate.ts:770` écrit `` `${parentDe(site.path)}.${feuilleDe(famille.texte)}` ``, dont le normalisé **est exactement `famille.texte`** ; pour un budget, `site.path` normalisé **est exactement `budget.path`**.

② **Le résidu, et il faut le nommer** — les deux sites isolés sont écrits **à la main** dans `validate.ts` : aucune table ne les porte, donc ① ne peut pas les découvrir. Un cinquième site écrit demain serait **abandonné en silence**. Épingle (même famille que `SOURCE_CONTROLES` et que `expect(CHEMINS_DE_DELTAS).toHaveLength(4)`), **comptée et non déduite : il y a exactement 4 occurrences aujourd'hui** :

```ts
// QUATRE sites d'écriture pour DIX lignes de table : les deux registres se
// DÉPLIENT, les deux sites isolés non. Un cinquième `warnings.push(` renvoie son
// auteur ICI, à `SITES_AVERTISSEMENT` — sans quoi son avertissement n'atteindrait
// le rapport de personne. Ne pas confondre 4 et 10.
expect(SOURCE_VALIDATE.split('warnings.push(').length - 1).toBe(4)
```

C'est **la garde la plus chère à retirer et la première qu'un ouvrier pressé jugera « trop maligne »** (mon RISQUE). Elle doit passer telle quelle dans le plan, commentaire compris.

③ **Section déclarée** — A3 (existentielle par règle + `not.toContain("split('.')")`).

④ **Registre de langue** — la garde qui **remplace** celle que R8 citait à tort, sur les **six** règles et les **deux** colonnes :

```ts
// Aucun terme interne, aucun glyphe d'un autre registre, aucune mention de canal
// ni d'import. DISCRIMINANCE ACQUISE PAR MESURE : les chaînes réelles de
// `condition-sans-expr` contiennent `_texte` et `si_bloque` — brancher
// `issue.message` verbatim fait rougir cette garde.
const TERMES_INTERDITS = ['↪', '_texte', '_expr', 'si_bloque', 'revele_si', 'réimport']
```
(appliquée à `controle.message` **et** `controleRemediation(controle)` de chaque rapport de preuve).

⑤ **KR-217 rétrécie sur son propre motif** (M6, critère 4 du QA — **RETENU sans réserve**) :

```ts
it('le rapport lit les avertissements du validateur, jamais ses anomalies', () => {
	// La garde d'it3 interdisait le MODULE au nom d'un motif qui ne porte que sur
	// `errors` : un dossier PERSISTÉ n'en porte jamais (KR-225), un voyant branché
	// là ne pourrait pas s'allumer. `warnings` est l'exact inverse — le seul canal
	// dont tout l'intérêt est qu'il SURVIT à la persistance.
	expect(SOURCE_CONTROLES).not.toContain('.errors')
	expect(SOURCE_CONTROLES).toContain('.warnings') // la garde peut rougir : elle n'est pas vraie à vide
})
```
plus la sonde d'exécution **corrigée** (A7) : un clone dont la **seule** anomalie est une `error`, **sans aucun `warning`**, ne produit aucune ligne de la règle neuve.

⑥ **`path` — la garde d'it1 amendée** (elle appartient au narratif ; j'en donne le prédicat exact pour qu'il ne soit pas lâche) :

```ts
/** Clé de la table, OU préfixe STRICT d'au moins une clé, coupé sur le séparateur. */
function estCheminDeChamp(path: string): boolean {
	if (estCleDe(DESTINATION_DES_CHAMPS, path)) return true
	return Object.keys(DESTINATION_DES_CHAMPS).some((cle) => cle.startsWith(`${path}.`))
}
```
Le point final n'est pas décoratif : sans lui, `canon.mj` matcherait `canon.mjolnir`.

⑦ **`jouable` ne bouge jamais** : tenu **par le type** (`Exclude<NiveauControle, 'bloquant'>`) et par la non-régression ⑧.

⑧ **Non-régression du calme** : sur les **deux** fixtures et un **dossier neuf**, rapport identique ligne pour ligne. Une itération qui allume sans se taire ne prouve rien de plus qu'une qui se tait sans allumer.

## B4. Les 8 critères (le compte est **exactement** 8)

1. **Allumage + silence** — clone de `dossier-minimal` muté d'**un** champ, rouge puis calme dans le même test ; la ligne du budget porte le compte mesuré (`601`), ce qui **prouve la reprise**.
2. **Jamais bloquant** — les quatre mutations, `niveau ∈ {alerte, info}`, `jouable` inchangé.
3. **Table totale** — B3-① et B3-②.
4. **KR-217 rétrécie** — B3-⑤.
5. **Non-régression du calme** — B3-⑧.
6. **Registre de langue** — B3-④.
7. **Section déclarée** — B3-③ (+ ⑥).
8. **Preuve verticale au panneau** — `texte-trop-long` sur `canon.mj`, fixture locale, anatomie à trois étages inchangée.

**S'il faut un neuvième slot pour l'UX ou le QA, le critère 2 est le seul à sacrifier** : il est déjà porté par le type (`Exclude<…, 'bloquant'>`) et par `jouable` du critère 5. Les sept autres portent chacun une propriété qu'aucun autre ne porte.

## B5. Fichiers explicitement **NON** touchés — c'est le contrat du lot

`validate.ts`, `types.ts`, `destinations.ts`, `tables.ts`, `sections.ts`, `brain/index.ts`, `pastilles.ts`, `ListeControles.tsx`, `PanneauControles.tsx`, `SectionNav`. **Aucun code de production de feature n'est écrit dans cette itération.** Le baril ne bouge pas : `controlerDossier`, `Controle`, `RapportControles` en sortent déjà.

---

# ANNEXE C — Registre de rejets consolidé (à recopier au § 8 du plan — BUG-082)

| # | Rejeté | Statut au tour 2 | Motif / évolution |
|---|---|---|---|
| **R1** | Deux sources fusionnées côté `PanneauControles` | **DURCI EN VETO** | Duplication de la source de vérité du rapport (`parSection` recalculé dans une vue) + le type de ligne d'it4 passe de `Controle[]` à une union. Terrain de veto explicite. Le narratif (rejet 8) et l'UX convergent. |
| **R2** | Résolveur générique `path → SectionId` | **MAINTENU, désormais MÉCANIQUE** | KR-219 mot pour mot ; et B3-③ le rend vérifiable (`not.toContain("split('.')")`) au lieu de le confier à la vigilance. |
| **R3** | Quatre entrées `CONTROLES`, une par code | **MAINTENU, DURCI par le chiffre** | M7 : 8 validations/rendu ≈ 5,9 ms sur 13 ko. L'intuition du tour 1 est devenue une mesure. |
| **R4** | Élargir `controler(dossier, contexte)` | **MAINTENU** | Abstraction à **zéro** appelant supplémentaire, qui toucherait les cinq entrées livrées. Mon biais déclaré ; je m'y applique la règle. |
| **R5** | `ConstatControle.section` optionnelle | **DURCI EN VETO** | État illégal représentable (une flèche d'it4 qui ne pointe nulle part), ricochet sur `parSection` et `SectionNav`. |
| **R6** | Mémoïser / cacher le rapport | **MAINTENU, sur un nombre** | M7 : ~1,5 ms par rendu, rien à absorber. KR-013/113. Premier rejet de l'itération qui ne repose pas sur une doctrine. |
| **R7** | Réécrire les dix messages | **RESTREINT** — maintenu sur **5** sites, **retiré** sur les 5 `condition-sans-expr` | Prémisse mesurée fausse (M1) là où le message interpole un nom de champ ; vraie là où il interpole une **valeur du dossier**. Discriminant en A1. |
| **R8** | Réutiliser `dossierIssueRemediation` | **MAINTENU sur le fond, INSTRUMENT RETIRÉ** | M4 : `controles.test.ts:676` ne couvre que la règle d'amorce. Garde de remplacement en B3-④, discriminante par mesure. |
| **R9** | Ouvrir un lot sur `validate.ts` | **MAINTENU** | Périmètre figé, et le gain ne se démontre pas — M7 montre même qu'il n'y a rien à gagner. |
| **R10** | *(nouveau)* Résoudre le `nom` de l'indice pour réécrire le message de `revelation-sans-porte` | **REJETÉ** | Il faudrait déréférencer un chemin dans le dossier — **second moteur de traversée du schéma**, interdit par la docstring de `producteursParIndice`. Le défaut est réel (`designerSavoir`, `validate.ts:223`, met un **identifiant** dans la prose de l'auteur) mais il appartient à `validate.ts`. → `open_questions`, **« le savoir se nomme par son identifiant »**, propriétaire = l'itération qui rouvrira `validate.ts`. |
| **R11** | *(nouveau)* Partager **un** rapport entre `DossierEditorScreen` et `PanneauControles` (contexte/provider) pour supprimer le double appel | **REJETÉ** | ~1,5 ms mesurés ; il faudrait ouvrir un fichier d'une autre feature pour une optimisation que la mesure ne réclame pas (KR-013/113, R6). À rouvrir **seulement** sur une mesure faite sur un dossier écrit à la main, avec son protocole. |

**Dette d'it4** — **RETENUE et RÉSOLUE dans ce lot** (A5) : condition remplie (M8), correction = une assertion élargie et la suppression de l'agrégat qu'elle subsume, rien d'autre.