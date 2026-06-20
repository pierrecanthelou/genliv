import { collectObjects, collectLineageObjects, findObject } from './objects'
import type { Book, BookNode, Edge, GameObject, MonsterConfig } from '../types'

const obj = (id: string, name = id): GameObject => ({ id, name, description: '' })

/** A minimal valid monster carrying loot (the other combat fields are required). */
const monsterWithLoot = (name: string, loot: GameObject): MonsterConfig => ({
	name,
	pv: 1,
	attack: 1,
	defense: 1,
	outcomes: { reussite: '', echec: '' },
	loot,
})

function book(nodes: BookNode[], edges: Edge[] = []): Book {
	return { id: 'b', title: 'B', createdAt: '', updatedAt: '', nodes, edges }
}

const edge = (from: string, to: string, kind: Edge['kind'] = 'choice'): Edge => ({
	id: `${from}-${to}`,
	from,
	to,
	kind,
})

const takeable = (id: string): Partial<BookNode> => ({
	decor: { interaction: 'prendre', objects: [{ object: obj(id), kind: 'utile' }] },
})

function node(id: string, extra: Partial<BookNode> = {}): BookNode {
	return { id, kind: 'choix', text: '', ...extra }
}

describe('collectObjects (derived object catalog)', () => {
	it('gathers acquirable objects from décor takeables, a PNJ gift, and monster loot', () => {
		const b = book([
			node('n1', { decor: { interaction: 'prendre', objects: [{ object: obj('o1'), kind: 'utile' }] } }),
			node('n2', { pnj: { name: 'PNJ', dialogue: '', gift: { object: obj('o2'), effect: 'pv', value: 1 } } }),
			node('n3', { monster: monsterWithLoot('Gobelin', obj('o3')) }),
		])
		expect(
			collectObjects(b)
				.map((o) => o.id)
				.sort(),
		).toEqual(['o1', 'o2', 'o3'])
	})

	it('migrates the deprecated single décor object and de-dups by id', () => {
		const shared = obj('o1')
		const b = book([
			node('n1', { decor: { interaction: 'prendre', object: shared } }),
			// Same id reachable twice → appears once.
			node('n2', { decor: { interaction: 'prendre', objects: [{ object: shared, kind: 'utile' }] } }),
		])
		expect(collectObjects(b).map((o) => o.id)).toEqual(['o1'])
	})

	it('does not count a décor REFERENCE takeable as an authoring source (no phantom entry)', () => {
		const b = book([
			node('n1', { decor: { interaction: 'prendre', objects: [{ object: obj('o1'), kind: 'utile' }] } }),
			// n2 REUSES o1 by reference — it must not add a second/phantom entry.
			node('n2', { decor: { interaction: 'prendre', objects: [{ objectRef: 'o1', kind: 'utile' }] } }),
		])
		expect(collectObjects(b).map((o) => o.id)).toEqual(['o1'])
	})

	it('returns an empty catalog for a book with no objects (or a null book)', () => {
		expect(collectObjects(book([node('n1')]))).toEqual([])
		expect(collectObjects(null)).toEqual([])
	})

	it('findObject resolves a present id and returns null for a deleted/empty id', () => {
		const b = book([node('n1', { monster: monsterWithLoot('M', obj('o1', 'Clé')) })])
		expect(findObject(b, 'o1')?.name).toBe('Clé')
		expect(findObject(b, 'ghost')).toBeNull()
		expect(findObject(b, '')).toBeNull()
	})
})

describe('collectLineageObjects (lineage-scoped catalog, KR-118)', () => {
	// root → mid → leaf, plus a sibling branch off root and an unrelated island.
	const tree = (): Book =>
		book(
			[
				node('root', takeable('o_root')),
				node('mid', takeable('o_mid')),
				node('leaf'),
				node('sibling', takeable('o_sibling')),
				node('island', takeable('o_island')),
				node('lonely'),
			],
			[edge('root', 'mid'), edge('mid', 'leaf'), edge('root', 'sibling')],
		)

	it('offers only objects from the node and its ancestors, not siblings/descendants/islands', () => {
		const ids = collectLineageObjects(tree(), 'mid')
			.map((o) => o.id)
			.sort()
		// mid + its ancestor root — never the sibling, the unreached island, nor a
		// downstream leaf.
		expect(ids).toEqual(['o_mid', 'o_root'])
	})

	it('includes the node itself so an object taken on the current screen counts', () => {
		expect(collectLineageObjects(tree(), 'root').map((o) => o.id)).toEqual(['o_root'])
	})

	it('walks all ancestors and terminates on a cycle (relink back-edge)', () => {
		const cyclic = book(
			[node('a', takeable('o_a')), node('b', takeable('o_b'))],
			[edge('a', 'b'), edge('b', 'a', 'relink')],
		)
		expect(
			collectLineageObjects(cyclic, 'b')
				.map((o) => o.id)
				.sort(),
		).toEqual(['o_a', 'o_b'])
	})

	it('counts a node-local object even when the node has no ancestors (island)', () => {
		expect(collectLineageObjects(tree(), 'island')).toEqual([{ id: 'o_island', name: 'o_island', description: '' }])
	})

	it('returns an empty catalog for a node with no lineage objects or a null book', () => {
		// A downstream leaf with no own object still inherits its ancestors' objects.
		expect(
			collectLineageObjects(tree(), 'leaf')
				.map((o) => o.id)
				.sort(),
		).toEqual(['o_mid', 'o_root'])
		// A lonely node with no ancestors and no own object → nothing.
		expect(collectLineageObjects(tree(), 'lonely')).toEqual([])
		expect(collectLineageObjects(null, 'x')).toEqual([])
	})
})
