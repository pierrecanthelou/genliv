import { render, screen, act } from '@testing-library/react'
import { createBrain, BrainProvider, type CloudTransport } from '../../../brain'
import { SyncIndicator } from '../components/SyncIndicator'

function renderWith(transport?: CloudTransport) {
	const brain = createBrain({ transport })
	render(
		<BrainProvider brain={brain}>
			<SyncIndicator />
		</BrainProvider>,
	)
	return { brain }
}

describe('cloud-sync — SyncIndicator', () => {
	beforeEach(() => window.localStorage.clear())

	it('shows « Local » when there is no cloud transport (local-only)', () => {
		renderWith()
		expect(screen.getByRole('status')).toHaveTextContent(/local/i)
	})

	it('reflects the live sync status: syncing → synced after a write', async () => {
		const { brain } = renderWith({ push: () => Promise.resolve() })
		expect(screen.getByRole('status')).toHaveTextContent(/prêt/i) // idle

		await act(async () => {
			brain.persistence.set('genliv:k', 1)
		})

		expect(screen.getByRole('status')).toHaveTextContent(/synchronisé/i)
	})
})
