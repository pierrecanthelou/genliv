import { collectObjects, findObject } from './objects'
import type { Book, BookNode, GameObject, MonsterConfig } from '../types'

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

function book(nodes: BookNode[]): Book {
	return { id: 'b', title: 'B', createdAt: '', updatedAt: '', nodes, edges: [] }
}

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
