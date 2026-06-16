import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'
import { registerActionPnj } from '../register'

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

const pnjOf = (brain: ReturnType<typeof createBrain>, bookId: string, nodeId: string) =>
	brain.books.getBook(bookId)!.nodes.find((n) => n.id === nodeId)!.pnj

describe('action-pnj', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('self-registers a « PNJ » editor with the ActionRegistry and unregisters cleanly (KR-051)', () => {
		const brain = createBrain()
		const off = registerActionPnj(brain.actions)
		expect(brain.actions.get('pnj')?.label).toBe('PNJ')
		off()
		expect(brain.actions.get('pnj')).toBeNull()
	})

	it('offers « PNJ » in the action control and persists the name + a gift object via BookService', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'PNJ' }))

		await user.type(screen.getByRole('textbox', { name: /nom du pnj/i }), 'Le vieil ermite')
		expect(pnjOf(brain, bookId, nodeId)?.name).toBe('Le vieil ermite')

		// « Le PNJ donne un objet » reveals the SHARED ObjectEditor (reused from action-decor).
		await user.click(screen.getByRole('switch', { name: /donne un objet/i }))
		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), 'Amulette')

		const gift = pnjOf(brain, bookId, nodeId)?.gift
		expect(gift?.name).toBe('Amulette')
		expect(gift?.id).toBeTruthy() // stable id minted (KR-003)
	})

	it('removing the gift drops it from the node and hides the object editor', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'PNJ' }))
		await user.click(screen.getByRole('switch', { name: /donne un objet/i })) // on
		await user.click(screen.getByRole('switch', { name: /donne un objet/i })) // off

		expect(pnjOf(brain, bookId, nodeId)?.gift).toBeUndefined()
		expect(screen.queryByRole('textbox', { name: /nom de l/i })).not.toBeInTheDocument()
	})
})
