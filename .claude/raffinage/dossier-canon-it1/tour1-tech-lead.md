# Tour 1 — Tech Lead — `dossier-canon` it1

RISQUE — le formulaire écrit dans une source de vérité qui peut **refuser**. Trois des quatre champs sont `CHAMPS_REQUIS` : vidé puis quitté, `update()` rend `refuse` et rien n'est persisté — mais un `<textarea>` non contrôlé, lui, garde à l'écran le texte vide. L'auteur voit alors une valeur qui n'est pas dans le dossier, et aucun `dossier:updated` ne viendra la corriger. C'est une duplication de la source de vérité par accident, née du chemin d'échec. Un refus doit donc **ramener le champ à la valeur du dossier**, visiblement, avec le `message` du `DossierIssue` — jamais une phrase fabriquée par la feature.

OBJECTION — « remplace l'état vide de la section Canon » se lit trop facilement comme « retirer la ligne `canon` de `PANNEAU_PAR_SECTION` ». Ce `Record<SectionId, …>` est exhaustif par construction : en retirer une ligne casse `tsc`, et `depart`/`lieux` y portent encore `featureNum: 3` pour les itérations 2 et 4. Le remplacement se fait **au-dessus**, par substitution dans `DossierEditorScreen` ; les dix lignes de la table restent intactes.

PROPOSITION — slot injecté depuis la racine de composition, exactement le précédent `LibraryScreen.importEntry` : `panneaux?: Partial<Record<SectionId, ReactNode>>` sur `DossierEditorScreenProps`, repli sur `PanneauSection`. `PanneauSection` **ne reçoit pas** `dossier` : `PanneauCanon` prend `dossierId` et lit `useOpenDossier` lui-même — zéro état remonté, zéro copie privée. **Deux lots** suffisent ; `.eslintrc.cjs` va dans le lot 2, avec la création du dossier de feature qui le rend nécessaire (`dossier-format/tests/featureDirs.test.ts` rougit sinon).

VERDICT — recevable.

---

## Annexe 1 — Le mécanisme d'injection (contrat figé)

**`src/features/bascule-editeur/components/DossierEditorScreen.tsx`** (lot 2)

```ts
export interface DossierEditorScreenProps {
	dossierId: string
	/**
	 * Les panneaux d'édition RÉELS, injectés par la racine de composition — jamais
	 * importés (précédent : LibraryScreen.importEntry / createEntry). Une section
	 * absente de la table retombe sur l'état vide `PanneauSection`.
	 */
	panneaux?: Partial<Record<SectionId, ReactNode>>
}
```

Corps : `{panneaux?.[selectedId] ?? <PanneauSection sectionId={selectedId} />}`. `PanneauSection.tsx` et `PANNEAU_PAR_SECTION` ne sont **pas** touchés par cette itération.

**`src/App.tsx`** (lot 2)

```tsx
<DossierEditorScreen
	key={route.dossierId}
	dossierId={route.dossierId}
	panneaux={{ canon: <PanneauCanon dossierId={route.dossierId} /> }}
/>
```

**`src/features/dossier-canon/components/PanneauCanon.tsx`** (lot 2)

```ts
export interface PanneauCanonProps {
	dossierId: string
}
export function PanneauCanon({ dossierId }: PanneauCanonProps): JSX.Element | null
```

Lit `useOpenDossier(dossierId)` et `useBrain().dossiers`. `null` quand le dossier est absent : l'écran parent porte déjà « Dossier introuvable. », le panneau ne redit pas la même chose et ne peut pas importer `PanneauSection`.

Idiome de recette **prescrit** (trois racines nommées, jamais `{...dossier}`) :

```ts
dossiers.update(dossierId, (d) => ({
	canon: { ...d.canon, ton: valeur },
	monde: d.monde,
	charpente: d.charpente,
}))
```

## Annexe 2 — Lot 1 · `contrat` (seul, en premier)

