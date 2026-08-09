import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type AppEventName, type Brain } from '../../../brain'
import { App } from '../../../App'

/**
 * Mounted through `<App/>` (composition root), not through `CreateDossierEntry`
 * on its own: criterion #2 (plan § 6) requires the author to LAND on
 * DossierEditorScreen, and only the composition root switches routes.
 */
function renderApp() {
	const brain = createBrain()
	const order: AppEventName[] = []
	brain.events.on('dossier:created', () => order.push('dossier:created'))
	brain.events.on('dossier:opened', () => order.push('dossier:opened'))
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, order }
}

describe('book-creation flow — dossier', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('creates a dossier, in order, all the way to the editor screen', async () => {
		const user = userEvent.setup()
		let ecritAuPremierEvenement: boolean | null = null
		const { brain, order } = renderApp()
		// La persistance résout AVANT l'événement (KR-004) : au premier événement,
		// le dossier créé est déjà dans le magasin.
		brain.events.on('dossier:created', ({ dossierId }) => {
			ecritAuPremierEvenement = brain.dossiers.get(dossierId) !== null
		})

		await user.click(screen.getByRole('button', { name: /nouveau dossier/i }))
		await user.type(screen.getByLabelText(/titre/i), "La Caverne d'Aldûr")
		await user.click(screen.getByRole('button', { name: 'Créer' }))

		expect(order).toEqual(['dossier:created', 'dossier:opened'])
		expect(ecritAuPremierEvenement).toBe(true)
		expect(brain.dossiers.list()).toHaveLength(1)
		// Atterrissage sur DossierEditorScreen, qui rend le titre du dossier.
		expect(screen.getByRole('heading', { name: "La Caverne d'Aldûr" })).toBeInTheDocument()
	})

	it('does not create a dossier when the dialog is cancelled', async () => {
		const user = userEvent.setup()
		const { brain } = renderApp()

		await user.click(screen.getByRole('button', { name: /nouveau dossier/i }))
		await user.type(screen.getByLabelText(/titre/i), 'Abandonné')
		await user.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(brain.dossiers.list()).toHaveLength(0)
	})

	it('double submission creates only one dossier (guard against a double-click on Creer)', async () => {
		const user = userEvent.setup()
		const { brain } = renderApp()

		await user.click(screen.getByRole('button', { name: /nouveau dossier/i }))
		await user.type(screen.getByLabelText(/titre/i), 'Double')
		await user.dblClick(screen.getByRole('button', { name: 'Créer' }))

		expect(brain.dossiers.list()).toHaveLength(1)
	})
})

// Cloud-first create: a new dossier is written to the local store first (so it
// persists + restores on reload offline) and queued for the background cloud
// push via the CloudSyncService decorator (KR-093/095/011) — same discipline
// already proven for Book (book-creation it3), repointed here onto Dossier.
describe('book-creation cloud-first persistence — dossier', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('persists a created dossier under PersistenceService so it survives a reload', () => {
		const created: Brain = createBrain()
		const dossier = created.dossiers.create('Persistante')
		// "Reload": a brand-new brain over the same local store re-reads the dossier.
		const reloaded = createBrain()
		expect(reloaded.dossiers.get(dossier.id)?.titre).toBe('Persistante')
		expect(reloaded.dossiers.list().map((d) => (d.lisible ? d.titre : d.id))).toContain('Persistante')
	})
})
