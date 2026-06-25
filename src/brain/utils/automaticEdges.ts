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

/**
 * Layout-hint edges derived from monster node configs — `victoryTarget` (routed
 * as `relink`) and `fleeTarget` (routed as `flee`). These fields are stored ON
 * the node (not as explicit edges), so the monster outcome nodes have NO incoming
 * authored edge and fall into the free grid when the canvas auto-lays-out. This
 * function promotes them: pass the result to `resolvePositions` so the layout
 * places them inside the tree, directly below their combat parent. Do NOT pass to
 * `resolveEdges` — no visual arrow is added (the MonsterEditor shows the targets
 * inline; the rendered canvas arrow is deferred to a later visual pass).
 */
export function deriveMonsterEdges(book: Book | null): Edge[] {
	if (book === null) return []
	const nodeIds = new Set(book.nodes.map((n) => n.id))
	const edges: Edge[] = []
	for (const node of book.nodes) {
		// Guard on the active actionType — stale monster config can survive a switch to
		// another action (BookService does not clear sibling config on actionType patch).
		if (node.actionType !== 'monstre') continue
		const { victoryTarget, fleeTarget } = node.monster ?? {}
		if (victoryTarget !== undefined && nodeIds.has(victoryTarget)) {
			edges.push({ id: `auto-victory-${node.id}`, from: node.id, to: victoryTarget, kind: 'relink' })
		}
		if (fleeTarget !== undefined && nodeIds.has(fleeTarget)) {
			edges.push({ id: `auto-flee-${node.id}`, from: node.id, to: fleeTarget, kind: 'flee' })
		}
	}
	return edges
}
