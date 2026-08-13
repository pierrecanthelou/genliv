## Note d'ouverture — tech-lead, `dossier-fiches` it4 (tour 1)

**RISQUE** — `contre_mesures[]` est la **première liste optionnelle d'objets** du schéma, et elle tombe dans le trou que la correction de BUG-050 n'a pas fermé : `LISTES_A_ELEMENTS_STRUCTURES` est dérivée de `LISTES_REQUISES` **seule** (`tables.ts:252`). `contre_mesures: ["embuscade"]` traverse `validateDossier` en `ok:true`, et le dossier gelé promet un `ContreMesure` là où il y a une chaîne — le contrat entre les deux temps ment. it5 en apporte deux de plus (`relations[]`, `presence[]`) : trois appelants nommés, la parade n'est pas spéculative.

**OBJECTION** — le **critère d'acceptation #7 est inatteignable tel qu'écrit**. `plan_actions` porte `alerteSansExpr: false` (`tables.ts:399-404`), et `dossier-reference.json` contient trois `declencheur_texte` sans jumeau (Sélène, Tobin, Aubry) que le critère #8 exige **sans avertissement**. Le bandeau D1 promis ne peut jamais s'allumer — doctrine déjà appliquée deux fois (it1, it3). À réécrire ou retirer **avant** l'essaim. Seconde objection, sur le **nom** et non l'audience (que je ne rouvre pas) : `contre_mesures[].portee` réutilise la clé d'un registre fermé déjà porté par la même entité (`Personnage.portee`) — la collision `plan`/`plan_actions` classée irréversible.

**PROPOSITION** — `monde.personnages[].plan_actions[].action` est déjà `CHAMPS_REQUIS` non vide : un « + Ajouter une étape… » qui sème `action: ''` est **refusé au SSOT**. Imposer le motif brouillon : la ligne neuve reste locale, n'entre au document qu'au premier blur non vide. Contrepartie utile — vider une étape persistée devient le **premier refus réellement atteignable** de la feature : le bandeau `statut:'refuse'` gagne enfin son test sans mock.

