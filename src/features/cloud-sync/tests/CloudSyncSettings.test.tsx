import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { CloudSyncSettings } from '../components/CloudSyncSettings'

// window.location.reload is not implemented in jsdom — stub it
const reloadMock = jest.fn()
Object.defineProperty(window, 'location', {
	value: { ...window.location, reload: reloadMock },
	writable: true,
})

function renderSettings(onClose = jest.fn()) {
	const brain = createBrain()
	render(
		<BrainProvider brain={brain}>
			<CloudSyncSettings onClose={onClose} />
		</BrainProvider>,
	)
	return { brain }
}

describe('cloud-sync — CloudSyncSettings', () => {
	beforeEach(() => {
		window.localStorage.clear()
		reloadMock.mockClear()
	})

	it('renders the modal with URL and key fields', () => {
		renderSettings()
		expect(screen.getByRole('dialog')).toBeInTheDocument()
		expect(screen.getByLabelText(/url du worker/i)).toBeInTheDocument()
		expect(screen.getByLabelText(/clé de synchronisation/i)).toBeInTheDocument()
	})

	it('confirm button is disabled when URL or key is missing', () => {
		renderSettings()
		const confirm = screen.getByRole('button', { name: /activer et recharger/i })
		expect(confirm).toBeDisabled()
	})

	it('confirm button is disabled for an invalid URL even when key is filled', async () => {
		const user = userEvent.setup()
		renderSettings()
		await user.type(screen.getByLabelText(/url du worker/i), 'not-a-url')
		await user.type(screen.getByLabelText(/clé de synchronisation/i), 'my-key')
		expect(screen.getByRole('button', { name: /activer et recharger/i })).toBeDisabled()
	})

	it('confirm button becomes enabled with valid URL and key', async () => {
		const user = userEvent.setup()
		renderSettings()
		await user.type(screen.getByLabelText(/url du worker/i), 'https://genliv.example.workers.dev')
		await user.type(screen.getByLabelText(/clé de synchronisation/i), 'my-secret-key')
		expect(screen.getByRole('button', { name: /activer et recharger/i })).not.toBeDisabled()
	})

	it('saving stores credentials in cloudSettings and reloads', async () => {
		const user = userEvent.setup()
		const { brain } = renderSettings()

		await user.type(screen.getByLabelText(/url du worker/i), 'https://genliv.example.workers.dev')
		await user.type(screen.getByLabelText(/clé de synchronisation/i), 'my-secret-key')
		await user.click(screen.getByRole('button', { name: /activer et recharger/i }))

		expect(brain.cloudSettings.getWorkerUrl()).toBe('https://genliv.example.workers.dev')
		expect(brain.cloudSettings.getSyncKey()).toBe('my-secret-key')
		expect(reloadMock).toHaveBeenCalledTimes(1)
	})

	it('Generez une cle button fills the key field with a UUID', async () => {
		const user = userEvent.setup()
		renderSettings()
		const keyField = screen.getByLabelText(/clé de synchronisation/i)
		expect(keyField).toHaveValue('')

		await user.click(screen.getByRole('button', { name: /générer une clé/i }))
		expect((keyField as HTMLInputElement).value).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
		)
	})

	it('Annuler button calls onClose without saving', async () => {
		const user = userEvent.setup()
		const onClose = jest.fn()
		renderSettings(onClose)
		await user.click(screen.getByRole('button', { name: /annuler/i }))
		expect(onClose).toHaveBeenCalled()
		expect(reloadMock).not.toHaveBeenCalled()
	})

	it('shows Desactiver button when already configured and opens a confirmation dialog', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		brain.cloudSettings.setWorkerUrl('https://genliv.example.workers.dev')
		brain.cloudSettings.setSyncKey('existing-key')
		render(
			<BrainProvider brain={brain}>
				<CloudSyncSettings onClose={jest.fn()} />
			</BrainProvider>,
		)

		expect(screen.getByRole('button', { name: /désactiver la synchronisation/i })).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /désactiver la synchronisation/i }))

		expect(screen.getByRole('dialog', { name: /désactiver la synchronisation/i })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: /désactiver$/i })).toBeInTheDocument()
	})

	it('confirming Desactiver clears credentials and reloads', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		brain.cloudSettings.setWorkerUrl('https://genliv.example.workers.dev')
		brain.cloudSettings.setSyncKey('existing-key')
		render(
			<BrainProvider brain={brain}>
				<CloudSyncSettings onClose={jest.fn()} />
			</BrainProvider>,
		)

		await user.click(screen.getByRole('button', { name: /désactiver la synchronisation/i }))
		await user.click(screen.getByRole('button', { name: /désactiver$/i }))

		expect(brain.cloudSettings.getWorkerUrl()).toBeNull()
		expect(brain.cloudSettings.getSyncKey()).toBeNull()
		expect(reloadMock).toHaveBeenCalledTimes(1)
	})
})
