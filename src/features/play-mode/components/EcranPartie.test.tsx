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

/**
 * Point de montage du carnet d'indices (moteur-acteurs it2, BUG-142/KR-289) :
 * nomme explicitement `PartieEnCours` pour eviter une recidive (une surface
 * montee par un ecran different de celui ou le critere l'attend). Teste ici
 * que le bouton n'existe PAS tant que le heros n'est pas cree, et qu'il ouvre
 * bien la session REELLE une fois monte — pas seulement que CarnetIndices.tsx
 * fonctionne isolement (deja couvert par son propre fichier de test).
 */
describe('EcranPartie -- carnet d indices (moteur-acteurs it2)', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('le bouton carnet n apparait pas sur l ecran de creation du heros', async () => {
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		expect(screen.getByText('Créez votre héros')).toBeInTheDocument()
		expect(screen.queryByLabelText("Carnet d'indices")).not.toBeInTheDocument()
	})

	it('apres creation du heros, le bouton carnet ouvre et ferme la session reelle', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		const dossier = monterPartieJouable(brain)

		render(
			<BrainProvider brain={brain}>
				<EcranPartie dossierId={dossier.id} />
			</BrainProvider>,
		)

		await terminerCreationHeros(user)

		const boutonCarnet = screen.getByLabelText("Carnet d'indices")
		expect(boutonCarnet).toBeInTheDocument()

		await user.click(boutonCarnet)

		// Session reelle fraichement creee -> aucune revelation, etat vide du carnet
		expect(screen.getByRole('dialog', { name: "Carnet d'indices" })).toBeInTheDocument()
		expect(screen.getByText(/Aucun indice découvert pour l'instant/)).toBeInTheDocument()

		await user.click(screen.getByLabelText('Fermer'))
		expect(screen.queryByRole('dialog', { name: "Carnet d'indices" })).not.toBeInTheDocument()
	})
})
