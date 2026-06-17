import { useCallback } from 'react'
import { useBooks, useBrain, type Book } from '../../../brain'

export interface Library {
	/** Live list of all persisted books (newest first), a VIEW over BookService. */
	books: Book[]
	/** Open a book and navigate to its editor, in order, through brain only. */
	open: (id: string) => void
	/** Rename a book through BookService (trims; emits book:updated). */
	rename: (id: string, title: string) => void
	/** Duplicate a book and its tree through BookService (emits book:created). */
	duplicate: (id: string) => void
	/** Permanently delete a book through BookService (emits book:deleted). */
	remove: (id: string) => void
}

/**
 * Facade over brain for the library view: the live book list plus the open
 * and delete actions, all routed through brain contracts (BookService +
 * Router) so book-library never reaches into another feature. Open mirrors
 * the create flow: openBook (emits book:opened) then navigate, after the
 * read resolves (KR-004).
 */
export function useLibrary(): Library {
	const { books: bookService, router } = useBrain()
	const books = useBooks()

	const open = useCallback(
		(id: string) => {
			if (bookService.openBook(id) === null) return
			router.navigate({ name: 'editor', bookId: id })
		},
		[bookService, router],
	)

	const rename = useCallback(
		(id: string, title: string) => {
			bookService.renameBook(id, title)
		},
		[bookService],
	)

	const duplicate = useCallback(
		(id: string) => {
			bookService.duplicateBook(id)
		},
		[bookService],
	)

	const remove = useCallback((id: string) => bookService.deleteBook(id), [bookService])

	return { books, open, rename, duplicate, remove }
}
