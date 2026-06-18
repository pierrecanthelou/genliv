import { deriveAutomaticEdges } from './automaticEdges'
import type { Book, BookNode, TrapConfig } from '../types'

function node(id: string, kind: BookNode['kind'], extra: Partial<BookNode> = {}): BookNode {
	return { id, kind, text: '', ...extra }
}

function trap(fatal: boolean): TrapConfig {
	return { description: '', outcomes: { reussite: '', echec: '' }, fatal }
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
})
