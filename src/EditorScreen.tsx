import { useState, useMemo } from 'react'
import { useBrain, useOpenBook, useBookHealth, EditorTopBar, buildAdventureDocument } from './brain'
import { TreeCanvas, AutoLayoutButton, SpacingToggle } from './features/tree-canvas'
import { PlayerModal } from './features/play-mode/components/PlayerModal'
import type { AdventureDocument } from './player/types'

/**
 * Editor shell — the composition root for the editor route (§ 02/03). It owns
 * the shared top bar (back, title, count, + Nœud) and renders the graph canvas,
 * which is a VIEW over the same BookService (KR-020/024).
 *
 * Bascule IA — this shell is transitional. The section-list navigation of the
 * adventure dossier replaces it in roadmap n° 2 `bascule-editeur`; the canvas is
 * repointed onto the relations-and-clues graph rather than the node tree.
 */
export function EditorScreen({ bookId }: { bookId: string }): JSX.Element {
	const { books, router, selection } = useBrain()
	const book = useOpenBook(bookId)
	const [adventure, setAdventure] = useState<AdventureDocument | null>(null)

	// Live structural health (KR-145): dead-ends and dangling edge targets always visible.
	const liveWarnings = useBookHealth(bookId)
	const warnedNodeIds = useMemo<ReadonlySet<string>>(() => new Set(liveWarnings.map((w) => w.nodeId)), [liveWarnings])

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
				onBack={() => router.navigate({ name: 'home' })}
				onAddNode={handleAddNode}
				actions={
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
						<SpacingToggle bookId={bookId} />
						<AutoLayoutButton bookId={bookId} />
					</span>
				}
				onPreview={handlePreview}
			/>
			<PlayerModal adventure={adventure} onClose={() => setAdventure(null)} />
			<div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
				<div style={{ flex: 1, minWidth: 0 }}>
					<TreeCanvas warnedNodeIds={warnedNodeIds} />
				</div>
			</div>
		</div>
	)
}
