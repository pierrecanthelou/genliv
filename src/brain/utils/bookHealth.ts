import type { Book, BookNode } from '../tree'
import { nodeTitle } from './nodeView'

export type StructuralWarningCode = 'dead-end' | 'dangling-edge-target' | 'unlabeled-choice'

/**
 * One structural problem found in the book during live authoring (KR-145).
 * `nodeId` is always the node to highlight in the canvas / outline.
 * `edgeId` / `ref` carry the broken edge and missing target id when relevant.
 */
export interface StructuralWarning {
	code: StructuralWarningCode
	message: string
	/** Node to highlight — the source of the structural problem. Always set. */
	nodeId: string
	/** The edge involved (dangling-edge-target and unlabeled-choice). */
	edgeId?: string
	/** The unresolved target id (dangling-edge-target only). */
	ref?: string
}

function isTerminal(node: BookNode): boolean {
	return node.kind === 'mort' || node.endVictory === true || node.endFailure === true
}

/**
 * True when the node has at least one configured exit path:
 * - A stored authored edge (choice / relink / flee) going out.
 * - A monster victoryTarget (config-driven post-combat exit, not a stored edge).
 * - A PNJ with `pnj.target` set (config-driven screen-change). A `pnjRef`-only PNJ
 *   with no target and no outgoing edge is deliberately treated as a dead-end.
 * - A piège action with `trap.fatal = true` (échec→Mort derived, KR-067).
 * - A décor action with at least one fatal-roll takeable (objectTrap branch of
 *   deriveAutomaticEdges — a failed roll on that object is also lethal, KR-067).
 */
function hasConfiguredExit(node: BookNode, nodesWithOutgoing: Set<string>): boolean {
	if (nodesWithOutgoing.has(node.id)) return true
	if (node.monster?.victoryTarget || node.monster?.fleeTarget) return true
	if (node.pnj?.target) return true
	// Mirror deriveAutomaticEdges (KR-067): piège with fatal=true auto-routes to Mort on failure.
	if (node.actionType === 'piege' && node.trap?.fatal === true) return true
	// Mirror the objectTrap branch from deriveAutomaticEdges (KR-067): a décor action
	// whose « prendre » takeable has a fatal roll auto-routes to Mort on failure.
	if (node.actionType === 'decor' && (node.decor?.objects ?? []).some((t) => t.roll?.fatal === true)) return true
	return false
}

/**
 * Check a book for structural issues that block or strand the player (KR-145).
 *
 * - **dead-end**: a non-terminal, non-root node has no configured exit; the player
 *   would hit « Pas de sortie depuis cet écran ». The sommaire root is exempt —
 *   a fresh book always starts with an unconnected root.
 * - **dangling-edge-target**: an authored edge points to a deleted or missing node.
 *
 * Pure — no side effects, no I/O. Safe to run on every book change.
 * Each warning's `nodeId` is always set so canvas/outline can highlight directly.
 */
export function checkBookHealth(book: Book): StructuralWarning[] {
	const warnings: StructuralWarning[] = []
	const nodeIds = new Set(book.nodes.map((n) => n.id))
	// Set of node ids that have at least one stored outgoing edge.
	const nodesWithOutgoing = new Set(book.edges.map((e) => e.from))

	const titleOf = (id: string): string => {
		const node = book.nodes.find((n) => n.id === id)
		return node !== undefined ? nodeTitle(node) : id
	}

	// Dangling edge targets: edge.to references a node that no longer exists.
	for (const edge of book.edges) {
		if (!nodeIds.has(edge.to)) {
			warnings.push({
				code: 'dangling-edge-target',
				message: `Un choix depuis « ${titleOf(edge.from)} » mène vers un écran inexistant.`,
				nodeId: edge.from,
				edgeId: edge.id,
				ref: edge.to,
			})
		}
	}

	// Unlabeled choice buttons: a `choice` edge with no label renders as a blank
	// button in play mode. Only `choice` edges are player-visible; `relink` and
	// `flee` are routing-only and never rendered as buttons (domain rules).
	for (const edge of book.edges) {
		if (edge.kind !== 'choice') continue
		if (edge.label !== undefined && edge.label.trim() !== '') continue
		warnings.push({
			code: 'unlabeled-choice',
			message: `L'écran « ${titleOf(edge.from)} » a un bouton de choix sans texte.`,
			nodeId: edge.from,
			edgeId: edge.id,
		})
	}

	// Dead ends: non-terminal, non-root nodes with no exit.
	for (const node of book.nodes) {
		if (isTerminal(node)) continue
		// Sommaire is the root; an unconnected root on a fresh book is expected.
		if (node.kind === 'sommaire') continue
		if (!hasConfiguredExit(node, nodesWithOutgoing)) {
			warnings.push({
				code: 'dead-end',
				message: `L'écran « ${titleOf(node.id)} » n'a aucune sortie définie.`,
				nodeId: node.id,
			})
		}
	}

	return warnings
}
