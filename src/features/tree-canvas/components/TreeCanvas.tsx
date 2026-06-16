import { useMemo } from 'react'
import { useBrain, useRoute, useSelectedNode, useOpenBook } from '../../../brain'
import { useViewport } from '../hooks/useViewport'
import { resolvePositions, resolveEdges, resolveBounds, NODE_W, NODE_H } from '../layout/geometry'
import { NodeCard } from './NodeCard'
import { EdgeLayer } from './EdgeLayer'
import { ZoomControls } from './ZoomControls'

const DOT_GRID = 'radial-gradient(var(--ink-6) 1px, transparent 1px)'
/** Dot-grid cell size (px). */
const DOT_GRID_SIZE = 22
/** Inset of the « first sheet » hint from the canvas origin, and its gap below the seeded node. */
const HINT_INSET = 40
const HINT_GAP = 28

/**
 * tree-canvas — the graph body of the editor (wireframe § 02). Renders the open
 * book as node cards + labelled edges on a dot-grid canvas, owns single-select
 * (broadcast via node:selected, KR-024), and adds free-floating nodes through
 * BookService. A VIEW over BookService that never mutates locally (KR-020). The
 * surrounding chrome (top bar, view-mode switch, panel) is the editor shell's.
 */
export function TreeCanvas(): JSX.Element {
	const { books, selection } = useBrain()
	const route = useRoute()
	const bookId = route.name === 'editor' ? route.bookId : null
	const book = useOpenBook(bookId)
	const selectedId = useSelectedNode()
	const { viewport, zoomIn, zoomOut, onBackgroundPointerDown, onWheel, didDragRef } = useViewport()

	const positions = useMemo(() => resolvePositions(book?.nodes ?? []), [book])
	const edges = useMemo(() => resolveEdges(book?.edges ?? [], positions), [book, positions])
	const bounds = useMemo(() => resolveBounds(positions), [positions])

	if (book === null) {
		return <div style={{ padding: 'var(--space-9)', color: 'var(--text-muted)' }}>Livre introuvable.</div>
	}

	// Narrowed non-null local for the handler closures (book is non-null past the guard).
	const activeBookId: string = book.id

	function select(nodeId: string): void {
		selection.select(activeBookId, nodeId)
	}

	function clearSelection(): void {
		// A drag-release is a pan, not a deselect click.
		if (didDragRef.current) return
		selection.select(activeBookId, null)
	}

	function addNode(): void {
		const node = books.addNode(activeBookId, 'choix')
		if (node !== null) select(node.id)
	}

	const isSeededEmpty = book.nodes.length <= 2 && book.edges.length === 0

	return (
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
				height: '100%',
				overflow: 'hidden',
				background: 'var(--surface-sunken)',
				backgroundImage: DOT_GRID,
				backgroundSize: `${DOT_GRID_SIZE}px ${DOT_GRID_SIZE}px`,
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
							left: HINT_INSET,
							top: HINT_INSET + NODE_H + HINT_GAP,
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
	)
}
