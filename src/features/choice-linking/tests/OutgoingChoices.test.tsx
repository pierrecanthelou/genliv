import { render, screen, within } from '@testing-library/react'
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

	it('sets a hidden prerequisite on a choice, references an object by id, and shows ⊘ (KR-062)', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		// A décor node — child of the Sommaire — that lets the player TAKE an object,
		// so that object is in the lineage of this node's own outgoing choices (KR-118).
		const decorNode = brain.books.addChoiceBranch(book.id, sommaireId)!.node
		brain.books.updateNode(book.id, decorNode.id, {
			text: 'Salle au coffre',
			actionType: 'decor',
			decor: {
				interaction: 'prendre',
				objects: [{ object: { id: 'obj_cle', name: 'Clé rouillée', description: '' }, kind: 'utile' }],
			},
		})
		// A further branch off the décor node — the choice that will require the key.
		brain.books.addChoiceBranch(book.id, decorNode.id)
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Salle au coffre/ }))

		// Toggle the rule on, then pick the required object (offered because it is in
		// this node's lineage).
		await user.click(screen.getByRole('switch', { name: /pré-requis caché/i }))
		await user.selectOptions(screen.getByRole('combobox', { name: /objet requis/i }), 'obj_cle')

		// Persisted on the edge by stable id; the row shows the ⊘ badge.
		const decorOut = brain.books.getBook(book.id)!.edges.filter((e) => e.from === decorNode.id)
		expect(decorOut[0].prereq).toEqual({ objectId: 'obj_cle' })
		expect(screen.getByText(/⊘ pré-requis/)).toBeInTheDocument()
	})

	it('offers only objects collectable in the choice node lineage, not unrelated branches (KR-118)', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		// Branch A off the Sommaire carries an object on the player path; branch B is a
		// SIBLING the player never visits on the way to A.
		const branchA = brain.books.addChoiceBranch(book.id, sommaireId)!.node
		brain.books.updateNode(book.id, branchA.id, {
			text: 'Couloir A',
			actionType: 'decor',
			decor: {
				interaction: 'prendre',
				objects: [{ object: { id: 'obj_path', name: 'Torche', description: '' }, kind: 'utile' }],
			},
		})
		const branchB = brain.books.addChoiceBranch(book.id, sommaireId)!.node
		brain.books.updateNode(book.id, branchB.id, {
			actionType: 'decor',
			decor: {
				interaction: 'prendre',
				objects: [{ object: { id: 'obj_other', name: 'Amulette', description: '' }, kind: 'utile' }],
			},
		})
		// The choice that will require an object hangs off branch A.
		brain.books.addChoiceBranch(book.id, branchA.id)
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Couloir A/ }))
		await user.click(screen.getByRole('switch', { name: /pré-requis caché/i }))

		const picker = screen.getByRole('combobox', { name: /objet requis/i })
		// The lineage object (on branch A itself) is offered; the sibling's is not.
		expect(within(picker).getByRole('option', { name: 'Torche' })).toBeInTheDocument()
		expect(within(picker).queryByRole('option', { name: 'Amulette' })).not.toBeInTheDocument()
	})

	it('keeps an already-set out-of-lineage reference selectable and flags it (KR-118)', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		// An object authored on an UNRELATED node (not in the Sommaire's lineage).
		const island = brain.books.addNode(book.id, 'choix')!
		brain.books.updateNode(book.id, island.id, {
			actionType: 'decor',
			decor: {
				interaction: 'prendre',
				objects: [{ object: { id: 'obj_far', name: 'Relique', description: '' }, kind: 'utile' }],
			},
		})
		// A Sommaire branch whose prereq already points at that out-of-lineage object.
		const created = brain.books.addChoiceBranch(book.id, sommaireId)!
		brain.books.updateEdge(book.id, created.edge.id, { prereq: { objectId: 'obj_far' } })
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		// The reference resolves (not deleted) so the row shows ⊘, not ⚠…
		expect(screen.getByText(/⊘ pré-requis/)).toBeInTheDocument()
		// …it stays selectable in the picker (named, not dropped)…
		const picker = screen.getByRole('combobox', { name: /objet requis/i })
		expect(within(picker).getByRole('option', { name: 'Relique' })).toBeInTheDocument()
		// …and the editor flags that it lies outside this screen's lineage.
		expect(screen.getByText(/hors lignée|n’apparaît pas dans la lignée/i)).toBeInTheDocument()
	})

	it('surfaces a prerequisite pointing at a deleted object as a ⚠ badge (KR-062/021)', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		const created = brain.books.addChoiceBranch(book.id, sommaireId)!
		// A rule referencing an object id that resolves to nothing (deleted/unknown).
		brain.books.updateEdge(book.id, created.edge.id, { prereq: { objectId: 'obj_ghost' } })
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		// The dangling reference is surfaced on the row, never silently treated as met.
		expect(screen.getByText(/⚠ pré-requis/)).toBeInTheDocument()
		// Even though the Sommaire's lineage is EMPTY (no acquirable object on the path),
		// the editor still renders the picker + the « introuvable » message rather than the
		// empty-state hint — a dangling selection must never be hidden (KR-118 edge case).
		expect(screen.getByRole('combobox', { name: /objet requis/i })).toBeInTheDocument()
		expect(screen.getByText(/objet introuvable \(supprimé\)/i)).toBeInTheDocument()
	})

	it('toggles a countdown on a choice (default 15s) and persists it; an unset fallback is surfaced (KR-063, iter 4)', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		brain.books.addChoiceBranch(book.id, sommaireId)
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		await user.click(screen.getByRole('switch', { name: /compte à rebours/i }))

		// Persisted on the edge with the default délai; the fallback is unset → surfaced.
		expect(outgoingOf(brain, book.id, 'sommaire')[0].countdown).toEqual({ delay: 15, fallback: '' })
		expect(screen.getByText(/repli manquant/)).toBeInTheDocument()
	})

	it('shows the ⏱ délai badge for a configured countdown and ⏱ repli manquant for a dangling fallback', async () => {
		const brain = createBrain()
		const book = brain.books.createBook('La Caverne')
		const sommaireId = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!.id
		// A valid fallback target node, plus a branch whose countdown points at it.
		const fallback = brain.books.addNode(book.id, 'choix')!
		const ok = brain.books.addChoiceBranch(book.id, sommaireId)!
		brain.books.updateEdge(book.id, ok.edge.id, { countdown: { delay: 30, fallback: fallback.id } })
		// A second branch whose countdown points at a deleted node.
		const broken = brain.books.addChoiceBranch(book.id, sommaireId)!
		brain.books.updateEdge(book.id, broken.edge.id, { countdown: { delay: 10, fallback: 'ghost' } })
		brain.router.navigate({ name: 'editor', bookId: book.id })
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		await user.click(screen.getByRole('button', { name: /Nœud #1 — Sommaire/ }))

		expect(screen.getByText('⏱ 30s')).toBeInTheDocument()
		expect(screen.getByText(/repli manquant/)).toBeInTheDocument()
	})
})
