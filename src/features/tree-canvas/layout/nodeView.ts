import type { BookNode, NodeKind } from '../../../brain'

/**
 * Derive the human-facing card text from a node. The domain model stores a
 * single authored `text` per node (no separate title field yet), so the
 * card title is the first line of that text, falling back to a kind-based
 * placeholder that invites authoring (project-wide empty-state rule).
 */

const DEFAULT_TITLES: Record<NodeKind, string> = {
	sommaire: 'Sommaire',
	choix: 'Nouvel écran',
	pnj: 'Personnage',
	decor: 'Décor',
	piege: 'Piège',
	monstre: 'Monstre',
	fin: 'Fin',
	mort: 'Mort du personnage',
}

/** Inviting placeholder shown as the snippet of a node with no text yet. */
export const SOMMAIRE_PLACEHOLDER = "Écrivez ici le texte d'introduction…"
const EMPTY_SNIPPET = 'Écran sans texte — cliquez pour l’écrire…'

export interface NodeView {
	title: string
	snippet: string
	/** True when the snippet is a placeholder, not authored content. */
	snippetIsPlaceholder: boolean
}

export function nodeView(node: BookNode): NodeView {
	const lines = node.text.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
	const title = lines.length > 0 ? (lines[0] as string) : DEFAULT_TITLES[node.kind]
	if (lines.length > 1) {
		return { title, snippet: lines.slice(1).join(' '), snippetIsPlaceholder: false }
	}
	if (lines.length === 1) {
		// Single line is the title; no body snippet yet.
		return { title, snippet: node.kind === 'sommaire' ? SOMMAIRE_PLACEHOLDER : EMPTY_SNIPPET, snippetIsPlaceholder: true }
	}
	return {
		title,
		snippet: node.kind === 'sommaire' ? SOMMAIRE_PLACEHOLDER : EMPTY_SNIPPET,
		snippetIsPlaceholder: true,
	}
}

/** Stable display ref (#1, #2, …) from a node's index in the book's node list. */
export function nodeRef(index: number): string {
	return `#${index + 1}`
}
