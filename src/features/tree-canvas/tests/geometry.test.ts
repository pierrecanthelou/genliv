import {
	resolvePositions,
	resolveEdges,
	resolveBounds,
	NODE_W,
	NODE_H,
	CANVAS_MIN_W,
	CANVAS_MIN_H,
	CANVAS_MARGIN,
	type Point,
} from '../layout/geometry'
import type { BookNode, Edge } from '../../../brain'

function node(id: string, kind: BookNode['kind'] = 'choix'): BookNode {
	return { id, kind, text: '' }
}

function choice(id: string, from: string, to: string): Edge {
	return { id, from, to, kind: 'choice' }
}

describe('resolvePositions (top-down tree)', () => {
	it('puts the sommaire at the top with a lone child centred below it', () => {
		const nodes = [node('root', 'sommaire'), node('child')]
		const positions = resolvePositions(nodes, [choice('e', 'root', 'child')])
		const root = positions.get('root')!
		const child = positions.get('child')!
		// Root on top; the child sits a level below, centred under the parent.
		expect(child.y).toBeGreaterThan(root.y)
		expect(child.x).toBe(root.x)
	})

	it('lays direct children on one evenly-spaced row, parent centred over them', () => {
		const nodes = [node('root', 'sommaire'), node('a'), node('b'), node('c')]
		const positions = resolvePositions(nodes, [
			choice('e1', 'root', 'a'),
			choice('e2', 'root', 'b'),
			choice('e3', 'root', 'c'),
		])
		const [a, b, c, root] = ['a', 'b', 'c', 'root'].map((id) => positions.get(id)!)
		// The three children share ONE row beneath the root…
		expect(a.y).toBe(b.y)
		expect(b.y).toBe(c.y)
		expect(a.y).toBeGreaterThan(root.y)
		// …evenly spaced, with the parent centred over the row.
		expect(b.x - a.x).toBe(c.x - b.x)
		expect(root.x).toBeCloseTo((a.x + c.x) / 2)
	})

	it('lays linkless nodes (mort, unconnected pages) in a grid below the tree, not a single line', () => {
		const nodes = [node('root', 'sommaire'), node('child'), node('mort', 'mort'), node('f1'), node('f2'), node('f3')]
		const positions = resolvePositions(nodes, [choice('e', 'root', 'child')])
		const child = positions.get('child')!
		const free = ['mort', 'f1', 'f2', 'f3'].map((id) => positions.get(id)!)
		// All free nodes sit below the connected tree…
		for (const p of free) expect(p.y).toBeGreaterThan(child.y)
		// …and WRAP into a grid (>1 column and >1 row across 4 nodes), so they never
		// form a single horizontal row or a single descending column.
		const xs = new Set(free.map((p) => p.x))
		const ys = new Set(free.map((p) => p.y))
		expect(xs.size).toBeGreaterThan(1)
		expect(ys.size).toBeGreaterThan(1)
	})

	it('is deterministic across calls', () => {
		const nodes = [node('root', 'sommaire'), node('a'), node('b'), node('mort', 'mort')]
		const edges = [choice('e1', 'root', 'a'), choice('e2', 'a', 'b')]
		expect(resolvePositions(nodes, edges)).toEqual(resolvePositions(nodes, edges))
	})

	it('lets a stored (dragged) override REPLACE a node computed slot (KR-023)', () => {
		const nodes = [node('root', 'sommaire'), node('child')]
		const edges = [choice('e', 'root', 'child')]
		const auto = resolvePositions(nodes, edges).get('child')!
		const moved = resolvePositions(nodes, edges, { child: { x: 999, y: 777 } }).get('child')!
		expect(moved).toEqual({ x: 999, y: 777 })
		expect(moved).not.toEqual(auto)
	})

	it('ignores an override for a node no longer in the book (no ghost)', () => {
		const nodes = [node('root', 'sommaire')]
		const positions = resolvePositions(nodes, [], { deleted: { x: 10, y: 10 } })
		expect(positions.has('deleted')).toBe(false)
	})
})

describe('resolveBounds', () => {
	it('falls back to the minimum surface when there are no nodes', () => {
		expect(resolveBounds(new Map())).toEqual({ w: CANVAS_MIN_W, h: CANVAS_MIN_H })
	})

	it('expands to enclose the furthest node plus a margin', () => {
		const positions = new Map<string, Point>([['far', { x: 1000, y: 800 }]])
		expect(resolveBounds(positions)).toEqual({
			w: 1000 + NODE_W + CANVAS_MARGIN,
			h: 800 + NODE_H + CANVAS_MARGIN,
		})
	})
})

describe('resolveEdges', () => {
	const positions = resolvePositions([node('n1', 'sommaire'), node('n2')], [choice('e', 'n1', 'n2')])

	it('produces a segment between node centers with a midpoint label anchor', () => {
		const edges: Edge[] = [{ id: 'e1', from: 'n1', to: 'n2', kind: 'choice', label: 'Aller' }]
		const [geo] = resolveEdges(edges, positions)
		expect(geo?.label).toBe('Aller')
		expect(geo?.mx).toBeCloseTo((geo!.x1 + geo!.x2) / 2)
		expect(geo?.my).toBeCloseTo((geo!.y1 + geo!.y2) / 2)
	})

	it('drops orphaned edges whose endpoint node is missing (KR-021)', () => {
		const edges: Edge[] = [
			{ id: 'ok', from: 'n1', to: 'n2', kind: 'choice' },
			{ id: 'orphan', from: 'n1', to: 'ghost', kind: 'choice' },
		]
		const resolved = resolveEdges(edges, positions)
		expect(resolved.map((e) => e.id)).toEqual(['ok'])
	})
})
