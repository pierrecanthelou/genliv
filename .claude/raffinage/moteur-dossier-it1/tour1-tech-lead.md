# Tour 1 — Tech Lead — `moteur-dossier` it1

**RISQUE** — la totalité d'`EtatMonde`. Le goal fige `memoire: null` et laisse implicites les sept champs de `monde`. Qu'un lot n'en pose qu'un (`lieu_courant`) au nom de KR-249 lu champ par champ, et KR-251 rend les six autres optionnels À VIE : l'évaluateur bivalent d'it3 hérite de six branches `undefined` sous un aiguillage qui doit LEVER, et « un état bien formé décide les sept prédicats » (décision n°4) cesse d'être représentable. L'unité d'admission est `monde`, pas ses champs (KR-117).

**OBJECTION 1** — `persist.ts` sort du périmètre. Mesuré : unique appelant `usePlaySession` (arbre), il stocke `SessionState` par `bookId` et ne croise jamais `EtatSession`. Le porter refactore un module qu'it4 orpheline et ajoute `persist.test.ts` au lot. Le port naît neuf, côté dossier.

**OBJECTION 2** — `EditorTopBar:126` fait `disabled={!onPreview}`, jamais `!!previewDisabledReason` : passer `onPreview` inconditionnellement livre un CTA cliquable sur dossier injouable.

**PROPOSITION** — (a) dérogation nommée, pas de découpe : « CTA seul » ne se démontre pas, « shell seul » n'est atteignable que par un test ; ESLint tient l'isolation ; le rendez-vous reste la variante de `Route`. Trois lots (annexe A). (b) un seul amendement substantiel, une seule cellule : `lieu_visite`, forme à trois bras — it1 crée son fait en initialisant `lieux_visites: [départ]`, et it2 ne pourrait pas l'écrire sans un troisième lot `contrat`. `indice_connu` / `jalon_atteint` attendent it3. Rien ne rougit si on se trompe (mesuré, annexe B) : cas RED-first obligatoire.

