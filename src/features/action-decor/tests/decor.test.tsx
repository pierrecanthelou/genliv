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

type User = ReturnType<typeof userEvent.setup>

/** Select the seeded node and choose its « Décor » action (the registry seam). */
async function openDecor(user: User): Promise<void> {
	await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
	await user.click(screen.getByRole('radio', { name: 'Décor' }))
}

/** Add a takeable object through the modal: open, name it, save. */
async function addObject(user: User, name: string): Promise<void> {
	await user.click(screen.getByRole('button', { name: /Ajouter un objet/ }))
	await user.type(screen.getByRole('textbox', { name: /nom de l/i }), name)
	await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
}

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

	it('offers « Décor » and, on « Prendre », adds an object (modal) persisted via BookService with a stable id', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)

		expect(screen.getByRole('radio', { name: 'Prendre' })).toBeChecked()
		await addObject(user, 'Clé rouillée')

		const decor = decorOf(brain, bookId, nodeId)
		expect(decor?.interaction).toBe('prendre')
		expect(decor?.objects).toHaveLength(1)
		expect(decor?.objects?.[0].object.name).toBe('Clé rouillée')
		expect(decor?.objects?.[0].object.id).toBeTruthy() // stable id minted (KR-003)
		expect(decor?.objects?.[0].kind).toBe('utile') // default
	})

	it('cancelling the modal discards a new object (no write)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)

		await user.click(screen.getByRole('button', { name: /Ajouter un objet/ }))
		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), 'Jetable')
		await user.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(screen.queryByText('Jetable')).not.toBeInTheDocument()
		expect(decorOf(brain, bookId, nodeId)?.objects ?? []).toHaveLength(0)
	})

	it('lists several takeable objects as rows', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)

		await addObject(user, 'Clé rouillée')
		await addObject(user, 'Torche')

		expect(decorOf(brain, bookId, nodeId)?.objects).toHaveLength(2)
		expect(screen.getByText('Clé rouillée')).toBeInTheDocument()
		expect(screen.getByText('Torche')).toBeInTheDocument()
	})

	it('marks an object as a leurre and shows the badge', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)

		await user.click(screen.getByRole('button', { name: /Ajouter un objet/ }))
		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), 'Fausse piste')
		await user.click(screen.getByRole('radio', { name: 'leurre' }))
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

		expect(decorOf(brain, bookId, nodeId)?.objects?.[0].kind).toBe('leurre')
		expect(screen.getByText('leurre')).toBeInTheDocument()
	})

	it('removes an object from the list', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)
		await addObject(user, 'Clé rouillée')

		await user.click(screen.getByRole('button', { name: /Retirer « Clé rouillée »/ }))

		expect(decorOf(brain, bookId, nodeId)?.objects).toHaveLength(0)
		expect(screen.queryByText('Clé rouillée')).not.toBeInTheDocument()
	})

	it('reorders objects (move up) through BookService', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)
		await addObject(user, 'Premier')
		await addObject(user, 'Second')

		await user.click(screen.getByRole('button', { name: /Monter « Second »/ }))

		const names = decorOf(brain, bookId, nodeId)?.objects?.map((o) => o.object.name)
		expect(names).toEqual(['Second', 'Premier'])
	})

	it('captures a per-object « jet requis » (caractéristique + difficulté + échec)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)

		await user.click(screen.getByRole('button', { name: /Ajouter un objet/ }))
		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), 'Épée')
		await user.click(screen.getByRole('switch', { name: /jet requis/i }))
		await user.type(screen.getByRole('textbox', { name: /caractéristique/i }), 'Habileté')
		const difficulty = screen.getByRole('textbox', { name: /difficulté/i })
		await user.clear(difficulty)
		await user.type(difficulty, '8')
		await user.type(screen.getByRole('textbox', { name: /texte d/i }), 'Le mécanisme cède.')
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

		const roll = decorOf(brain, bookId, nodeId)?.objects?.[0].roll
		expect(roll).toEqual({ trait: 'Habileté', difficulty: 8, failureText: 'Le mécanisme cède.' })
	})

	it('switches the décor interaction and persists it, hiding the prendre list', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)
		await user.click(screen.getByRole('radio', { name: 'Écouter' }))

		expect(decorOf(brain, bookId, nodeId)?.interaction).toBe('ecouter')
		expect(screen.queryByRole('button', { name: /Ajouter un objet/ })).not.toBeInTheDocument()
	})
})
