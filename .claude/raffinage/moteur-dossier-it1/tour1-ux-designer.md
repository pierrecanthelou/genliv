# Tour 1 — UX Designer — `moteur-dossier` it1

**RISQUE** — `OutcomeBlock` est le seul composant neuf, et le fichier de référence `design_handoff_gamebook_editor/components/surfaces/OutcomeBlock.jsx` l'a écrit **pour les jets seulement** : deux variantes teintées `--good-bg` / `--bad-bg`, en-tête « ✓ / ✕ », corps en `--fs-sm`, et un `fontSize: '8.5px'` **en dur**. Recopié tel quel, il peint la première scène du livre en vert : usage décoratif d'une des deux couleurs sémantiques, réservées à réussite/échec de jet. C'est la faute la plus probable de l'itération — le fichier existe et invite à la copie.

**OBJECTION 1 (veto si non corrigé)** — l'`OutcomeBlock` d'it1 naît **neutre et sans axe de variante** : `--surface-card` / `--border-card`. Pas de prop `variant` à un seul membre, pas de branches `reussite`/`echec` mortes ; elles entrent avec leur premier appelant (n°11). Aucune valeur en dur : `--fs-eyebrow`, jamais `8.5px`.

**OBJECTION 2 (forte, non veto)** — un `<button disabled>` **ne déclenche pas son `title`** dans Chrome/Safari : la formule KR-245, soignée, serait invisible exactement quand elle sert. jsdom ne peut pas le mesurer — un essai navigateur de dix secondes tranche, et si la bulle s'affiche j'abandonne l'objection. Sinon : `title` porté par un `<span>` enveloppant dans `EditorTopBar` (lot `contrat`, fichier `brain/`), le bouton reste `disabled` et non cliquable (arbitrage n°30 intact).

**PROPOSITION** — contrat de design complet en annexe ; **7(b) tranché : on rend la zone journal avec son état vide dès it1**, texte de la clause `console_registre_clos` **mot pour mot, inchangé en it2**.

**VERDICT** — **recevable sous réserve** des deux objections.

---

# ANNEXE — Contrat de design, it1

Jetons lus dans `src/styles/tokens/{colors,typography,spacing}.css`.

## A. Le CTA « Aperçu du jeu » — `src/features/bascule-editeur/components/DossierEditorScreen.tsx`

1. **Supprimer** `RAISON_APERCU_DESACTIVE` (lignes 81-82) — meurt avec son unique usage.
2. La ligne 141 appelle déjà `controlerDossier(dossier)` **en ligne, à chaque rendu**. On élargit sa déstructuration, on n'ajoute **aucun** `useMemo`, **aucun** `useEffect`, **aucun** second appel (KR-245, KR-013/113) :

```ts
const { parSection, controles, jouable } = controlerDossier(dossier)

// Le TEXTE seul est dérivé ici. `jouable` reste la PORTE, et n'est jamais
// recalculé en « aucun bloquant » : controles.ts dit qu'il se dérive
// « ICI ET NULLE PART AILLEURS » (KR-013).
const bloquants = controles.filter((c) => c.niveau === 'bloquant')
const premierBloquant = bloquants[0]
const raisonApercu =
	premierBloquant === undefined
		? undefined
		: bloquants.length === 1
			? premierBloquant.message
			: `${premierBloquant.message} (et ${bloquants.length - 1} de plus)`
```

3. Props passées à `EditorTopBar` :

```tsx
onPreview={jouable ? () => router.navigate({ name: 'partie', dossierId }) : undefined}
previewDisabledReason={raisonApercu}
```

**Composition du suffixe — exacte.** `message` + **une** espace + `(et {n} de plus)`, `n = bloquants.length - 1`, suffixe **absent** si `n === 0`. Aucune ponctuation ajoutée. « de plus » est invariable — **ne pas** appeler `plural`.

