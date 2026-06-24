import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ObjectEditor, type ObjectDraft } from './ObjectEditor'

describe('ObjectEditor', () => {
	it('reinforcementBonus rollBonus is persisted via onChange (AC C5)', async () => {
		const user = userEvent.setup()
		let draft: ObjectDraft = { name: '', description: '' }
		render(<ObjectEditor value={draft} onChange={(next) => { draft = next }} />)

		const plusBtn = screen.getByRole('button', { name: /augmenter bonus de jet/i })

		await user.click(plusBtn)
		// draft should now carry reinforcementBonus.rollBonus = 1
		expect(draft.reinforcementBonus).toEqual({ rollBonus: 1 })
	})

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
