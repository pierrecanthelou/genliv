import type { BookNode, NodeKind } from '../types'

/**
 * The kind a node should DISPLAY as. A regular leaf flagged « Fin victoire »
 * or « Fin échec » reads as a `fin` everywhere (badge on canvas, outline, and
 * the panel header) — the end flags are the single source of truth (KR-054).
 * Structural roots/leaves (`sommaire`, `mort`) are never reinterpreted.
 */
export function effectiveKind(node: BookNode): NodeKind {
	if (node.kind === 'sommaire' || node.kind === 'mort') return node.kind
	if (node.endVictory === true || node.endFailure === true) return 'fin'
	return node.kind
}

/** Optional FIN sub-label (« FIN · VICTOIRE » / « FIN · ÉCHEC ») for badges. */
export function endLabel(node: BookNode): string | undefined {
	if (effectiveKind(node) !== 'fin') return undefined
	if (node.endVictory === true && node.endFailure !== true) return 'FIN · VICTOIRE'
	if (node.endFailure === true && node.endVictory !== true) return 'FIN · ÉCHEC'
	return 'FIN'
}
