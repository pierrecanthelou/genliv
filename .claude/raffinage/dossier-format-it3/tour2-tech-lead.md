# Tour 2 — Tech Lead · `dossier-format` it3

**RÉPONSE À L'UX (C1, C3)** — « sans `contre_mesures`, KR-164 est inhonorable » : non. KR-164 exige qu'une entité **présente** soit nommable ; une racine absente ne produit aucune anomalie à nommer. Ce qui déshonorerait KR-164, c'est une racine livrée **sans** sa ligne d'`ESPACES_DE_NOMS` — et c'est la porte que la n° 4 devra passer. Coût du report, mesuré : quatre lignes. Sur **C3 tu as raison et je concède les deux noms** : `cibles` et `enfants`, pas `refs`/`args`. Motif que j'ajoute au tien : le `path` d'anomalie s'arrête au champ **porteur**, donc aucun nom interne ne remonte jamais dans un message — le choix est gratuit, et la cohérence avec tes exemples JSDoc vaut plus que ma préférence.

**RÉPONSE AU NARRATIF (C9)** — ta règle « le walker ne descend pas dans l'arbre » est juste d'intention et **fausse contre l'instrument** : `feuillesDeLaFixture` recurse sur tout objet non vide. Ton précédent `recompense[]` ne tient que parce que la fixture y porte `[{}]`. Un `condition_expr` peuplé produirait `…condition_expr.enfants[].predicat`, `…enfants[].enfants[].op` — des chemins qui varient avec la forme. La règle doit donc être **codée**, pas déclarée : le walker s'arrête sur tout chemin de `FAMILLES_DE_CONDITIONS[].expr`.

**MES OBJECTIONS** — **1** (pas d'hôte pour la 6ᵉ famille) : **MAINTENUE**. **2** (six destinations non dérivables) : **RETIRÉE** — fermée par l'annexe (b) du narratif, adoptée verbatim ; réserve : son bloc « réservé n° 4 » reste un **commentaire**, pas des lignes de table.

**VETO NEUF (mon domaine)** — l'ensemble des chemins terminaux du walker est **DÉRIVÉ** de `FAMILLES_DE_CONDITIONS`, jamais re-listé. Deux listes de chemins d'expr divergeant en silence, c'est le mode de défaillance que ce test existe pour interdire.

| # | Tranche |
|---|---|
| C1 | **5 familles.** Report n° 4, nommé en `open_questions`. |
| C2 | **`…_expr` / `…_texte` partout.** Un `declencheur` nu + un `declencheur_texte` en n° 4 = un **renommage de clé persistée**, sans `migrateDossier`. |
| C3 | `cibles` / `enfants` / `enfant` (UX). `path` d'anomalie = champ porteur. |
| C4 | **10 prédicats**, slots de RÉFÉRENCE uniquement. Veto `jet_reussi` retenu ; `entier` reporté (n° 9/12) car un opérande non résoluble est un trou dans un validateur qui se promet total. |
| C5 | **Dérivé** (`refKinds.length`). La QA obtient son test aux bornes ; `pnj_a_revele` donne une arité 2 réelle. |
| C6 | **REJET** `lit:` — motif exact de `BUDGET_CONTEXTE`. Substitut : le relevé en **commentaire** par entrée. |
| C7 | **2 codes** : `condition-invalide` + `condition-sans-expr`. Trois codes qu'aucun consommateur ne distingue, c'est trois fois la même ligne QUOI FAIRE. |
| C8 | **RETIRÉE.** Mon motif (« l'IA n'a aucune phrase ») est réfuté par la décision B : les `…_texte` sont `auteur`, jamais injectés. Bloquer inverserait D1. |
| C9 | Walker corrigé (ci-dessus) + conteneurs testés **unitairement** dans `expr.test.ts`. Nommé ET couvert. |
| C10 | **Arête ORIENTÉE**, tranchée ici, **appliquée en n° 5** — zéro ligne d'it3. |
| C11 | Accepté : `docs/ROADMAP-BASCULE-IA.md` entre dans le lot. |
| C12 | **it4**, écrit comme **KR** dès maintenant. Même racine que C9. |
| C13 | Accepté. **C14** Adopté. |

**VERDICT — APPROVE sous les deux conditions écrites au plan** : le walker dérivé (veto), et le bloc « réservé n° 4 » en commentaire.

---

## ANNEXE — signatures définitives

### `predicates.ts` (N)
```ts
import type { EspaceDeNoms } from './identifiers'

export interface PredicatDescripteur {
	/** Libellé français — la valeur du Select des n° 3/6/7. Jamais une syntaxe. */
	label: string
	/** L'espace de noms attendu à CHAQUE position. L'ARITÉ est `refKinds.length`,
	 *  DÉRIVÉE et jamais stockée (dérive refusée par `CONFIANCES`, KR-165).
	 *  SCHÉMA 1 : slots de RÉFÉRENCE uniquement — tout espace listé ici a une ligne
	 *  dans `COLLECTIONS_IDENTIFIEES`, propriété tenue par un test. Un opérande
	 *  littéral (`entier`) gagnera un champ au DESCRIPTEUR, jamais un `switch`. */
	refKinds: readonly EspaceDeNoms[]
}

/** Factory d'identité LOCALE, jumelle de `defineEspaces`. Recopiée, non extraite :
 *  deux appelants, trois lignes. Extraction au troisième. */
const definePredicats =
	<V>() =>
	<K extends string>(map: Record<K, V>): Record<K, V> =>
		map

export const PREDICATES = definePredicats<PredicatDescripteur>()({ /* … */ })
export type PredicatId = keyof typeof PREDICATES
```
> Chaque entrée porte, **en commentaire**, le champ d'état de session qui y répond (règle d'admission du narratif). C'est un relevé en prose, pas une table : `CheminDeSession` n'a aucun lecteur avant la n° 9.

