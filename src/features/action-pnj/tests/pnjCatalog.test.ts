import { collectPnjs, resolvePnj, isRefPnj } from '../utils/pnjCatalog'
import type { Book, BookNode, PnjConfig } from '../../../brain'

function node(id: string, pnj?: PnjConfig): BookNode {
	return { id, kind: 'pnj', text: '', actionType: pnj !== undefined ? 'pnj' : 'aucune', pnj }
}

function book(nodes: BookNode[]): Book {
	return { id: 'b', title: 'B', createdAt: '', updatedAt: '', nodes, edges: [] }
}

describe('pnjCatalog (reusable PNJ by reference)', () => {
	it('collectPnjs gathers OWN PNJs by owner node id, skipping references', () => {
		const b = book([
			node('n1', { name: 'Le Marchand', dialogue: 'Bonjour' }),
			node('n2', { pnjRef: 'n1', name: '', dialogue: '' }), // a reference — not an authoring source
			node('n3', { name: 'La Gardienne', dialogue: 'Halte' }),
			node('n4'), // not a PNJ
		])
		expect(collectPnjs(b).map((p) => ({ nodeId: p.nodeId, name: p.name }))).toEqual([
			{ nodeId: 'n1', name: 'Le Marchand' },
			{ nodeId: 'n3', name: 'La Gardienne' },
		])
	})

	it('isRefPnj distinguishes a reference from an own PNJ', () => {
		expect(isRefPnj({ name: 'X', dialogue: '' })).toBe(false)
		expect(isRefPnj({ pnjRef: 'n1', name: '', dialogue: '' })).toBe(true)
		expect(isRefPnj(undefined)).toBe(false)
	})

	it('resolvePnj returns the own config, or the owner config for a reference', () => {
		const owner = node('n1', { name: 'Le Marchand', dialogue: 'Bonjour' })
		const ref = node('n2', { pnjRef: 'n1', name: '', dialogue: '' })
		const b = book([owner, ref])
		expect(resolvePnj(b, owner)?.name).toBe('Le Marchand')
		expect(resolvePnj(b, ref)?.name).toBe('Le Marchand') // resolved live from the owner
	})

	it('resolvePnj returns null for a dangling reference (owner deleted or no longer a PNJ, KR-021)', () => {
		const ref = node('n2', { pnjRef: 'gone', name: '', dialogue: '' })
		expect(resolvePnj(book([ref]), ref)).toBeNull()
		// Owner exists but is no longer a PNJ → still dangling.
		const refToPlain = node('n3', { pnjRef: 'n4', name: '', dialogue: '' })
		expect(resolvePnj(book([refToPlain, node('n4')]), refToPlain)).toBeNull()
	})

	it('resolvePnj does not chain references (a ref to a ref dangles)', () => {
		const ref1 = node('n2', { pnjRef: 'n1', name: '', dialogue: '' })
		const refToRef = node('n3', { pnjRef: 'n2', name: '', dialogue: '' })
		expect(resolvePnj(book([ref1, refToRef]), refToRef)).toBeNull()
	})
})
