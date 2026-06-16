import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'

function setup() {
	const brain = createBrain()
	const book = brain.books.createBook('La Caverne')
	brain.router.navigate({ name: 'editor', bookId: book.id })
	const selections: (string | null)[] = []
	brain.events.on('node:selected', ({ nodeId }) => selections.push(nodeId))
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, book, selections }
}

describe('tree-canvas', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('renders the book title, node count, and one card per seeded node', () => {
		setup()
		expect(screen.getByRole('heading', { name: 'La Caverne' })).toBeInTheDocument()
		expect(screen.getByText('2 nœuds')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Nœud #2 — Mort du personnage/ })).toBeInTheDocument()
	})

	it('shows the seeded Sommaire empty-state placeholder', () => {
		setup()
		expect(screen.getByText(/écrivez ici le texte d'introduction/i)).toBeInTheDocument()
	})

	it('selects a node on click (single-select) and emits node:selected', async () => {
		const user = userEvent.setup()
		const { selections } = setup()
		const sommaire = screen.getByRole('button', { name: /Sommaire/ })

		await user.click(sommaire)

		expect(sommaire).toHaveAttribute('aria-pressed', 'true')
		expect(selections[selections.length - 1]).toBeTruthy()
		// Single-select: the other node is not pressed.
		expect(screen.getByRole('button', { name: /Mort du personnage/ })).toHaveAttribute('aria-pressed', 'false')
	})

	it('clears selection when the empty canvas is clicked, emitting node:selected null', async () => {
		const user = userEvent.setup()
		const { selections } = setup()
		await user.click(screen.getByRole('button', { name: /Sommaire/ }))

		fireEvent.click(screen.getByTestId('canvas-surface'))

		expect(selections[selections.length - 1]).toBeNull()
		expect(screen.getByRole('button', { name: /Sommaire/ })).toHaveAttribute('aria-pressed', 'false')
	})

	it('« + Nœud » adds a node through BookService, selects it, and updates the count', async () => {
		const user = userEvent.setup()
		const { book, brain, selections } = setup()

		await user.click(screen.getByRole('button', { name: 'Ajouter un nœud' }))

		// Persisted via BookService (single source of truth), not a local copy.
		expect(brain.books.getBook(book.id)?.nodes).toHaveLength(3)
		expect(screen.getByText('3 nœuds')).toBeInTheDocument()
		const added = screen.getByRole('button', { name: /Nœud #3/ })
		expect(added).toHaveAttribute('aria-pressed', 'true')
		expect(selections[selections.length - 1]).toBeTruthy()
	})
})
