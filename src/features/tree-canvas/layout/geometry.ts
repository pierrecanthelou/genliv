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

/** Canvas sizing: a minimum surface, plus a margin past the furthest node. */
export const CANVAS_MIN_W = 600
export const CANVAS_MIN_H = 400
export const CANVAS_MARGIN = 80

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
