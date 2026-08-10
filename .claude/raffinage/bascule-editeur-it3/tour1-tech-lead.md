## RISQUE

Le critère d'acceptation n° 12 est **infaisable**, et c'est mesuré. `src/features/tree-canvas/tests/TreeCanvas.test.tsx` monte `<App/>` sur la route `editor` (lignes 14, 129, 152) : ses ~15 tests atteignent le canevas **uniquement** par App → EditorScreen, et assertent au passage la composition d'EditorScreen (« 2 nœuds » d'EditorTopBar, « Compacter » de SpacingToggle). Toute action qui verdit le grep sur `EditorScreen.tsx` — suppression **comme** vidage — met cette suite au rouge. Le même critère exige qu'elle reste verte **sans modification**. Prix caché : cette suite est la seule couverture de régression de Dagre, du viewport persisté, du drag et de l'anneau KR-145 — exactement l'héritage de la n° 6.

## OBJECTION

(a) Le n° 12, ci-dessus : deux clauses qui s'excluent. (b) Deux des dix compteurs n'ont pas de valeur définie ou atteignable. Canon n'a **aucun** compteur arbitré (ce n'est pas une liste de fiches). Et « configuré »/« — » pour Départ a une branche morte : `charpente.depart.lieu_id` est dans `CHAMPS_REQUIS` et doit résoudre, donc tout dossier que `get()` retourne est « configuré ». Un compteur toujours vrai ne dit rien ; le rendre honnête, c'est écrire le linter n° 7, hors périmètre.

## PROPOSITION

1. **Réécrire le n° 12** en trois clauses prouvables : App.tsx sans les trois chaînes (déjà vrai) ; DossierEditorScreen sans canevas ; **aucun code de production ne navigue vers `{name:'editor'}`** — grep mesuré : seuls deux fichiers de tests le font. Coût 0 fichier, démolition intacte pour la n° 9.
2. `compte(dossier): string` — le **texte** du badge, jamais un nombre : absorbe les trois irréguliers sans une seule branche côté feature. Canon et Départ rendent « — » (slot réservé, même doctrine que le badge de complétion) : zéro branche morte.
3. `useOpenDossier` **dans le lot contrat** : `reconcileDossier` émet `dossier:updated`, armé par `dossier:opened` — les dix compteurs peuvent rancir dès le montage. Déclencheur réel, test réel.

## VERDICT

**Recevable sous réserve** — réserves 1 et 3 (bloquantes) ; la 2 est un arbitrage UX que je ne tranche pas seul.

---

# ANNEXE

## A. Point 7 tranché : ni supprimer, ni vider — **ne pas toucher**

**VETO sur le retrait de la variante `Route.editor`.** Rayon mesuré : `src/features/tree-canvas/components/TreeCanvas.tsx:51` et `src/features/cloud-sync/components/ConflictDialog.tsx:14` lisent tous deux `route.name === 'editor' ? route.bookId : null` — le retrait produit une comparaison sans recouvrement, donc un échec `tsc`, dans **deux dossiers de features hors périmètre**, plus leurs tests. `src/brain/Router.ts:12` documente déjà ce report à la n° 9. Non négociable.

**Recommandation sur `src/EditorScreen.tsx` : intouché, à l'octet près.** Les trois options ont été évaluées :

| Option | Effet sur `TreeCanvas.test.tsx` | Coût réel |
| --- | --- | --- |
| Supprimer le fichier + la branche App | **rouge, ~15 tests** | ré-héberger la suite sur un harnais local dans `features/tree-canvas/tests/` = chirurgie de fusil de chasse dans une feature hors périmètre, écrite par quelqu'un qui ne la repointera pas |
| Vider des imports TreeCanvas/books./BookService | **rouge, ~15 tests** | même prix, sans le bénéfice ; et il reste un fichier que personne ne possède, dont la seule raison d'être est de satisfaire un grep |
| **Ne pas toucher** | vert, 0 modification | le grep sur `EditorScreen.tsx` est abandonné cette itération, remplacé par la preuve d'**inatteignabilité** (proposition 1) |

Deux notes pour couper court aux contre-propositions :
- **Déplacer `EditorScreen.tsx` dans `features/tree-canvas/` est un veto immédiat** : il importe `./features/play-mode/components/PlayerModal` (ligne 4). Il n'est légal qu'en racine de composition. Il reste à la racine ou il meurt — pas de troisième lieu.
- Le report est **cohérent avec KR-181** : la n° 9 supprime `BookService`/`tree.ts`/`kinds.ts`, `src/player/`, `play-mode` **et** `tree-canvas`. Les tests de tree-canvas meurent alors avec leur sujet — aucun test orphelin. Les tuer maintenant, c'est payer deux fois.
- Si le comité passe outre et exige la suppression : c'est un **troisième lot** propriétaire de `src/App.tsx`, `src/EditorScreen.tsx` (D) et `src/features/tree-canvas/tests/TreeCanvas.test.tsx` (R), et le n° 12 doit quand même être réécrit (« sans modification » tombe). Je le signale, je ne le recommande pas.

## B. Découpage en lots — 2 lots, exécution séquentielle (pas de worktree)

