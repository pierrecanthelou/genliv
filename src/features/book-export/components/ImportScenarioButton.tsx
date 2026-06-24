import { useRef, useState } from 'react'
import { useBrain, isScenarioExport } from '../../../brain'

/**
 * « Importer un scénario » — picks a `.scenario.json` file, parses it, and
 * creates a new book in the library via BookService.importBook (KR-143).
 * On success, navigates to the newly created book in the editor.
 * Rendered in the library screen's header by the composition root (App.tsx).
 */
export function ImportScenarioButton(): JSX.Element {
	const { books, router } = useBrain()
	const inputRef = useRef<HTMLInputElement>(null)
	const [error, setError] = useState<string | null>(null)

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
		const file = e.target.files?.[0]
		if (file === undefined) return
		setError(null)
		const reader = new FileReader()
		reader.onload = (event) => {
			try {
				const raw = JSON.parse(event.target?.result as string)
				if (!isScenarioExport(raw)) {
					setError("Fichier invalide — ce fichier n'est pas un scénario Genliv.")
					return
				}
				const imported = books.importBook(raw)
				if (imported === null) {
					setError("Impossible d'importer ce scénario (nœuds ou arêtes non reconnus).")
					return
				}
				router.navigate({ name: 'editor', bookId: imported.id })
			} catch {
				setError('Erreur de lecture — le fichier JSON est corrompu.')
			}
		}
		reader.readAsText(file)
		e.target.value = ''
	}

	return (
		<span style={wrap}>
			<input
				ref={inputRef}
				type="file"
				accept=".json"
				aria-label="Importer un fichier de scénario"
				style={hiddenInput}
				onChange={handleFileChange}
			/>
			<button type="button" onClick={() => inputRef.current?.click()} style={button}>
				<span aria-hidden="true">⬆</span> Importer un scénario
			</button>
			{error !== null && (
				<span role="alert" style={errorStyle}>
					{error}
				</span>
			)}
		</span>
	)
}

const wrap: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
	flexWrap: 'wrap',
}

const hiddenInput: React.CSSProperties = {
	position: 'absolute',
	width: 1,
	height: 1,
	padding: 0,
	overflow: 'hidden',
	clip: 'rect(0,0,0,0)',
	whiteSpace: 'nowrap',
	border: 0,
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

const errorStyle: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--bad)',
}
