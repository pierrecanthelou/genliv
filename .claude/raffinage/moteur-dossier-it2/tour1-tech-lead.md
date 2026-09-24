# Tour 1 — tech-lead — moteur-dossier it2

**RISQUE** — it2 porte une tranche verticale (le déplacement) **et** une frontière de persistance (le port) dont la justification écrite au cadrage — « deux appelants nommés » — n'est toujours pas armée : `src/player/` ne reçoit aucun fichier en it2 non plus, `persist.ts` reste orphelin jusqu'à it4. Livré tel quel, le port a **un** implémenteur, **un** appelant, et **deux de ses trois méthodes n'en ont aucun** — KR-109, à l'endroit exact où trois itérations en hériteront.

**OBJECTION** — (1) L'argument « ça ne se rétro-ajoute pas », qui a payé `graine_alea` puis `dossier_maj`, **ne se transfère pas à une interface** : ajouter une méthode à un port est additif, sans donnée léguée. `lire` et `effacer` n'ont donc aucune exemption ; ils n'entrent qu'avec la **reprise**, laquelle traîne `validerSession` (KR-116, open_question b) et sa propre phrase de démo. (2) L'open_question (a) **ne peut pas être tranchée par une feature** : `useBrain()` n'expose pas `local` (`BrainContext.tsx:99-111`). C'est un changement de contrat `brain/`, donc lot `contrat`, donc it2 en a un — le goal n'en prévoyait pas.

**PROPOSITION** — **2 lots.** L1 `contrat` : `commandes.ts` (registre clos + `Record<CommandeId,…>` exhaustif par compilation, zéro `switch`), le type pur `MagasinDeSession` dans `session.ts`, `createMagasinDeSession(local)` exposé en `Brain.sessions` — 4ᵉ instance du motif `uiPreferences`/`monsterLibrary`/`cloudSettings`, et non une porte brute ouverte aux features. Port livré avec **`ecrire` seul**. Rejeu prouvé par **pliage de la transition pure**, aucun `rejouer()` de production. L2 : `play-mode` entier, scission d'`EcranPartie` comprise.

**VERDICT** — **recevable sous réserve** (port réduit à `ecrire`, reprise hors périmètre). REJETÉS, détaillés en annexe § G et à recopier au § 8 du plan : `local` exposé sur `Brain` (**veto**) · `rejouer()` de production · port à 3 méthodes sans appelant · 3ᵉ lot « persistance » · déplacement logé dans `session.ts` ou dans la feature · journalisation des refus.

---

# ANNEXE

## A — Découpage en lots

### L1 — `session-commandes` — **`contrat`** *(seul, et en premier)*

