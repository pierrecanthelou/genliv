# Plan d'itération — `moteur-dossier` · itération `2`

> Statut : **`validé`** — porte 2 franchie le 2026-09-24
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-20
> Composition : **5 rôles** — motif : l'itération touche le dossier d'aventure, le moteur, la mémoire de session et le mode jeu (quatre des cinq déclencheurs de convocation du cinquième rôle).
> Exécution : **séquentielle** (2 lots, le `contrat` seul et en premier) — sans worktree ni fusion, comme it1.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur **déplace son héros d'un lieu à un autre par les accès de son dossier**. » |
| **Tranche** | la console (écran) → `analyserSaisie` / `executerCommande` (`brain/dossier/commandes.ts`, pur) → `EtatSession` neuve → `MagasinDeSession.ecrire` sur le magasin **BRUT** → le journal re-rendu à l'écran. |
| **Lots** | **2** · dont `contrat` : **oui** (L1, seul et en premier) |
| **Hors périmètre** | reprise / relecture d'une session · `lire` et `effacer` du port · évaluateur d'`ExprNode` · deltas · `faits.ts` · jalons · les deux cellules de `tourzero.ts` · démolition de l'arbre · `EditorTopBar.tsx` et l'infobulle du CTA · `quetes[].etapes` · forme interne de `memoire` · `attente` · `depart.inventaire_initial` · scission de `controles.ts` · dédoublonnage des accès · un second verbe de commande |
| **Reporté** | le **replay déterministe littéral** → n° 11, faute de source d'entropie (O-4/D-8 bis) · `lire`/`effacer` + `validerSession` → l'itération de la **reprise** · l'infobulle du CTA (D-6, toujours sans relevé navigateur) · le dédoublonnage des accès → n° 10 (injection) |

**Aucune proposition `INNOVATION` en it2.** Celle d'it1 — l'assertion `every(d => d !== 'ia')` écrite pour être supprimée par la n° 10 — reste en place et **aucun lot n'y touche**.

---

## 1 — But raffiné

À la fin de cette itération, **l'auteur déplace son héros d'un lieu à un autre par les accès de son dossier**.

La console de commandes typées est le **moyen** de ce déplacement, pas un second livrable : elle n'y pose **qu'un** verbe, `ALLER`. Le journal est la **seule preuve visible** que le déplacement a eu lieu — la feature n'émet aucune prose.

## 2 — Hors périmètre

- **La reprise ou la relecture d'une session persistée.** it2 gèle l'écriture derrière un port ; `lire`, `effacer`, `validerSession` et le chemin d'interface « Reprendre / Relancer » appartiennent à l'itération qui les démontrera. C'est une **seconde phrase de démo** (T-3).
- **L'évaluateur bivalent d'`ExprNode`, `appliquerDelta`, `faits.ts`, les jalons** — it3.
- **Les deux cellules de `VALEUR_AU_TOUR_ZERO`** (`tourzero.ts`) — it3, lot `contrat`, les deux ensemble (D-2 bis). `tourzero.ts`, `tourzero.test.ts` et `tourzeroOracle.test.ts` sont **interdits aux deux lots**.
- **Un second verbe de commande.** `COMMANDES` en pose **un**.
- **Le dédoublonnage des accès**, et leur **filtrage** : `destinationsPossibles` rend `acces` **tel quel**. Le dédoublonnage appartient à l'injection (n° 10) ; une référence pendante est **exposée**, jamais masquée (KR-021).
- **`EditorTopBar.tsx` et l'infobulle du CTA désactivé** — D-6 reste reporté : son déclencheur est un relevé navigateur consigné (Chrome + Firefox), qui n'existe toujours pas. **Aucun lot n'ouvre ce fichier.**
- **`bascule-editeur`**, `src/player/**`, `persist.ts`, `tree-canvas` — aucun lot n'y entre.
- **La démolition des consommateurs du modèle d'arbre** — it4.
- **`quetes[].etapes`, la forme interne de `memoire`, `attente`, `depart.inventaire_initial`, la scission de `controles.ts`** — hors feature ou hors itération.
- **Le score de mutation** : aucun des 4 fichiers mutés n'est au diff (KR-243). `npm run test:mutation` **ne doit pas être lancé**.

## 3 — Contrat de design

