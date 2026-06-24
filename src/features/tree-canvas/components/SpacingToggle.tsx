import type { JSX } from 'react'
import { useBrain, useBookLayoutSpacing, type LayoutSpacing } from '../../../brain'

/**
 * Toggle between compact and spacious canvas layout. Persisted per book via
 * UIPreferencesService so it survives reload (same pattern as view-mode).
 */
export function SpacingToggle({ bookId }: { bookId: string }): JSX.Element {
	const { uiPreferences } = useBrain()
	const spacing = useBookLayoutSpacing(bookId)

	function handleToggle(): void {
		const next: LayoutSpacing = spacing === 'compact' ? 'spacious' : 'compact'
		uiPreferences.setLayoutSpacing(bookId, next)
	}

	return (
		<button
			type="button"
			onClick={handleToggle}
			title={spacing === 'compact' ? 'Passer en vue aérée' : 'Passer en vue compacte'}
			aria-pressed={spacing === 'spacious'}
			style={{
				fontFamily: 'var(--font-mono)',
				fontSize: 'var(--fs-meta)',
				borderRadius: 'var(--r-md)',
				padding: '8px 12px',
				minHeight: 'var(--hit-target)',
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				cursor: 'pointer',
				color: spacing === 'spacious' ? 'var(--accent)' : 'var(--text-label)',
				border: spacing === 'spacious' ? '1px solid var(--accent)' : '1px solid var(--border-card)',
				background: spacing === 'spacious' ? 'var(--accent-bg)' : 'var(--surface-card)',
			}}
		>
			<span aria-hidden="true">{spacing === 'compact' ? '⊟' : '⊞'}</span>
			{spacing === 'compact' ? 'Aérer' : 'Compacter'}
		</button>
	)
}
