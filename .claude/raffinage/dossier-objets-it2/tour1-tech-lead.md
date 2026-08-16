# Note d'ouverture — Tech Lead (tour 1)

```
RISQUE — Il n'est pas dans brain/, il est dans la fixture. Les TROIS objets de
dossier-reference.json sont référencés : objet.sceau-de-cendre (objectif
reussi_si_expr/echoue_si_expr, predicat possede_objet), objet.lanterne-de-corvin
(savoir revele_si.contrepartie + delta retirer_objet d'un événement),
objet.amulette-scellee (delta donner_objet de quete.retrouver-la-vigie). Un test
de discriminance écrit « sur la référence » n'a AUCUN objet retirable : il
prouverait un refus global tout en paraissant vert. C'est KR-202 à l'envers.

OBJECTION — Deux, sur la définition telle qu'écrite.
1. Le goal promet « nomme le personnage/savoir fautif ». Le SSOT nomme le
   PERSONNAGE (location résolue par sitesDe/localiserEntite) et JAMAIS le savoir :
   l'entrée tables.ts:484 ne porte pas de `sujet`, le rendu est « Le champ
   « objet_id » pointe « objet.x », qui n'existe pas dans ce dossier. ». Nommer le
   savoir exigerait un `sujet` DYNAMIQUE dans ReferenceSimple — un lot contrat qui
   ripple sur les sept références pour une phrase. On réécrit le goal, pas le contrat.
2. PanneauObjets.tsx est à 339 lignes. Le retrait (RefusEnCours indexé + modale +
   focus + boutonAjouterRef dans DEUX branches) le porte à ~420 : au-dessus du
   signal KR-112, sur la dernière itération de la feature — donc sans itération
   suivante pour le résorber (précédent FichePersonnage.tsx à 443).

PROPOSITION — chiffrables.
P1. Discriminance : refus sur objet.lanterne-de-corvin, succès sur un objet SEMÉ
    par semerObjet() — même test. Assertion `issues.length >= 1` + le nom du
    personnage, jamais toHaveLength(1) : la lanterne produit DEUX pendantes.
P2. Extraire PanneauObjets.tsx:241-339 (99 lignes de CSSProperties) vers
    components/styles.ts → panneau à ~320 lignes après retrait.
P3. EYEBROW_REFUS/TEXTE_ABSENT : re-déclarés LOCALEMENT (3e copie). Les promouvoir
    en brain/ obligerait à réécrire dossier-canon et dossier-fiches, déjà `done` —
    territoire de veto (KR-200). Ouvrir une open_question, pas un lot contrat.

VERDICT — recevable sous réserve (objections 1 et 2 levées par P1–P3).
```

---

## Annexe

### (a) Aucun `brain/` n'est nécessaire — **CONFIRMÉ**

Trois vérifications :

1. **`C:\Users\pierr\Desktop\genliv\src\brain\dossier\tables.ts:484`** — l'entrée existe déjà, avec son espace :
   `{ path: 'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id', espace: 'objet', location: 'Personnages' }`
2. **`C:\Users\pierr\Desktop\genliv\src\brain\dossier\validate.ts:384-415`** — la boucle est **générique** sur `REFERENCES_SIMPLES` : `for (const reference of REFERENCES_SIMPLES) { for (const site of sitesDe(...)) { … if (idsPortes.has(site.valeur)) continue; errors.push(anomalie('reference-pendante', 'error', …)) } }`. Retirer un objet encore cité produit donc un `error` **sans une ligne de code neuf**, et `DossierService.update` rend `{ statut: 'refuse', errors, warnings }` (`DossierService.ts:56-59`).
3. **La non-régression est déjà tenue dans `brain/`** — `validate.test.ts:2627` couvre nommément ce chemin. Le message est propre (aucun fossile « réimportez »).

Une nuance à ne pas découvrir en aval : le refus ne vient **pas seulement** des savoirs. `expr.ts`/`deltas.ts` résolvent aussi les cibles de `possede_objet`, `donner_objet`, `retirer_objet` — d'où le constat sur la fixture ci-dessus. C'est un renfort de l'argument « aucun pré-vol » : une garde feature qui ne regarderait que `savoirs[]` serait déjà fausse aujourd'hui.

**Conséquence : it2 n'a PAS de lot `contrat`.**

### (b) Découpage — **UN seul lot, type `dev-lot`, exécution séquentielle**

Pas d'essaim, pas de worktree, pas de fusion. Quatre à six fichiers, tous possédés par `dossier-objets`, et la nouvelle interface de `FicheObjet` est consommée par `PanneauObjets` dans le même geste : tout découpage ferait partager `PanneauObjets.tsx` entre deux lots — donc mal découpé par construction.

| Lot | Type | Fichiers | Interface exposée / consommée |
|---|---|---|---|
| **A — retrait d'objet** | `dev-lot` (aucun `contrat`) | voir ci-dessous | `FicheObjetHandle`, `RetirerObjetDialogProps`, `designationDe` |

