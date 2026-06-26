import {
	resolvePositions,
	resolveEdges,
	resolveBounds,
	viewportRect,
	nodeInView,
	edgeInView,
	collectSubtreeIds,
	NODE_W,
	NODE_H,
	CANVAS_MIN_W,
	CANVAS_MIN_H,
	CANVAS_MARGIN,
	type Point,
	type EdgeGeometry,
} from '../layout/geometry'
import type { BookNode, Edge } from '../../../brain'

function node(id: string, kind: BookNode['kind'] = 'choix'): BookNode {
	return { id, kind, text: '' }
}

function choice(id: string, from: string, to: string): Edge {
	return { id, from, to, kind: 'choice' }
}

function relink(id: string, from: string, to: string): Edge {
	return { id, from, to, kind: 'relink' }
}

function flee(id: string, from: string, to: string): Edge {
	return { id, from, to, kind: 'flee' }
}

describe('resolvePositions (top-down tree)', () => {
	it('puts the sommaire at the top with a lone child centred below it', () => {
		const nodes = [node('root', 'sommaire'), node('child')]
		const positions = resolvePositions(nodes, [choice('e', 'root', 'child')])
		const root = positions.get('root')!
		const child = positions.get('child')!
		// Root on top; the child sits a level below, centred under the parent.
		expect(child.y).toBeGreaterThan(root.y)
		expect(child.x).toBeCloseTo(root.x)
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
		expect(b.x - a.x).toBeCloseTo(c.x - b.x)
		expect(root.x).toBeCloseTo((a.x + c.x) / 2)
	})

	it('relink forward edge: a node reachable only via relink is placed IN the tree, not the grid', () => {
		// Typical piège/monstre scenario: sommaire→A (choice), A→B (relink = outcome routing)
		// B must appear below A in the tree, not in the free grid below everything.
		const nodes = [node('root', 'sommaire'), node('a'), node('b')]
		const positions = resolvePositions(nodes, [
			choice('e1', 'root', 'a'),
			relink('e2', 'a', 'b'), // forward relink (e.g. piège success outcome)
		])
		const [root, a, b] = ['root', 'a', 'b'].map((id) => positions.get(id)!)
		expect(a.y).toBeGreaterThan(root.y) // A below root
		expect(b.y).toBeGreaterThan(a.y) // B below A (in tree, not free grid)
	})

	it('relink back-edge: a node pointing back to an ancestor stays at its forward depth', () => {
		// sommaire→A→B (choice chain), then B→A relink (reliaison)
		// B must not move up; A must not move down.
		const nodes = [node('root', 'sommaire'), node('a'), node('b')]
		const positions = resolvePositions(nodes, [
			choice('e1', 'root', 'a'),
			choice('e2', 'a', 'b'),
			relink('e3', 'b', 'a'), // back-link — must NOT affect layout
		])
		const [root, a, b] = ['root', 'a', 'b'].map((id) => positions.get(id)!)
		expect(a.y).toBeGreaterThan(root.y)
		expect(b.y).toBeGreaterThan(a.y)
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

	it('spacious spacing produces larger vertical and horizontal gaps than compact', () => {
		const nodes = [node('root', 'sommaire'), node('a'), node('b')]
		const edges = [choice('e1', 'root', 'a'), choice('e2', 'root', 'b')]
		const compact = resolvePositions(nodes, edges, {}, 'compact')
		const spacious = resolvePositions(nodes, edges, {}, 'spacious')

		// Vertical gap root→child is larger in spacious mode.
		const compactGapY = compact.get('a')!.y - compact.get('root')!.y
		const spaciousGapY = spacious.get('a')!.y - spacious.get('root')!.y
		expect(spaciousGapY).toBeGreaterThan(compactGapY)

		// Horizontal gap between siblings is larger in spacious mode.
		const compactGapX = compact.get('b')!.x - compact.get('a')!.x
		const spaciousGapX = spacious.get('b')!.x - spacious.get('a')!.x
		expect(spaciousGapX).toBeGreaterThan(compactGapX)
	})

	it('convergent path: a node reachable via two parents keeps its primary-parent depth', () => {
		// sommaire → A → B → C, and also A → C (shortcut, added after B→C)
		// Primary parent of C is B (first edge pointing to C). A→C is a visual overlay.
		// C must appear below B, not at the same level as B.
		const nodes = [node('root', 'sommaire'), node('a'), node('b'), node('c')]
		const positions = resolvePositions(nodes, [
			choice('e1', 'root', 'a'),
			choice('e2', 'a', 'b'),
			choice('e3', 'b', 'c'), // B→C first: primary parent of C is B
			choice('e4', 'a', 'c'), // A→C second: must NOT change C's rank
		])
		const [a, b, c] = ['a', 'b', 'c'].map((id) => positions.get(id)!)
		expect(b.y).toBeGreaterThan(a.y) // B is below A
		expect(c.y).toBeGreaterThan(b.y) // C is below B (not alongside B)
	})

	it('back-edge via choice: a node pointing to an ancestor must not displace it', () => {
		// sommaire → A → B → C, then C → A (back-edge via choice)
		// Primary parent of A is sommaire (first edge pointing to A). C→A must be ignored for layout.
		const nodes = [node('root', 'sommaire'), node('a'), node('b'), node('c')]
		const positions = resolvePositions(nodes, [
			choice('e1', 'root', 'a'),
			choice('e2', 'a', 'b'),
			choice('e3', 'b', 'c'),
			choice('e4', 'c', 'a'), // back-edge: must NOT pull A below C
		])
		const [root, a, b, c] = ['root', 'a', 'b', 'c'].map((id) => positions.get(id)!)
		expect(a.y).toBeGreaterThan(root.y) // A below sommaire
		expect(b.y).toBeGreaterThan(a.y) // B below A
		expect(c.y).toBeGreaterThan(b.y) // C below B
	})

	it('monster victoryTarget (relink hint) places the outcome node in the tree, not the free grid', () => {
		// Simulates passing deriveMonsterEdges() output to resolvePositions.
		// sommaire→combat (choice), combat→victoire (relink, no explicit authored edge).
		// Without the relink hint, "victoire" has no incoming edge and lands in the free grid.
		const nodes = [node('root', 'sommaire'), node('combat'), node('victoire')]
		const positions = resolvePositions(nodes, [
			choice('e1', 'root', 'combat'),
			relink('auto-victory-combat', 'combat', 'victoire'),
		])
		const [combat, victoire] = ['combat', 'victoire'].map((id) => positions.get(id)!)
		expect(victoire.y).toBeGreaterThan(combat.y) // victoire is below combat in the tree
	})

	it('monster fleeTarget (flee hint) places the escape node in the tree, not the free grid', () => {
		const nodes = [node('root', 'sommaire'), node('combat'), node('fuite')]
		const positions = resolvePositions(nodes, [
			choice('e1', 'root', 'combat'),
			flee('auto-flee-combat', 'combat', 'fuite'),
		])
		const [combat, fuite] = ['combat', 'fuite'].map((id) => positions.get(id)!)
		expect(fuite.y).toBeGreaterThan(combat.y)
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

describe('collectSubtreeIds', () => {
	it('returns just the root when it has no children', () => {
		const ids = collectSubtreeIds('root', [choice('e', 'other', 'leaf')])
		expect(ids).toEqual(new Set(['root']))
	})

	it('collects root + all descendants via BFS', () => {
		// root→a→b, root→c
		const ids = collectSubtreeIds('root', [
			choice('e1', 'root', 'a'),
			choice('e2', 'root', 'c'),
			choice('e3', 'a', 'b'),
		])
		expect(ids).toEqual(new Set(['root', 'a', 'b', 'c']))
	})

	it('does not traverse fatal edges', () => {
		// root→a (choice), a→mort (fatal) — fatal must be excluded
		const fatalEdge: Edge = { id: 'f', from: 'a', to: 'mort', kind: 'fatal' }
		const ids = collectSubtreeIds('root', [choice('e1', 'root', 'a'), fatalEdge])
		expect(ids.has('mort')).toBe(false)
		expect(ids).toEqual(new Set(['root', 'a']))
	})

	it('handles back-edges and cycles without infinite loops', () => {
		// root→a→b, b→root (cycle)
		const ids = collectSubtreeIds('root', [
			choice('e1', 'root', 'a'),
			choice('e2', 'a', 'b'),
			relink('e3', 'b', 'root'), // back to root
		])
		expect(ids).toEqual(new Set(['root', 'a', 'b']))
	})

	it('traverses relink and flee edges', () => {
		const ids = collectSubtreeIds('root', [relink('e1', 'root', 'victory'), flee('e2', 'root', 'escape')])
		expect(ids).toEqual(new Set(['root', 'victory', 'escape']))
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

describe('off-screen culling (iter 4)', () => {
	const geo = (x1: number, y1: number, x2: number, y2: number): EdgeGeometry => ({
		id: 'e',
		kind: 'choice',
		x1,
		y1,
		x2,
		y2,
		mx: (x1 + x2) / 2,
		my: (y1 + y2) / 2,
	})

	it('maps the surface to the visible canvas rect, accounting for pan + zoom', () => {
		// No pan, zoom 1, margin 0: the rect is exactly the surface in canvas units.
		expect(viewportRect({ x: 0, y: 0, zoom: 1 }, { w: 1000, h: 800 }, 0)).toEqual({
			minX: 0,
			minY: 0,
			maxX: 1000,
			maxY: 800,
		})
		// Pan right by 200 shifts the window left; zoom 2 halves the canvas span.
		expect(viewportRect({ x: 200, y: 0, zoom: 2 }, { w: 1000, h: 800 }, 0)).toEqual({
			minX: -100,
			minY: 0,
			maxX: 400,
			maxY: 400,
		})
	})

	it('nodeInView keeps cards intersecting the rect and culls far ones', () => {
		const rect = viewportRect({ x: 0, y: 0, zoom: 1 }, { w: 500, h: 500 }, 0)
		expect(nodeInView({ x: 10, y: 10 }, rect)).toBe(true) // inside
		expect(nodeInView({ x: 490, y: 490 }, rect)).toBe(true) // straddles the edge
		expect(nodeInView({ x: 5000, y: 5000 }, rect)).toBe(false) // far off-screen → culled
		expect(nodeInView({ x: -NODE_W - 1, y: 0 }, rect)).toBe(false) // just past the left edge
	})

	it('edgeInView keeps a segment crossing the rect and culls one entirely outside', () => {
		const rect = viewportRect({ x: 0, y: 0, zoom: 1 }, { w: 500, h: 500 }, 0)
		expect(edgeInView(geo(-100, 250, 600, 250), rect)).toBe(true) // crosses the rect
		expect(edgeInView(geo(10, 10, 200, 200), rect)).toBe(true) // inside
		expect(edgeInView(geo(900, 900, 1200, 1200), rect)).toBe(false) // entirely outside → culled
	})
})
