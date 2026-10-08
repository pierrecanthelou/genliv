import { render, screen, fireEvent } from '@testing-library/react'
import { PanneauRepetition } from '../components/PanneauRepetition'

const mockDossier = {
	schema: 1,
	id: 'test',
	titre: 'Test',
	monde: {
		lieux: [{ id: 'lieu.foret', nom: 'Foret profonde', description: 'Des arbres partout' }],
		personnages: [],
		objets: [],
		indices: [],
		quetes: [],
		evenements: [],
		conditions: {},
	},
	charpente: {
		depart: { lieu_id: 'lieu.foret', texte_ouverture_joueur: 'Bienvenue' },
		jalons: [],
		fins: [{ id: 'fin.victoire', nom: 'Victoire eclatante', condition_texte: 'test' }],
	},
}

jest.mock('../../../brain', () => ({
	useOpenDossier: jest.fn(() => mockDossier),
	Badge: ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
	Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
	ListRow: ({ title, subtitle }: { title: string; subtitle?: string }) => (
		<div data-testid="list-row">
			{title}
			{subtitle && <span>{subtitle}</span>}
		</div>
	),
	SECTIONS: [
		{ id: 'canon', titre: 'Canon' },
		{ id: 'depart', titre: 'Depart' },
	],
}))

jest.mock('../utils/repeter', () => ({
	repeter: jest.fn(),
	PAS_MAX: 20,
}))

import { useOpenDossier } from '../../../brain'
import { repeter } from '../utils/repeter'

const mockRepeter = repeter as jest.Mock
const mockUseOpenDossier = useOpenDossier as jest.Mock

beforeEach(() => {
	jest.clearAllMocks()
	mockUseOpenDossier.mockReturnValue(mockDossier)
})

describe('PanneauRepetition', () => {
	it('invite — affiche l etat invite quand jamais lance', () => {
		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)

		expect(screen.getByText('Lancer la répétition')).toBeInTheDocument()
		expect(screen.getByText(/joueur synthétique parcourt/)).toBeInTheDocument()
	})

	it('resultat_fin — affiche le nom de la fin et le lieu', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: { graine: 1, pas: 5, lieu_id: 'lieu.foret', arret: 'fin', fin_id: 'fin.victoire' },
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/Victoire eclatante/)).toBeInTheDocument()
		expect(screen.getByText(/PAS 5 SUR 20/)).toBeInTheDocument()
		expect(screen.getByText('Foret profonde')).toBeInTheDocument()
	})

	it('refus_dossier_injouable — affiche le message et le lien vers la section', () => {
		mockRepeter.mockReturnValue({
			ok: false,
			refus: 'dossier_injouable',
			bloquant: { id: 'ctrl.depart', niveau: 'bloquant', section: 'depart', message: 'Texte de depart manquant' },
		})

		const onSelect = jest.fn()
		render(<PanneauRepetition dossierId="test" onSelectSection={onSelect} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText('RÉPÉTITION IMPOSSIBLE')).toBeInTheDocument()
		expect(screen.getByText('Texte de depart manquant')).toBeInTheDocument()

		fireEvent.click(screen.getByText(/Corriger dans/))
		expect(onSelect).toHaveBeenCalledWith('depart')
		expect(screen.queryByText('Relancer')).not.toBeInTheDocument()
	})

	it('resultat_impasse — affiche le texte impasse et le lieu', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: { graine: 1, pas: 3, lieu_id: 'lieu.foret', arret: 'impasse' },
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/Impasse pour un joueur/)).toBeInTheDocument()
		expect(screen.getByText(/PAS 3 SUR 20/)).toBeInTheDocument()
		expect(screen.getByText('Foret profonde')).toBeInTheDocument()
	})

	it('resultat_combat_ouvert — affiche le texte combat et le monstre', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: { graine: 1, pas: 2, lieu_id: 'lieu.foret', arret: 'combat_ouvert', monstre_ref: 'bestiaire.gobelin' },
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/combat/)).toBeInTheDocument()
		expect(screen.getByText(/bestiaire.gobelin/)).toBeInTheDocument()
		expect(screen.getByText(/PAS 2 SUR 20/)).toBeInTheDocument()
	})

	it('resultat_pas_max — affiche le texte 20 pas sans fin', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: { graine: 1, pas: 20, lieu_id: 'lieu.foret', arret: 'pas_max' },
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/parcouru 20 pas/)).toBeInTheDocument()
		expect(screen.getByText(/PAS 20 SUR 20/)).toBeInTheDocument()
	})

	it('relancer_incremente — cliquer Relancer incremente la graine', () => {
		let appelAvecGraine: number[] = []
		mockRepeter.mockImplementation((_d: unknown, g: number) => {
			appelAvecGraine.push(g)
			return {
				ok: true,
				rapport: { graine: g, pas: 20, lieu_id: 'lieu.foret', arret: 'pas_max' },
			}
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByTestId('badge')).toHaveTextContent('Parcours n°1')

		appelAvecGraine = []
		fireEvent.click(screen.getByText('Relancer'))

		expect(appelAvecGraine).toContain(2)
		expect(screen.getByTestId('badge')).toHaveTextContent('Parcours n°2')
	})
})
