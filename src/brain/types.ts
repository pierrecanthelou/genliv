/**
 * Domain model — the single thing that persists for a book is its
 * tree of nodes + edges. Everything else (canvas, outline, preview)
 * is a view over this. References are by stable id, never by name.
 */

/** Leaf kinds. `mort` is the locked, obligatory death leaf. */
export type NodeKind = 'sommaire' | 'choix' | 'pnj' | 'decor' | 'piege' | 'monstre' | 'fin' | 'mort'

/** Edges carry a kind: a `choice` is the labelled button in a parent screen. */
export type EdgeKind = 'choice' | 'relink' | 'flee'

/** Required-action slot on a node; concrete editors come from the ActionRegistry. */
export type NodeActionType = 'aucune' | 'pnj' | 'decor' | 'piege' | 'monstre'

export interface BookNode {
	id: string
	kind: NodeKind
	/** Author-written screen text. Empty on a freshly seeded node. */
	text: string
	/**
	 * Locked nodes (the `mort` leaf) cannot be deleted, duplicated or
	 * retyped — only their text is editable. See KR-002.
	 */
	locked?: boolean
	/** Canvas position; optional until tree-canvas owns layout. */
	position?: { x: number; y: number }
	/** End-leaf flags (Fin victoire / Fin échec). Drive the FIN badge (KR-054). */
	endVictory?: boolean
	endFailure?: boolean
	/** Required-action type to continue; defaults to 'aucune'. */
	actionType?: NodeActionType
}

export interface Edge {
	id: string
	from: string
	to: string
	kind: EdgeKind
	/** Player-facing choice label (for `choice` edges). */
	label?: string
}

export interface Book {
	id: string
	title: string
	createdAt: string
	updatedAt: string
	nodes: BookNode[]
	edges: Edge[]
}
