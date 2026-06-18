import type { Book, Edge } from '../types'

/**
 * Automatic edges DERIVED from node configs — the « dedicated combat/trap path »
 * (KR-067) for links that must NOT be authored via the manual edge API (which
 * rejects a structural target like Mort). They are computed at the view from the
 * config (the SSOT), never stored, so they can never desync (KR-020/013).
 *
 * Iteration 2 (action-trap) derives the « échec sanctionné » link: a `piege`
 * node whose `trap.fatal` is set automatically leads to the `mort` leaf. The
 * helper generalises to the other deferred outcome targets (monster victoire/
 * fuite/défaite, PNJ « mène à ») — they fold in here as those promotions land.
 */
export function deriveAutomaticEdges(book: Book | null): Edge[] {
	if (book === null) return []
	const mort = book.nodes.find((n) => n.kind === 'mort')
	if (mort === undefined) return []

	const edges: Edge[] = []
	for (const node of book.nodes) {
		// « Variante piège — échec sanctionné » → automatic edge to Mort (KR-067).
		// Gated on the active trap ACTION (actionType), not node.kind — the action
		// config is keyed by actionType, and a node only carries a live trap while
		// « Piège » is its required action.
		if (node.actionType === 'piege' && node.trap?.fatal === true) {
			edges.push({ id: `auto-fatal-${node.id}`, from: node.id, to: mort.id, kind: 'fatal' })
		}
	}
	return edges
}