| | Chemin |
|---|---|
| N | `src/brain/dossier/commandes.ts` |
| N | `src/brain/dossier/commandes.test.ts` |
| N | `src/brain/dossier/rejeu.test.ts` |
| N | `src/brain/MagasinDeSession.ts` |
| N | `src/brain/MagasinDeSession.test.ts` |
| R | `src/brain/dossier/session.ts` *(type du port + 2 clauses de docstring — **aucun champ d'`EtatSession` ajouté**)* |
| R | `src/brain/BrainContext.tsx` *(champ `sessions` sur `Brain`, construit sur `local`)* |
| R | `src/brain/index.ts` *(baril)* |
| R | `src/brain/persistenceKeys.ts` *(le bloc ⚠ de `DOSSIER_SESSION_KEY_PREFIX` **devient faux** — réécrit, pas laissé)* |
| R | `docs/EXIGENCE-APERCU-DU-JEU.md` *(§ 6 : `commandes.ts` rejoint la liste des purs extractibles)* |

**Nom RÉSERVÉ à L1**, que nul autre lot ne crée : `src/brain/dossier/deplacement.ts` — si `commandes.ts` franchit 400 lignes (KR-112), la transition `aller` y part.

**INTERDITS à L1, et verts sans modification à la fin** : `sessionDestinations.ts`, `sessionCouverture.test.ts`, `tourzero.ts`, `tourzero.test.ts`, `tourzeroOracle.test.ts`, `predicates.ts`, `deltas.ts`, `destinations.ts`, `feuilles.ts`, `couverture.test.ts`, `expr.test.ts`, `controles.ts`, `EditorTopBar.tsx`, `src/player/**`.

**Trois pièges mesurés, à porter en autocontrôle :**
1. `expr.test.ts:409-413` balaie `readdirSync(brain/dossier)`, `.ts` non-test, non récursif, et cherche `/\.?\bop\s*===\s*'/` et `/\bswitch\s*\(\s*[\w.]*\bop\s*\)/` **commentaires compris** : `commandes.ts` ne doit contenir ni `op === '` ni `switch (…op)`, même en docstring. Écrire « l'opérateur du nœud » (précédent it1, piège 1).
2. `expr.test.ts:457-486` refuse tout symbole `parseExpr`/`parseCondition`/`compileExpr`/`lexExpr` **dans `brain/dossier/` seulement** — la garde **ne couvre pas** `src/features/play-mode/`. C'est un argument pour loger la reconnaissance de saisie dans `commandes.ts` : le seul endroit où un parseur pourrait pousser reste sous le seul instrument qui le surveille.
3. `couverture.test.ts:498-515` exige `porteurs === ['feuilles.ts']` : ne recopier aucune signature `function feuillesDeLaFixture` dans un fichier neuf.

### L2 — `console-deplacement` — feature `play-mode` *(après L1)*

**Territoire exclusif : `src/features/play-mode/**`** — aucun autre lot n'y entre, ce qui rend la liste ci-dessous indicative-mais-close (correctif du RETOUR-COMITÉ n° 2 d'it1 : un plan qui dicte une liste de fichiers au caractère près se trompe, un plan qui dicte un **territoire** ne se trompe pas).

| | Chemin |
|---|---|
| R | `src/features/play-mode/components/EcranPartie.tsx` |
| N | `src/features/play-mode/components/CadrePartie.tsx` *(le `Cadre` extrait — un composant par fichier)* |
| N | `src/features/play-mode/components/EcranRefus.tsx` *(avec le registre `REFUS`)* |
| N | `src/features/play-mode/components/ConsoleCommandes.tsx` |
| N | `src/features/play-mode/components/JournalRow.tsx` |
| R | `src/features/play-mode/hooks/useSessionPersistee.ts` |
| N | `src/features/play-mode/tests/deplacement.test.tsx` |
| N | `src/features/play-mode/tests/consoleCommandes.test.tsx` |
| R | `src/features/play-mode/tests/ouvertureVerbatim.test.tsx` *(si la scission déplace un nœud)* |

**Zéro fichier hors du territoire.** `bascule-editeur` n'est **pas** touché (D-6 reste reporté faute du relevé navigateur) → **une seule feature hors lot `contrat`**, pas de dérogation à demander cette fois.

**Pourquoi 2 lots et pas 3** : tout ce que L2 livre converge sur `EcranPartie.tsx` (état de session mutable, branchement console, liste de journal). Un 3ᵉ lot devrait le partager — donc il n'existe pas. Exécution **séquentielle**, sans worktree ni fusion, comme it1.

## B — Signatures exactes

### B.1 — `brain/dossier/commandes.ts` (L1 expose)

