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

	it('persists a dragged node position (UIPreferencesService) and overrides its layout slot', () => {
		const { brain, book, selections } = setup()
		const sommaire = screen.getByRole('button', { name: /Sommaire/ })
		const beforeLeft = sommaire.style.left

		// jsdom has no PointerEvent, so dispatch coordinate-carrying MouseEvents typed
		// as pointer events (fireEvent act-wraps the dispatch). A press that travels
		// past the threshold is a drag, not a select.
		const ptr = (type: string, target: Element | Window, x: number, y: number): void =>
			void fireEvent(target, new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }))
		ptr('pointerdown', sommaire, 0, 0)
		ptr('pointermove', window, 80, 50)
		ptr('pointerup', window, 80, 50)

		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		const stored = brain.uiPreferences.getBookPrefs(book.id).positions?.[sommaireId]
		expect(stored).toBeDefined()
		// The card re-renders at the persisted (overridden) position, and the drag did
		// not register as a selection.
		expect(sommaire.style.left).not.toBe(beforeLeft)
		expect(selections).not.toContain(sommaireId)
	})

	it('persists the canvas/outline view-mode per book', async () => {
		const user = userEvent.setup()
		const { brain, book } = setup()
		expect(brain.uiPreferences.getBookPrefs(book.id).viewMode ?? 'canvas').toBe('canvas')

		await user.click(screen.getByRole('radio', { name: /Plan/ }))

		expect(brain.uiPreferences.getBookPrefs(book.id).viewMode).toBe('outline')
		// A re-render reads the persisted mode: the outline body is shown.
		expect(screen.getByRole('radio', { name: /Plan/ })).toHaveAttribute('aria-checked', 'true')
	})

	it('persists the canvas zoom per book', async () => {
		const user = userEvent.setup()
		const { brain, book } = setup()

		await user.click(screen.getByRole('button', { name: 'Zoom avant' }))

		expect(brain.uiPreferences.getBookPrefs(book.id).viewport?.zoom).toBeGreaterThan(1)
	})

	it('restores persisted view state on reload (a fresh App over the same store)', () => {
		// First "session": create a book and switch to the outline.
		const first = createBrain()
		const book = first.books.createBook('La Caverne')
		first.uiPreferences.setViewMode(book.id, 'outline')
		// "Reload": a brand-new brain (cold cache) over the same localStorage, opening
		// straight onto the editor route.
		const reloaded = createBrain({ initialRoute: { name: 'editor', bookId: book.id } })
		render(
			<BrainProvider brain={reloaded}>
				<App />
			</BrainProvider>,
		)
		// The persisted outline mode is read on mount (its radio is checked).
		expect(screen.getByRole('radio', { name: /Plan/ })).toHaveAttribute('aria-checked', 'true')
	})
})
