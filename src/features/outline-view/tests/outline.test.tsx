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
		// The seeded Sommaire shows as an outline row.
		expect(screen.getByRole('button', { name: /Sommaire/ })).toBeInTheDocument()
	})

	it('clicking an outline row selects its node through the shared SelectionService', async () => {
		const user = userEvent.setup()
		const { brain, sommaire } = setup()

		await user.click(screen.getByRole('radio', { name: /Plan/ }))
		await user.click(screen.getByRole('button', { name: /Sommaire/ }))

		expect(brain.selection.getSelected()).toBe(sommaire.id)
	})

	it('shares selection with the canvas: a node picked in the outline is selected on the tree too', async () => {
		const user = userEvent.setup()
		setup()

		await user.click(screen.getByRole('radio', { name: /Plan/ }))
		await user.click(screen.getByRole('button', { name: /Sommaire/ }))
		await user.click(screen.getByRole('radio', { name: /Arbre/ }))

		// Back on the canvas, the same node reads as selected (single SSOT, KR-024).
		expect(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ })).toHaveAttribute('aria-pressed', 'true')
	})
})
