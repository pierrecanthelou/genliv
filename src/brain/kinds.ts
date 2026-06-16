import { type CSSProperties } from 'react'

/**
 * Kind registries — the single source of per-kind knowledge (KR-068). Every
 * fact about a node kind (its badge label + CSS-drawn mark, its empty-state
 * title, and its structural/edge invariants) and every edge kind (its labels
 * + row tone) lives here, so a kind self-describes and consumers never branch
 * on the kind value with scattered `if (kind === …)` tests or partial maps.
 *
 * The registries are the SINGLE source even for the `NodeKind` / `EdgeKind`
 * union types: each is derived with `keyof typeof`, so the type and the table
 * can never drift. The `defineKinds` factory infers the key union while
 * pinning each entry to the descriptor shape — so adding a kind is ONE entry
 * (a missing field fails to compile; there is no separate union to keep in
 * sync, and no silent `Partial<Record>` gap). Same Open/Closed seam as the
 * ActionRegistry (KR-051), here for kind rendering + domain invariants.
 */

/** Identity factory: pins each value to `V` while inferring the key union `K`. */
const defineKinds =
	<V>() =>
	<K extends string>(map: Record<K, V>): Record<K, V> =>
		map

/** CSS-drawn badge mark: a styled box, or the special triangle for `piege`. */
export type BadgeMark = { shape: 'box'; style: CSSProperties } | { shape: 'triangle' }

export interface NodeKindDescriptor {
	/** Uppercase mono label on the NodeBadge. */
	label: string
	/** Inviting placeholder title when the node has no authored text yet. */
	defaultTitle: string
	/**
	 * Structural screens (the `sommaire` root, the `mort` leaf): text-only —
	 * no choice label / required action / end toggles, and never reinterpreted
	 * as a `fin` (KR-055). Drives the node-editor panel + effectiveKind + the
	 * text-only patch in BookService.updateNode.
	 */
	structural: boolean
	/** May this node have outgoing choices? `mort` may not (KR-055/060). */
	canHaveOutgoing: boolean
	/**
	 * May an authored `choice`/`relink` point AT this node? The `sommaire` root
	 * has no incoming choices and `mort` is reached only automatically in
	 * combat (KR-067).
	 */
	canBeTarget: boolean
	/** The CSS-drawn badge mark for this kind. */
	mark: BadgeMark
}

export const NODE_KINDS = defineKinds<NodeKindDescriptor>()({
	sommaire: {
		label: 'SOMMAIRE',
		defaultTitle: 'Sommaire',
		structural: true,
		canHaveOutgoing: true,
		canBeTarget: false,
		mark: { shape: 'box', style: { borderRadius: 2, background: 'var(--ink-0)' } },
	},
	choix: {
		label: 'CHOIX',
		defaultTitle: 'Nouvel écran',
		structural: false,
		canHaveOutgoing: true,
		canBeTarget: true,
		mark: { shape: 'box', style: { borderRadius: 2, border: '1.5px solid var(--ink-0)' } },
	},
	pnj: {
		label: 'PNJ',
		defaultTitle: 'Personnage',
		structural: false,
		canHaveOutgoing: true,
		canBeTarget: true,
		mark: { shape: 'box', style: { borderRadius: '50%', border: '1.5px solid var(--ink-0)' } },
	},
	decor: {
		label: 'DÉCOR',
		defaultTitle: 'Décor',
		structural: false,
		canHaveOutgoing: true,
		canBeTarget: true,
		mark: { shape: 'box', style: { borderRadius: 2, border: '1.5px dashed var(--ink-0)' } },
	},
	piege: {
		label: 'PIÈGE',
		defaultTitle: 'Piège',
		structural: false,
		canHaveOutgoing: true,
		canBeTarget: true,
		mark: { shape: 'triangle' },
	},
	monstre: {
		label: 'MONSTRE',
		defaultTitle: 'Monstre',
		structural: false,
		canHaveOutgoing: true,
		canBeTarget: true,
		mark: {
			shape: 'box',
			style: { background: 'repeating-linear-gradient(45deg,var(--ink-0) 0 2px,transparent 2px 4px)' },
		},
	},
	fin: {
		label: 'FIN',
		defaultTitle: 'Fin',
		structural: false,
		canHaveOutgoing: true,
		canBeTarget: true,
		mark: { shape: 'box', style: { border: '2px double var(--ink-0)' } },
	},
	mort: {
		label: 'MORT',
		defaultTitle: 'Mort du personnage',
		structural: true,
		canHaveOutgoing: false,
		canBeTarget: false,
		mark: {
			shape: 'box',
			style: { background: 'repeating-linear-gradient(45deg,var(--ink-4) 0 1.5px,transparent 1.5px 3px)' },
		},
	},
})

/** Node leaf kinds — derived from the registry keys (`mort` is the locked death leaf). */
export type NodeKind = keyof typeof NODE_KINDS

export interface EdgeKindDescriptor {
	/** Mono label on the choice row in « Choix sortants ». */
	rowLabel: string
	/** Row badge tone for this edge kind. */
	rowTone: 'neutral' | 'muted'
	/** Fallback label drawn on the canvas edge when the edge has no author label. */
	canvasLabel: string
}

export const EDGE_KINDS = defineKinds<EdgeKindDescriptor>()({
	choice: { rowLabel: 'choix', rowTone: 'neutral', canvasLabel: '→' },
	relink: { rowLabel: 'reliaison', rowTone: 'muted', canvasLabel: 'Reliaison ↻' },
	flee: { rowLabel: 'fuite', rowTone: 'muted', canvasLabel: 'Fuite ↻' },
})

/** Edge kinds — derived from the registry keys. A `choice` is a labelled button. */
export type EdgeKind = keyof typeof EDGE_KINDS

/**
 * Runtime guards for the trust boundary (KR-116). TypeScript erases the
 * `NodeKind`/`EdgeKind` annotations, so a kind read from persisted JSON could
 * be anything; a direct `NODE_KINDS[kind]` on an unknown value yields
 * `undefined` and the next property access throws. These guards let the
 * persistence boundary validate kinds (`hasOwnProperty`, not `in`, so the
 * Object prototype's members like `toString` are never mistaken for kinds).
 */
export function isNodeKind(value: unknown): value is NodeKind {
	return typeof value === 'string' && Object.prototype.hasOwnProperty.call(NODE_KINDS, value)
}

export function isEdgeKind(value: unknown): value is EdgeKind {
	return typeof value === 'string' && Object.prototype.hasOwnProperty.call(EDGE_KINDS, value)
}
