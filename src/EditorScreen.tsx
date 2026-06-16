import { useState } from 'react'
import { useBrain, useOpenBook, EditorTopBar, type EditorViewMode } from './brain'
import { TreeCanvas } from './features/tree-canvas'
import { OutlineView } from './features/outline-view'
import { NodeEditorPanel } from './features/node-editor'

/**
 * Editor shell — the composition root for the editor route (§ 02/03). It owns
 * the shared top bar (back, title, count, the canvas ↔ outline switch, + Nœud)
 * and swaps the body between the graph canvas and the indented outline; both
 * are VIEWS over the same BookService and share selection (KR-020/024). The
 * view-mode is a non-synced UI preference held locally (KR-022) — persistence
 * waits for UIPreferencesService, like the canvas pan/zoom.
 */
export function EditorScreen({ bookId }: { bookId: string }): JSX.Element {
	const { books, router, selection } = useBrain()
	const book = useOpenBook(bookId)
	const [viewMode, setViewMode] = useState<EditorViewMode>('canvas')

	if (book === null) {
		return (
			<main style={{ padding: 'var(--space-12)' }}>
				<p style={{ color: 'var(--text-muted)' }}>Livre introuvable.</p>
				<button type="button" onClick={() => router.navigate({ name: 'home' })}>
					← Mes livres
				</button>
			</main>
		)
	}

	function handleAddNode(): void {
		const node = books.addNode(bookId, 'choix')
		if (node !== null) selection.select(bookId, node.id)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
			<EditorTopBar
				title={book.title}
				nodeCount={book.nodes.length}
				viewMode={viewMode}
				onViewModeChange={setViewMode}
				onBack={() => router.navigate({ name: 'home' })}
				onAddNode={handleAddNode}
			/>
			<div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
				<div style={{ flex: 1, minWidth: 0 }}>{viewMode === 'canvas' ? <TreeCanvas /> : <OutlineView />}</div>
				<NodeEditorPanel />
			</div>
		</div>
	)
}
