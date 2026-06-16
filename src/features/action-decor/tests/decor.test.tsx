import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'
import { registerActionDecor } from '../register'

function setup() {
	const brain = createBrain()
	const created = brain.books.createBook('La Caverne')
	// A regular (non-structural) node, so the « Action requise » section shows.
	const node = brain.books.addNode(created.id, 'choix')!
	brain.router.navigate({ name: 'editor', bookId: created.id })
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, bookId: created.id, nodeId: node.id }
}

const decorOf = (brain: ReturnType<typeof createBrain>, bookId: string, nodeId: string) =>
	brain.books.getBook(bookId)!.nodes.find((n) => n.id === nodeId)!.decor

describe('action-decor', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('self-registers a « Décor » editor with the ActionRegistry and unregisters cleanly (KR-051)', () => {
		const brain = createBrain()
		const off = registerActionDecor(brain.actions)
		expect(brain.actions.get('decor')?.label).toBe('Décor')
		off()
		expect(brain.actions.get('decor')).toBeNull()
	})

	it('offers « Décor » in the action control and, on « Prendre », edits an object persisted via BookService', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		// Select the node (canvas card) so the node-editor panel shows its actions.
		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		// Décor is offered only because the feature registered it (the seam).
		await user.click(screen.getByRole('radio', { name: 'Décor' }))

		// « Prendre » is the default interaction → the shared ObjectEditor is shown.
		expect(screen.getByRole('radio', { name: 'Prendre' })).toBeChecked()
		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), 'Clé rouillée')

		const decor = decorOf(brain, bookId, nodeId)
		expect(decor?.interaction).toBe('prendre')
		expect(decor?.object?.name).toBe('Clé rouillée')
		expect(decor?.object?.id).toBeTruthy() // stable id minted (KR-003)
	})

	it('switches the décor interaction and persists it, hiding the object editor', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Décor' }))
		await user.click(screen.getByRole('radio', { name: 'Écouter' }))

		expect(decorOf(brain, bookId, nodeId)?.interaction).toBe('ecouter')
		expect(screen.queryByRole('textbox', { name: /nom de l/i })).not.toBeInTheDocument()
	})
})
