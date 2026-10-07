/**
 * moteur-fins it4 — tests du rejeu avec meme graine
 *
 * Criteres couverts :
 *  CA1 — graineImposee utilisee, tirerGraine non appelee (PartieDemarree)
 *  CA1 — graine 0 valide via graineImposee (pas double pipe)
 *  CA1 — session persistee porte la graine imposee
 *  CA1 — clic Rejouer sur EcranFin → meme graine (AiguillagePartie integration)
 *  CA3 — Nouvelle partie apres Rejouer tire une graine neuve (graine non collante)
 */

import fs from 'fs'
import path from 'path'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier } from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { PartieDemarree } from '../components/PartieEnCours'
import { AiguillagePartie } from '../components/AiguillagePartie'
import { terminerCreationHeros } from './creerHerosDeTest'

// --- Helpers pour les tests unitaires PartieDemarree ---

function avecOuverture(dossier: Dossier): Dossier {
	return {
		...dossier,
		charpente: {
			...dossier.charpente,
			depart: { ...dossier.charpente.depart, texte_ouverture_joueur: 'Vous entrez...' },
		},
		updatedAt: '2026-10-07T10:00:00.000Z',
	}
}

function monterPartieJouable(brain: Brain): Dossier {
	const seme = brain.dossiers.create('Test rejouer')
	brain.persistence.set(dossierKey(seme.id), avecOuverture(seme))
	return brain.dossiers.get(seme.id) as Dossier
}

// --- Helpers pour les tests d'integration AiguillagePartie ---

const CHEMIN_REFERENCE = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'brain',
	'dossier',
	'__fixtures__',
	'dossier-reference.json',
)

async function jouerJusquaFin(user: ReturnType<typeof userEvent.setup>): Promise<void> {
	await terminerCreationHeros(user)
	await waitFor(() => {
		expect(screen.getByLabelText('CONSOLE')).toBeInTheDocument()
	})
	await user.type(screen.getByLabelText('CONSOLE'), 'ALLER lieu.tour-effondree{Enter}')
	await waitFor(() => {
		expect(screen.getByText('COMBAT')).toBeInTheDocument()
	})
	await user.click(screen.getByRole('button', { name: /Fuir le combat/ }))
	await waitFor(() => {
		expect(screen.getByText('FUITE')).toBeInTheDocument()
	})
	await user.click(screen.getByRole('button', { name: /Continuer/ }))
	await waitFor(() => {
		expect(screen.getByText(/La vigie abandonnée/)).toBeInTheDocument()
	})
}

describe('rejouer — PartieDemarree', () => {
	let brain: Brain
	let dossier: Dossier

	beforeEach(() => {
		window.localStorage.clear()
		brain = createBrain()
		dossier = monterPartieJouable(brain)
	})

	it('graineImposee utilisee, tirerGraine non appelee', () => {
		const tirerGraineMock = jest.fn(() => 999)

		render(
			<BrainProvider brain={brain}>
				<PartieDemarree
					dossier={dossier}
					dossierId={dossier.id}
					graineImposee={42}
					tirerGraine={tirerGraineMock}
					onNouvellePartie={jest.fn()}
					onRejouer={jest.fn()}
				/>
			</BrainProvider>,
		)

		expect(tirerGraineMock).not.toHaveBeenCalled()
		expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
	})

	it('graine 0 valide via graineImposee (pas double pipe)', () => {
		const tirerGraineMock = jest.fn(() => 999)

		render(
			<BrainProvider brain={brain}>
				<PartieDemarree
					dossier={dossier}
					dossierId={dossier.id}
					graineImposee={0}
					tirerGraine={tirerGraineMock}
					onNouvellePartie={jest.fn()}
					onRejouer={jest.fn()}
				/>
			</BrainProvider>,
		)

		expect(tirerGraineMock).not.toHaveBeenCalled()
		const lecture = brain.sessions.lire(dossier)
		expect(lecture.statut).toBe('reprenable')
		if (lecture.statut === 'reprenable') {
			expect(lecture.session.graine_alea).toBe(0)
		}
	})

	it('sans graineImposee, tirerGraine est appelee', () => {
		const tirerGraineMock = jest.fn(() => 42)

		render(
			<BrainProvider brain={brain}>
				<PartieDemarree
					dossier={dossier}
					dossierId={dossier.id}
					tirerGraine={tirerGraineMock}
					onNouvellePartie={jest.fn()}
					onRejouer={jest.fn()}
				/>
			</BrainProvider>,
		)

		expect(tirerGraineMock).toHaveBeenCalledTimes(1)
	})

	it('session persistee porte la graine imposee', () => {
		render(
			<BrainProvider brain={brain}>
				<PartieDemarree
					dossier={dossier}
					dossierId={dossier.id}
					graineImposee={12345}
					tirerGraine={() => 999}
					onNouvellePartie={jest.fn()}
					onRejouer={jest.fn()}
				/>
			</BrainProvider>,
		)

		const lecture = brain.sessions.lire(dossier)
		expect(lecture.statut).toBe('reprenable')
		if (lecture.statut === 'reprenable') {
			expect(lecture.session.graine_alea).toBe(12345)
		}
	})
})