**Rendu exact, dossier fraîchement créé** (seul `texte_ouverture_joueur` est `bloquant` parmi les quatre proses d'amorce ; les trois autres sont `alerte`) :

> `Ce texte porte encore le marqueur ⟨à écrire⟩ : le moteur le lira au joueur mot pour mot, marqueur compris.`

**Rendu exact avec trois bloquants** :

> `Ce texte porte encore le marqueur ⟨à écrire⟩ : le moteur le lira au joueur mot pour mot, marqueur compris. (et 2 de plus)`

**Une fois `jouable === true`** : `raisonApercu` vaut `undefined`, `onPreview` est fourni, `EditorTopBar` rend déjà `title="Aperçu du jeu"`, `color: var(--text-body)`, `cursor: pointer`. **Aucune ligne de style d'`EditorTopBar` ne change en it1** — pas d'accent sur ce bouton.

**État inatteignable, à ne pas garnir** : `jouable === false` avec `raisonApercu === undefined` n'existe pas — `jouable` **est** « aucun bloquant ». N'écris pas de cinquième chaîne de repli.

**§ A bis — objection 2, la forme du correctif** (si l'essai navigateur confirme que la bulle n'apparaît pas), dans `src/brain/components/EditorTopBar.tsx`, lot `contrat` : un `<span title={onPreview ? undefined : previewDisabledReason} style={{ display: 'inline-flex' }}>` enveloppe le bouton, qui garde `disabled` et perd son propre `title` dans l'état désactivé (arbitrage n°30 intact : toujours pas actionnable). Sans enveloppe : garder l'attribut `title` sur le bouton tel quel — la QA l'assertera de toute façon sur l'attribut.

## B. Le shell de partie — `src/features/play-mode/components/EcranPartie.tsx` (NEUF)

Référence d'anatomie : `PlayerModal.tsx` (même répertoire), **reprise et non importée**.

**Différence structurelle à écrire dans la docstring** : `PlayerModal` est une **modale** (`role="dialog"`, `aria-modal`, superposée). Le shell d'it1 est une **route** rendue par `App.tsx` : c'est une **page**, donc `<main>`, **ni** `role="dialog"`, **ni** `aria-modal`, **ni** `--shadow-modal`. La règle « le focus revient au déclencheur à la fermeture » ne s'applique pas — ce n'est pas une fermeture, c'est une navigation.

```
<main aria-label="Aperçu du jeu">          racine
├── <header>                               chrome
│   ├── <span> mono : « Aperçu du jeu »  ·  {dossier.titre}
│   └── <button> : « ✕ Quitter le test »
└── <div> corps défilant
    └── <div> colonne de lecture
        ├── OutcomeBlock (§ D)   ← la bannière d'ouverture
        └── <section> Journal (§ E)
```

| Emplacement | Texte exact | Registre |
|---|---|---|
| `aria-label` de `<main>` | `Aperçu du jeu` | auteur |
| Header, gauche (mono) | `Aperçu du jeu` puis ` · ` puis `{dossier.titre}` | auteur |
| Header, droite | `✕ Quitter le test` | auteur |
| `aria-label` du bouton de sortie | `Quitter le test` (sans le glyphe) | auteur |

Le libellé de sortie est **celui que la clause `surface` du `design_contract` a déjà écrit** — ne pas le réécrire en « Quitter la partie ».

```ts
const racine: CSSProperties = {
	display: 'flex', flexDirection: 'column', height: '100vh',
	background: 'var(--surface-app)',
}
const entete: CSSProperties = {              // calqué sur PlayerModal.tsx:43-53
	display: 'flex', alignItems: 'center', justifyContent: 'space-between',
	padding: 'var(--space-3) var(--space-7)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
	background: 'var(--surface-card)', flexShrink: 0,
}
const titreEntete: CSSProperties = {
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-label)',
}
const titreDossier: CSSProperties = { color: 'var(--text-strong)' }   // le ` · {titre}`
const boutonSortie: CSSProperties = {        // calqué sur PlayerModal.tsx:74-85
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
	padding: 'var(--space-2) var(--space-5)', borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--border-card)', background: 'transparent',
	color: 'var(--text-label)', cursor: 'pointer', minHeight: 'var(--hit-target)',
}
const corps: CSSProperties = {
	flex: 1, minHeight: 0, overflowY: 'auto',
	padding: 'var(--space-12)', boxSizing: 'border-box',
}
const colonneLecture: CSSProperties = {
	maxWidth: 640, margin: '0 auto',
	display: 'flex', flexDirection: 'column', gap: 'var(--space-9)',
}
```

**États** : défaut = ci-dessus. Survol du bouton de sortie en CSS seul (**jamais un état `isHovered` en React**). Sélectionné : sans objet. Erreur : § C. Chargement : **aucun** — `DossierService.get` est synchrone, n'invente pas de spinner.

## C. L'écran de refus (porte `jouable` re-vérifiée au montage)

Rendu **à la place de la colonne de lecture**, le header restant identique (l'auteur doit pouvoir sortir).

```
<section> bloc de refus
├── <span aria-hidden> ⊘          glyphe (DS : « prérequis non satisfait »)
├── <h2> « La partie ne peut pas s'ouvrir »
├── <p>  {texte du code de refus}
└── <button> « ← Revenir à l'éditeur »
```

**Table des textes — close, une entrée par code, aucune prose libre :**

| Code de refus | Texte exact, mot pour mot |
|---|---|
| `dossier_non_jouable` | `Ce dossier porte encore un contrôle bloquant. Ouvrez « Contrôles » dans l'éditeur pour voir lequel.` |
| `ouverture_a_ecrire` | `Le texte d'ouverture porte encore le marqueur {MARQUEUR_A_ECRIRE} — le moteur le lirait au joueur mot pour mot. Rédigez-le dans DÉPART · TEXTE D'OUVERTURE.` |

- **Le marqueur se compose, il ne se recopie pas** : `import { MARQUEUR_A_ECRIRE }`, gabarit comme `AMORCE` le fait déjà (`amorce.ts:54-59`). Le glyphe tapé en dur serait une seconde source de vérité.
- **Ce texte n'est pas le `Controle.message`** et ne le paraphrase pas : le contrôle dit *ce qui ne va pas* à l'auteur qui édite ; celui-ci dit *pourquoi la partie refuse* + *où aller*. La **formule** du § A reste dans `DossierEditorScreen.tsx` et **n'est pas recopiée dans le shell** — deux features, un seul propriétaire du texte.

```ts
const blocRefus: CSSProperties = {
	display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)', background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)', maxWidth: 480, margin: '0 auto',
}
const glypheRefus: CSSProperties = { fontSize: 'var(--fs-h1)', color: 'var(--text-faint)', lineHeight: 1 }
const titreRefus: CSSProperties = {
	margin: 0, fontSize: 'var(--fs-title)', fontWeight: 'var(--fw-semibold)',
	letterSpacing: 'var(--track-tight)', color: 'var(--text-strong)',
}
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

L'accent est légitime ici : **unique action de l'écran**, donc action primaire. Glyphe `⊘` (« prérequis non satisfait »), pas `⚠` (pris par les avertissements de `PlayerModal`), pas d'emoji, pas de SVG.

## D. `OutcomeBlock` — `src/features/play-mode/components/OutcomeBlock.tsx` (NEUF)

**Pas** dans `brain/components/` (KR-109, arbitrage n°36). Nom conservé (arbitrage n°25).

```ts
export interface OutcomeBlockProps {
	/** Libellé mono MAJUSCULES — REGISTRE AUTEUR, il désigne la prose sans en faire partie. */
	entete: string
	/** La prose du dossier, rendue VERBATIM. Jamais transformée, jamais tronquée. */
	children: ReactNode
}
```

**Pas de prop `variant` en it1, et c'est délibéré.** Le composant du handoff porte `success` / `failure` teintés `--good-bg` / `--bad-bg` : les **deux seules couleurs sémantiques du projet**, réservées à la réussite et à l'échec d'un **jet**. Le texte d'ouverture n'est pas un jet. Une union à un seul membre, ou deux branches sans appelant, serait du code mort teinté d'avance : l'axe de variante entre avec son premier appelant de jet (n°11), exactement comme `JournalRow` attend it2. **Docstring obligatoire** disant cette phrase.

```ts
const bloc: CSSProperties = {
	border: 'var(--bw-hair) solid var(--border-card)',
	background: 'var(--surface-card)',
	borderRadius: 'var(--r-lg)',       // « outcome blocks » — spacing.css:27
	padding: 'var(--space-7)',
}
const entete: CSSProperties = {
	display: 'block', marginBottom: 'var(--space-2)',
	fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow-wide)', color: 'var(--text-label)',
}
const prose: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-row)',
	lineHeight: 'var(--lh-loose)', color: 'var(--text-strong)',
	whiteSpace: 'pre-wrap',
}
```

- **`whiteSpace: 'pre-wrap'` est une exigence de « verbatim »**, pas une préférence : les retours de paragraphe tapés par l'auteur doivent survivre au rendu, sinon « mot pour mot » est faux dès le premier alinéa.
- **`--fs-row` (13,5 px), pas `--fs-sm` (11 px)** comme dans le fichier de référence : c'est la seule prose littéraire de l'écran. `--text-strong`, pas `--text-body` : c'est le contenu principal.
- **`8.5px` du fichier de référence est refusé** — `--fs-eyebrow`.

Appel dans le shell, en-tête exact :

```tsx
<OutcomeBlock entete="OUVERTURE — lue au joueur, mot pour mot">
	{dossier.charpente.depart.texte_ouverture_joueur}
