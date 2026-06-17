import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type BookNode } from '../../../brain'
import { App } from '../../../App'
import { registerActionPnj } from '../register'
import { GiftSection } from '../components/GiftSection'
import { TargetPicker } from '../components/TargetPicker'

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

type User = ReturnType<typeof userEvent.setup>

async function openPnj(user: User): Promise<void> {
	await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
	await user.click(screen.getByRole('radio', { name: 'PNJ' }))
}

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

	it('persists the name + dialogue and a gift object (effect defaults +1 PV) with a stable id', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openPnj(user)

		await user.type(screen.getByRole('textbox', { name: /nom du pnj/i }), 'Le vieil ermite')
		await user.type(screen.getByRole('textbox', { name: /dialogue/i }), 'Approche.')
		expect(pnjOf(brain, bookId, nodeId)?.name).toBe('Le vieil ermite')
		expect(pnjOf(brain, bookId, nodeId)?.dialogue).toBe('Approche.')

		await user.click(screen.getByRole('switch', { name: /donne un objet/i }))
		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), 'Amulette')

		const gift = pnjOf(brain, bookId, nodeId)?.gift
		expect(gift?.object.name).toBe('Amulette')
		expect(gift?.object.id).toBeTruthy() // stable id minted (KR-003)
		expect(gift?.effect).toBe('pv')
		expect(gift?.value).toBe(1)

		// The id is preserved across a further edit, not regenerated (KR-003).
		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), ' ancienne')
		expect(pnjOf(brain, bookId, nodeId)?.gift?.object.name).toBe('Amulette ancienne')
		expect(pnjOf(brain, bookId, nodeId)?.gift?.object.id).toBe(gift!.object.id)
	})

	it('changes the gift effect and steps its value', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openPnj(user)
		await user.click(screen.getByRole('switch', { name: /donne un objet/i }))

		await user.click(screen.getByRole('radio', { name: 'Défense' }))
		expect(pnjOf(brain, bookId, nodeId)?.gift?.effect).toBe('defense')

		await user.click(screen.getByRole('button', { name: /augmenter la valeur/i }))
		expect(pnjOf(brain, bookId, nodeId)?.gift?.value).toBe(2)
		await user.click(screen.getByRole('button', { name: /diminuer la valeur/i }))
		expect(pnjOf(brain, bookId, nodeId)?.gift?.value).toBe(1)
	})

	it('hides the value stepper for a plot object (objet de scénario)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openPnj(user)
		await user.click(screen.getByRole('switch', { name: /donne un objet/i }))

		await user.click(screen.getByRole('radio', { name: 'Scénario' }))

		expect(pnjOf(brain, bookId, nodeId)?.gift?.effect).toBe('scenario')
		expect(screen.queryByRole('button', { name: /augmenter la valeur/i })).not.toBeInTheDocument()
	})

	it('removing the gift drops it from the node and hides the object editor', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openPnj(user)
		await user.click(screen.getByRole('switch', { name: /donne un objet/i })) // on
		await user.click(screen.getByRole('switch', { name: /donne un objet/i })) // off

		expect(pnjOf(brain, bookId, nodeId)?.gift).toBeUndefined()
		expect(screen.queryByRole('textbox', { name: /nom de l/i })).not.toBeInTheDocument()
	})

	it('wires « ensuite le PNJ mène à » to another node and can clear it', async () => {
		// Seed a second, named node BEFORE render so it is a valid target candidate.
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const node = brain.books.addNode(created.id, 'choix')!
		const next = brain.books.addNode(created.id, 'choix')!
		brain.books.updateNode(created.id, next.id, { text: 'Salle du trésor' })
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'PNJ' }))

		// Structural Sommaire/Mort are excluded (KR-067); only « Salle du trésor » is a candidate.
		await user.click(screen.getByRole('button', { name: /Aucune suite/i }))
		await user.click(screen.getByRole('button', { name: 'Salle du trésor' }))
		expect(pnjOf(brain, created.id, node.id)?.target).toBe(next.id)

		// Clearing restores « aucune suite » (exact name → the picker button, not the canvas card).
		await user.click(screen.getByRole('button', { name: 'Salle du trésor' }))
		await user.click(screen.getByRole('button', { name: /Aucune suite/i }))
		expect(pnjOf(brain, created.id, node.id)?.target).toBeUndefined()
	})

	it('re-clamps the gift value when switching from a plot object to a stat effect', async () => {
		const user = userEvent.setup()
		const onChange = jest.fn()
		// A migrated legacy gift carries value 0 with effect 'scenario'.
		render(
			<GiftSection
				gift={{ object: { id: 'o1', name: 'X', description: '' }, effect: 'scenario', value: 0 }}
				onChange={onChange}
			/>,
		)

		await user.click(screen.getByRole('radio', { name: 'PV' }))

		expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ effect: 'pv', value: 1 }))
	})

	it('surfaces a deleted « mène à » target, never silently broken (KR-021/063)', () => {
		const nodes: BookNode[] = [{ id: 'n1', kind: 'choix', text: '' }]
		render(<TargetPicker nodes={nodes} nodeId="n1" target="ghost" onChange={() => {}} />)

		expect(screen.getByRole('button', { name: /cible supprimée/i })).toBeInTheDocument()
	})
})
