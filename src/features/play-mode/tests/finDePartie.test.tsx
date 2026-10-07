/**
 * TEST — l'ecran de fin de partie s'affiche apres une commande acceptee qui atteint une fin.
 * Critère #5 du plan : console et saisie libre retirées lors de l'affichage de la fin.
 */

import fs from 'fs'
import path from 'path'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { EcranPartie } from '../components/EcranPartie'
import { terminerCreationHeros } from './creerHerosDeTest'

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

function texteReference(): string {
	return fs.readFileSync(CHEMIN_REFERENCE, 'utf8')
}

describe('écran de fin après commande acceptée', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('écran de fin après commande, saisie retirée', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const inspection = brain.dossiers.importDossier(texteReference())
		if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
		const dossier = inspection.dossier

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		await terminerCreationHeros(user)

		// Attendre que le jeu soit prêt — témoins positifs console ET saisie libre
		await waitFor(() => {
			expect(screen.getByLabelText('CONSOLE')).toBeInTheDocument()
		})
		expect(screen.getByLabelText('QUE FAITES-VOUS ?')).toBeInTheDocument()

		// On va au lieu tour-effondree pour déclencher le combat, puis on le fuit
		// Ce qui devrait atteindre la fin vigie-abandonnee
		await user.type(screen.getByLabelText('CONSOLE'), 'ALLER lieu.tour-effondree{Enter}')

		// Attendre le combat
		await waitFor(() => {
			expect(screen.getByText('COMBAT')).toBeInTheDocument()
		})

		// Fuir le combat
		const fuirBtn = screen.getByRole('button', { name: /Fuir le combat/ })
		await user.click(fuirBtn)

		// Attendre la FUITE
		await waitFor(() => {
			expect(screen.getByText('FUITE')).toBeInTheDocument()
		})

		// Continuer après la fuite
		await user.click(screen.getByRole('button', { name: /Continuer/ }))

		// La fin devrait être atteinte et affichée
		await waitFor(() => {
			expect(screen.getByText(/La vigie abandonnée/)).toBeInTheDocument()
		})

		// Critère #5a : la section Fin de partie est montée
		expect(screen.getByRole('region', { name: 'Fin de partie' })).toBeInTheDocument()

		// Critère #5b : Fin.texte verbatim de bout en bout (lu depuis le dossier de référence)
		const texteAttendu = dossier.charpente.fins[1].texte!
		expect(screen.getByText(texteAttendu)).toBeInTheDocument()

		// Critère #5c : console ET saisie libre retirées
		expect(screen.queryByLabelText('CONSOLE')).not.toBeInTheDocument()
		expect(screen.queryByLabelText('QUE FAITES-VOUS ?')).not.toBeInTheDocument()
	})
})