### `expr.ts` (N)
```ts
/** Borne de récursion — un fichier écrit à la main ne fait pas sauter la pile.
 *  Testée à 8 (calme) et 9 (bloquant), KR-165. */
export const PROFONDEUR_MAX_EXPR = 8

export type ExprNode =
	| { op: 'et' | 'ou'; enfants: ExprNode[] }             // ≥ 2 enfants
	| { op: 'non'; enfant: ExprNode }                      // arité tenue PAR LE TYPE
	| { op: 'predicat'; predicat: PredicatId; cibles: string[] }

/** Le champ PORTEUR de l'expression — le `path` et le `location` de toute anomalie
 *  produite par l'arbre. Le chemin NE DESCEND PAS dans l'arbre : le seul
 *  consommateur déclaré (badge de section, n° 7) ne sait pas badger un sous-nœud,
 *  et `feuilleDe(path)` doit rendre la clé que l'auteur cherchera dans son fichier. */
export interface SiteExpr { path: string; location: string }

/** FORME seule — frontière de confiance (comme `isNodeKind`, KR-116). Totale sur
 *  `unknown`, ne lève jamais, ne RÉSOUT aucune référence : seule `validate.ts`
 *  connaît `collectIds`. */
export function validateExpr(valeur: unknown, site: SiteExpr): DossierIssue[]

export interface RefCollectee { id: string; espace: EspaceDeNoms }

/** Relevé plat des références d'un arbre BIEN FORMÉ. Totale : `[]` sur du bruit.
 *  N'est appelée QUE si `validateExpr` n'a rien produit. */
export function collectRefs(valeur: unknown): RefCollectee[]
```
Les **quatre opérateurs sont une union de types**, exhaustivement vérifiée par le compilateur — **pas** un registre. KR-117 porte sur les identifiants de prédicat.

### `tables.ts` (N)
Les 6 tables d'it2 déplacées **verbatim** (`RACINES`, `CHAMPS_REQUIS`, `ENUMERES_FERMES`, `LISTES_REQUISES`, `CHEMINS_DE_DELTAS`, `BUDGETS_DE_MOTS`) + leurs interfaces, plus :
```ts
export interface FamilleDeCondition {
	/** Chemin du `…_expr` — segments pointés et `[]`, la grammaire FIGÉE de `sitesDe`. */
	expr: string
	texte: string
	location: string
	/** D1 : un `…_texte` sans `…_expr` AVERTIT — sur une FIN et un OBJECTIF seulement. */
	alerteSansExpr: boolean
}
export const FAMILLES_DE_CONDITIONS: readonly FamilleDeCondition[] = [ /* 6 couples */ ]
// SIXIÈME famille `contre_mesures[]` : absente du schéma 1. Elle arrive avec sa
// racine en n° 4 `dossier-fiches` — quatre lignes. Ne PAS l'anticiper ici.
```
`sitesDe` **reste dans `validate.ts`** : c'est le LECTEUR, pas la table. Ordre acyclique : `identifiers` → `issues` → `predicates` → `expr` → `types` → `tables` → `validate`.

