import fs from 'fs'
import path from 'path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, dossierSessionKey, type Brain, type Dossier, type EtatSession } from '../../../brain'
import { EcranPartie } from '../components/EcranPartie'
import { terminerCreationHeros } from './creerHerosDeTest'

/**
 * TEST D'INTÉGRATION — la console ALLER ouvre un combat quand un événement
 * à `monstre_ref` est déclenché par le déplacement.
 *
 * La fixture `dossier-reference.json` porte un événement
 * `evenement.embuscade-a-la-tour` dont le `declencheur_expr` est
 * `lieu_visite(lieu.tour-effondree)` et le `monstre_ref` pointe un
 * monstre valide du bestiaire. Quand le joueur tape `ALLER lieu.tour-effondree`,
 * `handleSoumettreConsole` appelle `ouvrirRencontreSiDue` qui détecte
 * la condition remplie et ouvre le combat.
 */

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

async function monterPartieAvecCombat(
	user: ReturnType<typeof userEvent.setup>,
): Promise<{ brain: Brain; dossier: Dossier }> {
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
	return { brain, dossier }
}

describe('la console ALLER ouvre un combat quand un evenement a monstre_ref est declenche', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('EcranCombat monte et la console disparait apres ALLER vers un lieu de rencontre', async () => {
		const user = userEvent.setup()
		await monterPartieAvecCombat(user)

		expect(screen.getByLabelText('CONSOLE')).toBeInTheDocument()

		await user.type(screen.getByLabelText('CONSOLE'), 'ALLER lieu.tour-effondree{Enter}')

		expect(screen.getByText('COMBAT')).toBeInTheDocument()
		expect(screen.queryByLabelText('CONSOLE')).not.toBeInTheDocument()
	})

	it('cliquer Jouer le round ajoute une entree au journal de combat', async () => {
		const user = userEvent.setup()
		await monterPartieAvecCombat(user)

		await user.type(screen.getByLabelText('CONSOLE'), 'ALLER lieu.tour-effondree{Enter}')

		expect(screen.getByText(/Le combat commence/)).toBeInTheDocument()

		await user.click(screen.getByRole('button', { name: /Jouer le round/ }))

		expect(screen.getAllByText('ROUND 1').length).toBeGreaterThan(0)
	})

	it('parcours console : combat → Fuir → FUITE → Continuer', async () => {
		const user = userEvent.setup()
		const { brain, dossier } = await monterPartieAvecCombat(user)

		await user.type(screen.getByLabelText('CONSOLE'), 'ALLER lieu.tour-effondree{Enter}')
		expect(screen.getByText('COMBAT')).toBeInTheDocument()

		const fuirBtn = screen.getByRole('button', { name: /Fuir le combat/ })
		await user.click(fuirBtn)

		expect(screen.getByText('FUITE')).toBeInTheDocument()

		const avantContinuer = brain.persistence.get<EtatSession>(dossierSessionKey(dossier.id))
		expect(avantContinuer?.combat?.fuite).toBe(true)
		const lieuAvant = avantContinuer?.monde?.lieu_courant
		const xpAvant = avantContinuer?.heros?.xp

		await user.click(screen.getByRole('button', { name: /Continuer/ }))

		expect(screen.getByLabelText('CONSOLE')).toBeInTheDocument()
		expect(screen.queryByText('COMBAT')).not.toBeInTheDocument()

		const apresContinuer = brain.persistence.get<EtatSession>(dossierSessionKey(dossier.id))
		expect(apresContinuer?.combat).toBeUndefined()
		expect(apresContinuer?.monde?.lieu_courant).toBe(lieuAvant)
		expect(apresContinuer?.heros?.xp).toBe(xpAvant)
	})
})
