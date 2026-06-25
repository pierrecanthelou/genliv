import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type CloudTransport } from '../../../brain'
import { SyncIndicator } from '../components/SyncIndicator'

// window.location.reload is not implemented in jsdom — stub it
const reloadMock = jest.fn()
Object.defineProperty(window, 'location', {
	value: { ...window.location, reload: reloadMock },
	writable: true,
})

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
		const { brain } = renderWith({ push: () => Promise.resolve() }, 0)
		expect(screen.getByRole('status')).toHaveTextContent(/prêt/i)

		await act(async () => {
			brain.persistence.set('genliv:k', 1)
			await new Promise((r) => setTimeout(r, 0))
		})

		expect(screen.getByRole('status')).toHaveTextContent(/synchronisé/i)
	})

	it('shows « Synchronisation… » not a pending count during in-flight sync', () => {
		// setStatus('syncing') fires synchronously inside queuePush — no need to wait
		// for the debounce timer or the push to complete to verify the in-flight label.
		const transport: CloudTransport = { push: () => new Promise(() => {}) }
		const { brain } = renderWith(transport, 0)

		act(() => {
			brain.persistence.set('genliv:k', 1)
		})

		// Status is syncing: indicator shows the status label, not a pending count.
		expect(screen.getByRole('status')).toHaveTextContent(/synchronisation/i)
		expect(screen.queryByText(/en attente/i)).not.toBeInTheDocument()
	})

	it('surfaces « N sauvegardes en attente · Réessayer » only on error', async () => {
		const { brain } = renderWith({ push: () => Promise.reject(new Error('offline')) }, 0)

		await act(async () => {
			brain.persistence.set('genliv:a', 1)
			brain.persistence.set('genliv:b', 2)
			await new Promise((r) => setTimeout(r, 0))
		})

		// Error state: count + retry button are shown.
		expect(screen.getByRole('status')).toHaveTextContent(/2 sauvegardes en attente · réessayer/i)
		expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument()
	})

	it('retry button calls sync.retry() and clears the error on success', async () => {
		const user = userEvent.setup()
		let pushCount = 0
		const transport: CloudTransport = {
			push: () => (pushCount++ === 0 ? Promise.reject(new Error('offline')) : Promise.resolve()),
		}
		const { brain } = renderWith(transport, 0)

		await act(async () => {
			brain.persistence.set('genliv:x', 1)
			await new Promise((r) => setTimeout(r, 0))
		})

		const retryBtn = screen.getByRole('button', { name: /réessayer/i })
		expect(retryBtn).toBeInTheDocument()

		await act(async () => {
			await user.click(retryBtn)
			await new Promise((r) => setTimeout(r, 0))
		})

		expect(screen.queryByRole('button', { name: /réessayer/i })).not.toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent(/synchronisé/i)
	})

	it('offline indicator is a button that opens the cloud settings modal', async () => {
		const user = userEvent.setup()
		renderWith() // no transport → offline
		const btn = screen.getByRole('button', { name: /configurer la synchronisation/i })
		expect(btn).toBeInTheDocument()
		expect(screen.getByRole('status')).toHaveTextContent(/local/i)

		await user.click(btn)
		expect(screen.getByRole('dialog')).toBeInTheDocument()
	})
})
