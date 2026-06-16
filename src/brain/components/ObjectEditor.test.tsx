import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ObjectEditor, type ObjectDraft } from './ObjectEditor'

describe('ObjectEditor', () => {
	it('captures an internal name and a player-facing description (KR-052)', async () => {
		const user = userEvent.setup()
		let draft: ObjectDraft = { name: '', description: '' }
		const onChange = (next: ObjectDraft) => {
			draft = next
		}
		render(<ObjectEditor value={draft} onChange={onChange} />)

		// Both fields are present and labelled (internal vs player-facing).
		expect(screen.getByRole('textbox', { name: /nom de l/i })).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument()

		await user.type(screen.getByRole('textbox', { name: /nom de l/i }), 'X')
		expect(draft.name).toBe('X')
	})
})
