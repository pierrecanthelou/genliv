import fs from 'fs'
import path from 'path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Dossier } from '../../../brain'
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

function fixtureAvecClimat(): string {
	const d = JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8'))
	const evt = d.monde.evenements.find((e: { id: string }) => e.id === 'evenement.rumeur-sans-origine')
	evt.declencheur_expr = { op: 'predicat', predicat: 'lieu_courant_est', cibles: ['lieu.foyer-du-guet'] }
	const climat = d.monde.conditions.climat.find((c: { id: string }) => c.id === 'climat.cendres-tenaces')
	climat.duree = 1
	return JSON.stringify(d)
}

async function monterPartie(user: ReturnType<typeof userEvent.setup>): Promise<Dossier> {
	const brain = createBrain()
	const inspection = brain.dossiers.importDossier(fixtureAvecClimat())
	if (inspection.statut !== 'valid') throw new Error(`Import refuse : ${inspection.statut}`)
	const dossier = inspection.dossier
	render(
		<BrainProvider brain={brain}>
			<EcranPartie dossierId={dossier.id} />
		</BrainProvider>,
	)
	await terminerCreationHeros(user)
	return dossier
}

describe('le bandeau affiche PAS et CLIMAT depuis la session', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('PAS #0 visible a l ouverture, CLIMAT absent', async () => {
		const user = userEvent.setup()
		await monterPartie(user)
		const texte = document.body.textContent ?? ''
		expect(texte).toMatch(/PAS\s*#0/)
		expect(texte).not.toContain('CLIMAT')
	})

	it('AGIR active le climat : PAS #1 et CLIMAT Cendres tenaces', async () => {
		const user = userEvent.setup()
		await monterPartie(user)
		await user.type(screen.getByLabelText('CONSOLE'), 'AGIR{Enter}')
		const texte = document.body.textContent ?? ''
		expect(texte).toMatch(/PAS\s*#1/)
		expect(texte).toMatch(/CLIMAT\s*·\s*Cendres tenaces/)
	})

	it('second AGIR eteint le climat : PAS #2, CLIMAT absent', async () => {
		const user = userEvent.setup()
		await monterPartie(user)
		await user.type(screen.getByLabelText('CONSOLE'), 'AGIR{Enter}')
		await user.type(screen.getByLabelText('CONSOLE'), 'AGIR{Enter}')
		const texte = document.body.textContent ?? ''
		expect(texte).toMatch(/PAS\s*#2/)
		expect(texte).not.toContain('CLIMAT')
	})
})
