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

	it('captures the skill roll: caractéristique select + difficulté (§ 05)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Piège' }))

		// Default roll is Habileté / 7; change the caractéristique and step the difficulty.
		await user.click(screen.getByRole('radio', { name: 'Endurance' }))
		await user.click(screen.getByRole('button', { name: /augmenter Difficulté/i }))

		const roll = trapOf(brain, bookId, nodeId)?.roll
		expect(roll?.trait).toBe('endurance')
		expect(roll?.difficulty).toBe(8) // default 7 → 8
	})

	it('migrates a pre-roll trap: fills the default roll without clobbering other fields (KR-116)', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const node = brain.books.addNode(created.id, 'choix')!
		// Seed a skeleton trap WITHOUT a roll (the pre-iteration-1 shape).
		brain.books.updateNode(created.id, node.id, {
			trap: { description: 'Dalle', outcomes: { reussite: 'ok', echec: 'aïe' }, fatal: true },
		})
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Piège' }))

		// The default roll surfaces (Habileté selected) without losing the seeded fields.
		expect(screen.getByRole('radio', { name: 'Habileté' })).toBeChecked()
		await user.click(screen.getByRole('button', { name: /augmenter Difficulté/i }))

		const trap = trapOf(brain, created.id, node.id)
		expect(trap?.roll).toEqual({ trait: 'habilete', difficulty: 8 })
		expect(trap?.description).toBe('Dalle')
		expect(trap?.outcomes).toEqual({ reussite: 'ok', echec: 'aïe' })
		expect(trap?.fatal).toBe(true)
	})

	it('« échec sanctionné »: the fatal flag draws the automatic →Mort link on the canvas (iter 2, KR-067)', async () => {
		const user = userEvent.setup()
		// Seed a trap action node BEFORE render so the live view never mutates outside act().
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const node = brain.books.addNode(created.id, 'choix')!
		brain.books.updateNode(created.id, node.id, {
			actionType: 'piege',
			trap: { description: 'Dalle', outcomes: { reussite: '', echec: '' }, fatal: false },
		})
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)

		// No automatic link while the trap is not fatal.
		expect(screen.queryByText(/✕ Mort/)).not.toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Piège' }))
		await user.click(screen.getByRole('switch', { name: /mène à la mort/i }))

		// The derived fatal edge now renders on the canvas (its « ✕ Mort » chip).
		expect(screen.getByText('✕ Mort')).toBeInTheDocument()
	})
})
