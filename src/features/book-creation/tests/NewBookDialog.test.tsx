import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewBookDialog } from '../components/NewBookDialog'

function renderDialog() {
	const onCreate = jest.fn()
	const onCancel = jest.fn()
	render(<NewBookDialog onCancel={onCancel} onCreate={onCreate} />)
	return { onCreate, onCancel }
}

describe('NewBookDialog', () => {
	it('focuses the title field when opened', () => {
		renderDialog()
		expect(screen.getByLabelText(/titre/i)).toHaveFocus()
	})

	it('disables Creer while the trimmed title is empty', async () => {
		const user = userEvent.setup()
		renderDialog()
		const creer = screen.getByRole('button', { name: 'Créer' })
		expect(creer).toBeDisabled()
		await user.type(screen.getByLabelText(/titre/i), '   ')
		expect(creer).toBeDisabled()
	})

	it('enables Creer once a non-empty title is typed and submits trimmed', async () => {
		const user = userEvent.setup()
		const { onCreate } = renderDialog()
		await user.type(screen.getByLabelText(/titre/i), '  Donjon  ')
		const creer = screen.getByRole('button', { name: 'Créer' })
		expect(creer).toBeEnabled()
		await user.click(creer)
		expect(onCreate).toHaveBeenCalledWith('Donjon')
	})

	it('submits on Enter in the field', async () => {
		const user = userEvent.setup()
		const { onCreate } = renderDialog()
		await user.type(screen.getByLabelText(/titre/i), 'Forêt{Enter}')
		expect(onCreate).toHaveBeenCalledWith('Forêt')
	})

	it('does not create on Enter when the title is empty', async () => {
		const user = userEvent.setup()
		const { onCreate } = renderDialog()
		await user.type(screen.getByLabelText(/titre/i), '{Enter}')
		expect(onCreate).not.toHaveBeenCalled()
	})

	it('closes via Annuler without creating', async () => {
		const user = userEvent.setup()
		const { onCancel, onCreate } = renderDialog()
		await user.click(screen.getByRole('button', { name: 'Annuler' }))
		expect(onCancel).toHaveBeenCalled()
		expect(onCreate).not.toHaveBeenCalled()
	})

	it('closes via Esc without creating', async () => {
		const user = userEvent.setup()
		const { onCancel, onCreate } = renderDialog()
		await user.keyboard('{Escape}')
		expect(onCancel).toHaveBeenCalled()
		expect(onCreate).not.toHaveBeenCalled()
	})
})