```ts
import { defineRegistre, type EspaceDeNoms } from './identifiers'
import type { EtatSession } from './session'
import type { Dossier } from './types'

export interface CommandeDescripteur {
	/** Libellé français — jamais une syntaxe (même contrat que PREDICATES/DELTAS). */
	label: string
	/** Le mot-clé saisi, mono MAJUSCULES. */
	verbe: string
	/** Espace attendu à chaque position. L'ARITÉ est `refKinds.length`, DÉRIVÉE (KR-165). */
	refKinds: readonly EspaceDeNoms[]
}

/** Registre CLOS, propriété du MOTEUR et non de la console. it2 n'en pose qu'un. */
export const COMMANDES = defineRegistre<CommandeDescripteur>()({
	aller: { label: 'va au lieu', verbe: 'ALLER', refKinds: ['lieu'] },
})
export type CommandeId = keyof typeof COMMANDES

/** Miroir exact de `Delta` : clé discriminante + cibles en TABLEAU même à l'arité 1. */
export interface Commande {
	readonly commande: CommandeId
	readonly cibles: readonly string[]
}

export type RefusCommande =
	| 'verbe_inconnu'      // la saisie ne nomme aucune entrée de COMMANDES
	| 'arite_invalide'     // n cibles ≠ refKinds.length
	| 'cible_inconnue'     // l'identifiant ne résout dans aucune collection du dossier
	| 'acces_absent'       // le lieu existe mais n'est pas dans lieux[courant].acces

export type ResultatCommande =
	| { readonly ok: true; readonly session: EtatSession }
	| { readonly ok: false; readonly refus: RefusCommande; readonly message: string }

/** Reconnaissance, JAMAIS un parseur : `split` sur l'espace, ≤ 2 jetons, lookup de registre,
 *  aucune grammaire, aucun état, aucune récursion (n° 33, KR-168). */
export function analyserSaisie(saisie: string): ResultatSaisie
export type ResultatSaisie =
	| { readonly ok: true; readonly commande: Commande }
	| { readonly ok: false; readonly refus: 'verbe_inconnu' | 'arite_invalide'; readonly message: string }

/** PURE, totale, synchrone. Sur un refus, rend la MÊME référence de session. */
export function executerCommande(dossier: Dossier, session: EtatSession, commande: Commande): ResultatCommande
```

Interne à `commandes.ts`, **non exporté** :
```ts
type Transition = (dossier: Dossier, session: EtatSession, cibles: readonly string[]) => ResultatCommande
const TRANSITIONS: Record<CommandeId, Transition> = { aller: … }
// Exhaustif PAR COMPILATION : un verbe de plus ne compile pas sans sa ligne.
// JAMAIS un `switch` (KR-117). Précédent maison : `REFUS: Record<CodeRefus, DescripteurRefus>`
// dans EcranPartie.tsx:73.
```

**Le message de refus est composé ICI**, à partir de `Object.values(COMMANDES).map((c) => c.verbe)` — jamais par la console, qui re-listerait les verbes (seconde source de vérité + Déméter). Forme rédigée par l'UX, **liste dérivée** (arbitrage n° 32).

### B.2 — le port, `brain/dossier/session.ts` (L1 expose)

```ts
/**
 * LE PORT DE STOCKAGE DE SESSION — un TYPE PUR, donc extractible avec src/player/.
 * L'éditeur en branche un adaptateur sur le magasin BRUT ; la surface extraite en
 * branchera un sur `localStorage` le jour de l'extraction (n° 11+).
 */
export interface MagasinDeSession {
	ecrire(dossierId: string, session: EtatSession): void
	// `lire` et `effacer` : PAS ENCORE — voir § D. Ils entrent avec la REPRISE et son
	// `validerSession` (KR-116). Ajouter une méthode à une interface est ADDITIF :
	// contrairement à un champ persisté, elle ne se paie pas d'être ajoutée plus tard.
}
```
Identifiants **sans accent** (`ecrire`), convention observée au dépôt (`controlerDossier`, `ouvrirSession`, `evenements_consommes`) — la prose de la spec écrit « écrire », le symbole non.

### B.3 — `brain/MagasinDeSession.ts` + `BrainContext.tsx` (L1)

```ts
export function createMagasinDeSession(brut: PersistenceService): MagasinDeSession
// dans createBrain : const sessions = createMagasinDeSession(local)   // ← `local`, PAS `sync`
// dans Brain :      sessions: MagasinDeSession
```
Câblé exactement comme `createUIPreferencesService(local)` (`BrainContext.tsx:86`), `createMonsterLibraryService(local)` (`:88`), `createCloudSettings(local)` (`:94`).

### B.4 — `play-mode` (L2 consomme / expose)