### `types.ts` (R)
```ts
export interface Objectif extends Entite {
	reussi_si_texte?: string   // AUTEUR — optionnel : sa forme complète est n° 3 (décision A)
	reussi_si_expr?: ExprNode  // MOTEUR
	echoue_si_texte?: string
	echoue_si_expr?: ExprNode
}
Canon.objectifs: Objectif[]                                   // était Entite[]
Fin        + condition_expr?: ExprNode
Jalon      + declencheur_expr?: ExprNode
Evenement  + declencheur_texte?: string  + declencheur_expr?: ExprNode
PlanAction + declencheur_texte?: string  + declencheur_expr?: ExprNode
```
**Tous optionnels.** Aucune règle de symétrie `…_expr` ⇒ `…_texte` (C8 retirée).

### Liste de fichiers finale — **UN SEUL LOT**, type `contrat`

**Un lot parce que chaque fichier de code vit dans `brain/` : tout lot serait `contrat`, or un lot `contrat` s'exécute seul et en premier — deux « premiers » est une contradiction déjà tranchée, et couper autrement nommerait `types.ts`/`validate.ts` deux fois ou séparerait les tests de leur code.**

`predicates.ts` (N) · `expr.ts` (N) · `tables.ts` (N) · `expr.test.ts` (N) · `types.ts` (R) · `validate.ts` (R, **≤ 650 l. mesuré**) · `issues.ts` (R) · `destinations.ts` (R) · `couverture.test.ts` (R) · `validate.test.ts` (R) · `roundtrip.test.ts` (R) · `__fixtures__/dossier-minimal.json` (R) · `src/brain/index.ts` (R, **types seuls**) · `docs/ROADMAP-BASCULE-IA.md` (R).

**Hors lot** : `identifiers.ts`, `freeze.ts`, `read.ts`, `DossierService.ts`, `src/features/**`, `src/player/**`.

**Deux phases DANS le lot** : **A** — `tables.ts` extrait + walker + 4ᵉ assertion, porte verte, zéro changement de comportement ; **B** — expr, schéma, intégrité.

### Pièges à écrire au plan
1. **Les 4 `…_texte` neufs sont optionnels et non contraints** : leur corruption (`"…" → 42`) passe. Il faut **4 dispenses `LIBRES`** dont le motif nomme la question ouverte de la n° 2 (« présent → doit être une chaîne »). **Ne pas** inventer une table de textes optionnels ici.
2. Le walker **doit** s'arrêter sur les chemins de `FAMILLES_DE_CONDITIONS[].expr`, sinon `DESTINATION_DES_CHAMPS` exige une ligne par forme d'arbre — table jamais exhaustive.
3. La 4ᵉ assertion se teste par **préfixe normalisé** (`===` ∨ `+'.'` ∨ `+'['`), pas par égalité : 8 des ~30 chemins de tables sont des conteneurs.
4. « Aucune ligne morte » force la fixture à instancier **les 6 champs `…_expr`, les 4 `…_texte` neufs et tous les prédicats**.
5. `charpente.fins[].condition_texte` est **requis** : toute fin de la fixture doit porter `condition_expr`, sinon `condition-sans-expr` fait rougir « fixture sans avertissement ».

### Ce que je continue de refuser
`parseExpr` sous tout nom · tout élargissement de `sitesDe` · `evaluate(state, expr)` · un registre d'opérateurs · l'export des **valeurs** `PREDICATES`/`validateExpr`/`collectRefs` depuis `brain/index.ts` (les **types** sortent) · `lit: CheminDeSession[]` · `contre_mesures[]`.
