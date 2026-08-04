import type { GameObject } from '../types'
import type { Book } from '../tree'

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
 * The node ids of a node's LINEAGE — the node itself plus every node from which
 * it is reachable (its ancestors), by reverse-reachability over the book's edges.
 * Cycles (a `relink`/`flee` back-edge) are handled by the visited set, so the
 * walk always terminates. All edge kinds count: each is a forward player move, so
 * any of them can be part of the path the player took to reach this screen.
 */
function lineageNodeIds(book: Book, nodeId: string): Set<string> {
	const visited = new Set<string>([nodeId])
	const stack = [nodeId]
	while (stack.length > 0) {
		const current = stack.pop() as string
		for (const edge of book.edges) {
			if (edge.to === current && !visited.has(edge.from)) {
				visited.add(edge.from)
				stack.push(edge.from)
			}
		}
	}
	return visited
}

/**
 * Objects collectable in the LINEAGE leading to a node — every acquirable object
 * authored on a node from which `nodeId` is reachable (its ancestors), plus the
 * node itself (the player can pick up an object on the current screen before
 * choosing). The hidden-prerequisite picker (KR-118) offers only THESE: a player
 * can only own an object as a prerequisite for a choice if they could have found
 * it on the path they took to reach this screen — the whole-book catalog
 * (collectObjects) over-offers objects living in unrelated/downstream branches.
 *
 * Reuses collectObjects over the lineage-scoped node subset so the de-dup +
 * deprecated-field migration stay single-sourced. Config-target navigations not
 * yet promoted to edges (monster victoire/fuite, PNJ « mène à ») are out of the
 * lineage until they become real edges (KR-067) — a known under-approximation
 * that errs on the safe side (it can only HIDE a reachable object, never offer an
 * unreachable one), and an already-set reference is still resolved against the
 * full catalog so it is never dropped.
 */
export function collectLineageObjects(book: Book | null, nodeId: string): GameObject[] {
	if (book === null) return []
	const ids = lineageNodeIds(book, nodeId)
	return collectObjects({ ...book, nodes: book.nodes.filter((n) => ids.has(n.id)) })
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
