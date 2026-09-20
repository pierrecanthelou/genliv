# Tour 1 — tech-lead — `dossier-canon` it5 (tranche B1, `lieux[].acces`)

**RISQUE** — La matérialisation de l'inverse. L'arête est orientée ; trois lecteurs futurs (canevas, linter, moteur) voudront « qui mène ici ». Tout stockage réciproque, ou tout helper `inverses()` promu dans `brain/` sur un seul appelant, crée la seconde source de vérité que le raffinage n° 1 it3 a refusée (KR-013). Second risque, mesuré : `PanneauLieux.tsx` 364 l. + ~45 l. de gestionnaires ≈ 410 l. → au-delà du signal KR-112, sur une feature déjà close.

**OBJECTION 1 (le rider `validate.ts`)** — Son déclencheur ne se produit pas. Mesuré : `acces` ne demande **aucune ligne** de `validate.ts`. La boucle `REFERENCES_SIMPLES` traite déjà un chemin à deux `[]` (`monde.indices[].mene_a[]`), et la borne « chaîne vide » teste déjà `reference.path.endsWith('[]')` (`validate.ts:422`). Le roadmap écrit « le premier lot qui rouvre ce fichier — donc B1 » : **la prémisse est fausse**. Position : rider **hors périmètre**, **ré-armé sur le fichier `validate.ts`**, pas sur B1 — il porte sur 4 sites d'avertissement étrangers à `acces` et change la forme du rapport que lit `dossier-controles`. Seconde démonstration, même doctrine que la levée de KR-224 déjà exclue.

**OBJECTION 2** — « Relier ses lieux » avec un écran qui n'affiche que le sortant : l'auteur fabrique des culs-de-sac sans jamais les voir.

**PROPOSITIONS** — (1) `acces?: string[]` ; contrat à **5 fichiers, zéro ligne de `validate.ts`**. Interdits : forme structurée `{vers,…}` (ce serait une 7e famille D1) et garde d'auto-référence au SSOT (KR-194 : l'exclusion vit à l'écran, ligne d'ajout seule). (2) Liste **« ACCESSIBLE DEPUIS » en lecture seule**, calculée en ligne dans `FicheLieu` (~12 l.) depuis la prop `lieux` déjà nécessaire — jamais stockée, jamais un `useEffect`, jamais un helper `brain/`. Un éventuel bouton « créer le passage réciproque » est un ARBITRAGE UX, et c'est une écriture de deux entrées, jamais un état dérivé. (3) KR-112 : extraire les 80 l. de styles (`PanneauLieux.tsx:285-364`) → `components/styles.ts`, précédents `dossier-objets`/`dossier-registres` → ~330 l. (4) **BUG-078 corrigé dans ce lot** : `IconButton` est déjà `forwardRef<HTMLButtonElement>` (`brain/components/IconButton.tsx:30`), donc `FicheLieuHandle.focusRetirer()` coûte **zéro fichier `brain/`**.

**VERDICT** — recevable sous réserve (les 4 propositions ; rider hors périmètre).

---

## Réponse nommée à la question d'encapsulation

`PanneauLieux.tsx:99` fait `panneauRef.current?.querySelector<HTMLButtonElement>('button[aria-label^="Retirer le lieu"]')?.focus()` — recherche DOM distante vers le balisage de `FicheLieu.tsx` (BUG-078, minor, non corrigé). Cette itération **l'aggraverait si on ne fait rien** : elle rouvre précisément l'effet de focus (`intentionFocus`) pour l'ajout d'un accès, et le réflexe naturel est un **second** `querySelector` par `aria-label` — 4e occurrence de la classe, 2e dans le même fichier. Verdict : **elle doit la corriger**, dans le lot 2, par le correctif déjà éprouvé (`FicheObjetHandle`, `dossier-objets` it2) : `FicheLieu` en `forwardRef<FicheLieuHandle>` + `useImperativeHandle({ focusRetirer })`. Coût ~10 lignes, aucun fichier hors du lot. Interdit explicite : **aucun nouveau `querySelector` par `aria-label`**.

---

## ANNEXE — découpage en lots (propriété disjointe)

**2 lots. Exécution séquentielle, pas d'essaim** : une tranche verticale, contrat figé puis écran.

### Lot 1 — `contrat-acces-lieu` · type `contrat` · seul et en premier

