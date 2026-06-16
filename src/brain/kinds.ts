import { type CSSProperties } from 'react'
import type { NodeKind, EdgeKind } from './types'

/**
 * Kind registries — the single source of per-kind knowledge (KR-068). Every
 * fact about a `NodeKind` (its badge label + CSS-drawn mark, its empty-state
 * title, and its structural/edge invariants) and every `EdgeKind` (its labels
 * + row tone) lives here, so a kind self-describes and consumers never branch
 * on the kind value with scattered `if (kind === …)` tests or partial maps.
 *
 * Adding a kind = adding ONE entry: the `Record<NodeKind, …>` /
 * `Record<EdgeKind, …>` types make every entry mandatory, so the compiler
 * flags a missing one instead of failing silently at runtime (the trap of the
 * old `Partial<Record<NodeKind, …>>` badge map). Same Open/Closed seam as the
 * ActionRegistry (KR-051), here for kind rendering + domain invariants.
 */

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

export const NODE_KINDS: Record<NodeKind, NodeKindDescriptor> = {
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
}

export interface EdgeKindDescriptor {
	/** Mono label on the choice row in « Choix sortants ». */
	rowLabel: string
	/** Row badge tone for this edge kind. */
	rowTone: 'neutral' | 'muted'
	/** Fallback label drawn on the canvas edge when the edge has no author label. */
	canvasLabel: string
}

export const EDGE_KINDS: Record<EdgeKind, EdgeKindDescriptor> = {
	choice: { rowLabel: 'choix', rowTone: 'neutral', canvasLabel: '→' },
	relink: { rowLabel: 'reliaison', rowTone: 'muted', canvasLabel: 'Reliaison ↻' },
	flee: { rowLabel: 'fuite', rowTone: 'muted', canvasLabel: 'Fuite ↻' },
}
