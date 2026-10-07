import type { CSSProperties } from 'react'

/**
 * Style bouton secondaire — utilisé pour « ↪ Rejouer — mêmes dés »
 * sur EcranFin et EcranMort.
 * Tokens uniquement, pas de :hover (CSSProperties ne le permet pas).
 */
export const boutonSecondaire: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-3) var(--space-5)',
	borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--border-field)',
	background: 'var(--surface-card)',
	color: 'var(--text-strong)',
	fontWeight: 'var(--fw-semibold)',
	minHeight: 'var(--hit-target)',
	cursor: 'pointer',
}
