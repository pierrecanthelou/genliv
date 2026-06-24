import type { Book } from '../types'

/**
 * Versioned container for a scenario file (import/export, KR-143).
 * The `book` field is the raw authoring book — all nodes, edges, and action
 * configs. On import the book receives a fresh id; internal node/edge ids are
 * preserved (they are book-local, no cross-book collision risk).
 */
export interface ScenarioExport {
	format: 'genliv-scenario'
	version: 1
	exportedAt: string
	book: Book
}

/** Build a ScenarioExport from the current authored book. */
export function exportScenario(book: Book): ScenarioExport {
	return {
		format: 'genliv-scenario',
		version: 1,
		exportedAt: new Date().toISOString(),
		book,
	}
}

/** Type guard — validates that `data` is a well-formed ScenarioExport. */
export function isScenarioExport(data: unknown): data is ScenarioExport {
	if (typeof data !== 'object' || data === null) return false
	const d = data as Record<string, unknown>
	if (d['format'] !== 'genliv-scenario') return false
	if (d['version'] !== 1) return false
	const book = d['book']
	if (typeof book !== 'object' || book === null) return false
	const b = book as Record<string, unknown>
	if (typeof b['id'] !== 'string') return false
	if (typeof b['title'] !== 'string') return false
	if (!Array.isArray(b['nodes'])) return false
	if (!Array.isArray(b['edges'])) return false
	return true
}
