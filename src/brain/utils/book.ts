import type { Book, BookNode, Edge } from '../tree'

/**
 * Lookups that hide the book's internal shape: callers ask « give me node/edge X »
 * without depending on `nodes`/`edges` being arrays searched linearly (Law of
 * Demeter; lets a future id-index slot in behind these signatures). Tolerate a
 * null book so view code can drop its `book?.…find(…) ?? null` boilerplate.
 */
export function getNode(book: Book | null, id: string): BookNode | null {
	return book?.nodes.find((n) => n.id === id) ?? null
}

export function getEdge(book: Book | null, id: string): Edge | null {
	return book?.edges.find((e) => e.id === id) ?? null
}
