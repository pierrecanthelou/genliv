# Tour 1 — Tech Lead · `dossier-format` it3

**RISQUE** — it3 est la première itération où le schéma devient **RÉCURSIF**, alors que son unique garde (le balayage de couverture) ne visite que des FEUILLES et que `sitesDe` ne sait pas exprimer un arbre. Mode de défaillance nommé : l'ouvrier élargit `sitesDe` pour descendre dans l'`…_expr` et écrit un moteur de requête JSON maison — `parseExpr` refusé par la porte, réintroduit par la fenêtre (KR-168). Risque second, mesuré : `validate.ts` (723 l.) + la section expr sans extraction = ~800 l., bloqueur de fusion (KR-112).

**OBJECTION 1** — la **SIXIÈME famille n'a pas d'hôte**. `contre_mesures` n'existe nulle part dans le dépôt ; la livrer, c'est créer une quatorzième racine qu'aucune feature n'édite — la « forme sans producteur ni consommateur » que la décision A interdit nommément, et que quatre features devraient migrer.

**OBJECTION 2** — les destinations des six `…_texte` ne sont pas dérivables par un ouvrier. D1 les déclare « injectées telles quelles » ; la décision B (veto `narratif-ia`) a classé `declencheur_texte` et `condition_texte` en `auteur`, JAMAIS injectés. `destinations.ts` exige une ligne par champ et son test « aucune ligne morte » la rend obligatoire : **six arbitrages à écrire au plan, pas au code**.

**PROPOSITION** — (1) **cinq familles, pas six** : la sixième coûtera UNE ligne de `FAMILLES_DE_CONDITIONS` en n° 6. (2) `sitesDe` **LOCALISE** le champ, `expr.ts` **DESCEND** — zéro segment neuf dans la grammaire. (3) `PROFONDEUR_MAX_EXPR = 8`, testée à 8 et 9 (KR-165) : sans borne, un fichier écrit à la main fait sauter la pile d'un validateur qui se promet total. (4) `tables.ts` extrait → `validate.ts` ≤ 650 lignes, mesuré à la porte. (5) 4ᵉ assertion **par PRÉFIXE normalisé**, pas par égalité : 8 des ~30 chemins de tables sont des conteneurs, pas des feuilles. (6) toute entrée de `PREDICATES` a ≥ 1 instance dans la fixture, sinon elle sort.

**VERDICT** — recevable sous réserve (objections 1 et 2 fermées au plan).

---

## ANNEXE

### (a) Signatures exactes proposées

