import { buildNodeInspector } from '../utils/buildNodeInspector'
import { type Book, type BookNode, type Edge, type MonsterConfig } from '../../../brain'

function node(id: string, kind: BookNode['kind'], extra: Partial<BookNode> = {}): BookNode {
	return { id, kind, text: '', ...extra }
}

function monster(victoryTarget?: string, fleeTarget?: string): MonsterConfig {
	return {
		name: 'Gobelin',
		pv: 10,
		attack: 2,
		defense: 1,
		outcomes: {} as MonsterConfig['outcomes'],
		victoryTarget,
		fleeTarget,
	}
}

function book(nodes: BookNode[], edges: Edge[]): Book {
	return { id: 'b', title: 'B', createdAt: '', updatedAt: '', nodes, edges }
}

describe('buildNodeInspector', () => {
	it('lists « entre depuis » edges with their kind, surfacing a deleted source', () => {
		const b = book(
			[node('root', 'sommaire'), node('a', 'choix'), node('target', 'choix')],
			[
				{ id: 'e1', from: 'a', to: 'target', kind: 'choice' },
				{ id: 'e2', from: 'ghost', to: 'target', kind: 'relink' }, // dangling source
			],
		)
		const { incoming } = buildNodeInspector(b, 'target')
		expect(incoming).toHaveLength(2)
		expect(incoming[0]).toMatchObject({ fromId: 'a', via: 'choice' })
		expect(incoming[0].title).not.toBeNull()
		// A deleted source resolves to a null title, never a crash (KR-021).
		expect(incoming[1]).toMatchObject({ fromId: 'ghost', via: 'relink', title: null })
	})

	it('reports a monstre node victoire / fuite outcomes, surfacing a deleted target', () => {
		const b = book([node('m', 'monstre', { monster: monster('win', 'ghost') }), node('win', 'choix')], [])
		const { outcomes } = buildNodeInspector(b, 'm')
		expect(outcomes).toEqual([
			{ outcome: 'victoire', targetId: 'win', title: expect.any(String) },
			{ outcome: 'fuite', targetId: 'ghost', title: null },
		])
	})

	it('has no outcomes for a non-combat node', () => {
		const b = book([node('a', 'choix')], [])
		expect(buildNodeInspector(b, 'a').outcomes).toEqual([])
	})

	it('returns empty sections for an unknown node id', () => {
		const b = book([node('a', 'choix')], [])
		expect(buildNodeInspector(b, 'nope')).toEqual({ incoming: [], outcomes: [] })
	})
})
