# Tour 1 — Tech Lead · `dossier-format` it4

**RISQUE** — `DELTAS` est le premier contrat `brain/` de cette feature écrit **sans lecteur dans l'itération** : le moteur qui applique un delta arrive en n° 9. Et la règle d'admission d'it3 (« un prédicat n'entre que si un champ NOMMÉ de la session y répond ») **ne se transpose pas** : un delta ÉCRIT ce champ, et les champs qu'il écrirait — `jalons_atteints`, `indices_connus`, `evenements_consommes` — n'existent nulle part dans `sessionEngine.ts`. Appliquée littéralement elle vide le registre ; ignorée, elle le fait **concevoir** au lieu de relever. Entre les deux se glisse le vrai défaut : `PREDICATES.jalon_atteint` devient un prédicat lisible **que rien ne peut rendre vrai** — une condition morte inscrite au contrat que quinze features consomment.

**OBJECTION 1** — L'arrêt du balayage de couverture pour les deltas n'est pas tranché, et c'est la seule chose ici qu'on ne rattrape pas. La fixture porte `[{}]` : le walker ne descend nulle part. Dès qu'elle porte `{op, cibles}`, `couverture.test.ts` exigera une ligne de destination **par clé de delta** — impossible à rendre exhaustive, exactement le motif qui a fait dériver `CHEMINS_D_ARRET` de `FAMILLES_DE_CONDITIONS` en it3.

**OBJECTION 2** — Le `brain_contract` de la spec annonce « DELTAS (label, cible, refKinds) ». `cible` **est** le `lit: CheminDeSession[]` retiré en it3 par son propre auteur : table sans lecteur avant n° 9. La spec **précède** ce refus ; elle doit être corrigée, pas suivie.

**PROPOSITION** — (1) règle d'admission écrite AVANT le code : un delta n'entre que s'il écrit un champ que le runtime mute déjà **OU** qu'un prédicat de `PREDICATES` lit — plafond **8** entrées, fermeture lecture/écriture prouvée par test ; (2) `CHEMINS_D_ARRET` gagne un second terme dérivé de `CHEMINS_DE_DELTAS`, contrepartie obligatoire : `validateDelta` refuse toute clé inconnue ; (3) schéma 1 = deltas de **RÉFÉRENCE seuls**, `Delta = { op, cibles }`, opérande entier reporté n° 9 (retour additif, un champ au descripteur, jamais un `switch`) ; (4) `validate.ts` ≤ 650 l., **coupe de secours nommée d'avance**.

