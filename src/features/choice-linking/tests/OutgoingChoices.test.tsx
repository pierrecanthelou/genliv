import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'

function setup() {
	const brain = createBrain()
	const book = brain.books.createBook('La Caverne')
	brain.router.navigate({ name: 'editor', bookId: book.id })
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, book }
}

const outgoingOf = (brain: ReturnType<typeof createBrain>, bookId: string, fromKind: string) => {
	const b = brain.books.getBook(bookId)!
	const from = b.nodes.find((n) => n.kind === fromKind)!
	return b.edges.filter((e) => e.from === from.id)
}

describe('choice-linking — outgoing choices', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('mounts in the node-editor choices slot with an inviting empty state when a node is selected', async () => {
		const user = userEvent.setup()
		setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))
		expect(screen.getByText(/choix sortants/i)).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /ajouter une première branche/i })).toBeInTheDocument()
	})

	it('« + branche » creates a child + choice edge via BookService and selects the new node', async () => {
		const user = userEvent.setup()
		const { brain, book } = setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		await user.click(screen.getByRole('button', { name: '+ branche' }))

		const edges = outgoingOf(brain, book.id, 'sommaire')
		expect(edges).toHaveLength(1)
		expect(edges[0].kind).toBe('choice')
		expect(brain.books.getBook(book.id)!.nodes).toHaveLength(3)
		// Selection moved to the new child (panel header shows it).
		expect(brain.selection.getSelected()).toBe(edges[0].to)
	})

	it('« Relier… » creates a relink edge to an existing node without creating a node', async () => {
		// Seed an extra, non-structural node BEFORE render so it is a valid relink target.
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const extra = brain.books.addNode(book.id, 'choix')!
		brain.books.updateNode(book.id, extra.id, { text: 'Salle secrète' })
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		await user.click(screen.getByRole('button', { name: /relier à un nœud existant/i }))
		await user.click(screen.getByRole('button', { name: 'Salle secrète' }))

		const edges = outgoingOf(brain, book.id, 'sommaire')
		expect(edges).toHaveLength(1)
		expect(edges[0].kind).toBe('relink')
		expect(edges[0].to).toBe(extra.id)
		expect(brain.books.getBook(book.id)!.nodes).toHaveLength(3) // relink created no node
	})

	it('excludes the structural Sommaire and Mort screens from relink candidates (KR-067)', async () => {
		const user = userEvent.setup()
		setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		await user.click(screen.getByRole('button', { name: /relier à un nœud existant/i }))

		// A fresh book has only Sommaire (self) + Mort, both structural → no candidates.
		const picker = screen.getByRole('list', { name: /choisir un nœud cible/i })
		expect(picker).toHaveTextContent(/aucun autre nœud/i)
		expect(screen.queryByRole('button', { name: 'Mort du personnage' })).not.toBeInTheDocument()
	})

	it('filters relink candidates by the search box and excludes an already-relinked node (KR-061)', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		const salle = brain.books.addNode(book.id, 'choix')!
		brain.books.updateNode(book.id, salle.id, { text: 'Salle secrète' })
		const couloir = brain.books.addNode(book.id, 'choix')!
		brain.books.updateNode(book.id, couloir.id, { text: 'Couloir sombre' })
		// Pre-relink the Sommaire to the couloir so it is a duplicate candidate.
		brain.books.addEdge(book.id, sommaireId, couloir.id, 'relink')
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))
		await user.click(screen.getByRole('button', { name: /relier à un nœud existant/i }))

		// The already-relinked couloir is excluded; only the salle remains.
		expect(screen.queryByRole('button', { name: 'Couloir sombre' })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Salle secrète' })).toBeInTheDocument()

		// Typing a non-matching needle empties the list with a distinct message.
		await user.type(screen.getByRole('textbox', { name: /rechercher un nœud/i }), 'zzz')
		expect(screen.queryByRole('button', { name: 'Salle secrète' })).not.toBeInTheDocument()
		const picker = screen.getByRole('list', { name: /choisir un nœud cible/i })
		expect(picker).toHaveTextContent(/aucun nœud ne correspond/i)
	})

	it('typing a libellé persists it on the edge via BookService and shows a placeholder when empty', async () => {
		// Seed the branch BEFORE render so the mutation isn't an out-of-act update.
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		const created = brain.books.addChoiceBranch(book.id, sommaireId)!
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		const field = screen.getByRole('textbox', { name: /libellé du choix/i })
		expect(field).toHaveAttribute('placeholder', expect.stringMatching(/bouton de choix/i))

		await user.type(field, 'Ouvrir la porte')

		expect(brain.books.getBook(book.id)!.edges.find((e) => e.id === created.edge.id)!.label).toBe('Ouvrir la porte')
	})

	it('removing a branch deletes only the edge, not the target node', async () => {
		// Seed the branch BEFORE render so the mutation isn't an out-of-act update.
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		const created = brain.books.addChoiceBranch(book.id, sommaireId)!
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		// The ✕ now only REQUESTS deletion — a confirmation dialog guards it.
		await user.click(screen.getByRole('button', { name: /supprimer la branche/i }))
		await user.click(screen.getByRole('button', { name: 'Supprimer' }))

		expect(outgoingOf(brain, book.id, 'sommaire')).toHaveLength(0)
		expect(brain.books.getBook(book.id)!.nodes.some((n) => n.id === created.node.id)).toBe(true)
	})

	it('cancelling the delete-branch confirmation keeps the edge (dangerous-action guard)', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		brain.books.addChoiceBranch(book.id, sommaireId)!
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		await user.click(screen.getByRole('button', { name: /supprimer la branche/i }))
		// A sole incoming link warns about orphaning the child (KR-064).
		expect(screen.getByRole('dialog')).toHaveTextContent(/seul lien/i)
		await user.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		expect(outgoingOf(brain, book.id, 'sommaire')).toHaveLength(1)
	})

	it('does not warn about orphaning when the destination has another incoming link (KR-064)', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		// The Sommaire branches to a child that is ALSO reached by a relink from
		// another node, so deleting this branch leaves the child reachable.
		const child = brain.books.addChoiceBranch(book.id, sommaireId)!.node
		const other = brain.books.addNode(book.id, 'choix')!
		brain.books.addEdge(book.id, other.id, child.id, 'relink')
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		await user.click(screen.getByRole('button', { name: /supprimer la branche/i }))
		expect(screen.getByRole('dialog')).not.toHaveTextContent(/seul lien/i)
	})
})
