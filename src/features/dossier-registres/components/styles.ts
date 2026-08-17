import type { CSSProperties } from 'react'

/**
 * Les tokens de style de `dossier-registres` — DEUX précédents directs recopiés
 * à l'identique, jamais partagés par import (chaque feature garde sa propre
 * copie, précédent `dossier-objets/components/styles.ts` face à
 * `dossier-fiches/components/styles.ts`, aucune promotion `brain/` pour de
 * simples objets de style) :
 *  · le gabarit liste-à-gauche/fiche-à-droite de `dossier-objets` (Panneau) ;
 *  · le gabarit ligne-répétée-bordée de `dossier-fiches` (section « MÈNE À »).
 */

// ── Panneau : deux colonnes, liste à gauche, fiche à droite ────────────────
export const pageStyle: CSSProperties = {
	flex: 1,
	minHeight: 0,
	boxSizing: 'border-box',
	display: 'flex',
	gap: 'var(--space-8)',
	padding: 'var(--space-8)',
	overflowY: 'auto',
}

export const colonneListeStyle: CSSProperties = {
	width: 320,
	flexShrink: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

export const colonneFicheStyle: CSSProperties = {
	flex: 1,
	minWidth: 0,
}

export const eyebrowStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 'var(--space-2)',
}

export const listeStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	margin: 0,
	padding: 0,
	listStyle: 'none',
}

// Chaque `<li>` : la `ListRow` (flex:1, minWidth:0 — voir `ligneListRowStyle`)
// suivie des boutons Monter/Descendre, FRÈRES et hors du `<button>` de
// `ListRow` (précédent `dossier-objets`, désaccord 3 de son plan d'itération 1).
export const ligneListeStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
}

// `ListRow` n'accepte ni `style` ni `className` (contrat `brain/` figé) : cette
// enveloppe lui donne `flex:1, minWidth:0` sans toucher `ListRow.tsx`.
export const ligneListRowStyle: CSSProperties = {
	flex: 1,
	minWidth: 0,
}

export const boutonAjouterStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	boxSizing: 'border-box',
	minHeight: 'var(--hit-target)',
	padding: '7px 10px',
	border: '1.5px dashed var(--accent)',
	borderRadius: 'var(--r-md)',
	background: 'var(--accent-bg)',
	color: 'var(--accent)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
}

export const emptyStateStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--surface-inset)',
	padding: 'var(--space-10) var(--space-8)',
	maxWidth: 480,
	margin: 'auto',
}

export const emptyGlyphStyle: CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

export const emptyTextStyle: CSSProperties = {
	margin: 0,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}

// ── Fiche : les champs, le pied, le bandeau de refus ────────────────────────
export const champsStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-6)',
}

export const bandeauRefusStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

export const eyebrowRefusStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--bad)',
	letterSpacing: 'var(--track-eyebrow)',
}

export const texteAbsentStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
}

// ── Section « MÈNE À » : légende + lignes répétées ──────────────────────────
export const legendeStyle: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

export const listeLignesStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	marginTop: 'var(--space-3)',
}

export const enTeteLigneStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 'var(--space-3)',
}
