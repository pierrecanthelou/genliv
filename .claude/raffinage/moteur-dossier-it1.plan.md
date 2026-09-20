# Plan d'itération — `moteur-dossier` · itération `1`

> Statut : **`validé`** (2026-09-20)
> Produit par : pm-produit · tech-lead · ux-designer · qa · **narratif-ia** — le 2026-09-20
> Composition : **`5 rôles`** — motif : l'itération pose l'**état de session** et sa **table d'audience** (`sessionDestinations.ts`), et émet la **première prose verbatim** jamais lue par un joueur (`charpente.depart.texte_ouverture_joueur`). Frontière code/IA et audience de champ : terrain exact de `narratif-ia`. La convocation a payé — c'est lui qui a posé le **veto** qui a retiré deux lignes `ia` du contrat (§ 8, D-3), fourni l'**oracle** qui résout `tourzero.ts` (§ 8, D-2), et trouvé les **deux défauts structurels** de la table d'audience (§ 8, D-12).
> Exécution : **L1 seul et premier**, puis **L2 ∥ L3** (deux worktrees, zéro fichier partagé)
> Notes de tour : `.claude/raffinage/moteur-dossier-it1/tour{1,2}-{pm-produit,tech-lead,ux-designer,qa,narratif-ia}.md` · mesures de l'orchestrateur : `mesure-orchestrateur.md`

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur lit le texte d'ouverture de son dossier dans une partie lancée depuis l'éditeur. » |
| **Tranche** | CTA « Aperçu du jeu » (`bascule-editeur`) → `Route {name:'partie'}` (`brain/`) → `App.tsx` → shell `EcranPartie` (`play-mode`) → `ouvrirSession` (`brain/dossier`) → `PersistenceService` |
| **Lots** | 3 lots · dont `contrat` : oui (L1, seul et en premier) |
| **⚠ Dérogation nommée** | it1 touche **deux features** hors lot `contrat` (`bascule-editeur` pour le CTA, `play-mode` pour le shell), là où la porte mécanique en exige une. **Motif** : le squelette EST le câblage CTA → route → shell ; coupé, il donne un bouton qui n'ouvre rien et un écran atteignable par la seule URL — deux moitiés sans phrase de démo. Les quatre rôles convergent (la QA a retiré sa contradiction au tour 2). Frontière tenue par ESLint (trois sens) et par la variante de `Route` : **zéro import croisé**. Bornée à it1 — it2, it3, it4 : une feature chacune. Précédent de dérogation écrite : it4 (cadrage, arbitrage n°43). |
| **Hors périmètre** | évaluateur bivalent · deltas · `faits.ts` · console et verbe `aller` (it2) · `JournalRow` et toute **ligne** de journal — la **zone** et son état vide entrent · déplacement (it2) · jalons (it3) · démolition (it4) · **toute cellule de `VALEUR_AU_TOUR_ZERO`** (it3) · **le port de stockage** (it2) · `persist.ts` · saut au champ fautif · `effacer()` · reprise/relance d'une session · `quetes[].etapes` · forme interne de `memoire` · `attente` · `depart.inventaire_initial` · scission de `controles.ts` |
| **Reporté** | `<span title>` sur `EditorTopBar` (D-6, faute d'instrument) · le port de stockage (D-5) · les deux cellules de `tourzero.ts` (D-2, it3, **3ᵉ lot `contrat`**) · replay déterministe (D-8, it2). **Une proposition `INNOVATION`** : l'assertion d'audience écrite pour être **supprimée** (§ 9). |
| **Escalade** | **aucune** — le seul veto prononcé (narratif, lignes `ia`) a été levé dans le même tour par le tech-lead, qui a retiré les deux lignes. |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur qui a rédigé le texte d'ouverture de son dossier voit s'allumer le CTA « Aperçu du jeu », clique, et **lit ce texte mot pour mot** dans un écran de partie. Le dossier qui porte encore un contrôle bloquant garde le CTA éteint, avec **la raison écrite dans l'infobulle** — et la route `partie` atteinte directement refuse de monter une session (KR-239 : la porte n'est pas contournable par l'URL).

Le lot `contrat` fige, pour toute la feature : `EtatSession` / `EtatMonde` / `EntreeJournal` / `RoleJournal`, la fonction pure `ouvrirSession`, la **table d'audience de session** (exhaustive par compilation, **zéro ligne `ia`**), la variante de `Route`, la clé de persistance, et un **oracle** qui confronte pour la première fois la table `VALEUR_AU_TOUR_ZERO` de `tourzero.ts` à un **état réel**. Ni évaluateur, ni delta, ni aucune valeur de cellule changée.

## 2 — Hors périmètre

*(Écrit par le PM, consolidé au tour 2. Ce qui n'est pas ici sera codé par quelqu'un.)*

- **Évaluateur bivalent, `evaluate.ts`, `appliquerDelta`, `faits.ts`** — it3, second lot `contrat`.
- **Console de commandes typées et le verbe `aller`** · **`JournalRow` et toute LIGNE de journal** · **déplacement par `lieux[].acces`** — it2. La **zone** `JOURNAL` et son **état vide** entrent en it1 (§ 3.E) : c'est une zone, pas une ligne.
- **Jalons, leur projection, `enonce_texte`** — it3. **Démolition des consommateurs d'arbre** — it4.
- **Toute cellule de `VALEUR_AU_TOUR_ZERO`** — `lieu_visite` (décision ii) **et** `indice_connu` (décision i) partent **ensemble** dans le lot `contrat` d'it3 (§ 8, D-2). `tourzero.ts` ne reçoit ici qu'une **docstring**.
- **Le port de stockage `{ lire, écrire, effacer }`** — it2 (§ 8, D-5). En it1 la session est persistée par la feature, via `PersistenceService` + `dossierSessionKey`. **`src/player/utils/persist.ts` n'est pas touché** (il stocke `SessionState` par `bookId`, orphelin en it4).
- **`effacer()`, tout bouton « Reprendre » / « Relancer », toute LECTURE d'une session persistée** — it2. it1 écrit, rien ne relit.
- **Le saut au champ fautif depuis le CTA désactivé** — hors périmètre explicite du roadmap § 5.
- **`quetes[].etapes`** · **forme interne de `memoire`** · **`attente` et sa racine** · **`depart.inventaire_initial`** · **`heros` / `combat`** — propriétaires nommés au § 8, D-11.
- **Scission de `controles.ts`** — déclencheur non armé.
- **`brain/components/EditorTopBar.tsx`** — n'est touché par aucun lot (§ 8, D-6).
- **Aucun identifiant technique rendu à l'écran** — ni `lieu.val-cendre`, ni n° de tour, ni PV/PE, ni barre de héros, ni compteur d'avertissements.

## 3 — Contrat de design

Composants réutilisés tels quels : aucun. **Un composant neuf** : `OutcomeBlock`. **Aucun token neuf.** Les deux seuls nombres bruts de tout le contrat sont `maxWidth: 640` (colonne de lecture) et `maxWidth: 480` (blocs vide/refus) — **mesures de ligne**, sans jeton au système ; précédent `PanneauControles.tsx:77`.

### 3.A — Le CTA « Aperçu du jeu » (`DossierEditorScreen.tsx`, L2)

`RAISON_APERCU_DESACTIVE` (lignes 81-82) est **supprimée** — elle meurt avec son unique usage. La ligne 141 appelle déjà `controlerDossier(dossier)` **en ligne, à chaque rendu** : on élargit sa déstructuration. **Aucun `useMemo`, aucun `useEffect`, aucun second appel** (KR-245, KR-013/113).

```ts
const { parSection, controles, jouable } = controlerDossier(dossier)

// Le TEXTE seul est dérivé ici. `jouable` reste la PORTE, et n'est JAMAIS
// recalculé en « aucun bloquant » : controles.ts le dérive « ICI ET NULLE
// PART AILLEURS » (KR-013).
const bloquants = controles.filter((c) => c.niveau === 'bloquant')
const raisonApercu =
	bloquants.length === 0
		? undefined
		: bloquants.length === 1
			? bloquants[0].message
			: `${bloquants[0].message} (et ${bloquants.length - 1} de plus)`
```

```tsx
<EditorTopBar
	…
	onPreview={jouable ? () => router.navigate({ name: 'partie', dossierId }) : undefined}
	previewDisabledReason={raisonApercu}
/>
```

**Composition du suffixe, exacte** : `message` + **une** espace + `(et {n} de plus)`, avec `n = bloquants.length - 1` — le **reste**, jamais le total. Suffixe **absent** si `n === 0`. Aucune ponctuation ajoutée (les `Controle.message` finissent déjà par un point). « de plus » est invariable : **ne pas** appeler `plural`.

**Rendu exact, dossier fraîchement créé** (mesuré : seul `texte_ouverture_joueur` est `bloquant` parmi les quatre proses d'amorce — `controles.ts:168-176` ; les trois autres sont `alerte`) :

> `Ce texte porte encore le marqueur ⟨à écrire⟩ : le moteur le lira au joueur mot pour mot, marqueur compris.`

**Avec trois bloquants** :

> `Ce texte porte encore le marqueur ⟨à écrire⟩ : le moteur le lira au joueur mot pour mot, marqueur compris. (et 2 de plus)`

**Une fois `jouable === true`** : `raisonApercu` vaut `undefined`, `onPreview` est fourni, `EditorTopBar` rend déjà `title="Aperçu du jeu"`, `color: var(--text-body)`, `cursor: pointer`. **Aucune ligne de style d'`EditorTopBar` ne change** — pas d'accent sur ce bouton.

**Piège** : `EditorTopBar:126` fait `disabled={!onPreview}`, jamais `!!previewDisabledReason`. C'est l'**absence** d'`onPreview` qui désactive. Passer `onPreview` inconditionnellement livrerait un CTA cliquable sur dossier injouable.

**État inatteignable, à ne pas garnir** : `jouable === false` avec `raisonApercu === undefined` n'existe pas — `jouable` **est** « aucun bloquant ». N'écris aucune chaîne de repli.

### 3.B — Le shell de partie (`EcranPartie.tsx`, L3)

Référence d'anatomie : `PlayerModal.tsx`, même répertoire, **reprise et non importée**. **Différence à écrire en docstring** : `PlayerModal` est une **modale** (`role="dialog"`, `aria-modal`, superposée) ; ce shell est une **route** rendue par `App.tsx`, donc une **page** — `<main>`, **ni** `role="dialog"`, **ni** `aria-modal`, **ni** `--shadow-*`. La règle « le focus revient au déclencheur à la fermeture » ne s'applique pas : ce n'est pas une fermeture, c'est une navigation.

```
<main aria-label="Aperçu du jeu">
├── <header>
│   ├── <span> mono : « Aperçu du jeu »  ·  {dossier.titre}
│   └── <button> : « ✕ Quitter le test »
└── <div> corps défilant
    └── <div> colonne de lecture
        ├── OutcomeBlock (§ 3.D)   ← la bannière d'ouverture
        └── <section> Journal (§ 3.E)
```

| Emplacement | Texte exact, mot pour mot | Registre |
|---|---|---|
| `aria-label` de `<main>` | `Aperçu du jeu` | auteur |
| Header, gauche (mono) | `Aperçu du jeu` puis ` · ` puis `{dossier.titre}` | auteur |
| Header, droite | `✕ Quitter le test` | auteur |
| `aria-label` du bouton de sortie | `Quitter le test` (sans le glyphe) | auteur |

```ts
const racine: CSSProperties = { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--surface-app)' }
const entete: CSSProperties = {                               // calqué sur PlayerModal.tsx:43-53
	display: 'flex', alignItems: 'center', justifyContent: 'space-between',
	padding: 'var(--space-3) var(--space-7)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
	background: 'var(--surface-card)', flexShrink: 0,
}
const titreEntete: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-label)' }
const titreDossier: CSSProperties = { color: 'var(--text-strong)' }
const boutonSortie: CSSProperties = {                         // calqué sur PlayerModal.tsx:74-85
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
	padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--border-card)', background: 'transparent',
	color: 'var(--text-label)', cursor: 'pointer', minHeight: 'var(--hit-target)',
}
const corps: CSSProperties = { flex: 1, minHeight: 0, overflowY: 'auto', padding: 'var(--space-12)', boxSizing: 'border-box' }
const colonneLecture: CSSProperties = { maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-9)' }
```

**États** : survol du bouton de sortie en **CSS seul**, jamais un état `isHovered` en React. Chargement : **aucun** — `DossierService.get` est synchrone, n'invente pas de spinner.

### 3.C — Les trois écrans de refus

Rendus **à la place de la colonne de lecture**, le header restant identique (l'auteur doit pouvoir sortir).

```
<section> bloc de refus
├── <span aria-hidden> ⊘          glyphe DS « prérequis non satisfait »
├── <h2> « La partie ne peut pas s'ouvrir »
├── <p>  {texte du code de refus}
└── <button> {action}
```

| Code | Garde (§ 5, L3) | Atteignable en it1 ? | Texte exact, mot pour mot | Action visible |
|---|---|---|---|---|
| `dossier_introuvable` | 2 | **OUI** | `Dossier introuvable.` | `← Mes dossiers` → `{ name: 'home' }` |
| `dossier_non_jouable` | 3 | **OUI** (KR-239) | `Ce dossier porte encore un contrôle bloquant. Ouvrez « Contrôles » dans l'éditeur pour voir lequel.` | `← Revenir à l'éditeur` → `{ name: 'dossier', dossierId }` |
| `ouverture_a_ecrire` | 5 | **NON — mesuré** (`controles.ts:170` le classe `bloquant`, donc la garde 3 a déjà refusé) | `Le texte d'ouverture porte encore le marqueur ${MARQUEUR_A_ECRIRE} — le moteur le lirait au joueur mot pour mot. Rédigez-le dans DÉPART · TEXTE D'OUVERTURE.` | idem ci-dessus |

Trois règles attachées :

1. **`Dossier introuvable.`** est repris tel quel de `DossierEditorScreen.tsx:121` — le même fait, deux écrans, un seul texte.
2. **La troisième ligne : la branche reste, le critère part** (§ 8, D-7). `ResultatOuverture` est une union discriminée que le shell doit rétrécir **totalement** : un bras sans texte rend un écran blanc, et KR-239 écrit que des chemins futurs (reprise, lien direct) **rouvrent** ce cas. **Aucun critère d'acceptation n'asserte son rendu en it1**, et la revue l'écrit comme non atteignable par l'interface.
3. **Le marqueur se compose, jamais ne se recopie** : `import { MARQUEUR_A_ECRIRE } from '…/brain/dossier/amorce'`. Le glyphe `⟨à écrire⟩` tapé en dur serait la seconde source de vérité.

```ts
const blocRefus: CSSProperties = {
	display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)', background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)', maxWidth: 480, margin: '0 auto',
}
const glypheRefus: CSSProperties = { fontSize: 'var(--fs-h1)', color: 'var(--text-faint)', lineHeight: 1 }
const titreRefus: CSSProperties = { margin: 0, fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-semibold)', letterSpacing: 'var(--track-tight)', color: 'var(--text-strong)' }
const texteRefus: CSSProperties = { margin: 0, color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }
const boutonRetour: CSSProperties = {
	marginTop: 'var(--space-3)',
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
	padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--accent)', background: 'var(--accent)',
	color: 'var(--text-on-accent)', fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer', minHeight: 'var(--hit-target)',
}
```

L'accent est légitime : **unique action de l'écran**. Glyphe `⊘`, jamais `⚠` (pris par `PlayerModal`), jamais un emoji ni un SVG.

### 3.D — `OutcomeBlock` (neuf, `features/play-mode/components/`)

```ts
export interface OutcomeBlockProps {
	/** Libellé mono MAJUSCULES — REGISTRE AUTEUR. REQUIS : il désigne la prose sans en faire partie. */
	entete: string
	/** La prose du dossier, rendue VERBATIM. Jamais transformée, jamais tronquée. */
	children: ReactNode
}
```

**Pas de prop `variant` en it1, et c'est délibéré** — docstring obligatoire disant cette phrase. Le fichier de référence `design_handoff_gamebook_editor/components/surfaces/OutcomeBlock.jsx` porte `success` / `failure` teintés `--good-bg` / `--bad-bg` : les **deux seules couleurs sémantiques du projet**, réservées à la réussite et à l'échec d'un **jet**. Le texte d'ouverture n'est pas un jet. L'axe de variante entre avec son premier appelant de jet (n°11).

```ts
const bloc: CSSProperties = {
	border: 'var(--bw-hair) solid var(--border-card)', background: 'var(--surface-card)',
	borderRadius: 'var(--r-lg)',       // « outcome blocks » — spacing.css:27
	padding: 'var(--space-7)',
}
const entete: CSSProperties = {
	display: 'block', marginBottom: 'var(--space-2)',
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow-wide)', color: 'var(--text-label)',
}
const prose: CSSProperties = {
	margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-row)',
	lineHeight: 'var(--lh-loose)', color: 'var(--text-strong)', whiteSpace: 'pre-wrap',
}
```

- **`whiteSpace: 'pre-wrap'` est une exigence de « verbatim »**, pas une préférence : les retours de paragraphe tapés par l'auteur doivent survivre au rendu, sinon « mot pour mot » est faux dès le premier alinéa.
- **`--fs-row`, pas `--fs-sm`** ; **`--text-strong`, pas `--text-body`** : c'est la seule prose littéraire de l'écran.
- **`8.5px` du fichier de référence est refusé** → `--fs-eyebrow`.

```tsx
<OutcomeBlock entete="OUVERTURE — lue au joueur, mot pour mot">
	{dossier.charpente.depart.texte_ouverture_joueur}
</OutcomeBlock>
```

### 3.E — La zone journal, rendue dès it1 avec son état vide

```tsx
<section aria-label="Journal">
	<span style={libelleZone}>JOURNAL</span>
	{session.journal.length === 0 ? (
		<div style={etatVide}>
			<span style={glypheVide} aria-hidden="true">⬚</span>
			<p style={texteVide}>{TEXTE_JOURNAL_VIDE}</p>
		</div>
	) : null /* it2 : la liste de JournalRow */}
</section>
```

**Texte, mot pour mot — constante `TEXTE_JOURNAL_VIDE`, inchangée en it2** :

> `Aucun évènement pour l'instant — vos actions y apparaîtront.`

Il est au **futur** : vrai en it1 où l'auteur ne peut rien faire, vrai en it2 où il le peut. **Ne pas** écrire un texte transitoire pour it1. Forme maison `Aucun X — <invitation>.` (`PanneauObjets.tsx:56`, `PanneauControles.tsx:21`, `FicheEvenement.tsx:53`).

**Libellé de la zone** : `JOURNAL` — un mot, mono, MAJUSCULES, symétrique du `CONSOLE` d'it2. Jamais « Journal de la partie » ni « Historique ».

```ts
const libelleZone: CSSProperties = {
	display: 'block', marginBottom: 'var(--space-4)',
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow-wide)', color: 'var(--text-label)',
}
const etatVide: CSSProperties = {
	display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)', background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
}
const glypheVide: CSSProperties = { fontSize: 'var(--fs-h1)', color: 'var(--text-faint)', lineHeight: 1 }
const texteVide: CSSProperties = { margin: 0, color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }
```

### 3.F — Clavier (ergonomie de rédaction)

| Geste | Comportement |
|---|---|
| `Échap` | fait **exactement** ce que fait le bouton visible de l'écran affiché : `{ name: 'home' }` sur `dossier_introuvable`, `{ name: 'dossier', dossierId }` partout ailleurs |
| `Tab` | atteint `✕ Quitter le test` — **unique focusable du shell en it1** ; sur un écran de refus : la sortie puis le bouton d'action, dans l'ordre visuel |
| `Entrée` / `Espace` | natif, `<button type="button">` |

Écouteur `Échap` : sur `document`, **`useRef` sur le rappel + nettoyage dans le `useEffect`** — recopier `PlayerModal.tsx:18-27` (KR-004). **Aucun focus impératif au montage, aucun piège à focus, aucune restauration de focus au retour** : la route démonte le déclencheur. Ce n'est pas une omission.

### 3.G — Les trois registres de langue sur cet écran

| Registre | Où, exactement | Faute à guetter |
|---|---|---|
| **Auteur** | header, `✕ Quitter le test`, l'en-tête `OUVERTURE — lue au joueur, mot pour mot`, le libellé `JOURNAL`, les écrans de refus, le `title` du CTA | tutoyer, expliquer, faire des phrases |
| **Joueur** | **un seul nœud de tout l'écran** : les enfants de l'`OutcomeBlock` | tronquer, préfixer, « habiller » — **aucune prose générée par le code** |
| **Développeur-débogueur** | **absent en it1** — arrive en it2 avec `CONSOLE` et `JournalRow` | faire fuiter un identifiant dans la bannière ou un texte de refus |

`lieu_courant` est un **identifiant** : il n'apparaît **nulle part** à l'écran. Le pas de côté le plus probable de l'essaim est d'afficher « Lieu : lieu.val-cendre » sous la bannière « pour montrer que ça marche » — le test doit le lire dans l'**état de session**, jamais dans le DOM.

## 4 — Contrats `brain/` touchés

| Contrat | Direction | Ce qui change |
|---|---|---|
| `brain/dossier/session.ts` | **fournit (N)** | `SCHEMA_SESSION`, `RoleJournal`, `EntreeJournal`, `EtatPnj`, `EtatMonde`, `EtatSession`, `RefusOuverture`, `ResultatOuverture`, `ouvrirSession` |
| `brain/dossier/sessionDestinations.ts` | **fournit (N)** | `DESTINATION_DES_CHAMPS_DE_SESSION` — `Destination` **réutilisé** depuis `destinations.ts`, jamais un second vocabulaire. **Jamais fusionnée** dans `destinations.ts` |
| `brain/Router.ts` | fournit (R) | `Route |= { name: 'partie'; dossierId: string }` — le **seul** rendez-vous entre `bascule-editeur` et `play-mode` |
| `brain/persistenceKeys.ts` | fournit (R) | `DOSSIER_SESSION_KEY_PREFIX`, `dossierSessionKey(dossierId)` |
| `brain/index.ts` | fournit (R) | baril : les types de session + `SCHEMA_SESSION` + `ouvrirSession` + les deux symboles de clé. **Ne PAS ré-exporter** `DESTINATION_DES_CHAMPS_DE_SESSION` (aucun consommateur de feature) ni `MARQUEUR_A_ECRIRE` |
| `brain/dossier/tourzero.ts` | fournit (R) | **docstring H6 + JSDoc de chaînage seulement. AUCUNE cellule** |
| `brain/dossier/predicates.ts` | fournit (R) | **une ligne de docstring** : `possede_objet` nomme `monde.objets_possedes[]` au lieu de renvoyer à `sessionEngine.filterChoicesByPrereq` (l'inventaire de l'arbre, mourant) |
| `controlerDossier` → `RapportControles` | consomme | `.controles` et `.jouable` s'ajoutent à `.parSection`. `controles.ts` **n'est pas ouvert** |
| `DossierService.get` | consomme | le dossier est **GELÉ** à l'ouverture — **jamais** `useOpenDossier`, qui s'abonne à `dossier:updated` |
| `PersistenceService` | consomme | écriture de la session par la feature `play-mode` |
| `PREDICATES` | consomme | les sept champs d'`EtatMonde` sont relevés de son registre, jamais inventés |
| `docs/EXIGENCE-APERCU-DU-JEU.md` § 6 | doc (R) | la liste des purs extractibles gagne `brain/dossier/types.ts`, `amorce.ts`, `session.ts`, `sessionDestinations.ts` |

**Aucun événement `partie:*`** — zéro abonné externe ; la variante de `Route` en a déjà un (arbitrage n°23).

## 5 — Lots

### Lot L1 — `session-contrat` — **`contrat`** *(seul, et en premier)*

**Fichiers** — aucun autre lot ne les nomme :

| | Chemin |
|---|---|
| N | `src/brain/dossier/session.ts` |
| N | `src/brain/dossier/session.test.ts` |
| N | `src/brain/dossier/sessionDestinations.ts` |
| N | `src/brain/dossier/sessionCouverture.test.ts` |
| N | `src/brain/dossier/__fixtures__/session-saturee.ts` |
| N | `src/brain/dossier/tourzeroOracle.test.ts` |
| R | `src/brain/dossier/tourzero.ts` *(docstring seule)* |
| R | `src/brain/dossier/predicates.ts` *(une ligne de docstring)* |
| R | `src/brain/Router.ts` |
| R | `src/brain/index.ts` |
| R | `src/brain/persistenceKeys.ts` |
| R | `docs/EXIGENCE-APERCU-DU-JEU.md` |

**Noms RÉSERVÉS à L1**, que nul autre lot ne peut créer : `src/brain/dossier/ouvrirSession.ts` + `ouvrirSession.test.ts` — si `session.ts` franchit 400 lignes (KR-112), la fonction y part.

**INTERDITS à L1, et verts sans modification à la fin** : `tourzero.test.ts`, `feuilles.ts`, `couverture.test.ts`, `expr.test.ts`, `controles.ts`, `brain/components/EditorTopBar.tsx`.

**Signatures exposées** — § 11.

**Trois pièges mesurés, à porter en autocontrôle :**

1. **`expr.test.ts:349-353`** balaie `readdirSync(brain/dossier)`, `.ts` **non-test**, **non récursif**, et cherche `/\.?\bop\s*===\s*'/` et `/\bswitch\s*\(\s*[\w.]*\bop\s*\)/` **dans la source, commentaires compris**, pour épingler la liste close des lecteurs d'`ExprNode`. Donc : **`session.ts` et `sessionDestinations.ts` ne doivent contenir, ni en code ni en docstring, `op === '` ni `switch (…op)`.** Pour parler de la grammaire, écrire « l'opérateur du nœud ». Le fixture (`__fixtures__/`, non balayé car non récursif) et l'oracle (`*.test.ts`, exclu) peuvent construire des littéraux `{ op: 'predicat', … }` : `op:` ne matche aucun des deux motifs. Seconde garde `expr.test.ts:473-476` : aucun symbole `parseExpr` / `parseCondition` / `compileExpr` / `lexExpr`, tests compris.
2. **`couverture.test.ts:515`** exige `porteurs === ['feuilles.ts']`. Donc le balayage de session **importe `feuillesDeLaFixture` depuis `feuilles.ts`** — il ne le réécrit pas, et **`feuilles.ts` n'entre dans aucun lot**.
3. **Le walker efface les indices de TABLEAU, pas les clés de `Record`** : réutilisé tel quel il rend `monde.pnj.pnj-aldur.a_dit[]`. La normalisation `<id>` se fait **après** son retour, **dans `sessionCouverture.test.ts` seul** — jamais en ajoutant un chemin de session à `CHEMINS_D_ARRET` de `feuilles.ts`.

### Lot L2 — `cta-apercu` — feature `bascule-editeur` *(après L1)*

| | Chemin |
|---|---|
| R | `src/features/bascule-editeur/components/DossierEditorScreen.tsx` |
| R | `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` |

**Consomme** : `controlerDossier` (`.controles`, `.jouable`), `Route { name: 'partie'; dossierId }`, `EditorTopBar` **inchangé**. **N'importe jamais** `play-mode`.
**Livre** : § 3.A, les critères 2 et 3 (§ 6) et le mutant du critère 2.

### Lot L3 — `shell-partie` — feature `play-mode` + racine de composition *(après L1, en parallèle de L2)*

| | Chemin |
|---|---|
| N | `src/features/play-mode/index.ts` |
| N | `src/features/play-mode/components/EcranPartie.tsx` |
| N | `src/features/play-mode/components/OutcomeBlock.tsx` |
| N | `src/features/play-mode/hooks/useSessionPersistee.ts` |
| N | `src/features/play-mode/tests/porteJouable.test.tsx` |
| N | `src/features/play-mode/tests/ouvertureVerbatim.test.tsx` |
| N | `src/features/play-mode/tests/outcomeBlock.test.tsx` |
| N | `src/features/play-mode/tests/moteurSansIA.test.ts` |
| R | `src/App.tsx` |

**Zéro fichier dans `src/player/`.** `PlayerModal.tsx` n'est pas touché (il reste importé par `src/EditorScreen.tsx:4`, chemin mort).

**Consomme** : `ouvrirSession`, les types de session, `dossierSessionKey`, `PersistenceService`, `controlerDossier`, `DossierService.get`, `Route`.
**Expose** : `export { EcranPartie } from './components/EcranPartie'` dans `index.ts`, rendu par `src/App.tsx` sur `route.name === 'partie'`, **keyé par `dossierId`**.

**Ordre des gardes dans `EcranPartie`, NORMATIF :**

1. `const [dossier] = useState(() => dossiers.get(dossierId))` — **GELÉ** (arbitrage n°7). **Ne pas** utiliser `useOpenDossier` : il s'abonne à `dossier:updated`, ce que le runtime refuse. **Piège le plus probable du lot** — le voisin `DossierEditorScreen` fait l'inverse, à raison.
2. `dossier === undefined` → refus `dossier_introuvable`.
3. `const { jouable, controles } = controlerDossier(dossier)` **en ligne** ; `!jouable` → refus `dossier_non_jouable` (**KR-239 : la porte est ICI, pas seulement au CTA**). C'est la **feature** qui lit `controlerDossier`, jamais `src/player/` ni `brain/dossier/`.
4. `const [graine] = useState(() => tirerGraine())` puis `const [ouverture] = useState(() => ouvrirSession(dossier, { graine_alea: graine }))`. **`tirerGraine()` est une fonction NOMMÉE** exportée par le module du shell, jamais un `Math.random()` anonyme en ligne — c'est la seule entropie de la feature, et le test doit pouvoir la fixer (réserve narratif, précédent `combat.ts:107`).
5. `ouverture.ok === false` → refus `ouverture_a_ecrire` (branche totale, inatteignable par l'interface en it1).
6. Sinon : header, `OutcomeBlock` verbatim, zone journal vide.

`useSessionPersistee(dossierId, session)` : `useEffect(() => { persistence.set(dossierSessionKey(dossierId), session) }, [persistence, dossierId, session])` — usage **légitime** d'un effet (synchronisation avec un système externe). **Ne pas** écrire depuis un initialiseur `useState` (effet de bord en rendu, doublé en StrictMode). `PersistenceService` est synchrone.

**`moteurSansIA.test.ts` appartient à L3, et pour une raison technique** : son périmètre dérivé du disque (`src/player/**` + `src/features/play-mode/**` + `src/brain/dossier/**`) serait **vide** dans le worktree de L1, où `play-mode` n'existe pas encore — et son assertion de non-vacuité le ferait rougir. Domicile `features/play-mode/tests/` et non `features/moteur-dossier/` : ce répertoire ne contient qu'un `specification.json`, et une feature réduite à un test est un répertoire fantôme. Docstring obligatoire disant qu'il garde le **périmètre de la n°9**, pas la feature `play-mode`.

## 6 — Critères d'acceptation

| # | Étant donné / Quand / Alors | Niveau | Lot |
|---|---|---|---|
| **1** | **ÉD** un dossier dont `charpente.depart.texte_ouverture_joueur` porte `MARQUEUR_A_ECRIRE` **et** son jumeau réécrit · **Q** `ouvrirSession` est appelée sur chacun · **A** le premier rend `{ ok: false, refus: 'ouverture_a_ecrire' }`, le second `{ ok: true }` — **dans le MÊME test** (KR-244, KR-197/202) | unitaire | L1 |
| **2** | **ÉD** un dossier dont `jouable` passe de `false` à `true` **sur le même montage, sans remontage** · **Q** re-rendu · **A** `previewDisabledReason` vaut le `message` du **premier** contrôle bloquant **à l'état courant**, suffixé `(et {n} de plus)` si `n > 0`, puis `undefined` — l'absence de remontage **est** l'état séparateur : un miroir rendrait la première valeur (KR-245, KR-013/113) | composant | L2 |
| **3** | **ÉD** un dossier `jouable` · **Q** clic sur « Aperçu du jeu » · **A** `router.navigate({ name: 'partie', dossierId })` est appelé ; sur un dossier non jouable le bouton est `disabled` et n'appelle rien | composant | L2 |
| **4** | **ÉD** la route `partie` atteinte **directement** (routeur semé, sans passer par le CTA), sur un dossier `jouable=false` puis `true` · **Q** montage du shell · **A** refus `dossier_non_jouable` nommé, puis montage de la session — la porte n'est pas contournable par l'URL (KR-239) | composant | L3 |
| **5** | **ÉD** un dossier dont `charpente.depart.lieu_id` **n'est pas le premier de `monde.lieux[]`** · **Q** `ouvrirSession` · **A** `monde.lieu_courant === charpente.depart.lieu_id` **et** `monde.lieux_visites === [charpente.depart.lieu_id]` — sans cette fixture, « départ » et « premier lieu » coïncident et le témoin épingle une coïncidence (BUG-113) | unitaire | L1 |
| **6** | **ÉD** `__fixtures__/dossier-minimal.json` et la session rendue par `ouvrirSession` · **Q** confrontation prédicat par prédicat, par l'API publique de `tourzero.ts` · **A** **aucune** cellule `'vrai'`/`'faux'` ne contredit l'état, sur **≥ 6 cellules assertées** (non-vacuité, mesurée à 6) ; les `indecidable` ne sont pas assertés ; `tourzero.test.ts` **n'est pas modifié**, constatable au diff | contrat | L1 |
| **7** | **ÉD** `DESTINATION_DES_CHAMPS_DE_SESSION` et `__fixtures__/session-saturee.ts` · **Q** balayage pleine profondeur par `feuillesDeLaFixture` · **A** échec **par nom de champ** sur toute feuille sans ligne ; aucune ligne morte hors les **trois** dispenses déclarées ; exhaustivité **par compilation** sur `keyof EtatSession` ; `[...new Set(Object.values(table))]` vaut **exactement** `['moteur']` ; `memoire` typée `null` ; `pnj.<id>.sait` refusé par `@ts-expect-error` (KR-241/249/253) | contrat | L1 |
| **8** | **ÉD** la liste de fichiers du périmètre de la n°9, **dérivée du disque** · **Q** balayage · **A** zéro `fetch`, zéro import de `CopiloteService`, zéro construction d'URL `/ia/`, **et la liste est non vide** (KR-250) | contrat/feature | L3 |

**Quatre mutants obligatoires, écrits et vérifiés ROUGE dans le lot qui livre leur témoin**, puis retirés — la valeur attendue et le pouvoir séparateur sont **deux mesures, pas une** (BUG-087) :

| Témoin | Mutant | Lot |
|---|---|---|
| critère 2 | la raison recopiée dans un état posé par `useEffect` | L2 |
| critère 4 | la garde `jouable` **retirée du shell**, conservée au CTA | L3 |
| critère 6 | une session d'ouverture dont `indices_connus` contient `indice.sceau-brise` | L1 |
| critère 8 | un `import { CopiloteService }` ajouté dans un fichier du périmètre | L3 |

**Mesuré d'avance par la QA** (à recopier dans la revue, pas à redécouvrir) : le critère 6 est **VERT** sur la table non amendée, **ROUGE** sous son mutant, et **VERT** sous le mutant de direction it2 (`lieux_visites = [depart]`). L'oracle couvre la décision (i), **jamais** la (ii) : asymétrie **mesurée**, pas supposée.

## 7 — Tests nommés, par KR

| KR | Test qui le tient | Lot |
|---|---|---|
| **KR-239** (porte au montage du shell) | `features/play-mode/tests/porteJouable.test.tsx` — critère 4 **+ son mutant** | L3 |
| **KR-241** (table d'audience, exhaustive par compilation, échec par nom de champ) | `brain/dossier/sessionCouverture.test.ts` — critère 7 | L1 |
| **KR-242** (replay intra-process) | **aucun** — REPORTÉ it2 (D-8). La revue l'écrit « vérifié par personne » | — |
| **KR-243** (hors périmètre muté) | **aucun instrument** — la revue l'écrit noir sur blanc : ni session, ni oracle, ni évaluateur ne sont dans les 4 fichiers mutés | — |
| **KR-244** (refus par opposition, même test) | `brain/dossier/session.test.ts` — critère 1 | L1 |
| **KR-245** (lecture dérivée pure) | `bascule-editeur/tests/dossierEditorScreen.test.tsx` — critère 2 **+ son mutant** | L2 |
| **KR-249** (clé racine = point d'extension ; `memoire: null`) | `sessionCouverture.test.ts` — critère 7 | L1 |
| **KR-250** (aucune génération de texte) | `features/play-mode/tests/moteurSansIA.test.ts` — critère 8 **+ son mutant** | L3 |
| **KR-251** (champ ajouté après it1 = optionnel à vie) | **aucun témoin possible en it1** — contrainte sur les itérations suivantes. La session **est** persistée dès it1, donc la prémisse tient. La revue l'écrit | — |
| **KR-252** (dette de `tourzero.ts`, invisible) | `brain/dossier/tourzeroOracle.test.ts` — critère 6 **+ son mutant**. Premier instrument qui confronte la table à un **état** | L1 |
| **KR-253** (`pnj.<id>.sait` n'entre pas) | `sessionCouverture.test.ts`, `@ts-expect-error` — critère 7 | L1 |
| **KR-013/113** (état dérivé) | critère 2 (mutant `useEffect`) + relevé `rg` de l'auto-revue | L2 |
| **KR-004** (ref stable sur un rappel) | `PlayerModal.tsx:18-27` recopié pour l'écouteur `Échap` ; revue de lot | L3 |
| **KR-109** (composant à un seul consommateur) | `OutcomeBlock` reste dans `features/play-mode/components/` ; revue de lot | L3 |
| **KR-011/111/134** (persistance) | `dossierSessionKey` au registre ; aucun `localStorage` brut en feature (ESLint) | L1 + L3 |
| **KR-112** (400 lignes) | noms `ouvrirSession.ts` réservés à L1 | L1 |
| **KR-117** (registre, jamais un `switch`) | l'oracle balaie `Object.keys(PREDICATES)`, jamais sept littéraux | L1 |
| **KR-197/202** (discriminance par opposition) | critère 1 | L1 |
| **Gardes existantes à ne pas casser** | `expr.test.ts` (deux gardes), `couverture.test.ts:515`, `tourzero.test.ts` (8/8), `controles.test.ts` — **verts sans modification** | L1 |

## 8 — Registre des désaccords

*(Tout `REJETÉ` d'annexe est recopié ici : une note condensée perd les refus motivés, et un `REJETÉ` qui vit dans une annexe n'existe pas pour l'essaim — précédent BUG-082.)*

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| **D-1** | it1 traverse **deux features** hors lot `contrat` — dérogation, ou découpe en deux itérations ? | **RETENU — DÉROGATION NOMMÉE**, bornée à it1 | Les quatre rôles convergent ; la QA a **retiré** sa contradiction au tour 2 (« j'ai confondu "aucun fichier de test" et "aucun instrument" ; la jonction EST testable, et découper la supprimerait »). Un CTA qui n'ouvre rien et un shell atteignable par la seule URL valent zéro tous les deux. Écrite, pas contrebandée |
| **D-2** | Quel amendement de `tourzero.ts` en it1 ? Quatre réponses au tour 1 | **RETENU — voie (β), l'oracle du narratif** : docstring H6 + JSDoc de chaînage, **aucune valeur de cellule**, plus `tourzeroOracle.test.ts` | **MESURE de l'orchestrateur** : la cellule amendée fait rougir `tourzero.test.ts` en `:200` et `:242` et oblige à réécrire `VALEUR_ATTENDUE:106` et `INDECIS` — ce que le critère 3 de la spec interdit mot pour mot. Le tech-lead a **accepté sans réserve** (« j'avais mesuré l'*absence* d'amendement et cité cette mesure pour couvrir sa *présence* : BUG-087 ») et retiré son annexe B ; le PM a retiré son objection 1 ; la QA a retiré sa conclusion |
| **D-2 bis** | Où partent les cellules `lieu_visite` (ii) et `indice_connu` (i) ? | **REPORTÉ — it3, lot `contrat`, les DEUX ensemble** | L'édition de `VALEUR_ATTENDUE` est payée **une fois**. it2 n'a pas de lot `contrat` : l'y mettre en ouvrirait un troisième. **Conséquence à répercuter** : le `goal` d'it2 perd « Tranche la décision (ii) de tourzero.ts », le `goal` d'it3 la gagne, et it3 **est prévenue** qu'elle ouvre un lot `contrat` déjà planifié |
| **D-2 ter** | Le critère 3 de `plan.acceptance_criteria` (« `tourzero.test.ts` reste verte sans avoir été modifiée ») | **RETENU, RÉADRESSÉ** au critère 6 (l'oracle) | Il n'était pas vide, il était **mal adressé** : sous (β) il devient vrai, constatable au diff, et il gagne un instrument au lieu d'un report |
| **D-3** | `'journal[].texte': 'ia'` et `memoire: 'ia'` dans la table d'audience | **REJETÉ — VETO du narratif, dans son domaine, LEVÉ dans le même tour** | Une ligne `ia` est une **autorisation**, pas une prévision ; les lignes de `destinations.ts` se corrigent en commentaire, **jamais en valeur** (KR-195/196, trois corrections datées, zéro valeur changée) — la n°10 la trouverait signée d'avance par l'itération qui n'a ni assembleur, ni borne, ni comportement d'échec. Et `memoire` est typée `null` : une audience pour une valeur qui ne peut pas exister. Le tech-lead a retiré les deux lignes au tour 2. **Pas d'`ESCALADE`** |
| **D-4** | Nom du champ d'inventaire d'`EtatMonde` — les deux rôles ont **échangé** leur position au tour 2 | **RETENU : `objets_possedes`** *(arbitrage de l'orchestrateur, mesuré)* | `predicates.ts` donne un nom `monde.*` **à six prédicats sur sept** (`indices_connus[]`, `jalons_atteints[]`, `lieux_visites[]`, `lieu_courant`, `evenements_consommes[]`, `pnj.<id>.a_dit[]`). Le septième, `possede_objet:49`, n'en donne **aucun** : sa prose désigne « l'inventaire de session — déjà lu par `sessionEngine.filterChoicesByPrereq` », c'est-à-dire l'inventaire de l'**arbre** (`SessionEquipmentState.inventory`), celui qui meurt en it4. Le sens d'écriture registre → type ne s'applique pas là où la source est muette ; restent la forme uniforme des six et l'homonymie mesurée. **L1 corrige la docstring de `predicates.ts:49`** pour qu'elle nomme `monde.objets_possedes[]` |
| **D-5** | Le port de stockage `{ lire, écrire, effacer }` (clause `port_de_stockage`, arbitrage n°24 du cadrage) | **REPORTÉ — it2**, avec son premier appelant | `ouvrirSession` descend dans `brain/dossier/session.ts` (contrainte `expr.test.ts:420`, arbitrage n°5, et condition pour que l'oracle soit vérifiable dans L1 seul) ⟹ **`src/player/` ne reçoit aucun fichier en it1** ⟹ le seul code qui persiste est une **feature**, qui a déjà `PersistenceService` + `dossierSessionKey`. Un port y serait une indirection à un implémenteur et un consommateur. La prémisse mesurée de l'arbitrage n°24 (`persist.ts:4-5` duplique la clé) **n'est pas armée** puisque `persist.ts` n'est pas touché. La session **est** persistée dès it1 : KR-251 garde sa prémisse |
| **D-6** | L'enveloppe `<span title>` dans `EditorTopBar.tsx` — un `<button disabled>` ne déclenche pas son `title` dans Chrome/Safari | **REPORTÉ — raffinage d'it2. Déclencheur : un relevé navigateur consigné (Chrome + Firefox, dossier non jouable, survol du CTA)** | L'UX, **propriétaire du domaine**, l'a elle-même reportée faute d'instrument (« je n'entre pas dans du chrome partagé sur une prémisse que je ne peux pas mesurer ») — jsdom ignore l'infobulle, pas de Playwright. Le tech-lead a **retiré sa D4** et l'acceptait en L1 ; je suis le propriétaire du domaine, pas le retrait de l'opposant : la doctrine maison est « mesure d'abord ». **`EditorTopBar.tsx` n'entre dans aucun lot**, `disabled={!onPreview}` et le `title` sur le bouton restent tels quels, et L2 asserte le `title` **sur le bouton**. Dommage borné : le panneau « Contrôles » porte déjà le constat entier et sa remédiation |
| **D-7** | Le refus sur `MARQUEUR_A_ECRIRE` double-t-il une règle livrée ? (objection PM, **confirmée par mesure** : `controles.ts:168-176` le classe déjà `bloquant`) | **RETENU : une règle, DEUX gardiens** — la branche reste, **un seul texte est atteignable**, aucun critère n'asserte le troisième | `src/player/` est extrait **sans l'éditeur** : dans ce build il n'existe ni `controlerDossier`, ni CTA, ni porte. Sans le refus d'`ouvrirSession`, la surface extraite émettrait `⟨à écrire⟩` **verbatim à un vrai joueur**, sur l'un des deux seuls champs émis mot pour mot. La porte de l'éditeur est **ergonomique**, le refus du moteur est une **correction**. Deux conditions inscrites dans `ouvrirSession` : (a) il est plus **grossier** que le contrôle — un seul champ, **jamais** `PROSES_AMORCE` ni la classification `bloquant`/`alerte` réimplémentées ; (b) `RefusOuverture` reste un registre **clos**. L'UX a retiré son cadrage « deux registres » **pour la règle** ; le PM a retiré son objection **sur la règle** et l'a maintenue **sur le texte**, satisfaite ici |
| **D-8** | Le critère 5 de la spec (replay déterministe) en it1 | **REPORTÉ — it2** | it1 n'a **aucune action** à rejouer et un journal vide : deux initialisations coïncident même sans déterminisme. Le critère épinglerait une coïncidence (BUG-113) |
| **D-9** | Un quatrième lot (le moteur séparé du shell) | **REJETÉ** | Les deux moitiés ne se démontrent pas seules. Fusionner L2 et L3 est refusé symétriquement : cela mettrait un seul agent des deux côtés de la frontière que la dérogation D-1 protège |
| **D-10** | Domicile de `moteurSansIA.test.ts` — `features/moteur-dossier/tests/` ? | **REJETÉ → `features/play-mode/tests/`** | `src/features/moteur-dossier/` ne contient qu'un `specification.json` : une feature réduite à un test est un répertoire fantôme. Et `brain/dossier/` est exclu — le témoin balaie deux répertoires que `brain/` n'a pas le droit de connaître. Raison technique décisive : dans le worktree de L1, son périmètre serait **vide**, et son assertion de non-vacuité le ferait rougir |
| **D-11** | Champs de session refusés (KR-249) | **REJETÉ, propriétaires nommés** | `monde.pnj.<id>.sait` — ni champ ni clé réservée (KR-253, 6ᵉ occurrence de KR-013) → n°14, en **delta** · `memoire.*` (forme interne) → n°10 · **`attente` et sa racine** → n°10/n°11, **avec sa première variante** : une racine `attente: null` rendrait indistinguables « aucune attente » et « variante non supportée » · `heros`, `combat` → n°11, composés dans `src/player/types.ts` · `journal[].deltas` → it3, **optionnel à vie** · toute prose autre que `journal[].texte` → **troisième source de prose**, refusée · une **copie gelée du dossier** dans la session → seconde source de vérité ; le gel est **par référence** (`dossier_id`) · `tour_precedent`, `nb_lieux_visites`, `dernier_jalon`, `est_en_combat` → KR-013 |
| **D-12** | Les clés réservées non racines : `horloge.climat_actif: null` et `pnj.<id>.confiance: null` — les deux rôles ont **échangé** leur position au tour 2 | **REJETÉ — non déclarées**, un commentaire de propriétaire suffit | Argument du narratif contre sa propre position du tour 1, et il est juste : **KR-249 ne réserve que les clés RACINES** ; ni l'une ni l'autre n'en est une. KR-251 rend l'ajout futur optionnel à vie — la réservation n'achète rien qu'un commentaire ne donne, et un `confiance: null` devrait s'écrire sur **chaque** entrée `pnj`, à jamais. `memoire: null` reste réservée : elle **est** une clé racine |
| **D-13** | `lieux_visites` à l'ouverture : `[]` ou `[depart]` ? | **RETENU : `[charpente.depart.lieu_id]`** | Le narratif retire `[]` : c'est un **état incohérent**, pas une décision en attente — (ii) est tranchée au cadrage (arbitrage n°10). Un héros dans un lieu qu'il n'a jamais visité, que l'évaluateur bivalent d'it3 rapporterait fidèlement ; et l'ouverture **décrit** ce lieu verbatim, que `[]` ferait re-décrire comme une découverte au passage suivant |
| **D-14** | Les deux défauts structurels de la table d'audience (trouvés par le narratif au tour 2) | **RETENU** | (1) `feuillesDeLaFixture` ne rend **jamais un objet non vide comme feuille** : sur la fixture saturée, `horloge`, `monde` et `journal` ne sont pas des feuilles → **trois dispenses déclarées**, et **huit lignes de feuille à ajouter** (`horloge.tour` + les sept de `monde`). (2) le walker efface les **indices de tableau**, pas les **clés de `Record`** : `<id>` se normalise **après** son retour, côté test de session |
| **D-15** | La fixture du balayage d'audience | **RETENU : une fixture SATURÉE, écrite à la main** — jamais la session d'ouverture | Une **liste vide est une feuille** : sur une session d'ouverture, le balayage rend `monde.lieux_visites` (sans `[]`) et les lignes en `[]` seraient **mortes le jour même**. Précédent mesuré : `climat[].effets_regles` |
| **D-16** | `graine_alea` écrite en it1, lue par personne avant la n°11 | **RETENU — unique exemption nommée à KR-249** | *Une graine ne se rétro-ajoute pas* : une session née en it1 et reprise sous la n°11 devrait en inventer une en cours de partie, et la promesse de rejeu ne tiendrait jamais pour elle. Deux conditions : paramètre **requis** (pas de défaut qui dérive), et **tirage nommé** — `tirerGraine()`, jamais un `Math.random()` anonyme en ligne, pour que le test du shell le fixe (précédent `combat.ts:107`) |
| **D-17** | La zone `JOURNAL` et son état vide en it1 | **RETENU** (UX tranche, PM accepte) | La règle des états vides ne connaît pas d'exception de calendrier ; l'arbitrage n°27 s'appuie déjà sur cet état vide (« garde l'état vide rédigé par l'UX vivant ») ; c'est l'**anatomie à deux zones** qu'it1 valide ; et rendre un état vide ne demande ni `JournalRow`, ni console |
| **D-18** | `OutcomeBlock` avec un axe de variante `reussite`/`echec`, un `label?` optionnel, ou une valeur en dur | **REJETÉ — veto UX, levé par la signature du § 11** | Le fichier de référence du handoff teinte `--good-bg` / `--bad-bg` — les deux seules couleurs sémantiques, réservées au **jet**. Le texte d'ouverture n'est pas un jet. `entete` est **requis** : optionnel, il laisse la seule prose joueur de l'écran sans rien qui la désigne |
| **D-19** | `src/player/utils/persist.ts` converti en port par it1 | **REJETÉ** (tech-lead, maintenu) | Unique appelant `usePlaySession` (arbre), stocke `SessionState` par `bookId`, ne croise jamais `EtatSession` ; it4 l'orpheline. La duplication KR-134 meurt avec son propriétaire, elle ne se refactore pas deux fois |
| **D-20** | `useOpenDossier` dans le shell | **REJETÉ** | Le dossier est **GELÉ** à l'ouverture (arbitrage n°7) ; s'abonner à `dossier:updated` rouvrirait la porte KR-239 en cours de partie |
| **D-21** | `controlerDossier` appelé depuis `src/player/` ou `brain/dossier/` | **REJETÉ** | Ferait entrer le linter de l'éditeur dans le bundle extractible (§ 6). La porte `jouable` est tenue par la **feature** |
| **D-22** | `genliv:dossier:session:` comme préfixe de clé | **REJETÉ → `genliv:session:dossier:`** | Le namespace `genliv:dossier:` réserve `:` au découpage du **document** et sert de balayage de liste (`DossierService.ts:342`). `DossierService.ts:348` filtre déjà les clés à `:`, mais on ne s'appuie pas sur une garde incidente écrite pour un autre besoin |
| **D-23** | Une famille d'événements `partie:*` | **REJETÉ** (rappel du cadrage, arbitrage n°23) | Zéro abonné externe ; la variante de `Route` en a déjà un, et c'est elle qui monte le shell sans import croisé |
| **D-24** | Modifier `feuilles.ts` pour lui apprendre les clés de `Record` | **REJETÉ** | `couverture.test.ts:515` exige `porteurs === ['feuilles.ts']` — mesuré ROUGE par sonde. La normalisation vit côté test de session |
| **D-25** | `EtatMonde` réduit à `lieu_courant` en it1 au nom de KR-249 | **REJETÉ** | Les six autres champs deviendraient optionnels **à vie** (KR-251), et l'évaluateur bivalent d'it3 hériterait de six branches `undefined` sous un aiguillage qui doit **lever** : « un état bien formé décide les sept prédicats » cesserait d'être représentable. **L'unité d'admission est `monde`, pas ses champs** — exception nommée à KR-249, à mirrorer dans `code-knowledge.json` |

## 9 — Innovation

**Une seule proposition `INNOVATION`, et c'est celle du narratif : une assertion de test écrite pour être SUPPRIMÉE.**

```ts
// sessionCouverture.test.ts
expect(Object.values(DESTINATION_DES_CHAMPS_DE_SESSION).every((d) => d !== 'ia')).toBe(true)
// La n° 10 supprime cette ligne DANS le lot qui livre son assembleur ET sa borne
// de résumé — pas avant, pas séparément. Sa suppression EST la traversée de frontière.
```

- **(a) La règle qu'elle infléchit** — un test du dépôt asserte un invariant **durable** ; celui-ci asserte un état **temporaire**, et sa disparition est le livrable.
- **(b) Ce qu'elle coûte** — une ligne, un commentaire, et le risque qu'une itération future la supprime distraitement au lieu de la supprimer délibérément.
- **(c) Ce qu'on perd sans elle** — la permission d'injecter `journal[].texte` serait acquise **pour toujours** dès it1, signée par l'itération qui n'a ni assembleur, ni granularité par rôle, ni borne, ni comportement d'échec ; et les lignes d'audience, mesuré sur `destinations.ts`, se corrigent en **commentaire**, jamais en **valeur**. C'est la moitié **données** de ce que `moteurSansIA.test.ts` fait côté **code** : un grep ne voit pas une autorisation d'audience, et une autorisation d'audience ne voit pas un `fetch`.

## 10 — Définition de fini

- Prettier → `tsc --noEmit` → ESLint → `jest` **verts**.
- Les **8 critères** du § 6 ont leur témoin écrit et passant.
- Les **4 mutants** du § 6 ont été exécutés, vus **ROUGE**, retirés, et leur rougeur est **consignée dans la revue d'itération**.
- **Verts sans avoir été modifiés**, constatable au diff : `tourzero.test.ts` (8/8), `expr.test.ts` (les deux gardes), `couverture.test.ts:515`, `controles.test.ts`.
- **Mesure préalable exigée de L3 avant de promettre la jonction** : que `<App/>` monte en RTL (10 panneaux, services). S'il ne monte pas, la jonction s'écrit « vérifiée par personne » dans la revue — **jamais contrebandée en vert**.
- **Pas de `npm run test:mutation`** : aucun des 4 fichiers mutés n'est touché. La revue écrit **KR-243 noir sur blanc** — ni la session, ni l'oracle, ni l'évaluateur à venir ne sont dans le périmètre muté ; jest en couverture de lignes est leur unique instrument.
- **À écrire dans la revue comme « vérifié par personne »** : (a) le clic bout-en-bout éditeur → shell, couvert **en deux moitiés** (L2 asserte la navigation, L3 le montage sur la route), jamais en une ; (b) KR-242, reporté it2 ; (c) KR-251, sans témoin possible en it1 ; (d) la branche de refus `ouverture_a_ecrire`, **inatteignable par l'interface** en it1 — elle reste au type et au test unitaire parce que le runtime extrait n'a pas `controlerDossier` ; (e) KR-243.
- **Répercussions hors code, à l'étape 4 des Build Steps** : le `goal` d'it1 perd « port de stockage » et précise « `tourzero.ts` : docstring seule » ; le `goal` d'**it2** perd « Tranche la décision (ii) de tourzero.ts » et gagne le port de stockage ; le `goal` d'**it3** gagne les **deux** cellules et la mention de son lot `contrat` ; le critère 3 de `plan.acceptance_criteria` est réadressé à l'oracle ; le critère 5 est marqué it2 ; un **KR neuf** (« les sept champs d'`EtatMonde` sont requis et totaux dès le premier lot `contrat` — exception nommée à KR-249, l'unité d'admission étant `monde` et non ses champs ») part dans la spec **et** dans `code-knowledge.json`.

## 11 — Signatures

### 11.1 — `src/brain/dossier/session.ts` (L1)

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

export interface EtatPnj {
	readonly a_dit: readonly string[]   // pnj_a_revele — SEUL champ ; `sait` REFUSÉ (KR-253)
	// `confiance` : n° 12, NON DÉCLARÉE — KR-251 la rendra optionnelle à vie le jour venu.
}

/**
 * SEPT CHAMPS, TOUS REQUIS — un par prédicat de PREDICATES, dans l'ordre du
 * registre. La totalité est la PRÉCONDITION de la bivalence d'it3 : six champs
 * optionnels y feraient six branches `undefined` sous un aiguillage qui LÈVE.
 * L'unité d'admission de KR-249 est ici `monde`, pas ses champs.
 */
export interface EtatMonde {
	readonly lieu_courant: string                      // lieu_courant_est — JAMAIS `string | null`
	readonly lieux_visites: readonly string[]          // lieu_visite
	readonly objets_possedes: readonly string[]        // possede_objet — voir § 8, D-4
	readonly indices_connus: readonly string[]         // indice_connu
	readonly jalons_atteints: readonly string[]        // jalon_atteint
	readonly evenements_consommes: readonly string[]   // evenement_consomme
	readonly pnj: Readonly<Record<string, EtatPnj>>    // pnj_a_revele — {} à l'ouverture
}

export interface EtatSession {
	readonly schema: typeof SCHEMA_SESSION
	readonly dossier_id: string
	readonly graine_alea: number
	readonly horloge: { readonly tour: number }   // `climat_actif` : n° 14 (KR-207), NON DÉCLARÉ
	readonly monde: EtatMonde
	readonly journal: readonly EntreeJournal[]
	readonly memoire: null                        // clé racine réservée, n° 10
	// `attente` : NON DÉCLARÉE en it1 — aucune variante n'a de producteur (KR-249).
}

/** Registre CLOS. Tout second membre nomme la donnée qu'il lit. */
export type RefusOuverture = 'ouverture_a_ecrire'

export type ResultatOuverture =
	| { readonly ok: true; readonly session: EtatSession }
	| { readonly ok: false; readonly refus: RefusOuverture }

/**
 * PURE, totale, synchrone. `graine_alea` est REQUISE et INJECTÉE — jamais un
 * `Math.random()` ici (rejouabilité, KR-242).
 *
 * Le refus sur MARQUEUR_A_ECRIRE est plus GROSSIER que `controles.ts`, jamais
 * plus fin : il teste UN champ et ne réimplémente ni PROSES_AMORCE, ni ses
 * quatre proses, ni la classification bloquant/alerte (§ 8, D-7).
 */
export function ouvrirSession(dossier: Dossier, options: { graine_alea: number }): ResultatOuverture
```

**Valeurs à l'ouverture** : `lieu_courant = charpente.depart.lieu_id` · `lieux_visites = [charpente.depart.lieu_id]` · `objets_possedes = []` · `indices_connus = []` · `jalons_atteints = []` · `evenements_consommes = []` · **`pnj = {}`** · `horloge = { tour: 0 }` · `journal = []` · `memoire = null`.

**Trois clauses de docstring, obligatoires :**
1. **`pnj = {}`, jamais une entrée par `monde.personnages[]`** — pré-semer serait une copie dérivée d'une collection du dossier (KR-013). `pnj_a_revele(p, i)` se lit `pnj[p]?.a_dit.includes(i) ?? false` : **clé absente = état légal**, jamais un trou.
2. **`lieu_courant: string`, jamais `string | null`** — un nullable serait une seconde représentation de « partie non ouverte », que la porte `jouable` interdit déjà : état illégal représentable.
3. **`EtatMonde.objets_possedes` est le SEUL inventaire de session.** `SessionEquipmentState.inventory` (`src/player/types.ts:24`) est l'inventaire de la session d'**arbre**, orphelin en it4 : l'itération qui compose un héros (n°11) se repointe ici et n'en redéclare pas un second.

### 11.2 — `src/brain/dossier/sessionDestinations.ts` (L1)

```ts
import type { Destination } from './destinations'   // RÉUTILISÉ — jamais un second vocabulaire
import type { EtatSession } from './session'

type CheminDeFeuilleDeSession =
	| 'horloge.tour'
	| 'monde.lieu_courant'
	| 'monde.lieux_visites[]'
	| 'monde.objets_possedes[]'
	| 'monde.indices_connus[]'
	| 'monde.jalons_atteints[]'
	| 'monde.evenements_consommes[]'
	| 'monde.pnj.<id>.a_dit[]'
	| 'journal[].tour'
	| 'journal[].role'
	| 'journal[].texte'

/**
 * Exhaustive PAR COMPILATION sur les clés racines (`keyof EtatSession`) — propriété
 * strictement plus forte que `destinations.ts`, dont les clés sont des chaînes.
 * JAMAIS fusionnée dans `destinations.ts`, dont la garde balaie une fixture de
 * DOSSIER et ferait rougir une clé de session comme ligne morte.
 */
export const DESTINATION_DES_CHAMPS_DE_SESSION: Readonly<
	Record<keyof EtatSession | CheminDeFeuilleDeSession, Destination>
> = { /* 7 racines + 11 feuilles, TOUTES 'moteur' — voir la table ci-dessous */ }
```

| chemin | `Destination` | motif |
|---|---|---|
| `schema`, `dossier_id`, `graine_alea` | `moteur` | racines **et** feuilles. `graine_alea` injectée, le modèle connaîtrait l'issue d'un jet avant le moteur |
| `horloge`, `monde`, `journal` | `moteur` | **trois dispenses déclarées** : lignes de clé racine, jamais des feuilles — elles existent pour l'exhaustivité par compilation |
| `horloge.tour` | `moteur` | le compte, pas sa paraphrase — précédents `plan_actions[].duree`, `climat[].duree` |
| `monde.lieu_courant` | `moteur` | handle |
| `monde.lieux_visites[]` | `moteur` | handles |
| `monde.objets_possedes[]` | `moteur` | handles. Le modèle ne lit jamais l'inventaire : il reçoit `objets[].description_joueur` (`ia`) de ce que le code a résolu |
| `monde.indices_connus[]` | `moteur` | handles — **et c'est la porte** de `monde.indices[].verite`, `ia` *sous condition d'état* |
| `monde.jalons_atteints[]` | `moteur` | handles — **et c'est la porte** de `charpente.jalons[].enonce_texte`, `ia` pour un jalon **atteint** seulement |
| `monde.evenements_consommes[]` | `moteur` | handles |
| `monde.pnj.<id>.a_dit[]` | `moteur` | handles ; `<id>` normalisé **côté test de session** (§ 8, D-14) |
| `journal[].tour`, `journal[].role` | `moteur` | |
| `journal[].texte` | **`moteur`** | `// n° 10 la bascule à 'ia' DANS le lot qui livre l'assembleur ET la borne de résumé. Avant, c'est une autorisation dormante.` |
| `memoire` | **`moteur`** | `// typée null : un null ne s'injecte pas. n° 10, propriétaire, REMPLACE cette ligne racine par des lignes de FEUILLE.` |

**Ce que cette table donne à la n°10, à écrire en docstring** : deux des quatre champs `ia` *sous condition d'état* de `destinations.ts` reçoivent enfin le **nom du fait de session** qui les ouvre. Les deux autres (`savoirs[].revele_comment`, `plan_actions[].si_bloque`) n'ont **pas** leur porte ici — propriétaires n°12 et n°14.

### 11.3 — `src/brain/Router.ts` et `src/brain/persistenceKeys.ts` (L1)

```ts
export type Route =
	| { name: 'home' }
	| { name: 'editor'; bookId: string }
	| { name: 'dossier'; dossierId: string }
	| { name: 'partie'; dossierId: string }   // `dossierId` et non `id` — KR-167
```

```ts
/**
 * La SESSION d'une partie jouée sur un dossier. NAMESPACE PROPRE, et surtout PAS
 * sous `genliv:dossier:` : ce préfixe-là réserve `:` au découpage du DOCUMENT et
 * sert de balayage de liste (`DossierService.ts:342`). Une session n'est pas une
 * tranche du document.
 */
export const DOSSIER_SESSION_KEY_PREFIX = `${PERSISTENCE_PREFIX}:session:dossier:`
export function dossierSessionKey(dossierId: string): string {
	return `${DOSSIER_SESSION_KEY_PREFIX}${dossierId}`
}
```

**Baril `src/brain/index.ts`** — ajouts, et rien d'autre : `EtatSession`, `EtatMonde`, `EtatPnj`, `EntreeJournal`, `RoleJournal`, `RefusOuverture`, `ResultatOuverture` (types) ; `SCHEMA_SESSION`, `ouvrirSession`, `DOSSIER_SESSION_KEY_PREFIX`, `dossierSessionKey` (valeurs). **Ne pas** ré-exporter `DESTINATION_DES_CHAMPS_DE_SESSION` ni `MARQUEUR_A_ECRIRE`.

### 11.4 — `src/brain/dossier/tourzeroOracle.test.ts` (L1)

Il n'exporte ni ne lit `VALEUR_AU_TOUR_ZERO` (privée) ni `Trivalent` (KR-237 interdit son export). Il passe par la **fonction publique**, deux appels par prédicat balayé depuis `Object.keys(PREDICATES)` (KR-117, jamais sept littéraux) :

```
P = premiereFeuilleVraieAuTourZero(dossier, { op:'predicat', predicat, cibles })
N = premiereFeuilleVraieAuTourZero(dossier, { op:'non', enfant: { op:'predicat', predicat, cibles } })

P ≠ null      → la cellule vaut 'vrai'        → l'état d'ouverture DOIT satisfaire le prédicat
N ≠ null      → la cellule vaut 'faux'        → l'état d'ouverture NE DOIT PAS le satisfaire
P = N = null  → 'indecidable'                 → NON ASSERTÉ (solidité seule, direction sûre)
```

État d'ouverture = `ouvrirSession(dossier-minimal, { graine_alea: 0 })`, même lot, aucune dépendance externe. **Non-vacuité obligatoire** : `≥ 6` cellules assertées (mesuré à 6 — 1 `lieu_courant_est` vrai, 1 objet, 2 indices, 2 `pnj × indice`).

### 11.5 — `src/features/play-mode/` (L3)

```ts
export interface OutcomeBlockProps { entete: string; children: ReactNode }
export interface EcranPartieProps { dossierId: string }
export function tirerGraine(): number            // NOMMÉE — la seule entropie de la feature
export function useSessionPersistee(dossierId: string, session: EtatSession): void
```

`src/App.tsx` : une branche `route.name === 'partie'` → `<EcranPartie key={route.dossierId} dossierId={route.dossierId} />`, importée du baril `'./features/play-mode'` (créé par le lot). `src/EditorScreen.tsx:4` continue d'importer `PlayerModal` en profondeur — **on ne le touche pas**.
