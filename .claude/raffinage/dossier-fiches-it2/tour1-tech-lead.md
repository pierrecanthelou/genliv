# TOUR 1 — Tech Lead · `dossier-fiches` it2

**RISQUE** — Le brouillon devient multi-champs. Aujourd'hui `brouillonsNom` est semé une fois au montage et replié par objet (garde BUG-058). Avec quatre champs, un objet existant mais incomplet (clé `fonction` arrivée après le montage par réconciliation cloud) n'active plus le repli : le champ s'affiche vide alors que le document porte une valeur, et le blur suivant réécrit ce vide. C'est BUG-064 d'un cran plus bas — la lecture, pas l'écriture — et it2 est la première fois que ce panneau porte de la prose multiple.

**OBJECTION** — Contre le cadrage : le lot contrat ne doit toucher **ni `tables.ts` ni `validate.test.ts`**. Mesure faite sur le précédent exact — `Lieu.description/ambiance/dangers`, trois proses optionnelles `ia` — : ces chemins n'apparaissent dans aucun des deux. KR-190 (« toujours les 8 mêmes fichiers ») est faux pour une tranche de prose pure, et écrire `tables.ts(?)` invite le dev-contrat à inventer un budget de mots pour remplir la liste. Or cette ligne n'est pas gratuite : un budget produit un `warning`, que KR-183/KR-189 obligent à **rendre** — soit une seconde surface d'écran dans l'itération qu'on vient de couper pour cause de taille. Trancher : rien du tout.

**PROPOSITION** — 2 lots séquentiels (5 fichiers, puis 4), sans essaim ni worktree. `RefusEnCours { personnageId, statut, issues }` vit dans `PanneauPersonnages`, `FichePersonnage` ne reçoit que `{statut, issues}`. Affichage : `refus.personnageId === personnageAffiche.id`. Invalidation : un commit réussi n'efface que sur le **même** `personnageId`. Seul statut atteignable en it2 : `'absent'`, éprouvé par un **second `createBrain()`** qui supprime le dossier (l'autre onglet) — sinon `dossier:deleted` fait retomber la vue à `null` avant le bandeau.

**VERDICT** — `recevable sous réserve` : pas de `tables.ts` ; retrait reporté à it4 ; test d'écriture à deux personnages livré dans le lot.

---

## ANNEXE — Découpage en lots (propriété de fichiers disjointe)

**2 lots. Aucun fichier partagé. Exécution strictement séquentielle : lot 1 seul, figé, puis lot 2.**

### Lot 1 — `contrat-identite-personnage` · type `contrat` · ouvrier `dev-contrat`

But : poser les trois champs de prose sur `Personnage`, déclarer leur audience, les instancier dans les deux fixtures pour que la déclaration ne soit pas une ligne morte.

| Fichier | N/R | Geste exact |
|---|---|---|
| `src/brain/dossier/types.ts` | R | 3 champs optionnels sur `Personnage`, après `objectif_id` |
| `src/brain/dossier/destinations.ts` | R | 3 lignes `'ia'`, après `'monde.personnages[].objectif_id'` |
| `src/brain/dossier/__fixtures__/dossier-minimal.json` | R | les 3 champs sur le personnage existant |
| `src/brain/dossier/__fixtures__/dossier-reference.json` | R | au moins 1 PNJ sur 6 porte les 3 champs |
| `src/brain/dossier/couverture.test.ts` | R | 3 entrées dans `LIBRES` sous `PROSE_D_ENTITE_LIBRE` |

**Explicitement NON touchés** (à écrire dans le plan, sinon un agent les touchera) : `tables.ts`, `validate.ts`, `validate.test.ts`, `suffisance.test.ts`, `brain/index.ts` (aucun symbole neuf exporté — trois champs sur un type déjà exporté).

Signature exposée, figée pour le lot 2 :

```ts
export interface Personnage extends Entite {
	portee: Portee
	plan_actions: PlanAction[]
	savoirs: Savoir[]
	camp?: CampPersonnage
	objectif_id?: string
	fonction?: string            // IA
	apparence?: string           // IA
	description_joueur?: string  // IA, convention _joueur de dossier-format
}

// destinations.ts
'monde.personnages[].fonction': 'ia'
'monde.personnages[].apparence': 'ia'
'monde.personnages[].description_joueur': 'ia'
```

