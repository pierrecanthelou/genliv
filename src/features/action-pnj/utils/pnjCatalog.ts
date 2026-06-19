import { getNode, type Book, type BookNode, type PnjConfig } from '../../../brain'

/** One reusable PNJ in the book — an « own » PNJ, keyed by its owner node id. */
export interface PnjEntry {
	/** The owner node's id — the PNJ's stable id for references (KR-003). */
	nodeId: string
	/** The PNJ's name (for the picker label). */
	name: string
	config: PnjConfig
}

/** Whether a PNJ config REUSES another node's PNJ (vs authoring its own). */
export function isRefPnj(pnj: PnjConfig | undefined): boolean {
	return pnj?.pnjRef !== undefined
}

/**
 * The book's reusable-PNJ catalog — a pure VIEW (KR-020): every OWN PNJ authored
 * on a node (actionType « pnj », not itself a reference), keyed by its owner node
 * id (the PNJ's stable id). References are skipped (a ref is not an authoring
 * source), so a reused PNJ is never a phantom second entry. Other features that
 * must REFERENCE a PNJ by id read this one catalog without a separate store.
 */
export function collectPnjs(book: Book | null): PnjEntry[] {
	if (book === null) return []
	const entries: PnjEntry[] = []
	for (const node of book.nodes) {
		if (node.actionType === 'pnj' && node.pnj !== undefined && node.pnj.pnjRef === undefined) {
			entries.push({ nodeId: node.id, name: node.pnj.name, config: node.pnj })
		}
	}
	return entries
}

/**
 * Resolve a node's EFFECTIVE PNJ config: its own config, or — for a reference —
 * the owner node's config, resolved live against the book. Returns null when a
 * reference dangles: the owner was deleted, is no longer a PNJ, or is itself a
 * reference (surfaced, never silently treated as present, KR-021).
 */
export function resolvePnj(book: Book | null, node: BookNode | null): PnjConfig | null {
	const pnj = node?.pnj
	if (pnj === undefined) return null
	if (pnj.pnjRef === undefined) return pnj
	const owner = getNode(book, pnj.pnjRef)
	if (owner?.pnj !== undefined && owner.actionType === 'pnj' && owner.pnj.pnjRef === undefined) {
		return owner.pnj
	}
	return null
}
