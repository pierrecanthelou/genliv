import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	dossierSessionKey,
	type Brain,
	type Dossier,
	type EtatSession,
} from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { EcranPartie, tirerGraine } from '../components/EcranPartie'

/**
 * CE QUE L'AUTEUR LIT QUAND LA PARTIE S'OUVRE — garde 6 de l'ordre normatif
 * (§ 5 du plan d'itération 1 de `moteur-dossier`) : header, bannière
 * d'ouverture VERBATIM, zone journal à son état vide.
 *
 * Trois registres de langue cohabitent sur cet écran (§ 3.G), et un seul nœud
 * relève du registre JOUEUR : les enfants de l'`OutcomeBlock`. Le registre
 * DÉVELOPPEUR est absent en it1 — `monde.lieu_courant` est un IDENTIFIANT, il se
 * lit dans l'état de session persisté et JAMAIS dans le DOM.
 *
 * AUCUN `toHaveStyle({ color: 'var(--x)' })` : en jsdom c'est vert sur n'importe
 * quoi (BUG-084). Le seul `toHaveStyle` de ce fichier porte sur `pre-wrap`, une
 * valeur CSS littérale que jsdom rend réellement — et c'est une EXIGENCE de
 * « verbatim », pas une préférence : sans elle, « mot pour mot » est faux dès le
 * premier alinéa.
 */

const OUVERTURE_REDIGEE =
	"Le vent siffle sur la lande grise ; la porte du sanctuaire bâille déjà.\n\nVous n'avez pas fait dix pas que la pluie vous rattrape."

const TITRE_DOSSIER = 'La Caverne des Essais'

function avecOuverture(dossier: Dossier, ouverture: string): Dossier {
	return {
		...dossier,
		charpente: {
			...dossier.charpente,
			depart: { ...dossier.charpente.depart, texte_ouverture_joueur: ouverture },
		},
		updatedAt: '2026-09-20T10:00:00.000Z',
	}
}

/** Sème un dossier JOUABLE et monte le shell dessus. */
function monterPartieJouable(): { brain: Brain; dossier: Dossier } {
	const brain = createBrain()
	const seme = brain.dossiers.create(TITRE_DOSSIER)
	brain.persistence.set(dossierKey(seme.id), avecOuverture(seme, OUVERTURE_REDIGEE))
	const dossier = brain.dossiers.get(seme.id) as Dossier
	render(
		<BrainProvider brain={brain}>
			<EcranPartie dossierId={dossier.id} />
		</BrainProvider>,
	)
	return { brain, dossier }
}

function sessionPersistee(brain: Brain, dossierId: string): EtatSession {
	return brain.persistence.get<EtatSession>(dossierSessionKey(dossierId)) as EtatSession
}