| Lot | Nom | Type | Ouvrier | Fichiers (N = créé, R = remplacé) |
| --- | --- | --- | --- | --- |
| 1 | `contrat-sections-listrow` | **contrat** (seul, en premier) | dev-contrat | N `src/brain/dossier/sections.ts` · N `src/brain/dossier/sections.test.ts` · N `src/brain/components/ListRow.tsx` · N `src/brain/components/ListRow.test.tsx` · N `src/brain/hooks.dossier.test.tsx` · R `src/brain/hooks.ts` · R `src/brain/components/index.ts` · R `src/brain/index.ts` · R `src/brain/Router.ts` *(commentaire seul)* |
| 2 | `nav-sections-dossier` | feature | dev-lot | R `src/features/bascule-editeur/components/DossierEditorScreen.tsx` · N `src/features/bascule-editeur/components/SectionNav.tsx` · N `src/features/bascule-editeur/components/PanneauSection.tsx` · R `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` · N `src/features/bascule-editeur/tests/demontageArbre.test.ts` |

Propriété exclusive vérifiée : aucun fichier commun. **Hors lot, intégrateur (étape 4)** : `src/features/bascule-editeur/specification.json`, `src/features/tree-canvas/specification.json` (mention « en sommeil depuis n° 2, repointage hérité par n° 6 » — fichier de doc, aucun import, ne viole pas l'isolation), `docs/ROADMAP-BASCULE-IA.md`, `CHANGELOG.md`, `features_history.json`, `code-knowledge.json`.

Pas de 3ᵉ lot : découper la nav gauche du panneau droit ferait partager `DossierEditorScreen.tsx`. Deux lots étanches valent mieux.

## C. Interfaces exactes (le seul point de rendez-vous entre les lots)

`src/brain/dossier/sections.ts` — produit par le lot 1, lu comme donnée immuable par le lot 2 :

```ts
export type SectionId =
	| 'canon' | 'depart' | 'personnages' | 'lieux' | 'objets'
	| 'indices' | 'quetes' | 'evenements' | 'conditions' | 'jalons-et-fins'

export interface SectionDescripteur {
	readonly num: number   // 1..10, ordre du schéma Dossier
	readonly id: SectionId
	readonly titre: string // « Personnages » — casse phrase
	readonly cle: string   // 'monde.personnages' — clé technique, mono faible
	/** Le TEXTE du badge, jamais un nombre : « 3 fiches », « 1 jalon · 1 fin », « — ». */
	compte(dossier: Dossier): string
}

export const SECTIONS: readonly SectionDescripteur[] // longueur 10, num strictement croissant
```

`compte(): string` est le cœur de la proposition 2 : la feature rend `descripteur.compte(dossier)` sans **aucune** condition, donc KR-013 est tenu par la forme du contrat et non par la discipline du relecteur.

`src/brain/components/ListRow.tsx` :

```ts
export interface ListRowProps {
	title: string
	subtitle?: ReactNode
	leading?: ReactNode
	trailing?: ReactNode
	selected?: boolean      // défaut false → aria-current absent
	onSelect: () => void    // REQUIS
}
export function ListRow(props: ListRowProps): JSX.Element
```

Trois arbitrages portés par le lot 1, à confirmer par l'UX :
- **`<button type="button">`**, `minHeight: 44`, `aria-current={selected ? 'true' : undefined}` (sélection de nav, pas un `aria-pressed` de bascule). `Badge` est un `<span>` (vérifié) : imbrication légale.
- `onSelect` **requis**, pas optionnel : une variante non interactive n'a aucun appelant ici, donc aucune branche testée. La n° 3 l'élargira avec un appelant en main.
- **La poignée ⠿ est omise.** Une affordance de glisser qui ne glisse pas ment — exactement la doctrine déjà votée pour « aucun bouton “+ Ajouter” désactivé ». La n° 5 la réintroduit avec le drag qu'elle porte.

`src/brain/hooks.ts` (réserve 3) :

```ts
export function useOpenDossier(dossierId: string | null): Dossier | null
// jumeau exact de useOpenBook (useSyncExternalStore) ; événements : ['dossier:updated','dossier:deleted']
```

Justification mesurée, ce n'est pas une abstraction spéculative : `CloudSyncService.ts:403` arme `reconcileDossier` sur `dossier:opened`, et `CloudSyncService.ts:392` émet `dossier:updated` quand la copie cloud est adoptée. `dossier:opened` part **juste avant** la navigation : une adoption cloud peut donc atterrir après le montage de l'écran, et les dix compteurs — comme le titre — seraient périmés sans qu'aucun rendu ne le voie. `DossierEditorScreen.tsx:24` lit aujourd'hui `dossiers.get(dossierId)` au rendu sans abonnement ; l'it2 avait nommément désigné l'it3 propriétaire de ce rattrapage. Le test du lot 1 : émettre `dossier:updated` après montage, constater le nouveau compteur.

## D. Ce que je ne bloque pas

Périmètre produit (10 sections, copie des états vides, glyphes), esthétique du layout 280 px / flex:1, et le choix de porter la copie d'état vide côté feature (`Record<SectionId, …>` typé depuis l'union du registre → une section manquante échoue `tsc`) plutôt que dans le registre brain. Je recommande la version feature — brain ne doit pas devenir le propriétaire de la copie d'un écran — mais c'est révisable sans changer le découpage.
