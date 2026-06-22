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

/**
 * The cloud-sync OFFLINE QUEUE: writes pushed-but-not-yet-confirmed, persisted
 * LOCALLY (in the genliv namespace, not the transport's fake-remote namespace)
 * so pending changes survive a reload and flush on reconnect (cloud-sync iter 2).
 * Not a book key, so it never pollutes listBooks (keys(BOOK_KEY_PREFIX)).
 */
export const CLOUDSYNC_QUEUE_KEY = `${PERSISTENCE_PREFIX}:cloudsync:queue`

/**
 * Per-book UI PREFERENCES — pan/zoom, the canvas↔outline view-mode, and dragged
 * node positions (tree-canvas iter 3). These are PER-DEVICE view state, NOT part
 * of the synced book document (KR-022): UIPreferencesService writes them through
 * the RAW local store, so they never enter the cloud queue. The `ui:` namespace
 * keeps them out of listBooks (keys(BOOK_KEY_PREFIX) never matches `genliv:ui:`).
 */
export const UI_PREFS_KEY_PREFIX = `${PERSISTENCE_PREFIX}:ui:book:`

/** Storage key for one book's UI preferences, keyed by its stable id. */
export function uiPrefsKey(bookId: string): string {
	return `${UI_PREFS_KEY_PREFIX}${bookId}`
}

/**
 * The reusable MONSTER LIBRARY (action-monster iter 3) — saved monsters reusable
 * ACROSS books (« la librairie du générateur »). Persisted in the genliv
 * namespace via the raw local store (cross-device sync is out of scope); not a
 * book key, so listBooks never matches it.
 */
export const MONSTER_LIBRARY_KEY = `${PERSISTENCE_PREFIX}:monster-library`

/**
 * One-time SEED marker for the bestiary (§ 4, game system). The 23 canonical
 * monsters are seeded into the library on first run; this flag records that the
 * seed ran, so a user who later DELETES bestiary entries does not get them
 * re-injected on the next launch. Not a book key.
 */
export const MONSTER_LIBRARY_SEEDED_KEY = `${PERSISTENCE_PREFIX}:monster-library:seeded`