**VERDICT** — recevable sous réserve (objections 1–2 et la forme d'`EtatMonde` inscrites au plan).

---

# ANNEXE A — Le découpage : 3 lots, listes strictement disjointes

Séquence : **L1 seul et premier**, puis **L2 ∥ L3**.

| # | Titre | Type | Fichiers (N = créé, R = remplacé) |
|---|---|---|---|
| **L1** | L'état de session, sa table d'audience, la route, la clé | **`contrat`** | N `src/brain/dossier/session.ts` · N `src/brain/dossier/session.test.ts` · N `src/brain/dossier/sessionDestinations.ts` · N `src/brain/dossier/sessionDestinations.test.ts` · N `src/brain/dossier/__fixtures__/session-maximale.ts` · R `src/brain/Router.ts` · R `src/brain/index.ts` · R `src/brain/persistenceKeys.ts` · R `src/brain/dossier/tourzero.ts` · R `src/brain/dossier/tourzero.test.ts` · R `docs/EXIGENCE-APERCU-DU-JEU.md` (§ 6) |
| **L2** | Le CTA « Aperçu du jeu » s'allume et navigue | feature `bascule-editeur` | R `src/features/bascule-editeur/components/DossierEditorScreen.tsx` · R `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` |
| **L3** | Le shell monte la partie et rend l'ouverture | feature `play-mode` + runtime + racine | N `src/features/play-mode/index.ts` · N `src/features/play-mode/components/EcranPartie.tsx` · N `src/features/play-mode/components/OutcomeBlock.tsx` · N `src/features/play-mode/hooks/usePortDeStockageSession.ts` · N `src/features/play-mode/tests/ecranPartie.test.tsx` · N `src/features/play-mode/tests/outcomeBlock.test.tsx` · N `src/player/moteur/ouvrirSession.ts` · N `src/player/moteur/ouvrirSession.test.ts` · N `src/player/moteur/stockageSession.ts` · N `src/player/moteur/stockageSession.test.ts` · N `src/features/moteur-dossier/tests/moteurSansIA.test.ts` · R `src/App.tsx` |

Hors lots, propriété de l'orchestrateur à l'étape 4 : les deux `specification.json`, `CHANGELOG.md`, `code-knowledge.json`, `docs/ROADMAP-BASCULE-IA.md`.

Vérifiabilité isolée : **L1** `tsc` + `jest` sur `brain/` seul · **L2** `router.current()` vaut `{ name: 'partie', dossierId }` après clic ; le `title` reflète le premier contrôle bloquant · **L3** monte `<App/>` sur la route `partie`.

Pourquoi pas 4 lots : séparer `src/player/moteur/` de `features/play-mode/` produirait une moitié sans démonstration et une moitié sans contenu. Pourquoi pas 2 : L2 et L3 sont dans deux features distinctes ; les fusionner met un seul agent des deux côtés de la frontière que la dérogation (a) protège.

---

# ANNEXE B — (b) `tourzero.ts` : ce que j'ai mesuré, et le geste exact

**Mesuré au dépôt** (trois relevés) :

1. **Le seul consommateur de `premiereFeuilleVraieAuTourZero` est le contrôle `objectif-perdu-a-l-ouverture`** (`controles.ts:1222`), `niveaux: ['alerte']`, et il ne lit que `canon.objectifs[].echoue_si_expr`. **Un amendement de la table ne peut donc PAS changer `jouable`.**
2. **Aucune fixture ne porte `lieu_visite` dans un `echoue_si_expr`** : `dossier-minimal.json:37` utilise `ou(evenement_consomme, pnj_a_revele)`, `dossier-reference.json:30/43` `evenement_consomme` et `non(possede_objet)`. Les occurrences de `lieu_visite` sont toutes dans des `declencheur_expr` ou des `reussi_si_expr`. → **`controles.test.ts` reste vert sans être modifié.**
3. **Rien ne rougit** si la cellule est fausse — KR-252 re-vérifié : `tourzero.test.ts:106` compare la table à un double d'elle-même, `tsc` ne voit rien.

**L'argument décisif, structurel** : la décision (ii) est **exercée par la donnée qu'it1 fige**. `ouvrirSession` initialise `monde.lieux_visites = [charpente.depart.lieu_id]` — l'alternative (`[]`) rend un tour zéro où `lieu_courant_est(départ)` est vrai et `lieu_visite(départ)` faux, c'est-à-dire un héros dans un lieu qu'il n'a jamais visité. Et it2 **ne peut pas** porter l'amendement : `tourzero.ts` est dans `brain/`, or le cadrage n'accorde que **deux** lots `contrat` (décision #13).

**Le geste, exactement** (L1) :

```ts
	/**
	 * DÉCIDÉ PAR LA n° 9, décision (ii), itération 1 : la session s'ouvre avec
	 * `monde.lieux_visites = [charpente.depart.lieu_id]` (`brain/dossier/session.ts`)
	 * — le lieu de départ compte comme VISITÉ. Trois bras, exactement comme
	 * `lieu_courant_est` et pour la même raison.
	 */
	lieu_visite: (dossier, cibles) => {
		const depart = dossier.charpente.depart.lieu_id
		if (depart === '' || !dossier.monde.lieux.some((lieu) => lieu.id === depart)) return 'indecidable'
		return cibles[0] === depart ? 'vrai' : 'faux'
	},
```

Un `departResolu(dossier): string | null` **privé au module** est acceptable (deux appelants réels) ; **ne pas l'exporter**.

**Amendement documentaire, même lot** : le bloc H6 cesse de dire « deux décisions que la n° 9 n'a PAS prises » — il en reste **une**, la (i), propriétaire **it3** ; la phrase « H6 NE SPÉCIFIE AUCUN ÉTAT DE SESSION » reçoit son adresse, `brain/dossier/session.ts`.

**Ce qui NE bouge PAS en it1** : `possede_objet`, `indice_connu`, `pnj_a_revele`, `jalon_atteint`, `evenement_consomme`. Les amender maintenant fait **sous-tirer** `controlerDossier` (n° 7, livrée) pendant deux itérations sur une décision non prise.

**Obligation de mesure imposée au lot** : ajouter à `tourzero.test.ts` un cas **écrit et vu ROUGE avant** le changement de cellule — `depart.lieu_id = lieu.X`, appel direct de `premiereFeuilleVraieAuTourZero` sur `lieu_visite(lieu.X)` (attendu : témoin non nul, `nie: false`) **et** sur `lieu_visite(lieu.Y)` (attendu : `null`), plus le bras `indecidable`. Ne **pas** recopier la table dans le test. Les cas de Kleene existants ne sont pas réécrits.

---

# ANNEXE C — Signatures exactes

## C.1 — L1 · `src/brain/dossier/session.ts`

```ts
export const SCHEMA_SESSION = 1

/** Registre CLOS. 'ia' n'entre pas : la n° 9 n'émet aucune ligne de modèle. */
export type RoleJournal = 'joueur' | 'moteur'

export interface EntreeJournal {
	readonly tour: number
	readonly role: RoleJournal
	readonly texte: string
	// `deltas?` est AJOUTÉ EN it3, OPTIONNEL À VIE (KR-251). Ne pas le déclarer ici.
}

/**
 * SEPT CHAMPS, TOUS REQUIS — un par prédicat de PREDICATES, dans l'ordre du
 * registre. La totalité est la PRÉCONDITION de la bivalence d'it3.
 */
export interface EtatMonde {
	readonly lieu_courant: string                                                  // lieu_courant_est
	readonly lieux_visites: readonly string[]                                      // lieu_visite
	readonly inventaire: readonly string[]                                         // possede_objet
	readonly indices_connus: readonly string[]                                     // indice_connu
	readonly jalons_atteints: readonly string[]                                    // jalon_atteint
	readonly evenements_consommes: readonly string[]                               // evenement_consomme
	readonly pnj: Readonly<Record<string, { readonly a_dit: readonly string[] }>>   // pnj_a_revele
}

export interface EtatSession {
	readonly schema: typeof SCHEMA_SESSION
	readonly dossier_id: string
	readonly graine_alea: number
	readonly horloge: { readonly tour: number } // `climat_actif` : n° 14 (KR-207), non déclaré
	readonly monde: EtatMonde
	readonly journal: readonly EntreeJournal[]
	readonly memoire: null // clé racine réservée, n° 10 (décision #17)
	// `attente` : NON DÉCLARÉE en it1 (KR-249)
}

/**
 * LE PORT DE STOCKAGE — la clé est LIÉE PAR LE FOURNISSEUR, jamais paramètre.
 * `lire` rend `unknown` : une session persistée par un build antérieur est une
 * ENTRÉE NON TYPÉE, que l'appelant doit rétrécir.
 */
export interface PortDeStockageSession {
	lire(): unknown
	écrire(etat: EtatSession): void
}
```

> **Réserve tech-lead sur `effacer`** — le port est RETENU tel quel ; ce qui se discute est le **calendrier** de la troisième méthode : **aucun appelant en it1**. Proposition : `effacer` entre **avec son appelant** (it2, « Relancer »).

## C.2 — L1 · `src/brain/dossier/sessionDestinations.ts`

```ts
type CheminDeFeuilleDeSession = 'journal[].tour' | 'journal[].role' | 'journal[].texte'

export const DESTINATION_DES_CHAMPS_DE_SESSION: Readonly<
	Record<keyof EtatSession | CheminDeFeuilleDeSession, Destination>
> = {
	schema: 'moteur',
	dossier_id: 'moteur',
	graine_alea: 'moteur',
	horloge: 'moteur',
	monde: 'moteur',
	journal: 'moteur',
	'journal[].tour': 'moteur',
	'journal[].role': 'moteur',
	'journal[].texte': 'ia',  // KR-241 : ce que la n° 10 injectera
	memoire: 'ia',            // n° 10, clé réservée
}
```

**Garde** : balayage pleine profondeur de `__fixtures__/session-maximale.ts`, **échec PAR NOM DE CHAMP**, plus « aucune ligne morte », plus les dispenses sous une assertion de disjonction. **Piège** : la fixture n'est **pas** la session initiale d'it1 (journal vide → trois lignes mortes).

## C.3 — L1 · `Router.ts` et `persistenceKeys.ts`

```ts
export type Route =
	| { name: 'home' }
	| { name: 'editor'; bookId: string }
	| { name: 'dossier'; dossierId: string }
	| { name: 'partie'; dossierId: string }
```

```ts
export const DOSSIER_SESSION_KEY_PREFIX = `${PERSISTENCE_PREFIX}:session:dossier:`
export function dossierSessionKey(dossierId: string): string {
	return `${DOSSIER_SESSION_KEY_PREFIX}${dossierId}`
}
```
> Mesuré : `DossierService.ts:348` filtre déjà les clés contenant un `:` après le préfixe. On ne s'appuie pas sur une garde incidente écrite pour un autre besoin.

**Baril** : `EtatSession, EtatMonde, EntreeJournal, RoleJournal, PortDeStockageSession, SCHEMA_SESSION, DOSSIER_SESSION_KEY_PREFIX, dossierSessionKey`. **Ne pas** ré-exporter `DESTINATION_DES_CHAMPS_DE_SESSION` ni `MARQUEUR_A_ECRIRE`.

## C.4 — L2 · `DossierEditorScreen.tsx`

```ts
const { parSection, controles, jouable } = controlerDossier(dossier)
const bloquants = controles.filter((c) => c.niveau === 'bloquant')
const raisonApercu =
	bloquants.length === 0
		? undefined
		: bloquants.length === 1
			? bloquants[0].message
			: `${bloquants[0].message} (et ${bloquants.length - 1} de plus)`
```
```tsx
onPreview={jouable ? () => router.navigate({ name: 'partie', dossierId }) : undefined}
previewDisabledReason={raisonApercu}
```
`RAISON_APERCU_DESACTIVE` supprimée. **Pièges** : `disabled={!onPreview}` — c'est l'**absence** d'`onPreview` qui désactive ; le suffixe compte le **reste** ; ne pas toucher `EditorTopBar.tsx`.

## C.5 — L3 · le runtime (`src/player/`, pur et extractible)

```ts
// src/player/moteur/ouvrirSession.ts
import { MARQUEUR_A_ECRIRE } from '../../brain/dossier/amorce'   // IMPORTÉ, jamais recopié

export type RefusOuverture = 'ouverture-a-ecrire'   // registre CLOS

export type ResultatOuverture =
	| { readonly ok: true; readonly session: EtatSession }
	| { readonly ok: false; readonly refus: RefusOuverture }

/** PURE. `graine_alea` est INJECTÉE — jamais `Math.random()` ici. */
export function ouvrirSession(dossier: Dossier, options: { graine_alea: number }): ResultatOuverture
```
Corps : refus si le texte d'ouverture contient `MARQUEUR_A_ECRIRE` ; sinon `horloge: { tour: 0 }`, `journal: []`, `memoire: null`, `monde.lieu_courant = charpente.depart.lieu_id`, **`monde.lieux_visites = [charpente.depart.lieu_id]`**, les cinq autres vides.

```ts
// src/player/moteur/stockageSession.ts
export function lireSessionStockee(port: PortDeStockageSession, dossierId: string): EtatSession | null
```
Rend `null` si `lire()` n'est pas un objet, si `schema !== SCHEMA_SESSION`, ou si `dossier_id !== dossierId`. **Ne lève pas** (KR-238 vise `ExprNode`, pas le stockage).

**Extractibilité — liste écrite par L1 au § 6 de `docs/EXIGENCE-APERCU-DU-JEU.md`** : `brain/dossier/types.ts`, `amorce.ts` (mesuré : n'importe que `./types`), `session.ts`, `sessionDestinations.ts`. **Interdits** : `controles.ts`, `DossierService`, `PersistenceService`, `persistenceKeys.ts`, tout `src/features/**`.

## C.6 — L3 · la feature `play-mode`

```tsx
export interface OutcomeBlockProps { children: ReactNode; label?: string }
export interface EcranPartieProps { dossierId: string }
```
Ordre des gardes dans `EcranPartie`, **normatif** :
1. `const [dossier] = useState(() => dossiers.get(dossierId))` — **GELÉ** (décision n° 7). **Ne pas** utiliser `useOpenDossier`.
2. `dossier === null` → refus « Dossier introuvable ».
3. `const { jouable, controles } = controlerDossier(dossier)` **en ligne** ; `!jouable` → refus nommé (**KR-239 : la porte est ici**). C'est la feature qui lit `controlerDossier`, jamais `src/player/`.
4. `const [ouverture] = useState(() => ouvrirSession(dossier, { graine_alea }))`, graine tirée une fois dans un initialiseur.
5. `ouverture.ok === false` → refus nommé.
6. Sinon : header + « ✕ Quitter le test », `<OutcomeBlock>` verbatim, état vide du journal.

```ts
export function usePortDeStockageSession(dossierId: string): PortDeStockageSession
```
`useMemo` sur `[persistence, dossierId]` — **référence stable obligatoire** (KR-004). Persistance : `useEffect(() => { port.écrire(session) }, [port, session])` — usage **légitime** d'un effet. **Ne pas** écrire depuis l'initialiseur de `useState`.

`src/App.tsx` : branche `route.name === 'partie'` → `<EcranPartie key={route.dossierId} dossierId={route.dossierId} />`, importée du baril `'./features/play-mode'` (créé par le lot).

## C.7 — L3 · `moteurSansIA.test.ts` (KR-250)

Périmètre **dérivé du disque** : `src/player/**`, `src/features/play-mode/**`, `src/brain/dossier/**`, hors `*.test.*`. Zéro `fetch`, zéro import de `CopiloteService`, zéro URL `/ia/`. **Plus une assertion de non-vacuité** (`fichiers.length > 0`). **Pouvoir séparateur prouvé DANS CE LOT.**

---

# ANNEXE D — Ce que je refuse pour it1

| # | Refusé | Motif |
|---|---|---|
| D1 | `src/player/utils/persist.ts` converti en port par it1 | Unique appelant `usePlaySession` (arbre), stocke `SessionState` par `bookId` ; it4 l'orpheline. |
| D2 | `EtatMonde` réduit à `lieu_courant` en it1 | Six champs optionnels à vie (KR-251) détruiraient la prémisse de bivalence d'it3. |
| D3 | `attente` déclarée en it1 | Aucune variante n'a de producteur (KR-249). |
| D4 | Modifier `EditorTopBar.tsx` pour piloter `disabled` par `previewDisabledReason` | Changement de contrat d'une primitive partagée pour un seul appelant. |
| D5 | `controlerDossier` appelé depuis `src/player/` | Ferait entrer le linter de l'éditeur dans le bundle extractible. |
| D6 | `effacer()` livrée sans appelant en it1 | Méthode morte ; elle entre avec « Relancer » (it2). |
| D7 | Amender `indice_connu` / `jalon_atteint` / `possede_objet` en it1 | Fait sous-tirer `controlerDossier` sur une décision non prise. |
| D8 | `genliv:dossier:session:` comme préfixe | Le namespace `genliv:dossier:` réserve `:` au découpage du DOCUMENT. |
| D9 | `useOpenDossier` dans le shell | Le dossier est GELÉ (décision n° 7). |
| D10 | Un quatrième lot (moteur séparé du shell) | Les deux moitiés ne se démontrent pas seules. |

# ANNEXE E — Ce que le comité doit inscrire ailleurs

1. **Le `goal` d'it1** : retirer « port de stockage » ciblant `persist.ts`, préciser « `tourzero.ts` : cellule `lieu_visite` (décision (ii)) + mise à jour de H6 ».
2. **Le `goal` d'it2** : retirer « Tranche la décision (ii) de `tourzero.ts` » — consommé par it1.
3. **Dérogation (a)** : écrite, pas contrebandée.
4. **KR à ajouter** : « Les sept champs d'`EtatMonde` sont REQUIS et totaux dès le premier lot `contrat` — exception nommée à KR-249, dont l'unité d'admission est ici `monde` et non ses champs. »
