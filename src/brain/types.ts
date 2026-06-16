/**
 * Domain model — the single thing that persists for a book is its
 * tree of nodes + edges. Everything else (canvas, outline, preview)
 * is a view over this. References are by stable id, never by name.
 */

/**
 * Node + edge kinds are PLAIN string literal unions (not classes): the book is
 * serialised to/from JSON by the PersistenceService, so a class hierarchy would
 * fight (de)serialisation. Both unions are derived from the keys of the
 * data-driven kind registry (`kinds.ts`, KR-068) — the single source for the
 * kind set AND its per-kind behaviour, the idiomatic alternative to "replace
 * conditional with polymorphism" for a serialised domain. Re-exported here so
 * the domain model reads as one piece.
 */
import type { NodeKind, EdgeKind } from './kinds'
export type { NodeKind, EdgeKind }

/** Required-action slot on a node; concrete editors come from the ActionRegistry. */
export type NodeActionType = 'aucune' | 'pnj' | 'decor' | 'piege' | 'monstre'

/**
 * A game object. The `name` is internal (author-facing); the `description` is
 * read by the player (domain rule, KR-052). Referenced by stable `id`, never by
 * name (KR-003). Shared shape edited through the brain ObjectEditor.
 */
export interface GameObject {
	id: string
	name: string
	description: string
}

/** Décor interaction: take an object, listen, or search (domain rule; KR-090). */
export type DecorInteraction = 'prendre' | 'ecouter' | 'fouiller'

/** Per-node décor action config (owned by action-decor). */
export interface DecorConfig {
	interaction: DecorInteraction
	/** For « prendre »: the object the player may take. */
	object?: GameObject
}

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
	/** Décor action config when `actionType === 'decor'` (owned by action-decor). */
	decor?: DecorConfig
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
