import { useBrain, exportScenario, downloadJson, slugifyFilename } from '../../../brain'

/**
 * book-export — download the raw authored book as a portable scenario file
 * (`*.scenario.json`). The play file (useExportBook) is the runtime-ready
 * stripped format; the scenario file is the full authoring format suitable
 * for re-import into Genliv. Returns null when the book cannot be read.
 */
export function useExportScenario(bookId: string): () => string | null {
	const { books } = useBrain()

	return function exportScenarioFile(): string | null {
		const book = books.getBook(bookId)
		if (book === null) return null
		const doc = exportScenario(book)
		const filename = `${slugifyFilename(book.title)}.scenario.json`
		downloadJson(filename, doc)
		return filename
	}
}
