# Tour 1 — Tech Lead

## Note d'ouverture

**RISQUE**
1. `REFERENCES_SIMPLES` sur `objectif_id` rend **atteignable** un `statut:'refuse'` que `ObjectifsCanon.tsx:86-89` déclare structurellement impossible — et ignore. Après it1, retirer un objectif rattaché à un personnage devient un clic sans effet ni message. Le no-op muet est ce que la docstring de `DossierService.update` interdit nommément.
2. **Le gate est rouge avant le premier lot** : `src/features/dossier-fiches/` existe déjà (specification.json seule) et `FEATURE_DIRS` ne le déclare pas → `featureDirs.test.ts` échoue aujourd'hui, hors de tout lot (précédent `bascule-editeur`).

**OBJECTION**
1. Corrompre `monde.personnages[].objectif_id` ne fait **pas** rougir la validation (`validate.ts:373`, `continue` sur non-chaîne) : sans dispense `LIBRES` (famille `apres_indice_id`), la 2e assertion de `couverture.test.ts` casse. Le lot contrat n'est pas « deux lignes de table ».
2. `portee` n'appelle **aucun** widget ni contrat neuf : `PORTEES` sort déjà (`brain/index.ts:146`). Le piège est inverse — elle est *requise*, avec `plan_actions`/`savoirs` (`LISTES_REQUISES`) : `handleAjouter` doit frapper `{id, portee:'premier', plan_actions:[], savoirs:[]}`. Le précédent `PanneauLieux` (`{ id }` nu) ne transpose pas.
3. `camp` optionnel contre `SegmentedControl` (`value: T`, non nullable) : sentinelle `''` en union **locale à la feature**. Jamais un `value: T | null` dans `brain/components` — un seul appelant, ce serait une dette.

**PROPOSITION**
Deux lots, séquentiels, sans worktree. Lot 1 `contrat` mesuré : 8 chemins, `validate.ts` **non** touché, `dossier-reference.json` **non** touché. Il porte `.eslintrc.cjs` (il passe premier, il rend le gate vert). Lot 2 = tranche verticale + bandeau de refus d'`ObjectifsCanon`. Pour le PM : éditer `Entite.nom` en it1 ne coûte aucun fichier du lot 1.

**VERDICT** — Favorable sous les trois réserves. Veto si `ObjectifsCanon` reste muet, ou si `SegmentedControl` change de signature.

---

## Annexe — découpage en lots (hors quota)

### Vue d'ensemble

| # | Nom | Type | Ouvrier | Fichiers | Propriété exclusive vérifiée |
|---|---|---|---|---|---|
| 1 | `contrat-camp-rattachement` | **contrat** (seul, en premier) | dev-contrat | 8 (0 neuf) | aucun chemin partagé avec le lot 2 |
| 2 | `fiche-personnage-situee` | feature | dev-lot | 9 (5 neufs) | aucun chemin partagé avec le lot 1 |

Un seul lot contrat (KR-190). Le lot 2 démarre **contrat figé** et le lit comme une donnée immuable. Deux lots sur une tranche verticale = cas normal : exécution séquentielle, pas d'essaim.

### Lot 1 — `contrat-camp-rattachement` (contrat)

Fichiers (R = remplace, N = crée) :

- R `src/brain/dossier/types.ts`
- R `src/brain/dossier/tables.ts`
- R `src/brain/dossier/destinations.ts`
- R `src/brain/index.ts`
- R `src/brain/dossier/__fixtures__/dossier-minimal.json`
- R `src/brain/dossier/couverture.test.ts`
- R `src/brain/dossier/validate.test.ts`
- R `.eslintrc.cjs`

