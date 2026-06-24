import { useEffect, useRef, useState } from 'react'
import { useExportScenario } from '../hooks/useExportScenario'

const STATUS_TIMEOUT_MS = 4000

/**
 * « Exporter le scénario ⬇ » — downloads the full authored book as a portable
 * `.scenario.json` file that can be re-imported into Genliv (book-export feature).
 * Mounted into the editor top bar's `actions` slot by the editor shell.
 */
export function ExportScenarioButton({ bookId }: { bookId: string }): JSX.Element {
	const exportScenario = useExportScenario(bookId)
	const [done, setDone] = useState(false)
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		return () => {
			if (timerRef.current !== null) clearTimeout(timerRef.current)
		}
	}, [])

	function handleExport(): void {
		const filename = exportScenario()
		if (filename === null) return
		setDone(true)
		if (timerRef.current !== null) clearTimeout(timerRef.current)
		timerRef.current = setTimeout(() => setDone(false), STATUS_TIMEOUT_MS)
	}

	return (
		<span style={wrap}>
			<button type="button" onClick={handleExport} style={button}>
				<span aria-hidden="true">📄</span> Scénario
			</button>
			{done && (
				<span role="status" style={status}>
					✓ Exporté
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
