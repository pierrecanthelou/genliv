import { useState } from 'react'
import { useBrain, useOpenBook, EditorTopBar, type EditorViewMode } from './brain'
import { TreeCanvas, type RevealRequest } from './features/tree-canvas'
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
	// « Centrer dans l'arbre » from the outline: switch to the canvas and ask it
	// to centre on the node. A monotonic seq makes each request distinct so the
	// same node can be revealed repeatedly. Owned by the shell so outline-view and
	// tree-canvas never import each other (composition-root wiring).
	const [reveal, setReveal] = useState<RevealRequest | undefined>(undefined)

	function revealInTree(nodeId: string): void {
		setReveal((prev) => ({ nodeId, seq: (prev?.seq ?? 0) + 1 }))
		setViewMode('canvas')
	}

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
				<div style={{ flex: 1, minWidth: 0 }}>
					{viewMode === 'canvas' ? <TreeCanvas reveal={reveal} /> : <OutlineView onRevealInTree={revealInTree} />}
				</div>
				<NodeEditorPanel />
			</div>
		</div>
	)
}
