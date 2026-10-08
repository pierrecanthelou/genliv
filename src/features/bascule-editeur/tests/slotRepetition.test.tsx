import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type SectionId } from '../../../brain'
import { DossierEditorScreen } from '../components/DossierEditorScreen'

const SONDE_REPETITION = 'Sonde du panneau Repetition (test bascule-editeur)'

function SondePanneauRepetition({ onSelectSection }: { onSelectSection: (section: SectionId) => void }): JSX.Element {
	return (
		<div>
			<p>{SONDE_REPETITION}</p>
			<button type="button" onClick={() => onSelectSection('canon')}>
				Ouvrir Canon
			</button>
		</div>
	)
}

describe('DossierEditorScreen slotRepetition', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('la nav Repetition apparait et affiche la sonde au clic', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Dossier de test')

		render(
			<BrainProvider brain={brain}>
				<DossierEditorScreen
					dossierId={dossier.id}
					panneauRepetition={(onSelectSection) => <SondePanneauRepetition onSelectSection={onSelectSection} />}
				/>
			</BrainProvider>,
		)

		const navRepetition = screen.getByRole('navigation', { name: 'Répétition' })
		const bouton = navRepetition.querySelector('button')!
		expect(bouton).toBeInTheDocument()

		await user.click(bouton)
		expect(screen.getByText(SONDE_REPETITION)).toBeInTheDocument()
	})

	it('onSelectSection renvoie vers la section demandee', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = brain.dossiers.create('Dossier de test')

		render(
			<BrainProvider brain={brain}>
				<DossierEditorScreen
					dossierId={dossier.id}
					panneauRepetition={(onSelectSection) => <SondePanneauRepetition onSelectSection={onSelectSection} />}
				/>
			</BrainProvider>,
		)

		const navRepetition = screen.getByRole('navigation', { name: 'Répétition' })
		await user.click(navRepetition.querySelector('button')!)
		expect(screen.getByText(SONDE_REPETITION)).toBeInTheDocument()

		await user.click(screen.getByText('Ouvrir Canon'))

		const navSections = screen.getByRole('navigation', { name: 'Sections du dossier' })
		const lignesCanon = within(navSections).getAllByRole('button')
		expect(lignesCanon[0]).toHaveAttribute('aria-current', 'true')

		expect(screen.queryByText(SONDE_REPETITION)).not.toBeInTheDocument()
	})

	it('ordre des nav — Sections, Controles, Copilote, Repetition', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Dossier de test')

		render(
			<BrainProvider brain={brain}>
				<DossierEditorScreen
					dossierId={dossier.id}
					panneauControles={() => <p>Controles</p>}
					panneauCopilote={() => <p>Copilote</p>}
					panneauRepetition={() => <p>Repetition</p>}
				/>
			</BrainProvider>,
		)

		const navs = screen.getAllByRole('navigation')
		const labels = navs.map((n) => n.getAttribute('aria-label'))
		expect(labels).toEqual(['Sections du dossier', 'Contrôles', 'Copilote', 'Répétition'])
	})
})
