import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier } from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { EcranPartie } from './EcranPartie'
import { terminerCreationHeros } from '../tests/creerHerosDeTest'

/**
 * GARDE 7 — Redirection vers écran de création si pas de héros.
 *
 * Test du plan d'itération 1 : sans `session.heros` → `EcranCreationHeros` monté ;
 * avec → `BandeauHeros` monté dans `CadrePartie`.
 */

const OUVERTURE_TEST =
	"Le vent siffle sur la lande grise ; la porte du sanctuaire bâille déjà.\n\nVous n'avez pas fait dix pas que la pluie vous rattrape."

function avecOuverture(dossier: Dossier): Dossier {
	return {
		...dossier,
		charpente: {
			...dossier.charpente,
			depart: { ...dossier.charpente.depart, texte_ouverture_joueur: OUVERTURE_TEST },
		},
		updatedAt: '2026-09-24T10:00:00.000Z',
	}
}

function monterPartieJouable(brain: Brain): Dossier {
	const seme = brain.dossiers.create('Test GARDE 7')
	brain.persistence.set(dossierKey(seme.id), avecOuverture(seme))
	return brain.dossiers.get(seme.id) as Dossier
}

describe('EcranPartie — GARDE 7 (moteur-arbitre it1)', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('sans session.heros → affiche EcranCreationHeros pour creer le heros', async () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		// L'écran de création doit être visible (pas le journal ni la console)
		expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
		expect(screen.getByText(/Choisissez un lancer/)).toBeInTheDocument()
		expect(screen.queryByRole('region', { name: 'Journal' })).not.toBeInTheDocument()
	})

	it('apres creation heros → affiche BandeauHeros en haut puis le journal normal', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)

		const { container } = render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		// Vérifier qu'on part bien sur l'écran de création
		expect(screen.getByText('Créez votre héros')).toBeInTheDocument()

		// Terminer la création (helper qui assigne les dés et valide)
		await terminerCreationHeros(user)

		// Après validation : le bandeau doit apparaître, le journal doit être visible
		// Le nom par défaut "Aventurier" apparaît dans le bandeau
		expect(container.textContent).toContain('Aventurier')
		expect(screen.getByRole('region', { name: 'Journal' })).toBeInTheDocument()
		expect(screen.getByText(/Aucun évènement pour l'instant/)).toBeInTheDocument()
	})
})
