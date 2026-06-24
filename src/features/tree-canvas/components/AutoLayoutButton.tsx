import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useBrain } from '../../../brain'

const STATUS_TIMEOUT_MS = 3000

/**
 * « Réorganiser » — clears all manually-dragged node positions for the current
 * book (UIPreferences overrides) so the Dagre auto-layout takes full effect.
 * Shown in the editor top bar while the canvas view is active.
 */
export function AutoLayoutButton({ bookId }: { bookId: string }): JSX.Element {
	const { uiPreferences } = useBrain()
	const [done, setDone] = useState(false)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) clearTimeout(timerRef.current)
		}
	}, [])

	function handleReset(): void {
		uiPreferences.clearNodePositions(bookId)
		setDone(true)
		if (timerRef.current !== null) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => setDone(false), STATUS_TIMEOUT_MS)
	}

	return (
		<span style={wrap}>
			<button type="button" onClick={handleReset} style={button} title="Réinitialiser la mise en page automatique">
				<span aria-hidden="true">⊞</span> Réorganiser
			</button>
			{done && (
				<span role="status" style={status}>
					✓ Réorganisé
				</span>
			)}
		</span>
	)
}

const wrap: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
}

const button: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	borderRadius: 'var(--r-md)',
	padding: '8px 12px',
	minHeight: 'var(--hit-target)',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 6,
	cursor: 'pointer',
	color: 'var(--text-label)',
	border: '1px solid var(--border-card)',
	background: 'var(--surface-card)',
}

const status: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--good)',
	whiteSpace: 'nowrap',
}