</OutcomeBlock>
```

L'en-tête est en **registre auteur** (mono, MAJUSCULES, calqué sur `location` de `controles.ts:173`). C'est lui qui empêche les registres de se mélanger : le chrome nomme la prose, la prose reste intacte.

## E. La zone journal — arbitrage 7(b)

### E.1 Tranché : **on rend la zone, avec son état vide, dès it1.**

1. **La règle projet ne connaît pas d'exception de calendrier** — une liste vide *parce que la feature n'est pas finie* reste une liste vide. Ne rien rendre, c'est livrer le vide muet que la règle interdit.
2. **L'arbitrage n°27 s'y appuie déjà** : son motif écrit est que l'ouverture en bannière « garde l'état vide rédigé par l'UX vivant ». Cet état vide est donc un livrable d'it1 ; la clause `console_registre_clos` se trouve seulement être l'endroit où sa phrase a été écrite. Le texte appartient au **journal**, pas à la console.
3. **C'est l'anatomie à deux zones qu'it1 valide**, pas la bannière seule. Sans la zone, it1 rend un bloc flottant et it2 doit inventer la mise en page — donc la refaire.
4. **Aucune dépendance avant** : `session.journal.length === 0` suffit, et `EtatSession.journal` est figé par le lot `contrat` d'it1.

### E.2 Texte, mot pour mot — repris tel quel de `console_registre_clos`, inchangé en it2

> `Aucun évènement pour l'instant — vos actions y apparaîtront.`

