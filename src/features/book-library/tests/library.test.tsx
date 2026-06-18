import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain } from '../../../brain'
import { App } from '../../../App'

/** Pre-seed fixtures BEFORE render so live views never mutate outside act(). */
function renderLibrary(seed: (brain: Brain) => void = () => {}) {
	const brain = createBrain()
	seed(brain)
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain }
}

describe('book-library', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('lists every persisted book on the home screen', () => {
		renderLibrary((brain) => {
			brain.books.createBook('La Caverne')
			brain.books.createBook('Le Donjon')
		})
		expect(screen.getByRole('button', { name: /^La Caverne/ })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /^Le Donjon/ })).toBeInTheDocument()
	})

	it('shows the create affordance even when there is no book', () => {
		renderLibrary()
		expect(screen.getByRole('button', { name: /nouveau livre/i })).toBeInTheDocument()
	})

	it('opens a book in its editor when its card is clicked', async () => {
		const user = userEvent.setup()
		const { brain } = renderLibrary((b) => {
			b.books.createBook('La Caverne')
		})

		await user.click(screen.getByRole('button', { name: /^La Caverne/ }))

		// Landed in the editor: the title is shown as the heading.
		expect(screen.getByRole('heading', { name: 'La Caverne' })).toBeInTheDocument()
		expect(brain.router.current()).toEqual({ name: 'editor', bookId: expect.any(String) })
	})

	it('shows richer per-book meta: screen, link, and ending counts plus a modified date', () => {
		renderLibrary((brain) => {
			const book = brain.books.createBook('La Caverne')
			const sommaire = brain.books.getBook(book.id)!.nodes.find((n) => n.kind === 'sommaire')!
			brain.books.addChoiceBranch(book.id, sommaire.id) // → 3 screens, 1 link
		})
		// 3 écrans · 1 lien · 0 fin
		expect(screen.getByText(/3 écrans · 1 lien · 0 fin/)).toBeInTheDocument()
		expect(screen.getByText(/Modifié le/)).toBeInTheDocument()
	})

	it('renames a book in place via the card, persisting through BookService', async () => {
		const user = userEvent.setup()
		const { brain } = renderLibrary((b) => {
			b.books.createBook('Brouillon')
		})

		await user.click(screen.getByRole('button', { name: /Renommer « Brouillon »/ }))
		const input = screen.getByRole('textbox', { name: /Renommer « Brouillon »/ })
		await user.clear(input)
		await user.type(input, 'La Caverne{Enter}')

		expect(brain.books.listBooks()[0].title).toBe('La Caverne')
		expect(screen.getByRole('button', { name: /^La Caverne/ })).toBeInTheDocument()
	})

	it('cancels an in-place rename with Escape, leaving the title unchanged', async () => {
		const user = userEvent.setup()
		const { brain } = renderLibrary((b) => {
			b.books.createBook('Brouillon')
		})

		await user.click(screen.getByRole('button', { name: /Renommer « Brouillon »/ }))
		const input = screen.getByRole('textbox', { name: /Renommer « Brouillon »/ })
		await user.clear(input)
		await user.type(input, 'La Caverne{Escape}')

		expect(brain.books.listBooks()[0].title).toBe('Brouillon')
		expect(screen.getByRole('button', { name: /^Brouillon/ })).toBeInTheDocument()
	})

	it('duplicates a book via the card, adding a (copie) to the live list', async () => {
		const user = userEvent.setup()
		const { brain } = renderLibrary((b) => {
			b.books.createBook('La Caverne')
		})

		await user.click(screen.getByRole('button', { name: /Dupliquer « La Caverne »/ }))

		expect(brain.books.listBooks()).toHaveLength(2)
		expect(screen.getByRole('button', { name: /^La Caverne \(copie\)/ })).toBeInTheDocument()
	})

	it('requires confirmation before deleting and cancels without removing', async () => {
		const user = userEvent.setup()
		const { brain } = renderLibrary((b) => {
			b.books.createBook('La Caverne')
		})

		await user.click(screen.getByRole('button', { name: /Supprimer « La Caverne »/ }))
		// A confirmation dialog names the book and the action.
		expect(screen.getByRole('dialog', { name: /supprimer le livre/i })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(brain.books.listBooks()).toHaveLength(1)
		expect(screen.getByRole('button', { name: /^La Caverne/ })).toBeInTheDocument()
	})

	it('deletes the book on confirmation, emitting book:deleted and dropping it from the list', async () => {
		const user = userEvent.setup()
		let deletedId: string | null = null
		const { brain } = renderLibrary((b) => {
			b.books.createBook('La Caverne')
			b.events.on('book:deleted', ({ bookId }) => {
				deletedId = bookId
			})
		})
		const id = brain.books.listBooks()[0].id

		await user.click(screen.getByRole('button', { name: /Supprimer « La Caverne »/ }))
		await user.click(screen.getByRole('button', { name: 'Supprimer' }))

		expect(deletedId).toBe(id)
		expect(brain.books.listBooks()).toHaveLength(0)
		expect(screen.queryByRole('button', { name: /^La Caverne/ })).not.toBeInTheDocument()
	})

	it('filters the grid by the search box and shows a no-match message', async () => {
		const user = userEvent.setup()
		renderLibrary((b) => {
			b.books.createBook('La Caverne')
			b.books.createBook('Le Donjon')
		})

		await user.type(screen.getByRole('textbox', { name: /rechercher un livre/i }), 'donjon')

		expect(screen.getByRole('button', { name: /^Le Donjon/ })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: /^La Caverne/ })).not.toBeInTheDocument()

		await user.clear(screen.getByRole('textbox', { name: /rechercher un livre/i }))
		await user.type(screen.getByRole('textbox', { name: /rechercher un livre/i }), 'zzz')
		expect(screen.getByText(/aucun livre ne correspond/i)).toBeInTheDocument()
	})

	it('sorts by most-recently-modified by default and alphabetically when toggled', async () => {
		// Fixed clock so updatedAt is deterministic: Alpha is older, Zebra newer.
		jest.useFakeTimers()
		jest.setSystemTime(new Date('2026-01-01T00:00:00Z'))
		const brain = createBrain()
		brain.books.createBook('Alpha')
		jest.setSystemTime(new Date('2026-03-01T00:00:00Z'))
		brain.books.createBook('Zebra')
		jest.useRealTimers()
		render(
			<BrainProvider brain={brain}>
				<App />
			</BrainProvider>,
		)
		const user = userEvent.setup()
		const titlesInOrder = () =>
			screen.getAllByRole('button', { name: /écrans? ·/ }).map((b) => b.textContent?.match(/^[^0-9]+/)?.[0]?.trim())

		// Default « Récent »: the newer Zebra comes before the older Alpha.
		expect(titlesInOrder()).toEqual(['Zebra', 'Alpha'])

		await user.click(screen.getByRole('radio', { name: 'A→Z' }))
		expect(titlesInOrder()).toEqual(['Alpha', 'Zebra'])
	})

	it('shows an inviting empty state and the create affordance when there is no book', () => {
		renderLibrary()
		expect(screen.getByRole('note')).toHaveTextContent(/bibliothèque est vide/i)
		expect(screen.getByRole('button', { name: /nouveau livre/i })).toBeInTheDocument()
		// No search toolbar when the library is empty.
		expect(screen.queryByRole('textbox', { name: /rechercher un livre/i })).not.toBeInTheDocument()
	})

	it('navigates home when the book currently open in the editor is deleted (KR-071)', async () => {
		const user = userEvent.setup()
		const { brain } = renderLibrary((b) => {
			b.books.createBook('La Caverne')
		})
		await user.click(screen.getByRole('button', { name: /^La Caverne/ }))
		expect(brain.router.current()).toEqual({ name: 'editor', bookId: expect.any(String) })
		const id = brain.books.listBooks()[0].id

		// Deleting the open book (e.g. from another surface) must not strand the editor.
		await act(async () => {
			brain.books.deleteBook(id)
		})

		expect(brain.router.current()).toEqual({ name: 'home' })
		expect(screen.getByRole('heading', { name: /mes livres-jeux/i })).toBeInTheDocument()
	})
})
