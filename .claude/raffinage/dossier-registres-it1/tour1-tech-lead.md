RISQUE — `mene_a[]` est la première liste de références du schéma, et le validateur la laisse passer par trois portes. (1) `validate.ts:386` : `typeof site.valeur !== 'string' → continue` — un `mene_a: [42]` est silencieux ; trou déjà ouvert sur `objectif_id` et `apres_indice_id`. Confirmé. (2) `identifiers.ts:211` : `replace(/\[\d+\]$/)` ne retire pas `[]` — le message dirait « Le champ « mene_a[] » ». Confirmé. (3) `sitesDe` abandonne un segment `[]` non-tableau : `mene_a: "indice.x"` traverse `ok:true`, puis `.map` plante le panneau (même trou que `caractere.parler`). Bonne nouvelle : `couverture.test.ts` (`corrompre` → `42`) fait rougir (1) dès que la fixture porte un `mene_a` — on ne peut pas l'ignorer sans écrire une dispense mensongère.

OBJECTION — le `design_contract` cite `avecOrpheline()` comme si c'était un bien commun : c'est une fonction privée, non exportée, de `dossier-fiches/components/BlocSavoirs.tsx:109`. La recopier dans n°6 est un veto (KR-110). Seconde : `portee`/`PORTEES_INDICE` n'a aucun lecteur — même forme que `tier` (KR-192) et `lie_au_canon` (KR-206), et ce serait le troisième registre homonyme « portée ».

PROPOSITION — deux lots séquentiels (annexe), pas d'essaim. Reporter `portee` en it2+. Retrait hors périmètre it1 (précédent dossier-objets it1/it2). Le comité — non `dev-contrat` — écrit l'audience de `verite` et de `formulation_joueur` : `ia` injectée, jamais verbatim (seul `texte_ouverture_joueur` l'est).

VERDICT — recevable sous réserve.

---

### Annexe — découpage en lots (propriété disjointe, vérifiée fichier par fichier)

**Lot 1 — `contrat` — seul, en premier.** Aucun fichier partagé avec le lot 2.

- R `src/brain/dossier/types.ts`
- R `src/brain/dossier/tables.ts`
- R `src/brain/dossier/validate.ts`
- R `src/brain/dossier/identifiers.ts`
- R `src/brain/dossier/destinations.ts`
- R `src/brain/dossier/__fixtures__/dossier-reference.json`
- R `src/brain/dossier/__fixtures__/dossier-minimal.json`
- R `src/brain/dossier/couverture.test.ts`
- R `src/brain/dossier/validate.test.ts`
- R `src/brain/dossier/identifiers.test.ts`
- N `src/brain/utils/references.ts`
- N `src/brain/utils/references.test.ts`
- R `src/brain/index.ts`
- R `src/features/dossier-fiches/components/BlocSavoirs.tsx` (extraction seulement, import de la version promue — zéro changement de comportement)

Signatures exposées (point de rendez-vous unique du lot 2) :
```ts
// types.ts — tous OPTIONNELS (KR-191) ; Monde.indices: Indice[] (était Entite[])
export interface Indice extends Entite {
	verite?: string              // MJ ; audience arbitrée par le comité
	formulation_joueur?: string  // 'ia' — injectée, jamais émise verbatim
	mene_a?: string[]            // 'moteur' — références espace 'indice'
}

// tables.ts — une LIGNE, aucune table neuve
REFERENCES_SIMPLES += { path: 'monde.indices[].mene_a[]', espace: 'indice', location: 'Indices' }

// brain/utils/references.ts — promotion, PAS une abstraction neuve : 2 appelants réels
export function avecOrpheline(
	options: SelectOption<string>[], valeur: string, espace: EspaceDeNoms,
): SelectOption<string>[]
```

Correctifs portés par ce lot, avec leur borne :
- `validate.ts:386` → `if (site.valeur === undefined) continue` puis non-chaîne ⇒ `identifiant-invalide`. La chaîne vide reste calme — `''` est très probablement ce qu'écrit un `Select` « aucun » sur `objectif_id` ; la durcir casserait un chemin d'édition vivant. Deux tests de non-régression nommés sur `objectif_id` et `apres_indice_id` (trous préexistants, même cause racine).
- `identifiers.ts:211` → `feuille.replace(/\[\d*\]$/, '')`, test dédié sur `'monde.indices[].mene_a[]' → 'mene_a'`.
- Trou n°3 (`mene_a` non-tableau) : à trancher par le comité, pas par `dev-contrat`. Option A — table `LISTES_OPTIONNELLES_TEXTUELLES` + boucle calquée sur 6 quater (~15 lignes), deux lignes dès le premier jour (`mene_a`, `caractere.parler`), zéro fichier de feature touché. Option B — accepter, KR daté citant `parler`. Je recommande A.

**Lot 2 — `feature` — démarre contrat figé, le lit comme donnée immuable.**

- N `src/features/dossier-registres/index.ts`
- N `src/features/dossier-registres/components/PanneauIndices.tsx`
- N `src/features/dossier-registres/components/FicheIndice.tsx`
- N `src/features/dossier-registres/components/styles.ts`
- N `src/features/dossier-registres/tests/panneauIndices.test.tsx`
- R `src/App.tsx`

Consomme uniquement : `type Indice`, `avecOrpheline`, `localiserEntite`, `frapperIdentifiant('indice')`, `useOpenDossier`, `dossiers.update`, `{Field, Card, ListRow, IconButton, Select}`.

Vérifié à la lecture, et c'est ce qui rend le lot 2 étanche : `DossierEditorScreen` déclare `panneaux?: Partial<Record<SectionId, ReactNode>>` (`DossierEditorScreen.tsx:14`) et `SECTIONS` porte déjà `id: 'indices'` (`sections.ts:102`). Aucun fichier de `bascule-editeur` n'entre dans aucun lot — la seule couture est la clé `indices` du prop dans `App.tsx` (KR-184 tenu). `tree-canvas` et `dossier-canon` : zéro fichier, KR-204/205 tenus par construction.

Deux lots ⇒ exécution séquentielle, ni worktree ni fusion.