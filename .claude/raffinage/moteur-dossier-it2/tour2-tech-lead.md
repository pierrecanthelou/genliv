# Tour 2 — tech-lead — moteur-dossier it2

**RÉPONSE**

**X-1 / M-12 (ux-designer) — j'adopte (a) : `Field.tsx` entre dans L1.** (b) forke l'anatomie du champ dans une feature — forme exacte de KR-109 ; (c) met des identifiants en `--font-ui` et supprime la découverte. L'extension est optionnelle, éteinte par défaut ; les **25 fichiers appelants / 59 usages** (remesuré) ne bougent pas. Deux bornes que l'UX n'a pas écrites : `list` ne va que sur l'`<input>` (`<textarea>` n'a pas cet attribut — React rendrait un attribut DOM invalide), `mono` bascule les deux boîtes. **L1 gagne `Field.tsx` (R) + `Field.test.tsx` (N — il n'en existe AUCUN, et L1 doit passer la porte seul, KR-169).** `brain/components/index.ts` ne bouge pas (`Field`/`FieldProps` y sont déjà, `:10`). **Disjonction intacte** : `brain/components/` n'est dans le territoire d'aucun autre lot. **Toujours 2 lots** — ajouter un fichier à un lot `contrat` existant ne crée pas de lot.

**X-5 (ux-designer) — je retourne l'objection.** Si la console valide par appartenance à l'ensemble fini **et** que le moteur résout, il y a **deux décideurs**, qui divergeront (KR-013). La console ne valide rien : elle soumet la chaîne brute. L'ensemble fini reste un outil de **découverte**, jamais un chemin de validation.

**MES OBJECTIONS** — **T-1 requalifiée** : personne n'a proposé d'exposer `local` ; un veto sans proposition est un épouvantail. Devient **garde-fou écrit au § 8**, veto réarmé si un lot le propose. **T-4 durcie en veto** (narratif et QA convergent contre son utilité). **T-12 retirée pour `journal[].origine` seul** (M-8 + KR-251), maintenue pour tout le reste. **T-2, T-3, T-5, T-6, T-7, T-8, T-9, T-10, T-11 maintenues.**

**POSITION**

