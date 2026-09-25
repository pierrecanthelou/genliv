import { act, renderHook } from '@testing-library/react'
import type { Dossier, EtatSession, SortieInterprete } from '../../../brain'
import { apresInterpretation } from '../../../brain'
import { COMMANDES } from '../../../brain/dossier/commandes'
import { useTourDeJeu } from './useTourDeJeu'

/**
 * TESTS DU HOOK `useTourDeJeu` — orchestrateur du tour de jeu.
 *
 * MÊME PATTERN QUE `useDemandeCopilote.test.tsx` : `renderHook` (pas de BrainProvider),
 * mock `CopiloteService.demander` RETENU À LA MAIN pour contrôler le timing des promesses,
 * assertions sur le state du hook (pas sur le `disabled` d'un bouton). Les cinq tests
 * couvrent KR-265 (verrou), KR-248 (journal), succès/erreur, et `getGestelabel`.
 *
 * Le hook importe `COMMANDES` (seul fichier `play-mode` autorisé par KR-260). Ce test
 * l'importe aussi pour vérifier que `getGestelabel` retourne les vraies valeurs.
 */

// ── FIXTURES ──

/** Session vierge. */
const SESSION_TEST: EtatSession = {
	schema: 1,
	dossier_id: 'test-dossier',
	dossier_maj: '2026-09-25T00:00:00.000Z',
	graine_alea: 42,
	horloge: { tour: 1 },
	monde: {
		lieu_courant: 'lieu_1',
		lieux_visites: [],
		objets_possedes: [],
		indices_connus: [],
		jalons_atteints: [],
		evenements_consommes: [],
		pnj: {},
	},
	journal: [],
	memoire: null,
}

/** Dossier minimal avec un accès `aller` de `lieu_1` à `lieu_2`. */
const DOSSIER_TEST: Dossier = {
	id: 'test-dossier',
	titre: 'Test',
	schema: 1,
	createdAt: '2026-09-25T00:00:00.000Z',
	updatedAt: '2026-09-25T00:00:00.000Z',
	canon: {
		ton: 'Ton de test',
		accroche_joueur: 'Bienvenue',
		objectif_auteur: 'Tester',
		objectif_joueur: 'Survivre',
		interdits_ton: [],
	},
	monde: {
		personnages: [],
		lieux: [
			{
				id: 'lieu_1',
				nom: 'Départ',
				description: 'Le lieu de départ',
				acces: [{ geste: 'aller', cible: 'lieu_2', description_acces: 'au nord' }],
			},
			{
				id: 'lieu_2',
				nom: 'Arrivée',
				description: 'Le lieu d arrivée',
				acces: [{ geste: 'aller', cible: 'lieu_1', description_acces: 'au sud' }],
			},
		],
		objets: [],
		indices: [],
		quetes: [],
		evenements: [],
	},
	charpente: {
		depart: { lieu_id: 'lieu_1', texte_ouverture_joueur: 'Vous êtes au départ' },
		jalons: [],
		fins: [],
	},
} as unknown as Dossier

// ── MOCK BRAIN ──

const demanderMock = jest.fn()

jest.mock('../../../brain', () => ({
	...jest.requireActual('../../../brain'),
	useBrain: () => ({
		copilote: {
			demander: demanderMock,
		},
	}),
}))

// ── HELPER ──

function monter(sessionInitiale = SESSION_TEST, onSessionChange = jest.fn()) {
	return renderHook(() => useTourDeJeu(DOSSIER_TEST, sessionInitiale, onSessionChange))
}

// ── TESTS ──

