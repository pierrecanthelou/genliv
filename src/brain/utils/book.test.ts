import { getNode, getEdge } from './book'
import type { Book } from '../types'

const book: Book = {
	id: 'b',
	title: 'T',
	createdAt: '',
	updatedAt: '',
	nodes: [
		{ id: 'n1', kind: 'sommaire', text: '' },
		{ id: 'n2', kind: 'choix', text: '' },
	],
	edges: [{ id: 'e1', from: 'n1', to: 'n2', kind: 'choice' }],
}

describe('getNode / getEdge', () => {
	it('returns the matching node / edge by id', () => {
		expect(getNode(book, 'n2')?.kind).toBe('choix')
		expect(getEdge(book, 'e1')?.to).toBe('n2')
	})

	it('returns null for a missing id', () => {
		expect(getNode(book, 'ghost')).toBeNull()
		expect(getEdge(book, 'ghost')).toBeNull()
	})

	it('tolerates a null book (returns null)', () => {
		expect(getNode(null, 'n1')).toBeNull()
		expect(getEdge(null, 'e1')).toBeNull()
	})
})
