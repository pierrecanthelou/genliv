import { selectVisibleBooks } from '../utils/selectVisibleBooks'
import { type Book } from '../../../brain'

/** Minimal Book fixture — only the fields selectVisibleBooks reads. */
function book(title: string, updatedAt: string): Book {
	return { id: title, title, createdAt: updatedAt, updatedAt, nodes: [], edges: [] }
}

describe('selectVisibleBooks', () => {
	const alpha = book('Alpha', '2026-01-01T00:00:00Z')
	const zebra = book('Zebra', '2026-03-01T00:00:00Z')
	const books = [alpha, zebra]

	it('returns all books (recent order) for an empty or whitespace query', () => {
		expect(selectVisibleBooks(books, '', 'recent')).toEqual([zebra, alpha])
		expect(selectVisibleBooks(books, '   ', 'recent')).toEqual([zebra, alpha])
	})

	it('filters by a case-insensitive title substring', () => {
		expect(selectVisibleBooks(books, 'ZEB', 'recent')).toEqual([zebra])
		expect(selectVisibleBooks(books, 'xyz', 'recent')).toEqual([])
	})

	it('orders by most-recently-modified (recent) or title (alpha)', () => {
		expect(selectVisibleBooks(books, '', 'recent')).toEqual([zebra, alpha])
		expect(selectVisibleBooks(books, '', 'alpha')).toEqual([alpha, zebra])
	})

	it('never mutates the input snapshot (sorts a copy)', () => {
		const input = [zebra, alpha]
		const before = [...input]
		selectVisibleBooks(input, '', 'alpha')
		expect(input).toEqual(before)
	})
})
