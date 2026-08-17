RISQUE — **Les trois textes REQUIS.** `charpente.jalons[].enonce_texte`, `jalons[].declencheur_texte` et `fins[].condition_texte` sont dans `CHAMPS_REQUIS` (`tables.ts:128-130`) et `validate.ts:288` refuse la chaîne vide. Le geste d'it1 — `handleAjouter` committe `{ id }` nu — est donc **REFUSÉ** ici : aucun jalon, aucune fin ne peut naître comme est né un indice. Deux issues seulement : semer les textes, ou garder l'entité hors du document jusqu'au premier blur — la seconde est une copie privée de la source de vérité, **veto**. Reste le semis, et la seule marque du dépôt (`MARQUEUR_A_ECRIRE`, `amorce.ts:46`) est verrouillée hors du baril par un test nommé (`amorce.test.ts:71-80` : « il devra SUPPRIMER ce test »). Voilà le travail réel du lot contrat, et il n'est pas dans le goal.

OBJECTION — **KR-211 (a) est déjà acquis** : `charpente.jalons[].effet` est dans `CHEMINS_DE_DELTAS` depuis `dossier-format` (`tables.ts:578`) et `Fin` ne porte aucun `Delta`. L'écrire, c'est produire du vert sans travail. **KR-211 (b) est infaisable tel qu'écrit** : `alerteSansExpr: false` sur Jalon (`tables.ts:656`) — un jalon non conforme n'avertit JAMAIS, donc « un jalon/une fin conforme, un non conforme » ne se teste pas côté jalon.

PROPOSITION — Remplacer (a) par : « `Fin.texte` porte la destination `moteur` et une instance dans les DEUX fixtures » (précédent exact `texte_ouverture_joueur`, `destinations.ts:471-473` : émis verbatim, pas du contexte ; motif KR-174). Remplacer (b) par une discriminance à **trois** entités : fin sans `condition_expr` → une région `role="status"` ; fin avec → aucune ; jalon sans → aucune (silence par design, L4). **Deux lots**, pas plus.

VERDICT — **recevable sous réserve** : le semis des trois champs requis et l'export de la marque entrent au plan, sinon l'écran ne sait pas créer une entité.

---

### Annexe — découpage en lots (propriété disjointe, vérifiée fichier par fichier)

**Lot 1 — `contrat` — seul, en premier (KR-210).** Aucun fichier partagé avec le lot 2.

- R `src/brain/dossier/types.ts`
- R `src/brain/dossier/destinations.ts`
- R `src/brain/dossier/__fixtures__/dossier-minimal.json`
- R `src/brain/dossier/__fixtures__/dossier-reference.json`
- R `src/brain/dossier/couverture.test.ts`
- R `src/brain/dossier/amorce.test.ts`
- R `src/brain/index.ts`

**Ni `tables.ts`, ni `validate.ts`, ni `identifiers.ts`** : aucune table neuve, aucun garde neuf, espaces `'jalon'`/`'fin'` déjà enregistrés (L7 vérifié). Le lot est petit mais **non trivial** — il porte deux décisions irréversibles.

```ts
// types.ts — le SEUL ajout de schéma (optionnel, KR-191 : rien de persisté ne devient invalide)
export interface Fin extends Entite {
	condition_texte: string
	condition_expr?: ExprNode
	/** MOTEUR — prose ÉMISE VERBATIM au joueur à l'arrivée sur cette fin
	 *  (consommateur n° 15). Même régime que `charpente.depart.texte_ouverture_joueur` :
	 *  ce n'est pas du contexte, c'est du texte joueur — la faire écrire au modèle
	 *  la ferait varier. AUCUNE ligne dans BUDGETS_DE_MOTS (précédent KR-203). */
	texte?: string
}

// destinations.ts — UNE ligne
'charpente.fins[].texte': 'moteur',

// brain/index.ts — export NOMMÉ, second consommateur réel
export { MARQUEUR_A_ECRIRE } from './dossier/amorce'
```

Contreparties **obligatoires dans ce lot**, sinon il n'est pas vert isolément :
1. `amorce.test.ts` — l'assertion « l amorce ne sort pas du baril » (`:71-80`) est **réécrite**, pas supprimée : `expect(baril).toContain('MARQUEUR_A_ECRIRE')` et `expect(baril).not.toContain('construireAmorce')` — la marque sort, l'amorce non. Le test « la marque n est ecrite nulle part ailleurs dans src » (`:59`) **reste intact** : il est le garde qui interdira au lot 2 de recopier `⟨à écrire⟩`.
2. `couverture.test.ts` — une dispense `'charpente.fins[].texte': PROSE_D_ENTITE_LIBRE` (optionnel, forme non arbitrée ; **jamais** une 16ᵉ constante au texte voisin) + le test nommé de destination sur les deux fixtures (motif KR-174, calqué sur « les trois proses de Lieu »).
3. Les deux fixtures instancient `texte` sur une fin — sans quoi « aucune ligne morte dans DESTINATION_DES_CHAMPS » rougit. La fin de la minimale **garde son `condition_expr`** : la fixture doit rester sans avertissement (`couverture.test.ts:420`).

