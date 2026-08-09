import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain } from '../../../brain'
import { DossierEditorScreen } from '../components/DossierEditorScreen'

function renderScreen(brain: Brain, dossierId: string) {
	render(
		<BrainProvider brain={brain}>
			<DossierEditorScreen dossierId={dossierId} />
		</BrainProvider>,
	)
}

describe('DossierEditorScreen', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('rendu au mot pres: titre, retour, etat vide nomme, Apercu du jeu desactive', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create("La Caverne d'Aldûr")
		renderScreen(brain, dossier.id)

		expect(screen.getByRole('heading', { name: "La Caverne d'Aldûr" })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Mes dossiers' })).toBeInTheDocument()
		expect(
			screen.getByText(
				"Aucune section pour l'instant. La navigation de ce dossier arrive avec une prochaine mise à jour de l'éditeur.",
			),
		).toBeInTheDocument()

		const apercu = screen.getByRole('button', { name: 'Aperçu du jeu' })
		expect(apercu).toBeDisabled()
		expect(apercu).toHaveAttribute(
			'title',
			'Aperçu du jeu — disponible quand le mode jeu sera repointé sur le dossier (feature n° 9)',
		)
		expect(apercu).toHaveAttribute('title', expect.stringContaining('feature n° 9'))

		// Ni compteur de noeuds ni « + Noeud » : un dossier n'a pas de noeuds.
		expect(screen.queryByRole('button', { name: /nœud/i })).toBeNull()
		expect(screen.queryByText(/nœud/i)).toBeNull()
	})

	it('dossierId inconnu: Dossier introuvable et retour a l accueil', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		renderScreen(brain, 'inconnu')

		expect(screen.getByText('Dossier introuvable.')).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: '← Mes dossiers' }))

		expect(brain.router.current()).toEqual({ name: 'home' })
	})
})

describe('racine de composition', () => {
	it('garde KR-071 retiree: App.tsx ne contient plus book:deleted ni isEditingBook', () => {
		const cheminAppTsx = path.join(__dirname, '..', '..', '..', 'App.tsx')
		const source = fs.readFileSync(cheminAppTsx, 'utf8')

		expect(source).not.toContain('book:deleted')
		expect(source).not.toContain('isEditingBook')
	})
})
