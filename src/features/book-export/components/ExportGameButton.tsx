import { useEffect, useRef, useState } from 'react'
import { plural } from '../../../brain'
import { useExportBook, type ExportResult } from '../hooks/useExportBook'

/** How long the transient post-export status stays visible before auto-hiding. */
const STATUS_TIMEOUT_MS = 6000

/**
 * « Exporter le jeu ⬇ » — the book-export trigger, mounted into the editor top
 * bar's generic `actions` slot by the editor shell (the feature never imports the
 * bar, KR-109). Clicking builds + downloads the play file and shows a transient
 * status beside the button: « ✓ Export réussi » or « ⚠ N avertissement(s) » when
 * dangling references were surfaced (KR-021) — non-blocking (user decision). The
 * status auto-hides; its timer is ref-tracked and cleared on unmount + before
 * re-scheduling (timer-safety rule).
 */
export function ExportGameButton({ bookId }: { bookId: string }): JSX.Element {
	const exportBook = useExportBook(bookId)
	const [result, setResult] = useState<ExportResult | null>(null)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) clearTimeout(timerRef.current)
		}
	}, [])

	function handleExport(): void {
		const next = exportBook()
		if (next === null) return
		setResult(next)
		if (timerRef.current !== null) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => setResult(null), STATUS_TIMEOUT_MS)
	}

	const hasWarnings = result !== null && result.warnings > 0

	return (
		<span style={wrap}>
			<button type="button" onClick={handleExport} style={button}>
				<span aria-hidden="true">⬇</span> Exporter le jeu
			</button>
			{result !== null && (
				<span role="status" style={{ ...status, color: hasWarnings ? 'var(--bad)' : 'var(--good)' }}>
					{hasWarnings ? `⚠ ${result.warnings} ${plural(result.warnings, 'avertissement')}` : '✓ Export réussi'}
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
	whiteSpace: 'nowrap',
}
