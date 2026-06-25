import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type CloudTransport } from '../../../brain'
import { SyncIndicator } from '../components/SyncIndicator'

function renderWith(transport?: CloudTransport, syncDebounceMs?: number) {
	const brain = createBrain({ transport, syncDebounceMs })
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
		const { brain } = renderWith({ push: () => Promise.resolve() }, 0) // 0ms debounce
		expect(screen.getByRole('status')).toHaveTextContent(/prêt/i) // idle

		await act(async () => {
			brain.persistence.set('genliv:k', 1)
			await new Promise((r) => setTimeout(r, 0)) // let the debounced batch flush + resolve
		})

		expect(screen.getByRole('status')).toHaveTextContent(/synchronisé/i)
	})

	it('surfaces « N sauvegardes en attente » when writes fail to reach the cloud (iter 2)', async () => {
		const { brain } = renderWith({ push: () => Promise.reject(new Error('offline')) }, 0)

		await act(async () => {
			brain.persistence.set('genliv:a', 1)
			brain.persistence.set('genliv:b', 2)
			await new Promise((r) => setTimeout(r, 0)) // let the batch flush + fail
		})

		expect(screen.getByRole('status')).toHaveTextContent(/2 sauvegardes en attente/i)
	})

	it('shows a Reessayer button on error that calls sync.retry()', async () => {
		const user = userEvent.setup()
		let pushCount = 0
		// Fail first push; succeed on retry.
		const transport: CloudTransport = {
			push: () => (pushCount++ === 0 ? Promise.reject(new Error('offline')) : Promise.resolve()),
		}
		const { brain } = renderWith(transport, 0)

		await act(async () => {
			brain.persistence.set('genliv:x', 1)
			await new Promise((r) => setTimeout(r, 0))
		})

		// Error state: a retry button is shown.
		const retryBtn = screen.getByRole('button', { name: /réessayer/i })
		expect(retryBtn).toBeInTheDocument()

		await act(async () => {
			await user.click(retryBtn)
			await new Promise((r) => setTimeout(r, 0)) // let the retry flush + resolve
		})

		// After successful retry the error badge is gone.
		expect(screen.queryByRole('button', { name: /réessayer/i })).not.toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent(/synchronisé/i)
	})
})