| Fichier | N/R |
|---|---|
| `src/brain/dossier/types.ts` | R |
| `src/brain/dossier/tables.ts` | R |
| `src/brain/dossier/destinations.ts` | R |
| `src/brain/dossier/__fixtures__/dossier-reference.json` | R |
| `src/brain/dossier/validate.test.ts` | R |

```ts
// types.ts — Lieu, 4e champ, après `dangers`
/** MOTEUR — les lieux ATTEIGNABLES DEPUIS celui-ci. Arête ORIENTÉE : une entrée
 *  = un sens ; un passage réciproque = DEUX entrées, une par lieu. Aucun inverse
 *  n'est stocké ni dérivé au SSOT (KR-013). Références vers `monde.lieux[].id`.
 *  Auto-référence LÉGALE et sans garde (KR-194, précédent `mene_a[]`) :
 *  l'exclusion vit à l'ÉCRAN, sur la seule ligne d'ajout.
 *  OPTIONNELLE ; liste vide = état calme (un lieu terminal). */
acces?: string[]

// tables.ts — REFERENCES_SIMPLES (rang à REMESURER, KR-159)
{ path: 'monde.lieux[].acces[]', espace: 'lieu', location: 'Lieux' }
// tables.ts — LISTES_OPTIONNELLES_TEXTUELLES
{ path: 'monde.lieux[].acces', location: 'Lieux' }

// destinations.ts — juste après 'monde.lieux[].dangers'
'monde.lieux[].acces[]': 'moteur',
```

Contraintes : les `acces` de la fixture doivent **résoudre** ; `dossier-minimal.json` reste intouché ; `couverture.test.ts` ne s'édite **que** s'il rougit. Acceptation : `jest src/brain` vert **sans qu'aucun autre fichier de test ne change** — s'il en faut un, c'est une découverte à remonter. Tests dans `validate.test.ts` : référence orpheline, valeur non-chaîne, liste non-tableau, élément `''` refusé, auto-référence acceptée.

### Lot 2 — `acces-a-l-ecran` · type `feature` · démarre contrat figé

| Fichier | N/R |
|---|---|
| `src/features/dossier-canon/components/FicheLieu.tsx` | R |
| `src/features/dossier-canon/components/PanneauLieux.tsx` | R |
| `src/features/dossier-canon/components/styles.ts` | **N** |
| `src/features/dossier-canon/tests/panneauLieux.test.tsx` | R |

```ts
export interface FicheLieuHandle { focusRetirer: () => void }   // BUG-078
export interface FicheLieuProps {
	lieu: Lieu
	/** TOUS les lieux, ordre du document, SELF COMPRIS — options des lignes déjà
	 *  écrites. Seule la ligne D'AJOUT exclut `lieu.id` (précédent FicheIndice.tsx:198). */
	lieux: Lieu[]
	index: number
	brouillon: BrouillonLieu
	refus: RefusLieu | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonLieu, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonLieu, valeur: string) => void
	onAjouterAcces: (cibleId: string) => void
	onChangerAcces: (rang: number, cibleId: string) => void
	onRetirerAcces: (rang: number) => void
	onRetirer: () => void
}
export const FicheLieu = forwardRef<FicheLieuHandle, FicheLieuProps>(…)

// PanneauLieux.tsx — tous via le `commit(lieux, lieuId)` existant
function handleAjouterAcces(id: string, cibleId: string): void   // no-op si cibleId === ''
function handleChangerAcces(id: string, rang: number, cibleId: string): void
function handleRetirerAcces(id: string, rang: number): void
```

`styles.ts` n'est pas une abstraction : c'est la scission KR-112, tokens déplacés à l'identique depuis `PanneauLieux.tsx:285-364`.

**Aucun fichier dans les deux lots.** Hors de toute propriété (un lot qui croit en avoir besoin s'arrête et remonte) : `validate.ts`, `atteignabilite.ts`, `controles.ts`, `App.tsx`, `dossier-minimal.json`, `brain/index.ts`, `FicheIndice.tsx`, `dossier-canon/index.ts`. L'étape 4 des Build Steps est portée par le lot 2, jamais un troisième lot.

## Points à trancher par le comité, non bloquants

1. Rider `validate.ts` : dedans ou ré-armé ? Position = ré-armé sur le fichier.
2. Liste « ACCESSIBLE DEPUIS » en lecture seule : arbitrage UX/PM, ~12 lignes, conforme KR-013.
3. Doublons (`acces: ['lieu.a','lieu.a']`) : aucun garde, exactement comme `mene_a`. Limite assumée et datée.