describe('useTourDeJeu — hook orchestrateur', () => {
	beforeEach(() => {
		jest.clearAllMocks()
	})

	it('KR-265 — deux appels rapides → un seul appel copilote (verrou de tour)', async () => {
		// Pattern : retenir les `resolve` à la main pour contrôler le timing.
		// Appelons `executeAction` DEUX FOIS sans attendre la résolution du premier.
		const resolveurs: Array<
			(
				reponse: { statut: 'propose'; proposition: SortieInterprete } | { statut: 'indisponible'; raison: string },
			) => void
		> = []
		demanderMock.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolveurs.push(resolve)
				}),
		)

		const onSessionChange = jest.fn()
		const { result } = monter(SESSION_TEST, onSessionChange)

		// Temps 1 : premier appel
		act(() => {
			result.current.executeAction('aller au nord')
		})
		expect(demanderMock).toHaveBeenCalledTimes(1)
		expect(result.current.isLocked).toBe(true)

		// Temps 2 : deuxième appel AVANT que le premier ne se résolve
		// Le garde doit refuser cet appel.
		act(() => {
			result.current.executeAction('aller ailleurs')
		})
		expect(demanderMock).toHaveBeenCalledTimes(1) // Pas 2 — le garde tient bon

		// Temps 3 : résoudre le premier appel
		await act(async () => {
			resolveurs[0]({ statut: 'indisponible', raison: 'annule' })
		})
		expect(result.current.isLocked).toBe(false)

		// Temps 4 : un troisième appel après déverrouillage DOIT être accepté
		act(() => {
			result.current.executeAction('aller au sud')
		})
		expect(demanderMock).toHaveBeenCalledTimes(2) // MAINTENANT seulement il y a 2 appels
	})

	it('statut !== propose → avis direct, sans apresInterpretation, session inchangée', async () => {
		// Mock : retourner un EchecCopilote au lieu d'une proposition
		demanderMock.mockResolvedValue({ statut: 'indisponible', raison: 'non-configure' })

		const onSessionChange = jest.fn()
		const sessionInitiale = SESSION_TEST
		const { result } = monter(sessionInitiale, onSessionChange)

		await act(async () => {
			await result.current.executeAction('action quelconque')
		})

		// L'avis DOIT être exactement l'échec retourné
		expect(result.current.avis).toEqual({ statut: 'indisponible', raison: 'non-configure' })

		// onSessionChange NE doit PAS être appelé (session inchangée)
		expect(onSessionChange).not.toHaveBeenCalled()
	})

	it('statut === propose → apresInterpretation appliquée, session et avis mis à jour', async () => {
		// Mock : retourner une proposition VALIDE de déplacement reconnu
		const proposition = {
			lecture: 'commande' as const,
			commande: { commande: 'aller' as const, cibles: ['lieu_2'] },
		}
		demanderMock.mockResolvedValue({ statut: 'propose', proposition })

		const onSessionChange = jest.fn()
		const saisieTest = 'aller au nord'
		const { result } = monter(SESSION_TEST, onSessionChange)

		await act(async () => {
			await result.current.executeAction(saisieTest)
		})

		// Vérification : apresInterpretation a été appliquée
		// On peut l'appeler directement pour comparer le résultat
		const expected = apresInterpretation(DOSSIER_TEST, SESSION_TEST, proposition, saisieTest)

		expect(result.current.avis).toEqual(expected.avis) // Devrait être { type: 'aucun' }
		expect(onSessionChange).toHaveBeenCalledWith(expected.session)
	})

	it('avis === non_reconnu → gestes_possibles sont ceux de la session courante', async () => {
		// Mock : retourner une proposition sans_commande avec deux gestes possibles
		const proposition = { lecture: 'sans_commande' as const, gestes_possibles: ['aller'] }
		demanderMock.mockResolvedValue({ statut: 'propose', proposition })

		const onSessionChange = jest.fn()
		const { result } = monter(SESSION_TEST, onSessionChange)

		await act(async () => {
			await result.current.executeAction('action inconnue')
		})

		// L'avis doit contenir les gestes
		expect(result.current.avis).toEqual({ type: 'non_reconnu', gestes_possibles: ['aller'] })
	})

	it('KR-013 — utilise la session FRAICHE du parent, jamais une copie figee au premier rendu (regression revue tech-lead it1)', async () => {
		// Defaut trouve en revue de PR : useTourDeJeu prenait `useState(sessionInitiale)`,
		// une copie PRIVEE jamais resynchronisee. Une commande console acceptee ENTRE
		// deux rendus (ConsoleCommandes avance la session du PARENT independamment de
		// ce hook) etait alors ECRASEE au prochain executeAction, qui travaillait
		// encore sur la copie perimee.
		demanderMock.mockResolvedValue({
			statut: 'propose',
			proposition: { lecture: 'sans_commande', gestes_possibles: [] },
		})

		const onSessionChange = jest.fn()
		const { result, rerender } = renderHook(
			({ session }: { session: EtatSession }) => useTourDeJeu(DOSSIER_TEST, session, onSessionChange),
			{ initialProps: { session: SESSION_TEST } },
		)

		// Simule le canal console qui avance la session du parent, SANS passer par ce hook.
		const sessionApresConsole: EtatSession = {
			...SESSION_TEST,
			horloge: { tour: 2 },
			monde: { ...SESSION_TEST.monde, lieu_courant: 'lieu_2', lieux_visites: ['lieu_1', 'lieu_2'] },
			journal: [
				{ tour: 2, role: 'joueur', texte: '> ALLER lieu_2' },
				{ tour: 2, role: 'moteur', texte: 'lieu_courant : lieu_1 -> lieu_2', origine: 'aller' },
			],
		}
		rerender({ session: sessionApresConsole })

		await act(async () => {
			await result.current.executeAction('regarde autour de moi')
		})

		// Le copilote DOIT recevoir la session APRES-CONSOLE — une copie figee au
		// premier rendu enverrait encore SESSION_TEST (tour 1, lieu_1) ici.
		expect(demanderMock).toHaveBeenCalledWith(DOSSIER_TEST, {
			role: 'interprete',
			saisie: 'regarde autour de moi',
			session: sessionApresConsole,
		})
	})

	it('getGestelabel retourne le label réel de COMMANDES', () => {
		demanderMock.mockResolvedValue({
			statut: 'propose',
			proposition: { lecture: 'sans_commande', gestes_possibles: [] },
		})

		const { result } = monter()

		// Appel direct
		const labelAller = result.current.getGestelabel('aller')

		// Vérifier que c'est celui de COMMANDES
		expect(labelAller).toBe(COMMANDES.aller.label)
		expect(labelAller).toBeTruthy() // Ne doit pas être vide
	})
})
