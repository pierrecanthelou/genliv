import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'
import { registerActionDecor } from '../register'
import { revealsOf } from '../utils/takeables'

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

	it('« Écouter »: authors a reveal text and gates it behind a skill roll with réussite/échec (iter 2)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)
		await user.click(screen.getByRole('radio', { name: 'Écouter' }))

		await user.type(screen.getByRole('textbox', { name: /ce que le joueur entend/i }), 'Un murmure derrière le mur.')
		// Gate it: default roll Habileté / 7 → switch trait + step difficulty, author both outcomes.
		await user.click(screen.getByRole('switch', { name: /jet requis/i }))
		await user.click(screen.getByRole('radio', { name: 'Endurance' }))
		await user.click(screen.getByRole('button', { name: /augmenter Difficulté/i }))
		await user.type(screen.getByRole('textbox', { name: /si Réussite/i }), 'Vous saisissez le mot de passe.')
		await user.type(screen.getByRole('textbox', { name: /si Échec/i }), 'Le bruit se perd.')

		const reveal = decorOf(brain, bookId, nodeId)?.reveals?.ecouter
		expect(reveal?.text).toBe('Un murmure derrière le mur.')
		expect(reveal?.roll).toEqual({ trait: 'endurance', difficulty: 8 })
		expect(reveal?.outcomes).toEqual({ reussite: 'Vous saisissez le mot de passe.', echec: 'Le bruit se perd.' })
	})

	it('« Fouiller »: toggling the roll off drops the roll + outcomes but keeps the reveal text (iter 2)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)
		await user.click(screen.getByRole('radio', { name: 'Fouiller' }))

		// Fouiller carries its own field copy.
		await user.type(screen.getByRole('textbox', { name: /ce que le joueur trouve/i }), 'Une trappe dissimulée.')
		await user.click(screen.getByRole('switch', { name: /jet requis/i }))
		expect(decorOf(brain, bookId, nodeId)?.reveals?.fouiller?.roll).toBeDefined()

		await user.click(screen.getByRole('switch', { name: /jet requis/i }))

		const reveal = decorOf(brain, bookId, nodeId)?.reveals?.fouiller
		expect(reveal?.roll).toBeUndefined()
		expect(reveal?.outcomes).toBeUndefined()
		expect(reveal?.text).toBe('Une trappe dissimulée.')
		// The outcome fields are gone once the gate is off.
		expect(screen.queryByRole('textbox', { name: /si Réussite/i })).not.toBeInTheDocument()
	})

	it('keeps Écouter and Fouiller reveal texts INDEPENDENT when switching tabs (BUG-007)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await openDecor(user)

		// Author an « Écouter » reveal…
		await user.click(screen.getByRole('radio', { name: 'Écouter' }))
		await user.type(screen.getByRole('textbox', { name: /ce que le joueur entend/i }), 'bruit de pas')

		// …switch to « Fouiller »: its field starts EMPTY (not the écouter text).
		await user.click(screen.getByRole('radio', { name: 'Fouiller' }))
		const fouiller = screen.getByRole('textbox', { name: /ce que le joueur trouve/i }) as HTMLTextAreaElement
		expect(fouiller.value).toBe('')
		await user.type(fouiller, 'une trappe')

		// …back to « Écouter »: its own text is intact.
		await user.click(screen.getByRole('radio', { name: 'Écouter' }))
		expect((screen.getByRole('textbox', { name: /ce que le joueur entend/i }) as HTMLTextAreaElement).value).toBe(
			'bruit de pas',
		)

		// Both reveals persist independently on the node document.
		const reveals = decorOf(brain, bookId, nodeId)?.reveals
		expect(reveals?.ecouter?.text).toBe('bruit de pas')
		expect(reveals?.fouiller?.text).toBe('une trappe')
	})

	it('migrates a legacy single shared reveal onto the node current interaction (KR-090)', () => {
		const brain = createBrain()
		const created = brain.books.createBook('Vieux livre')
		const node = brain.books.addNode(created.id, 'choix')!
		// Simulate an iteration-2 persisted node: a single shared `reveal`, no `reveals`.
		brain.books.updateNode(created.id, node.id, {
			decor: { interaction: 'fouiller', reveal: { text: 'ancien texte' } },
		})
		// revealsOf attributes the legacy reveal to the current interaction (fouiller).
		expect(revealsOf(decorOf(brain, created.id, node.id)!)).toEqual({ fouiller: { text: 'ancien texte' } })
	})
})
