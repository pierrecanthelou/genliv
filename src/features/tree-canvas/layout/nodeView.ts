import { nodeTitle, textLines, type BookNode } from '../../../brain'

/**
 * Card text for a node: the shared title (from brain) plus a 1-line snippet
 * derived from the remaining authored text, falling back to an inviting
 * placeholder (project-wide empty-state rule).
 */

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
	const lines = textLines(node)
	const title = nodeTitle(node)
	if (lines.length > 1) {
		return { title, snippet: lines.slice(1).join(' '), snippetIsPlaceholder: false }
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