Il est au **futur** : il reste vrai en it1, où l'auteur ne peut encore rien faire, et en it2, où il le peut. Ne pas écrire un texte transitoire pour it1 — deux textes pour un état, c'est le début d'une divergence. Forme maison `Aucun X — <invitation>.` (`PanneauObjets.tsx:56`, `PanneauControles.tsx:21`, `FicheEvenement.tsx:53`). Constante `TEXTE_JOURNAL_VIDE`.

**Libellé de la zone** : `JOURNAL` — un mot, mono, MAJUSCULES, symétrique de `CONSOLE`. Jamais « Journal de la partie » ni « Historique », qui glisseraient vers le registre joueur.

### E.3 Jetons

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

**Les deux seuls nombres bruts de tout ce contrat** : `maxWidth: 640` (colonne de lecture) et `maxWidth: 480` (blocs vide/refus). Ce sont des **mesures de ligne**, et le système n'a pas de jeton de mesure — précédent au dépôt, `PanneauControles.tsx:77`. Aucune couleur, aucun rayon, aucun espacement, aucune taille de texte n'est en dur. Glyphe `⬚` du DS, déjà employé par `PanneauControles`.

## F. Clavier — ergonomie de rédaction

| Geste | Comportement | Où |
|---|---|---|
| `Échap` | quitte la partie → `router.navigate({ name: 'dossier', dossierId })` | shell **et** écran de refus, même destination |
| `Tab` | atteint `✕ Quitter le test` — **unique focusable du shell en it1** ; sur l'écran de refus : sortie puis `← Revenir à l'éditeur`, dans l'ordre visuel | — |
| `Entrée` / `Espace` | active le bouton focalisé (natif, `<button type="button">`) | — |

- **Écouteur `Échap`** : sur `document`, avec `useRef` sur le rappel + nettoyage dans le `useEffect` — recopier exactement `PlayerModal.tsx:18-27` (motif maison anti-closure périmée, KR-004).
- **Aucun focus impératif au montage, aucun piège à focus.** Ce n'est pas une modale.
- **Pas de restauration de focus au retour** : la route démonte le déclencheur. Ce n'est pas une omission, c'est la conséquence d'une navigation.
- **Note transmise à it2, à ne pas traiter en it1** : quand la console portera un `Field`, `Échap` devra **d'abord vider la saisie** et ne quitter que sur champ vide — sinon l'auteur perd sa partie en effaçant une coquille.

## G. Avis sur 7(a) — hors mon veto

**Dérogation nommée, pas découpe.** Le CTA et l'écran qu'il ouvre sont **un seul geste d'auteur**, et les séparer produit deux moitiés dont chacune ment. Un bouton qui s'allume et ne mène nulle part est une affordance mensongère — la même faute que l'état vide muet, à l'envers. Un écran sans porte d'entrée n'est atteignable qu'en tapant une URL, donc non démontrable. Le coût réel côté `bascule-editeur` est de **trois lignes dans un fichier**. Le signal de coupe de la skill vise les itérations qui *gonflent*, pas celle-ci.

## H. Les trois registres sur cet écran — table de contrôle

| Registre | Où, exactement | Forme | Faute à guetter |
|---|---|---|---|
| **Auteur** | header, `✕ Quitter le test`, en-tête `OUVERTURE — lue au joueur, mot pour mot`, libellé `JOURNAL`, écran de refus, `title` du CTA | mono MAJUSCULES pour les libellés, phrases fonctionnelles pour le reste | tutoyer, expliquer, faire des phrases |
| **Joueur** | **un seul nœud de tout l'écran** : les enfants de l'`OutcomeBlock` | verbatim, intouché, `pre-wrap` | tronquer, préfixer, « habiller » (arbitrage n°28) |
| **Développeur-débogueur** | **absent en it1** — arrive en it2 avec `CONSOLE` et `JournalRow` | mono, identifiants | faire fuiter un identifiant dans la bannière ou un texte de refus |

`lieu_courant = charpente.depart.lieu_id` est un **identifiant** : il n'apparaît **nulle part** à l'écran en it1. Le pas de côté le plus probable de l'essaim est d'afficher « Lieu : lieu.val-cendre » sous la bannière « pour montrer que ça marche » — c'est le registre développeur dans la zone joueur, et le test doit le lire dans l'état de session, pas dans le DOM.

## I. Ce que l'écran d'it1 ne rend PAS (garde anti-décoration)

Ni horloge / n° de tour, ni PV/PE, ni nom de lieu, ni barre de héros, ni bouton d'action, ni console, ni ligne de journal, ni animation d'entrée, ni ombre (le shell est une page : `--shadow-*` est réservé aux menus et modales), ni compteur d'avertissements.
