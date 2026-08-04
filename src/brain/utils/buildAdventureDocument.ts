import type { Book } from '../tree'
import type { PlayExport } from './playExport'
import { exportBookForPlay } from './playExport'

/**
 * Build an AdventureDocument from the current in-memory book — the same format
 * book-export writes to disk, but returned as a plain object (no download).
 * Used by the editor's « Aperçu du jeu » CTA to pass the draft to the play runtime
 * without an export step (src/player/ isolation, KR-131).
 */
export function buildAdventureDocument(book: Book): PlayExport {
	return exportBookForPlay(book)
}