- **X-2** — je cède : coût exact **+2 fichiers en L1** (`sessionDestinations.ts`, `__fixtures__/session-saturee.ts`), plus `sessionCouverture.test.ts` en R de justesse ; tous **disjoints de L2**, la racine reste à 8. Condition : `import type` seul (cycle effacé à l'émission).
- **X-3** — aucun `rejouer()` de production ; l'immutabilité est **déjà portée par le typage** (`readonly` de bout en bout, `session.ts:78-187` : `push` ne compile pas), le test de la QA n'ajoute qu'une chose — voir une évasion par `as` / `Object.assign` : deux lignes, je les prends.
- **X-5** — un `split` à arité **dérivée** de `refKinds.length`, sans récursion, sans état, sans précédence et **dont aucune sortie n'est persistée**, n'est pas un parseur au sens de KR-168 ; la garde mesurée est une garde de **noms** (4 symboles), elle ne tranche rien dans un sens ni dans l'autre.
- **M-13** — (c) **VETO** (mesuré : le renommage entre dans le territoire exclusif de L2 et une session it1 sur disque n'a aucun chemin de migration) ; retenu **(a) + (b)**, coût **1 fichier `.md`** dans L1, et (b) est déjà acquis sans geste — le `JournalRow` de l'UX n'écrit jamais le mot.

**VERDICT — recevable sous réserve** (port à `ecrire` seul, motif substitué écrit dans la revue ; renommage de `tour` et `rejouer()` de production sous veto ; `local` sur `Brain` en garde-fou).

---

# ANNEXE — découpage FINAL

## A — Deux lots, séquentiels, **sans worktree ni fusion**

Le découpage ne crée pas le parallélisme : une tranche verticale avec un contrat en tête s'exécute en séquence. C'est le cas normal, comme it1.

### L1 — `session-commandes` — **`contrat`** *(seul, et en premier)*

| | Chemin | Motif |
|---|---|---|
| N | `src/brain/dossier/commandes.ts` | registre clos + transitions + `destinationsPossibles` |
| N | `src/brain/dossier/commandes.test.ts` | y compris le pliage de rejeu **et** l'immutabilité |
| N | `src/brain/MagasinDeSession.ts` | `createMagasinDeSession(local)` |
| N | `src/brain/MagasinDeSession.test.ts` | + la contre-épreuve `pendingCount()` |
| N | `src/brain/components/Field.test.tsx` | **neuf : aucun test de `Field` n'existe** |
| R | `src/brain/components/Field.tsx` | **+`mono?`, +`list?`** (X-1, issue (a)) |
| R | `src/brain/dossier/session.ts` | type du port + `origine?` — **aucune racine neuve** |
| R | `src/brain/dossier/sessionDestinations.ts` | `'journal[].origine'` : union + ligne `'moteur'` |
| R | `src/brain/dossier/__fixtures__/session-saturee.ts` | **obligatoire** : sans instance, la ligne neuve est MORTE et `sessionCouverture.test.ts:85-92` rougit |
| R | `src/brain/dossier/sessionCouverture.test.ts` | justesse seule : la dispense dit « ses **trois** feuilles » → quatre |
| R | `src/brain/BrainContext.tsx` | champ `sessions`, construit sur `local` |
| R | `src/brain/index.ts` | baril |
| R | `src/brain/persistenceKeys.ts` | le bloc ⚠ de `DOSSIER_SESSION_KEY_PREFIX` **devient faux** |
| R | `docs/EXIGENCE-APERCU-DU-JEU.md` | § 6 : `commandes.ts` rejoint les purs extractibles |
| R | `docs/REGLES-PLAY.md` | **§ J1, issue (a) de M-13** — voir § D |

**Nom RÉSERVÉ à L1**, que nul autre lot ne crée : `src/brain/dossier/deplacement.ts` (si `commandes.ts` franchit 400 lignes, KR-112).
**Supprimé depuis le tour 1** : `src/brain/dossier/rejeu.test.ts` — sans `rejouer()` et sans scénario séparateur, le fichier n'a plus de sujet ; le pliage vit dans `commandes.test.ts`.
**INTERDITS à L1, verts sans modification à la fin** : `tourzero.ts`, `tourzero.test.ts`, `tourzeroOracle.test.ts`, `predicates.ts`, `deltas.ts`, `destinations.ts`, `feuilles.ts`, `couverture.test.ts`, `expr.test.ts`, `controles.ts`, `brain/components/EditorTopBar.tsx` *(correction du tour 1 : il est dans `brain/components/`, pas dans `bascule-editeur` — d'autant plus important maintenant que L1 entre dans ce répertoire)*, `src/player/**`, **et tout `src/features/**`**.

**Trois pièges mesurés, inchangés** : (1) `expr.test.ts:409-420` balaie `readdirSync(brain/dossier)` `.ts` **non-test**, cherche `/\.?\bop\s*===\s*'/` et `/\bswitch\s*\(\s*[\w.]*\bop\s*\)/` **commentaires compris**. (2) `expr.test.ts:473-476` balaie `brain/dossier/` **tests compris** sur 4 **noms** — c'est une garde de noms, pas de sémantique. (3) `couverture.test.ts:498-515` exige `porteurs === ['feuilles.ts']`.

### L2 — `console-deplacement` — feature `play-mode` *(après L1, contrat figé)*

**Territoire exclusif : `src/features/play-mode/**`.** Aucun autre lot n'y entre ; L1 non plus, et c'est ce que le renommage de `tour` aurait cassé (`ouvertureVerbatim.test.tsx:119`).

| | Chemin |
|---|---|
| R | `src/features/play-mode/components/EcranPartie.tsx` |
| N | `src/features/play-mode/components/CadrePartie.tsx` |
| N | `src/features/play-mode/components/EcranRefus.tsx` |
| N | `src/features/play-mode/components/ConsoleCommandes.tsx` |
| N | `src/features/play-mode/components/JournalRow.tsx` |
| R | `src/features/play-mode/hooks/useSessionPersistee.ts` |
| N | `src/features/play-mode/tests/deplacement.test.tsx` |
| N | `src/features/play-mode/tests/consoleCommandes.test.tsx` |
| R | `src/features/play-mode/tests/ouvertureVerbatim.test.tsx` *(si la scission déplace un nœud)* |

**Zéro fichier hors du territoire.** Les deux listes sont **disjointes** : L1 ∩ L2 = ∅.

## B — Signatures exactes, amendées

### B.1 — `brain/dossier/commandes.ts` (L1 expose)

```ts
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

/** Reconnaissance, JAMAIS un parseur — X-5 : `split` sur l'espace, arité DÉRIVÉE de
 *  `refKinds.length`, lookup de registre, aucune grammaire, aucun état, aucune
 *  récursion, et AUCUNE SORTIE PERSISTÉE hors la `Commande` (clé de registre + handles).
 *  Ne consulte PAS le dossier : verbe et arité seulement. */
export function analyserSaisie(saisie: string): ResultatSaisie

/** LA RÈGLE D'ACCÈS, EN DONNÉE (`destinations.ts:404-406`) — rend `lieux[lieu_courant].acces ?? []`
 *  TEL QUEL, non dédoublonné et NON FILTRÉ des références pendantes (n° 10 possède le
 *  dédoublonnage ; une pendante doit être EXPOSÉE, jamais masquée).
 *  DEUX appelants, un par lot : `executerCommande` (L1) et `ConsoleCommandes` (L2). */
export function destinationsPossibles(dossier: Dossier, session: EtatSession): readonly string[]

/** PURE, totale, synchrone. Sur un refus, rend la MÊME référence de session
 *  (`expect(resultat.session).toBe(session)`). Ordre des refus :
 *  `acces_absent` (∉ destinationsPossibles) PUIS `cible_inconnue` (∈ accès mais
 *  non résolue dans `monde.lieux` — la pendante est NOMMÉE, KR-021). */
export function executerCommande(dossier: Dossier, session: EtatSession, commande: Commande): ResultatCommande
```

Interne, **non exporté** : `const TRANSITIONS: Record<CommandeId, Transition>` — exhaustif **par compilation**, jamais un `switch` (KR-117). Le message de refus est composé **ici**, à partir de `Object.values(COMMANDES).map(c => c.verbe)` — jamais par la console.

### B.2 — `brain/dossier/session.ts` (L1 expose) — amendée par X-2

```ts
import type { CommandeId } from './commandes'   // TYPE SEUL — effacé à l'émission, donc
                                                // aucun cycle au runtime. Précédent mesuré
                                                // au dépôt : `brain/copilote/contexte/prose.ts:14`.

export interface EntreeJournal {
	readonly tour: number
	readonly role: RoleJournal
	readonly texte: string
	/** LA CAUSE, clé du registre CLOS des commandes — jamais de la prose, jamais une
	 *  chaîne libre. Optionnel À VIE (KR-251). Non dérivable : la ligne `moteur`
	 *  (`lieu_courant : x → y`) ne contient aucun verbe, et re-parser `texte` pour le
	 *  retrouver serait précisément l'anti-patron. ÉCRIT par `commandes.ts`, LU par
	 *  `JournalRow` (KR-249, les deux chemins existent dans CETTE itération). */
	readonly origine?: CommandeId
}

export interface MagasinDeSession {
	ecrire(dossierId: string, session: EtatSession): void
	// `lire` / `effacer` : PAS ENCORE (T-2). Ajouter une méthode à une interface est
	// ADDITIF ; contrairement à un champ persisté, elle ne se paie pas d'être ajoutée
	// plus tard. Elles entrent avec la REPRISE et son `validerSession` (KR-116).
}
```

`sessionDestinations.ts` : `| 'journal[].origine'` dans `CheminDeFeuilleDeSession` + `'journal[].origine': 'moteur',` dans la table. **Zéro ligne `'ia'`**, l'assertion `INNOVATION` (`sessionCouverture.test.ts:163`) reste verte, et `racines).toHaveLength(8)` (`:115`) reste **8**.

### B.3 — `brain/components/Field.tsx` (L1 expose) — X-1, issue (a)

```ts
export interface FieldProps {
	// … les 13 props existantes, INCHANGÉES
	/** Bascule la BOÎTE (input ET textarea) de `var(--font-ui)` à `var(--font-mono)`.
	 *  Le libellé est déjà mono et ne bouge pas. Défaut : false. */
	mono?: boolean
	/** Relayé sur l'`<input list>` — JAMAIS sur le `<textarea>`, qui n'a pas cet
	 *  attribut : l'y poser rendrait un attribut DOM invalide. Défaut : undefined. */
	list?: string
}
```
Le style se compose en ligne (`{ ...shared, fontFamily: mono ? 'var(--font-mono)' : shared.fontFamily }`). Aucun appelant existant n'est touché (deux props optionnelles).

### B.4 — `play-mode` (L2 consomme / expose)

```ts
/** AMENDE la signature plate de l'UX : l'entrée EST l'unité, et un 4ᵉ prop pour
 *  `origine` ferait re-lister à l'appelant les champs que la donnée porte déjà. */
export interface JournalRowProps { readonly entree: EntreeJournal }

export interface ConsoleCommandesProps {
	onSoumettre: (saisie: string) => void       // la chaîne BRUTE — la console ne valide RIEN (X-5)
	refus: string | null                        // message COMPOSÉ PAR LE MOTEUR, jamais recomposé ici
	destinations: readonly string[]             // = destinationsPossibles(...), dédoublonné À L'AFFICHAGE seulement
}

export function useSessionPersistee(dossierId: string, session: EtatSession): void  // signature INCHANGÉE
```
`useSessionPersistee` garde sa signature et bascule en interne de `useBrain().persistence` vers `useBrain().sessions`. `PartieEnCours` tient `useState(sessionInitiale)` en **valeur initiale**, jamais un miroir (KR-013/113).

## C — X-3, tranché depuis mon poste

**Forme retenue : aucun `rejouer()` de production** (T-4 durci en veto). Dans `commandes.test.ts`, deux assertions et une seule est séparatrice :

1. **Pliage de rejeu** — la même séquence pliée deux fois donne `toEqual`. **NON SÉPARATRICE** : la QA a raison, aucune entropie n'existe avant la n° 11. Elle reste comme garde de non-régression, et **la revue écrit qu'elle n'est vérifiée par personne** (KR-242) — jamais comptée verte.
2. **Immutabilité** — `expect(S0).toEqual(copieProfonde)` après N commandes. **Mesuré** : `EtatSession`/`EtatMonde` sont `readonly` de bout en bout (`session.ts:78-187`), donc `push` **ne compile pas**. **Ce que le test ajoute, et lui seul** : il observe le RUNTIME, donc il survit à un `as EtatMonde` ou un `Object.assign` qu'une itération future glisserait, là où `tsc` reste muet. Deux lignes : je les prends.

## D — M-13, coût contractuel des trois issues

| Issue | Coût mesuré | Verdict |
|---|---|---|
| (a) amender `§ J1` | **1 fichier `.md`** (`docs/REGLES-PLAY.md`, dans L1). Zéro code. La doc désigne elle-même la n° 9 propriétaire (KR-130) | **RETENUE** — it2 écrit « 1 pas d'horloge de session = 1 commande acceptée ; *round* reste le mot du combat » |
| (b) ne jamais dire « tour » à l'écran | **0 fichier — déjà acquis** : le `JournalRow` de l'UX rend `#{n}`, aucune occurrence du mot | **RETENUE**, écrite au § 8 comme contrainte permanente |
| (c) renommer le champ | 9 sites : `session.ts` ×3, `session.test.ts`, `sessionDestinations.ts` ×4, `sessionCouverture.test.ts`, `session-saturee.ts` ×3, **et `src/features/play-mode/tests/ouvertureVerbatim.test.tsx:119`** | **VETO — deux motifs indépendants** : *(i)* le 9ᵉ site est dans le **territoire exclusif de L2**, donc la disjonction tombe ; *(ii)* `schema: 1` n'a **aucun chemin de migration** — une session it1 déjà sur un disque porte `horloge.tour`, le champ renommé devrait être optionnel à vie (KR-251), soit **deux représentations du même pas**, ce que KR-013 interdit |

## E — X-4, clos

Le port se justifie par la **frontière magasin brut / décorateur de synchronisation**, **pas** par l'extractibilité : `CloudSyncService.get` délègue à `local.get` (M-3), `remove()` ne propage rien (M-4), `set()` pousse toute clé non-livre. La revue d'itération **écrit cette substitution de motif noir sur blanc**. Critère : `UIPreferencesService.test.ts:103-115` recopié **avec la contre-épreuve** (M-5).

## F — REJETÉS *(à recopier au § 8 du plan — BUG-082 ; les neufs sont marqués ✦)*

| # | Rejeté | Motif |
|---|---|---|
| T-1 | Exposer `local` sur `Brain` — **requalifié en GARDE-FOU** ✦ | Personne ne l'a proposé ; un veto sans proposition est un épouvantail. Le garde-fou reste écrit, le veto se réarme si un lot le propose |
| T-2 | Le port à trois méthodes en it2 | `lire`/`effacer` sans appelant = KR-109 |
| T-3 | La reprise / relecture d'une session en it2 | Traîne `validerSession` (KR-116) + un chemin d'interface : seconde phrase de démo |
| T-4 | `rejouer()` de production — **VETO** ✦ (durci) | Un seul appelant (KR-109) **et** aucun scénario séparateur avant la n° 11 |
| T-5 | La logique de déplacement dans `session.ts` | Mêle forme et transition ; rouvre le fichier que le contrat d'it3 doit rouvrir |
| T-6 | Cette logique dans `play-mode` ou `src/player/` | Extractibilité + `expr.test.ts:420` |
| T-7 | Un `switch (commande.commande)` | KR-117 |
| T-8 | La liste des verbes en dur dans le message de la console | Elle mentirait dès it3 ; Déméter |
| T-9 | Un 3ᵉ lot « persistance » | Partagerait la suite du shell pour ~20 lignes de parallélisme |
| T-10 | Toucher `brain/components/EditorTopBar.tsx` en it2 | D-6 reporté |
| T-11 | Journaliser les refus de commande | Convergence des trois rôles ; KR-248 |
| T-12 | Une ligne `'ia'` ou une 9ᵉ racine de session | `origine` **n'est pas une racine** |
| T-13 | **Renommer `horloge.tour` / `journal[].tour`** — **VETO** ✦ | § D |
| T-14 | **La console valide la saisie par appartenance à l'ensemble fini** ✦ | Deux décideurs qui divergeront — KR-013 |
| T-15 | **Un `<datalist>` filtré des accès pendants** ✦ | Masquerait une référence orpheline ; elle doit produire un refus `cible_inconnue` qui la **nomme** (KR-021) |
| T-16 | **`origine?: string` (registre non clos)** ✦ | Tout l'intérêt du champ est la fermeture par compilation |
| T-17 | **Étendre `Field.tsx` sans `Field.test.tsx`** ✦ | Aucun test de `Field` n'existe ; une propriété nommée sans test est une intention (KR-169) |
| T-18 | **Relayer `list` sur le `<textarea>`** ✦ | Attribut DOM invalide |

## G — Ce que je n'ai pas mesuré *(à mesurer par le lot)*

- Que `porteJouable.test.tsx` et `ouvertureVerbatim.test.tsx` restent verts après la scission d'`EcranPartie`.
- Que les 25 fichiers appelants de `Field` compilent inchangés après l'ajout des deux props.
- `tsc` après l'ajout du champ `sessions` sur `Brain`, et après le `import type` croisé `session.ts` ↔ `commandes.ts`.
- Que `moteurSansIA.test.ts` reste vert avec les fichiers neufs.
- **Rappel KR-243** : aucun fichier d'it2 n'est dans le périmètre muté — **pas de `npm run test:mutation`**.
