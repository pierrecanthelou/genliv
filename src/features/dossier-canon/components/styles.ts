import type { CSSProperties } from 'react'

/**
 * Les tokens de style du panneau Lieux — extraits de `PanneauLieux.tsx`
 * (§5 du plan d'itération 5, scission KR-112 : le panneau + ses trois
 * nouveaux gestionnaires d'accès franchissaient le signal de 400 lignes).
 * Recopiés À L'IDENTIQUE — aucune valeur recréée, aucun token changé.
 *
 * Copie LOCALE à `dossier-canon`, jamais partagée par import avec
 * `dossier-registres/components/styles.ts` (même doctrine que ce précédent :
 * chaque feature garde sa propre copie de ses tokens de style — pas
 * d'abstraction `brain/` pour de simples objets de style).
 */

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
