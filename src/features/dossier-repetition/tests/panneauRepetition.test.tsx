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
	localiserEntite: jest.fn((espace: string, entite: unknown, index: number) => {
		const LABELS: Record<string, string> = {
			pnj: 'Personnage',
			lieu: 'Lieu',
			objet: 'Objet',
			indice: 'Indice',
			quete: 'Quête',
			evenement: 'Événement',
		}
		const label = LABELS[espace] ?? espace
		const ent = entite as { nom?: string }
		if (ent?.nom) return `${label} « ${ent.nom} »`
		return `${label} n°${index + 1} (sans nom)`
	}),
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
	BESTIARY_BY_TEMPLATE: {
		gobelin: { name: 'Gobelin' },
		dragon: { name: 'Dragon' },
	},
	PREFIXE_BESTIAIRE: 'bestiaire.',
}))

jest.mock('../utils/repeter', () => ({
	repeter: jest.fn(),
	PAS_MAX: 20,
	ROUNDS_MAX: 50,
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
			rapport: {
				graine: 1,
				pas: 5,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				lieux_visites: ['lieu.foret'],
				arret: 'fin',
				fin_id: 'fin.victoire',
			},
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
			rapport: {
				graine: 1,
				pas: 3,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				lieux_visites: ['lieu.foret'],
				arret: 'impasse',
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/Impasse pour un joueur/)).toBeInTheDocument()
		expect(screen.getByText(/PAS 3 SUR 20/)).toBeInTheDocument()
		expect(screen.getByText('Foret profonde')).toBeInTheDocument()
	})

	it('resultat_mort — affiche le texte mort et le nom du monstre résolu', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 2,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				lieux_visites: ['lieu.foret'],
				arret: 'mort',
				monstre_ref: 'bestiaire.dragon',
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/est mort face à Dragon/)).toBeInTheDocument()
		expect(screen.getByText(/Relancez pour tirer/)).toBeInTheDocument()
		expect(screen.getByText(/PAS 2 SUR 20/)).toBeInTheDocument()
	})

	it('resultat_combat_sans_issue — affiche le texte sans issue et le nom du monstre résolu', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 3,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				lieux_visites: ['lieu.foret'],
				arret: 'combat_sans_issue',
				monstre_ref: 'bestiaire.gobelin',
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/n'a pas été tranché en 50 rounds/)).toBeInTheDocument()
		expect(screen.getByText(/ni Gobelin ne l'a emporté/)).toBeInTheDocument()
		expect(screen.getByText(/PAS 3 SUR 20/)).toBeInTheDocument()
	})

	it('resultat_pas_max — affiche le texte 20 pas sans fin', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 20,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				lieux_visites: ['lieu.foret'],
				arret: 'pas_max',
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/parcouru 20 pas/)).toBeInTheDocument()
		expect(screen.getByText(/PAS 20 SUR 20/)).toBeInTheDocument()
	})

	it('repli_monstre_inconnu — template absent du bestiaire affiche le repli', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 2,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				lieux_visites: ['lieu.foret'],
				arret: 'mort',
				monstre_ref: 'bestiaire.inconnu',
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/un monstre du bestiaire/)).toBeInTheDocument()
	})

	it('lieu_introuvable — pas de ListRow quand le lieu n est pas dans le dossier', () => {
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 3,
				lieu_id: 'lieu.fantome',
				combats_traverses: 0,
				lieux_visites: ['lieu.foret'],
				arret: 'impasse',
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText(/Impasse/)).toBeInTheDocument()
		expect(screen.queryByTestId('list-row')).not.toBeInTheDocument()
	})

	it('relancer_incremente — cliquer Relancer incremente la graine', () => {
		let appelAvecGraine: number[] = []
		mockRepeter.mockImplementation((_d: unknown, g: number) => {
			appelAvecGraine.push(g)
			return {
				ok: true,
				rapport: {
					graine: g,
					pas: 20,
					lieu_id: 'lieu.foret',
					combats_traverses: 0,
					lieux_visites: ['lieu.foret'],
					arret: 'pas_max',
				},
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

	it('lieux non visités affichés', () => {
		const dossier = {
			...mockDossier,
			monde: {
				...mockDossier.monde,
				lieux: [
					{ id: 'lieu.foret', nom: 'Foret profonde', description: 'Des arbres partout' },
					{ id: 'lieu.caverne', nom: 'Caverne sombre', description: 'Sous terre' },
					{ id: 'lieu.chateau', nom: 'Chateau ancien', description: 'Forteresse' },
				],
			},
		}
		mockUseOpenDossier.mockReturnValue(dossier)
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 2,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				arret: 'impasse',
				lieux_visites: ['lieu.foret'],
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText('NON ATTEINT SUR CE PARCOURS')).toBeInTheDocument()
		expect(screen.getByText('Lieu « Caverne sombre »')).toBeInTheDocument()
		expect(screen.getByText('Lieu « Chateau ancien »')).toBeInTheDocument()
	})

	it('index localiserEntite pris dans la liste complete, pas la liste filtree', () => {
		const dossier = {
			...mockDossier,
			monde: {
				...mockDossier.monde,
				lieux: [
					{ id: 'lieu.foret', nom: 'Foret profonde', description: 'Des arbres partout' },
					{ id: 'lieu.caverne', nom: 'Caverne sombre', description: 'Sous terre' },
					{ id: 'lieu.sans-nom', description: 'Un endroit mysterieux' },
				],
			},
		}
		mockUseOpenDossier.mockReturnValue(dossier)
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 2,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				arret: 'impasse',
				lieux_visites: ['lieu.foret'],
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText('Lieu n°3 (sans nom)')).toBeInTheDocument()
	})

	it('PNJ non atteints par co-présence', () => {
		const dossier = {
			...mockDossier,
			monde: {
				...mockDossier.monde,
				lieux: [
					{ id: 'lieu.foret', nom: 'Foret profonde', description: 'Des arbres partout' },
					{ id: 'lieu.caverne', nom: 'Caverne sombre', description: 'Sous terre' },
				],
				personnages: [
					{
						id: 'pnj.garde',
						nom: 'Garde',
						presence: [{ lieu_id: 'lieu.caverne', texte: 'Le garde est ici' }],
					},
					{
						id: 'pnj.magicien',
						nom: 'Magicien',
						presence: [{ lieu_id: 'lieu.foret', texte: 'Le magicien est ici' }],
					},
				],
			},
		}
		mockUseOpenDossier.mockReturnValue(dossier)
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 1,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				arret: 'impasse',
				lieux_visites: ['lieu.foret'],
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText('Personnage « Garde »')).toBeInTheDocument()
		expect(screen.queryByText('Personnage « Magicien »')).not.toBeInTheDocument()
	})

	it('PNJ sans presence exclus du constat', () => {
		const dossier = {
			...mockDossier,
			monde: {
				...mockDossier.monde,
				personnages: [
					{
						id: 'pnj.fantome',
						nom: 'Fantome',
						presence: [],
					},
					{
						id: 'pnj.esprit',
						nom: 'Esprit',
					},
				],
			},
		}
		mockUseOpenDossier.mockReturnValue(dossier)
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 0,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				arret: 'fin',
				fin_id: 'fin.victoire',
				lieux_visites: ['lieu.foret'],
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText('Tous les personnages placés ont été croisés par ce parcours.')).toBeInTheDocument()
		expect(screen.queryByText('Personnage « Fantome »')).not.toBeInTheDocument()
		expect(screen.queryByText('Personnage « Esprit »')).not.toBeInTheDocument()
	})

	it('état vide lieux — tous visités', () => {
		const dossier = {
			...mockDossier,
			monde: {
				...mockDossier.monde,
				lieux: [{ id: 'lieu.foret', nom: 'Foret profonde', description: 'Des arbres partout' }],
			},
		}
		mockUseOpenDossier.mockReturnValue(dossier)
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 0,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				arret: 'fin',
				fin_id: 'fin.victoire',
				lieux_visites: ['lieu.foret'],
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText('Tous les lieux ont été visités par ce parcours.')).toBeInTheDocument()
	})

	it('état vide PNJ — tous placés croisés', () => {
		const dossier = {
			...mockDossier,
			monde: {
				...mockDossier.monde,
				lieux: [
					{ id: 'lieu.foret', nom: 'Foret profonde', description: 'Des arbres partout' },
					{ id: 'lieu.caverne', nom: 'Caverne sombre', description: 'Sous terre' },
				],
				personnages: [
					{
						id: 'pnj.garde',
						nom: 'Garde',
						presence: [{ lieu_id: 'lieu.caverne', texte: 'Le garde est ici' }],
					},
				],
			},
		}
		mockUseOpenDossier.mockReturnValue(dossier)
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 2,
				lieu_id: 'lieu.caverne',
				combats_traverses: 0,
				arret: 'fin',
				fin_id: 'fin.victoire',
				lieux_visites: ['lieu.foret', 'lieu.caverne'],
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText('Tous les personnages placés ont été croisés par ce parcours.')).toBeInTheDocument()
	})

	it('état vide PNJ — aucun dans le dossier', () => {
		const dossier = {
			...mockDossier,
			monde: {
				...mockDossier.monde,
				lieux: [{ id: 'lieu.foret', nom: 'Foret profonde', description: 'Des arbres partout' }],
				personnages: [],
			},
		}
		mockUseOpenDossier.mockReturnValue(dossier)
		mockRepeter.mockReturnValue({
			ok: true,
			rapport: {
				graine: 1,
				pas: 0,
				lieu_id: 'lieu.foret',
				combats_traverses: 0,
				arret: 'fin',
				fin_id: 'fin.victoire',
				lieux_visites: ['lieu.foret'],
			},
		})

		render(<PanneauRepetition dossierId="test" onSelectSection={jest.fn()} />)
		fireEvent.click(screen.getByText('Lancer la répétition'))

		expect(screen.getByText('Aucun personnage dans le dossier.')).toBeInTheDocument()
	})
})