**Lot 2 — `feature` — démarre contrat figé, le lit comme donnée immuable.**

- N `src/features/dossier-registres/components/PanneauJalonsFins.tsx`
- N `src/features/dossier-registres/components/FicheJalon.tsx`
- N `src/features/dossier-registres/components/FicheFin.tsx`
- N `src/features/dossier-registres/tests/panneauJalonsFins.test.tsx`
- R `src/features/dossier-registres/components/styles.ts`
- R `src/features/dossier-registres/index.ts`
- R `src/App.tsx` (une clé : `'jalons-fins': <PanneauJalonsFins dossierId={route.dossierId} />`)

Consomme uniquement : `type Jalon`, `type Fin`, `MARQUEUR_A_ECRIRE`, `validateDossier`, `frapperIdentifiant('jalon'|'fin')`, `localiserEntite`, `useOpenDossier`, `dossiers.update`, `{Field, Card, ListRow, IconButton, SegmentedControl, IssueList}`.

```ts
// PanneauJalonsFins.tsx — UNE sélection discriminée, jamais deux états parallèles
type Onglet = 'jalons' | 'fins'
interface Selection { onglet: Onglet; id: string }
// UN seul refus, indexé par l'identifiant de l'entité AFFICHÉE (les id portent
// leur espace : `jalon.x` / `fin.y` ne collisionnent pas) — motif it1, KR-197.
interface RefusEnCours { entiteId: string; statut: 'absent' | 'refuse'; issues: DossierIssue[] }

// L'écriture : patch ÉTROIT sur charpente, `depart` traverse INTACT
dossiers.update(dossierId, (d) => ({
	canon: d.canon, monde: d.monde,
	charpente: { ...d.charpente, jalons: suivants },   // ou fins: suivants
}))

// Le semis des champs requis — composé, jamais recopié (amorce.test.ts:59)
const JALON_NEUF = (id: string): Jalon => ({
	id,
	enonce_texte: `${MARQUEUR_A_ECRIRE} Le fait établi, à l'accompli.`,
	declencheur_texte: `${MARQUEUR_A_ECRIRE} Ce qui déclenche ce jalon.`,
	effet: [],   // Delta[] requis au TYPE ; vide accepté par le validateur, HORS RENDU (L6)
})
const FIN_NEUVE = (id: string): Fin => ({
	id, condition_texte: `${MARQUEUR_A_ECRIRE} Ce qui met fin à l'aventure.`,
})

// D1 — lecture DÉRIVÉE, jamais un état semé (KR-013/113)
const avertissements = useMemo(() => dossier === null ? []
	: validateDossier(dossier).warnings.filter((i) => i.path.startsWith('charpente.')), [dossier])
```

Conséquence assumée du semis, à trancher par PM/UX au tour 2 : **une fin neuve avertit immédiatement** (D1 : `condition_texte` non vide sans `condition_expr`). C'est vrai, pas bruyant — une fin que rien ne structure ne se déclenchera jamais — et cela rend le critère (b) observable dès la création. Un jalon neuf, lui, reste silencieux : c'est le contraste qui prouve le câblage d'`alerteSansExpr`. Le filtre `charpente.` fait aussi remonter le dépassement de `BUDGET_MOTS_JALON` sur la fiche d'un jalon — même bandeau, précédent `ObjectifsCanon.tsx:370-375`.

**Pourquoi PAS trois ou quatre lots** — la question posée. Un lot « jalons » et un lot « fins » devraient nommer **quatre fichiers communs** : le panneau (une seule sélection, un seul `commit`, un seul `SegmentedControl`), `styles.ts`, `index.ts`, `App.tsx`. Propriété exclusive impossible, et le second lot devrait importer une fiche qu'il ne possède pas pour compiler — donc invérifiable seul. Un lot « bandeau D1 » serait une abstraction à un seul appelant, donc une dette. **Deux lots ⇒ exécution séquentielle, ni worktree ni fusion.**

**Étanchéité vérifiée par lecture** : `panneaux?: Partial<Record<SectionId, ReactNode>>` (`DossierEditorScreen.tsx:14`) et `SECTIONS[9].id === 'jalons-fins'` (`sections.ts:135`) existent déjà — **zéro fichier de `bascule-editeur`** dans aucun lot, l'entrée `'jalons-fins'` de `PANNEAU_PAR_SECTION` (`PanneauSection.tsx:27`) reste en place, exactement comme `indices` après it1 (KR-184/187 tenus). Zéro fichier de `dossier-canon` ou `tree-canvas` (KR-204/205 tenus par construction). Aucun `EditeurEffets` : `Jalon.effet` reste hors rendu (L6).