*(Écrit par l'UX, amendé par le narratif sur la forme du journal, et par l'orchestrateur sur le rendu d'`origine` — voir O-1 et O-2 au § 8.)*

### 3.A — Anatomie de la console

Dans `EcranPartie` → `PartieEnCours` → `colonneLecture`, **second enfant après** `<section aria-label="Journal">`. Ordre de lecture = ordre `Tab` : `OutcomeBlock` (ouverture) → Journal → Console.

Fichier neuf : `src/features/play-mode/components/ConsoleCommandes.tsx`.
Un `<form>` + **un unique champ** (`Field` réutilisé, jamais un composant de saisie maison) + un bouton. **Zéro second widget — ni `<select>`, ni `<datalist>`.**

```tsx
<section aria-label="Console">
  {destinations.length === 0 ? (
    <p style={texteImpasse}>
      Aucun accès depuis ce lieu — la console n'a aucune commande à proposer.
    </p>
  ) : (
    <>
      <form onSubmit={handleSubmit}>
        <Field
          id="console-commande"
          label="CONSOLE"
          mono
          placeholder="Tapez une commande…"
          value={saisie}
          onChange={handleChange}
        />
        <button type="submit" style={boutonExecuter}>EXÉCUTER</button>
      </form>
      <p style={texteAccesDisponibles}>
        Accès disponibles : {destinations.join(', ')}.
      </p>
    </>
  )}
  {refus !== null && (
    <p style={texteRefusConsole}>
      <span aria-hidden="true">⊘ </span>{refus}
    </p>
  )}
</section>
```

**La console ne valide RIEN** : elle soumet la **chaîne brute** à `onSoumettre`. Une console qui validerait *et* un moteur qui résout font **deux décideurs**, qui divergeront (T-14 / KR-013) — et deux décideurs, c'est deux règles du jeu, qui ne vivent jamais qu'à un seul endroit.

`destinations` vient de `destinationsPossibles(...)` — **identifiants tels quels**, jamais `lieux[].nom` (audience `'auteur'`, KR-232), **ni dédoublonnés ni filtrés des pendantes** (T-15 / N-13).

**Opérabilité clavier** (ergonomie de rédaction, pas accessibilité) :
- `Tab` : `✕ Quitter le test` → *(les lignes de journal ne sont pas focusables)* → `CONSOLE` → `EXÉCUTER`.
- `Entrée` dans le champ **soumet nativement** le formulaire (un seul `<input>` dans un `<form>`) — aucun `onKeyDown` maison.
- `Échap` **hérite d'it1 sans changement** : quitte vers l'éditeur, même focus dans le champ. Aucun second sens (« vider le champ ») : § 3.F d'it1 fixe qu'Échap fait *exactement* ce que fait le bouton visible. **Risque assumé, écrit** : un testeur qui presse Échap pour corriger une faute de frappe quitte l'écran.
- Après une commande **acceptée** : le champ se vide et **reprend le focus** (synchronisation impérative légitime — le testeur enchaîne).
- Après un **refus** : le focus reste, **la saisie fautive n'est pas effacée**.

### 3.B — Extension de `Field` : **`mono?` SEULE**

```ts
/** Bascule la BOÎTE (input ET textarea) de `var(--font-ui)` à `var(--font-mono)`.
 *  Le libellé est déjà mono et ne bouge pas. Défaut : false. */
mono?: boolean
```

Composition en ligne : `{ ...shared, fontFamily: mono ? 'var(--font-mono)' : shared.fontFamily }`. `shared` reste un `const` de module. **Additive** : les 25 appelants mesurés ne bougent pas.

**`list?` et le `<datalist>` n'entrent PAS** (O-1) : l'UX les a retirés au tour 2 sur mesure — jsdom rend l'élément mais **ne témoigne d'aucune autocomplétion**, donc aucun test ne sépare un `<input list>` qui filtre d'un qui ne filtre pas. Une prop sans appelant serait KR-109, la faute même que T-2/T-17 invoquent. La découverte passe par la **ligne ambiante** « Accès disponibles ».

### 3.C — Tous les textes visibles, mot pour mot

| Élément | Texte exact | Registre |
|---|---|---|
| Libellé du champ (`Field.label`) | `CONSOLE` | auteur |
| `aria-label` de la section | `Console` | auteur |
| Placeholder | `Tapez une commande…` | auteur |
| Bouton de soumission | `EXÉCUTER` | auteur |
| Accès disponibles (ambiant, sous le champ, visible dès ≥ 1 accès) | `Accès disponibles : {ACCES}.` — identifiants joints `, ` | dév.-débogueur |
| Refus — verbe hors registre | `Commande inconnue : « {saisie} ». Commandes disponibles : {VERBES}.` — en it2 : `Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER.` | dév.-débogueur |
| Refus — arité | `Commande inconnue : « {saisie} ». Commandes disponibles : {VERBES}.` *(même gabarit — l'arité fautive est une commande qu'on ne reconnaît pas)* | dév.-débogueur |
| Refus — destination hors accès | `Destination inconnue depuis ce lieu : « {argument} ». Accès disponibles : {ACCES}.` | dév.-débogueur |
| Refus — référence pendante | `Destination introuvable dans le dossier : « {argument} » — l'accès existe, le lieu non.` | dév.-débogueur |
| Impasse jouable (remplace le `<form>` en entier — ÉTAT **CALME**, jamais une anomalie) | `Aucun accès depuis ce lieu — la console n'a aucune commande à proposer.` | auteur |
| `TEXTE_JOURNAL_VIDE` | **inchangé** — `Aucun évènement pour l'instant — vos actions y apparaîtront.` | auteur |

**Qui possède la phrase** : l'UX possède le **gabarit français** (mots, ponctuation, guillemets « ») ; `commandes.ts` possède **l'interpolation et l'assemblage** — les littéraux vivent dans `commandes.ts`, `{VERBES}` est dérivé de `Object.values(COMMANDES).map(c => c.verbe)`, `{ACCES}` de `destinationsPossibles`. `ConsoleCommandes.tsx` ne fait que **rendre** `refus: string | null`. Écrite en dur, la liste mentirait dès it3 (T-8).

**Aucun texte n'utilise `--bad`** : un refus de saisie n'est pas un échec de jet. Les deux seules couleurs sémantiques sont réussite / échec.

### 3.D — `JournalRow` — `src/features/play-mode/components/JournalRow.tsx`

```ts
export interface JournalRowProps { readonly entree: EntreeJournal }
```

```tsx
function JournalRow({ entree }: JournalRowProps): JSX.Element {
	const { tour, role, texte, origine } = entree
	return (
		<li style={ligneJournal}>
			<span style={metaJournal}>#{tour}</span>
			<Badge tone="neutral">{role === 'joueur' ? '↪ JOUEUR' : '↻ MOTEUR'}</Badge>
			{origine !== undefined && <span style={metaJournal}>[{origine}]</span>}
			<span style={role === 'joueur' ? texteJoueur : texteMoteur}>{texte}</span>
		</li>
	)
}
```

- **`Badge tone="neutral"`**, jamais `good`/`bad` : le rôle n'est pas un résultat de jet.
- **`↻ MOTEUR`** et non `→ MOTEUR` : le `→` collisionnait avec la flèche de transition du `texte` — deux flèches de sens différents sur la même ligne.
- Différenciation joueur/moteur **par le ton** (`--text-muted` / `--text-body`), jamais par une couleur sémantique.
- **`#{tour}` nu, sans le mot « tour »** (M-13, issue (b)). **Le numéro se répète sur les deux lignes d'un même pas** — il numérote le PAS, pas la ligne. Ni masquage, ni `#7a/#7b`. **Écrit ici pour que le lot ne le « corrige » pas.**
- **`[{origine}]` rendu tel quel**, sans recomposition depuis `COMMANDES` : `JournalRow` **rend**, ne recompose jamais (Déméter). Il n'apparaît que sur l'entrée `moteur` — c'est la donnée qui décide, pas le composant.
- **Pas de `ListRow`** : son `onSelect` est requis et un no-op romprait son contrat pour un premier appelant qui ne l'utilise pas. `JournalRow` est un `<li>`, **non focusable**.
- La liste remplace la branche `null` d'it1 : `<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>`. L'état vide reste rendu **tant que `journal.length === 0`**.

### 3.E — Jetons — aucun jeton neuf

```ts
const ligneJournal: CSSProperties = {
	display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)',
	padding: 'var(--space-3) var(--space-4)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
	fontFamily: 'var(--font-mono)',
}
const metaJournal: CSSProperties = { fontSize: 'var(--fs-meta)', color: 'var(--text-faint)', flexShrink: 0 }
const texteJoueur: CSSProperties = { fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }
const texteMoteur: CSSProperties = { fontSize: 'var(--fs-body)', color: 'var(--text-body)' }
const boutonExecuter: CSSProperties = {
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
	padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--accent)', background: 'var(--accent)',
	color: 'var(--text-on-accent)', fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer', minHeight: 'var(--hit-target)',
}   // accent légitime : seule action interactive primaire de l'écran
const texteRefusConsole: CSSProperties = {
	margin: 0, marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)', lineHeight: 'var(--lh-body)',
}
const texteAccesDisponibles: CSSProperties = {
	margin: 0, marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)', lineHeight: 'var(--lh-body)',
}
const texteImpasse: CSSProperties = {
	margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)', lineHeight: 'var(--lh-body)',
}
```

### 3.F — Registres de langue

| Registre | Où |
|---|---|
| **Auteur** | `CONSOLE`, `Tapez une commande…`, `EXÉCUTER`, `aria-label="Console"`, l'impasse calme, l'état vide du journal |
| **Développeur-débogueur** | les quatre refus, la ligne « Accès disponibles », `#{n}`, `[origine]`, les badges `JOUEUR`/`MOTEUR`, le `texte` de chaque `JournalRow` |
| **Joueur** | **inchangé** — les enfants d'`OutcomeBlock` seuls. **Aucun ajout en it2.** |

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `brain/dossier/commandes.ts` — `COMMANDES`, `CommandeId`, `Commande`, `CommandeDescripteur`, `RefusCommande`, `ResultatSaisie`, `ResultatCommande` | registre + types | expose | § 5, L1 |
| `analyserSaisie(saisie: string): ResultatSaisie` | fonction pure | expose | § 5, L1 |
| `destinationsPossibles(dossier, session): readonly string[]` | fonction pure | expose | § 5, L1 — **deux appelants**, un par lot |
| `executerCommande(dossier, session, commande): ResultatCommande` | fonction pure | expose | § 5, L1 |
| `EntreeJournal.origine?: CommandeId` | type | expose | optionnel **à vie** (KR-251) |
| `MagasinDeSession { ecrire }` | port (type pur) | expose | `ecrire` **seule** |
| `createMagasinDeSession(brut: PersistenceService): MagasinDeSession` | fabrique | expose | `brain/MagasinDeSession.ts` |
| `Brain.sessions: MagasinDeSession` | service | expose | construit sur **`local`**, jamais `sync` |
| `DESTINATION_DES_CHAMPS_DE_SESSION` | registre | expose | +`'journal[].origine': 'moteur'` — **zéro ligne `'ia'`** |
| `Lieu.acces?: string[]` | type | consomme | **orienté**, optionnel, liste vide = état calme |
| `PersistenceService` | service | consomme | par le port seulement |

**`types.ts`, `destinations.ts` et `validate.ts` ne sont ouverts par AUCUN lot** — la Décision A (lot `contrat` du schéma du dossier) **n'est pas déclenchée**. Mesuré : la docstring de `DUREE_MIN` (`types.ts:262-266`) reste vraie verbatim après l'amendement de `§ J1`.

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | **AUCUN.** Zéro appel de modèle, zéro construction d'URL `/ia/`, zéro import de `CopiloteService`. |
| Schéma de sortie | **Sans objet.** |
| Échec de validation | **Sans objet.** |
| Ce que l'IA **ne** fait **pas** | **tout** : elle n'existe pas dans cette feature. `moteurSansIA.test.ts` le **prouve** sur une liste de fichiers dérivée du disque — les 5 fichiers neufs du périmètre y entrent **sans geste** (mesuré : plancher 20, total ≈ 52). |
| Audience de session | `'journal[].origine': 'moteur'`. **Zéro ligne `'ia'`**, et le commentaire de `journal[].texte` est **amendé pour révoquer la prévision d'it1** — en COMMENTAIRE, jamais en valeur (KR-195/196) : ce champ ne basculera pas, il ne porte que des **handles**, et une table indexée par CHEMIN ne peut pas discriminer par valeur de `role`. La n° 10 donnera à sa prose **son propre chemin**. |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. **L1 ∩ L2 = ∅** — L1 ne contient aucun `src/features/**`, L2 rien hors `src/features/play-mode/**`.

### Lot 1 — `session-commandes` · **`contrat`**

- **Ouvrier** : `dev-contrat` (effort élevé, **seul et en premier**)
- **But** : figer le registre clos des commandes, la transition `aller`, le champ `origine`, le port de stockage et son câblage sur le magasin **brut**.
- **Fichiers** :
  - (N) `src/brain/dossier/commandes.ts`
  - (N) `src/brain/dossier/commandes.test.ts`
  - (N) `src/brain/MagasinDeSession.ts`
  - (N) `src/brain/MagasinDeSession.test.ts`
  - (N) `src/brain/components/Field.test.tsx` — **aucun test de `Field` n'existe au dépôt** (mesuré) ; une propriété nommée sans test est une intention (KR-169)
  - (R) `src/brain/components/Field.tsx` — **`mono?` seule**
  - (R) `src/brain/dossier/session.ts` — port + `EntreeJournal.origine?` ; **aucune racine neuve**
  - (R) `src/brain/dossier/sessionDestinations.ts` — union + ligne `'moteur'` + commentaire amendé de `journal[].texte`
  - (R) `src/brain/dossier/__fixtures__/session-saturee.ts` — **obligatoire** : sans instance, la ligne neuve est morte et `sessionCouverture.test.ts:85-92` rougit
  - (R) `src/brain/dossier/sessionCouverture.test.ts` — justesse seule : la dispense « ses **trois** feuilles » → « **quatre** »
  - (R) `src/brain/BrainContext.tsx` — champ `sessions`, construit sur `local`
  - (R) `src/brain/index.ts` — baril
  - (R) `src/brain/persistenceKeys.ts` — le bloc ⚠ de `DOSSIER_SESSION_KEY_PREFIX` **devient faux**, il se réécrit
  - (R) `docs/EXIGENCE-APERCU-DU-JEU.md` — § 6 : `commandes.ts` rejoint les purs extractibles
  - (R) `docs/REGLES-PLAY.md` — **§ J1**, phrase exacte au § 8, O-6
- **Nom RÉSERVÉ à L1**, que nul autre lot ne crée : `src/brain/dossier/deplacement.ts` — si `commandes.ts` franchit 400 lignes (KR-112), la transition `aller` y part.
- **INTERDITS, et verts sans modification à la fin** : `tourzero.ts`, `tourzero.test.ts`, `tourzeroOracle.test.ts`, `predicates.ts`, `deltas.ts`, `destinations.ts`, `types.ts`, `validate.ts`, `feuilles.ts`, `couverture.test.ts`, `expr.test.ts`, `controles.ts`, `brain/components/EditorTopBar.tsx`, `src/player/**`, **et tout `src/features/**`**.
- **Critères couverts** : #1, #2, #3, #5 (moitié unité), #6

**Signatures exposées :**

```ts
// src/brain/dossier/commandes.ts
import { defineRegistre, type EspaceDeNoms } from './identifiers'
import type { EtatSession } from './session'
import type { Dossier } from './types'

export interface CommandeDescripteur {
	label: string                            // libellé français, jamais une syntaxe
	verbe: string                            // le mot-clé saisi, MAJUSCULES
	refKinds: readonly EspaceDeNoms[]        // l'ARITÉ est `refKinds.length`, DÉRIVÉE (KR-165)
}

export const COMMANDES = defineRegistre<CommandeDescripteur>()({
	aller: { label: 'va au lieu', verbe: 'ALLER', refKinds: ['lieu'] },
})
export type CommandeId = keyof typeof COMMANDES

export interface Commande {
	readonly commande: CommandeId
	readonly cibles: readonly string[]
}

export type RefusCommande = 'verbe_inconnu' | 'arite_invalide' | 'cible_inconnue' | 'acces_absent'

export type ResultatSaisie =
	| { readonly ok: true; readonly commande: Commande }
	| { readonly ok: false; readonly refus: 'verbe_inconnu' | 'arite_invalide'; readonly message: string }

export type ResultatCommande =
	| { readonly ok: true; readonly session: EtatSession }
	| { readonly ok: false; readonly refus: RefusCommande; readonly message: string }

export function analyserSaisie(saisie: string): ResultatSaisie
export function destinationsPossibles(dossier: Dossier, session: EtatSession): readonly string[]
export function executerCommande(dossier: Dossier, session: EtatSession, commande: Commande): ResultatCommande
```

**Interne, NON exporté** : `const TRANSITIONS: Record<CommandeId, Transition>` — exhaustif **par compilation** (un verbe de plus ne compile pas sans sa ligne). **Jamais un `switch`** (KR-117 ; `deltas.ts:45-46` : « comme CHAMP DU DESCRIPTEUR »).

**Bornes de `analyserSaisie`, normatives :**
1. `trim` puis découpe sur l'espace. **Arité `===`, jamais `>=`** : exactement `1 + refKinds.length` jetons, au-delà → `arite_invalide`. Avaler une queue de jetons est la façon dont un canal de texte libre s'ouvre (N-12).
2. **Ne consulte PAS le dossier** : verbe et arité seulement. `ALLER <ordure>` rend `{ ok: true, cibles: ['<ordure>'] }` — la résolution appartient à `executerCommande`.
3. Ni grammaire, ni état, ni récursion, ni précédence. **Aucune sortie persistée** hors la `Commande` (clé de registre + handles).
4. `saisie` ne peut être interpolée que dans le `message` d'un résultat `{ ok: false }` — **jamais** dans une `Commande`, **jamais** dans une `EntreeJournal`.

**`destinationsPossibles`** rend `lieux[lieu_courant].acces ?? []` **tel quel** : non dédoublonné, **non filtré des références pendantes**.

**`executerCommande`** — pure, totale, synchrone. **Sur un refus, rend la MÊME référence de session** (`expect(resultat.session).toBe(session)` doit être satisfiable). Ordre des refus : `acces_absent` (∉ `destinationsPossibles`) **puis** `cible_inconnue` (∈ accès mais non résolue dans `monde.lieux` — la pendante est **nommée**, KR-021 ; **on ne lève pas** : KR-238 vise l'évaluateur d'`ExprNode`, et lever sur un chemin utilisateur donne un écran blanc).

**Ce que `aller` écrit, et rien d'autre** : `monde.lieu_courant`, `monde.lieux_visites` (**append si absent** — sémantique d'ensemble), `horloge.tour` (+1), `journal` (deux entrées). **Aucun champ de session neuf hors `origine`.**

