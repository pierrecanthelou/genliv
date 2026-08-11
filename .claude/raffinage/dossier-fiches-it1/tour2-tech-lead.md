## Tour 2 — Tech Lead

### 1. Les deux refus ne sont pas le même débat

**QA vs UX (refus DANS `PanneauPersonnages`)** — sur it1 tel qu'écrit (création seule), UX a raison : id frappé, camp/portee fermés, objectif_id choisi dans un Select valide — aucun refus atteignable, précédent `ObjectifsCanon.tsx` (« construire un état Refus qui ne peut jamais s'allumer serait du code non testable »). Si le retrait entrait dans it1, `pnj_a_revele` (arité 2, refKinds pnj+indice) rendrait un refus atteignable via une expr ailleurs — mais retrait est hors périmètre (PM), donc sans objet ici.

**Le refus que j'ai soulevé (`ObjectifsCanon.tsx`) est d'une autre nature : une régression que nous causons.** `commit()` y rend `void` et jette le résultat. Dès que `monde.personnages[].objectif_id` entre dans `REFERENCES_SIMPLES`, retirer un objectif rattaché est refusé au SSOT : l'auteur clique ✕, rien ne se passe, rien ne s'affiche. Non négociable, dans ce lot.

### 2. `nom` — position d'architecte : dans it1, hors accordéon

Coût réel : zéro contrat. `Entite.nom` est déjà typé, déjà `auteur`, déjà couvert par `couverture.test.ts` — un `Field` + le régime brouillon/blur déjà écrit dans `FicheLieu`. Coût du report : une liste de « Personnage n°1 (sans nom) » indistinguables — un squelette qui échoue son propre critère « apparaît dans la liste ». `nom` va en en-tête de fiche, comme `FicheLieu`, pas dans un bloc.

### 3. Trouvaille bloquante

`Personnage` a trois champs requis : `portee`, `plan_actions`, `savoirs`. Créer `{ id }` comme pour `Lieu` ferait refuser la création elle-même. Semence obligatoire : `{ id, portee: PORTEE_INITIALE, plan_actions: [], savoirs: [] }`, constante nommée, jamais `PORTEES[0]`. Aucun `camp`, aucun `nom` semés.

### 4. Découpage révisé — 3 lots

| # | Type | Fichiers |
|---|---|---|
| 1 | contrat — seul, en premier | types.ts (R) · tables.ts (R) · destinations.ts (R) · brain/index.ts (R) · dossier-minimal.json (R) · dossier-reference.json (R) · couverture.test.ts (R) · validate.test.ts (R) · SegmentedControl.tsx (R) · SegmentedControl.test.tsx (N) |
| 2 | feature | dossier-fiches/index.ts (N) · PanneauPersonnages.tsx (N) · FichePersonnage.tsx (N) · Accordion.tsx (N) · panneauPersonnages.test.tsx (N) · App.tsx (R) · .eslintrc.cjs (R) · dossierEditorScreen.test.tsx (R) |
| 3 | feature | ObjectifsCanon.tsx (R) · objectifsCanon.test.tsx (R) |

Lots 2 et 3 : fichiers disjoints, tous deux ne dépendant que du contrat figé du lot 1.

Interfaces exactes :

```ts
export const CAMPS_PERSONNAGE = ['protagoniste', 'antagoniste'] as const
export type CampPersonnage = (typeof CAMPS_PERSONNAGE)[number]
export interface Personnage extends Entite {
	portee: Portee; plan_actions: PlanAction[]; savoirs: Savoir[]
	camp?: CampPersonnage          // KR-191 : optionnel, jamais requis
	objectif_id?: string           // réf. simple, espace 'objectif'
}
ENUMERES_FERMES  += { path: 'monde.personnages[].camp', location: 'Personnages', valeurs: CAMPS_PERSONNAGE, requis: false }
REFERENCES_SIMPLES += { path: 'monde.personnages[].objectif_id', espace: 'objectif', location: 'Personnages', sujet: 'Le rattachement de ce personnage' }
// brain/components/SegmentedControl.tsx
value: T | undefined   // undefined = aucun segment actif ; onChange reste (value: T) => void
```

Note : `onChange: (value: T) => void` interdit le retour à « non renseigné ». Si voulu, ça passe par un `IconButton` « effacer » qui écrit `camp: undefined`, jamais un segment « Aucun » qui poserait une valeur dans le document.

**VERDICT — pas de veto.**
