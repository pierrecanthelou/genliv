import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'

function setup() {
	const brain = createBrain()
	const created = brain.books.createBook('La Caverne')
	const sommaire = brain.books.getBook(created.id)!.nodes.find((node) => node.kind === 'sommaire')!
	// Pre-seed a child branch BEFORE render so live views don't update outside act().
	brain.books.addChoiceBranch(created.id, sommaire.id)
	brain.router.navigate({ name: 'editor', bookId: created.id })
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, bookId: created.id, sommaire }
}

describe('outline-view', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('switches from the canvas to the indented outline via the view-mode switch', async () => {
		const user = userEvent.setup()
		setup()
		// Default is the canvas (the surface is present).
		expect(screen.getByTestId('canvas-surface')).toBeInTheDocument()

		await user.click(screen.getByRole('radio', { name: /Plan/ }))

		expect(screen.getByRole('tree', { name: /plan du livre/i })).toBeInTheDocument()
		expect(screen.queryByTestId('canvas-surface')).not.toBeInTheDocument()
		// The seeded Sommaire shows as an outline row (anchor the name end so the
		// collapse disclosure « Replier « Sommaire » » is not also matched).
		expect(screen.getByRole('button', { name: /Sommaire$/ })).toBeInTheDocument()
	})

	it('clicking an outline row selects its node through the shared SelectionService', async () => {
		const user = userEvent.setup()
		const { brain, sommaire } = setup()

		await user.click(screen.getByRole('radio', { name: /Plan/ }))
		await user.click(screen.getByRole('button', { name: /Sommaire$/ }))

		expect(brain.selection.getSelected()).toBe(sommaire.id)
	})

	it('collapses and expands a node, hiding and restoring its child rows', async () => {
		const user = userEvent.setup()
		const { brain, bookId } = setup()
		// Give the seeded child a recognisable title so we can assert its row.
		const child = brain.books.getBook(bookId)!.nodes.find((node) => node.kind === 'choix')!
		brain.books.updateNode(bookId, child.id, { text: 'Salle secrète' })

		await user.click(screen.getByRole('radio', { name: /Plan/ }))
		expect(screen.getByRole('button', { name: /Salle secrète/ })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /Replier « Sommaire »/ }))
		expect(screen.queryByRole('button', { name: /Salle secrète/ })).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /Déplier « Sommaire »/ }))
		expect(screen.getByRole('button', { name: /Salle secrète/ })).toBeInTheDocument()
	})

	it('previews a screen text as the row tooltip (hover preview)', async () => {
		const user = userEvent.setup()
		const { brain, bookId } = setup()
		const child = brain.books.getBook(bookId)!.nodes.find((node) => node.kind === 'choix')!
		brain.books.updateNode(bookId, child.id, { text: 'Une porte massive bloque le passage.' })

		await user.click(screen.getByRole('radio', { name: /Plan/ }))

		expect(screen.getByRole('button', { name: /Une porte massive/ })).toHaveAttribute(
			'title',
			expect.stringContaining('Une porte massive bloque le passage.'),
		)
	})

	it('renders a relink as a reference row whose tooltip jumps to the target', async () => {
		const user = userEvent.setup()
		// Seed a relink BEFORE render so live views never mutate outside act().
		// Relink A → B (a convergence between two children); structural screens are
		// never authored targets (KR-067), so we cannot relink back to the Sommaire.
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const sommaire = brain.books.getBook(created.id)!.nodes.find((node) => node.kind === 'sommaire')!
		const a = brain.books.addChoiceBranch(created.id, sommaire.id)!.node
		const b = brain.books.addChoiceBranch(created.id, sommaire.id)!.node
		brain.books.updateNode(created.id, a.id, { text: 'Carrefour' })
		brain.books.updateNode(created.id, b.id, { text: 'Salle B' })
		brain.books.addEdge(created.id, a.id, b.id, 'relink') // Carrefour ↪ Salle B
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		await user.click(screen.getByRole('radio', { name: /Plan/ }))

		// The ↪ reference row to Salle B (the ↪ glyph is aria-hidden, so the
		// accessible name is "Salle B (reliaison)") carries an "Aller au nœud" tooltip.
		const refRow = screen.getByRole('button', { name: /Salle B \(reliaison\)/ })
		expect(refRow).toHaveAttribute('title', expect.stringMatching(/Aller au nœud/))
	})

	it('shares selection with the canvas: a node picked in the outline is selected on the tree too', async () => {
		const user = userEvent.setup()
		setup()

		await user.click(screen.getByRole('radio', { name: /Plan/ }))
		await user.click(screen.getByRole('button', { name: /Sommaire$/ }))
		await user.click(screen.getByRole('radio', { name: /Arbre/ }))

		// Back on the canvas, the same node reads as selected (single SSOT, KR-024).
		expect(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ })).toHaveAttribute('aria-pressed', 'true')
	})

	it('previews a focused row in the node inspector (§ 03 B « entre depuis »)', async () => {
		// Pre-seed the child text BEFORE render so the live view never mutates outside act().
		const user = userEvent.setup()
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const sommaire = brain.books.getBook(created.id)!.nodes.find((n) => n.kind === 'sommaire')!
		const child = brain.books.addChoiceBranch(created.id, sommaire.id)!.node
		brain.books.updateNode(created.id, child.id, { text: 'Salle B' })
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)

		await user.click(screen.getByRole('radio', { name: /Plan/ }))
		await user.click(screen.getByRole('button', { name: /Salle B/ }))

		const inspector = screen.getByRole('complementary', { name: /aperçu du nœud/i })
		expect(inspector).toHaveTextContent(/entre depuis/i)
		// The seeded choice edge from the Sommaire is the one incoming link.
		expect(inspector).toHaveTextContent(/choix/i)
		expect(inspector).not.toHaveTextContent(/aucune entrée/i)
	})

	it('Éditer in the inspector selects the previewed (not yet selected) node', async () => {
		// Two children: select A, then hover B to preview it without selecting.
		const user = userEvent.setup()
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const sommaire = brain.books.getBook(created.id)!.nodes.find((n) => n.kind === 'sommaire')!
		const a = brain.books.addChoiceBranch(created.id, sommaire.id)!.node
		const b = brain.books.addChoiceBranch(created.id, sommaire.id)!.node
		brain.books.updateNode(created.id, a.id, { text: 'Salle A' })
		brain.books.updateNode(created.id, b.id, { text: 'Salle B' })
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)

		await user.click(screen.getByRole('radio', { name: /Plan/ }))
		await user.click(screen.getByRole('button', { name: /Salle A/ }))
		expect(brain.selection.getSelected()).toBe(a.id)

		// Hover B → the inspector previews it, but selection is still A.
		await user.hover(screen.getByRole('button', { name: /Salle B/ }))
		expect(brain.selection.getSelected()).toBe(a.id)

		await user.click(screen.getByRole('button', { name: 'Éditer' }))
		expect(brain.selection.getSelected()).toBe(b.id)
	})

	it('« Centrer dans l arbre » reveals the node on the canvas (switches view + selects)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const sommaire = brain.books.getBook(created.id)!.nodes.find((n) => n.kind === 'sommaire')!
		const child = brain.books.addChoiceBranch(created.id, sommaire.id)!.node
		brain.books.updateNode(created.id, child.id, { text: 'Salle B' })
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)

		await user.click(screen.getByRole('radio', { name: /Plan/ }))
		await user.click(screen.getByRole('button', { name: /Salle B/ }))
		await user.click(screen.getByRole('button', { name: /centrer dans l.arbre/i }))

		// Back on the canvas, with the previewed node now selected (shared SSOT).
		expect(screen.getByTestId('canvas-surface')).toBeInTheDocument()
		expect(brain.selection.getSelected()).toBe(child.id)
	})
})