```ts
export interface JournalRowProps { entree: EntreeJournal }        // rend `texte`, style par `role`
export interface ConsoleCommandesProps {
	onSoumettre: (saisie: string) => void
	refus: string | null            // message COMPOSÉ PAR LE MOTEUR, jamais recomposé ici
}
export function useSessionPersistee(dossierId: string, session: EtatSession): void   // signature INCHANGÉE
```
`useSessionPersistee` **garde sa signature** et bascule en interne de `useBrain().persistence` vers `useBrain().sessions` : c'est le point de rendez-vous qui évite que la scission d'`EcranPartie` et le changement de magasin se croisent.

`PartieEnCours` tient `const [session, setSession] = useState(sessionInitiale)` — **valeur initiale**, jamais un miroir : **aucun `useEffect(() => setSession(…))`** (KR-013/113). Le relevé `rg` de l'auto-revue doit remonter zéro site neuf.

## C — Où vit la logique de déplacement

**Dans `brain/dossier/commandes.ts` (N), pas dans `session.ts`, pas dans la feature, pas dans `src/player/`.**

- **Pas dans la feature** : le runtime extrait doit déplacer le héros sans l'éditeur ; une transition dans `play-mode` serait à réécrire à la n° 11.
- **Pas dans `src/player/`** : arbitrage n° 5 + `expr.test.ts:420` bornent le moteur à `brain/dossier/` ; et `src/player/` ne reçoit toujours aucun fichier.
- **Pas dans `session.ts`** : il possède la **forme** et l'**ouverture**. L'y ajouter le pousse de 251 vers ~380 lignes, mêle deux responsabilités, et surtout **rouvre en it2 le fichier que le lot `contrat` d'it3 doit rouvrir** — un `session.ts` quasi intouché en it2 est ce qui rend it3 lisible.
- **Pas de dossier `brain/session/`** : arbitrage n° 35, `expr.test.ts:420` borne sa liste close à `brain/dossier/`.
- **Ordre acyclique préservé** : `identifiers → … → types → session → commandes`. `session.ts` n'importe **jamais** `commandes.ts`.

Ce que `aller` écrit, et rien d'autre : `monde.lieu_courant`, `monde.lieux_visites` (**append dédoublonné** — sémantique d'ensemble, `lieu_visite` est une appartenance), `horloge.tour`, `journal`. **Aucun champ de session neuf** ⇒ `sessionDestinations.ts` et `sessionCouverture.test.ts` **ne bougent pas**, et l'assertion `INNOVATION` (`every(d => d !== 'ia')`) reste intacte.

## D — Le port `{ lire, ecrire, effacer }` : forme, implémenteur, appelants

| | |
|---|---|
| **Type** | `MagasinDeSession` — pur, dans `brain/dossier/session.ts`, voyage avec l'extraction (§ 6 d'`EXIGENCE-APERCU-DU-JEU.md`) |
| **Implémenteur en it2** | **un seul** : `createMagasinDeSession(local)` (`brain/MagasinDeSession.ts`) |
| **Injecteur** | `createBrain` (`BrainContext.tsx`), champ `sessions` sur `Brain` — Service Locator, comme les 3 autres familles d'état par appareil |
| **Appelants réels en it2** | **un seul** : `useSessionPersistee` |
| **Second implémenteur annoncé** | l'adaptateur `localStorage` du runtime extrait — **n'existe pas en it2 et n'a aucun appelant** |

**Verdict KR-109, dit franchement** : la justification écrite au cadrage (arbitrage n° 24, « deux appelants nommés ») **n'est pas armée en it2**, exactement comme elle ne l'était pas en it1 (D-5). Le port ne se justifie **pas** par l'extractibilité aujourd'hui — il se justifie par la **frontière magasin brut / décorateur de synchronisation** (§ E), qu'aucune feature ne peut franchir autrement. **Cette substitution de motif doit être écrite au plan** : un lot qui hérite du motif périmé livrera trois méthodes vides.

**Conséquence, et c'est ma réserve principale** : le port entre avec **`ecrire` seul**. `lire` et `effacer` attendent la reprise, qui exige `validerSession` (open_question b, clause c), un chemin d'interface « Reprendre / Relancer », et la comparaison d'estampille `dossier_maj`. **Si le comité veut le trio, il doit nommer l'appelant de chaque méthode dans CETTE itération** — et alors it2 doit être **COUPÉE EN DEUX** : it2 « l'auteur déplace son héros », it2 bis « l'auteur reprend la partie où il l'avait laissée ». Je recommande la première forme.

