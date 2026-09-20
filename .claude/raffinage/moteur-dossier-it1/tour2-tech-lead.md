# Tour 2 — Tech Lead — `moteur-dossier` it1

**M1 acceptée sans réserve.** J'avais mesuré l'*absence* d'amendement et cité cette mesure pour couvrir sa *présence* : BUG-087, exactement la faute que ma note invoquait. Mon annexe B est retirée.

**C-2 → (β), l'oracle du narratif.** Aucune valeur de cellule en it1 ; `tourzero.test.ts` sort de L1 et reste 8/8 intact ; `tourzero.ts` ne reçoit que H6 et le chaînage JSDoc table ↔ `EtatMonde`. Une correction à (β) : la cellule `lieu_visite` ne peut pas partir en **it2**, qui n'a pas de lot `contrat` — elle rejoint la (i) dans le `contrat` d'**it3**. Écartées : (α) fait réécrire `VALEUR_ATTENDUE:106` et repointer `INDECIS:228`, un agent qui réaligne un attendu pour obtenir du vert ; (γ) est (β) sans l'instrument, et laisse H6 fausse sans rien de rouge.

**C-3 — narratif, nommément : tes deux lignes, RETIRÉES.** `journal[].texte` et `memoire` valent `moteur`, plus l'assertion « zéro ligne `ia` » que la n°10 supprimera en diff visible. Ton motif est le mien retourné : une autorisation sans consommateur est une dette, et celle-là ne se rejoue jamais.

**C-4a :** `objets_possedes` adopté — mon `inventaire` était inventé, le tien est relevé, la collision est mesurée. J'adopte `pnj: {}`, `confiance: null`, `climat_actif: null`. Je maintiens `lieux_visites: [depart]` : it2 ne peut pas le corriger sans troisième lot `contrat`.

