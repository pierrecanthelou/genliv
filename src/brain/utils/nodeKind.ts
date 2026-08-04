import type { NodeKind } from '../types'
import type { BookNode } from '../tree'
import { isStructural } from '../kinds'

/**
 * The kind a node should DISPLAY as. A regular leaf flagged « Fin victoire »
 * or « Fin échec » reads as a `fin` everywhere (badge on canvas, outline, and
 * the panel header) — the end flags are the single source of truth (KR-054).
 * Structural roots/leaves (`sommaire`, `mort`) are never reinterpreted: the
 * guard makes that invariant explicit via the `isStructural` registry predicate
 * rather than testing the kind value (KR-068).
 */
export function effectiveKind(node: BookNode): NodeKind {
	if (isStructural(node.kind)) return node.kind
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
