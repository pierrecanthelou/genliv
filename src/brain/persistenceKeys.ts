/**
 * Single auditable location for every storage key (KR-011/111). Feature
 * code must never touch raw localStorage — it goes through
 * PersistenceService and these key builders only.
 *
 * Sensitive credentials (PAT, OAuth tokens, API keys) must be registered
 * here with a SENSITIVE marker (KR-114). None yet.
 */
export const PERSISTENCE_PREFIX = 'genliv'

/** Prefix shared by every persisted book, for listing via keys(prefix). */
export const BOOK_KEY_PREFIX = `${PERSISTENCE_PREFIX}:book:`

/** Storage key for a single book, keyed by its stable id (never its title). */
export function bookKey(bookId: string): string {
	return `${BOOK_KEY_PREFIX}${bookId}`
}
