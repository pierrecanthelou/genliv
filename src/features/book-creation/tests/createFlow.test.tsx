import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type AppEventName } from '../../../brain'
import { App } from '../../../App'

function renderApp() {
	const brain = createBrain()
	const order: AppEventName[] = []
	brain.events.on('book:created', () => order.push('book:created'))
	brain.events.on('book:opened', () => order.push('book:opened'))
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, order }
}

describe('book-creation flow', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('creates a book from the home screen and navigates to its editor', async () => {
		const user = userEvent.setup()
		const { brain, order } = renderApp()

		await user.click(screen.getByRole('button', { name: /nouveau livre/i }))
		await user.type(screen.getByLabelText(/titre/i), "La Caverne d'Aldûr")
		await user.click(screen.getByRole('button', { name: 'Créer' }))

		// Landed in the editor: the new book title is shown as the heading.
		expect(screen.getByRole('heading', { name: "La Caverne d'Aldûr" })).toBeInTheDocument()
		// Editor shows the seeded Sommaire placeholder (empty-state rule).
		expect(screen.getByText(/écrivez ici le texte d'introduction/i)).toBeInTheDocument()

		// Exactly one book persisted, events fired in order.
		expect(brain.books.listBooks()).toHaveLength(1)
		expect(order).toEqual(['book:created', 'book:opened'])
	})

	it('does not create a book when the dialog is cancelled', async () => {
		const user = userEvent.setup()
		const { brain } = renderApp()

		await user.click(screen.getByRole('button', { name: /nouveau livre/i }))
		await user.type(screen.getByLabelText(/titre/i), 'Abandonné')
		await user.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(brain.books.listBooks()).toHaveLength(0)
		expect(screen.getByRole('heading', { name: /mes livres-jeux/i })).toBeInTheDocument()
	})
})
