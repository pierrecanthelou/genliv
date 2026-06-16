import { type ReactNode } from 'react'

/** Mono uppercase section label used across the node-editor panel sections. */
export interface SectionLabelProps {
	children: ReactNode
	/** Faint trailing qualifier (e.g. « — bouton dans l'écran parent »). */
	hint?: string
}

export function SectionLabel({ children, hint }: SectionLabelProps): JSX.Element {
	return (
		<div
			style={{
				fontFamily: 'var(--font-mono)',
				fontSize: 'var(--fs-eyebrow)',
				letterSpacing: 'var(--track-eyebrow)',
				textTransform: 'uppercase',
				color: 'var(--text-muted)',
				fontWeight: 'var(--fw-semibold)',
				marginBottom: 'var(--space-3)',
			}}
		>
			{children}
			{hint && <span style={{ color: 'var(--ink-6)', fontWeight: 'var(--fw-regular)' }}> {hint}</span>}
		</div>
	)
}
