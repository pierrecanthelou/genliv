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
		// Gated on the active ACTION (actionType), not node.kind — the action config
		// is keyed by actionType, and a node only carries a live config while that
		// action is its required action. Two fatal sources fold into ONE edge per
		// node (a node has a single actionType, so the branches never both fire):
		//   • a « Piège » action whose trap.fatal is set, and
		//   • a « Décor » « prendre » takeable whose jet requis is fatal (trap-on-object,
		//     action-trap iter 3) — taking it and failing the roll is lethal.
		const trapFatal = node.actionType === 'piege' && node.trap?.fatal === true
		const objectTrap = node.actionType === 'decor' && (node.decor?.objects ?? []).some((t) => t.roll?.fatal === true)
		if (trapFatal || objectTrap) {
			edges.push({ id: `auto-fatal-${node.id}`, from: node.id, to: mort.id, kind: 'fatal' })
		}
	}
	return edges
}
