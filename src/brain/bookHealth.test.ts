import { checkBookHealth } from './utils/bookHealth'
import type { Book, BookNode, Edge } from './tree'

function makeBook(nodes: BookNode[], edges: Edge[] = []): Book {
	return { id: 'b1', title: 'Test', nodes, edges, createdAt: '2026-01-01', updatedAt: '2026-01-01' }
}

function node(id: string, kind: BookNode['kind'], extra: Partial<BookNode> = {}): BookNode {
	return { id, kind, text: id, ...extra }
}

function edge(id: string, from: string, to: string): Edge {
	return { id, from, to, kind: 'choice', label: 'Aller' }
}

describe('checkBookHealth', () => {
	it('returns no warnings for a fresh two-node book (sommaire + mort)', () => {
		const book = makeBook([node('s', 'sommaire'), node('m', 'mort', { locked: true })])
		expect(checkBookHealth(book)).toHaveLength(0)
	})

	it('does not flag sommaire as a dead-end even when it has no outgoing edges', () => {
		const book = makeBook([node('s', 'sommaire'), node('m', 'mort', { locked: true }), node('c', 'choix')])
		const warnings = checkBookHealth(book)
		expect(warnings.map((w) => w.nodeId)).not.toContain('s')
	})

	it('flags a choix node with no outgoing edges as a dead-end', () => {
		const book = makeBook([node('s', 'sommaire'), node('m', 'mort', { locked: true }), node('c', 'choix')])
		const warnings = checkBookHealth(book)
		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toMatchObject({ code: 'dead-end', nodeId: 'c' })
	})

	it('does not flag mort as a dead-end', () => {
		const book = makeBook([node('s', 'sommaire'), node('m', 'mort', { locked: true })])
		const warnings = checkBookHealth(book)
		expect(warnings.map((w) => w.nodeId)).not.toContain('m')
	})

	it('does not flag a node with endVictory as a dead-end', () => {
		const book = makeBook([node('s', 'sommaire'), node('f', 'fin', { endVictory: true })])
		expect(checkBookHealth(book)).toHaveLength(0)
	})

	it('does not flag a node with endFailure as a dead-end', () => {
		const book = makeBook([node('s', 'sommaire'), node('f', 'fin', { endFailure: true })])
		expect(checkBookHealth(book)).toHaveLength(0)
	})

	it('does not flag a monstre node with a victoryTarget set', () => {
		const book = makeBook([
			node('s', 'sommaire'),
			node('c', 'monstre', {
				monster: { name: 'Gobelin', pv: 10, outcomes: { reussite: 'ok', echec: 'non' }, victoryTarget: 'next' },
			}),
			node('next', 'fin', { endVictory: true }),
			node('m', 'mort', { locked: true }),
		])
		expect(checkBookHealth(book)).toHaveLength(0)
	})

	it('does not flag a monstre node with only fleeTarget set', () => {
		const book = makeBook(
			[
				node('s', 'sommaire'),
				node('c', 'monstre', {
					monster: { name: 'Gobelin', pv: 10, outcomes: { reussite: 'ok', echec: 'non' }, fleeTarget: 'next' },
				}),
				node('next', 'choix'),
				node('m', 'mort', { locked: true }),
			],
			[edge('e1', 'next', 's')],
		)
		expect(checkBookHealth(book).filter((w) => w.code === 'dead-end' && w.nodeId === 'c')).toHaveLength(0)
	})

	it('flags a monstre node with no victoryTarget and no outgoing edges', () => {
		const book = makeBook([
			node('s', 'sommaire'),
			node('c', 'monstre', { monster: { name: 'Gobelin', pv: 10, outcomes: { reussite: 'ok', echec: 'non' } } }),
			node('m', 'mort', { locked: true }),
		])
		const warnings = checkBookHealth(book)
		expect(warnings.some((w) => w.code === 'dead-end' && w.nodeId === 'c')).toBe(true)
	})

	it('does not flag a pnj node with a target set', () => {
		const book = makeBook(
			[
				node('s', 'sommaire'),
				node('p', 'pnj', {
					pnj: {
						name: 'Kael',
						dialogue: 'Bonjour',
						outcomes: { reussite: 'ok', echec: 'non' },
						target: 'next',
					} as BookNode['pnj'],
				}),
				node('next', 'choix'),
				node('m', 'mort', { locked: true }),
			],
			[edge('e1', 'next', 's')],
		)
		// 'next' has an outgoing edge so no dead-end; 'p' has target so no dead-end
		expect(checkBookHealth(book).filter((w) => w.nodeId === 'p')).toHaveLength(0)
	})

	it('does not flag a piege node with actionType=piege and trap.fatal=true', () => {
		const book = makeBook([
			node('s', 'sommaire'),
			node('t', 'piege', {
				actionType: 'piege',
				trap: { description: 'Piège', fatal: true, outcomes: { reussite: 'ok', echec: 'non' } },
			}),
			node('m', 'mort', { locked: true }),
		])
		expect(checkBookHealth(book).filter((w) => w.code === 'dead-end' && w.nodeId === 't')).toHaveLength(0)
	})

	it('does flag a piege node with trap.fatal=true but wrong actionType', () => {
		const book = makeBook([
			node('s', 'sommaire'),
			node('t', 'piege', {
				actionType: 'decor',
				trap: { description: 'Piège', fatal: true, outcomes: { reussite: 'ok', echec: 'non' } },
			}),
			node('m', 'mort', { locked: true }),
		])
		expect(checkBookHealth(book).some((w) => w.code === 'dead-end' && w.nodeId === 't')).toBe(true)
	})

	it('flags a piege node without fatal and no outgoing edges', () => {
		const book = makeBook([
			node('s', 'sommaire'),
			node('t', 'piege', { trap: { description: 'Piège', fatal: false, outcomes: { reussite: 'ok', echec: 'non' } } }),
			node('m', 'mort', { locked: true }),
		])
		const warnings = checkBookHealth(book)
		expect(warnings.some((w) => w.code === 'dead-end' && w.nodeId === 't')).toBe(true)
	})

	it('does not flag a piege node that has outgoing choice edges', () => {
		const book = makeBook(
			[
				node('s', 'sommaire'),
				node('t', 'piege', {
					trap: { description: 'Piège', fatal: false, outcomes: { reussite: 'ok', echec: 'non' } },
				}),
				node('n', 'choix'),
				node('m', 'mort', { locked: true }),
			],
			[edge('e1', 't', 'n'), edge('e2', 'n', 'm')],
		)
		// 'n' has an outgoing edge to 'm', and 't' has an outgoing edge to 'n'
		expect(checkBookHealth(book).filter((w) => w.code === 'dead-end')).toHaveLength(0)
	})

	it('flags an edge pointing to a non-existent node as dangling-edge-target', () => {
		const book = makeBook(
			[node('s', 'sommaire'), node('m', 'mort', { locked: true })],
			[{ id: 'e1', from: 's', to: 'ghost', kind: 'choice', label: 'Aller' }],
		)
		const warnings = checkBookHealth(book)
		expect(warnings).toHaveLength(1)
		expect(warnings[0]).toMatchObject({
			code: 'dangling-edge-target',
			nodeId: 's',
			edgeId: 'e1',
			ref: 'ghost',
		})
	})

	it('does not flag a decor node whose takeable has a fatal roll (objectTrap branch)', () => {
		const book = makeBook([
			node('s', 'sommaire'),
			node('d', 'decor', {
				actionType: 'decor',
				decor: {
					interaction: 'prendre',
					objects: [
						{
							kind: 'utile',
							roll: { trait: 'Agilite', fatal: true },
							object: { id: 'o1', name: 'Fiole', description: 'desc' },
						},
					],
				},
			}),
			node('m', 'mort', { locked: true }),
		])
		expect(checkBookHealth(book).filter((w) => w.code === 'dead-end' && w.nodeId === 'd')).toHaveLength(0)
	})

	it('flags a choice edge with no label as unlabeled-choice', () => {
		// 'c' also triggers dead-end (no outgoing edges); we check only the unlabeled-choice entry.
		const book = makeBook(
			[node('s', 'sommaire'), node('c', 'choix'), node('m', 'mort', { locked: true })],
			[{ id: 'e1', from: 's', to: 'c', kind: 'choice' }], // no label
		)
		const warnings = checkBookHealth(book)
		const w = warnings.find((x) => x.code === 'unlabeled-choice')
		expect(w).toMatchObject({ code: 'unlabeled-choice', nodeId: 's', edgeId: 'e1' })
	})

	it('flags a choice edge with an empty-string label as unlabeled-choice', () => {
		const book = makeBook(
			[node('s', 'sommaire'), node('c', 'choix'), node('m', 'mort', { locked: true })],
			[{ id: 'e1', from: 's', to: 'c', kind: 'choice', label: '' }],
		)
		expect(checkBookHealth(book).some((w) => w.code === 'unlabeled-choice')).toBe(true)
	})

	it('flags a choice edge with a whitespace-only label as unlabeled-choice', () => {
		const book = makeBook(
			[node('s', 'sommaire'), node('c', 'choix'), node('m', 'mort', { locked: true })],
			[{ id: 'e1', from: 's', to: 'c', kind: 'choice', label: '   ' }],
		)
		expect(checkBookHealth(book).some((w) => w.code === 'unlabeled-choice')).toBe(true)
	})

	it('does not flag a choice edge that has a non-empty label', () => {
		const book = makeBook(
			[node('s', 'sommaire'), node('c', 'choix'), node('m', 'mort', { locked: true })],
			[{ id: 'e1', from: 's', to: 'c', kind: 'choice', label: 'Entrer' }, edge('e2', 'c', 'm')],
		)
		expect(checkBookHealth(book).some((w) => w.code === 'unlabeled-choice')).toBe(false)
	})

	it('does not flag relink or flee edges for missing label', () => {
		const book = makeBook(
			[node('s', 'sommaire'), node('c', 'choix'), node('m', 'mort', { locked: true })],
			[
				{ id: 'e1', from: 's', to: 'c', kind: 'relink' },
				{ id: 'e2', from: 'c', to: 's', kind: 'flee' },
			],
		)
		expect(checkBookHealth(book).some((w) => w.code === 'unlabeled-choice')).toBe(false)
	})

	it('emits one unlabeled-choice warning per unlabeled edge when a node has multiple', () => {
		const book = makeBook(
			[node('s', 'sommaire'), node('a', 'choix'), node('b', 'choix'), node('m', 'mort', { locked: true })],
			[
				{ id: 'e1', from: 's', to: 'a', kind: 'choice' }, // no label
				{ id: 'e2', from: 's', to: 'b', kind: 'choice', label: '' }, // empty label
			],
		)
		const warnings = checkBookHealth(book).filter((w) => w.code === 'unlabeled-choice')
		expect(warnings).toHaveLength(2)
		expect(warnings.map((w) => w.edgeId).sort()).toEqual(['e1', 'e2'])
	})

	it('returns multiple warnings when there are multiple issues', () => {
		const book = makeBook(
			[node('s', 'sommaire'), node('c1', 'choix'), node('c2', 'choix'), node('m', 'mort', { locked: true })],
			[{ id: 'e1', from: 's', to: 'ghost', kind: 'choice', label: 'Aller' }],
		)
		const warnings = checkBookHealth(book)
		// dangling-edge-target for e1, dead-end for c1 and c2
		expect(warnings.filter((w) => w.code === 'dead-end')).toHaveLength(2)
		expect(warnings.filter((w) => w.code === 'dangling-edge-target')).toHaveLength(1)
	})
})
