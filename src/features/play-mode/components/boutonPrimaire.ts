import type { CSSProperties } from 'react'

/**
 * Style accent partagé par `EcranRefus` et `EcranReprise` — deux appelants nommés.
 * Aucun composant maison, juste les props du bouton.
 */
export const boutonPrimaire: CSSProperties = {
	marginTop: 'var(--space-3)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-3) var(--space-5)',
	borderRadius: 'var(--r-md)',
	border: '1px solid var(--accent)',
	background: 'var(--accent)',
	color: 'var(--text-on-accent)',
	fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}
