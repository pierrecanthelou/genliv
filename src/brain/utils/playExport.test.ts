import { exportBookForPlay, PLAY_EXPORT_FORMAT, PLAY_EXPORT_VERSION } from './playExport'
import type { GameObject } from '../types'
import type { Book, BookNode, Edge } from '../tree'

const obj = (id: string, name = id): GameObject => ({ id, name, description: '' })

function node(id: string, extra: Partial<BookNode> = {}): BookNode {
	return { id, kind: 'choix', text: '', ...extra }
}

const edge = (id: string, from: string, to: string, extra: Partial<Edge> = {}): Edge => ({
	id,
	from,
	to,
	kind: 'choice',
	...extra,
})

function book(nodes: BookNode[], edges: Edge[] = []): Book {
	return { id: 'b1', title: 'La Caverne', createdAt: '', updatedAt: '', nodes, edges }
}

describe('exportBookForPlay (play-ready export transform)', () => {
	it('stamps the format + version + book identity', () => {
		const doc = exportBookForPlay(book([node('sommaire', { kind: 'sommaire' })]))
		expect(doc.format).toBe(PLAY_EXPORT_FORMAT)
		expect(doc.version).toBe(PLAY_EXPORT_VERSION)
		expect(doc.book).toEqual({ id: 'b1', title: 'La Caverne' })
		expect(typeof doc.exportedAt).toBe('string')
	})

	it('strips the editor-only position from nodes but keeps all play data', () => {
		const doc = exportBookForPlay(book([node('n1', { text: 'Salle', endVictory: true, position: { x: 10, y: 20 } })]))
		expect(doc.nodes[0]).not.toHaveProperty('position')
		expect(doc.nodes[0].text).toBe('Salle')
		expect(doc.nodes[0].endVictory).toBe(true)
	})

	it('folds the config-derived fatal edge (échec→Mort) into the edge list', () => {
		const b = book(
			[
				node('start'),
				node('trap', {
					kind: 'piege',
					actionType: 'piege',
					trap: { description: '', outcomes: { reussite: '', echec: '' }, fatal: true },
				}),
				node('mort', { kind: 'mort', locked: true }),
			],
			[edge('e1', 'start', 'trap')],
		)
		const doc = exportBookForPlay(b)
		// The authored edge plus a derived fatal edge to the Mort leaf.
		expect(doc.edges).toHaveLength(2)
		expect(doc.edges.some((e) => e.kind === 'fatal' && e.from === 'trap' && e.to === 'mort')).toBe(true)
	})

	it('resolves the acquirable-object catalog', () => {
		const b = book([
			node('n1', { decor: { interaction: 'prendre', objects: [{ object: obj('o1', 'Clé'), kind: 'utile' }] } }),
		])
		expect(exportBookForPlay(b).objects).toEqual([obj('o1', 'Clé')])
	})

	it('exports cleanly (no warnings) for a fully-wired book', () => {
		const b = book([node('a'), node('b')], [edge('e1', 'a', 'b')])
		expect(exportBookForPlay(b).warnings).toEqual([])
	})

	it('surfaces a dangling edge target', () => {
		const doc = exportBookForPlay(book([node('a')], [edge('e1', 'a', 'ghost', { label: 'Aller' })]))
		expect(doc.warnings).toHaveLength(1)
		expect(doc.warnings[0]).toMatchObject({ code: 'dangling-edge-target', edgeId: 'e1', ref: 'ghost' })
	})

	it('surfaces an unconfigured and a dangling hidden-prereq object', () => {
		const b = book(
			[node('a'), node('b'), node('c')],
			[edge('e1', 'a', 'b', { prereq: { objectId: '' } }), edge('e2', 'a', 'c', { prereq: { objectId: 'gone' } })],
		)
		const codes = exportBookForPlay(b).warnings.map((w) => w.code)
		expect(codes).toContain('unconfigured-prereq')
		expect(codes).toContain('dangling-prereq-object')
	})

	it('surfaces an unconfigured and a dangling countdown fallback', () => {
		const b = book(
			[node('a'), node('b'), node('c')],
			[
				edge('e1', 'a', 'b', { countdown: { delay: 15, fallback: '' } }),
				edge('e2', 'a', 'c', { countdown: { delay: 15, fallback: 'gone' } }),
			],
		)
		const codes = exportBookForPlay(b).warnings.map((w) => w.code)
		expect(codes).toContain('unconfigured-countdown')
		expect(codes).toContain('dangling-countdown-fallback')
	})

	it('surfaces dangling monster/pnj targets and a décor object reference', () => {
		const b = book([
			node('m', {
				kind: 'monstre',
				actionType: 'monstre',
				monster: {
					name: 'Gobelin',
					pv: 1,
					attack: 1,
					defense: 1,
					outcomes: { reussite: '', echec: '' },
					victoryTarget: 'gone',
					fleeTarget: 'gone2',
				},
			}),
			node('p', { kind: 'pnj', actionType: 'pnj', pnj: { name: 'Marchand', dialogue: '', target: 'gone3' } }),
			node('d', {
				actionType: 'decor',
				decor: { interaction: 'prendre', objects: [{ objectRef: 'gone4', kind: 'utile' }] },
			}),
		])
		const codes = exportBookForPlay(b).warnings.map((w) => w.code)
		expect(codes.filter((c) => c === 'dangling-monster-target')).toHaveLength(2)
		expect(codes).toContain('dangling-pnj-target')
		expect(codes).toContain('dangling-object-ref')
	})
})
