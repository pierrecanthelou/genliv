import { useEffect, useRef, useState } from 'react'
import { plural, type PlayWarning } from '../../../brain'
import { useExportBook, type ExportResult } from '../hooks/useExportBook'

/** How long the success status stays visible before auto-hiding (warnings stay until next export). */
const SUCCESS_TIMEOUT_MS = 6000

/**
 * « Exporter le jeu ⬇ » — the book-export trigger. Shows « ✓ Export réussi » or
 * « ⚠ N avertissement(s) » after export. The success status auto-hides; warnings
 * stay visible until the next export so the author sees which nodes are broken
 * (KR-021). `onResult` lets the editor shell receive the full warning list to
 * highlight the affected nodes in the canvas / outline.
 */
export function ExportGameButton({
	bookId,
	onResult,
}: {
	bookId: string
	onResult?: (warnings: PlayWarning[]) => void
}): JSX.Element {
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
		onResult?.(next.warningList)
		if (timerRef.current !== null) clearTimeout(timerRef.current)
		// Warnings stay until the next export; only the success status auto-hides.
		if (next.warnings === 0) {
			timerRef.current = setTimeout(() => setResult(null), SUCCESS_TIMEOUT_MS)
		}
	}

	const hasWarnings = result !== null && result.warnings > 0
	const warningTooltip = hasWarnings ? result!.warningList.map((w) => `• ${w.message}`).join('\n') : undefined

	return (
		<span style={wrap}>
			<button type="button" onClick={handleExport} style={button}>
				<span aria-hidden="true">⬇</span> Exporter le jeu
			</button>
			{result !== null && (
				<span
					role="status"
					title={warningTooltip}
					style={{ ...status, color: hasWarnings ? 'var(--bad)' : 'var(--good)' }}
				>
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