```ts
// src/brain/dossier/session.ts — amendements
import type { CommandeId } from './commandes'   // TYPE SEUL — effacé à l'émission, aucun cycle
                                                 // au runtime. Précédent mesuré au dépôt :
                                                 // `brain/copilote/contexte/prose.ts:11-19`, dont la
                                                 // docstring avertit qu'un import de VALEUR en créerait
                                                 // un vrai. Ne jamais transformer cette ligne.

export interface EntreeJournal {
	readonly tour: number
	readonly role: RoleJournal
	readonly texte: string
	/** LA CAUSE, clé du registre CLOS des commandes — jamais de la prose, jamais une
	 *  chaîne libre (KR-247/248). Optionnel À VIE (KR-251).
	 *  PRÉSENT SUR L'ENTRÉE QUI PORTE L'EFFET (`role: 'moteur'`), ABSENT SUR CELLE QUI
	 *  PORTE LA DEMANDE (`role: 'joueur'`), dont le `texte` contient déjà le verbe en
	 *  clair — l'y stocker serait un dérivable stocké (KR-013).
	 *  Invariant : `journal.every(e => e.origine === undefined || e.role === 'moteur')`.
	 *  ÉCRIT par `commandes.ts`, LU par `JournalRow` — les deux chemins de code existent
	 *  dans CETTE itération (KR-249). */
	readonly origine?: CommandeId
}

/**
 * LE PORT DE STOCKAGE DE SESSION — TYPE PUR, donc extractible avec `src/player/`.
 *
 * SON MOTIF A CHANGÉ, ET C'EST ÉCRIT POUR QUE PERSONNE N'HÉRITE DU PÉRIMÉ : il ne se
 * justifie PAS par l'extractibilité (dont la prémisse n'est pas armée — `src/player/`
 * ne reçoit aucun fichier en it2 non plus), mais par la FRONTIÈRE magasin brut /
 * décorateur de synchronisation, qu'aucune feature ne peut franchir autrement.
 */
export interface MagasinDeSession {
	ecrire(dossierId: string, session: EtatSession): void
	// `lire` / `effacer` : PAS ENCORE. Ajouter une méthode à une interface est ADDITIF ;
	// contrairement à un champ persisté, elle ne se paie pas d'être ajoutée plus tard.
	// Elles entrent avec la REPRISE et son `validerSession` (KR-116).
}
```

