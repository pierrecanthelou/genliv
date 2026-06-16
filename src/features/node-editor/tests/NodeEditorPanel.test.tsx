import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'

function setup() {
	const brain = createBrain()
	const book = brain.books.createBook('La Caverne')
	brain.router.navigate({ name: 'editor', bookId: book.id })
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, book }
}

async function selectNode(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
	await user.click(screen.getByRole('button', { name }))
}

describe('node-editor panel', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('shows an empty-state prompt until a node is selected', () => {
		setup()
		expect(screen.getByText(/sélectionnez un nœud/i)).toBeInTheDocument()
	})

	it('opens populated with the selected node and edits Description through BookService', async () => {
		const user = userEvent.setup()
		const { brain, book } = setup()

		await selectNode(user, /Nœud #1 — Sommaire/)
		const description = screen.getByLabelText(/description/i)
		await user.type(description, 'Au seuil de la caverne.')

		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		expect(brain.books.getBook(book.id)?.nodes.find((n) => n.id === sommaireId)?.text).toBe('Au seuil de la caverne.')
	})

	it('toggling « Fin victoire » sets the end flag and flips the node badge to FIN', async () => {
		const user = userEvent.setup()
		const { brain, book } = setup()
		// « + Nœud » creates a free-floating node AND selects it (canvas owns selection).
		await user.click(screen.getByRole('button', { name: 'Ajouter un nœud' }))

		await user.click(screen.getByRole('switch', { name: /fin victoire/i }))

		const added = brain.books.getBook(book.id)!.nodes[2]
		expect(added.endVictory).toBe(true)
		// The badge now reads FIN (effectiveKind via node:updated) — panel header + canvas card.
		expect(screen.getAllByText(/fin · victoire/i).length).toBeGreaterThan(0)
	})

	it('emits action:changed and persists the action type when the SegmentedControl changes', async () => {
		// A PNJ action editor is registered (as action-pnj would) before render,
		// so the SegmentedControl offers it; node-editor stays Open/Closed (KR-051).
		const brain = createBrain()
		brain.actions.register({ type: 'pnj', label: 'PNJ', render: () => 'éditeur PNJ' })
		const book = brain.books.createBook('La Caverne')
		brain.router.navigate({ name: 'editor', bookId: book.id })
		let changed: string | null = null
		brain.events.on('action:changed', ({ actionType }) => {
			changed = actionType
		})
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: 'Ajouter un nœud' }))

		await user.click(screen.getByRole('radio', { name: 'PNJ' }))

		expect(changed).toBe('pnj')
		expect(brain.books.getBook(book.id)!.nodes[2].actionType).toBe('pnj')
	})

	it('hides choice-label, action, end toggles AND outgoing choices on the Mort node (KR-055), and closes via ✕', async () => {
		const user = userEvent.setup()
		setup()

		await selectNode(user, /Mort du personnage/)
		// Description stays editable (KR-002); everything structural is gone.
		expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
		expect(screen.queryByRole('switch')).toBeNull()
		expect(screen.queryByText(/action requise/i)).toBeNull()
		expect(screen.queryByText(/libellé du choix/i)).toBeNull()
		expect(screen.queryByText(/choix sortants/i)).toBeNull()

		await user.click(screen.getByRole('button', { name: /fermer l’éditeur/i }))
		expect(screen.getByText(/sélectionnez un nœud/i)).toBeInTheDocument()
	})

	it('hides choice-label, action and end toggles on the Sommaire root but keeps outgoing choices (KR-055)', async () => {
		const user = userEvent.setup()
		setup()

		await selectNode(user, /Sommaire/)
		expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
		expect(screen.queryByRole('switch')).toBeNull()
		expect(screen.queryByText(/action requise/i)).toBeNull()
		expect(screen.queryByText(/libellé du choix/i)).toBeNull()
		// The root leads into the story, so it DOES keep outgoing choices.
		expect(screen.getByText(/choix sortants/i)).toBeInTheDocument()
	})
})