**Statuts** — objection 1 (`persist.ts`) **MAINTENUE** · objection 2 (`disabled={!onPreview}`) **MAINTENUE** · **D1 MAINTENUE** · **D4 RETIRÉE** (l'UX a raison ; `EditorTopBar.tsx` entre dans L1) · **D6 DURCIE** : le port entier part en it2.

**Q4** — non. `src/features/moteur-dossier/` reste un répertoire de spec ; le témoin va dans `features/play-mode/tests/`.

---

# ANNEXE A corrigée

## A.0 — Le déplacement qui commande tout le reste

`ouvrirSession` **descend dans `brain/dossier/session.ts`** (placement déjà posé par la QA, qui adresse ses critères 1 et 5 à `brain/dossier/session.test.ts`). Trois conséquences :

1. **L'oracle devient possible dans L1 sans dépendance croisée.** Un oracle logé dans `brain/` mais important `src/player/moteur/` aurait rendu le lot `contrat` invérifiable seul.
2. **`src/player/` ne reçoit AUCUN fichier en it1.** Cohérent avec l'arbitrage n°5 : `expr.test.ts:420` a déjà forcé l'évaluateur dans `brain/dossier/` ; le constructeur d'état suit le même chemin. Le module reste pur, donc extractible (§ 6).
3. **Le port perd son site.** Le seul code qui persiste en it1 est le shell, c'est-à-dire une *feature*, qui a déjà `PersistenceService` + `dossierSessionKey`. Un port y serait une indirection à un implémenteur, un consommateur, zéro risque évité. **Les deux décisions sont liées** : si le comité veut le port en it1, il doit remonter `ouvrirSession` dans `src/player/`. C'est la seule autre combinaison cohérente ; je recommande celle-ci, et `persist.ts` reste hors périmètre dans les deux cas.

## A.1 — Les trois lots, listes finales et disjointes

**L1 — `contrat`, seul et premier**

| | Fichier |
|---|---|
| N | `src/brain/dossier/session.ts` — types + `ouvrirSession` + état initial |
| N | `src/brain/dossier/session.test.ts` — QA 1 (opposition KR-244), QA 5, `@ts-expect-error` sur `pnj.<id>.sait` (KR-253) |
| N | `src/brain/dossier/sessionDestinations.ts` |
| N | `src/brain/dossier/sessionCouverture.test.ts` — QA 7 + l'assertion « zéro ligne `ia` » |
| N | `src/brain/dossier/__fixtures__/session-saturee.ts` |
| N | `src/brain/dossier/tourzeroOracle.test.ts` — l'oracle (β) |
| R | `src/brain/dossier/tourzero.ts` — **docstring H6 + JSDoc de chaînage seulement, AUCUNE cellule** |
| R | `src/brain/Router.ts` · `src/brain/index.ts` · `src/brain/persistenceKeys.ts` |
| R | `src/brain/components/EditorTopBar.tsx` + `EditorTopBar.test.tsx` — C-6 |
| R | `docs/EXIGENCE-APERCU-DU-JEU.md` § 6 |
| **Réservés** | `src/brain/dossier/ouvrirSession.ts` + `ouvrirSession.test.ts` — **noms réservés à L1** : si `session.ts` franchit 400 lignes (KR-112), la fonction y part. Aucun autre lot ne peut créer ces noms. |
| **Interdits à L1** | `tourzero.test.ts`, `feuilles.ts`, `couverture.test.ts`, `expr.test.ts`, `controles.ts` — tous **verts sans modification** |

**L2 — le CTA** (`bascule-editeur`) : R `components/DossierEditorScreen.tsx` · R `tests/dossierEditorScreen.test.tsx`.

**L3 — le shell** (`play-mode` + racine)

| | Fichier |
|---|---|
| N | `src/features/play-mode/index.ts` |
| N | `src/features/play-mode/components/EcranPartie.tsx` |
| N | `src/features/play-mode/components/OutcomeBlock.tsx` |
| N | `src/features/play-mode/hooks/useSessionPersistee.ts` — `PersistenceService` + `dossierSessionKey`, **plus de port** |
| N | `src/features/play-mode/tests/porteJouable.test.tsx` — la porte + son mutant, **et la jonction** (monte `<App/>` routeur semé sur `{name:'partie'}`) |
| N | `src/features/play-mode/tests/ouvertureVerbatim.test.tsx` |
| N | `src/features/play-mode/tests/outcomeBlock.test.tsx` |
| N | `src/features/play-mode/tests/moteurSansIA.test.ts` + son mutant |
| R | `src/App.tsx` |

**Zéro fichier dans `src/player/`.** Disjonction vérifiée : L1 ∩ L2 = ∅, L1 ∩ L3 = ∅, L2 ∩ L3 = ∅.

## A.2 — Points de contrôle

**Propriété de `moteurSansIA.test.ts` : L3.** Il *lit* le disque, il n'importe rien. Périmètre = `src/player/**` + `src/features/play-mode/**` + `src/brain/dossier/**`, dérivé du disque, avec l'assertion de **non-vacuité** — non vide dans le worktree de L3. Dans le worktree de L1 il serait vide : raison technique pour laquelle L1 ne peut pas le porter.

**Domicile.** `src/features/moteur-dossier/` ne contient que `specification.json` : une feature réduite à un test est un répertoire fantôme. `brain/dossier/` est exclu aussi — le témoin balaie deux répertoires que `brain/` n'a pas le droit de connaître. Domicile : **`src/features/play-mode/tests/`**, docstring disant qu'il garde le **périmètre de la n°9**, pas la feature `play-mode`.

## A.3 — Deux gardes existantes, portées par L1 (C-9), mesurées

`expr.test.ts:349-353` : `fichiersDuModule()` = `readdirSync(brain/dossier)`, `.ts`, **`.test.ts` exclus**, **non récursif**. Motifs : `/\.?\bop\s*===\s*'/` et `/\bswitch\s*\(\s*[\w.]*\bop\s*\)/`, **commentaires compris**.
- Contrainte : **`session.ts` et `sessionDestinations.ts` ne doivent contenir, code ou docstring, ni `op === '` ni `switch (…op)`.** Pour parler de la grammaire, écrire « l'opérateur du nœud ».
- **Le fixture (`__fixtures__/`) et l'oracle (`*.test.ts`) sont hors du balayage** — l'oracle peut construire des littéraux `{ op: 'predicat', … }` sans entrer dans la liste close. **Mesuré.**
- Seconde garde `expr.test.ts:473-476` : balaie **aussi les tests** ; aucun symbole `parseExpr`/`parseCondition`/`compileExpr`/`lexExpr` dans les fichiers de L1.

`couverture.test.ts:515` : `porteurs === ['feuilles.ts']`. **Le balayage de session RÉUTILISE `feuillesDeLaFixture`, exporté par `feuilles.ts`** — donc **`feuilles.ts` n'est pas modifié**. Deux conséquences mesurées dans son corps (`:62`) : une liste vide **est** une feuille (d'où la fixture **saturée**), et la normalisation ne connaît que les tableaux — les clés de `monde.pnj.<id>` sont normalisées **dans le test de session**, jamais en ajoutant un chemin de session à `CHEMINS_D_ARRET`.

## A.4 — L'oracle, sa mécanique exacte (L1)

Il n'exporte ni ne lit `VALEUR_AU_TOUR_ZERO` ni `Trivalent` (KR-237). Il passe par la **fonction publique**, deux appels par prédicat de `PREDICATES` (KR-117) :

