import type { BookNode, NodeKind } from '../types'

/**
 * Shared node display helpers (used by the canvas card and the editor panel
 * header). The domain model stores a single authored `text` per node (no
 * separate title field), so the display title is the first non-empty line of
 * that text, falling back to a kind-based placeholder that invites authoring.
 */
export const DEFAULT_NODE_TITLES: Record<NodeKind, string> = {
	sommaire: 'Sommaire',
	choix: 'Nouvel écran',
	pnj: 'Personnage',
	decor: 'Décor',
	piege: 'Piège',
	monstre: 'Monstre',
	fin: 'Fin',
	mort: 'Mort du personnage',
}

/** Non-empty author lines of a node's text, trimmed. */
export function textLines(node: BookNode): string[] {
	return node.text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
}

export function nodeTitle(node: BookNode): string {
	const lines = textLines(node)
	return lines.length > 0 ? (lines[0] as string) : DEFAULT_NODE_TITLES[node.kind]
}