```ts
// src/brain/MagasinDeSession.ts
export function createMagasinDeSession(brut: PersistenceService): MagasinDeSession
// BrainContext : const sessions = createMagasinDeSession(local)   // ← `local`, PAS `sync`
// Brain :        sessions: MagasinDeSession
```
Câblé exactement comme `createUIPreferencesService(local)` (`BrainContext.tsx:86`), `createMonsterLibraryService(local)` (`:88`), `createCloudSettings(local)` (`:94`) — **quatrième** service étroit sur le magasin brut, jamais une porte brute exposée.

**Amendement de `__fixtures__/session-saturee.ts`** (valeur exacte, aucun autre champ ne bouge) :
```ts
	journal: [
		{ tour: 7, role: 'joueur', texte: '> ALLER lieu.val-cendre' },
		{ tour: 7, role: 'moteur', texte: 'lieu_courant : lieu.le-fanal → lieu.val-cendre', origine: 'aller' },
	],
```
Sens du déplacement imposé : la fixture porte déjà `lieu_courant: 'lieu.val-cendre'` — le sens inverse la contredirait. Le retour est cohérent avec les trois champs et **montre une re-visite sans doublon**. Docstring à amender : « DEUX ENTRÉES DE JOURNAL, une par membre de `RoleJournal` » → « …, **et un seul PAS** : les deux portent `tour: 7` — une demande et son effet » ; plus « *Les deux `texte` sont des RELEVÉS D'ÉTAT. Cette fixture est le seul exemplaire de ligne de journal du dépôt : elle est donc LE MODÈLE.* »

**Trois pièges mesurés, en autocontrôle avant commit :**
1. `expr.test.ts:409-420` balaie `readdirSync(brain/dossier)` `.ts` **non-test** et cherche `/\.?\bop\s*===\s*'/` et `/\bswitch\s*\(\s*[\w.]*\bop\s*\)/` **commentaires compris**, puis compare la liste triée à `[atteignabilite.ts, expr.ts, tourzero.ts]`. **`commandes.ts` ne doit écrire ni l'un ni l'autre, même en docstring** — écrire « l'opérateur du nœud ».
2. `expr.test.ts:457-486` balaie `brain/dossier/` **tests compris** sur 4 **noms** (`parseExpr`, `parseCondition`, `compileExpr`, `lexExpr`), en position de **déclaration ou d'appel**. C'est une garde de noms : ne nommer aucune fonction ainsi.
3. `couverture.test.ts:498-515` exige `porteurs === ['feuilles.ts']` : ne recopier aucune signature `feuillesDeLaFixture`.

### Lot 2 — `console-deplacement`

- **Ouvrier** : `dev-lot` (effort standard, **après L1, contrat figé**)
- **But** : la console, la liste de journal, le câblage de l'état de session mutable, et la scission d'`EcranPartie` (388 lignes mesurées, à 12 du signal KR-112).
- **Territoire EXCLUSIF** : `src/features/play-mode/**` — **zéro fichier hors du territoire**, et aucun autre lot n'y entre.
  - (R) `src/features/play-mode/components/EcranPartie.tsx`
  - (N) `src/features/play-mode/components/CadrePartie.tsx` — le `Cadre` extrait (un composant par fichier)
  - (N) `src/features/play-mode/components/EcranRefus.tsx` — avec le registre `REFUS`
  - (N) `src/features/play-mode/components/ConsoleCommandes.tsx`
  - (N) `src/features/play-mode/components/JournalRow.tsx`
  - (R) `src/features/play-mode/hooks/useSessionPersistee.ts`
  - (N) `src/features/play-mode/tests/deplacement.test.tsx`
  - (N) `src/features/play-mode/tests/consoleCommandes.test.tsx`
  - (R) `src/features/play-mode/tests/ouvertureVerbatim.test.tsx` *(si la scission déplace un nœud)*
- **Critères couverts** : #1 (bout du câblage), #4, #5 (moitié composant)

**Signatures :**
```ts
export interface JournalRowProps { readonly entree: EntreeJournal }

export interface ConsoleCommandesProps {
	onSoumettre: (saisie: string) => void       // la chaîne BRUTE — la console ne valide RIEN
	refus: string | null                        // message COMPOSÉ PAR LE MOTEUR, jamais recomposé ici
	destinations: readonly string[]             // = destinationsPossibles(...), rendu tel quel
}

export function useSessionPersistee(dossierId: string, session: EtatSession): void   // signature INCHANGÉE
```

`useSessionPersistee` **garde sa signature** et bascule en interne de `useBrain().persistence` vers `useBrain().sessions` — c'est le point de rendez-vous qui évite que la scission d'`EcranPartie` et le changement de magasin se croisent. Son `useEffect` reste légitime (synchronisation avec un système externe, aucune valeur ne revient vers le rendu) ; sa docstring ⚠ sur la poussée cloud **est réécrite** : la question est tranchée, la session est un état d'appareil.

`PartieEnCours` tient `const [session, setSession] = useState(sessionInitiale)` — **valeur initiale**, jamais un miroir. **Aucun `useEffect(() => setSession(…))`** : le relevé `rg -n -U --multiline-dotall "useEffect\(\(\) => \{[^}]{0,120}\bset[A-Z]\w*\("` de l'auto-revue doit remonter **zéro site neuf** (KR-013/113).

## 6 — Critères d'acceptation

*(6 — plafond de la QA, sous le maximum de 8.)*

1. **Étant donné** `dossier-reference.json` et une session dont `lieu_courant = 'lieu.foyer-du-guet'` (fixture réelle : `acces = ['lieu.marche-des-cendres', 'lieu.tour-effondree']`), **quand** la commande `ALLER lieu.tour-effondree` est exécutée (la cible est le **2ᵉ** élément, jamais le 1ᵉʳ), **alors** `monde.lieu_courant === 'lieu.tour-effondree'`, `lieux_visites` contient la cible, `horloge.tour` a augmenté de 1, le journal porte **deux** entrées de **même `tour`** — `{ role:'joueur', texte:'> ALLER lieu.tour-effondree' }` sans `origine` et `{ role:'moteur', texte:'lieu_courant : lieu.foyer-du-guet → lieu.tour-effondree', origine:'aller' }` — et `journal.every(e => e.origine === undefined || e.role === 'moteur')` tient. — *niveau : unitaire* — *lot 1*
   **Scénario séparateur** : la fixture porte **≥ 2 accès** et vise le **second** ; l'implémentation fautive `const cible = lieu?.acces?.[0]` rend un résultat **différent**.

