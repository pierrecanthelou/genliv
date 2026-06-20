import { useBrain, exportBookForPlay, downloadJson, slugifyFilename } from '../../../brain'

/** Outcome of an export attempt: the file name written + how many dangling refs were surfaced. */
export interface ExportResult {
	filename: string
	warnings: number
}

/**
 * book-export — turn the authored book into a downloaded play file. Reads the
 * book from the SSOT (BookService, KR-020), builds the play-ready document with
 * the pure brain transform (exportBookForPlay), and downloads it as JSON. The
 * export is non-blocking (user decision): it always succeeds and reports the
 * count of surfaced dangling references (KR-021) so the caller can signal them.
 * Emits `book:exported` AFTER the download is triggered (KR-004 order). Returns
 * null when the book cannot be read (nothing is exported).
 */
export function useExportBook(bookId: string): () => ExportResult | null {
	const { books, events } = useBrain()

	return function exportBook(): ExportResult | null {
		const book = books.getBook(bookId)
		if (book === null) return null
		const doc = exportBookForPlay(book)
		const filename = `${slugifyFilename(book.title)}.jeu.json`
		downloadJson(filename, doc)
		events.emit('book:exported', { bookId, warnings: doc.warnings.length })
		return { filename, warnings: doc.warnings.length }
	}
}
