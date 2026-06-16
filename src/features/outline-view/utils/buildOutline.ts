import type { Book, BookNode, EdgeKind } from '../../../brain'

/**
 * One line of the indented outline (§ 03). A normal row is a node detailed in
 * place; a `reference` row is a ↪ pointer to a node shown elsewhere (a relink/
 * flee edge, a convergence, or a cycle back-edge) and is never recursed into.
 */
export interface OutlineRow {
	/** Indentation depth (the root sommaire is 0). */
	depth: number
	/** True for a ↪ reference to a node detailed elsewhere — not recursed. */
	reference: boolean
	/** The edge kind that produced a reference row (labels it). */
	via?: EdgeKind
	/** The target node, or null when the edge points at a deleted node (KR-021). */
	node: BookNode | null
	/** Stable id this row refers to (kept even when the target is dangling). */
	targetId: string
}

/**
 * Flatten the book into an indented outline by depth-first traversal from the
 * `sommaire` root, following `choice` edges as the hierarchy. `relink`/`flee`
 * edges, convergences, and cycle back-edges become `reference` rows rather than
 * being recursed into — so a cyclic book (allowed by design, KR-061) can never
 * loop forever. Nodes unreachable from the root (the isolated `mort`, any
 * free-floating node) are listed flat afterwards, so the whole book shows
 * (KR-020). Pure and view-agnostic; the canvas and outline both read the SSOT.
 */
export function buildOutline(book: Book): OutlineRow[] {
	const byId = new Map(book.nodes.map((n) => [n.id, n]))
	const visited = new Set<string>()
	const rows: OutlineRow[] = []

	function visit(node: BookNode, depth: number): void {
		visited.add(node.id)
		rows.push({ depth, reference: false, node, targetId: node.id })
		for (const edge of book.edges.filter((e) => e.from === node.id)) {
			const target = byId.get(edge.to) ?? null
			if (edge.kind === 'choice' && target !== null && !visited.has(edge.to)) {
				visit(target, depth + 1)
			} else {
				// relink/flee, an already-shown target (convergence/cycle), or a
				// dangling edge → a reference row, never recursed (KR-061/021).
				rows.push({ depth: depth + 1, reference: true, via: edge.kind, node: target, targetId: edge.to })
			}
		}
	}

	const root = book.nodes.find((n) => n.kind === 'sommaire')
	if (root !== undefined) visit(root, 0)

	for (const node of book.nodes) {
		if (!visited.has(node.id)) visit(node, 0)
	}

	return rows
}