2. **Étant donné** `dossier-reference.json` et une session dont `lieu_courant = 'lieu.tour-effondree'` — dont l'`acces` est **absent** alors que `foyer-du-guet → tour-effondree` existe (asymétrie réelle de la fixture) —, **quand** `ALLER lieu.foyer-du-guet` est exécutée, **alors** le refus est `acces_absent`, `executerCommande` rend **la même référence de session**, et `lieu_courant`, `lieux_visites`, `journal` **et `horloge.tour`** sont tous inchangés — **un refus ne consomme aucun pas**. — *niveau : unitaire* — *lot 1*
   **Scénario séparateur** : sans l'asymétrie, l'implémentation fautive `lieuActuel.acces?.includes(cible) || lieuCible?.acces?.includes(lieuActuel.id)` rendrait le **même** résultat qu'une résolution orientée.

3. **Étant donné** `dossier-minimal.json` et une session dont `lieu_courant = 'lieu.val-cendre'` et `lieux_visites = ['lieu.val-cendre']` (la fixture porte l'auto-référence `acces = ['lieu.val-cendre']`), **quand** `ALLER lieu.val-cendre` est exécutée, **alors** la commande est **acceptée** (jamais un refus — l'auto-référence est légale), `lieux_visites` reste `['lieu.val-cendre']` **sans doublon**, `lieu_courant` est inchangé, et `horloge.tour` a **quand même** augmenté de 1 — c'est la DEMANDE qui consomme le pas, pas l'effet. — *niveau : unitaire* — *lot 1*
   **Scénario séparateur** : l'implémentation fautive `[...lieux_visites, cible]` produit un doublon qu'une assertion sur `lieu_courant` seul ne verrait jamais.

4. **Étant donné** une session dont `journal` porte une entrée `role:'joueur'` **sans** `origine` et une entrée `role:'moteur'` **avec** `origine:'aller'`, **quand** la zone Journal est rendue, **alors** `TEXTE_JOURNAL_VIDE` a disparu, chaque entrée est rendue par `JournalRow` avec son `texte` exact et son badge distinct (`↪ JOUEUR` / `↻ MOTEUR`), **la cause `[aller]` apparaît sur la seule ligne `moteur`**, et aucune ligne n'affiche le mot « tour ». — *niveau : composant* — *lot 2*
   **Scénario séparateur** : un composant qui rendrait `origine` inconditionnellement (ou depuis le `role`) l'afficherait **aussi** sur la ligne `joueur` ; l'entrée sans `origine` est l'état qui sépare.

5. **Étant donné** une saisie hors registre (`SAUTER lieu.x`), une saisie d'arité fautive (`ALLER`, `ALLER lieu.x lieu.y`) et une saisie vide, **quand** elles sont soumises, **alors** chacune est refusée par un message nommé — **jamais silencieusement ignorée** — dont la liste de commandes est **dérivée** de `COMMANDES`, et ce message s'affiche sous le champ sans que la saisie fautive soit effacée. — *niveau : unitaire (`analyserSaisie`) + composant (rendu)* — *lots 1 et 2*
   **Mutant obligatoire, écrit et vérifié ROUGE dans le lot** : un **deuxième verbe fictif** ajouté au registre **dans le test seul** — `(COMMANDES as unknown as Record<string, CommandeDescripteur>).sauter = { label: 'saute', verbe: 'SAUTER', refKinds: ['lieu'] }` (mesuré : `defineRegistre` ne gèle rien, `identifiers.ts:27-30`) — le message doit alors lister `ALLER, SAUTER`. Sans ce mutant, une liste en dur `"Commandes disponibles : ALLER."` passerait le critère : **avec un seul verbe, rien ne sépare.**
   **Le registre est un singleton de module : le mutant DOIT être révoqué** (`delete`, dans un `finally` ou un `afterEach`), sinon les tests suivants du même fichier s'exécutent sur un registre pollué — et c'est un faux vert qui se propage, pas un échec qu'on voit.

6. **Étant donné** un `Brain` construit avec un transport dont le `push` ne résout jamais, **quand** une commande `ALLER` acceptée modifie la session et que `useSessionPersistee` l'écrit, **alors** la session est lisible sous `dossierSessionKey(dossierId)` **et** `brain.sync.pendingCount()` vaut **0** — la session ne part **jamais** dans la file de synchronisation ; **et** dans le **même test**, une écriture de dossier fait monter `pendingCount()` à **1**. — *niveau : unitaire + hook (RTL)* — *lots 1 et 2*
   **Scénario séparateur, mesuré** : sans la contre-épreuve à 1, l'assertion à 0 est **vraie par construction** — `queuePush` sort tôt quand `transport === undefined` (`CloudSyncService.ts:158-159`), et l'instrument ne mesure rien (BUG-084). Et un critère de **relecture** n'aurait rien séparé non plus : `CloudSyncService.get` délègue à `local.get`, donc il est vert dans les deux magasins (BUG-113).

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `commandes.test.ts` — « déplacement le long d'un accès orienté » | critère 1, cible en position 1 | jest unité | KR-021, KR-247 | L1 |
| `commandes.test.ts` — « refus sur une arête asymétrique » | critère 2 + `toBe(session)` + aucun pas consommé | jest unité | KR-013 | L1 |
| `commandes.test.ts` — « auto-référence acceptée, sans doublon » | critère 3 | jest unité | KR-247 (état séparateur) | L1 |
| `commandes.test.ts` — « impasse : `acces` absent ou vide » | refus, zéro entrée, `horloge.tour` inchangé, **jamais une anomalie** | jest unité | état calme, `types.ts:1014` | L1 |
| `commandes.test.ts` — « référence pendante nommée » | refus `cible_inconnue` dont le message **nomme** la pendante ; **ne lève pas** | jest unité | KR-021, KR-238 (borne) | L1 |
| `commandes.test.ts` — « le texte est RECONSTRUIT, jamais un écho » | `aller lieu.x` (bas de casse) produit `> ALLER lieu.x` ; aucun caractère de la saisie dans `texte` | jest unité | KR-232 | L1 |
| `commandes.test.ts` — « arité stricte » | `ALLER lieu.x lieu.y` → `arite_invalide` ( `===`, jamais `>=` ) | jest unité | N-12 | L1 |
| `commandes.test.ts` — « liste des verbes dérivée du registre » | critère 5, **mutant 2ᵉ verbe** écrit et vu ROUGE | jest unité | KR-117 | L1 |
| `commandes.test.ts` — « pliage : même séquence, même état » | `toEqual` ; **M1 et M2 écrits, vus ROUGES, révoqués** — voir ci-dessous | jest unité | KR-242 (partiel), immutabilité runtime | L1 |
| `MagasinDeSession.test.ts` — « la session n'entre pas dans la file » | critère 6 **avec la contre-épreuve à 1** | jest unité | KR-011/111, KR-022 | L1 |
| `Field.test.tsx` — « `mono` bascule la boîte en `--font-mono` » | + le cas par défaut (`--font-ui`) : **les deux sens** | jest composant | KR-169 | L1 |
| `sessionCouverture.test.ts` (R) | `'journal[].origine'` instanciée, 8 racines, **zéro ligne `'ia'`** | jest contrat | KR-232, KR-241 | L1 |
| `consoleCommandes.test.tsx` — « refus rendu, saisie conservée » | critère 5 (moitié composant) + focus conservé | jest composant | — | L2 |
| `consoleCommandes.test.tsx` — « impasse calme » | le `<form>` disparaît, le texte d'impasse s'affiche, **aucune erreur** | jest composant | états vides | L2 |
| `consoleCommandes.test.tsx` — « accès rendus tels quels » | ni dédoublonnés, ni filtrés, **identifiants** jamais `nom` | jest composant | KR-021, KR-232 | L2 |
| `deplacement.test.tsx` — « l'état vide cède la place aux lignes » | critère 4, dont `[aller]` sur la seule ligne `moteur` | jest composant | KR-013 | L2 |
| `deplacement.test.tsx` — « bout de câblage » | saisie → `onSoumettre` → nouvelle session → journal re-rendu | jest composant | — | L2 |
| `moteurSansIA.test.ts` (existant, **non modifié**) | zéro `fetch`, zéro `CopiloteService`, zéro URL `/ia/` sur les 5 fichiers neufs du périmètre | jest test-grep | KR-250 | — |
| `expr.test.ts` (existant, **non modifié**) — « aucune fonction de parsing dans `brain/dossier/` » | `commandes.ts` ne déclare ni n'appelle `parseExpr`/`parseCondition`/`compileExpr`/`lexExpr` | jest test-grep | **KR-168** | — |
| `expr.test.ts` (existant, **non modifié**) — le recensement des lecteurs d'arbre | `commandes.ts` n'écrit ni `op === '` ni `switch (…op)`, **docstrings comprises** | jest test-grep | KR-117 | — |

