import { nodeTitle, textLines, NODE_KINDS, type BookNode } from '../../../brain'

/**
 * Card text for a node: the shared title (from brain) plus a 1-line snippet
 * derived from the remaining authored text, falling back to the kind's inviting
 * empty-state placeholder (project-wide empty-state rule). The per-kind
 * placeholder copy lives on the kind registry (KR-068), not an inline
 * `kind === 'sommaire'` test here.
 */

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
		snippet: NODE_KINDS[node.kind].emptySnippet,
		snippetIsPlaceholder: true,
	}
}

/** Stable display ref (#1, #2, …) from a node's index in the book's node list. */
export function nodeRef(index: number): string {
	return `#${index + 1}`
}