describe('rejouer — AiguillagePartie integration', () => {
	let brain: Brain
	let dossier: Dossier
	let tirerGraineMock: jest.Mock

	beforeEach(() => {
		window.localStorage.clear()
		brain = createBrain()
		const inspection = brain.dossiers.importDossier(fs.readFileSync(CHEMIN_REFERENCE, 'utf8'))
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		dossier = inspection.dossier
		tirerGraineMock = jest.fn(() => 7)
	})

	it(
		'clic Rejouer sur EcranFin → meme graine, tirerGraine non rappelee (CA1)',
		async () => {
			const user = userEvent.setup()

			render(
				<BrainProvider brain={brain}>
					<AiguillagePartie dossier={dossier} dossierId={dossier.id} tirerGraine={tirerGraineMock} />
				</BrainProvider>,
			)

			await jouerJusquaFin(user)
			expect(tirerGraineMock).toHaveBeenCalledTimes(1)

			await user.click(screen.getByRole('button', { name: /Rejouer/i }))

			await waitFor(() => {
				expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
			})

			expect(tirerGraineMock).toHaveBeenCalledTimes(1)

			const lecture = brain.sessions.lire(dossier)
			expect(lecture.statut).toBe('reprenable')
			if (lecture.statut === 'reprenable') {
				expect(lecture.session.graine_alea).toBe(7)
			}
		},
		30000,
	)

	it(
		'Nouvelle partie apres Rejouer → tirerGraine rappelee, graine non collante (CA3)',
		async () => {
			const user = userEvent.setup()

			render(
				<BrainProvider brain={brain}>
					<AiguillagePartie dossier={dossier} dossierId={dossier.id} tirerGraine={tirerGraineMock} />
				</BrainProvider>,
			)

			// Phase 1 : jouer jusqu'a la fin, cliquer Rejouer
			await jouerJusquaFin(user)
			await user.click(screen.getByRole('button', { name: /Rejouer/i }))

			await waitFor(() => {
				expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
			})

			// Phase 2 : terminer la creation, arriver en jeu
			await terminerCreationHeros(user)

			await waitFor(() => {
				expect(screen.getByLabelText('CONSOLE')).toBeInTheDocument()
			})

			// Phase 3 : cliquer Nouvelle partie via le dialogue de confirmation
			const boutons = screen.getAllByRole('button', { name: /Nouvelle partie/i })
			await user.click(boutons[0])

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument()
			})

			const dialog = screen.getByRole('dialog')
			const confirmer = within(dialog).getByRole('button', { name: /Nouvelle partie/i })
			await user.click(confirmer)

			// Phase 4 : retour a la creation — tirerGraine rappelee (graine non collante)
			await waitFor(() => {
				expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
			})

			expect(tirerGraineMock).toHaveBeenCalledTimes(2)
		},
		45000,
	)
})
