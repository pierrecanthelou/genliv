import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createBrain, BrainProvider, type Brain, type Dossier } from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { App } from '../../../App'

/**
 * LA PORTE DU SHELL — critère 4 du plan d'itération 1 de `moteur-dossier`.
 *
 * KR-239 : `RapportControles.jouable` n'est pas une commodité d'ergonomie du CTA,
 * c'est la PRÉCONDITION de correction de tout ce qui lit une session. La route
 * `partie` est un chemin d'accès DIRECT — un routeur semé l'atteint sans passer
 * par « Aperçu du jeu » —, donc la garde se vérifie AU MONTAGE DU SHELL, pas
 * seulement au clic.
 *
 * MESURE PRÉALABLE (§ 10 du plan, `open_question` de la spec) : `<App/>` MONTE en
 * RTL, dix panneaux et services compris — mesuré par les suites existantes
 * (`book-creation/tests/createDossierFlow.test.tsx`,
 * `dossier-format/tests/importDossier.test.tsx`), re-mesuré ici sur la route
 * `partie`. La jonction route → racine de composition → shell est donc COUVERTE
 * par ce fichier, et non « vérifiée par personne » : c'est `<App/>` qui est monté
 * ci-dessous, jamais `<EcranPartie/>` seul.
 *
 * L'autre moitié du câblage bout en bout (le clic sur le CTA qui navigue) vit
 * dans `bascule-editeur/tests/dossierEditorScreen.test.tsx`, critère 3 : les deux
 * moitiés ne se rejoignent dans aucun test unique, et la revue l'écrit.
 */

/** Une prose d'ouverture RÉDIGÉE — deux alinéas, pour que « verbatim » ait un sens. */
const OUVERTURE_REDIGEE =
	"Le vent siffle sur la lande grise ; la porte du sanctuaire bâille déjà.\n\nVous n'avez pas fait dix pas que la pluie vous rattrape."

const TEXTE_NON_JOUABLE =
	"Ce dossier porte encore un contrôle bloquant. Ouvrez « Contrôles » dans l'éditeur pour voir lequel."

/**
 * Le dossier RÉEL du service, dont seule la prose d'ouverture est réécrite
 * (spread, jamais un littéral inline — KR-156). Le texte MARQUÉ ne s'écrit jamais
 * ici : il se relit sur le dossier semé (KR-223).
 */
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

/**
 * Un routeur SEMÉ sur la route `partie` — le chemin d'accès direct, celui que le
 * CTA ne garde pas. `createBrain` partage `window.localStorage` avec le semoir,
 * donc le dossier écrit par l'un est lu par l'autre.
 */
function monterSurLaRoutePartie(dossierId: string): { brain: Brain; unmount: () => void } {
	const brain = createBrain({ initialRoute: { name: 'partie', dossierId } })
	const { unmount } = render(
		<BrainProvider brain={brain}>
			<App />
		</BrainProvider>,
	)
	return { brain, unmount }
}

describe('la porte jouable au montage du shell (KR-239)', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	/**
	 * CRITÈRE 4 — les DEUX états dans le MÊME test (KR-197/202) : sans l'état
	 * jouable, un shell qui refuserait TOUT resterait vert ; sans l'état injouable,
	 * la porte pourrait être absente sans que rien ne rougisse.
	 */
	it('refuse une session sur un dossier non jouable atteint par la route, puis la monte une fois le dossier jouable', () => {
		const semoir = createBrain()
		const dossier = semoir.dossiers.create('La Caverne des Essais')

		// ÉTAT 1 — dossier fraîchement semé : sa prose d'ouverture porte encore le
		// marqueur, donc `controlerDossier` le dit NON JOUABLE. La route est atteinte
		// SANS passer par le CTA.
		const premier = monterSurLaRoutePartie(dossier.id)
		expect(screen.getByText(TEXTE_NON_JOUABLE)).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: "La partie ne peut pas s'ouvrir" })).toBeInTheDocument()
		// Aucune session n'est montée : ni la bannière d'ouverture, ni la zone journal.
		expect(screen.queryByText('OUVERTURE — lue au joueur, mot pour mot')).not.toBeInTheDocument()
		expect(screen.queryByRole('region', { name: 'Journal' })).not.toBeInTheDocument()
		premier.unmount()

		// ÉTAT 2 — la prose est rédigée : le dossier devient jouable, et le MÊME
		// chemin d'accès direct monte la session.
		semoir.persistence.set(dossierKey(dossier.id), avecOuverture(dossier, OUVERTURE_REDIGEE))
		const second = monterSurLaRoutePartie(dossier.id)
		expect(screen.getByText('OUVERTURE — lue au joueur, mot pour mot')).toBeInTheDocument()
		expect(screen.getByRole('region', { name: 'Journal' })).toBeInTheDocument()
		expect(screen.queryByText(TEXTE_NON_JOUABLE)).not.toBeInTheDocument()
		second.unmount()
	})

	/**
	 * Le refus nomme une SORTIE, et elle marche : un écran de refus sans chemin
	 * nommé est un cul-de-sac. « Revenir à l'éditeur » mène à la route `dossier`,
	 * là où « Contrôles » dit lequel des contrôles bloque.
	 */
	it('le refus non jouable ramene a l editeur du dossier', async () => {
		const user = userEvent.setup()
		const semoir = createBrain()
		const dossier = semoir.dossiers.create('La Caverne des Essais')

		const { brain } = monterSurLaRoutePartie(dossier.id)
		await user.click(screen.getByRole('button', { name: "← Revenir à l'éditeur" }))

		expect(brain.router.current()).toEqual({ name: 'dossier', dossierId: dossier.id })
	})

	/**
	 * La première garde, atteinte par la même route : un identifiant qui ne
	 * désigne aucun dossier. Le texte est repris TEL QUEL de
	 * `DossierEditorScreen.tsx` — le même fait, deux écrans, un seul texte.
	 */
	it('refuse une session sur un dossier introuvable, et renvoie a la bibliotheque', async () => {
		const user = userEvent.setup()
		const { brain } = monterSurLaRoutePartie('dossier-qui-n-existe-pas')

		expect(screen.getByText('Dossier introuvable.')).toBeInTheDocument()
		await user.click(screen.getByRole('button', { name: '← Mes dossiers' }))

		expect(brain.router.current()).toEqual({ name: 'home' })
	})
})
