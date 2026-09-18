import type { CSSProperties } from 'react'

/**
 * Les styles du panneau Copilote — module de CONSTANTES, pas un composant.
 * Déplacés SANS MODIFICATION DE VALEUR depuis `PanneauCopilote.tsx` (itération
 * 1, l. 316-421), plus les styles propres à `LigneDetenteur` (itération 2).
 * Jetons du § 3.1 du plan d'itération 2 uniquement — aucun jeton neuf, aucune
 * valeur en dur.
 */

export const pageStyle: CSSProperties = {
	flex: 1,
	minHeight: 0,
	boxSizing: 'border-box',
	overflowY: 'auto',
	padding: 'var(--space-12)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-8)',
}

export const carteStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

// Absorbe l'ancien `enTeteBientotStyle` : rangée eyebrow+titre à gauche, badge
// optionnel à droite — un seul enfant (sans badge) n'en change pas le rendu.
export const enTeteStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'flex-start',
	justifyContent: 'space-between',
	gap: 'var(--space-3)',
}

export const eyebrowStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 4,
}

export const titreStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}

export const corpsStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
}

export const ligneLancerStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	flexWrap: 'wrap',
	gap: 'var(--space-4)',
}

// Jetons --space-* restreints à ceux déjà employés par `PanneauControles`
// (§ 3.1 : `--space-1/3/4/8/10/12`) — aucune valeur d'échelle neuve introduite.
export const boutonBase: CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-3) var(--space-8)',
	borderRadius: 'var(--r-md)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	fontWeight: 'var(--fw-semibold)',
}

// Un « Lancer » désactivé n'est JAMAIS accent-teinté (§ 3.1, littéral).
export const lancerDesactiveStyle: CSSProperties = {
	...boutonBase,
	background: 'var(--surface-sunken)',
	color: 'var(--text-disabled)',
	border: '1px solid var(--border-field)',
	cursor: 'not-allowed',
}

export const lancerActifStyle: CSSProperties = {
	...boutonBase,
	background: 'var(--accent)',
	color: 'var(--text-on-accent)',
	border: 'none',
	cursor: 'pointer',
}

export const chargementStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-4)',
}

// Ton NEUTRE, littéral (§ 3.5 de l'it1).
export const annulerStyle: CSSProperties = {
	...boutonBase,
	fontWeight: 'var(--fw-regular)',
	color: 'var(--text-body)',
	border: '1px solid var(--border-card)',
	background: 'var(--surface-card)',
	cursor: 'pointer',
}

export const refusSyncStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)',
}

// Mentions permanentes (§ 3.2, points 2 et 6) — même style que `refusSyncStyle`
// mais nommé séparément : ce ne sont pas des refus.
export const mentionStyle: CSSProperties = {
	...corpsStyle,
	color: 'var(--text-muted)',
}

// La ligne de contexte (§ 3.2, point 4) : un `Badge` de niveau + le message du
// linter, côte à côte.
export const ligneContexteStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-3)',
}

// ── `LigneDetenteur` (itération 2) — sœur de `LigneProposition`, MÊMES jetons
// (`--text-body` pour le lien, `--hit-target` pour les boutons, § 3.4).

export const listeDetenteursStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
}

// Le filet séparateur entre deux `LigneDetenteur` (§ 3.2, point 8) : posé par
// le conteneur de liste sur chaque ligne SAUF la première.
export const separateurLigneStyle: CSSProperties = {
	borderTop: '1px solid var(--border-rule)',
	marginTop: 'var(--space-3)',
	paddingTop: 'var(--space-3)',
}

export const ligneDetenteurStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 'var(--space-4)',
	minHeight: 'var(--hit-target)',
}

export const designationDetenteurStyle: CSSProperties = {
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
}

export const actionsDetenteurStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	gap: 'var(--space-3)',
}

// Navigation SECONDAIRE, même motif que `LigneProposition.lienStyle` : jamais
// accent.
export const lienDetenteurStyle: CSSProperties = {
	border: 'none',
	background: 'none',
	padding: 0,
	minHeight: 'var(--hit-target)',
	display: 'inline-flex',
	alignItems: 'center',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	cursor: 'pointer',
}

// ── `LigneReplique` / `CarteFaireParler` (itération 3a) — jetons du § 3.1 du
// plan UNIQUEMENT (`--border-field`, `--r-md`, `--surface-inset`, `--text-body`,
// `--text-muted`, `--font-ui`, `--font-mono`, `--fs-body`, `--space-3/4/8`,
// `--hit-target`) : aucun jeton neuf.

export const conteneurRepliqueStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

// Le bloc de lecture (§ 3.3) — un `<div>`, PAS un `Field` — partagé par
// `LigneReplique` et par le bloc « DÉJÀ ÉCRIT » de `CarteFaireParler` : même
// anatomie qu'une réplique déjà écrite ou proposée, lue et non éditée.
export const blocLectureRepliqueStyle: CSSProperties = {
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-inset)',
	padding: 'var(--space-3) var(--space-4)',
	color: 'var(--text-body)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	whiteSpace: 'pre-wrap',
}

export const listeDejaEcritStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

// « + » désactivé au plafond (§ 3.3) : `IconButton` n'a pas de prop `disabled`
// (précédent `dossier-objets`, § 8 désaccord n° 9 de l'itération 1 de cette
// feature) — bouton natif composé LOCALEMENT plutôt que la primitive partagée
// (KR-109 : on ne la modifie pas pour un seul appelant). Teinte muette avec
// les jetons du § 3.1, jamais ceux de désactivation de `BarreLancer`
// (`--text-disabled`/`--surface-sunken`, hors liste).
export const accepterRepliqueDesactiveStyle: CSSProperties = {
	width: 'var(--hit-target)',
	height: 'var(--hit-target)',
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)',
	border: '1px solid var(--border-field)',
	background: 'var(--surface-inset)',
	borderRadius: 'var(--r-md)',
	cursor: 'not-allowed',
	padding: 0,
}
