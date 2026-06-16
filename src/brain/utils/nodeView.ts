import type { BookNode } from '../types'
import { NODE_KINDS } from '../kinds'

/**
 * Shared node display helpers (used by the canvas card and the editor panel
 * header). The domain model stores a single authored `text` per node (no
 * separate title field), so the display title is the first non-empty line of
 * that text, falling back to the kind's `defaultTitle` from the kind registry
 * (KR-068) — the single per-kind table, no second copy here.
 */

/** Non-empty author lines of a node's text, trimmed. */
export function textLines(node: BookNode): string[] {
	return node.text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
}

export function nodeTitle(node: BookNode): string {
	const lines = textLines(node)
	return lines.length > 0 ? (lines[0] as string) : NODE_KINDS[node.kind].defaultTitle
}
