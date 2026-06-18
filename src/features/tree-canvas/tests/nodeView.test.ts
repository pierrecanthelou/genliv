import { nodeView } from '../layout/nodeView'
import { NODE_KINDS, type BookNode } from '../../../brain'

const node = (kind: BookNode['kind'], text = ''): BookNode => ({ id: 'n', kind, text })

describe('nodeView snippet (per-kind empty placeholder, KR-068)', () => {
	it('uses the kind registry placeholder for an empty node (sommaire vs others differ)', () => {
		const sommaire = nodeView(node('sommaire'))
		expect(sommaire.snippet).toBe(NODE_KINDS.sommaire.emptySnippet)
		expect(sommaire.snippetIsPlaceholder).toBe(true)

		const choix = nodeView(node('choix'))
		expect(choix.snippet).toBe(NODE_KINDS.choix.emptySnippet)
		expect(choix.snippetIsPlaceholder).toBe(true)

		// The two kinds carry distinct copy — proving it reads the registry, not a constant.
		expect(sommaire.snippet).not.toBe(choix.snippet)
	})

	it('shows the authored text (not a placeholder) when the node has a second line', () => {
		const view = nodeView(node('choix', 'Titre\nLe couloir descend.'))
		expect(view.snippet).toBe('Le couloir descend.')
		expect(view.snippetIsPlaceholder).toBe(false)
	})
})
