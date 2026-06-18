import { getNode, nodeTitle, type Book, type EdgeKind } from '../../../brain'

/** A link into the inspected node: who leads here, and by what edge kind. */
export interface IncomingLink {
	fromId: string
	/** Source node title, or null when the source was deleted (KR-021). */
	title: string | null
	via: EdgeKind
}

/** A combat outcome edge out of the inspected node (monster victoire / fuite). */
export interface OutcomeLink {
	outcome: 'victoire' | 'fuite'
	targetId: string
	/** Target node title, or null when the target was deleted (KR-021). */
	title: string | null
}

/** The § 03 B node-card summary: a node's structural relations. */
export interface NodeInspection {
	incoming: IncomingLink[]
	outcomes: OutcomeLink[]
}

/**
 * Build the node inspector summary (wireframe § 03 B) for one node: « entre
 * depuis » (every edge pointing AT it, by kind) and its combat outcomes
 * (« victoire » / « fuite » targets on a monstre node). Pure and view-agnostic
 * (like buildOutline) so the relation logic is unit-tested once. References are
 * resolved by stable id; a deleted source/target surfaces as a null title, never
 * a crash (KR-021). Returns empty sections for an unknown or relation-less node.
 */
export function buildNodeInspector(book: Book, nodeId: string): NodeInspection {
	const node = getNode(book, nodeId)
	if (node === null) return { incoming: [], outcomes: [] }

	const titleOf = (id: string): string | null => {
		const target = getNode(book, id)
		return target !== null ? nodeTitle(target) : null
	}

	const incoming: IncomingLink[] = book.edges
		.filter((e) => e.to === nodeId)
		.map((e) => ({ fromId: e.from, title: titleOf(e.from), via: e.kind }))

	// Combat outcomes live on the monstre config (action-monster); other kinds
	// have none — their outgoing structure is already the outline's nesting.
	const outcomes: OutcomeLink[] = []
	const monster = node.monster
	if (monster !== undefined) {
		if (monster.victoryTarget !== undefined)
			outcomes.push({ outcome: 'victoire', targetId: monster.victoryTarget, title: titleOf(monster.victoryTarget) })
		if (monster.fleeTarget !== undefined)
			outcomes.push({ outcome: 'fuite', targetId: monster.fleeTarget, title: titleOf(monster.fleeTarget) })
	}

	return { incoming, outcomes }
}
