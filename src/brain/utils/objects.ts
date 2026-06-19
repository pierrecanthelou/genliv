import type { Book, GameObject } from '../types'

/**
 * The book's ACQUIRABLE-OBJECT CATALOG — a pure VIEW over the book (KR-020), not
 * an owned store: every object a player can pick up is authored on a node (décor
 * « prendre » takeables, a PNJ gift, a monster's loot) and already carries a
 * stable id (KR-003). This collects them, de-duplicated by id, so features that
 * must REFERENCE an object by id — the choice hidden-prerequisite (KR-062), and
 * later play mode — read one catalog without a separate store that could desync.
 */
export function collectObjects(book: Book | null): GameObject[] {
	if (book === null) return []
	// De-dup by id (an object could in principle appear once per source); first wins.
	const byId = new Map<string, GameObject>()
	const add = (obj: GameObject | undefined): void => {
		if (obj !== undefined && !byId.has(obj.id)) byId.set(obj.id, obj)
	}
	for (const node of book.nodes) {
		for (const takeable of node.decor?.objects ?? []) add(takeable.object)
		// The deprecated single décor object (pre-`objects` books, migrated on next write).
		add(node.decor?.object)
		add(node.pnj?.gift?.object)
		add(node.monster?.loot)
	}
	return [...byId.values()]
}

/**
 * Resolve an object id against the book's catalog, or null if it does not
 * resolve — a deleted object, or a not-yet-chosen prerequisite ('' id). Callers
 * surface the null as a dangling reference (KR-062/021), never as "met".
 */
export function findObject(book: Book | null, objectId: string): GameObject | null {
	if (objectId === '') return null
	return collectObjects(book).find((o) => o.id === objectId) ?? null
}
