RISQUE — le veto du tour 1 tient sans retouche : `DELTAS` doit sortir de `brain/index.ts` pour un consommateur nommé, et une projection `EFFETS` dérivée reste un contournement de contrat. Rien dans les trois notes ne le déplace.

OBJECTION — durcie sur `etape`. Personne ne l'a défendu, et l'UX le dit mieux que moi (« `etape` dérivé de l'index »). Un ordinal stocké est de l'état dérivé miroité DANS LA SSOT (KR-013) ; `plan_actions[].etape` a déjà produit `1,3,4`. Je ne demande plus une renumérotation gardée : le champ disparaît, `EtapeQuete { libelle }`. La liste reste une liste d'objets, jamais `string[]` : seules les listes d'objets sont contrôlées élément par élément (BUG-050).

PROPOSITION — `consigne` vs `enonce`, réponse nommée au PM : je retire `enonce`. Vérifié pour les deux : `Quete extends Entite` ne porte que `id`/`nom`/`recompense`, aucun voisin `objectif_id` ni `but` — aucune collision de schéma dans les deux cas. Mais `charpente.jalons[].enonce_texte` existe (`ia`, ≤ 20 mots, le fait accompli) : `enonce` recrée en espace de clés le piège de compréhension que j'opposais à `but`. `consigne` n'a aucun homonyme de clé. Audience : rien ne la contraint mécaniquement (détail en annexe). Je maintiens `auteur` par réversibilité (le PM tranche `ia`, motif produit accepté).

Les quatre tests QA entrent sans fichier neuf.

VERDICT — recevable sous réserve : `consigne`, `libelle` requis, pas de champ `etape`, allow-list en lot 1.

---

## Annexe — liste de fichiers inchangée (voir tour1-tech-lead.md), quatre corrections de contenu

**1. Lot 1 — `types.ts`**

```ts
export interface EtapeQuete {
	/** REQUIS DANS SON ÉLÉMENT (la liste reste optionnelle) — motif `contre_mesures[].action`.
	 *  AUCUN champ `etape` : l'ordre EST l'index du tableau. Un ordinal stocké serait
	 *  de l'état dérivé miroité dans la SSOT, et `plan_actions[].etape` a montré la
	 *  divergence (`useEcriturePlan.ts:270` retire sans renuméroter -> 1,3,4). */
	libelle: string
}

export interface Quete extends Entite {
	recompense: Delta[]     // INCHANGÉ
	donneur_id?: string     // espace `pnj`
	consigne?: string       // JAMAIS `objectif` (KR-198), JAMAIS `enonce` (cf. jalons[].enonce_texte)
	etapes?: EtapeQuete[]   // liste d'OBJETS, jamais string[] (BUG-050)
	echeance?: string
}
```

**2. Lot 1 — `destinations.ts` : QUATRE lignes** (et non cinq — `etapes[].etape` disparaît)

```ts
'monde.quetes[].donneur_id': 'moteur',
'monde.quetes[].echeance': 'auteur',
'monde.quetes[].consigne': 'ia',
'monde.quetes[].etapes[].libelle': 'ia',
```

**3. Lot 1 — `couverture.test.ts`** : deux dispenses `PROSE_D_ENTITE_LIBRE` (`consigne`, `echeance`), compte remesuré (KR-159, jamais recopié). Aucune dispense pour `etapes[].libelle` — il est REQUIS, donc couvert par la corruption.

**4. Placement des quatre tests QA — zéro fichier neuf, confirmé** : non-régression Delta existants + doublons acceptés par le validateur → lot 1 (`deltas.test.ts`/`validate.test.ts`) ; cible orpheline + doublons rendus en deux lignes + état vide dédié → lot 2 (`panneauQuetes.test.tsx`).

**Inchangé** : les deux lots, leurs listes de fichiers, la propriété disjointe, les trois règles de rendu d'`EditeurEffets`, l'allow-list de `deltas.test.ts:160-181` écrite en lot 1 et verte dans les deux lots. `useEcritureEtapes.ts` reste pré-autorisé (KR-112) mais perd sa renumérotation : `handleRetirerEtape` redevient un `filter` nu.