## E — Open_question (a) : magasin BRUT, et ce que ça coûte en `brain/`

**Réponse : magasin BRUT — la session est un ÉTAT D'APPAREIL, pas un document synchronisé.** Quatre motifs, trois mesurés :

1. Les **trois** autres familles d'état par appareil passent par `local` : `uiPreferences` (`BrainContext.tsx:86`, KR-022), `monsterLibrary` (`:88`), `cloudSettings` (`:94`). La session serait la quatrième, pas une exception.
2. **`CloudSyncService.remove()` ne propage rien** (`CloudSyncService.ts:425-427`) : un `effacer()` posé sur le décorateur laisserait l'entrée distante orpheline **le jour où il entre**. On ne livre pas une frontière dont une méthode est cassée d'avance.
3. `set()` pousse **toute clé non-livre** (`:415-423`) : chaque montage de l'aperçu fait clignoter `sync:status` sous les yeux de l'auteur.
4. Deux appareils, un dossier, deux sessions divergentes : aucune sémantique de fusion n'est écrite, et `sync:conflict` ne connaît que le livre.

**Ce que ça coûte en `brain/`** — `local` **n'est pas exposé par `useBrain()`** (`BrainContext.tsx:99-111` : `persistence: sync`), donc aucune feature ne l'atteint :

- **VETO** sur « exposer `local` sur `Brain` » : ce serait une porte de sortie brute, non synchronisée, ouverte à **toutes** les features, que ni ESLint (`no-restricted-globals` ne voit que `localStorage`) ni la revue ne rattraperaient. La doctrine maison n'expose jamais le magasin brut — elle expose un **service étroit** construit dessus, trois fois.
- Coût réel : **+1 fichier** (`MagasinDeSession.ts`), **+2 lignes** dans `createBrain`, **+1 champ** sur `Brain`, **+1 entrée** au baril, **+1 réécriture** du bloc ⚠ de `persistenceKeys.ts`.
- **Mesuré** : aucun test ne construit un littéral `Brain` (`grep "as Brain|: Brain"` → 40 occurrences, toutes en **position de type de paramètre**, toutes alimentées par `createBrain`). Ajouter un champ à `Brain` **ne casse aucun test par typage**. *Mesure statique, pas un run de `tsc`.*

**Le scénario séparateur du critère, et il n'est pas celui qu'on écrirait spontanément** : relire la session par `brain.persistence.get(dossierSessionKey(id))` **reste vert dans les deux magasins** — `CloudSyncService.get` délègue à `local.get` (`:412-414`). Un critère de relecture épinglerait donc une coïncidence (BUG-113). Le seul état qui sépare est **la file de synchronisation**, et l'instrument existe déjà : recopier `UIPreferencesService.test.ts:103-115` (transport dont le `push` ne résout jamais, `expect(brain.sync.pendingCount()).toBe(0)`). **Ajouter la contre-épreuve que ce précédent n'a pas** : dans le même test, une écriture de dossier doit faire monter `pendingCount()` à 1 — sinon l'assertion est vraie parce que **`queuePush` sort tôt sans transport** (`CloudSyncService.ts:158-159`), et l'instrument ne mesure rien.

## F — Décisions que le plan doit trancher (elles fixent le contrat, pas le rendu)

1. **Un refus journalise-t-il ?** Recommandation : **NON** — `executerCommande` rend la **même référence** de session sur un refus (assertion forte et séparatrice : `expect(resultat.session).toBe(session)`), le message vit dans l'état local de la console. Motif : le journal est un **constat du monde** (KR-248) ; une faute de frappe n'est pas un événement. Si le comité tranche l'inverse, la conséquence est contractuelle : le refus devient une entrée `role: 'moteur'`, persistée et rejouée.
2. **Un déplacement accepté avance-t-il `horloge.tour` de 1 ?** Recommandation : oui, et **les refus n'avancent rien**. Scénario séparateur obligatoire : *2 déplacements acceptés + 1 refus* ⇒ `tour === 2` **et** `journal.length !== tour` (sinon « tour » et « nombre de lignes » coïncident et le témoin épingle une coïncidence).
3. **Qui compose `journal[].texte` ?** Le **moteur** (registre développeur-débogueur, identifiants techniques, pas de prose) — il est persisté et rejoué, donc il appartient à l'état. `JournalRow` **rend**, ne recompose jamais (Déméter, § Encapsulation).

