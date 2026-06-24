import type { Book, BookNode } from '../../../brain'

/** The role of a column entry — how it ended up here relative to the current path. */
export type ColumnEntryKind =
	| 'node' // normal selectable entry; can drill deeper
	| 'backlink' // ↩ target is an ancestor in the current navigation path (cycle)
	| 'reference' // ↪ target was already shown as a real entry in an earlier column

/** A monster combat outcome indicator (victoire / fuite) surfaced below a monster entry. */
export interface OutcomeIndicator {
	kind: 'victoire' | 'fuite'
	targetId: string
	/** Resolved target node, or null when the target was deleted (KR-021). */
	target: BookNode | null
}

/** One row in a column. */
export interface ColumnEntry {
	/** Resolved node, or null when the edge target was deleted (KR-021). */
	node: BookNode | null
	/** Stable target id kept even when the node is dangling. */
	targetId: string
	entryKind: ColumnEntryKind
	/** Column index where this node first appeared as a real entry (for ↪ references). */
	firstSeenColumn?: number
	/** Player-facing choice label from the edge (optional). */
	edgeLabel?: string
	/** Monster combat outcomes shown below the entry (victoire / fuite targets). */
	outcomes: OutcomeIndicator[]
}

/** One column in the Miller-columns view: the choice-children of one navigation step. */
export interface BookColumn {
	/** The parent node id whose choice-children fill this column. */
	parentId: string
	entries: ColumnEntry[]
}

/**
 * Build the ordered column list for the Miller-columns outline view.
 *
 * Each element of `path` corresponds to one column: column[i] lists the
 * choice-children of path[i]. Only `choice` edges participate in the column
 * hierarchy; `relink`/`flee`/`fatal` edges are excluded (they are convergences,
 * not hierarchy). Pure and view-agnostic (KR-020/013).
 *
 * Back-links and convergence detection:
 * - entryKind === 'backlink': the target is in path[0..i] (an ancestor of the
 *   current parent) — a choice-edge cycle going back up the path.
 * - entryKind === 'reference': the target was already shown as a real 'node'
 *   entry in an earlier column (convergence — the same node reached by two
 *   different branches).
 * - entryKind === 'node': everything else; seenAt tracks it so a later column
 *   can detect it as a reference.
 */
export function buildColumnNodes(book: Book, path: string[]): BookColumn[] {
	const byId = new Map(book.nodes.map((n) => [n.id, n]))

	// Index only choice edges (the column hierarchy) by source node.
	const choiceEdgesByFrom = new Map<string, Array<{ to: string; label?: string }>>()
	for (const edge of book.edges) {
		if (edge.kind !== 'choice') continue
		const list = choiceEdgesByFrom.get(edge.from) ?? []
		list.push({ to: edge.to, label: edge.label })
		choiceEdgesByFrom.set(edge.from, list)
	}

	// Track the column index at which each node first appeared as a real entry.
	const seenAt = new Map<string, number>()

	const columns: BookColumn[] = []

	for (let i = 0; i < path.length; i++) {
		const parentId = path[i] as string
		const outgoing = choiceEdgesByFrom.get(parentId) ?? []
		// Ancestors = path[0..i] inclusive; a child matching any of them is a back-link.
		const ancestors = new Set(path.slice(0, i + 1))
		const entries: ColumnEntry[] = []

		for (const { to: targetId, label: edgeLabel } of outgoing) {
			const node = byId.get(targetId) ?? null

			const outcomes: OutcomeIndicator[] = []
			if (node?.monster !== undefined) {
				if (node.monster.victoryTarget !== undefined) {
					outcomes.push({
						kind: 'victoire',
						targetId: node.monster.victoryTarget,
						target: byId.get(node.monster.victoryTarget) ?? null,
					})
				}
				if (node.monster.fleeTarget !== undefined) {
					outcomes.push({
						kind: 'fuite',
						targetId: node.monster.fleeTarget,
						target: byId.get(node.monster.fleeTarget) ?? null,
					})
				}
			}

			let entryKind: ColumnEntryKind
			let firstSeenColumn: number | undefined

			if (ancestors.has(targetId)) {
				entryKind = 'backlink'
			} else if (seenAt.has(targetId)) {
				entryKind = 'reference'
				firstSeenColumn = seenAt.get(targetId)
			} else {
				entryKind = 'node'
				seenAt.set(targetId, i)
			}

			entries.push({ node, targetId, entryKind, firstSeenColumn, edgeLabel, outcomes })
		}

		columns.push({ parentId, entries })
	}

	return columns
}

/**
 * BFS from `fromId` to `toId` following only `choice` edges. Returns the path
 * [fromId, ..., toId] if reachable, or null. Cycle-safe via a visited set
 * (KR-080). Used by OutlineColumns to reconcile an external canvas selection
 * with the current column navigation path.
 */
export function findChoicePath(book: Book, fromId: string, toId: string): string[] | null {
	if (fromId === toId) return [fromId]

	const nextIds = new Map<string, string[]>()
	for (const edge of book.edges) {
		if (edge.kind !== 'choice') continue
		const list = nextIds.get(edge.from) ?? []
		list.push(edge.to)
		nextIds.set(edge.from, list)
	}

	const visited = new Set<string>([fromId])
	const queue: Array<{ id: string; path: string[] }> = [{ id: fromId, path: [fromId] }]

	while (queue.length > 0) {
		const item = queue.shift()!
		for (const next of nextIds.get(item.id) ?? []) {
			if (next === toId) return [...item.path, toId]
			if (!visited.has(next)) {
				visited.add(next)
				queue.push({ id: next, path: [...item.path, next] })
			}
		}
	}

	return null
}
