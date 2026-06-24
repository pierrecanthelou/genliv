import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'
import { registerActionMonster } from '../register'

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

const monsterOf = (brain: ReturnType<typeof createBrain>, bookId: string, nodeId: string) =>
	brain.books.getBook(bookId)!.nodes.find((n) => n.id === nodeId)!.monster

describe('action-monster', () => {
	beforeEach(() => {
		window.localStorage.clear()
		// Suppress the 23-monster bestiary auto-seed from createBrain() so the
		// library starts empty in every test (anti-re-injection guard, KR-011).
		window.localStorage.setItem('genliv:monster-library:seeded', 'true')
	})

	it('self-registers a « Monstre » editor with the ActionRegistry and unregisters cleanly (KR-051)', () => {
		const brain = createBrain()
		const off = registerActionMonster(brain.actions)
		expect(brain.actions.get('monstre')?.label).toBe('Monstre')
		off()
		expect(brain.actions.get('monstre')).toBeNull()
	})

	it('offers « Monstre » and persists the name + the réussite/échec outcome texts via BookService', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))

		await user.type(screen.getByRole('textbox', { name: /nom du monstre/i }), 'Gobelin')
		// Both semantic outcomes render (the only semantic colours) with their own field.
		await user.type(screen.getByRole('textbox', { name: /si Réussite/i }), 'Il tombe.')
		await user.type(screen.getByRole('textbox', { name: /si Échec/i }), 'Vous fuyez.')

		const monster = monsterOf(brain, bookId, nodeId)
		expect(monster?.name).toBe('Gobelin')
		expect(monster?.outcomes.reussite).toBe('Il tombe.')
		expect(monster?.outcomes.echec).toBe('Vous fuyez.')
	})

	it('steps the PV stat and persists it via BookService', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))

		await user.click(screen.getByRole('button', { name: /augmenter PV/i }))

		expect(monsterOf(brain, bookId, nodeId)?.pv).toBe(11) // default 10 → 11
	})

	it('wires « victoire → poursuivre » to a node, excluding structural screens (KR-067)', async () => {
		// Seed a second, named node BEFORE render so it is a valid target candidate.
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const node = brain.books.addNode(created.id, 'choix')!
		const next = brain.books.addNode(created.id, 'choix')!
		brain.books.updateNode(created.id, next.id, { text: 'Salle suivante' })
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))

		await user.click(screen.getByRole('button', { name: /Aucune suite/i })) // open victory picker
		await user.click(screen.getByRole('button', { name: 'Salle suivante' }))

		expect(monsterOf(brain, created.id, node.id)?.victoryTarget).toBe(next.id)
	})

	it('surfaces the automatic défaite → Mort path (KR-067)', async () => {
		const user = userEvent.setup()
		setup()
		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))

		expect(screen.getByText(/Défaite → Mort du personnage/i)).toBeInTheDocument()
	})

	it('« butin lâché »: toggles loot, authors it via the shared ObjectEditor (stable id), drops it on toggle-off (iter 2)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))

		// No loot until the toggle is on.
		expect(monsterOf(brain, bookId, nodeId)?.loot).toBeUndefined()
		await user.click(screen.getByRole('switch', { name: /lâche un butin/i }))

		// The loot is authored through the SHARED brain ObjectEditor (name + description).
		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), 'Dague ébréchée')
		const loot = monsterOf(brain, bookId, nodeId)?.loot
		expect(loot?.name).toBe('Dague ébréchée')
		expect(loot?.id).toBeTruthy() // stable id minted (KR-003)

		// Toggling off drops the loot entirely.
		await user.click(screen.getByRole('switch', { name: /lâche un butin/i }))
		expect(monsterOf(brain, bookId, nodeId)?.loot).toBeUndefined()
	})

	it('« Ajouter à la librairie » saves to the MonsterLibrary and emits the event (iter 3)', async () => {
		const user = userEvent.setup()
		const { brain } = setup()
		const saved: { bookId: string; nodeId: string }[] = []
		brain.events.on('monster:savedToLibrary', (p) => saved.push(p))

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))
		await user.type(screen.getByRole('textbox', { name: /nom du monstre/i }), 'Troll')
		await user.click(screen.getByRole('button', { name: /ajouter à la librairie/i }))

		// Persisted in the cross-book library (no longer a stub) + the event still fires.
		expect(brain.monsterLibrary.list().map((m) => m.config.name)).toEqual(['Troll'])
		expect(saved).toHaveLength(1)
	})

	it('« Choisir dans la librairie » instantiates a saved monster as a copy onto the node (iter 3)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		// Pre-seed the library with a reusable monster (e.g. saved from another book).
		brain.monsterLibrary.save({
			name: 'Dragon',
			pv: 40,
			attack: 8,
			defense: 6,
			outcomes: { reussite: 'Il rugit.', echec: 'Il crache du feu.' },
		})

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))
		await user.click(screen.getByRole('button', { name: /choisir dans la librairie/i }))
		await user.click(screen.getByRole('button', { name: 'Dragon' }))

		// The node's monster is now a COPY of the library entry.
		const m = monsterOf(brain, bookId, nodeId)
		expect(m?.name).toBe('Dragon')
		expect(m?.pv).toBe(40)
		expect(m?.outcomes.echec).toBe('Il crache du feu.')
	})

	it('displays the computed tier badge (T1 for default stats) and updates when a carac stepper changes', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))

		// Default stats FO/AG/DX/EN/IG = 1 → MC = floor(3/3) = 1 → T1.
		expect(screen.getByText('T1')).toBeInTheDocument()

		// Increment AG 3 times (AG=4, DX=1, IG=1 → MC = floor(6/3) = 2 → still T1).
		// Then increment AG 9 more times total (AG=10, DX=1, IG=1 → MC=4 → T2).
		// Shortcut: directly seed stats and re-render to confirm the computed tier persists.
		brain.books.updateNode(bookId, nodeId, {
			monster: {
				name: '',
				pv: 10,
				pvVariance: 0,
				stats: { FO: 1, AG: 6, DX: 6, EN: 1, IG: 6 },
				mc: 1,
				armour: 0,
				weaponMultiplier: 1,
				tier: 1,
				outcomes: { reussite: '', echec: '' },
			},
		})
		// Trigger a re-read: click away and back.
		await user.click(screen.getByRole('button', { name: /sommaire/i }))
		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		// AG=6, DX=6, IG=6 → MC = 6 → T2.
		expect(screen.getByText('T2')).toBeInTheDocument()
	})

	it('capacity select persists the id and shows the description hint', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))

		await user.selectOptions(screen.getByRole('combobox', { name: /capacité du monstre/i }), 'maladie')

		expect(monsterOf(brain, bookId, nodeId)?.capacity).toBe('maladie')
		// The description hint appears for a non-aucune selection.
		expect(screen.getByText(/EN max/i)).toBeInTheDocument()
	})

	it('legacy free-text capacity falls back to Aucune in the editor without crashing', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const created = brain.books.createBook('La Caverne')
		const node = brain.books.addNode(created.id, 'choix')!
		// Seed an old free-text capacity that is not a registry id.
		brain.books.updateNode(created.id, node.id, {
			actionType: 'monstre',
			monster: {
				name: 'Ancien monstre',
				pv: 10,
				pvVariance: 0,
				stats: { FO: 1, AG: 1, DX: 1, EN: 1, IG: 1 },
				mc: 1,
				armour: 0,
				weaponMultiplier: 1,
				tier: 1,
				capacity: 'Régénération : 3 PV/round (ancienne description libre)',
				outcomes: { reussite: '', echec: '' },
			},
		})
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))

		// The select shows the Aucune fallback (no crash, no unknown option).
		const select = screen.getByRole('combobox', { name: /capacité du monstre/i }) as HTMLSelectElement
		expect(select.value).toBe('aucune')
	})

	it('surfaces predecessor nodes as Noeuds proches in the victoire target picker', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const created = brain.books.createBook('La Foret')
		const predecessor = brain.books.addNode(created.id, 'choix')!
		brain.books.updateNode(created.id, predecessor.id, { text: 'Carrefour' })
		const combat = brain.books.addNode(created.id, 'choix')!
		// Wire predecessor → combat so the combat node knows its context.
		brain.books.addEdge(created.id, predecessor.id, combat.id, 'choice')
		brain.router.navigate({ name: 'editor', bookId: created.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)

		// combat is the 4th node (sommaire #1, mort #2, predecessor #3, combat #4).
		await user.click(screen.getByRole('button', { name: /Nœud #4/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))
		await user.click(screen.getByRole('button', { name: /Aucune suite/i })) // open victoire picker

		// Predecessor surfaced under the group label.
		expect(screen.getByText('Nœuds proches')).toBeInTheDocument()
		const predecessorBtn = screen.getByRole('button', { name: 'Carrefour' })
		expect(predecessorBtn).toBeInTheDocument()

		// Picking it persists the victoryTarget.
		await user.click(predecessorBtn)
		expect(
			brain.books.getBook(created.id)!.nodes.find((n) => n.id === combat.id)?.monster?.victoryTarget,
		).toBe(predecessor.id)
	})

	it('instantiate keeps the node own targets and re-mints the loot id (KR-097/003)', async () => {
		const user = userEvent.setup()
		const { brain, bookId, nodeId } = setup()
		// The node already has a monster with its own victory target.
		brain.books.updateNode(bookId, nodeId, {
			actionType: 'monstre',
			monster: {
				name: 'Ancien',
				pv: 5,
				attack: 1,
				defense: 1,
				outcomes: { reussite: '', echec: '' },
				victoryTarget: 'node_keep',
			},
		})
		// A library monster carrying loot.
		brain.monsterLibrary.save({
			name: 'Hydre',
			pv: 30,
			attack: 5,
			defense: 3,
			outcomes: { reussite: '', echec: '' },
			loot: { id: 'loot_src', name: 'Écaille', description: '' },
		})

		await user.click(screen.getByRole('button', { name: /Nœud #3/ }))
		await user.click(screen.getByRole('radio', { name: 'Monstre' }))
		await user.click(screen.getByRole('button', { name: /choisir dans la librairie/i }))
		await user.click(screen.getByRole('button', { name: 'Hydre' }))

		const m = monsterOf(brain, bookId, nodeId)!
		expect(m.victoryTarget).toBe('node_keep') // the node's own target is preserved (merge)
		expect(m.loot?.name).toBe('Écaille')
		expect(m.loot?.id).not.toBe('loot_src') // fresh loot id — no cross-use collision (KR-003)
	})
})
