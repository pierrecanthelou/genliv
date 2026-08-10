import fs from 'node:fs'
import path from 'node:path'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier } from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { DossierEditorScreen, type DossierEditorScreenProps } from '../components/DossierEditorScreen'

/**
 * Sonde locale pour la section Canon — jamais le vrai `PanneauCanon`
 * (`dossier-canon`) : un test de `bascule-editeur` n'a pas plus le droit
 * d'importer une feature sœur que le code source (KR-184, `no-restricted-imports`).
 * Elle ne prouve que le MÉCANISME du slot d'injection `panneaux` (§3 du plan
 * d'itération 1 de dossier-canon) — le contenu réel de `PanneauCanon` est
 * éprouvé par `dossier-canon/tests/panneauCanon.test.tsx`.
 */
const SONDE_CANON = 'Sonde du panneau Canon (test bascule-editeur)'
function SondePanneauCanon(): JSX.Element {
	return <textarea aria-label="Synopsis MJ" value={SONDE_CANON} readOnly />
}

function renderScreen(brain: Brain, dossierId: string, panneaux?: DossierEditorScreenProps['panneaux']) {
	render(
		<BrainProvider brain={brain}>
			<DossierEditorScreen dossierId={dossierId} panneaux={panneaux} />
		</BrainProvider>,
	)
}

/** La table du §3 du plan d'itération 3 — recopiée ICI pour confronter le rendu. */
const TITRES = [
	'Canon',
	'Départ',
	'Personnages',
	'Lieux',
	'Objets',
	'Indices',
	'Quêtes',
	'Événements',
	'Conditions',
	'Jalons & fins',
]
const FEATURE_NUMS = [3, 3, 4, 3, 5, 6, 6, 6, 6, 6]
const GLYPHES = ['✎', '✎', '❏', '❏', '❏', '❏', '❏', '❏', '⊘', '⊘']
/** Compteurs exacts sur un dossier fraîchement issu de `DossierService.create()` :
 * `monde.lieux` porte déjà `lieu.amorce` (KR-178), donc « 1 fiche », pas « 0 fiche ». */
const COMPTES_DOSSIER_NEUF = [
	'—',
	'—',
	'0 fiche',
	'1 fiche',
	'0 fiche',
	'0 fiche',
	'0 fiche',
	'0 fiche',
	'0 fiche',
	'0 jalon · 0 fin',
]

function texteEtatVide(index: number): string {
	return `${TITRES[index]} — l'écran d'édition arrive avec la feature n°${FEATURE_NUMS[index]}.`
}

