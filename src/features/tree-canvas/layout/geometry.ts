import * as dagre from 'dagre'
import { type BookNode, type Edge } from '../../../brain'
import type { LayoutSpacing } from '../../../brain/UIPreferencesService'

/**
 * Pure geometry for the canvas view. The canvas is a VIEW over the book
 * (KR-020): it never mutates node data, it derives screen coordinates from the
 * book's STRUCTURE. Positions are AUTO-LAID-OUT using the Dagre/Sugiyama
 * algorithm on the SPANNING TREE of the book: each node has exactly one primary
 * parent (the first non-`fatal` edge — choice, relink, or flee — that points to
 * it, by insertion order). Convergent paths and back-edges are rendered as
 * visual overlays but never affect rank assignment — a node's position is
 * determined solely by its primary parent. Linkless nodes (the isolated `mort`,
 * any page unreachable via any authored edge) wrap into a GRID below the tree
 * — never a single long row
 * or column (KR-023: deterministic, stable across reloads, never a 0,0
 * pileup). A manually-dragged node's stored position overrides its computed slot.
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
/** Free/unconnected nodes wrap into a grid of this many columns below the tree. */
const FREE_COLS = 3

/** Gap values (canvas units) for each spacing mode. */
const SPACING = {
	compact: { levelGapY: NODE_H + 70, siblingGapX: NODE_W + 48 },
	spacious: { levelGapY: NODE_H + 200, siblingGapX: NODE_W + 150 },
} as const

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
 * Top-left position for every node. Tree-connected nodes (reachable from the
 * `sommaire` via any authored edge) are laid out by Dagre over the SPANNING
 * TREE: each node has exactly one primary parent (its first incoming non-`fatal`
 * edge — choice, relink, or flee — by insertion order), so Dagre receives a
 * pure tree and produces a faithful parent→child hierarchy. Convergent paths
 * and back-edges are rendered by EdgeLayer but excluded from rank assignment.
 * Isolated nodes (the `mort`, pages with no authored edge pointing to them) wrap
 * into a GRID below the tree (KR-023).
 *
 * A dragged node's stored position (`overrides`, persisted per book via
 * UIPreferencesService) OVERRIDES its computed slot (KR-023): the auto-layout
 * is the default; an explicit position wins. Overrides for deleted nodes are
 * silently ignored (no orphan ghosts).
 */
export function resolvePositions(
	nodes: BookNode[],
	edges: Edge[],
	overrides: Record<string, Point> = {},
	spacing: LayoutSpacing = 'compact',
): Map<string, Point> {
	const { levelGapY: LEVEL_GAP_Y, siblingGapX: SIBLING_GAP_X } = SPACING[spacing]
	// --- BFS from sommaire via ALL non-fatal edges → treeNodeIds ---
	// choice, relink, AND flee edges all represent valid story paths. Only `fatal`
	// is excluded (auto-derived to `mort`; `mort` must stay in the free grid).
	const nodeIds = new Set(nodes.map((n) => n.id))
	const childrenOf = new Map<string, string[]>()
	for (const edge of edges) {
		if (edge.kind === 'fatal' || !nodeIds.has(edge.from) || !nodeIds.has(edge.to)) continue
		const siblings = childrenOf.get(edge.from)
		if (siblings === undefined) childrenOf.set(edge.from, [edge.to])
		else siblings.push(edge.to)
	}

	const root = nodes.find((n) => n.kind === 'sommaire')
	const treeNodeIds = new Set<string>()
	if (root !== undefined) {
		const queue = [root.id]
		while (queue.length > 0) {
			const id = queue.shift()!
			if (treeNodeIds.has(id)) continue
			treeNodeIds.add(id)
			for (const childId of childrenOf.get(id) ?? []) {
				if (!treeNodeIds.has(childId)) queue.push(childId)
			}
		}
	}

	// --- Primary-parent map: each tree node's layout parent = the FIRST edge
	//     pointing to it (any non-fatal kind, by insertion order). Back-edges and
	//     convergent paths added later are visual overlays; they don't move nodes.
	//     Known limitation: if two nodes first point to each other forming a mutual
	//     cycle, both primary edges reach Dagre; Dagre de-cycles via edge-reversal
	//     (sub-optimal rank, no crash). Rare in practice. ---
	const primaryParent = new Map<string, string>() // childId → primary parentId
	for (const edge of edges) {
		if (edge.kind === 'fatal' || !treeNodeIds.has(edge.from) || !treeNodeIds.has(edge.to)) continue
		if (!primaryParent.has(edge.to)) primaryParent.set(edge.to, edge.from)
	}

	// --- Dagre layout on tree-connected nodes ---
	const positions = new Map<string, Point>()

	if (treeNodeIds.size > 0) {
		const g = new dagre.graphlib.Graph()
		g.setDefaultEdgeLabel(() => ({}))
		g.setGraph({
			rankdir: 'TB',
			nodesep: SIBLING_GAP_X - NODE_W,
			ranksep: LEVEL_GAP_Y - NODE_H,
		})

		for (const node of nodes) {
			if (treeNodeIds.has(node.id)) g.setNode(node.id, { width: NODE_W, height: NODE_H })
		}
		for (const edge of edges) {
			// Only feed the primary-parent edge for each node — convergent paths
			// and back-edges are visual overlays, not layout inputs.
			if (edge.kind !== 'fatal' && primaryParent.get(edge.to) === edge.from) {
				g.setEdge(edge.from, edge.to)
			}
		}

		dagre.layout(g)

		// Dagre positions are node centers. Convert to top-left and offset so the
		// top-left node starts at LAYOUT_ORIGIN (normalise the graph origin).
		let minX = Infinity
		let minY = Infinity
		for (const id of treeNodeIds) {
			const pos = g.node(id)
			if (pos) {
				minX = Math.min(minX, pos.x - NODE_W / 2)
				minY = Math.min(minY, pos.y - NODE_H / 2)
			}
		}
		const ox = LAYOUT_ORIGIN - minX
		const oy = LAYOUT_ORIGIN - minY
		for (const id of treeNodeIds) {
			const pos = g.node(id)
			if (pos) positions.set(id, { x: pos.x - NODE_W / 2 + ox, y: pos.y - NODE_H / 2 + oy })
		}
	}

	// --- Grid-place linkless / unreachable nodes below the tree ---
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
 * All node ids in the spanning subtree rooted at `rootId` (inclusive), found by
 * a BFS over non-fatal edges. Used by TreeCanvas to move a whole subtree when
 * the author drags a card. A visited guard prevents infinite loops on cycles.
 */
export function collectSubtreeIds(rootId: string, edges: Edge[]): Set<string> {
	const childrenOf = new Map<string, string[]>()
	for (const edge of edges) {
		if (edge.kind === 'fatal') continue
		const ch = childrenOf.get(edge.from)
		if (ch === undefined) childrenOf.set(edge.from, [edge.to])
		else ch.push(edge.to)
	}
	const visited = new Set<string>()
	const queue = [rootId]
	while (queue.length > 0) {
		const id = queue.shift()!
		if (visited.has(id)) continue
		visited.add(id)
		for (const child of childrenOf.get(id) ?? []) queue.push(child)
	}
	return visited
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
