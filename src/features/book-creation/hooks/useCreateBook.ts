import { useCallback } from 'react'
import { useBrain } from '../../../brain'

/**
 * Orchestrates the create flow through brain contracts only. Persistence
 * happens inside BookService.createBook, which emits `book:created`; we
 * then openBook (emits `book:opened`) and navigate — strictly in that
 * order, only after the write resolves (KR-004).
 */
export function useCreateBook(): (title: string) => void {
	const { books, router } = useBrain()

	return useCallback(
		(title: string) => {
			const book = books.createBook(title)
			books.openBook(book.id)
			router.navigate({ name: 'editor', bookId: book.id })
		},
		[books, router],
	)
}
