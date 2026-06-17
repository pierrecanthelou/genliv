import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'
import { registerActionTrap } from '../register'

function setup() {
	const brain = createBrain()
	const created = brain.books.createBook('La Caverne')
	const node = brain.books.addNode(created.id, 'choix')!
	brain.router.navigate({ name: 'editor', bookId: created.id })
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, bookId: created.id, nodeId: node.id }
}

const trapOf = (brain: ReturnType<typeof createBrain>, bookId: string, nodeId: string) =>
	brain.books.getBook(bookId)!.nodes.find((n) => n.id === nodeId)!.trap

describe('action-trap', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('self-registers a « Piège » editor with the ActionRegistry and unregisters cleanly (KR-051)', () => {
		const brain = createBrain()
		const off = registerActionTrap(brain.actions)
		expect(brain.actions.get('piege')?.label).toBe('Piège')
		off()
		expect(brain.actions.get('piege')).toBeNull()
	})

	it('offers « Piège » and persists the description + réussite/échec texts + the fatal flag', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Piège' }))

		await user.type(screen.getByRole('textbox', { name: /description du piège/i }), 'Une dalle.')
		// The réussite/échec rows are the SHARED OutcomesEditor (reused from monster).
		await user.type(screen.getByRole('textbox', { name: /si Réussite/i }), 'Vous l’évitez.')
		await user.type(screen.getByRole('textbox', { name: /si Échec/i }), 'Les piques jaillissent.')
		// The « échec sanctionné » variant.
		await user.click(screen.getByRole('switch', { name: /mène à la mort/i }))

		const trap = trapOf(brain, bookId, nodeId)
		expect(trap?.description).toBe('Une dalle.')
		expect(trap?.outcomes.reussite).toBe('Vous l’évitez.')
		expect(trap?.outcomes.echec).toBe('Les piques jaillissent.')
		expect(trap?.fatal).toBe(true)
	})
})
