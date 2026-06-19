import { edgeNests, type BookNode, type Edge } from '../../../brain'

/**
 * Pure geometry for the canvas view. The canvas is a VIEW over the book
 * (KR-020): it never mutates node data, it derives screen coordinates from the
 * book's STRUCTURE. Positions are AUTO-LAID-OUT as a top-down TREE — the
 * `sommaire` root sits at the top and each level's children form a horizontal
 * ROW beneath their parent, evenly spaced, with the parent centred over them
 * (depth → y, classic tidy tree). Linkless nodes (the isolated `mort`, any
 * page not reached from the sommaire by a choice edge) wrap into a GRID below
 * the tree — never a single long row or column (KR-023: deterministic, stable
 * across reloads, never a 0,0 pileup). Manual drag +
 * per-book position persistence is a later iteration; when it lands a stored
 * position will override this computed slot.
 */

/** Node card footprint, in canvas (pre-zoom) coordinate units. */
export const NODE_W = 172
export const NODE_H = 70

/** Canvas sizing: a minimum surface, plus a margin past the furthest node. */
export const CANVAS_MIN_W = 600
export const CANVAS_MIN_H = 400
export const CANVAS_MARGIN = 80

/**
 * Off-screen culling margin (canvas units): cards/edges within this distance of
 * the visible rect still render, so panning never pops a card in at the edge.
 */
export const CULL_MARGIN = 240

/** Tidy-tree spacing: one level down per depth, one slot per sibling. */
const LAYOUT_ORIGIN = 60
const LEVEL_GAP_Y = NODE_H + 70
const SIBLING_GAP_X = NODE_W + 48
/** Free/unconnected nodes wrap into a grid of this many columns below the tree. */
const FREE_COLS = 3

export interface Point {
	x: number
	y: number
}

/**
 * The drawable canvas size: at least CANVAS_MIN_*, expanded to enclose every
 * node plus a margin so the furthest card is never flush against the edge.
 */
export function resolveBounds(positions: Map<string, Point>): { w: number; h: number } {
	let w = CANVAS_MIN_W
	let h = CANVAS_MIN_H
	for (const p of positions.values()) {
		w = Math.max(w, p.x + NODE_W + CANVAS_MARGIN)
		h = Math.max(h, p.y + NODE_H + CANVAS_MARGIN)
	}
	return { w, h }
}

/**
 * Top-left position for every node, laid out as a tidy top-down tree. A DFS of
 * the `choice` (nesting) hierarchy from the `sommaire` root assigns y by depth
 * (each level a row beneath the previous) and x by a left-to-right leaf cursor,
 * with each parent CENTRED over the horizontal span of its children — so the
 * root is at the top, every node's direct children sit on one evenly-spaced row
 * beneath it, and parent→child links read downward. A node already placed
 * (convergence / cycle reached via nesting) is not recursed again (KR-080/061).
 * Linkless nodes unreachable from the root (the isolated `mort`, any page not
 * reached by a choice edge) wrap into a GRID below the tree (KR-023) — so a book
 * of loose pages reads as a familiar grid rather than a single row or column.
 *
 * A manually dragged node's stored position (`overrides`, persisted per book via
 * UIPreferencesService) OVERRIDES its computed slot (KR-023): the auto-layout is
 * the default, an explicit position wins. Overrides for nodes no longer in the
 * book are ignored (no orphan ghosts).
 */