Piège nommé (load-bearing, l'agent ne peut pas le demander plus tard) : le motif `PROSE_D_ENTITE_LIBRE` de `couverture.test.ts` dit textuellement « aucun `BUDGETS_DE_MOTS` sur `monde.lieux[]` ». Réutilisé tel quel pour un personnage, la dispense cesse de dire pourquoi elle existe. Généraliser la parenthèse en « aucune entrée de `BUDGETS_DE_MOTS` sur ces chemins » — une constante, six clés, pas une seconde constante.

### Lot 2 — `bloc-identite-et-issue-d-ecriture` · type `feature` · ouvrier `dev-lot`

But : le bloc « Identité » (3 champs, brouillon + commit au blur), la remontée de `EcritureDossier`, le bandeau indexé, le recalage des placeholders, le test d'écriture à deux personnages.

| Fichier | N/R | Geste exact |
|---|---|---|
| `src/features/dossier-fiches/components/PanneauPersonnages.tsx` | R | brouillon à 4 champs, `commit` rendant `EcritureDossier`, `RefusEnCours` |
| `src/features/dossier-fiches/components/FichePersonnage.tsx` | R | bloc 2 rempli, bandeau, `BLOCS_VIDES` recalé à 6 entrées |
| `src/features/dossier-fiches/components/BlocIdentite.tsx` | N *(conditionnel)* | seulement si `FichePersonnage.tsx` dépasse ~250 l. — même propriétaire, aucune collision possible (précédent `FicheLieu.tsx`) |
| `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` | R | lecture au montage sur 2 entités + **écriture** sur 2 entités + 6 placeholders |

Signatures consommées / exposées :

```ts
// PanneauPersonnages.tsx — internes
interface BrouillonPersonnage { nom: string; fonction: string; apparence: string; description_joueur: string }
type ChampTexte = keyof BrouillonPersonnage

// Indexé par le personnage EN CAUSE (KR-197, 4e occurrence). `statut` est repris
// de l'union du service, jamais d'une taxonomie maison.
interface RefusEnCours { personnageId: string; statut: 'absent' | 'refuse'; issues: DossierIssue[] }

function commit(personnages: Personnage[], personnageId: string): EcritureDossier
// invalidation : succès sur un AUTRE personnage ⇒ le refus précédent SURVIT.

// FichePersonnage.tsx — props (delta d'it1)
- onChangeNom: (valeur: string) => void
- onBlurNom: (valeur: string) => void
+ brouillon: BrouillonPersonnage
+ refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null   // déjà filtré par le parent
+ onChangeChamp: (champ: ChampTexte, valeur: string) => void
+ onBlurChamp: (champ: ChampTexte, valeur: string) => void

// BlocIdentite.tsx (si extrait) — purement de rendu, aucun état
export interface BlocIdentiteProps {
	brouillon: Pick<BrouillonPersonnage, 'fonction' | 'apparence' | 'description_joueur'>
	onChangeChamp: (champ: ChampTexte, valeur: string) => void
	onBlurChamp: (champ: ChampTexte, valeur: string) => void
}
```

Recalage des placeholders (conséquence du redécoupage, à écrire chiffré sinon il sera fait au jugé) : `BLOCS_VIDES` passe de 7 à **6** entrées — Caractéristiques → **3**, Objectif & plan d'actions → **4**, Savoirs/Relations/Présence → **5**, Caractère exploitable → **6**. Le test épingle `toHaveLength(6)` et les comptes `1/1/3/1`.

Repli par champ (le risque ci-dessus, coût nul) : `brouillons[id]?.fonction ?? personnage.fonction ?? ''`, jamais un repli par objet.

### Réponses aux quatre questions posées

1. **`tables.ts`** — rien du tout. Ni budget de mots, ni champ requis. Précédent mesuré : les trois proses de `Lieu` n'y ont aucune ligne, et un budget traînerait une surface d'avertissement dans le lot.
2. **KR-112** — `PanneauPersonnages.tsx` : 291 l. + ~35 ≈ **325 l.**, sous le seuil ; `PanneauLieux.tsx` vit au même niveau avec la même anatomie. Aucune extraction du panneau. Extraction possible de `BlocIdentite.tsx` côté fiche, **dans le même lot**, jamais comme lot séparé.
3. **Fichiers disjoints malgré le couplage panneau ↔ fiche** — on ne les obtient pas, et on n'a pas à les obtenir. Les trois candidats de troisième lot (retrait, recalage, bandeau) nomment tous les trois mêmes fichiers ; un contrat extrait pour les séparer serait une abstraction à un seul appelant. Le découpage révèle le parallélisme, il ne le fabrique : **2 lots séquentiels, aucun worktree, aucune fusion**.
4. **`RefusEnCours`** — dans `PanneauPersonnages.tsx`, seul propriétaire de `dossierId`, de la sélection et de l'écriture ; la fiche ne reçoit jamais l'identifiant. Deux indexations distinctes et nommées : **affichage** = `refus.personnageId === personnageAffiche.id` (sinon le bandeau reste sous la fiche d'un innocent, BUG-061) ; **invalidation** = un commit réussi n'efface que sur le même `personnageId` (sinon un succès ailleurs efface un refus non résolu, BUG-056). Les deux se prouvent sur **deux** personnages, jamais un.

### Décisions que le comité doit acter au tour 3

- **Retrait d'un personnage** : **trancher = ne pas livrer en it2**, porter en **it4**. Motif : aujourd'hui aucun retrait de personnage n'est refusable au SSOT ; `relations[].cible_id` (it4, ex-it4 savoirs/relations/présence) est la première référence qui rend le refus réel — le retrait y arrive avec sa preuve au lieu d'un bouton dont l'échec ne peut pas être testé.
- **Statut atteignable du bandeau en it2** : `'absent'` seul. `'refuse'` reste structurellement inatteignable depuis ce panneau et le devient plus tard — **sans réécriture**, la branche venant de l'union du service.
