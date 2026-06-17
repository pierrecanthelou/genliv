import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OutcomesEditor } from './OutcomesEditor'
import { ROLL_OUTCOMES } from '../outcomes'
import type { RollOutcome } from '../types'

describe('OutcomesEditor', () => {
	it('renders one labelled reveal field per ROLL_OUTCOMES entry (KR-117) and reports edits by outcome', async () => {
		const user = userEvent.setup()
		const calls: [RollOutcome, string][] = []
		render(
			<OutcomesEditor
				value={{ reussite: 'gagné', echec: 'perdu' }}
				onChange={(outcome, text) => calls.push([outcome, text])}
			/>,
		)

		// A field per registry key, named + valued from the descriptor.
		for (const outcome of Object.keys(ROLL_OUTCOMES) as RollOutcome[]) {
			expect(screen.getByText(ROLL_OUTCOMES[outcome].label)).toBeInTheDocument()
		}
		expect(screen.getByRole('textbox', { name: /si Réussite/i })).toHaveValue('gagné')
		expect(screen.getByRole('textbox', { name: /si Échec/i })).toHaveValue('perdu')

		await user.type(screen.getByRole('textbox', { name: /si Réussite/i }), '!')
		expect(calls).toContainEqual(['reussite', 'gagné!'])
	})
})