export function resolvePositions(
	nodes: BookNode[],
	edges: Edge[],
	overrides: Record<string, Point> = {},
): Map<string, Point> {
	const byId = new Map(nodes.map((n) => [n.id, n]))
	const childrenOf = new Map<string, string[]>()
	for (const edge of edges) {
		if (!edgeNests(edge.kind) || !byId.has(edge.from) || !byId.has(edge.to)) continue
		const siblings = childrenOf.get(edge.from)
		if (siblings === undefined) childrenOf.set(edge.from, [edge.to])
		else siblings.push(edge.to)
	}

	const positions = new Map<string, Point>()
	const placed = new Set<string>()
	let leafCursor = 0

	// Returns the node's x (its own slot if a leaf, else the centre of its
	// children's span) so a parent can centre itself over its subtree.
	function layout(id: string, depth: number): number {
		placed.add(id)
		const y = LAYOUT_ORIGIN + depth * LEVEL_GAP_Y
		const children = (childrenOf.get(id) ?? []).filter((childId) => !placed.has(childId))
		let x: number
		if (children.length === 0) {
			x = LAYOUT_ORIGIN + leafCursor * SIBLING_GAP_X
			leafCursor += 1
		} else {
			const childXs = children.map((childId) => layout(childId, depth + 1))
			x = (childXs[0] + childXs[childXs.length - 1]) / 2
		}
		positions.set(id, { x, y })
		return x
	}

	const root = nodes.find((n) => n.kind === 'sommaire')
	if (root !== undefined) layout(root.id, 0)

	// Linkless / unreachable nodes (the isolated `mort`, any page not reached from
	// the sommaire by a choice edge) wrap into a GRID below the tree — never a
	// single long row or column. A book of loose pages then reads as a familiar
	// grid, while a connected book reads as the tree above it.
	const treeBottom =
		positions.size > 0 ? Math.max(...[...positions.values()].map((p) => p.y)) : LAYOUT_ORIGIN - LEVEL_GAP_Y
	const freeTop = treeBottom + LEVEL_GAP_Y
	let freeIndex = 0
	for (const node of nodes) {
		if (positions.has(node.id)) continue
		positions.set(node.id, {
			x: LAYOUT_ORIGIN + (freeIndex % FREE_COLS) * SIBLING_GAP_X,
			y: freeTop + Math.floor(freeIndex / FREE_COLS) * LEVEL_GAP_Y,
		})
		freeIndex += 1
	}

	// A stored (dragged) position overrides the computed slot — but only for nodes
	// still in the book, so a deleted node's stale override leaves no ghost.
	for (const node of nodes) {
		const override = overrides[node.id]
		if (override !== undefined) positions.set(node.id, override)
	}

	return positions
}

function center(p: Point): Point {
	return { x: p.x + NODE_W / 2, y: p.y + NODE_H / 2 }
}

/** The VISIBLE canvas-space rectangle for a viewport (KR-013-pure, for culling). */
export interface ViewRect {
	minX: number
	minY: number
	maxX: number
	maxY: number
}

/**
 * Map the on-screen surface back to the visible CANVAS-space rectangle, given the
 * viewport transform `translate(x,y) scale(zoom)` (origin 0,0): a screen point s
 * maps to canvas (s − offset) / zoom. Padded by CULL_MARGIN so just-off-screen
 * cards still render (no pop on pan). Used to cull large books for 60fps (iter 4).
 */
export function viewportRect(
	viewport: { x: number; y: number; zoom: number },
	size: { w: number; h: number },
	margin: number = CULL_MARGIN,
): ViewRect {
	return {
		minX: (0 - viewport.x) / viewport.zoom - margin,
		minY: (0 - viewport.y) / viewport.zoom - margin,
		maxX: (size.w - viewport.x) / viewport.zoom + margin,
		maxY: (size.h - viewport.y) / viewport.zoom + margin,
	}
}

/** Whether a node's card box (NODE_W×NODE_H at `pos`) intersects the visible rect. */
export function nodeInView(pos: Point, rect: ViewRect): boolean {
	return pos.x < rect.maxX && pos.x + NODE_W > rect.minX && pos.y < rect.maxY && pos.y + NODE_H > rect.minY
}

/** Whether an edge segment's bounding box intersects the visible rect. */
export function edgeInView(geo: EdgeGeometry, rect: ViewRect): boolean {
	const minX = Math.min(geo.x1, geo.x2)
	const maxX = Math.max(geo.x1, geo.x2)
	const minY = Math.min(geo.y1, geo.y2)
	const maxY = Math.max(geo.y1, geo.y2)
	return minX < rect.maxX && maxX > rect.minX && minY < rect.maxY && maxY > rect.minY
}

export interface EdgeGeometry {
	id: string
	kind: Edge['kind']
	label?: string
	x1: number
	y1: number
	x2: number
	y2: number
	/** Midpoint, where the mono label chip sits. */
	mx: number
	my: number
}

/**
 * Resolve edges to drawable line segments between node centers. Orphaned
 * edges — whose source or target node was deleted — are DROPPED rather than
 * drawn as a line to nowhere or crashing the render (KR-021).
 */
export function resolveEdges(edges: Edge[], positions: Map<string, Point>): EdgeGeometry[] {
	const geometry: EdgeGeometry[] = []
	for (const edge of edges) {
		const from = positions.get(edge.from)
		const to = positions.get(edge.to)
		if (from === undefined || to === undefined) continue // orphaned (KR-021)
		const a = center(from)
		const b = center(to)
		geometry.push({
			id: edge.id,
			kind: edge.kind,
			label: edge.label,
			x1: a.x,
			y1: a.y,
			x2: b.x,
			y2: b.y,
			mx: (a.x + b.x) / 2,
			my: (a.y + b.y) / 2,
		})
	}
	return geometry
}