**VERDICT** — **recevable sous réserve** (critère #7 réécrit ; trou de liste optionnelle fermé dans le lot contrat).

---

## ANNEXE

### A. Découpage en lots — propriété de fichiers disjointe

| Lot | Nature | Fichiers (N = créé, R = remplacé) | Exécution |
|---|---|---|---|
| **1** | **contrat** | `src/brain/dossier/types.ts` (R) · `tables.ts` (R) · `destinations.ts` (R) · `validate.ts` (R, **seulement** si `duree`/`delai` sont des entiers) · `__fixtures__/dossier-minimal.json` (R) · `__fixtures__/dossier-reference.json` (R) · `couverture.test.ts` (R) · `validate.test.ts` (R) · `src/brain/index.ts` (R, export `ContreMesure` + `But`) | **Seul, en premier** (KR-190) |
| **2** | feature | `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts` (N) · `components/BlocPlanActions.tsx` (N) · `components/BlocCaracteristiques.tsx` (N) · `components/PanneauPersonnages.tsx` (R) · `components/FichePersonnage.tsx` (R) · `components/styles.ts` (R) · `tests/panneauPersonnages.test.tsx` (R) · `tests/fichePersonnage.test.tsx` (R) | **Séquentiel**, après lot 1 |
| **3** *(optionnel)* | fallout | `src/features/dossier-canon/components/ObjectifsCanon.tsx` (R) · `tests/objectifsCanon.test.tsx` (R) | **Parallélisable** avec le lot 2 (zéro fichier commun) |

Zéro fichier nommé deux fois. **Lot 3 seulement si** le comité garde en périmètre l'`open_question` reportée à it4 (`statut:'absent'` affiché inconditionnellement sur une carte vide dans `ObjectifsCanon`) ; sinon, **2 lots séquentiels, pas d'essaim** — précédent it2/it3, et le découpage révèle le parallélisme, il ne le fabrique pas.

**Je n'ai pas coupé le lot 2 en « écriture » / « rendu ».** C'était le seul autre plan à 4 lots envisageable, et il échoue la règle 3 : `BrouillonPersonnage`/`ChampTexte`/`FichePersonnageProps` vivent dans `PanneauPersonnages.tsx`, chaque champ neuf ajoute *à la fois* un handler et une prop — les deux lots ne compileraient pas isolément sans extraire un fichier de contrat feature-local que la décision d'it2 a explicitement refusé.

### B. Signatures exactes (lot 1 → lue comme donnée immuable par le lot 2)

```ts
// brain/dossier/types.ts
export interface But {
	/** IA — le but propre du personnage. REQUIS DANS LE BLOC (ligne CHAMPS_REQUIS). */
	libelle: string
	/** IA — le mobile. */
	pourquoi?: string
	/** destination à trancher : voir § C. */
	echeance?: string
}

export interface PlanAction {
	etape: number
	action: string
	declencheur_texte?: string
	declencheur_expr?: ExprNode
	duree?: number | string   // ← § C, le TYPE commande le coût de validation
	si_bloque?: string        // IA — didascalie, JAMAIS de jumeau `_expr` (précédent `cede_si`)
}

export interface ContreMesure {
	action: string            // IA — seule clé `ia` de la famille (précédent plan_actions[].action)
	declencheur_texte?: string
	declencheur_expr?: ExprNode
	delai?: number | string   // § C
	portee?: PorteeContreMesure // ⚠ registre NEUF, jamais `Portee` — voir objection 2
}

export interface Personnage extends Entite {
	/* … */
	but?: But
	contre_mesures?: ContreMesure[]
}
```

```ts
// brain/dossier/tables.ts — 7e entrée
{ expr: 'monde.personnages[].contre_mesures[].declencheur_expr',
  texte: 'monde.personnages[].contre_mesures[].declencheur_texte',
  location: 'Personnages', alerteSansExpr: false }   // symétrie stricte avec plan_actions

// + ligne CHAMPS_REQUIS
{ path: 'monde.personnages[].but.libelle', location: 'Personnages' }
// mécanique identique à `stats` total : `but` absent ⇒ AUCUN site (sitesDe coupe sur !estObjet), donc calme.

// + fermeture du trou BUG-050 sur liste OPTIONNELLE
export const LISTES_OPTIONNELLES_STRUCTUREES: readonly ChampRequis[] = [
	{ path: 'monde.personnages[].contre_mesures', location: 'Personnages' },
]
export const LISTES_A_ELEMENTS_STRUCTURES = [...LISTES_REQUISES, ...LISTES_OPTIONNELLES_STRUCTUREES]
	.filter((l) => !COLLECTIONS_IDENTIFIEES.some((c) => c.path === l.path))
// ⚠ le compte « TROIS chemins » épinglé par couverture.test.ts passe à QUATRE — à REMESURER, jamais à recopier (KR-159).
```

```ts
// brain/dossier/destinations.ts — le commentaire de fin de fichier (lignes 254-269) est SUPPRIMÉ
// et remplacé par ses 5 lignes + les nouvelles :
'monde.personnages[].but.libelle': 'ia',
'monde.personnages[].but.pourquoi': 'ia',
'monde.personnages[].but.echeance': /* § C */,
'monde.personnages[].plan_actions[].duree': /* § C */,
'monde.personnages[].plan_actions[].si_bloque': 'ia',
'monde.personnages[].contre_mesures[].action': 'ia',
'monde.personnages[].contre_mesures[].declencheur_expr': 'moteur',
'monde.personnages[].contre_mesures[].declencheur_texte': 'auteur',
'monde.personnages[].contre_mesures[].delai': 'moteur',
'monde.personnages[].contre_mesures[].portee': 'moteur',
```
Chaque ligne exige **une instance dans les DEUX fixtures** (`couverture.test.ts` : ligne sans instance = ligne morte ; feuille sans ligne = rougit ; `suffisance.test.ts` : clés(reference) ⊆ clés(minimal)).

```ts
// features/dossier-fiches/hooks/useEcriturePersonnages.ts — LOT 2, un seul appelant ASSUMÉ :
// l'extraction est motivée par KR-112 (taille), pas par la réutilisation. Dit ici pour
// qu'on ne la relise pas comme une abstraction spéculative.
export function useEcriturePersonnages(args: {
	dossierId: string
	dossier: Dossier
}): {
	personnageAffiche: Personnage | undefined
	selectionner: (id: string) => void
	brouillonActuel: (p: Personnage) => BrouillonPersonnage
	refusPour: (personnageId: string) => { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	handleAjouter: () => void
	handleChangeChamp / handleBlurChamp / handleChangeCamp / handleChangePortee /
	handleChangeObjectif / handleReglerCaracteristiques / handleChangeCaracteristique  // inchangés
	handleChangeBut: (id: string, champ: keyof But, valeur: string) => void
	handleAjouterEtape / handleChangeEtape / handleRetirerEtape
	handleAjouterContreMesure / handleChangeContreMesure / handleRetirerContreMesure
}
```
Les **deux indexations de KR-197** (affichage / invalidation) et la clause `resout: false` de `handleAjouter` **migrent telles quelles** : c'est le point de rupture le plus probable de l'extraction, et les deux tests nommés d'it2 (BUG-065/066) doivent rester **verts sans être modifiés** — s'ils demandent une retouche, l'extraction est fausse.

### C. Les deux points que le comité doit trancher — ce que la forme impose

| Champ | Forme tenable | Coût en lignes de contrat | Ce que je refuse |
|---|---|---|---|
| `but.echeance` | `string` optionnelle | 0 ligne de `validate.ts`, 1 ligne de destination, 2 instances de fixture | Aucune contrainte de forme : l'arbitrage est **purement d'audience**. Je recommande **`auteur`** — aucun consommateur avant la n° 14, et `auteur → moteur/ia` se desserre plus tard **gratuitement**, l'inverse est impossible une fois qu'un modèle l'a lu (même asymétrie du regret qu'à it3) |
| `plan_actions[].duree` **et** `contre_mesures[].delai` | **Même type, même destination, ou un discriminant écrit** | **Prose** : 0 ligne de `validate.ts`, mais alors la ligne pré-arbitrée `delai → moteur` est une promesse que le code ne peut pas tenir. **Entier** : +1 table `CHAMPS_ENTIERS` (3 chemins : `etape`, `duree`, `delai`) + ~8 lignes dans `validate.ts` + 2 tests | Un `moteur` sur de la prose libre. Le commentaire pré-arbitré fixe l'**audience**, pas le **type** — le type est mon terrain, et il doit être choisi **dans ce lot** |
| `plan_actions[].si_bloque` | `string`, **`ia`** | 1 ligne de destination | Tout jumeau `_expr` et toute entrée dans `FAMILLES_DE_CONDITIONS` : c'est une **didascalie**, précédent `cede_si` déjà écrit au `design_contract` |

### D. Critères de sortie mesurés que je demande au plan (KR-112, dette datée par it3)

1. `wc -l src/features/dossier-fiches/components/FichePersonnage.tsx` **< 400** à la fusion (442 aujourd'hui ; l'extraction de `BlocCaracteristiques.tsx` rend ~100 l., et le bloc 4 neuf **ne rentre jamais** dans ce fichier).
2. `wc -l src/features/dossier-fiches/components/PanneauPersonnages.tsx` **< 400** (466 aujourd'hui ; le hook rend ~200 l., et **tous** les handlers neufs d'it4 naissent dans le hook).
3. Les deux mesures dans la revue d'itération, comme les 4 scores de mutation — un seul des deux fichiers traité = KR-112 non traité.
4. `BlocCaracteristiques.tsx` conserve le `focusApresReglageRef` **porteur d'identité** : l'`Accordion` laisse les blocs fermés **montés** (`display:none`, `Accordion.tsx:19-21`), mais `<Accordion key={personnage.id}>` **remonte** au changement de personnage — l'extraction déplace donc l'invalidation de « comparaison d'identité » vers « remontage ». Même résultat, mécanisme différent : à écrire dans la docstring, et le test d'it3 sur l'intention pendante doit rester vert **inchangé**.
