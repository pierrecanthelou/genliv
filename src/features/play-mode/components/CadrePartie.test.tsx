/**
 * Tests du composant CadrePartie — enveloppe commune avec header et actions.
 * Vérifie que la prop actionsEntete est montée correctement et que EcranRefus
 * (qui n'appelle pas cette prop) rend EXACTEMENT comme avant (non-régression).
 */
import { render, screen } from '@testing-library/react'
import { CadrePartie } from './CadrePartie'
import { BrainProvider, type Brain } from '../../../brain'

// Mock du contexte Brain minimal pour les tests
const mockBrain = {
	router: {
		navigate: jest.fn(),
		current: jest.fn(() => ({ name: 'dossier', dossierId: 'test' })),
		subscribe: jest.fn(() => jest.fn()),
	},
} as unknown as Brain

function renderWithBrain(component: JSX.Element): ReturnType<typeof render> {
	return render(<BrainProvider brain={mockBrain as Brain}>{component}</BrainProvider>)
}

describe('CadrePartie', () => {
	it('rend le titre correctement', () => {
		renderWithBrain(
			<CadrePartie titre="Mon Aventure" sortie={{ name: 'dossier', dossierId: 'test-id' }}>
				Contenu
			</CadrePartie>,
		)

		// Utiliser un matcher flexible pour le texte split par plusieurs éléments
		expect(screen.getByText(/Aperçu du jeu/)).toBeInTheDocument()
		expect(screen.getByText('Mon Aventure')).toBeInTheDocument()
	})

	it('rend le titre nulle quand absent', () => {
		renderWithBrain(
			<CadrePartie titre={null} sortie={{ name: 'dossier', dossierId: 'test-id' }}>
				Contenu
			</CadrePartie>,
		)

		// Doit avoir le titre APERCU_DU_JEU
		expect(screen.getByText('Aperçu du jeu')).toBeInTheDocument()
	})

	it('affiche le bouton Quitter le test', () => {
		renderWithBrain(
			<CadrePartie titre="Test" sortie={{ name: 'dossier', dossierId: 'test-id' }}>
				Contenu
			</CadrePartie>,
		)

		const btn = screen.getByLabelText('Quitter le test')
		expect(btn).toBeInTheDocument()
		expect(btn).toHaveTextContent('✕ Quitter le test')
	})

	it('accepte et rend actionsEntete quand présent', () => {
		renderWithBrain(
			<CadrePartie
				titre="Test"
				sortie={{ name: 'dossier', dossierId: 'test-id' }}
				actionsEntete={<button data-testid="action-btn">Action</button>}
			>
				Contenu
			</CadrePartie>,
		)

		const actionBtn = screen.getByTestId('action-btn')
		expect(actionBtn).toBeInTheDocument()
		expect(actionBtn).toHaveTextContent('Action')
	})

	it('ne crash pas sans actionsEntete (undefined)', () => {
		renderWithBrain(
			<CadrePartie titre="Test" sortie={{ name: 'dossier', dossierId: 'test-id' }}>
				Contenu
			</CadrePartie>,
		)

		// Doit rendre sans erreur
		expect(screen.getByText(/Aperçu du jeu/)).toBeInTheDocument()
		expect(screen.getByLabelText('Quitter le test')).toBeInTheDocument()
	})

	it('rend le contenu enfant', () => {
		renderWithBrain(
			<CadrePartie titre="Test" sortie={{ name: 'dossier', dossierId: 'test-id' }}>
				<div data-testid="child">Contenu test</div>
			</CadrePartie>,
		)

		expect(screen.getByTestId('child')).toBeInTheDocument()
		expect(screen.getByText('Contenu test')).toBeInTheDocument()
	})

	it('rend le bandeau quand présent', () => {
		renderWithBrain(
			<CadrePartie
				titre="Test"
				sortie={{ name: 'dossier', dossierId: 'test-id' }}
				bandeau={<div data-testid="bandeau">Banneau</div>}
			>
				Contenu
			</CadrePartie>,
		)

		expect(screen.getByTestId('bandeau')).toBeInTheDocument()
	})
})