**VERDICT** — recevable sous réserve (les quatre points de PROPOSITION dans le plan, pas dans la tête de l'ouvrier). **Aucun veto** : rien ici ne traverse une feature ni ne duplique la source de vérité.

---

## ANNEXE

### (a) Signatures exactes proposées

**`src/brain/dossier/deltas.ts` (N)** — jumeau de `predicates.ts` **+ le lecteur, dans le même fichier** (le lecteur a un seul appelant ; `predicates.ts`/`expr.ts` sont séparés parce qu'`expr.ts` est récursif et porte son propre test).

```ts
export interface DeltaDescripteur {
	/** Libellé français — la valeur du Select des n° 3/6/7. Jamais une syntaxe. */
	label: string
	/** L'espace de noms attendu à CHAQUE position de `cibles`. L'ARITÉ est
	 *  `refKinds.length`, DÉRIVÉE, jamais stockée (KR-165). */
	refKinds: readonly EspaceDeNoms[]
}
const defineDeltas = <V>() => <K extends string>(map: Record<K, V>): Record<K, V> => map
export const DELTAS = defineDeltas<DeltaDescripteur>()({ /* ≤ 8, relevé */ })
export type DeltaId = keyof typeof DELTAS

/** Total, ne lève JAMAIS. `estCleDe(DELTAS, op)` — jamais `in`, jamais un `as` (KR-175).
 *  Refuse TOUTE clé inconnue sur le delta : contrepartie de l'arrêt du balayage. */
export function validateDelta(valeur: unknown, site: SiteDelta): DossierIssue[]
/** Total SUR UN DELTA DÉJÀ ACCEPTÉ par validateDelta — jumeau de collectRefs. */
export function collectDeltaRefs(valeur: unknown): RefCollectee[]
```

`SiteDelta` : structure identique à `SiteExpr`, **recopiée localement**, pas importée d'`expr.ts` (deux registres frères ne se dépendent pas ; extraction au troisième — doctrine `decrire`/`feuille` du module). Le champ écrit par chaque delta est en **JSDoc par entrée**, en prose, comme `PREDICATES` — jamais un champ `cible` typé (objection 2).

**`types.ts` (R)**

```ts
export interface Delta { op: DeltaId; cibles: string[] }   // `DeltaBrut` DISPARAÎT
```

Les quatre emplacements passent `DeltaBrut[]` → `Delta[]`. C'est le nom que la JSDoc d'it2 avait explicitement réservé.

**`tables.ts` (R)** — **une seule table neuve**, et son entrée dans le mécanisme de couverture est déclarée :

```ts
export interface ReferenceSimple { path: string; espace: EspaceDeNoms; location: string; sujet: string }
export const REFERENCES_SIMPLES: readonly ReferenceSimple[] = [
	{ path: 'charpente.depart.lieu_id',                                      espace: 'lieu',   … },
	{ path: 'monde.personnages[].savoirs[].indice_id',                       espace: 'indice', … },
	{ path: 'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id', espace: 'objet',  … },
	{ path: 'monde.personnages[].savoirs[].revele_si.apres_indice_id',       espace: 'indice', … },
]
```

`depart.lieu_id` **migre dedans** : le § 5a de `validate.ts` est une règle de référence **câblée en dur** depuis it1 (KR-117). Net ≈ 0 ligne, et le retrait de la ligne doit faire rougir le test d'it1 (discriminance).

**Pas de table pour BUG-050** : l'ensemble des listes à éléments-objets se **dérive** de `COLLECTIONS_IDENTIFIEES` ∪ `LISTES_REQUISES`, moins `CHEMINS_DE_DELTAS` (couverts par `delta-en-prose` depuis it2). Une collection ajoutée en n° 4/5/6 hérite alors du garde **sans ligne à écrire**. La disjonction est **assertée**, pas relue à l'œil.

**`issues.ts` (R)** — 16 → **19** codes : `delta-inconnu`, `delta-malforme`, `element-non-objet`. Motif : un code par **geste** (arbitrage QA d'it3). `expr-malformee` n'est pas réutilisée — sa consigne dit « opérateur, clé ou **imbrication** », fausse sur un delta plat. `arite-invalide` et `reference-pendante`/`identifiant-invalide` sont réutilisées telles quelles (un code par CAUSE).

**`couverture.test.ts` (R)** — `CHEMINS_D_ARRET` devient `[...FAMILLES_DE_CONDITIONS.map(f => f.expr), ...CHEMINS_DE_DELTAS.map(c => c.path)]`. Cinquième assertion : *aucun chemin de `CHEMINS_DE_DELTAS` n'appartient à la dérivation d'`element-non-objet`*.

### (b) Découpage en lots

**UN lot.** Ce n'est pas un regroupement de confort : deux lots nommeraient tous deux `validate.ts`, `tables.ts`, `destinations.ts`, `couverture.test.ts` et la fixture — et `couverture.test.ts` est **par construction** le garde qui relie tables + destinations + fixture, donc aucun demi-lot ne passe la porte qualité isolément. Confirmation du `RETOUR-COMITÉ` n° 2 d'it3, **mesurée à nouveau, pas recopiée**.

| Lot | Type | Ouvrier | Worktree |
|---|---|---|---|
| `contrat-dossier-it4` | **contrat** | `dev-contrat` | **non** — exécution séquentielle |

**Créés (N)** : `deltas.ts` · `deltas.test.ts` · `references.ts` — **conditionnel**, uniquement si `validate.ts` franchit 650 l. La coupe est nommée d'avance pour que l'ouvrier n'en invente pas une autre : elle emporte les **deux** boucles de résolution (`REFERENCES_SIMPLES` + les refs d'`_expr`), jamais un découpage arbitraire. Sans test propre : couvert par `validate.test.ts`.

**Modifiés (R)** : `types.ts` · `tables.ts` · `validate.ts` · `issues.ts` · `destinations.ts` · `couverture.test.ts` · `validate.test.ts` · `__fixtures__/dossier-minimal.json` · `src/brain/index.ts` (`DeltaBrut` sort, `Delta`/`DeltaId` entrent).

**Ouvrables sous KR-162** (classement `PORTÉ` ou `SUPPRIMÉ` obligatoire au journal, jamais un diff silencieux) : `roundtrip.test.ts`, `src/features/dossier-format/tests/importDossier.test.tsx` — la fixture qui gagne de vrais deltas et le garde d'éléments peuvent déplacer un compte d'anomalies, **exactement comme en it3**.

**Budget de lignes mesuré** : 602 − 25 (§ 5a supprimé) + 25 (boucle générique) + 20 (boucle deltas, corps dans `deltas.ts`) + 25 (garde d'éléments) ≈ **647 / 650**. Trois lignes de marge : c'est pour ça que la coupe de secours est nommée maintenant et pas découverte à la porte.

### (c) Ce que je refuse de faire entrer — et le coût du report

| Refusé | Motif | Coût du report |
|---|---|---|
| `relations`, `presences`, `acces`, `mene_a` | 0 occurrence dans `types.ts` ; décision A les donne à n° 4/5/6, les features qui les **éditent** | **nul.** Les inscrire = une forme sans éditeur **et** un rougissement mécanique de `couverture.test.ts` : une ligne de table sans instance en fixture échoue par construction |
| `monstre_ref` | résolu depuis it2, § 5b contre `BESTIARY` | **nul.** Le rouvrir créerait un **second site de résolution** : deux vérités sur la même référence |
| un champ `cible: CheminDeSession` au descripteur | table sans lecteur avant n° 9 — retiré en it3 par son propre auteur | n° 9 écrira son aiguillage, ce qu'elle ferait de toute façon |
| `applyDelta` / tout évaluateur | « un delta est APPLIQUÉ par le moteur, jamais injecté » ; l'évaluation part en n° 9 comme champ du descripteur | **nul** en Temps 1 |
| opérande entier (`gagner_xp`, `soigner`) | symétrie avec `PREDICATES` schéma 1 (slots de RÉFÉRENCE seuls) ; retour **additif** annoncé | un dossier ne récompense pas encore en XP ; la n° 6 rouvrira un lot `contrat`, la décision A le prévoit |
| tout élargissement de `sitesDe` | grammaire **FIGÉE**. La validation à l'intérieur d'un delta se fait par un **lecteur dédié**, `validateDelta`, comme `validateExpr` | nul ; c'est le report qui coûte cher, pas le refus |
| une 5ᵉ table de chemins pour BUG-050 | dérivable de deux tables existantes | nul, et gain : les collections de n° 4/5/6 héritent du garde |