| | Fichier |
|---|---|
| R | `src/brain/DossierService.ts` |
| R | `src/brain/DossierService.test.ts` |
| R | `src/brain/index.ts` — ligne 181, ajouter `CorpsDossier` et `EcritureDossier` (`DossierIssue` est déjà exporté, ligne 170 : ne pas le redéclarer) |
| R | `src/brain/EventBus.ts` — docstring : `dossier:updated` gagne un **second émetteur** (l'édition), il n'est plus « émis par la seule adoption cloud » |
| R | `src/brain/hooks.ts` — docstring l. 41-52 uniquement : le commentaire annonce « le jour où l'édition écrira dans le dossier, son événement s'ajoute ICI » ; il y est déjà, **aucun changement de code** |

Signature exposée, telle que retenue au cadrage :

```ts
export type CorpsDossier = Pick<Dossier, 'canon' | 'monde' | 'charpente'>

export type EcritureDossier =
	| { statut: 'absent' }
	| { statut: 'refuse'; errors: DossierIssue[]; warnings: DossierIssue[] }
	| { statut: 'ecrit'; dossier: Dossier; warnings: DossierIssue[] }

update(id: string, recette: (dossier: Dossier) => CorpsDossier): EcritureDossier
```

Composition du candidat **champ par champ, jamais un spread de la recette** — c'est ce qui rend l'enveloppe non réinscriptible même si la recette renvoie des clés en trop :

```ts
const candidat: Dossier = {
	schema: DOSSIER_SCHEMA,
	id: stocke.id,
	titre: stocke.titre,
	createdAt: stocke.createdAt,
	updatedAt: new Date().toISOString(),
	canon: corps.canon,
	monde: corps.monde,
	charpente: corps.charpente,
}
```

Huit tests nommés, un par propriété (KR-169) : (1) `absent` — la recette n'est **jamais appelée** (`jest.fn` non appelé) ; (2) refus — magasin inchangé **et aucun événement émis** ; (3) `warnings` (> `BUDGET_MOTS_CANON`) — l'écriture a bien lieu et les avertissements remontent ; (4) `updatedAt` frappé par le service, une date renvoyée par la recette est ignorée ; (5) `id`/`schema`/`createdAt`/`titre` inchangés même si la recette les altère ; (6) persistance **puis** `dossier:updated`, l'abonné lit déjà le nouveau document (KR-004) ; (7) `Object.isFrozen(resultat.dossier)` — c'est le clone du validateur qui est persisté ; (8) `roundtrip.test.ts` reste vert : **aucun `deepFreeze` n'entre dans `DossierService.ts`**.

## Annexe 3 — Lot 2 · `feature` (démarre contrat figé)

| | Fichier |
|---|---|
| N | `src/features/dossier-canon/specification.json` (déjà écrit au cadrage) |
| N | `src/features/dossier-canon/index.ts` (export `PanneauCanon` seul) |
| N | `src/features/dossier-canon/components/PanneauCanon.tsx` |
| N | `src/features/dossier-canon/tests/panneauCanon.test.tsx` |
| R | `src/App.tsx` |
| R | `src/features/bascule-editeur/components/DossierEditorScreen.tsx` |
| R | `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (l. 77 et 172-189 : `texteEtatVide(0)` pour Canon devient faux — réécrit **dans ce lot**, jamais après) |
| R | `.eslintrc.cjs` (`FEATURE_DIRS += 'dossier-canon'`) |

Règles de conduite que le plan doit imposer à l'agent, parce qu'aucun linter ne les voit : **commit au blur, jamais à la frappe** (chaque écriture = validation complète + une poussée KV via le `set` décoré de `CloudSyncService`) — assertion testable : taper N caractères puis quitter le champ n'appelle `update` **qu'une fois** ; **aucun `useEffect` de miroir** du dossier vers un état de brouillon (KR-013/113) ; une ligne vide de `interdits_ton[]` n'est **jamais** persistée (le validateur ne contraint pas le contenu de cette liste — `LIBRES`, `couverture.test.ts` — donc c'est la feature qui tient la propreté) ; l'état vide des neuf autres sections reste rendu à l'identique.

## Annexe 4 — Pourquoi deux lots et pas trois

Le seul découpage supplémentaire plausible — « câblage » (App + écran) séparé de « formulaire » — produirait deux lots dont **aucun** ne satisfait seul le critère d'acceptation : le câblage sans panneau n'a rien à injecter, le panneau sans câblage n'est monté par personne. Un lot doit passer la porte qualité isolément ; ceux-là ne le peuvent pas. Deux lots, exécution **séquentielle**, sans worktree ni fusion.
