/**
 * Tests du composant CarnetIndices — vue dérivée du journal, affichage
 * des révélations appliquées (lot B, moteur-acteurs it2).
 *
 * Critère #7 du plan : jointure sur entrée `reveler_indice`/`applique`,
 * libellé dérivé `#{tour} — {VERBE}` (verbeDeCommande(origine), registre interface), corps = recit réel, état vide si
 * aucune révélation.
 */
import { render, screen } from '@testing-library/react'
import { CarnetIndices } from './CarnetIndices'
import type { EntreeJournal } from '../../../brain'
import type { FaitsDeSession } from '../../../brain/dossier/faits'

// Fonction d'aide pour créer des caracs par défaut
function createDefaultCaracs(): Record<string, number> {
	return {
		FO: 10,
		AG: 10,
		DX: 10,
		EN: 10,
		IN: 10,
		IG: 10,
		SE: 10,
		CA: 10,
	}
}

// Fonction d'aide pour créer un héros minimal par défaut
function createDefaultHero() {
	return {
		name: 'Test Hero',
		caracs: createDefaultCaracs(),
		pvMax: 20,
		pv: 20,
		peMax: 10,
		pe: 10,
		mcBonus: 0,
		xp: 0,
	} as const
}

// Fonction d'aide pour créer une session par défaut
function createDefaultSession(monde: FaitsDeSession, journal: readonly EntreeJournal[] = []) {
	return {
		schema: 1,
		dossier_id: 'test-dossier',
		dossier_maj: 'test',
		horloge: { tour: 1 },
		monde,
		journal,
		attente: undefined,
		graine_alea: 123,
		heros: createDefaultHero(),
		memoire: null,
	} as const
}

describe('CarnetIndices', () => {
	// État vide — aucune révélation
	it('affiche état vide quand aucune révélation', () => {
		const monde: FaitsDeSession = {
			lieu_courant: 'lieu1',
			indices_connus: [],
			lieux_visites: [],
			objets_possedes: [],
			jalons_atteints: [],
			evenements_consommes: [],
			pnj: {},
		}

		const session = createDefaultSession(monde, [])

		render(<CarnetIndices session={session} />)

		const placeholder = screen.getByText(/Aucun indice découvert pour l'instant/)
		expect(placeholder).toBeInTheDocument()
	})

	// Affichage d'une révélation — jointure correcte
	it('affiche une ligne pour chaque révélation appliquée', () => {
		const monde: FaitsDeSession = {
			lieu_courant: 'lieu1',
			indices_connus: ['indice1', 'indice2'],
			lieux_visites: [],
			objets_possedes: [],
			jalons_atteints: [],
			evenements_consommes: [],
			pnj: { pnj1: { a_dit: ['indice1'] } },
		}

		const journal: readonly EntreeJournal[] = [
			{
				tour: 1,
				role: 'joueur',
				texte: 'Entrée 1',
			},
			{
				tour: 2,
				role: 'moteur',
				texte: 'Entrée 2',
			},
			{
				tour: 3,
				role: 'moteur',
				origine: 'parler',
				recit: 'Le PNJ confie un secret',
				texte: 'Révélation',
				deltas: [
					{
						delta: 'reveler_indice' as const,
						cibles: ['indice1'],
						effet: 'applique' as const,
					},
				],
			},
		]

		const session = createDefaultSession(monde, journal)

		render(<CarnetIndices session={session} />)

		// Vérifier que la réplique est affichée
		const replique = screen.getByText('Le PNJ confie un secret')
		expect(replique).toBeInTheDocument()

		// Vérifier que le libellé est dérivé correctement — verbeDeCommande(origine)
		const libelle = screen.getByText('#3 — PARLER')
		expect(libelle).toBeInTheDocument()
	})

	// Plusieurs révélations
	it('affiche plusieurs lignes pour plusieurs révélations', () => {
		const monde: FaitsDeSession = {
			lieu_courant: 'lieu1',
			indices_connus: ['indice1', 'indice2'],
			lieux_visites: [],
			objets_possedes: [],
			jalons_atteints: [],
			evenements_consommes: [],
			pnj: {},
		}

		const journal: readonly EntreeJournal[] = [
			{
				tour: 2,
				role: 'moteur',
				origine: 'parler',
				recit: 'Première révélation',
				texte: 'Rev1',
				deltas: [
					{
						delta: 'reveler_indice' as const,
						cibles: ['indice1'],
						effet: 'applique' as const,
					},
				],
			},
			{
				tour: 4,
				role: 'moteur',
				origine: 'parler',
				recit: 'Deuxième révélation',
				texte: 'Rev2',
				deltas: [
					{
						delta: 'reveler_indice' as const,
						cibles: ['indice2'],
						effet: 'applique' as const,
					},
				],
			},
		]

		const session = createDefaultSession(monde, journal)

		render(<CarnetIndices session={session} />)

		expect(screen.getByText('Première révélation')).toBeInTheDocument()
		expect(screen.getByText('Deuxième révélation')).toBeInTheDocument()
		expect(screen.getByText('#2 — PARLER')).toBeInTheDocument()
		expect(screen.getByText('#4 — PARLER')).toBeInTheDocument()
	})

	// Révélation sans effet
	it('ignore les révélations sans effet appliqué', () => {
		const monde: FaitsDeSession = {
			lieu_courant: 'lieu1',
			indices_connus: ['indice1'],
			lieux_visites: [],
			objets_possedes: [],
			jalons_atteints: [],
			evenements_consommes: [],
			pnj: {},
		}

		const journal: readonly EntreeJournal[] = [
			{
				tour: 2,
				role: 'moteur',
				origine: 'parler',
				recit: 'Tentative de révélation',
				texte: 'Tentative',
				deltas: [
					{
						delta: 'reveler_indice' as const,
						cibles: ['indice1'],
						effet: 'sans_effet' as const, // Pas appliqué
					},
				],
			},
		]

		const session = createDefaultSession(monde, journal)

		render(<CarnetIndices session={session} />)

		// État vide affiché
		expect(screen.getByText(/Aucun indice découvert pour l'instant/)).toBeInTheDocument()
		// Pas la réplique
		expect(screen.queryByText('Tentative de révélation')).not.toBeInTheDocument()
	})

	// Vérifier que pas de onSelect sur ListRow (lecture seule)
	it('rend les lignes sans onSelect (lecture seule)', () => {
		const monde: FaitsDeSession = {
			lieu_courant: 'lieu1',
			indices_connus: ['indice1'],
			lieux_visites: [],
			objets_possedes: [],
			jalons_atteints: [],
			evenements_consommes: [],
			pnj: {},
		}

		const journal: readonly EntreeJournal[] = [
			{
				tour: 1,
				role: 'moteur',
				origine: 'parler',
				recit: 'Révélation unique',
				texte: 'Rev',
				deltas: [
					{
						delta: 'reveler_indice' as const,
						cibles: ['indice1'],
						effet: 'applique' as const,
					},
				],
			},
		]

		const session = createDefaultSession(monde, journal)

		render(<CarnetIndices session={session} />)

		// Vérifier que les ListRow sont rendues en tant que divs (pas de button)
		const row = screen.getByText('Révélation unique').closest('div')
		expect(row).toBeInTheDocument()
		expect(row?.tagName).toBe('DIV')
	})
})
