import { useState } from 'react'
import { useBrain, useOpenBook, useBookViewMode, EditorTopBar, type EditorViewMode } from './brain'
import { buildAdventureDocument } from './brain'
import { TreeCanvas, AutoLayoutButton, type RevealRequest } from './features/tree-canvas'
import { OutlineView } from './features/outline-view'
import { NodeEditorPanel } from './features/node-editor'
import { ExportGameButton, ExportScenarioButton, DownloadAiPromptButton } from './features/book-export'
import { PlayerModal } from './features/play-mode/components/PlayerModal'
import type { AdventureDocument } from './player/types'

/**
 * Editor shell — the composition root for the editor route (§ 02/03). It owns
 * the shared top bar (back, title, count, the canvas ↔ outline switch, + Nœud)
 * and swaps the body between the graph canvas and the indented outline; both
 * are VIEWS over the same BookService and share selection (KR-020/024). The
 * view-mode is a non-synced per-book UI preference persisted via
 * UIPreferencesService (KR-022), read reactively and written on change.
 */
export function EditorScreen({ bookId }: { bookId: string }): JSX.Element {
	const { books, router, selection, uiPreferences } = useBrain()
	const book = useOpenBook(bookId)
	const viewMode = useBookViewMode(bookId)
	const setViewMode = (mode: EditorViewMode): void => uiPreferences.setViewMode(bookId, mode)
	// « Centrer dans l'arbre » from the outline: switch to the canvas and ask it
	// to centre on the node. A monotonic seq makes each request distinct so the
	// same node can be revealed repeatedly. Owned by the shell so outline-view and
	// tree-canvas never import each other (composition-root wiring).
	const [reveal, setReveal] = useState<RevealRequest | undefined>(undefined)
	const [adventure, setAdventure] = useState<AdventureDocument | null>(null)

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

	function handlePreview(): void {
		if (book === null) return
		setAdventure(buildAdventureDocument(book))
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
				actions={
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
						{viewMode === 'canvas' && <AutoLayoutButton bookId={bookId} />}
						<DownloadAiPromptButton />
						<ExportScenarioButton bookId={bookId} />
						<ExportGameButton bookId={bookId} />
					</span>
				}
				onPreview={handlePreview}
			/>
			<PlayerModal adventure={adventure} onClose={() => setAdventure(null)} />
			<div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
				<div style={{ flex: 1, minWidth: 0 }}>
					{viewMode === 'canvas' ? <TreeCanvas reveal={reveal} /> : <OutlineView onRevealInTree={revealInTree} />}
				</div>
				<NodeEditorPanel />
			</div>
		</div>
	)
}