**`src/brain/dossier/predicates.ts` (N)**
```ts
import type { EspaceDeNoms } from './identifiers'

export interface PredicatDescripteur {
	/** Libellé français — ce que le Select des n° 3/6/7 affichera. Jamais une syntaxe. */
	label: string
	/** L'espace de noms attendu à CHAQUE position. L'ARITÉ est `refKinds.length`,
	 *  DÉRIVÉE et jamais stockée : deux champs pour un seul nombre, c'est la dérive
	 *  que `CONFIANCES` a déjà refusée (KR-165). Point d'extension nommé — un
	 *  prédicat à opérande littéral gagnera un champ au DESCRIPTEUR, jamais un
	 *  `switch` (KR-117). */
	refKinds: readonly EspaceDeNoms[]
}

// Factory d'identité LOCALE, jumelle de `defineEspaces` (identifiers.ts) — recopiée
// et non extraite : deux appelants, trois lignes. Extraction au troisième.
export const PREDICATES = definePredicats<PredicatDescripteur>()({
	possede_objet:    { label: "possède l'objet",        refKinds: ['objet'] },
	indice_connu:     { label: "connaît l'indice",       refKinds: ['indice'] },
	jalon_atteint:    { label: 'le jalon est atteint',   refKinds: ['jalon'] },
	quete_achevee:    { label: 'la quête est achevée',   refKinds: ['quete'] },
	objectif_atteint: { label: "l'objectif est atteint", refKinds: ['objectif'] },
	lieu_visite:      { label: 'le lieu a été visité',   refKinds: ['lieu'] },
	evenement_resolu: { label: "l'événement est résolu", refKinds: ['evenement'] },
})
export type PredicatId = keyof typeof PREDICATES
```
> Le **contenu** de la liste est du ressort de `narratif-ia` (c'est un relevé, comme DELTAS). Ce que je tiens : clés `snake_case`, `refKinds` pointe uniquement des espaces qui ont une collection dans `COLLECTIONS_IDENTIFIEES`, et **7 entrées maximum en schéma 1**, chacune instanciée dans la fixture.

**`src/brain/dossier/expr.ts` (N)**
```ts
/** Borne de récursion — un fichier écrit à la main ne fait pas sauter la pile.
 *  Testée à 8 (calme) et 9 (bloquant), KR-165. */
export const PROFONDEUR_MAX_EXPR = 8

export type ExprNode =
	| { op: 'et' | 'ou'; args: ExprNode[] }              // ≥ 2 args
	| { op: 'non'; arg: ExprNode }
	| { op: 'pred'; pred: PredicatId; refs: string[] }   // refs.length === refKinds.length

/** FORME seule — frontière de confiance (comme `isNodeKind`, KR-116). Totale sur
 *  `unknown`, ne lève jamais, ne RÉSOUT aucune référence : seule `validate.ts`
 *  connaît `collectIds`. */
export function validateExpr(valeur: unknown, site: { path: string; location: string }): DossierIssue[]

export interface RefCollectee { id: string; espace: EspaceDeNoms }

/** Relevé plat des références d'un arbre BIEN FORMÉ. Totale : `[]` sur du bruit. */
export function collectRefs(valeur: unknown): RefCollectee[]
```
> Les **quatre opérateurs sont une union de types**, exhaustivement vérifiée par le compilateur — **pas** un registre. KR-117 porte sur les identifiants de prédicat.
> `collectRefs` ne s'exécute **que si `validateExpr` n'a rien produit** : deux anomalies pour une cause, c'est du bruit.

**`src/brain/dossier/tables.ts` (N)** — les 6 tables existantes déplacées **verbatim** depuis `validate.ts` (+ `RacineObligatoire`, `ChampRequis`, `EnumereFerme`, `BudgetDeMots`), plus :
```ts
export interface FamilleDeCondition {
	/** Chemin du `…_expr` — segments pointés et `[]`, la grammaire FIGÉE de `sitesDe`. */
	expr: string
	texte: string
	location: string
	/** D1 : un `…_texte` sans `…_expr` AVERTIT — sur une fin et un objectif seulement. */
	alerteSansExpr: boolean
}
export const FAMILLES_DE_CONDITIONS: readonly FamilleDeCondition[] = [
	{ expr: 'canon.objectifs[].reussi_si_expr',  texte: 'canon.objectifs[].reussi_si_texte',  location: 'Objectifs',   alerteSansExpr: true  },
	{ expr: 'canon.objectifs[].echoue_si_expr',  texte: 'canon.objectifs[].echoue_si_texte',  location: 'Objectifs',   alerteSansExpr: true  },
	{ expr: 'charpente.fins[].condition_expr',   texte: 'charpente.fins[].condition_texte',   location: 'Fins',        alerteSansExpr: true  },
	{ expr: 'charpente.jalons[].declencheur_expr', texte: 'charpente.jalons[].declencheur_texte', location: 'Jalons',  alerteSansExpr: false },
	{ expr: 'monde.evenements[].declencheur_expr', texte: 'monde.evenements[].declencheur_texte', location: 'Événements', alerteSansExpr: false },
	{ expr: 'monde.personnages[].plan_actions[].declencheur_expr', texte: '…declencheur_texte', location: 'Personnages', alerteSansExpr: false },
]
// contre_mesures[] : SIXIÈME famille, absente du schéma 1 — une ligne à ajouter ici
// quand la n° 6 livrera sa racine.
```
> `sitesDe` **reste dans `validate.ts`** : c'est le LECTEUR, pas la table. Ordre des modules (acyclique) : `identifiers` → `issues` → `predicates` → `expr` → `types` → `tables` → `validate`.

**Champs neufs de `types.ts` (R)**
```ts
export interface Objectif extends Entite {
	reussi_si_texte: string       // REQUIS
	reussi_si_expr?: ExprNode
	echoue_si_texte?: string      // la PAIRE est optionnelle
	echoue_si_expr?: ExprNode
}
Canon.objectifs: Objectif[]                                  // était Entite[]
Fin        + condition_expr?: ExprNode
Jalon      + declencheur_expr?: ExprNode
Evenement  + declencheur_texte?: string  + declencheur_expr?: ExprNode
PlanAction + declencheur_texte?: string  + declencheur_expr?: ExprNode
```
**Règle symétrique proposée** : `…_expr` présent **sans** son `…_texte` = **bloquant**. Une règle que le moteur applique et dont l'IA n'a aucune phrase est une mécanique invisible du narrateur ; c'est la moitié manquante de l'alerte D1, et elle est gratuite.

**`issues.ts` (R)** — union 12 → **15** : `expr-malformee`, `predicat-inconnu`, `condition-sans-expr` (`warning`). **Aucun code neuf pour la référence pendante** : on réutilise `reference-pendante`, `path` = le chemin du champ `…_expr` porteur.

### (b) Découpage en lots

**UN lot. Sans worktree, sans essaim, sans fusion.** Tout est dans `brain/`, donc tout est `contrat` ; deux lots ici nommeraient forcément `types.ts`, `validate.ts` ou `index.ts` deux fois, ou sépareraient les tests de leur code — le pire découpage possible.

| Fichier | N/R | Rôle |
|---|---|---|
| `src/brain/dossier/expr.ts` | **N** | `ExprNode`, `validateExpr`, `collectRefs`, la borne |
| `src/brain/dossier/predicates.ts` | **N** | registre fermé |
| `src/brain/dossier/tables.ts` | **N** | 6 tables déplacées + `FAMILLES_DE_CONDITIONS` |
| `src/brain/dossier/expr.test.ts` | **N** | forme, arité, profondeur 8/9, prédicat inconnu, refs |
| `src/brain/dossier/types.ts` | **R** | les champs neufs + `Objectif` |
| `src/brain/dossier/validate.ts` | **R** | tables sorties, section « conditions », ≤ 650 l. |
| `src/brain/dossier/issues.ts` | **R** | 3 codes + 3 QUOI FAIRE |
| `src/brain/dossier/destinations.ts` | **R** | ~10 lignes, arbitrées **au plan** |
| `src/brain/dossier/couverture.test.ts` | **R** | 4ᵉ assertion + ce que le balayage NE couvre PAS |
| `src/brain/dossier/validate.test.ts` | **R** | intégrité référentielle, alerte D1, symétrie |
| `src/brain/dossier/roundtrip.test.ts` | **R** | un arbre `…_expr` à 3 niveaux traverse import→export intact |
| `src/brain/dossier/__fixtures__/dossier-minimal.json` | **R** | +~10 feuilles, 1 instance par prédicat, 0 avertissement |
| `src/brain/index.ts` | **R** | **types seuls** : `ExprNode`, `Objectif` |

**Hors lot** : `identifiers.ts`, `freeze.ts`, `read.ts`, `DossierService.ts`, `src/features/**`, `src/player/**`.

**Deux phases DANS le lot** (des phases, pas des lots) : **A** — `tables.ts` extrait + 4ᵉ assertion, porte verte, zéro changement de comportement ; **B** — expr, schéma, intégrité.

**Pièges à écrire au plan** : (i) la fixture doit porter `reussi_si_expr` **et** `condition_expr`, sinon l'alerte D1 fait rougir `couverture` ; (ii) la 4ᵉ assertion se teste par **préfixe normalisé** ; (iii) le test « aucune ligne morte dans `DESTINATION_DES_CHAMPS` » force la fixture à instancier toutes les familles.

### (c) Ce que je refuse de faire entrer

1. **`contre_mesures[]`** — racine non arbitrée, sans feature éditrice. Coût du report : **une ligne**.
2. **Le champ `lieux[].acces`** — n° 5 l'édite. Mais je **tranche la question** (§ 9a) à coût nul : **arête ORIENTÉE, une entrée = un sens, un passage réciproque = deux entrées.** Motif : une bidirectionnalité implicite oblige tout lecteur (linter n° 7, canevas n° 2, moteur n° 9) à matérialiser l'arête inverse à chaque lecture — état dérivé recalculé en trois endroits (KR-013) — ou à la dédoubler par script, ce qui écrit une **seconde source de vérité dans le document**.
3. **Tout élargissement de `sitesDe`** et tout `parseExpr` sous quelque nom que ce soit.
4. **`evaluate(state, expr)`** — déjà rejeté, n° 9, comme **champ du descripteur**.
5. **L'extension du balayage aux CONTENEURS.** Je choisis de **nommer ce qui n'est pas couvert**. Défaut réel constaté en lisant le code : un **élément de liste non-objet traverse le validateur en silence** (`validate.ts` § 8 `if (!estObjet(savoir)) continue`, et `sitesDe` `if (!estObjet(site.valeur)) continue`), si bien que `savoirs: ["du texte"]` sort **`ok: true`**. Même famille que BUG-049. À porter en **it4** avec une table dédiée (KR-173).
6. **L'export de `PREDICATES` / `validateExpr` / `collectRefs` depuis `brain/index.ts`** — aucun consommateur hors `brain/dossier/` avant les n° 3/6/7. Les **types** sortent, les **valeurs** restent.
7. **Un registre d'opérateurs** (4 entrées, zéro donnée) — mon propre biais, désamorcé d'avance.
8. **L'affordance de téléchargement** (§ 9b) : hors it3, à trancher par le PM pour it5.
