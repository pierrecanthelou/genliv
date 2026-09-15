# Tech Lead — tour 1, `dossier-controles` itération 5

**RISQUE** — `controlerDossier` est appelé **deux fois par rendu** d'écran : `src/features/bascule-editeur/components/DossierEditorScreen.tsx:104` (pour `parSection`) et `src/features/dossier-controles/components/PanneauControles.tsx:38` (pour le rapport). Importer `validateDossier` y ajoute deux balayages complets du schéma, chacun suivi d'un clone JSON et d'un gel profond du dossier entier. Le commentaire de `DossierEditorScreen.tsx:92-101` promet que « le jour où un dossier réel rendra ce balayage visible au profilage, c'est cette mesure-là qui décidera » : la mesure devient due **dans cette itération**. *(déduit de la lecture, non exécuté — je n'ai pas de Bash.)*

**OBJECTION 1** — le cadrage dit « aucun changement de rendu attendu » (vrai) et ne relève **qu'une** prose à renverser (faux). `ConstatControle.path` est documenté « une clé de `DESTINATION_DES_CHAMPS` » et `controles.test.ts:287-309` l'épingle. **Trois des dix sites d'avertissement n'en sont pas des clés** : `canon.mj`, `canon.partage`, `monde.personnages[].savoirs[].revele_si` (seules ses six feuilles y figurent). Il y a deux proses à réécrire, et la seconde a un test.

**OBJECTION 2** — `DossierIssue.path` est un chemin d'**instance** (`savoirs[2]`), `Controle.path` un chemin de **table** (`savoirs[]`). Deux grammaires, écrites nulle part. Sans normalisation explicite, aucune table de mappage n'est consultable.

**PROPOSITION** — import de `validateDossier` ; **une** entrée de registre ; une table **déclarée** de dix lignes indexée par chemin de table ; `message`/`location` **repris** de l'avertissement, `niveau`/`section`/`path`/`remediation` **déclarés**. Totalité gardée par balayage de `BUDGETS_DE_MOTS` + `FAMILLES_DE_CONDITIONS[alerteSansExpr]`, plus le compte de `warnings.push(` de `validate.ts` épinglé à 4.

**VERDICT** — **recevable sous réserve**. Un lot, marqué `contrat`, trois fichiers, **zéro code de feature**.

---

# ANNEXE

## 1. Découpage en lots — **UN SEUL LOT**

Le plafond est 4 ; l'itération en demande 1. Aucun parallélisme à révéler : exécution séquentielle, **sans worktree ni fusion**. Précédent direct : it3 (« 1 lot unique marqué contrat »).

### L1 — `avertissements-au-rapport` — **marqué `contrat`** (touche `src/brain/`), s'exécute seul, en premier

| Fichier | N/R | Motif |
|---|---|---|
| `C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.ts` | **R** | l'entrée de registre, la table déclarée, la normalisation de chemin, **les deux JSDoc renversées** |
| `C:\Users\pierr\Desktop\genliv\src\brain\dossier\controles.test.ts` | **R** | le test-grep l.336-342 s'inverse, le test l.287-309 s'élargit, `TEMOINS`/`NEUVES` gagnent une clé, les sondes neuves |
| `C:\Users\pierr\Desktop\genliv\src\features\dossier-controles\tests\panneauControles.test.tsx` | **R** | la preuve **verticale** par clone muté d'un seul champ (sinon la tranche est horizontale) |
| `C:\Users\pierr\Desktop\genliv\src\brain\dossier\issues.ts` | **R, commentaire seul** | la phrase l.76 (voir § 3) — zéro ligne exécutable |

**Conditionnels, et sans conflit possible puisqu'il n'existe qu'un lot** :
- `C:\Users\pierr\Desktop\genliv\src\features\bascule-editeur\tests\dossierEditorScreen.test.tsx` (R) — **seulement si** un compte de badge y rougit. Il ne devrait pas : l'orchestrateur a mesuré zéro avertissement sur les deux fixtures et sur un dossier neuf. À constater, pas à supposer.
- `C:\Users\pierr\Desktop\genliv\src\features\bascule-editeur\components\DossierEditorScreen.tsx` (R, **commentaire seul**) — **seulement si** la mesure contredit sa prose l.97-101. À éviter : par défaut, la mesure va dans la revue d'itération.

**Fichiers explicitement NON touchés** (et c'est le contrat du lot) : `validate.ts`, `tables.ts`, `destinations.ts`, `types.ts`, `sections.ts`, `brain/index.ts`, `pastilles.ts`, `ListeControles.tsx`, `PanneauControles.tsx`, `SectionNav`. **Aucun code de production de feature n'est écrit dans cette itération.** Le baril ne bouge pas : `controlerDossier`, `Controle`, `RapportControles` sortent déjà.

**Vérification due avant d'écrire** : `validate.ts` n'importe pas `controles.ts` (sinon cycle). Déduit — rien dans ce que j'ai lu ne le suggère — mais à constater par `tsc`.

## 2. La question d'architecture, tranchée : **`controles.ts` IMPORTE `validateDossier`**

**Deux sources dans le panneau = veto tech-lead.** `RapportControles.parSection` est documenté « dérivé ICI ET NULLE PART AILLEURS », et `jouable` de même. Faire fusionner deux tableaux par `PanneauControles` obligerait la feature à **recalculer `parSection`** pour que les badges d'it2 voient les avertissements : c'est la duplication de la source de vérité du rapport, dans un fichier de feature, par-dessus une prose qui l'interdit. Ricochet supplémentaire : la ligne rendue deviendrait `Controle | DossierIssue`, `ListeControles` devrait brancher, et le trailing d'it4 (dérivé de `controle.section`) n'existerait pas sur la moitié des lignes. Le contrat `Controle[]` d'it4 se casse. **Rejeté.**

**KR-217 interdit de PRODUIRE par le canal `errors`/`warnings`, pas d'y LIRE.** Sa mesure fondatrice est explicite : « la règle goulot ferait rougir `suffisance.test.ts` **le jour de sa naissance si elle passait par warnings** » — c'est une interdiction d'**écrire** dans ce canal. Et le critère d'acceptation qu'il garde (« `validate.test.ts`, `couverture.test.ts`, `suffisance.test.ts`, `amorce.test.ts`, `roundtrip.test.ts` restent verts **sans modification de leurs assertions** ») est **satisfait par une lecture** : lire n'ajoute rien à `warnings`. Les deux invariants réels de KR-217 survivent intacts et restent testés : (a) `Controle` ne porte **jamais** `severity` (déjà balayé à `controles.test.ts:275-283`, `Record<ControleId, Dossier>` **total par compilation** → la règle neuve y est couverte d'office) ; (b) `controlerDossier` ne lit **jamais** `errors`, seulement `warnings` — sonde neuve : un dossier porteur d'`errors` ne produit aucun contrôle de la règle neuve.

**La JSDoc se réécrit dans le même lot** (précédent it3/it4). Deux phrases, pas une :

- `controles.ts` l.22-23 — « Le rapport ne passe donc jamais par le canal `errors`/`warnings`, et ce module n'importe pas le validateur : il n'a rien à y lire. » → devient : le rapport ne **produit** jamais par ce canal et ne lit **jamais** `errors` ; il **lit `warnings`**, parce que dix emplacements du schéma y sont signalés et que l'auteur ne les voyait qu'à l'import.
- `controles.ts` l.80-81 — « Chemin JSON stable du champ fautif — **une clé de `DESTINATION_DES_CHAMPS`** » → devient : une clé de `DESTINATION_DES_CHAMPS`, **ou un chemin de bloc dont au moins une feuille en est une** (`canon.mj`, `canon.partage`, `…savoirs[].revele_si`). Le test l.287-309 change de prédicat en conséquence.

### Signature exacte exposée / consommée

```ts
// AJOUTS D'IMPORT
import type { DossierIssue, DossierIssueCode } from './issues'
import { validateDossier } from './validate'

/**
 * UN SITE d'avertissement du validateur, et ce que le linter en fait. `code` est
 * DÉCLARÉ et non lu : c'est lui que la sonde compare à ce que produit vraiment
 * `validateDossier`, sinon la table dériverait sans bruit.
 */
interface SiteAvertissement {
	code: DossierIssueCode
	/** Jamais `bloquant` : un avertissement ne rend aucune aventure injouable (KR-225). */
	niveau: Exclude<NiveauControle, 'bloquant'>
	/** La section DÉCLARÉE par la règle de mappage — jamais dérivée (KR-219). */
	section: SectionId
	remediation: string
}

/** DIX SITES, QUATRE SECTIONS. Clé = chemin de TABLE (indices effacés). PRIVÉE. */
const SITES_AVERTISSEMENT: Record<string, SiteAvertissement> = { /* 10 lignes, § 3 */ }

/** `monde.personnages[2].savoirs[0].revele_si` → `monde.personnages[].savoirs[].revele_si`. */
function cheminDeTable(path: string): string {
	return path.replace(/\[\d+\]/g, '[]')
}

/** Un avertissement hors table ne produit AUCUN constat — et la garde est un test, pas une levée. */
function constatDAvertissement(avertissement: DossierIssue): ConstatControle[]
```

Entrée de registre, à déclarer **en dernier** dans `CONTROLES` (l'ordre des clés est l'ordre de rendu ; l'amorce reste en tête, et `controles.test.ts:172` l'épingle) :

```ts
'avertissement-de-validation': {
	libelle: 'Avertissement du validateur',
	niveaux: ['alerte', 'info'],
	controler: (dossier) => validateDossier(dossier).warnings.flatMap(constatDAvertissement),
	remediation: (constat) =>
		estCleDe(SITES_AVERTISSEMENT, constat.path) ? SITES_AVERTISSEMENT[constat.path].remediation : '',
}
```

**Répartition des champs, et c'est l'arbitrage central** : `message` et `location` sont **repris tels quels** de l'avertissement (`DossierIssue.message` est par contrat « toujours une phrase française rédigée », déjà interpolée avec les comptes réels — « Le canon compte 812 mots ; le budget conseillé est de 600 ») ; les recopier serait une seconde vérité qui dérive. `niveau`, `section`, `path`, `remediation` sont **déclarés** par la table. **`remediation` n'est PAS `dossierIssueRemediation`** : ce registre-là écrit « ↪ Resserrez… », quand les cinq règles existantes écrivent un verbe nu à l'impératif (`controles.test.ts:676` épingle `startsWith('Rédigez')`). Deux registres de langue sur une même liste est du ressort de l'UX, mais la conséquence d'architecture est ici : la remédiation est écrite site par site dans la table, et le `Controle` n'a **pas** à porter le `code`.

## 3. D'où vient la `section` — le point dur

**Les deux phrases sont réconciliables ; c'est `issues.ts` qui s'amende, et KR-219 qui se précise.**

- **KR-219 vise une DÉRIVATION**, et son motif le dit : un résolveur devrait « découper une chaîne d'affichage sur un point médian » (`SectionDescripteur.cle`). C'est un **calcul** depuis `SECTIONS`. Une table **écrite à la main, ligne par ligne, par la règle qui produit le `Controle`** n'est pas un calcul.
- **La piste `PROSES_AMORCE` est bonne, et je la retiens** — sous une condition. `PROSES_AMORCE` est **déjà** une table `path → SectionId` dans ce fichier même, bénie depuis it1, et les cinq entrées de `CONTROLES` écrivent toutes `section:` en dur à côté d'un `path:`. « Une table path → SectionId est une seconde vérité » est donc, en l'état, **déjà faux du dépôt**. Ce qui est vrai, et qu'il faut garder de KR-219, c'est le **discriminant** : la table est-elle **écrite** site par site et **totale par une garde mécanique**, ou **calculée** ? `PROSES_AMORCE` est totale par compilation (`Record<keyof typeof AMORCE, …>`). `SITES_AVERTISSEMENT` ne peut pas l'être (clés `string`) → **sa totalité doit être tenue par un test de balayage**, sinon la crainte de KR-219 devient exacte et la table dérive en silence.
- **Différence réelle avec `PROSES_AMORCE`, à ne pas cacher** : celle-ci n'est jamais *consultée* par une clé venue d'ailleurs (la règle itère ses propres lignes) ; `SITES_AVERTISSEMENT` est consultée par le `path` d'un avertissement **produit par un autre module**. Un raté est **silencieux** (le `flatMap` rend `[]`) — silence de classe KR-222. D'où les trois gardes du § 5.

**Les dix lignes** (sections conformes au relevé du cadrage § 7 ; ✓/✗ = clé de `DESTINATION_DES_CHAMPS` ou non, relevé par lecture de `destinations.ts`) :

| # | chemin de table (clé) | code déclaré | section | clé `DESTINATION_DES_CHAMPS` |
|---|---|---|---|---|
| 1 | `canon.mj` | `texte-trop-long` | `canon` | ✗ (feuilles seules) |
| 2 | `canon.partage` | `texte-trop-long` | `canon` | ✗ (feuilles seules) |
| 3 | `charpente.jalons[].enonce_texte` | `texte-trop-long` | `jalons-fins` | ✓ |
| 4 | `monde.conditions.climat[].manifestation` | `texte-trop-long` | `conditions` | ✓ |
| 5 | `canon.objectifs[].reussi_si_texte` | `condition-sans-expr` | `canon` | ✓ |
| 6 | `canon.objectifs[].echoue_si_texte` | `condition-sans-expr` | `canon` | ✓ |
| 7 | `charpente.fins[].condition_texte` | `condition-sans-expr` | `jalons-fins` | ✓ |
| 8 | `monde.personnages[].contre_mesures[].declencheur_texte` | `condition-sans-expr` | `personnages` | ✓ |
| 9 | `monde.personnages[].savoirs[].revele_si` | `revelation-sans-porte` | `personnages` | ✗ (six feuilles seules) |
| 10 | `monde.personnages[].plan_actions[].si_bloque` | `condition-sans-expr` | `personnages` | ✓ |

**Les amendements de prose, à livrer dans L1 :**

- `issues.ts:76` — « Chemin JSON stable — le contrat que n° 7 consomme **pour badger une section** » → « Chemin JSON stable, **indices compris** — la clé par laquelle n° 7 retrouve la ligne **déclarée** de sa table de mappage. Il désigne un **champ**, jamais une section : la section d'un contrôle est déclarée par la règle qui le produit (KR-219). »
- **KR-219** (dans `specification.json` `known_risks` **et** `code-knowledge.json`) — ajouter la précision de portée : « *dérivée* vise un **calcul** (découpage, préfixe, `SECTIONS[].cle`) ; une table **déclarée ligne à ligne** par la règle productrice et **totale par balayage de registre** n'en est pas un — `PROSES_AMORCE` en est le précédent dans le même fichier. »

## 4. Une entrée de registre, ou plusieurs ? — **UNE**

`ControleDescripteur.controler(dossier)` est la seule forme disponible : **N entrées = N appels de `validateDossier` par rapport**, donc **2 N par rendu d'écran**. Quatre entrées coûteraient huit validations complètes par rendu. C'est dirimant à soi seul.

Et KR-164 n'y fait pas obstacle, sur un motif qui tient sans l'argument de coût : **la cause EST déjà codée**, par `DossierIssueCode`, dans `issues.ts`. Fabriquer quatre `ControleId` qui miroitent quatre `DossierIssueCode` serait exactement le second codage des mêmes causes que KR-219 redoute. Ce que l'auteur lit — message + remédiation — reste **par site**, donc un geste par cause, ce que KR-164 protège vraiment. `ControleId` n'est jamais rendu (`libelle` : « pour un rapport de développeur. Aucune surface ne le rend »).

Bénéfice secondaire réel : `TEMOINS` et `NEUVES` (`Record<ControleId, Dossier>`, **totaux par compilation**) gagnent **une** clé et **un** témoin, pas quatre.

## 5. Les gardes — ce que le lot doit écrire

1. **Totalité par balayage** (KR-199) : pour chaque `BUDGETS_DE_MOTS[].path` et chaque `FAMILLES_DE_CONDITIONS[].texte` dont `alerteSansExpr` est vrai, `estCleDe(SITES_AVERTISSEMENT, …)`. Un cinquième budget ou une cinquième famille alertante rougit **à la porte de commit**, sans que personne ait à y penser.
2. **Les deux sites hors registre** (`…savoirs[].revele_si`, `…plan_actions[].si_bloque` sont écrits à la main dans `validate.ts`, aucune table ne les porte) : un **témoin nommé chacun**, par mutation d'un seul champ, rouge puis calme dans le même test.
3. **Le résidu, et il faut le nommer** : un site d'avertissement neuf écrit demain à la main dans `validate.ts`, hors des deux registres, serait **abandonné en silence**. Garde proposée, sans toucher `validate.ts` — même famille que les tests-grep déjà présents dans ce fichier (`SOURCE_CONTROLES`, le balayage des porteurs de `reveler_indice`) et que `expect(CHEMINS_DE_DELTAS).toHaveLength(4)` : épingler à **4** le nombre d'occurrences de `warnings.push(` dans la source de `validate.ts`. Un cinquième site rougit et renvoie son auteur ici.
4. **`jouable` ne bouge jamais** : `niveaux` de l'entrée exclut `bloquant` **par le type** (`Exclude<NiveauControle, 'bloquant'>` sur la table), et une sonde vérifie qu'aucun constat mappé n'est bloquant.
5. **Non-régression du calme — le critère le plus important** : sur les **deux fixtures** et sur un **dossier neuf**, le rapport est **identique, ligne pour ligne**, à celui d'avant l'import. C'est la seule preuve que l'import ne change rien là où rien ne doit changer. Elle tombe juste puisque la mesure de l'orchestrateur donne zéro avertissement partout.
6. **Le témoin de `NEUVES` doit être choisi, pas tiré au sort** : ce test asserte `constat.path.split('.')[0] !== constat.section` pour **tous** les constats du témoin. Les lignes 1, 2, 5, 6 (`canon.*` → `canon`) **échouent** ce prédicat. Le témoin de la règle neuve doit donc être `revele_si: {}` sur `dossier-minimal` (`monde` ≠ `personnages`) ou une fin sans jumeau (`charpente` ≠ `jalons-fins`). **Si l'ouvrier prend un budget du canon, il livre un test rouge et croira que c'est la table qui est fausse.** Cette phrase doit passer telle quelle dans le plan.
7. **Mesure de coût** : relever le temps de `controlerDossier` sur `dossier-reference.json` avant/après, et l'écrire dans la revue. Pas de cache, pas de `useMemo` (KR-013/113) : **on mesure, on ne parade pas**.

## 6. Le coût de la mesure du § 4 — ce qu'il change

Il **ne change pas le découpage** (un lot de toute façon). Il change **trois choses aux tests** :

- **Aucun critère ne peut être formulé sur une fixture « telle quelle »** : chaque preuve d'allumage nomme sa mutation d'un seul champ. Le patron existe déjà (rouge → calme dans le même test) et `panneauControles.test.tsx` sait déjà écrire un dossier muté derrière le service (`brain.persistence.set(dossierKey(…), …)`).
- **La preuve verticale la moins chère et la plus sûre est `texte-trop-long` sur `canon.mj`** : une seule affectation, aucun risque de fabriquer une `error` (précédent exact : `read.test.ts:62`, `'mot '.repeat(601)`). Les mutations qui touchent des références (`savoirs`, `indices`) peuvent, elles, produire des `errors` et faire refuser le dossier par `DossierService.get()` (KR-225) — piège à écrire dans le plan.
- **Le § 5 ci-dessus (non-régression du calme) devient le critère jumeau obligatoire** : une itération qui n'allume que ne prouve rien ; une itération qui n'allume et ne se tait pas dans la même suite non plus.

## 7. REJETS nommés — **à recopier au registre des désaccords § 8 du plan** (BUG-082)

| # | Rejeté | Motif, en une phrase |
|---|---|---|
| R1 | **Deux sources dans `PanneauControles`** (`controlerDossier` + `validateDossier().warnings` fusionnés côté feature) | Oblige la feature à recalculer `parSection` pour que les badges d'it2 voient les avertissements — duplication de la source de vérité du rapport, et le type de ligne d'it4 passe de `Controle[]` à une union que `ListeControles` devrait brancher. |
| R2 | **Un résolveur générique `path → SectionId`** par découpage ou préfixe sur `SECTIONS[].cle` | C'est la dérivation que KR-219 interdit mot pour mot, et le veto tech-lead d'it4 (« jamais dériver une destination depuis un texte d'affichage ») la couvre déjà. |
| R3 | **Quatre entrées `CONTROLES`, une par `DossierIssueCode`** | Quatre appels de `validateDossier` par rapport, donc huit par rendu d'écran, pour un second codage de causes déjà codées par `DossierIssueCode`. |
| R4 | **Élargir `ControleDescripteur.controler(dossier, contexte)`** pour partager une validation entre entrées | Abstraction à un seul appelant qui touche les cinq entrées existantes, et sans objet dès lors qu'il n'y a qu'une entrée neuve. |
| R5 | **Rendre `ConstatControle.section` optionnelle** pour les avertissements non mappés | État illégal représentable (une ligne dont la flèche d'it4 ne pointe nulle part), classe BUG-082, avec ricochet sur `parSection` et `SectionNav`. |
| R6 | **Mémoïser ou mettre en cache le rapport** pour absorber le coût de l'import | KR-013/113 : l'état dérivé se calcule en ligne, et le dépôt a déjà écrit que c'est la **mesure** qui décidera d'un cache, pas la crainte. |
| R7 | **Réécrire les dix messages français** dans `SITES_AVERTISSEMENT` | `DossierIssue.message` est déjà une phrase rédigée et interpolée avec les comptes réels ; une copie serait une seconde vérité qui dérive au premier reformulage du validateur. |
| R8 | **Réutiliser `dossierIssueRemediation`** comme ligne QUOI FAIRE | Son registre de langue (« ↪ Resserrez… ») n'est pas celui des cinq règles existantes (verbe nu à l'impératif, épinglé par `controles.test.ts:676`), et le réutiliser obligerait `Controle` à porter le `code`. |
| R9 | **Ouvrir un lot sur `validate.ts` pour y exporter un lecteur d'avertissements plus étroit** | Le cadrage l'exclut, et le gain (éviter un clone JSON) ne se démontre pas avant la mesure — s'il se démontre, c'est une itération nommée, pas un effet de bord de celle-ci. |

**Dette d'it4 (nom de test plus large que ses assertions)** — *retenue sous condition*, pas rejetée : si ce test vit dans l'un des trois fichiers que L1 ouvre déjà, il se corrige ici (laisser sciemment un nom faux dans un fichier qu'on rouvre est pire) ; s'il vit ailleurs, il reste reporté — je ne réclame pas un fichier de plus pour un renommage. La correction est **un nom ou une assertion élargie, rien d'autre** : aucun changement de couverture dans le même diff.