**Les deux mutants obligatoires du pliage (condition BUG-087, non négociable)** — le lot les **ÉCRIT**, constate le ROUGE, révoque :

| Mutant | Code exact | Pourquoi rien d'autre ne le voit |
|---|---|---|
| **M1 — état caché** | `let n = 0` au module, puis `tour: ++n` au lieu de `session.horloge.tour + 1` | `tsc` muet (aucun type violé) · ESLint muet · `exhaustive-deps` hors sujet (pas un hook) · **le critère 3 ne rougit que par ordre de tests** — au premier appel, `+1` est satisfait : le critère épingle le **CALCUL**, jamais **LA SOURCE** (BUG-113) |
| **M2 — évasion de type** | `(session.monde.lieux_visites as string[]).push(cible)` puis retour de la même référence | `tsc` muet (l'évasion est explicite) · **le grep `as any` le manque** — `as string[]` ne contient pas `any` · le second pliage part d'un `S0` pollué |

**Si le pliage reste VERT sur l'un des deux, l'assertion tombe** et la revue écrit qu'aucun instrument d'it2 ne couvre ce mode de panne. On ne compte jamais vert ce qui n'a pas séparé.

**Cas limites couverts** : vide (saisie, journal, `acces`) · doublon (`lieux_visites`, `acces`) · référence orpheline (nommée, jamais filtrée) · auto-référence · arité en trop · casse à la saisie · impasse. **Non couverts et assumés** : très long (journal borné par une **mesure**, pas un test) · hors ligne (hors périmètre du port) · annulation · double soumission.

**Non vérifiable en l'état — à recopier tel quel dans la revue d'itération :**
- **KR-242, replay déterministe** : **aucun critère**. Il n'existe **aucune source d'entropie** en it2 — `ouvrirSession` est pure, `graine_alea` n'est lue par personne avant la n° 11, la résolution d'un accès est déterministe. Un témoin « rejeu = même résultat » serait vert sur toute implémentation fautive-mais-déterministe : il épinglerait une coïncidence. Le pliage retenu couvre **l'état caché et l'évasion de type**, jamais le hasard. **Le critère littéral part à la n° 11.**
- **KR-243** : `commandes.ts`, la transition et le port sont **hors du score de mutation** (borné à `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`). `jest` en couverture de lignes est leur **unique** instrument. `npm run test:mutation` **n'est pas lancé** pour ce diff.
- **Immutabilité runtime de `S0`** : portée par le typage (`EtatSession`/`EtatMonde` entièrement `readonly` — `push` ne compile pas) **plus** M2 s'il rougit. Aucun objet n'est gelé à l'exécution.
- **La borne de persistance du journal** : **MESURÉE**, jamais un `expect`. Protocole : sessions synthétiques à `N ∈ {10, 50, 100, 500}` entrées de la forme réelle du § 3.D, `Buffer.byteLength(JSON.stringify(session), 'utf8')` (**jamais** `.length`, qui compte des unités UTF-16), coût marginal par régression, extrapolation à ~200 pas, confrontée en commentaire aux quotas usuels de `localStorage`. Script **jetable** (scratchpad), jamais une assertion committée. Les 4 mesures + le coût marginal + l'extrapolation vont dans la revue, **en texte**. Elle s'exprime en « nombre de **pas** avant N kio » et **ne dit rien** de la borne d'**injection**, qui appartient à la n° 10 : l'unité n'est pas la même.
- **Le clic bout en bout éditeur → console → journal** : couvert **en deux moitiés** (RTL), jamais en une. Aucun instrument E2E au dépôt.
- **D-6, l'infobulle du CTA désactivé** : toujours reportée, faute du relevé navigateur.
- **La couleur de `porteJouable.test.tsx` et `ouvertureVerbatim.test.tsx` après la scission d'`EcranPartie`** : non mesurée au raffinage — **à mesurer par L2**, d'où le territoire exclusif plutôt qu'une liste au caractère près.
- **`tsc` après le champ `sessions` sur `Brain` et après le `import type` croisé `session.ts` ↔ `commandes.ts`** : non rejoué au raffinage. Mesure statique seule : aucun test ne construit un littéral `Brain`.

## 8 — Registre des désaccords

*(Aucun désaccord ne disparaît sans statut. Les `REJETÉ` d'annexe sont recopiés ici — un refus resté en annexe n'existe pas pour l'essaim, précédent BUG-082.)*

### Les cinq désaccords ouverts du tour 1

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| X-1 | ux / tech-lead | `Field.tsx` vit dans `brain/` : le contrat de design n'était réalisable par aucun lot | **RETENU — issue (a)**, porté par **L1** | Les deux rôles convergent. (b) forkerait l'anatomie du champ dans une feature (KR-109) ; (c) mettrait des identifiants en `--font-ui`. Coût : 2 props → **1 prop** après O-1, 25 appelants inchangés |
| X-2 | narratif / tech-lead | `journal[].origine?` entre-t-il en it2 ? | **RETENU** — porté par **L1** ; le tech-lead **cède** (T-12 retirée pour ce champ seul) | Un déplacement **n'est pas un delta** (`deplacer_vers` écarté de `DELTAS`, mesuré) : sans `origine`, `journal[].deltas` sera vide sur une entrée de déplacement en it3 et la première ligne de journal du projet resterait **sans cause auditable, à vie**. Coût mesuré : +2 fichiers en L1, 8 racines toujours 8 |
| X-3 | narratif / qa / tech-lead | Le rejeu | **REPORTÉ (critère littéral → n° 11)** + **RETENU (pliage, sous condition)** | La QA a mesuré qu'aucune entropie n'existe ; le narratif a nommé **deux** implémentations fautives que le pliage attrape (état caché, évasion de type) et montré que le grep `as any` proposé en repli **manque M2**. Le pliage reste **à la condition BUG-087** : les deux mutants écrits et vus rouges, sinon l'assertion tombe |
| X-4 | pm / tech-lead / qa | Le port de stockage | **RETENU — `ecrire` SEULE**, motif **substitué** | Le PM **retire** ses deux objections : la substitution (frontière magasin brut / décorateur de synchronisation) est vérifiable aujourd'hui, non spéculative. La revue l'écrit noir sur blanc — un lot qui hériterait du motif périmé livrerait trois méthodes vides |
| X-5 | ux / tech-lead / narratif | L'algorithme de la console | **RETENU** — `analyserSaisie` dans `commandes.ts`, **la console ne valide rien** | Deux décideurs divergeront (KR-013) ; et une règle de jeu ne vit qu'à un seul endroit. Un `split` à arité **dérivée**, sans état ni récursion ni sortie persistée, n'est pas un parseur au sens de KR-168 — sous les **trois bornes** du § 5 |

### Les arbitrages de l'orchestrateur

| # | Arbitrage | Statut | Motif |
|---|---|---|---|
| **O-1** | `Field` gagne **`mono?` SEULE**, pas `list?` | **RETENU** | L'UX a **retiré** le `<datalist>` au tour 2 sur mesure (jsdom ne témoigne d'aucune autocomplétion) ; le tech-lead a écrit `list?` **en parallèle**, avant de l'avoir lue. Une prop sans appelant est KR-109 — la faute même que T-2/T-17 invoquent. **T-18 devient sans objet et est retiré** |
| **O-2** | **`JournalRow` REND `origine`** | **RETENU** | Contredit l'UX (« `JournalRow` ne le rend pas en it2 »), écrite avant que le tech-lead ne cède sur X-2. **KR-249 — la règle même qui admet `origine` — exige un chemin de code qui l'ÉCRIT et un autre qui le LIT.** Un test est un instrument, pas un chemin de code : c'est pourquoi `graine_alea` et `dossier_maj` ont dû recevoir des **exemptions nommées** en it1. Sans lecteur, `origine` serait la **troisième exemption en deux itérations** — et une règle à trois exceptions n'en est plus une. Rendu : `[{origine}]`, jeton `metaJournal` existant, **zéro token neuf** |
| **O-3** | L'invariant d'`origine` et « un refus ne consomme aucun pas » entrent dans le `Alors` de **C1** et **C2** | **RETENU** | Le plafond de **6** critères tient. Aucun C7 |
| **O-4** | Le **critère** de replay déterministe est **REPORTÉ à la n° 11** ; l'assertion de pliage reste en L1 | **REPORTÉ + RETENU sous condition** | Voir X-3. La revue écrit KR-242 « vérifié par personne » pour la partie entropie |
| **O-5** | **2 lots**, exécution **séquentielle** | **RETENU** | Tout ce que L2 livre converge sur `EcranPartie.tsx` ; un 3ᵉ lot devrait le partager. Le découpage ne crée pas le parallélisme |
| **O-6** | `docs/REGLES-PLAY.md § J1` reçoit sa phrase **dans L1**, **avant** le code | **RETENU** | KR-130 : la doc des règles fait foi, et **elle désigne elle-même la n° 9 comme propriétaire** du pas d'horloge. C'est à cette itération d'écrire la réponse, pas de la subir |
| **O-7** | Le **veto N-1** du narratif est **requalifié en GARDE-FOU** | **REQUALIFIÉ** | Il vise une proposition que **personne n'a faite** — même forme que T-1, que le tech-lead a lui-même requalifié au tour 2. Un veto sans proposition est un épouvantail. **Le garde-fou reste écrit, le veto se réarme si un lot le propose** |

### `docs/REGLES-PLAY.md § J1` — la phrase exacte à écrire (O-6)

La première phrase de `§ J1` est **conservée**. C'est la phrase `✍️` qui est remplacée, mot pour mot, par :

> **Tranché par la feature n° 9 `moteur-dossier`, itération 2 (2026-09-20) : un (1) pas d'horloge de session = une (1) commande de joueur ACCEPTÉE par le moteur.** Une commande refusée ne consomme aucun pas. Une commande acceptée dont l'état du monde ne bouge pas — déplacement auto-référent — en consomme un : c'est la DEMANDE qui compte, jamais l'effet. Une conséquence enchaînée par le moteur dans la même résolution (jalon franchi, événement consommé) n'ajoute **jamais** de pas, sans quoi `plan_actions[].duree` cesserait d'être prévisible pour l'auteur qui l'écrit. Le pas n'a **aucune durée de fiction** : il ne se convertit ni en heures ni en journées, et aucune date n'en est dérivée.
>
> **Le mot « tour » reste réservé au round de combat par `REGLES-DU-JEU.md` ; le pas de session se dit « pas ».** Les champs `EtatSession.horloge.tour` et `journal[].tour` portent ce mot par **dette de nommage gelée à l'itération 1** — `schema: 1` n'ayant aucun chemin de migration (KR-160/191), ils ne seront pas renommés. Ce n'est **pas** une levée de la réserve : aucun champ neuf, aucun libellé d'écran, aucune prose ne reprennent le mot — l'écran de partie affiche le numéro nu (`#7`).

**Mesuré** : `types.ts:262-266` (docstring de `DUREE_MIN`) reste vrai **verbatim** — le pas s'appelle « pas », le champ porte une dette. `types.ts` **reste hors de L1** et la Décision A n'est pas déclenchée.

### Le test de discrimination du journal — à appliquer avant d'écrire la moindre ligne

> **La ligne contient-elle un seul mot que l'AUTEUR a tapé dans son dossier, ou un seul caractère que le JOUEUR a tapé au clavier ?**
> Oui → c'est de la prose détournée : refus. Non → c'est un relevé d'état.

Ce qui le rend **mécanique** et non déclaratif : **la ligne `joueur` est RECONSTRUITE, jamais un écho.** Le verbe vient de `COMMANDES[id].verbe`, la cible de l'identifiant **résolu** dans `monde.lieux`. Pas un caractère de la saisie n'entre dans `texte`, casse comprise.

**Vocabulaire admis dans `texte`, liste fermée** : (i) les verbes du registre clos, en MAJUSCULES ; (ii) les noms de champs d'`EtatMonde` en bas-de-casse ; (iii) des identifiants `espace.slug` provenant du dossier ; (iv) les séparateurs `>`, `:`, `→`. **Rien d'autre.** Espacement exact : `lieu_courant : x → y`. Le `>` n'apparaît **que** sur `role: 'joueur'` — la ligne persistée doit rester lisible sans `JournalRow`.

### Tous les REJETÉ, recopiés d'annexe

| # | Rejeté | Statut | Motif |
|---|---|---|---|
| T-1 | Exposer `local` sur `Brain` | **GARDE-FOU** (requalifié par son auteur) | Porte brute non synchronisée ouverte à toutes les features, que ni ESLint ni la revue ne rattrapent. **Veto réarmé si un lot le propose** |
| T-2 | Le port à trois méthodes en it2 | REJETÉ | `lire`/`effacer` sans appelant = KR-109. « Ça ne se rétro-ajoute pas » vaut pour une **donnée persistée**, jamais pour une **interface** |
| T-3 | La reprise / relecture d'une session | REJETÉ (→ itération de la reprise) | Traîne `validerSession` (KR-116) + un chemin d'interface : **seconde phrase de démo** |
| T-4 | `rejouer()` de production | **VETO**, satisfait — le narratif retire (N-6) | Un seul appelant (KR-109) **et** aucun scénario séparateur avant la n° 11 |
| T-5 | La logique de déplacement dans `session.ts` | REJETÉ | Mêle forme et transition, pousse le fichier vers ~380 lignes, et **rouvre en it2 le fichier que le lot `contrat` d'it3 doit rouvrir** |
| T-6 | Cette logique dans `play-mode` ou `src/player/` | REJETÉ | Extractibilité (le runtime doit déplacer sans l'éditeur) + `expr.test.ts:420` borne le moteur à `brain/dossier/` |
| T-7 | Un `switch (commande.commande)` | REJETÉ | KR-117 ; forme retenue : `Record<CommandeId, Transition>` exhaustif par compilation |
| T-8 | La liste des verbes en dur dans le message | REJETÉ | Elle mentirait dès it3 ; et la console re-listerait ce que `COMMANDES` décide (Déméter) |
| T-9 | Un 3ᵉ lot « persistance » | REJETÉ | Partagerait la suite de tests du shell pour ~20 lignes de parallélisme |
| T-10 | Toucher `brain/components/EditorTopBar.tsx` | REJETÉ | D-6 reporté : déclencheur = relevé navigateur, inexistant |
| T-11 | Journaliser les refus de commande | REJETÉ (convergence **des trois** rôles) | Le journal est un constat **du monde** (KR-248) ; une faute de frappe n'est pas un événement, et la borne mesurée porterait sur du bruit |
| T-12 | Une ligne `'ia'` ou une 9ᵉ racine de session | REJETÉ | `origine` **n'est pas une racine** ; l'assertion INNOVATION reste verte |
| T-13 | Renommer `horloge.tour` / `journal[].tour` | **VETO**, satisfait — issue (a)+(b) retenue | 9 sites, **dont un dans le territoire exclusif de L2** (la disjonction tomberait) ; et `schema: 1` sans migration ferait **deux représentations du même pas** (KR-013) |
| T-14 | La console valide par appartenance à un ensemble fini | **VETO**, satisfait | Deux décideurs qui divergeront (KR-013) |
| T-15 | Filtrer les pendantes dans la liste des accès | REJETÉ (soutenu par le narratif, N-13) | Masquerait une référence orpheline : elle doit **être nommée** par un refus (KR-021) |
| T-16 | `origine?: string` (registre non clos) | REJETÉ | Tout l'intérêt du champ est la fermeture **par compilation** |
| T-17 | Étendre `Field.tsx` sans `Field.test.tsx` | REJETÉ | Aucun test de `Field` n'existe (mesuré) ; une propriété nommée sans test est une intention (KR-169) |
| T-18 | Relayer `list` sur le `<textarea>` | **SANS OBJET** — `list` n'entre pas (O-1) | — |
| N-1 | Rendre `lieux[].description` / `ambiance` / `dangers` à l'arrivée | **GARDE-FOU** (O-7) | Trois champs `'ia'` : **injectés, jamais récités**. Une troisième prose émise verbatim, et **aucun modèle en it2 pour la reformuler**. L'écran est plus nu qu'au tour 1 : c'est la **tentation la plus probable de l'ouvrier** |
| N-2 | Journaliser la saisie brute ou le message de refus | REJETÉ | Canal de texte libre vers le champ même que la n° 10 vise |
| N-3 | Rejouer en relisant `session.journal` | REJETÉ | Durcit l'arbitrage n° 20 du cadrage, qui ne visait que `journal[].deltas` : la même erreur passe par `role: 'joueur'` |
| N-4 | Basculer `journal[].texte` en `'ia'` en bloc en n° 10 | REJETÉ | it2 amende le **commentaire**, jamais la valeur (KR-195/196) |
| N-5 | Un champ `lieu_precedent` / `destinations` / `acces_courants` en session | REJETÉ | Dérivables (KR-013), et rien ne les lit |
| N-6 | `rejouer(...)` de production | **RETIRÉ par le narratif** | Accord avec T-4 |
| N-7 | `origine` sur **les deux** entrées d'un déplacement | REJETÉ | Le verbe est déjà dans le `texte` de l'entrée `joueur` : dérivable stocké (KR-013) |
| N-8 | Journaliser `charpente.depart.texte_ouverture_joueur` | REJETÉ | Prose verbatim d'auteur dans le champ que la n° 10 lorgne ; le journal démarre **vide** |
| N-9 | Élargir `CommandeId` d'un membre `'jalon'` en it3 | REJETÉ (pré-emption) | Le registre est ce qu'un **joueur peut TAPER**. it3 qui veut attribuer une cause moteur ajoute **son propre** champ optionnel avec **sa propre** ligne d'audience |
| N-10 | Laisser la prose de `session-saturee.ts` | REJETÉ | Seul exemplaire de ligne de journal du dépôt, **écrit à la main**, rouvert par L1 : c'est le modèle que la suite recopiera. **Trois défauts**, dont un que personne n'avait vu — les deux entrées à des `tour` différents enseignent la mauvaise **arité** |
| N-11 | Écho du jeton saisi dans `texte` | REJETÉ | Règle de reconstruction |
| N-12 | Avaler les jetons en trop (`>=` au lieu de `===`) | REJETÉ | C'est l'ouverture d'un canal de texte libre |
| N-13 | Masquer les pendantes dans « Accès disponibles » | REJETÉ | Une orpheline invisible à l'auteur ne se corrige jamais |
| Q-1 | Critère de replay littéral « même résultat » | REJETÉ → n° 11 | Aucune entropie à séparer |
| Q-2 | Critère d'immutabilité comme **test jest autonome** | REJETÉ | Redondant avec `tsc` sur des types entièrement `readonly` — **absorbé** par le mutant M2 du pliage, qui l'obtient au runtime |
| Q-3 | Fixture à un seul accès, ou cible en position 0 | REJETÉ | Ne sépare aucune implémentation fautive plausible |
| Q-4 | Liste de commandes testée avec un seul verbe, sans mutant | REJETÉ | Ne sépare rien |
| Q-5 | Le précédent `UIPreferencesService.test.ts` recopié **sans** contre-épreuve | REJETÉ | Assertion vacuement vraie (`queuePush` sort tôt sans transport) |
| U-1 | Teinter un message de refus en `--bad` | REJETÉ | Réservé au jet ; un refus de saisie n'est pas un échec |
| U-2 | Un `<select>` de destinations en plus du champ | REJETÉ, **durci** | Étendu au `<datalist>` |
| U-3 | `Field.list` / `<datalist>` natif | **RETIRÉ par l'UX**, confirmé O-1 | jsdom aveugle à l'autocomplétion |
| P-1 | Couper it2 en deux maintenant | REJETÉ | Aucune capacité auteur nouvelle tant que la reprise n'est pas elle-même démontrable |
| P-2 | Un 7ᵉ critère d'immutabilité en compensation | REJETÉ | Stratégie de test, hors du domaine PM — et absorbé par M2 |

## 9 — Innovation

**Aucune en it2.** L'`INNOVATION` d'it1 — l'assertion `Object.values(table).every(d => d !== 'ia')`, écrite **pour être supprimée** par la n° 10 dans le lot qui livrera son assembleur et sa borne — reste en place, **verte**, et **aucun lot d'it2 n'y touche**. C'est tout son intérêt : sa suppression est la traversée de frontière, visible en diff.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] **`npm run test:mutation` NON lancé** — aucun des 4 fichiers mutés n'est au diff (KR-243), et la revue l'écrit
- [ ] Tests du § 7 écrits et passants
- [ ] **Les trois mutants obligatoires écrits, vus ROUGES, révoqués** : le 2ᵉ verbe fictif (critère 5), M1 et M2 (pliage). Si M1 ou M2 laisse le pliage vert, **l'assertion est retirée** et la revue écrit que ce mode de panne n'est couvert par personne
- [ ] Critères du § 6 cochés un par un
- [ ] La **borne de persistance du journal MESURÉE** (protocole du § 7) et consignée dans la revue — jamais en assertion
- [ ] Aucune régression : `porteJouable.test.tsx`, `ouvertureVerbatim.test.tsx`, `outcomeBlock.test.tsx`, `session.test.ts`, `tourzeroOracle.test.ts`, `tourzero.test.ts`, `expr.test.ts`, `couverture.test.ts` **verts sans avoir été modifiés pour compenser**
- [ ] Aucun fichier touché hors de la liste de son lot ; **L1 ∩ L2 = ∅** vérifié chemin par chemin
- [ ] Relevé d'état dérivé : `rg -n -U --multiline-dotall "useEffect\(\(\) => \{[^}]{0,120}\bset[A-Z]\w*\(" src/` → **zéro site neuf** (KR-013/113)
- [ ] `rg -n "as any|as EtatMonde|as EtatSession|Object.assign" src/brain/dossier/commandes.ts src/brain/MagasinDeSession.ts` → **zéro** (heuristique de revue, le grep `as any` seul ne suffit pas)
- [ ] `EcranPartie.tsx` **sous 400 lignes** après scission (KR-112 ; 388 avant)
- [ ] La **substitution de motif du port** écrite noir sur blanc dans la revue
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-dossier-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | **recevable** | Ses deux objections **retirées** avec motif : la substitution de motif du port est vérifiable aujourd'hui, et T-3 tranche la reprise **par écrit** plutôt que de l'hériter |
| Tech Lead | **recevable sous réserve** | Levée : port à `ecrire` seule (§ 5), motif substitué écrit dans la revue (§ 10), T-4 et T-13 satisfaits, T-1 requalifié en garde-fou |
| UX | **recevable sous réserve** | Levée : L1 liste `Field.tsx` **et** `Field.test.tsx` (§ 5). Amendée par **O-1** (`mono` seule) et **O-2** (`JournalRow` rend `origine`) |
| QA | **recevable sous réserve** | Levées : contre-épreuve `pendingCount()` dans le **même** test (critère 6), aucun critère de rejeu (O-4), immutabilité hors jest autonome — **absorbée par M2** |
| Narratif & IA | **recevable sous réserve** | Levées : `§ J1` amendé **dans L1**, fixture amendée, `origine` sur l'entrée `moteur` seule. Son veto N-1 **requalifié en garde-fou** (O-7) — il visait une proposition que personne n'avait faite |