describe('l ouverture lue mot pour mot', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('rend la prose d ouverture VERBATIM, alineas compris, sous son en-tete auteur', () => {
		const { dossier } = monterPartieJouable()

		// Le shell est une PAGE, jamais une modale : `<main>`, ni `role="dialog"`, ni
		// `aria-modal` (différence d'anatomie avec `PlayerModal`, § 3.B).
		expect(screen.getByRole('main', { name: 'Aperçu du jeu' })).toBeInTheDocument()
		expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

		expect(screen.getByText('OUVERTURE — lue au joueur, mot pour mot')).toBeInTheDocument()

		// La prose est rendue TELLE QUELLE — ni tronquée, ni préfixée, ni « habillée ».
		// Le nœud se REPÈRE par un fragment (le matcher de RTL normalise les blancs),
		// puis l'égalité porte sur `textContent` BRUT : c'est là que « mot pour mot »
		// se constate, alinéas compris.
		const prose = screen.getByText(/Le vent siffle sur la lande grise/)
		expect(prose.textContent).toBe(dossier.charpente.depart.texte_ouverture_joueur)
		expect(prose.textContent).toBe(OUVERTURE_REDIGEE)
		// Les alinéas de l'auteur survivent au rendu : c'est ce que `pre-wrap` achète.
		expect(prose).toHaveStyle({ whiteSpace: 'pre-wrap' })
	})

	it('rend le header auteur: le titre du dossier apres le separateur, et une sortie nommee', () => {
		const { dossier } = monterPartieJouable()

		const titre = screen.getByText(dossier.titre)
		// L'égalité COMPOSÉE épingle le séparateur au caractère près.
		expect(titre.parentElement?.textContent).toBe(`Aperçu du jeu · ${dossier.titre}`)

		const sortie = screen.getByRole('button', { name: 'Quitter le test' })
		// Le glyphe est dans le texte visible, jamais dans le nom accessible.
		expect(sortie.textContent).toBe('✕ Quitter le test')
	})

	it('rend la zone journal AVEC son etat vide: zero ligne en it1, une invitation au futur', () => {
		monterPartieJouable()

		const journal = screen.getByRole('region', { name: 'Journal' })
		expect(within(journal).getByText('JOURNAL')).toBeInTheDocument()
		expect(
			within(journal).getByText("Aucun évènement pour l'instant — vos actions y apparaîtront."),
		).toBeInTheDocument()
	})

	it('persiste la session ouverte sous la cle du dossier, journal a zero entree', () => {
		const { brain, dossier } = monterPartieJouable()

		const session = sessionPersistee(brain, dossier.id)
		expect(session.schema).toBe(1)
		expect(session.dossier_id).toBe(dossier.id)
		expect(session.horloge).toEqual({ tour: 0 })
		expect(session.journal).toEqual([])
		expect(session.memoire).toBeNull()
		// `lieu_courant` se lit ICI, dans l'ÉTAT, et nulle part ailleurs.
		expect(session.monde.lieu_courant).toBe(dossier.charpente.depart.lieu_id)
		expect(session.monde.lieux_visites).toEqual([dossier.charpente.depart.lieu_id])
	})

	it('ne fait fuiter AUCUN identifiant technique dans le DOM (registre developpeur absent en it1)', () => {
		const { brain, dossier } = monterPartieJouable()

		const session = sessionPersistee(brain, dossier.id)
		// Le pas de côté le plus probable est d'afficher « Lieu : lieu.val-cendre »
		// sous la bannière « pour montrer que ça marche ». Le test le lit dans
		// l'état, jamais dans l'écran (§ 3.G).
		expect(document.body.textContent).not.toContain(session.monde.lieu_courant)
		expect(document.body.textContent).not.toContain(dossier.id)
	})

	/**
	 * `tirerGraine()` est la SEULE entropie de la feature, et elle est NOMMÉE pour
	 * que le test puisse la fixer (§ 8, D-16 — précédent du `rng` non semé de
	 * `combat.ts:107`). Un `Date.now()` ou un compteur en ligne ferait rougir ceci.
	 */
	it('seme la session par le tirage NOMME, que le test peut fixer', () => {
		const tirage = jest.spyOn(Math, 'random').mockReturnValue(0.4242)
		try {
			const { brain, dossier } = monterPartieJouable()
			expect(sessionPersistee(brain, dossier.id).graine_alea).toBe(tirerGraine())
			expect(Number.isInteger(tirerGraine())).toBe(true)
		} finally {
			tirage.mockRestore()
		}
	})

	it('quitter le test ramene a l editeur du dossier, au clic comme a Echap', async () => {
		const user = userEvent.setup()
		const { brain, dossier } = monterPartieJouable()

		await user.click(screen.getByRole('button', { name: 'Quitter le test' }))
		expect(brain.router.current()).toEqual({ name: 'dossier', dossierId: dossier.id })

		brain.router.navigate({ name: 'partie', dossierId: dossier.id })
		await user.keyboard('{Escape}')
		expect(brain.router.current()).toEqual({ name: 'dossier', dossierId: dossier.id })
	})
})
