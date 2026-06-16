import { useMemo } from 'react'
import { useBrain, useRoute, useSelectedNode, useOpenBook } from '../../../brain'
import { useViewport } from '../hooks/useViewport'
import { resolvePositions, resolveEdges, NODE_W, NODE_H } from '../layout/geometry'
import { CanvasTopBar } from './CanvasTopBar'
import { NodeCard } from './NodeCard'
import { EdgeLayer } from './EdgeLayer'
import { ZoomControls } from './ZoomControls'

const DOT_GRID = 'radial-gradient(var(--ink-6) 1px, transparent 1px)'

/**
 * tree-canvas — the primary editor surface. Renders the open book as a graph
 * of node cards + labelled edges on a dot-grid canvas, owns single-select
 * (broadcast via node:selected, KR-024), and adds free-floating nodes through
 * BookService. It is a VIEW over BookService and never mutates locally
 * (KR-020). Replaces the temporary EditorStub.
 */
export function TreeCanvas(): JSX.Element {
	const { books, router, selection } = useBrain()
	const route = useRoute()
	const bookId = route.name === 'editor' ? route.bookId : null
	const book = useOpenBook(bookId)
	const selectedId = useSelectedNode()
	const { viewport, zoomIn, zoomOut, onBackgroundPointerDown, onWheel, didDragRef } = useViewport()

	const positions = useMemo(() => resolvePositions(book?.nodes ?? []), [book])
	const edges = useMemo(() => resolveEdges(book?.edges ?? [], positions), [book, positions])
	const bounds = useMemo(() => {
		let w = 600
		let h = 400
		for (const p of positions.values()) {
			w = Math.max(w, p.x + NODE_W + 80)
			h = Math.max(h, p.y + NODE_H + 80)
		}
		return { w, h }
	}, [positions])

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

	function select(nodeId: string): void {
		selection.select(book!.id, nodeId)
	}

	function clearSelection(): void {
		// A drag-release is a pan, not a deselect click.
		if (didDragRef.current) return
		selection.select(book!.id, null)
	}

	function addNode(): void {
		const node = books.addNode(book!.id, 'choix')
		if (node !== null) select(node.id)
	}

	const isSeededEmpty = book.nodes.length <= 2 && book.edges.length === 0

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--surface-app)' }}>
			<CanvasTopBar
				title={book.title}
				nodeCount={book.nodes.length}
				onBack={() => router.navigate({ name: 'home' })}
				onAddNode={addNode}
			/>

			<div
				data-testid="canvas-surface"
				onPointerDown={(e) => {
					didDragRef.current = false
					onBackgroundPointerDown(e)
				}}
				onClick={clearSelection}
				onWheel={onWheel}
				style={{
					position: 'relative',
					flex: 1,
					overflow: 'hidden',
					background: 'var(--surface-sunken)',
					backgroundImage: DOT_GRID,
					backgroundSize: '22px 22px',
					cursor: 'grab',
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						transformOrigin: '0 0',
						transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
						width: bounds.w,
						height: bounds.h,
					}}
				>
					<EdgeLayer edges={edges} width={bounds.w} height={bounds.h} />

					{book.nodes.map((node, index) => (
						<NodeCard
							key={node.id}
							node={node}
							index={index}
							position={positions.get(node.id) ?? { x: 0, y: 0 }}
							selected={node.id === selectedId}
							onSelect={select}
						/>
					))}

					{isSeededEmpty && (
						<button
							type="button"
							onPointerDown={(e) => e.stopPropagation()}
							onClick={(e) => {
								e.stopPropagation()
								addNode()
							}}
							style={{
								position: 'absolute',
								left: 40,
								top: 40 + NODE_H + 28,
								width: NODE_W,
								minHeight: NODE_H,
								border: '1.5px dashed var(--border-field)',
								borderRadius: 'var(--r-2xl)',
								background: 'var(--paper-1)',
								color: 'var(--text-muted)',
								fontFamily: 'var(--font-mono)',
								fontSize: 'var(--fs-meta)',
								cursor: 'pointer',
							}}
						>
							+ Première feuille
						</button>
					)}
				</div>

				<div onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
					<ZoomControls zoom={viewport.zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} />
				</div>
			</div>
		</div>
	)
}
