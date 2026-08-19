RISQUE — `nature` stocké est une seconde source de vérité pour « cet événement est un combat », déjà portée par `monstre_ref`. Trois valeurs, dont une dérivable et deux (`scene`/`obstacle`) qu'aucune donnée ne distingue et qu'aucun consommateur ne lit. Stocké, il ouvre un invariant croisé jamais arbitré (`nature:'monstre'` sans `monstre_ref`, et l'inverse) — donc des branches neuves dans `validate.ts`. C'est le troisième passage du même anti-patron dans cette feature (`tier` KR-192, `lie_au_canon` KR-206, `Indice.portee`). Risque n° 2, propre à it4 : `EditeurEffets` passe d'**une** instance par fiche (it3) à **N** — une par résolution —, chacune portant un brouillon en `useState` local. Clé React = index + retrait d'une résolution du milieu = le brouillon migre vers la voisine.

OBJECTION — le but dit « porter ses propres résolutions via `EditeurEffets` » comme si c'était un geste. C'en est deux, imbriqués : `resultat` est CHAMPS_REQUIS (brouillon différé, KR-214), et chaque `consequence` a son propre ajout à deux temps. Second trou : l'interrupteur est écrit comme un booléen, mais `SegmentedControl<T extends string>` ne prend pas de booléen, et rien ne dit dans quel onglet tombe un événement dont `lie_a_histoire` est **absent** — cas de tout événement déjà persisté.

PROPOSITION — chiffré :
1. `nature` **retiré d'it4** : 0 ligne de schéma, 0 registre, 0 export. Le libellé « monstre » se dérive au rendu de `monstre_ref`.
2. `lie_a_histoire` : 1 ligne `ENUMERES_FERMES` `{valeurs:[true,false], requis:false}` (précédent `relations[].secret`), 1 ligne `DESTINATION_DES_CHAMPS` → `moteur`. **Absent = libre**, l'onglet écrit la valeur explicitement.
3. Exporter `PREFIXE_BESTIAIRE` (2 lignes) plutôt que retaper `'bestiaire.'` à l'écran — jurisprudence `CARACTERISTIQUE_MIN`, KR-165/117.
4. Retrait d'une résolution persistée : **hors périmètre** (sinon clé stable exigée).

VERDICT — **recevable sous réserve** (points 1 et 4 sont des vetos si refusés en l'état).

---

## ANNEXE — découpage en lots (esquisse, hors quota)

**2 lots, séquentiels.** Aucun parallélisme réel : le lot 2 lit le contrat figé. Patron identique à it1/it2/it3 (KR-210 : un seul lot `contrat`).

### Lot 1 — `evenements-contrat` — `contrat` (seul, en premier)

| | Fichier | N/R |
|---|---|---|
| 1 | `src/brain/dossier/types.ts` | R |
| 2 | `src/brain/dossier/tables.ts` | R |
| 3 | `src/brain/dossier/destinations.ts` | R |
| 4 | `src/brain/dossier/validate.ts` | R *(un seul mot-clé `export` devant `PREFIXE_BESTIAIRE`, aucune branche)* |
| 5 | `src/brain/index.ts` | R |
| 6 | `src/brain/dossier/couverture.test.ts` | R |
| 7 | `src/brain/dossier/validate.test.ts` | R |
| 8 | `src/brain/dossier/__fixtures__/dossier-minimal.json` | R |
| 9 | `src/brain/dossier/__fixtures__/dossier-reference.json` | R |

**Signature exposée, exacte :**
```ts
// types.ts
export interface Evenement extends Entite {
	monstre_ref?: string
	declencheur_texte?: string
	declencheur_expr?: ExprNode
	/** ABSENT = libre. Jamais `null`. */
	lie_a_histoire?: boolean
	resolutions: Resolution[]
}
// tables.ts — ENUMERES_FERMES
{ path: 'monde.evenements[].lie_a_histoire', location: 'Événements', valeurs: [true, false], requis: false }
// destinations.ts — DESTINATION_DES_CHAMPS
'monde.evenements[].lie_a_histoire': 'moteur'
// validate.ts (existant, rendu public) + brain/index.ts
export const PREFIXE_BESTIAIRE = 'bestiaire.'
```

**Bornes** : aucun `NATURES_EVENEMENT`, aucun `NatureEvenement` (proposition 1) → KR-215 **sans objet, vérifié** : le seul export neuf est une constante, `deltas.test.ts` ne la grep pas et son allow-list reste à deux entrées inchangées (`EditeurEffets.tsx` y figure déjà). `lie_a_histoire` doit être instancié dans **les deux** fixtures (règle « aucune ligne morte dans `DESTINATION_DES_CHAMPS` »), la minimale restant sans avertissement. Ne touche ni `identifiers.ts`, ni `amorce.ts`, ni `sections.ts`, ni `deltas.ts` (`monde.evenements: []` déjà semé, `SECTIONS[8].id === 'evenements'` déjà là, `monstre_ref`/`resolutions` déjà validés — lu, pas supposé). Aucune référence neuve vers l'espace `pnj` → le ricochet `dossier-format/tests/importDossier.test.tsx` (3 précédents) **ne devrait pas** se déclencher : à vérifier par exécution, pas à supposer.

### Lot 2 — `evenements-ecran`

| | Fichier | N/R |
|---|---|---|
| 1 | `src/features/dossier-registres/components/PanneauEvenements.tsx` | N |
| 2 | `src/features/dossier-registres/components/FicheEvenement.tsx` | N |
| 3 | `src/features/dossier-registres/hooks/useEcritureResolutions.ts` | N |
| 4 | `src/features/dossier-registres/tests/panneauEvenements.test.tsx` | N |
| 5 | `src/features/dossier-registres/components/styles.ts` | R |
| 6 | `src/features/dossier-registres/index.ts` | R |
| 7 | `src/App.tsx` | R *(une entrée `evenements:`)* |

**Consomme (lecture immuable du contrat)** : `type Evenement`, `type Resolution`, `type Delta`, `type DeltaId`, `type EspaceDeNoms`, `BESTIARY`, `PREFIXE_BESTIAIRE`, `avecOrpheline`, `localiserEntite`, `frapperIdentifiant('evenement')`, `useOpenDossier`, `dossiers.update`, `{Field, Card, ListRow, IconButton, Select, SegmentedControl, IssueList}`.

**`EditeurEffets.tsx` n'apparaît dans AUCUN lot** — réutilisé sans une ligne modifiée, condition d'architecture d'it3 (critère #6 de la feature : la preuve est l'absence du fichier de la liste). Sa signature consommée, telle quelle, une instance **par résolution** :
```tsx
<EditeurEffets
  titre="CONSÉQUENCES"           // legende / texteVide propres aux événements
  effets={resolution.consequence}
  entitesParEspace={...}
  onAjouterEffet={(effet) => ajouterEffet(rangResolution, effet)}
  onChangerCible={(i, rang, v) => changerCible(rangResolution, i, rang, v)}
  onRetirerEffet={(i) => retirerEffet(rangResolution, i)}
/>
```
Les trois callbacks se **ferment** sur `rangResolution` côté `FicheEvenement` : `EditeurEffets` continue d'ignorer qu'il en existe plusieurs — aucune prop d'index ne lui est ajoutée (encapsulation, Déméter).

**Bornes** : `FicheQuete.tsx` fait déjà 277 lignes ; `FicheEvenement` porte plus (`monstre_ref` + déclencheur + résolutions à deux niveaux) → extraction pré-autorisée vers `useEcritureResolutions.ts` (KR-112). **Pas de bandeau D1** sur cette section : `FAMILLES_DE_CONDITIONS` porte `alerteSansExpr: false` sur `evenements` (`tables.ts:686-690`) — le silence est un résultat du validateur, pas une omission de rendu. Aucun fichier de `bascule-editeur`, `dossier-canon`, `dossier-fiches`, `tree-canvas` (KR-184/204/205 tenus par construction).
