import { render, screen } from '@testing-library/react'
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
})
