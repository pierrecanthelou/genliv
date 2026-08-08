import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain } from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { App } from '../../../App'

// La MÊME fixture que le lot 1 / dossier-format (KR-156) — jamais un littéral
// de dossier inline ici, pour ne jamais dériver du format que le validateur
// accepte réellement.
const CHEMIN_FIXTURE = path.join(
	__dirname,
	'..',
	'..',
	'..',
	'brain',
	'dossier',
	'__fixtures__',
	'dossier-minimal.json',
)

function texteFixture(): string {
	return fs.readFileSync(CHEMIN_FIXTURE, 'utf8')
}

/** Pre-seed fixtures BEFORE render so live views never mutate outside act(). */
function renderLibrary(seed: (brain: Brain) => void = () => {}) {
	const brain = createBrain()
	seed(brain)
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain }
}

describe('book-library — dossiers', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	// downloadJson reaches real DOM APIs jsdom does not implement — stubbed the
	// same way brain/utils/download.test.ts already does for its first caller.
	const realCreateObjectURL = URL.createObjectURL
	const realRevokeObjectURL = URL.revokeObjectURL

	afterEach(() => {
		URL.createObjectURL = realCreateObjectURL
		URL.revokeObjectURL = realRevokeObjectURL
		jest.restoreAllMocks()
	})

	it('liste un dossier lisible et un illisible, telecharge le lisible, puis supprime les deux', async () => {
		const user = userEvent.setup()
		URL.createObjectURL = jest.fn(() => 'blob:fake')
		URL.revokeObjectURL = jest.fn()
		const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

		const { brain } = renderLibrary((b) => {
			b.dossiers.importDossier(texteFixture())
			// Écrit DERRIÈRE le service, comme l'adoption cloud (DossierService.test.ts).
			b.persistence.set(dossierKey('brise'), { schema: 2, id: 'brise', titre: 'Version devenue illisible' })
		})

		expect(screen.getByText('Le sceau du Gouffre')).toBeInTheDocument()
		expect(screen.getByText(/Modifié le/)).toBeInTheDocument()
		expect(screen.getByText('⚠ Dossier illisible')).toBeInTheDocument()
		expect(screen.getByText(/id : brise/)).toBeInTheDocument()

		// Téléchargement : présent seulement sur le lisible, déclenche exportDossier.
		expect(screen.getAllByRole('button', { name: 'Télécharger le fichier' })).toHaveLength(1)
		const exportSpy = jest.spyOn(brain.dossiers, 'exportDossier')
		await user.click(screen.getByRole('button', { name: 'Télécharger le fichier' }))
		expect(exportSpy).toHaveBeenCalledWith('dossier-minimal')
		expect(click).toHaveBeenCalledTimes(1)

		// Suppression du lisible : confirmation nommée, carte disparue.
		await user.click(screen.getByRole('button', { name: /Supprimer « Le sceau du Gouffre »/ }))
		const dialogLisible = screen.getByRole('dialog', { name: /supprimer le dossier/i })
		// toHaveTextContent reads the whole subtree — getByText only reads a node's
		// OWN direct text children, so it never matches text split by <strong>.
		expect(dialogLisible).toHaveTextContent('Le dossier « Le sceau du Gouffre » sera supprimé définitivement.')
		await user.click(screen.getByRole('button', { name: 'Supprimer' }))
		expect(screen.queryByText('Le sceau du Gouffre')).not.toBeInTheDocument()
		expect(brain.dossiers.list()).toEqual([{ id: 'brise', lisible: false }])

		// Suppression de l'illisible : nommé par son id, pas par un titre absent.
		await user.click(screen.getByRole('button', { name: /Supprimer « brise »/ }))
		const dialogIllisible = screen.getByRole('dialog', { name: /supprimer le dossier/i })
		expect(dialogIllisible).toHaveTextContent('Le dossier brise sera supprimé définitivement.')
		await user.click(screen.getByRole('button', { name: 'Supprimer' }))
		expect(brain.dossiers.list()).toEqual([])
	})

	it('annule la suppression sans rien retirer', async () => {
		const user = userEvent.setup()
		const { brain } = renderLibrary((b) => {
			b.dossiers.importDossier(texteFixture())
		})

		await user.click(screen.getByRole('button', { name: /Supprimer « Le sceau du Gouffre »/ }))
		await user.click(screen.getByRole('button', { name: 'Annuler' }))

		expect(brain.dossiers.list()).toHaveLength(1)
		expect(screen.getByText('Le sceau du Gouffre')).toBeInTheDocument()
	})

	it('n affiche plus « + Nouveau livre », seul « Importer un dossier » reste comme entree', () => {
		renderLibrary()
		expect(screen.queryByRole('button', { name: /nouveau livre/i })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: /importer un dossier/i })).toBeInTheDocument()
	})

	it('nomme les anciens livres restants quand la bibliotheque de dossiers est vide', () => {
		renderLibrary((b) => {
			b.books.createBook('La Caverne')
		})
		expect(screen.getByRole('note')).toHaveTextContent(/vos anciens livres restent stockés/i)
	})

	it('invite simplement a importer quand ni livre ni dossier n existent', () => {
		renderLibrary()
		expect(screen.getByRole('note')).toHaveTextContent(/votre bibliothèque est vide/i)
		expect(screen.queryByText(/anciens livres/i)).not.toBeInTheDocument()
	})

	it('filtre par recherche et affiche un message d absence de resultat', async () => {
		const user = userEvent.setup()
		renderLibrary((b) => {
			b.dossiers.importDossier(texteFixture())
		})

		await user.type(screen.getByRole('textbox', { name: /rechercher un dossier/i }), 'zzz')

		expect(screen.getByText(/aucun dossier ne correspond à « zzz »/i)).toBeInTheDocument()
		expect(screen.queryByText('Le sceau du Gouffre')).not.toBeInTheDocument()
	})
})
