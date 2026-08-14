import fs from 'node:fs'
import path from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider } from '../../../brain'
import { App } from '../../../App'

// La MÊME fixture que le lot 1 (KR-156) — jamais un littéral de dossier inline
// ici, pour ne jamais dériver du format que le validateur accepte réellement.
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

function renderApp() {
	const brain = createBrain()
	render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain }
}

async function ouvrirLaModale(user: ReturnType<typeof userEvent.setup>): Promise<void> {
	await user.click(screen.getByRole('button', { name: /importer un dossier/i }))
}

describe('importDossier', () => {
	beforeEach(() => window.localStorage.clear())

	it('la confirmation nomme le dossier importe', async () => {
		const user = userEvent.setup()
		const { brain } = renderApp()

		await ouvrirLaModale(user)

		const fichier = new File([texteFixture()], 'dossier-minimal.json', { type: 'application/json' })
		await user.upload(screen.getByLabelText(/choisir un fichier de dossier/i), fichier)

		const importer = await screen.findByRole('button', { name: 'Importer' })
		await waitFor(() => expect(importer).toBeEnabled())
		await user.click(importer)

		expect(await screen.findByText('Dossier « Le sceau du Gouffre » importé.')).toBeInTheDocument()
		// La modale s'est bien fermée (§ 3.2, état `done`).
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
		// Et le dossier est réellement persisté, pas seulement affiché.
		expect(brain.dossiers.get('dossier-minimal')?.titre).toBe('Le sceau du Gouffre')
	})

	it('un fichier illisible affiche le registre fichier', async () => {
		const user = userEvent.setup()
		renderApp()

		await ouvrirLaModale(user)

		const fichierVide = new File([''], 'vide.json', { type: 'application/json' })
		await user.upload(screen.getByLabelText(/choisir un fichier de dossier/i), fichierVide)

		expect(await screen.findByText('Fichier illisible')).toBeInTheDocument()
		expect(screen.getByText('Ce fichier est vide.')).toBeInTheDocument()
		// « Importer » reste désactivé sur un fichier illisible.
		expect(screen.getByRole('button', { name: 'Importer' })).toBeDisabled()
	})

	/**
	 * L'état `invalid` — « voir en français ce qui empêche son dossier d'être
	 * jouable » est la MOITIÉ de la démo de cette itération, et c'est aussi le
	 * contrat de rédaction que `dossier-controles` (n° 7) réutilisera tel quel.
	 * Sans ce test, l'anatomie à trois lignes du § 3.3 n'est montée nulle part :
	 * le OÙ pourrait afficher un chemin JSON, la troisième ligne disparaître, le
	 * badge se tromper de pluriel — tout resterait vert.
	 */
	it('un dossier invalide affiche l anatomie a trois lignes de chaque anomalie', async () => {
		const user = userEvent.setup()
		renderApp()

		await ouvrirLaModale(user)

		// Deux anomalies POSÉES, de deux familles différentes : une sur une entité
		// NOMMÉE (pour éprouver le OÙ) et une sur une racine (pour éprouver le
		// marqueur {racine} de la ligne QUOI FAIRE).
		const document_ = JSON.parse(texteFixture()) as Record<string, unknown>
		const monde = document_.monde as Record<string, unknown>
		;(monde.personnages as Record<string, unknown>[])[0].id = 'PNJ.Aldûr'
		delete (document_.charpente as Record<string, unknown>).fins

		const fichier = new File([JSON.stringify(document_)], 'casse.json', { type: 'application/json' })
		await user.upload(screen.getByLabelText(/choisir un fichier de dossier/i), fichier)

		// Le badge compte et accorde. QUATRE depuis l'itération 5 de dossier-fiches
		// (relations[].cible_id s'ajoute à la cascade) — TROIS depuis l'itération 3,
		// et la troisième est la démo de cette itération-là rendue par l'affordance
		// existante : casser l'identifiant du personnage rend PENDANTE la condition
		// qui le référence (`canon.objectifs[0].echoue_si_expr`). Cascade VOULUE et
		// déjà établie — `charpente.depart.lieu_id` se comporte pareil depuis
		// l'itération 1 ; `relations[0].cible_id` s'y ajoute depuis dossier-fiches it5.
		expect(await screen.findByText('4 anomalies')).toBeInTheDocument()

		// OÙ : l'entité résolue par son NOM, avec son identifiant entre parenthèses.
		// DEUX anomalies portent désormais ce même OÙ (echoue_si_expr et cible_id) —
		// getAllByText, pas getByText (RTL Query Safety, docs/WORKFLOW.md).
		expect(screen.getAllByText(/Personnage « Aldûr le Sage »/).length).toBeGreaterThan(0)
		expect(screen.getByText(/\(PNJ\.Aldûr\)/)).toBeInTheDocument()
		// QUOI : la phrase française du validateur.
		expect(screen.getByText(/ne respecte pas le format attendu/)).toBeInTheDocument()
		// QUOI FAIRE : la consigne préfixée, marqueur {racine} RÉSOLU.
		expect(screen.getByText('↪ Corrigez cet identifiant dans le fichier, puis réimportez-le.')).toBeInTheDocument()
		expect(
			screen.getByText('↪ Ajoutez la racine « charpente.fins » dans le fichier, puis réimportez-le.'),
		).toBeInTheDocument()
		expect(screen.queryByText(/\{racine\}/)).not.toBeInTheDocument()

		// Le chemin JSON n'est JAMAIS affiché seul (§ 3.3).
		expect(screen.queryByText('monde.personnages[0].id')).not.toBeInTheDocument()
		// Et rien ne s'importe.
		expect(screen.getByRole('button', { name: 'Importer' })).toBeDisabled()
	})

	it('le badge d anomalie accorde le singulier', async () => {
		const user = userEvent.setup()
		renderApp()

		await ouvrirLaModale(user)

		const document_ = JSON.parse(texteFixture()) as Record<string, unknown>
		document_.id = 'mon-dossier:content' // une seule anomalie : la forme de l'id

		const fichier = new File([JSON.stringify(document_)], 'casse.json', { type: 'application/json' })
		await user.upload(screen.getByLabelText(/choisir un fichier de dossier/i), fichier)

		expect(await screen.findByText('1 anomalie')).toBeInTheDocument()
	})
})