**Mesure KR-186/KR-190** (relevée sur le dépôt, jamais recopiée d'it précédente) : 7 des 9 fichiers annoncés par KR-190 sont touchés. **`validate.ts` ne l'est pas** — `ENUMERES_FERMES` et `REFERENCES_SIMPLES` sont lues génériquement, le validateur n'apprend aucune règle nouvelle. **`dossier-reference.json` ne l'est pas non plus** : le critère #7 est une non-régression *sans modification*, `suffisance.test.ts` la rejoue déjà, et la garde « aucune clé en trop » est orientée (référence ⊆ minimal) — enrichir le minimal seul est sûr. Le 8e chemin est `.eslintrc.cjs`, hors schéma. Sous plafond.

Signatures exposées (rendez-vous du lot 2) :

```ts
// src/brain/dossier/types.ts
/** Le CAMP d'un personnage. Registre DISTINCT de CAMPS/Camp (canon.objectifs) :
 *  'joueur' n'est pas un camp de personnage, et singulier/pluriel ne se coercent pas. */
export const CAMPS_PERSONNAGE = ['protagoniste', 'antagoniste'] as const
export type CampPersonnage = (typeof CAMPS_PERSONNAGE)[number]

export interface Personnage extends Entite {
	portee: Portee
	/** OPTIONNEL (KR-191) : personnages[] existe depuis le schéma 1 sans ce champ. */
	camp?: CampPersonnage
	/** Référence PLATE et optionnelle vers `canon.objectifs[].id` (espace `objectif`). */
	objectif_id?: string
	plan_actions: PlanAction[]
	savoirs: Savoir[]
}
```

```ts
// src/brain/dossier/tables.ts — ENUMERES_FERMES, sous la ligne `portee`
{ path: 'monde.personnages[].camp', location: 'Personnages', valeurs: CAMPS_PERSONNAGE, requis: false },

// src/brain/dossier/tables.ts — REFERENCES_SIMPLES (5e entrée)
{ path: 'monde.personnages[].objectif_id', espace: 'objectif', location: 'Personnages',
  sujet: 'Le rattachement de ce personnage' },
```

```ts
// src/brain/dossier/destinations.ts — deux lignes, sous `…[].portee`
'monde.personnages[].camp': 'moteur',        // même famille que portee et canon.objectifs[].camp
'monde.personnages[].objectif_id': 'moteur', // un identifiant est un handle technique
```

```ts
// src/brain/index.ts
export { PORTEES, CERTITUDES, CAMPS, CAMPS_PERSONNAGE } from './dossier/types'
export type { …, CampPersonnage } from './dossier/types'
// Les LIBELLÉS français restent côté feature (précédent CAMPS, index.ts:143-145).
```

```json
// __fixtures__/dossier-minimal.json — sur `pnj.aldur-le-sage`, deux clés
"camp": "protagoniste",
"objectif_id": "objectif.refermer-le-sceau"
```

Obligations de test du lot 1 (sinon il ne passe pas seul) :

- `couverture.test.ts` — **dispense `LIBRES` obligatoire** pour `'monde.personnages[].objectif_id'`, motif de la famille `apres_indice_id`. **Aucune dispense pour `camp`** : `requis:false` ne saute que `undefined`, une corruption en `42` produit `valeur-hors-enumeration`.
- `couverture.test.ts` — un test nommé sur le modèle de « les trois proses de Lieu » : `camp → moteur`, `objectif_id → moteur`, **et** l'instance dans la fixture, dans la même assertion.
- `validate.test.ts` — 4 cas : `camp` absent = calme (ni erreur ni avertissement, KR-191) · `camp` hors énumération = bloquant · `objectif_id` pendant = `reference-pendante` · `objectif_id` d'un mauvais espace (`pnj.…`) = `identifiant-invalide`.
- `.eslintrc.cjs` — `FEATURE_DIRS += 'dossier-fiches'`. **À faire ici et pas au lot 2** : `featureDirs.test.ts` est rouge dès maintenant, le lot 1 ne pourrait pas passer sa propre porte.

### Lot 2 — `fiche-personnage-situee` (feature)

- N `src/features/dossier-fiches/index.ts`
- N `src/features/dossier-fiches/components/PanneauPersonnages.tsx`
- N `src/features/dossier-fiches/components/FichePersonnage.tsx`
- N `src/features/dossier-fiches/components/Accordion.tsx`
- N `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx`
- R `src/App.tsx`
- R `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx`
- R `src/features/dossier-canon/components/ObjectifsCanon.tsx`
- R `src/features/dossier-canon/tests/objectifsCanon.test.tsx`

Signatures exposées :

```ts
// src/features/dossier-fiches/index.ts — API publique, injectée par la racine de composition
export { PanneauPersonnages } from './components/PanneauPersonnages'
export interface PanneauPersonnagesProps { dossierId: string }
export function PanneauPersonnages({ dossierId }: PanneauPersonnagesProps): JSX.Element | null
```

```ts
// components/Accordion.tsx — LOCAL à la feature, jamais promu à brain/components (KR-109 : 1 appelant)
export interface BlocAccordeon { id: string; titre: string; contenu: ReactNode | null } // null ⇒ « Pas encore renseigné »
export interface AccordionProps { blocs: readonly BlocAccordeon[]; ouvertId: string | null; onToggle: (id: string) => void }
export function Accordion({ blocs, ouvertId, onToggle }: AccordionProps): JSX.Element
```

```ts
// components/FichePersonnage.tsx — PUR RENDU (précédent FicheLieu) : aucun état, aucun DossierService
export interface FichePersonnageProps {
	personnage: Personnage
	index: number
	objectifs: readonly Objectif[]              // libellés via localiserEntite('objectif', …)
	refus: { issues: DossierIssue[] } | null
	blocOuvertId: string | null
	onToggleBloc: (id: string) => void
	onChangeCamp: (camp: CampPersonnage | undefined) => void
	onChangePortee: (portee: Portee) => void
	onChangeObjectif: (objectifId: string | undefined) => void
	onRetirer: () => void
}
```

Signatures consommées (immuables, produites par le lot 1) : `CAMPS_PERSONNAGE`, `CampPersonnage`, `Personnage`, `Objectif`, `PORTEES`, `Portee`, `frapperIdentifiant`, `localiserEntite`, `useOpenDossier`, `useBrain().dossiers.update`, `DossierIssue`, `EcritureDossier`, `ListRow`, `SegmentedControl`, `Select`, `Card`, `Badge`, `IssueList`.

Contraintes dures du lot 2 :

- **Création** : `{ id: frapperIdentifiant('pnj'), portee: 'premier', plan_actions: [], savoirs: [] }`. Trois champs requis, pas un `{ id }` nu.
- **Écriture** : patch étroit `{ canon: d.canon, monde: { ...d.monde, personnages }, charpente: d.charpente }` — jamais un spread de `dossier`.
- **Refus indexé par personnage** (`{ personnageId, issues }`, précédent BUG-056), jamais un refus global.
- `App.tsx` : `panneaux={{ …, personnages: <PanneauPersonnages dossierId={route.dossierId} /> }}`. Aucun import de `bascule-editeur` depuis `dossier-fiches` ni l'inverse (KR-184).
- `dossierEditorScreen.test.tsx` (KR-187) : ajouter une sonde, l'injecter dans le `renderScreen` du `describe('selection d une section…')`, ajouter la branche `else if (index === 2)`, et étendre le test-grep `App.tsx` à `personnages:\s*<PanneauPersonnages`. **Ne pas toucher** le test clavier qui attend `texteEtatVide(2)` sans `panneaux` — il éprouve l'état vide générique, pas la section.
- `ObjectifsCanon.tsx` : bandeau de refus (`useState<DossierIssue[]>` alimenté par le retour de `commit()`, `IssueList` dans le gabarit du bandeau d'avertissement déjà présent) + réécriture de la docstring « AUCUN bandeau de refus ici », devenue fausse. Test associé : retirer un objectif rattaché → rien n'est persisté **et** le refus est visible.

### Point non figé, à trancher au tour 2

Mono-ouverture (`ouvertId: string | null`) ou multi-ouverture (`ouverts: ReadonlySet<string>`) de l'accordéon. La signature d'`Accordion` change avec la réponse.
