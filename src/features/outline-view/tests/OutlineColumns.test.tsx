import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'

function setup() {
	const brain = createBrain()
	const created = brain.books.createBook('Test')
	const sommaire = brain.books.getBook(created.id)!.nodes.find((n) => n.kind === 'sommaire')!
	// Pre-seed two children BEFORE render
	const branch1 = brain.books.addChoiceBranch(created.id, sommaire.id)!
	const branch2 = brain.books.addChoiceBranch(created.id, sommaire.id)!
	brain.books.updateNode(created.id, branch1.node.id, { text: 'Salle A' })
	brain.books.updateNode(created.id, branch2.node.id, { text: 'Salle B' })
	brain.router.navigate({ name: 'editor', bookId: created.id })
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, bookId: created.id, sommaire, a: branch1.node, b: branch2.node }
}

async function switchToOutline(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole('radio', { name: /Plan/ }))
}

async function switchToColumns(user: ReturnType<typeof userEvent.setup>) {
	await switchToOutline(user)
	await user.click(screen.getByRole('radio', { name: /⦿ Colonnes/i }))
}

describe('OutlineColumns', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('switching to Colonnes mode shows the first column with sommaire children', async () => {
		const user = userEvent.setup()
		setup()
		await switchToColumns(user)

		// Both children appear as navigable buttons in the column
		expect(screen.getByRole('button', { name: /Salle A/ })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /Salle B/ })).toBeInTheDocument()
	})

	it('clicking a child in col 0 opens col 1 with its children', async () => {
		const user = userEvent.setup()
		// Pre-seed the grandchild BEFORE render so the live view never mutates outside act().
		const brain = createBrain()
		const created = brain.books.createBook('Test2')
		const sommaire = brain.books.getBook(created.id)!.nodes.find((n) => n.kind === 'sommaire')!
		const a = brain.books.addChoiceBranch(created.id, sommaire.id)!.node
		brain.books.updateNode(created.id, a.id, { text: 'Salle A' })
		const grandchild = brain.books.addChoiceBranch(created.id, a.id)!.node
		brain.books.updateNode(created.id, grandchild.id, { text: 'Salle A1' })
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)

		await switchToColumns(user)
		await user.click(screen.getByRole('button', { name: /Salle A/ }))

		// The grandchild now appears in the second column
		expect(screen.getByRole('button', { name: /Salle A1/ })).toBeInTheDocument()
	})

	it('clicking a node calls SelectionService.select with its id', async () => {
		const user = userEvent.setup()
		const { brain, a } = setup()

		await switchToColumns(user)
		await user.click(screen.getByRole('button', { name: /Salle A/ }))

		expect(brain.selection.getSelected()).toBe(a.id)
	})

	it('a canvas selection of a choice-reachable node updates the column path', async () => {
		const user = userEvent.setup()
		const { brain, bookId, a } = setup()

		await switchToColumns(user)
		// Select Salle A from the brain directly (simulates a canvas click), wrapped in act.
		act(() => {
			brain.selection.select(bookId, a.id)
		})

		// Salle A should now be highlighted (it's in the active path)
		// The button should have aria-pressed true
		const btn = await screen.findByRole('button', { name: /Salle A/ })
		expect(btn).toHaveAttribute('aria-pressed', 'true')
		// The sommaire id is also in the path
		expect(brain.selection.getSelected()).toBe(a.id)
	})

	it('switching back to Liste restores the list view', async () => {
		const user = userEvent.setup()
		setup()
		await switchToColumns(user)

		// Switch back to Liste
		await user.click(screen.getByRole('radio', { name: /≡ Liste/i }))

		// The classic list tree is back
		expect(screen.getByRole('tree', { name: /plan du livre/i })).toBeInTheDocument()
	})

	it('display mode persists via UIPreferencesService (survives view switch)', async () => {
		const user = userEvent.setup()
		const { brain, bookId } = setup()

		await switchToColumns(user)
		expect(brain.uiPreferences.getBookPrefs(bookId).outlineDisplayMode).toBe('columns')

		// Switch to canvas and back — mode should still be columns
		await user.click(screen.getByRole('radio', { name: /Arbre/ }))
		await user.click(screen.getByRole('radio', { name: /Plan/ }))

		// The columns mode toggle should be active
		const colonnesBtn = screen.getByRole('radio', { name: /⦿ Colonnes/i })
		expect(colonnesBtn).toHaveAttribute('aria-checked', 'true')
	})

})
