import type { BookNode, Edge } from '../../../brain'
import { autoSlot } from '../../../brain'

/**
 * Pure geometry for the canvas view. The canvas is a VIEW over the book
 * (KR-020): it never mutates node data, it only reads stored positions and
 * derives screen coordinates. Position-less nodes fall back to the same
 * deterministic auto-layout slot the BookService uses (KR-023), so the
 * render is stable across reloads and never piles at 0,0.
 */

/** Node card footprint, in canvas (pre-zoom) coordinate units. */
export const NODE_W = 172
export const NODE_H = 70

export interface Point {
	x: number
	y: number
}

/** Top-left position for every node, stored or deterministically derived. */
export function resolvePositions(nodes: BookNode[]): Map<string, Point> {
	const map = new Map<string, Point>()
	nodes.forEach((node, index) => {
		map.set(node.id, node.position ?? autoSlot(index))
	})
	return map
}

function center(p: Point): Point {
	return { x: p.x + NODE_W / 2, y: p.y + NODE_H / 2 }
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