describe('DossierEditorScreen', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('rendu de base: titre, retour, Apercu du jeu desactive, etat vide de la premiere section', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create("La Caverne d'Aldûr")
		renderScreen(brain, dossier.id, { canon: <SondePanneauCanon /> })

		expect(screen.getByRole('heading', { name: "La Caverne d'Aldûr" })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Mes dossiers' })).toBeInTheDocument()

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

		// Defaut documente : la premiere section du registre (Canon) est selectionnee,
		// et affiche desormais le panneau REEL injecte via `panneaux` (slot d'injection,
		// §3 du plan d'iteration 1 de dossier-canon) au lieu de l'etat vide generique.
		expect(screen.getByRole('textbox', { name: /synopsis/i })).toHaveValue(SONDE_CANON)
		expect(screen.queryByText(texteEtatVide(0))).toBeNull()
	})

	it('dossierId inconnu: Dossier introuvable et retour a l accueil', async () => {
		const user = userEvent.setup()
		const brain = createBrain()
		renderScreen(brain, 'inconnu')

		expect(screen.getByText('Dossier introuvable.')).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: '← Mes dossiers' }))

		expect(brain.router.current()).toEqual({ name: 'home' })
	})

	describe('nav des dix sections', () => {
		it('rend les 10 ListRow dans l ordre exact de SECTIONS, chaque trailing = compte(dossier)', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignes = within(nav).getAllByRole('button')
			expect(lignes).toHaveLength(10)

			lignes.forEach((ligne, index) => {
				expect(within(ligne).getByText(TITRES[index])).toBeInTheDocument()
				expect(within(ligne).getByText(COMPTES_DOSSIER_NEUF[index])).toBeInTheDocument()
			})
		})

		it('KR-013: SectionNav ne recalcule aucun compteur localement', () => {
			const chemin = path.join(__dirname, '..', 'components', 'SectionNav.tsx')
			const source = fs.readFileSync(chemin, 'utf8')

			expect(source).not.toMatch(/\.length\b/)
			expect(source).not.toMatch(/\.filter\(/)
			expect(source).not.toMatch(/\.reduce\(/)
		})

		it('aucun badge de completion colore: SectionNav n utilise jamais tone="good"/"bad"/"accent"', () => {
			const chemin = path.join(__dirname, '..', 'components', 'SectionNav.tsx')
			const source = fs.readFileSync(chemin, 'utf8')

			expect(source).not.toMatch(/tone=["']good["']/)
			expect(source).not.toMatch(/tone=["']bad["']/)
			expect(source).not.toMatch(/tone=["']accent["']/)
			expect(source).toMatch(/tone=["']muted["']/)
		})

		/**
		 * Critère #6 du plan (« niveau : contrat (hook) + composant ») : la moitié
		 * CONTRAT est déjà prouvée par `hooks.dossier.test.tsx` (lot 1) sur
		 * `useOpenDossier` isolé. Ce test-ci prouve la moitié COMPOSANT — que
		 * `DossierEditorScreen` PROPAGE réellement ce rafraîchissement jusqu'au
		 * `trailing` d'une `ListRow` — sans jamais appeler `rerender()` : le seul
		 * ressort du nouveau rendu est l'événement du bus, exactement comme une
		 * adoption cloud le ferait derrière le dos de l'auteur.
		 */
		it('dossier:updated apres montage: le trailing de Personnages se met a jour sans remontage', () => {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const ligneAvant = within(nav).getAllByRole('button')[2]
			expect(ligneAvant).toHaveTextContent('Personnages')
			expect(within(ligneAvant).getByText('0 fiche')).toBeInTheDocument()

			// Écrit DERRIÈRE le service PUIS émet l'événement (KR-004) — le même patron
			// que l'adoption cloud dans `hooks.dossier.test.tsx` et
			// `book-library/tests/dossierLibrary.test.tsx`. Un seul personnage ajouté à
			// une copie du dossier RÉEL (spread, pas un dossier littéral inline — KR-156) ;
			// tous les autres champs, y compris `charpente.depart`, restent ceux que
			// `DossierService.create()` a validés.
			const dossierPeuple: Dossier = {
				...dossier,
				monde: {
					...dossier.monde,
					personnages: [{ id: 'pnj.aldur-le-sage', portee: 'premier', plan_actions: [], savoirs: [] }],
				},
				updatedAt: '2026-08-10T09:00:00.000Z',
			}
			act(() => {
				brain.persistence.set(dossierKey(dossier.id), dossierPeuple)
				brain.events.emit('dossier:updated', { dossierId: dossier.id })
			})

			// Pas de rerender() manuel : on relit le DOM déjà en place, mis à jour par
			// le seul effet de l'événement sur `useOpenDossier`.
			const ligneApres = within(nav).getAllByRole('button')[2]
			expect(within(ligneApres).getByText('1 fiche')).toBeInTheDocument()
			expect(within(ligneApres).queryByText('0 fiche')).toBeNull()
		})
	})

	describe('selection d une section: etat vide au mot pres', () => {
		TITRES.forEach((titre, index) => {
			it(`section ${index} (${titre}): texte et glyphe exacts`, async () => {
				const user = userEvent.setup()
				const brain = createBrain()
				const dossier = brain.dossiers.create('Un dossier')
				renderScreen(brain, dossier.id, { canon: <SondePanneauCanon /> })

				const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
				const ligne = within(nav).getAllByRole('button')[index]
				await user.click(ligne)

				expect(ligne).toHaveAttribute('aria-current', 'true')
				if (index === 0) {
					// Canon (n° 3, dossier-canon it1) : le panneau injecte remplace l'etat vide.
					expect(screen.getByRole('textbox', { name: /synopsis/i })).toHaveValue(SONDE_CANON)
					expect(screen.queryByText(texteEtatVide(0))).toBeNull()
				} else {
					expect(screen.getByText(texteEtatVide(index))).toBeInTheDocument()
					expect(screen.getByText(GLYPHES[index], { selector: '[aria-hidden="true"]' })).toBeInTheDocument()
				}
			})
		})
	})

	describe('clavier', () => {
		it('Tab parcourt les 10 lignes dans l ordre, Shift+Tab revient en arriere', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignes = within(nav).getAllByRole('button')

			await user.tab() // "Mes dossiers" — "Aperçu du jeu" est désactivé, donc hors de l'ordre de tabulation.
			for (const ligne of lignes) {
				await user.tab()
				expect(ligne).toHaveFocus()
			}

			await user.tab({ shift: true })
			expect(lignes[8]).toHaveFocus()
			await user.tab({ shift: true })
			expect(lignes[7]).toHaveFocus()
		})

		it('Entree/Espace sur une ligne focalisee la selectionne comme un clic', async () => {
			const user = userEvent.setup()
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			renderScreen(brain, dossier.id)

			const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
			const lignes = within(nav).getAllByRole('button')

			lignes[2].focus()
			await user.keyboard('{Enter}')
			expect(lignes[2]).toHaveAttribute('aria-current', 'true')
			expect(screen.getByText(texteEtatVide(2))).toBeInTheDocument()

			lignes[5].focus()
			await user.keyboard(' ')
			expect(lignes[5]).toHaveAttribute('aria-current', 'true')
			expect(screen.getByText(texteEtatVide(5))).toBeInTheDocument()
		})
	})
})

describe('racine de composition', () => {
	it('garde KR-071 retiree: App.tsx ne contient plus book:deleted ni isEditingBook', () => {
		const cheminAppTsx = path.join(__dirname, '..', '..', '..', 'App.tsx')
		const source = fs.readFileSync(cheminAppTsx, 'utf8')

		expect(source).not.toContain('book:deleted')
		expect(source).not.toContain('isEditingBook')
	})

	/**
	 * Complément à la sonde locale ci-dessus (mineur m1, revue de PR tech-lead) :
	 * la sonde prouve le MÉCANISME du slot `panneaux`, mais aucun test ne
	 * constatait le câblage RÉEL de la section `canon` vers `PanneauCanon` dans
	 * `App.tsx` — dont dépend toute la valeur utilisateur de cette itération.
	 * Test-grep, pas un rendu : `App.tsx` n'a pas de suite de tests dans ce
	 * dépôt et un import de `dossier-canon` ici serait légitime (racine de
	 * composition), mais un rendu complet sort du périmètre de ce fichier.
	 */
	it('App.tsx cable PanneauCanon sur le slot canon de DossierEditorScreen', () => {
		const cheminAppTsx = path.join(__dirname, '..', '..', '..', 'App.tsx')
		const source = fs.readFileSync(cheminAppTsx, 'utf8')

		expect(source).toContain('PanneauCanon')
		expect(source).toMatch(/panneaux=\{\{\s*canon:\s*<PanneauCanon/)
	})
})
