import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EditorTopBar } from './EditorTopBar'

/**
 * LE CHROME PARTAGÉ, éprouvé sur ses DEUX écrans depuis le même composant : le
 * livre-arbre (`src/EditorScreen.tsx`, chemin mort) et le dossier d'aventure
 * (n° 2, itération 2). Ce que ce fichier tient, c'est que l'élargissement n'a
 * RIEN changé au premier — les défauts sont donc épinglés au mot près, y compris
 * le texte qu'aucun appelant ne passe.
 */

/**
 * Une raison de repli QUELCONQUE — `brain/` ne connaît ni ne doit connaître le
 * texte réel d'une feature (« feature n° 9 »). Ce fichier prouve que la prop se
 * propage jusqu'à l'attribut `title` ; le texte réel est épinglé mot pour mot
 * côté feature (`dossierEditorScreen.test.tsx`), le seul endroit qui le possède.
 */
const RAISON_DOSSIER = 'Raison de test'

describe('EditorTopBar, le couple compteur / ajout de noeud', () => {
	it('ne rend ni badge ni bouton Noeud quand aucun des deux n est fourni', () => {
		render(<EditorTopBar title="La Caverne" onBack={jest.fn()} />)

		expect(screen.queryByRole('button', { name: /nœud/i })).toBeNull()
		// Ni un badge à zéro, ni un bouton désactivé : un dossier n'a pas de nœuds,
		// l'affordance est sans objet, donc absente — jamais un fantôme.
		expect(screen.queryByText(/nœud/i)).toBeNull()
		expect(screen.getByRole('heading', { name: 'La Caverne' })).toBeInTheDocument()
	})

	it('rend le badge ET le bouton Noeud quand les deux sont fournis', () => {
		const onAddNode = jest.fn()
		render(<EditorTopBar title="La Caverne" nodeCount={3} onBack={jest.fn()} onAddNode={onAddNode} />)

		expect(screen.getByText('3 nœuds')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Ajouter un nœud' })).toBeInTheDocument()
	})

	it('accorde le compteur en francais et cable l ajout', async () => {
		const user = userEvent.setup()
		const onAddNode = jest.fn()
		render(<EditorTopBar title="La Caverne" nodeCount={1} onBack={jest.fn()} onAddNode={onAddNode} />)

		expect(screen.getByText('1 nœud')).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: 'Ajouter un nœud' }))

		expect(onAddNode).toHaveBeenCalledTimes(1)
	})
})

describe('EditorTopBar, le libelle de retour', () => {
	it('retombe sur Mes livres quand aucun libelle n est fourni', async () => {
		const user = userEvent.setup()
		const onBack = jest.fn()
		render(<EditorTopBar title="La Caverne" nodeCount={0} onBack={onBack} onAddNode={jest.fn()} />)

		// Le défaut de l'écran Book, épinglé : aucun de ses appelants ne passe la prop.
		await user.click(screen.getByRole('button', { name: 'Mes livres' }))

		expect(onBack).toHaveBeenCalledTimes(1)
	})

	it('affiche le libelle injecte par l ecran dossier', () => {
		render(<EditorTopBar title="La Caverne" backLabel="Mes dossiers" onBack={jest.fn()} />)

		expect(screen.getByRole('button', { name: 'Mes dossiers' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Mes livres' })).toBeNull()
	})
})

describe('EditorTopBar, le bouton Apercu du jeu', () => {
	it('reste visible et desactive avec le texte par defaut de l ecran Book', () => {
		render(<EditorTopBar title="La Caverne" nodeCount={0} onBack={jest.fn()} onAddNode={jest.fn()} />)

		const apercu = screen.getByRole('button', { name: 'Aperçu du jeu' })

		expect(apercu).toBeDisabled()
		// Mot pour mot le texte d'avant l'élargissement : c'est la moitié « écran Book »
		// du critère #5, l'autre vivant dans le test de l'écran dossier.
		expect(apercu).toHaveAttribute('title', 'Aperçu du jeu — mode lecture (hors éditeur)')
	})

	it('porte la raison injectee quand l ecran en fournit une', () => {
		render(
			<EditorTopBar
				title="La Caverne"
				backLabel="Mes dossiers"
				onBack={jest.fn()}
				previewDisabledReason={RAISON_DOSSIER}
			/>,
		)

		const apercu = screen.getByRole('button', { name: 'Aperçu du jeu' })

		expect(apercu).toBeDisabled()
		expect(apercu).toHaveAttribute('title', RAISON_DOSSIER)
	})

	it('ignore la raison et redevient actionnable des que onPreview est cable', async () => {
		const user = userEvent.setup()
		const onPreview = jest.fn()
		render(
			<EditorTopBar
				title="La Caverne"
				nodeCount={0}
				onBack={jest.fn()}
				onAddNode={jest.fn()}
				onPreview={onPreview}
				previewDisabledReason={RAISON_DOSSIER}
			/>,
		)

		const apercu = screen.getByRole('button', { name: 'Aperçu du jeu' })

		expect(apercu).toBeEnabled()
		// Une raison de désactivation sur un bouton actif serait un mensonge d'infobulle.
		expect(apercu).toHaveAttribute('title', 'Aperçu du jeu')
		await user.click(apercu)

		expect(onPreview).toHaveBeenCalledTimes(1)
	})
})