```
P = premiereFeuilleVraieAuTourZero(dossier, { op:'predicat', predicat, cibles })
N = premiereFeuilleVraieAuTourZero(dossier, { op:'non', enfant: { op:'predicat', predicat, cibles } })
P ≠ null → cellule 'vrai'   → l'état d'ouverture DOIT satisfaire le prédicat
N ≠ null → cellule 'faux'   → l'état d'ouverture NE DOIT PAS le satisfaire
P = N = null → 'indecidable' → NON ASSERTÉ (solidité seule)
```
État d'ouverture = `ouvrirSession(dossier-minimal, { graine_alea: 0 })`, même lot. **Mutant obligatoire dans le lot** : `indices_connus ∋ indice.sceau-brise` → ROUGE ; retiré ensuite. Vert exigé sur la table non amendée.
À écrire au plan : avec `lieux_visites: [depart]` et la cellule laissée `indecidable`, **l'oracle reste vert** — branche faux-négatif assumée, propriétaire **it3**.

## A.5 — Signatures amendées depuis le tour 1

```ts
// brain/dossier/session.ts
export interface EtatPnj { readonly a_dit: readonly string[]; readonly confiance: null }

export interface EtatMonde {
	readonly lieu_courant: string                       // lieu_courant_est
	readonly lieux_visites: readonly string[]           // lieu_visite — [depart] à l'ouverture
	readonly objets_possedes: readonly string[]         // possede_objet  (PAS `inventaire` : C-4a)
	readonly indices_connus: readonly string[]          // indice_connu
	readonly jalons_atteints: readonly string[]         // jalon_atteint
	readonly evenements_consommes: readonly string[]    // evenement_consomme
	readonly pnj: Readonly<Record<string, EtatPnj>>     // pnj_a_revele — {} à l'ouverture
}

export interface EtatSession {
	readonly schema: typeof SCHEMA_SESSION
	readonly dossier_id: string
	readonly graine_alea: number
	readonly horloge: { readonly tour: number; readonly climat_actif: null }  // n°14
	readonly monde: EtatMonde
	readonly journal: readonly EntreeJournal[]
	readonly memoire: null
}

export type RefusOuverture = 'ouverture_a_ecrire'
export type ResultatOuverture =
	| { readonly ok: true; readonly session: EtatSession }
	| { readonly ok: false; readonly refus: RefusOuverture }

/** PURE. `graine_alea` INJECTÉE — aucun `Math.random` au point d'usage. */
export function ouvrirSession(dossier: Dossier, options: { graine_alea: number }): ResultatOuverture

// PortDeStockageSession : SUPPRIMÉ d'it1 (D6 durcie).
```
Table d'audience : **aucune ligne `ia`** ; `journal[].texte` → `moteur`, `memoire` → `moteur`, plus `horloge.climat_actif` et `monde.pnj.<id>.confiance` → `moteur`. L'assertion `Object.values(table).every(d => d !== 'ia')` vit dans `sessionCouverture.test.ts`, avec le commentaire nommant la n°10 comme seule habilitée à la retirer.

```tsx
// brain/components/EditorTopBar.tsx (L1) — le title migre sur l'enveloppe (C-6)
<span title={onPreview ? undefined : previewDisabledReason} style={{ display: 'inline-flex' }}>
	<button type="button" onClick={onPreview} disabled={!onPreview} title={onPreview ? 'Aperçu du jeu' : undefined} …>
```
**Point de rendez-vous L1 → L2** : L2 assertera la raison sur l'**enveloppe**, pas sur le bouton.

```ts
// features/play-mode — le shell
const [dossier] = useState(() => dossiers.get(dossierId))          // GELÉ (D9)
const { jouable, controles } = controlerDossier(dossier)            // en ligne, dans la FEATURE (D5)
const [graine] = useState(() => Math.floor(Math.random() * 2 ** 32))
const [ouverture] = useState(() => ouvrirSession(dossier, { graine_alea: graine }))
useSessionPersistee(dossierId, ouverture)   // écrit via PersistenceService, effet de synchronisation
```

## A.6 — « Vérifié par personne » (repris de la QA, complété)

(a) le clic bout-en-bout éditeur → shell : couvert **en deux moitiés** (L2 assert la navigation, L3 assert le montage sur la route) — jamais en une ; (b) le port côté surface extraite : **sans objet en it1** ; (c) KR-243 : ni session ni oracle ne sont dans le périmètre muté ; (d) **la seconde branche de refus (`ouverture_a_ecrire`) est inatteignable par l'interface en it1** — M2 le prouve. Elle reste au type et au test unitaire (KR-244) parce que le runtime extrait n'a pas `controlerDossier` ; aucun témoin de composant ne peut l'atteindre, et la revue le dit.