## G — REJETÉS *(à recopier au § 8 du plan — BUG-082)*

| # | Rejeté | Motif |
|---|---|---|
| **T-1** | **Exposer `local` sur `Brain`** (ou passer `createLocalStoragePersistence()` depuis une feature) — **VETO tech-lead** | Porte brute non synchronisée ouverte à toutes les features ; ni ESLint ni la revue ne la rattrapent. La doctrine maison expose un **service étroit** sur le brut, trois précédents (`BrainContext.tsx:86/88/94`) |
| **T-2** | **Le port à trois méthodes en it2** | `lire`/`effacer` sans appelant = KR-109. L'exemption « ça ne se rétro-ajoute pas » (D-16, `dossier_maj`) vaut pour une **donnée persistée**, jamais pour une **interface** |
| **T-3** | **La reprise / relecture d'une session en it2** | Traîne `validerSession` (KR-116), un chemin d'interface et la comparaison d'estampille : c'est une **seconde phrase de démo** |
| **T-4** | **Une fonction `rejouer(dossier, graine, entrées)` de production** | Un seul appelant — le test (KR-109). La transition étant **pure**, le rejeu se prouve par un **pliage écrit dans le test** |
| **T-5** | **La logique de déplacement dans `session.ts`** | Mêle forme et transition, pousse le fichier vers 380 lignes, et rouvre en it2 le fichier que le lot `contrat` d'it3 doit rouvrir |
| **T-6** | **La logique de déplacement (ou la résolution des accès) dans `play-mode` ou `src/player/`** | Extractibilité + `expr.test.ts:420` borne le moteur à `brain/dossier/` |
| **T-7** | **Un `switch (commande.commande)` dans `executerCommande`** | KR-117 ; `deltas.ts:45-46` a déjà écrit « comme CHAMP DU DESCRIPTEUR, jamais comme un `switch` » |
| **T-8** | **La liste des verbes écrite en dur dans le message de la console** | Elle mentirait dès it3 ; et la console re-listerait ce que `COMMANDES` décide (Déméter) |
| **T-9** | **Un 3ᵉ lot « persistance »** (port + hook + son test) | Il partagerait la suite de tests du shell pour ~20 lignes de parallélisme |
| **T-10** | **Toucher `EditorTopBar.tsx` / `bascule-editeur` en it2** | D-6 reste reporté : son déclencheur est un **relevé navigateur consigné**, qui n'existe pas |
| **T-11** | **Journaliser les refus de commande** (recommandation, § F.1 — à trancher par le comité) | Le journal est un constat du monde (KR-248) |
| **T-12** | **Une ligne `ia` ou un champ de session neuf en it2** | `aller` n'écrit que des champs existants ; l'assertion `INNOVATION` reste intacte |

## H — Ce que je n'ai pas mesuré (à mesurer par le lot, jamais à croire)

- **Non mesuré** : que `porteJouable.test.tsx` et `ouvertureVerbatim.test.tsx` restent verts après la scission d'`EcranPartie` — d'où le **territoire exclusif** donné à L2.
- **Non mesuré** : que `moteurSansIA.test.ts` reste vert avec les fichiers neufs — sa liste est **dérivée du disque**, donc ils y entrent sans geste ; la couleur, elle, n'a pas été rejouée.
- **Non mesuré** : `tsc` après l'ajout du champ `sessions` sur `Brain`.
- **Rappel KR-243** : ni `commandes.ts`, ni la transition, ni le port ne sont dans les 4 fichiers du périmètre muté. Pas de `test:mutation` pour it2.
