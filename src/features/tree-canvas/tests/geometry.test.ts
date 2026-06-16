import { resolvePositions, resolveEdges } from '../layout/geometry'
import type { BookNode, Edge } from '../../../brain'

function node(id: string, position?: { x: number; y: number }): BookNode {
	return { id, kind: 'choix', text: '', position }
}

describe('resolvePositions', () => {
	it('uses the stored position when present', () => {
		const positions = resolvePositions([node('n1', { x: 120, y: 80 })])
		expect(positions.get('n1')).toEqual({ x: 120, y: 80 })
	})

	it('derives a deterministic, non-overlapping slot for position-less nodes', () => {
		const nodes = [node('a'), node('b'), node('c')]
		const first = resolvePositions(nodes)
		const second = resolvePositions(nodes)
		// Deterministic across calls.
		expect(first.get('a')).toEqual(second.get('a'))
		// No 0,0 pileup: distinct slots.
		expect(first.get('a')).not.toEqual(first.get('b'))
		expect(first.get('b')).not.toEqual(first.get('c'))
	})
})

describe('resolveEdges', () => {
	const positions = resolvePositions([node('n1', { x: 0, y: 0 }), node('n2', { x: 200, y: 200 })])

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
