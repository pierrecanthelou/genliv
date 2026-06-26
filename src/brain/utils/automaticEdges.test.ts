import { deriveAutomaticEdges, deriveMonsterEdges } from './automaticEdges'
import type { Book, BookNode, MonsterConfig, TrapConfig } from '../types'

function node(id: string, kind: BookNode['kind'], extra: Partial<BookNode> = {}): BookNode {
	return { id, kind, text: '', ...extra }
}

function trap(fatal: boolean): TrapConfig {
	return { description: '', outcomes: { reussite: '', echec: '' }, fatal }
}

function monsterNode(id: string, extra: Partial<MonsterConfig> = {}): BookNode {
	const monster: MonsterConfig = {
		name: 'Monstre',
		pv: 20,
		outcomes: { reussite: '', echec: '' },
		...extra,
	}
	return { id, kind: 'choix', text: '', actionType: 'monstre', monster }
}

function book(nodes: BookNode[]): Book {
	return { id: 'b', title: 'B', createdAt: '', updatedAt: '', nodes, edges: [] }
}

describe('deriveAutomaticEdges (KR-067 dedicated path)', () => {
	it('derives a fatal trap → Mort edge for a « échec sanctionné » trap action', () => {
		const b = book([
			node('root', 'sommaire'),
			node('p', 'choix', { actionType: 'piege', trap: trap(true) }),
			node('m', 'mort'),
		])
		const edges = deriveAutomaticEdges(b)
		expect(edges).toEqual([{ id: 'auto-fatal-p', from: 'p', to: 'm', kind: 'fatal' }])
	})

	it('derives nothing for a non-fatal trap, or a node whose action is not « piège »', () => {
		const b = book([
			node('p', 'choix', { actionType: 'piege', trap: trap(false) }),
			// stale trap config but the action is something else → no automatic edge.
			node('c', 'choix', { actionType: 'aucune', trap: trap(true) }),
			node('m', 'mort'),
		])
		expect(deriveAutomaticEdges(b)).toEqual([])
	})

	it('derives nothing when the book has no Mort leaf, or is null', () => {
		expect(deriveAutomaticEdges(book([node('p', 'choix', { actionType: 'piege', trap: trap(true) })]))).toEqual([])
		expect(deriveAutomaticEdges(null)).toEqual([])
	})

	it('derives a fatal → Mort edge for a décor « prendre » object with a fatal jet (trap-on-object, iter 3)', () => {
		const b = book([
			node('root', 'sommaire'),
			node('d', 'choix', {
				actionType: 'decor',
				decor: {
					interaction: 'prendre',
					objects: [
						{
							object: { id: 'o1', name: 'Coffre', description: '' },
							kind: 'utile',
							roll: { trait: 'hab', difficulty: 7, fatal: true },
						},
					],
				},
			}),
			node('m', 'mort'),
		])
		expect(deriveAutomaticEdges(b)).toEqual([{ id: 'auto-fatal-d', from: 'd', to: 'm', kind: 'fatal' }])
	})

	it('derives nothing for a décor object whose jet is not fatal (or whose action is not décor)', () => {
		const nonFatal = book([
			node('d', 'choix', {
				actionType: 'decor',
				decor: {
					interaction: 'prendre',
					objects: [
						{ object: { id: 'o1', name: '', description: '' }, kind: 'utile', roll: { trait: 'h', difficulty: 5 } },
					],
				},
			}),
			node('m', 'mort'),
		])
		expect(deriveAutomaticEdges(nonFatal)).toEqual([])
	})
})

describe('deriveMonsterEdges (layout hints from monster config)', () => {
	it('derives a relink edge for victoryTarget', () => {
		const b = book([
			node('root', 'sommaire'),
			monsterNode('combat', { victoryTarget: 'suite' }),
			node('suite', 'choix'),
		])
		expect(deriveMonsterEdges(b)).toEqual([{ id: 'auto-victory-combat', from: 'combat', to: 'suite', kind: 'relink' }])
	})

	it('derives a flee edge for fleeTarget', () => {
		const b = book([node('root', 'sommaire'), monsterNode('combat', { fleeTarget: 'fuite' }), node('fuite', 'choix')])
		expect(deriveMonsterEdges(b)).toEqual([{ id: 'auto-flee-combat', from: 'combat', to: 'fuite', kind: 'flee' }])
	})

	it('derives both edges when both targets are set', () => {
		const b = book([
			node('root', 'sommaire'),
			monsterNode('combat', { victoryTarget: 'suite', fleeTarget: 'fuite' }),
			node('suite', 'choix'),
			node('fuite', 'choix'),
		])
		const edges = deriveMonsterEdges(b)
		expect(edges).toHaveLength(2)
		expect(edges.find((e) => e.kind === 'relink')?.to).toBe('suite')
		expect(edges.find((e) => e.kind === 'flee')?.to).toBe('fuite')
	})

	it('silently drops a target whose node no longer exists (KR-021)', () => {
		const b = book([
			node('root', 'sommaire'),
			monsterNode('combat', { victoryTarget: 'deleted-node', fleeTarget: 'also-gone' }),
		])
		expect(deriveMonsterEdges(b)).toEqual([])
	})

	it('derives nothing for a non-monster node and returns empty for null', () => {
		const b = book([node('root', 'sommaire'), node('child', 'choix')])
		expect(deriveMonsterEdges(b)).toEqual([])
		expect(deriveMonsterEdges(null)).toEqual([])
	})

	it('ignores stale monster config when the node actionType has been switched away from monstre', () => {
		// BookService does not clear sibling configs on actionType patch — a node may
		// carry node.monster while node.actionType is no longer monstre. Guard must prevent
		// phantom layout edges from firing for such stale configs.
		const stale: BookNode = {
			...monsterNode('x', { victoryTarget: 'suite' }),
			actionType: 'aucune', // switched away
		}
		const b = book([node('root', 'sommaire'), stale, node('suite', 'choix')])
		expect(deriveMonsterEdges(b)).toEqual([])
	})
})