Fichiers exacts du lot A (propriété exclusive, aucun autre lot) :
- `src\features\dossier-objets\components\RetirerObjetDialog.tsx` **(N)**
- `src\features\dossier-objets\components\FicheObjet.tsx` **(R)**
- `src\features\dossier-objets\components\PanneauObjets.tsx` **(R)**
- `src\features\dossier-objets\components\styles.ts` **(N)** — P2, KR-112
- `src\features\dossier-objets\tests\retraitObjet.test.tsx` **(N)**
- `src\features\dossier-objets\tests\panneauObjets.test.tsx` **(R, si nécessaire)** — a priori intact : il ne rend que `PanneauObjets`, et `lesLignes()` filtre sur `textContent.startsWith('Objet')`, insensible à l'`aria-label` du nouveau bouton (`children` = `✕`).

Hors périmètre explicite : `App.tsx` (déjà câblé en it1), tout fichier de `dossier-canon` / `dossier-fiches` / `bascule-editeur`, tout fichier de `src/brain/`.

### (c) Modal vs retrait immédiat — **Modal, tranché**

`dossier-canon` it4 (retrait immédiat) est le précédent **antérieur et affaibli** : sa justification écrite (`PanneauLieux.tsx:69-72`) est « le seul cas dangereux est déjà bloqué par le SSOT » — argument d'**intégrité référentielle**, qui ne couvre pas la perte de contenu propre ; et le même fichier porte BUG-078 non corrigé. `dossier-fiches` it7/it8 est le précédent **corrigé**, et `CLAUDE.md` § Dangerous Actions est contraignant (titre, ce qui se passe, « Annuler », confirm `color="error"`). Le `design_contract.composants` de la feature annonce déjà `Modal (retrait)`. Retirer un objet détruit `nom` + `description_joueur` sans annulation → dialogue obligatoire.

Signatures exactes à écrire (point de rendez-vous du lot) :

```ts
// components/RetirerObjetDialog.tsx (N) — muet sur les référents, aucun dossier en prop
export interface RetirerObjetDialogProps {
	/** Désignation déjà résolue par le parent (designationDe) : « Le sceau de cendre » ou « n°3 (sans nom) ». */
	nomAffiche: string
	onConfirm: () => void
	onCancel: () => void
}
export function RetirerObjetDialog(props: RetirerObjetDialogProps): JSX.Element
// <Modal title="Retirer l'objet" cancelLabel="Annuler" confirmLabel="Retirer"
//        confirmTone="error" onClose={onCancel} onCancel={onCancel} onConfirm={onConfirm}>
// Corps : UN seul nœud de texte, jamais découpé par <strong> (précédent corpsDe).
```

```ts
// components/FicheObjet.tsx (R)
/** Ce que PanneauObjets peut DEMANDER — jamais aller chercher dans le DOM (§ Encapsulation, BUG-078). */
export interface FicheObjetHandle {
	/** Focalise le bouton de retrait de LA FICHE ACTUELLEMENT RENDUE. */
	focusRetirer: () => void
}
/** Moitié droite de localiserEntite('objet', objet, index) — exportée pour que le
 *  panneau ne reconstruise pas la même chaîne (précédent designationDe). */
export function designationDe(objet: Objet, index: number): string
export interface FicheObjetProps {
	brouillon: BrouillonObjet
	objet: Objet
	index: number
	/** DÉJÀ filtré par le parent : la fiche ne reçoit jamais l'objetId en cause. */
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	/** DEMANDE le retrait (ouvre la modale) — ne retire jamais. */
	onDemanderRetrait: () => void
}
export const FicheObjet = forwardRef<FicheObjetHandle, FicheObjetProps>(function FicheObjet(props, ref) {
	const retirerRef = useRef<HTMLButtonElement>(null)
	useImperativeHandle(ref, () => ({ focusRetirer: () => retirerRef.current?.focus() }), [])
	// … bouton IconButton tone="danger" size={HIT_TARGET_MIN} label={`Retirer l'objet ${designationDe(objet, index)}`}
	// … bandeau de refus : branche sur refus.statut, JAMAIS sur refus.issues
})
```

```ts
// components/PanneauObjets.tsx (R) — état possédé ici, comme PanneauPersonnages
interface RefusEnCours { objetId: string; statut: 'absent' | 'refuse'; issues: DossierIssue[] }
const [enConfirmation, setEnConfirmation] = useState<string | null>(null)   // jamais un booléen
const ficheRef = useRef<FicheObjetHandle>(null)
const boutonAjouterRef = useRef<HTMLButtonElement>(null)                    // À CÂBLER DANS LES DEUX BRANCHES
function commit(objetsSuivants: Objet[], objetId: string, { resout }: { resout: boolean } = { resout: true }): EcritureDossier
// Garde de modale EN LIGNE : enConfirmation === objetAffiche.id — aucun useEffect de resynchronisation (KR-013/113).
// Focus post-retrait : objetAffiche !== undefined ? ficheRef.current?.focusRetirer() : boutonAjouterRef.current?.focus()
// INTERDIT : panneauRef.current?.querySelector('button[aria-label^="Retirer l\'objet"]') — c'est BUG-078.
```

Note pour l'orchestrateur : `handleAjouter` doit adopter la double indexation `{ resout: false }` de `PanneauLieux.tsx:136-153` en même temps que le refus arrive — aujourd'hui `commit()` de `PanneauObjets` n'a pas d'argument `objetId` du tout, et un ajout qui effacerait le bandeau d'un AUTRE objet est exactement BUG-063.
