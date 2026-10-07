import { act, renderHook } from '@testing-library/react'
import type { HeroState } from '../../../player/types'
import { useTourDeJeu } from './useTourDeJeu'

// Les imports du brain se feront APRÈS le jest.mock()
import type {
	Dossier,
	EtatSession,
	SortieInterprete,
	SortieNarrateur,
	ReponseNarrateur,
	EchecCopilote,
} from '../../../brain'
import { apresInterpretation } from '../../../brain'
import { COMMANDES } from '../../../brain/dossier/commandes'

/**
 * TESTS DU HOOK `useTourDeJeu` — orchestrateur du tour de jeu.
 *
 * MÊME PATTERN QUE `useDemandeCopilote.test.tsx` : `renderHook` (pas de BrainProvider),
 * mock `CopiloteService.demander` RETENU À LA MAIN pour contrôler le timing des promesses,
 * assertions sur le state du hook (pas sur le `disabled` d'un bouton). Les tests
 * couvrent KR-265 (verrou), KR-248 (journal), succès/erreur, `getGestelabel`, et
 * l'orchestration de R3 (narrateur) après R1 (interprete).
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

/** Un héros plausible — ni les valeurs par défaut de `charCreation.ts`, ni des jauges
 *  pleines (même doctrine que `SESSION_SATUREE`, KR-013 : un héros frais serait
 *  indistinguable d'un champ jamais lu). */
const HEROS_TEST: HeroState = {
	name: 'Aldric',
	caracs: { FO: 10, AG: 12, DX: 9, EN: 11, IN: 8, IG: 10, SE: 9, CA: 10 },
	pvMax: 21,
	pv: 18,
	peMax: 10,
	pe: 7,
	mcBonus: 0,
	xp: 0,
}

/** Session avec un héros déjà créé — déclenche `doitArbitrer` sur un geste `agir`. */
const SESSION_AVEC_HEROS: EtatSession = { ...SESSION_TEST, heros: HEROS_TEST }

/** Dossier minimal avec un accès `aller` de `lieu_1` à `lieu_2` et un PNJ avec présence et identité. */
const DOSSIER_TEST: Dossier = {
	id: 'test-dossier',
	titre: 'Test',
	schema: 1,
	createdAt: '2026-09-25T00:00:00.000Z',
	updatedAt: '2026-09-25T00:00:00.000Z',
	canon: {
		mj: {
			synopsis_mj: 'Tester l orchestration du tour',
		},
		partage: {
			accroche_joueur: 'Bienvenue',
		},
		ton: 'Ton de test',
		interdits_ton: [],
		objectifs: [],
	},
	monde: {
		personnages: [
			{
				id: 'pnj-1',
				nom: 'Allié',
				fonction: 'un guerrier',
				apparence: '',
				presence: [{ lieu_id: 'lieu_1' }],
				caractere: { parler: [], jamais: '' },
				savoirs: [],
				relations: [],
				portee: 'premier',
				plan_actions: [],
			},
			{
				id: 'pnj-2',
				nom: 'Sentinel',
				fonction: 'une sentinelle',
				apparence: '',
				presence: [{ lieu_id: 'lieu_2' }],
				caractere: { parler: [], jamais: '' },
				savoirs: [],
				relations: [],
				portee: 'premier',
				plan_actions: [],
			},
			{
				id: 'pnj-3',
				nom: 'Mage',
				fonction: '',
				apparence: 'un mage vêtu de bleu',
				presence: [{ lieu_id: 'lieu_1' }],
				caractere: { parler: [], jamais: '' },
				savoirs: [],
				relations: [],
				portee: 'premier',
				plan_actions: [],
			},
		],
		lieux: [
			{
				id: 'lieu_1',
				nom: 'Départ',
				description: 'Le lieu de départ',
				acces: ['lieu_2'],
			},
			{
				id: 'lieu_2',
				nom: 'Arrivée',
				description: 'Le lieu d arrivée',
				acces: ['lieu_1'],
			},
		],
		objets: [],
		indices: [],
		quetes: [],
		evenements: [],
		conditions: {
			climat: [],
		},
	},
	charpente: {
		depart: { lieu_id: 'lieu_1', texte_ouverture_joueur: 'Vous êtes au départ' },
		jalons: [],
		fins: [],
	},
}

// ── MOCK BRAIN ──

const demanderMock = jest.fn()

function crediterXpImplementation(session: EtatSession, xp: number): EtatSession {
	if (!session.heros || xp <= 0) return session
	return { ...session, heros: { ...session.heros, xp: (session.heros?.xp ?? 0) + xp } }
}

jest.mock('../../../brain', () => {
	const actualBrain = jest.requireActual('../../../brain')
	return {
		...actualBrain,
		useBrain: () => ({
			copilote: {
				demander: demanderMock,
			},
		}),
		xpDuJet: jest.fn(),
		crediterXp: jest.fn(crediterXpImplementation),
	}
})

// Récupérer les mocks après le jest.mock()
import { xpDuJet as xpDuJetImported, crediterXp as crediterXpImported } from '../../../brain'
const xpDuJetMock = xpDuJetImported as jest.Mock
const crediterXpMock = crediterXpImported as jest.Mock

// Helper pour configurer le mock xpDuJet
function setXpDuJetMockReturnValue(value: number | undefined) {
	xpDuJetMock.mockReturnValue(value)
}

// ── HELPER ──

function monter(sessionInitiale = SESSION_TEST, onSessionChange = jest.fn()) {
	return renderHook(() => useTourDeJeu(DOSSIER_TEST, sessionInitiale, onSessionChange))
}

// ── TESTS ──

describe('useTourDeJeu — hook orchestrateur', () => {
	beforeEach(() => {
		jest.clearAllMocks()
		// Réinitialiser l'implémentation de crediterXpMock après clearAllMocks
		crediterXpMock.mockImplementation(crediterXpImplementation)
		// Initialiser xpDuJet à undefined par défaut
		setXpDuJetMockReturnValue(undefined)
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
		// ⚠ UNE RÉPONSE PAR APPEL (it3) : ce bouchon rendait la proposition de R1 AUSSI à R3
		// (`mockResolvedValue`), et le hook posait alors `recit: undefined` sans bruit — un
		// défaut de témoin latent depuis l'it2, que `consignerNarration` (qui lit
		// `faits_etablis`, requis) a fait lever. R3 reçoit désormais SA forme.
		demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition }).mockResolvedValueOnce({
			statut: 'propose',
			proposition: { recit: 'Vous arrivez.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
		})

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

	describe('Orchestration R3 (narrateur) — lot 2 it2', () => {
		beforeEach(() => {
			jest.clearAllMocks()
			// Réinitialiser le mock xpDuJet à undefined (mais garder son implémentation)
			setXpDuJetMockReturnValue(undefined)
		})

		it('Lot 2 — R3 appelé après persistance (2ᵉ appel demander après onSessionChange)', async () => {
			// La tranche du test : R1 retourne une commande acceptée,
			// R3 retourne un récit valide.
			const propositionR1 = {
				lecture: 'commande' as const,
				commande: { commande: 'aller' as const, cibles: ['lieu_2'] },
			}
			const narrateurReponse: ReponseNarrateur = {
				statut: 'propose' as const,
				proposition: {
					recit: 'Vous avancez dans la forêt.',
					suggestions: ['Fouiller', 'Continuer'],
					faits_etablis: [],
				} satisfies SortieNarrateur,
			}

			// Mock : les deux appels - d'abord R1, puis R3
			const resolveurs: Array<
				(reponse: ReponseNarrateur | { statut: 'propose'; proposition: SortieInterprete }) => void
			> = []
			demanderMock.mockImplementation(
				() =>
					new Promise((resolve) => {
						resolveurs.push(resolve)
					}),
			)

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_TEST, onSessionChange)

			// ÉTAPE 1 : Appeler executeAction SANS l'attendre (lance la chaîne R1→R3)
			act(() => {
				result.current.executeAction('aller au nord')
			})

			// À ce stade, R1 est en vol
			expect(demanderMock).toHaveBeenCalledTimes(1)
			expect(onSessionChange).not.toHaveBeenCalled()

			// ÉTAPE 2 : Résoudre R1 — accepté (déclenche l'exécution + persistance + R3)
			await act(async () => {
				resolveurs[0]({ statut: 'propose', proposition: propositionR1 })
			})

			// Vérification : onSessionChange a été appelé (S1 persistée)
			const sessionApresR1 = onSessionChange.mock.calls[0][0] as EtatSession
			expect(onSessionChange).toHaveBeenCalledTimes(1)

			// À ce stade, R3 doit être en vol (appel #2)
			expect(demanderMock).toHaveBeenCalledTimes(2)

			// Vérifier l'ORDRE : onSessionChange AVANT le 2e appel demander (persistance avant R3)
			const orderOnSessionChange = onSessionChange.mock.invocationCallOrder[0]
			const orderDemandR3 = demanderMock.mock.invocationCallOrder[1]
			expect(orderOnSessionChange).toBeLessThan(orderDemandR3)

			// Le 2ᵉ appel (R3) doit recevoir la session après R1 (S1) — par référence (KR-013)
			const cibleR3 = demanderMock.mock.calls[1][1]
			expect(cibleR3.role).toBe('narrateur')
			expect(cibleR3.saisie).toBe('aller au nord')
			expect(cibleR3.session).toBe(sessionApresR1) // Référence exacte, pas structure

			// ÉTAPE 3 : Résoudre R3 — succès (écrit le récit sur la session)
			await act(async () => {
				resolveurs[1](narrateurReponse)
			})

			// Vérification finale : onSessionChange appelé une 2ᵉ fois avec le récit écrit
			expect(onSessionChange).toHaveBeenCalledTimes(2)
			const sessionAvecRecit = onSessionChange.mock.calls[1][0] as EtatSession
			const entreeRecente = sessionAvecRecit.journal[sessionAvecRecit.journal.length - 1]
			expect(entreeRecente?.recit).toBe('Vous avancez dans la forêt.')

			// Vérifier issueNarrateur après succès R3 — tour = session avec récit
			expect(result.current.issueNarrateur).toEqual({
				tour: sessionAvecRecit.horloge.tour,
				statut: 'raconte',
				suggestions: ['Fouiller', 'Continuer'],
			})
		})

		it('it3 — les faits etablis par R3 sont retenus DANS LA MEME transition que le recit : un seul onSessionChange de plus', async () => {
			// `consignerNarration` remplace `consignerRecit` : le hook lui passe la proposition
			// ENTIÈRE, et c'est elle — jamais le hook — qui décide ce qui est retenu. Un
			// résumé arrivé alors que rien n'était dû (pas 2) est IGNORÉ par sa garde.
			const fait = { fait: 'La clairière est silencieuse.', sur: ['lieu_2'] }
			demanderMock
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: { lecture: 'commande' as const, commande: { commande: 'aller' as const, cibles: ['lieu_2'] } },
				})
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: {
						recit: 'Vous entrez dans la clairière.',
						suggestions: [],
						faits_etablis: [fait],
						resume: { texte: 'Trop tot.', jusqu_au_pas: 10 },
					} satisfies SortieNarrateur,
				})

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_TEST, onSessionChange)

			await act(async () => {
				await result.current.executeAction('aller a la clairiere')
			})

			// DEUX écritures en tout : S1 (après R1), puis S2 (récit ET mémoire, ensemble).
			expect(onSessionChange).toHaveBeenCalledTimes(2)
			const s2 = onSessionChange.mock.calls[1][0] as EtatSession
			expect(s2.journal[s2.journal.length - 1]?.recit).toBe('Vous entrez dans la clairière.')
			expect(s2.memoire).toEqual({ faits_etablis: [fait] })
			// `UseTourDeJeuResult` lot 2 : `carteJet` et `lancerLeDe` ajoutés (lot 2), les faits
			// ne passent JAMAIS par l'état du hook (it3).
			expect(Object.keys(result.current).sort()).toEqual(
				[
					'avis',
					'carteJet',
					'executeAction',
					'getGestelabel',
					'isLocked',
					'issueNarrateur',
					'lancerLeDe',
					'pasEnCours',
				].sort(),
			)
		})

		it('Lot 2 — R3 appelé seulement si avis.type === aucun (3 cas)', async () => {
			// Trois cas : valide (appel R3 = 2 appels), clarification (pas R3 = 1 appel), non_reconnu (pas R3 = 1 appel)
			const tests = [
				{
					nom: 'valide (aucun) → R3 appelé',
					r1Response: {
						statut: 'propose' as const,
						proposition: { lecture: 'commande' as const, commande: { commande: 'aller' as const, cibles: ['lieu_2'] } },
					},
					r3Response: {
						statut: 'propose' as const,
						proposition: { recit: 'Vous bougez.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
					},
					attenduAppels: 2,
				},
				{
					nom: 'clarification → R3 pas appelé',
					r1Response: {
						statut: 'propose' as const,
						proposition: { lecture: 'clarification' as const, question: 'Vers quel lieu ?' },
					},
					r3Response: undefined,
					attenduAppels: 1,
				},
				{
					nom: 'sans_commande → R3 pas appelé',
					r1Response: {
						statut: 'propose' as const,
						proposition: { lecture: 'sans_commande' as const, gestes_possibles: ['aller'] },
					},
					r3Response: undefined,
					attenduAppels: 1,
				},
			]

			for (const test of tests) {
				jest.resetAllMocks()
				demanderMock.mockResolvedValueOnce(test.r1Response)
				if (test.r3Response) {
					demanderMock.mockResolvedValueOnce(test.r3Response)
				}

				const { result } = monter(SESSION_TEST)

				await act(async () => {
					await result.current.executeAction('test action')
				})

				// Compter les appels à demander
				const nbAppels = demanderMock.mock.calls.length
				expect(nbAppels).toBe(test.attenduAppels)
			}
		})

		it('Lot 2 — R3 indisponible (refus de contexte ou indisponibilité)', async () => {
			// R3 rend {statut:'indisponible', ...} — pas accepté
			const propositionR1 = {
				lecture: 'commande' as const,
				commande: { commande: 'aller' as const, cibles: ['lieu_2'] },
			}
			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionR1 })
				.mockResolvedValueOnce({ statut: 'indisponible', raison: 'non-configure' })

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_TEST, onSessionChange)

			await act(async () => {
				await result.current.executeAction('aller au nord')
			})

			// onSessionChange appelé UNE SEULE fois (persistance R1, pas de 2e appel pour R3)
			expect(onSessionChange).toHaveBeenCalledTimes(1)

			// issueNarrateur défini avec statut 'degrade', tour = session après R1
			const sessionApresR1 = onSessionChange.mock.calls[0][0] as EtatSession
			expect(result.current.issueNarrateur).toEqual({
				tour: sessionApresR1.horloge.tour,
				statut: 'degrade',
			})
		})

		it('Lot 2 — R3 refuse (trop-long, cible-a-ecrire)', async () => {
			// R3 rend {statut:'refuse', ...} — pas accepté, refus avant fetch
			const propositionR1 = {
				lecture: 'commande' as const,
				commande: { commande: 'aller' as const, cibles: ['lieu_2'] },
			}
			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionR1 })
				.mockResolvedValueOnce({ statut: 'refuse', motif: 'trop-long' })

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_TEST, onSessionChange)

			await act(async () => {
				await result.current.executeAction('aller au nord')
			})

			// onSessionChange appelé UNE SEULE fois
			expect(onSessionChange).toHaveBeenCalledTimes(1)

			// issueNarrateur défini avec statut 'degrade', tour = session après R1
			const sessionApresR1 = onSessionChange.mock.calls[0][0] as EtatSession
			expect(result.current.issueNarrateur?.tour).toBe(sessionApresR1.horloge.tour)
			expect(result.current.issueNarrateur?.statut).toBe('degrade')
		})

		it('Lot 2 — executeAction retourne true si pas consommé, false sinon', async () => {
			// Cas 1 : commande acceptée → R1 résultat ok → true
			demanderMock.mockResolvedValueOnce({
				statut: 'propose',
				proposition: { lecture: 'commande' as const, commande: { commande: 'aller' as const, cibles: ['lieu_2'] } },
			})
			// R3 respon se pour le cas accepté
			demanderMock.mockResolvedValueOnce({
				statut: 'propose',
				proposition: { recit: 'Vous bougez.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
			})

			let { result } = monter()
			let ret1: boolean | undefined
			await act(async () => {
				ret1 = await result.current.executeAction('aller au nord')
			})
			expect(ret1).toBe(true)

			// Cas 2 : sans_commande → R1 pas accepté → false
			jest.resetAllMocks()
			demanderMock.mockResolvedValueOnce({
				statut: 'propose',
				proposition: { lecture: 'sans_commande' as const, gestes_possibles: [] },
			})

			result = monter().result
			let ret2: boolean | undefined
			await act(async () => {
				ret2 = await result.current.executeAction('action inconnue')
			})
			expect(ret2).toBe(false)

			// Cas 3 : échec copilote (EchecCopilote) → false
			jest.resetAllMocks()
			demanderMock.mockResolvedValueOnce({
				statut: 'indisponible' as const,
				raison: 'non-configure' as const,
			})

			result = monter().result
			let ret3: boolean | undefined
			await act(async () => {
				ret3 = await result.current.executeAction('test')
			})
			expect(ret3).toBe(false)
		})

		it('Lot 2 — routage R2 : agir+héros → R2 appelé, carteJet peuplé, jamais session.attente (plan §7)', async () => {
			const propositionAgir = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] as string[] },
			}

			demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir }).mockResolvedValueOnce({
				statut: 'propose',
				proposition: {
					epreuve: {
						carac: 'FO',
						tc: 'TC2',
						enjeu_reussite: 'franchir la brèche',
						enjeu_echec: "s'entailler sur les gravats",
					},
				},
			})

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

			await act(async () => {
				await result.current.executeAction('fouiller les gravats')
			})

			// Exactement deux appels : R1 puis R2 — AUCUN R3 tant que la carte attend le clic.
			expect(demanderMock).toHaveBeenCalledTimes(2)
			const cibleR2 = demanderMock.mock.calls[1][1]
			expect(cibleR2).toEqual({ role: 'arbitre', saisie: 'fouiller les gravats', lieuId: 'lieu_1' })

			// La carte est peuplée avec la proposition de R2, pas encore de résultat.
			expect(result.current.carteJet).toEqual({
				carac: 'FO',
				tc: 'TC2',
				enjeuReussite: 'franchir la brèche',
				enjeuEchec: "s'entailler sur les gravats",
			})

			// Jamais rangée dans `session.attente` — c'est un état éphémère du hook (§8 #15 du plan).
			const sessionPersistee = onSessionChange.mock.calls[0][0] as EtatSession
			expect(sessionPersistee.attente).toBeUndefined()
		})

		it('Lot 2 — {sans_epreuve:true} : aucune CarteJet, R3 immédiat, session avance sans EntreeJournal.jet (plan §7)', async () => {
			const propositionAgir = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] as string[] },
			}

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir })
				.mockResolvedValueOnce({ statut: 'propose', proposition: { sans_epreuve: true } })
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: { recit: 'Rien ne cède.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
				})

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

			await act(async () => {
				await result.current.executeAction('pousser la porte')
			})

			// Trois appels : R1, R2 (sans_epreuve), PUIS R3 immédiatement.
			expect(demanderMock).toHaveBeenCalledTimes(3)
			expect(demanderMock.mock.calls[1][1]).toMatchObject({ role: 'arbitre' })
			expect(demanderMock.mock.calls[2][1]).toMatchObject({ role: 'narrateur' })

			// Aucune carte ne s'affiche.
			expect(result.current.carteJet).toBeNull()

			// La session persistée après R1 ne porte AUCUNE entrée `jet`.
			const sessionApresR1 = onSessionChange.mock.calls[0][0] as EtatSession
			expect(sessionApresR1.journal.every((e) => e.jet === undefined)).toBe(true)
		})

		it('Lot 2 — R2 indisponible : même dégradation silencieuse que sans_epreuve, aucune bannière dédiée (plan §8 #8)', async () => {
			const propositionAgir = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] as string[] },
			}

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir })
				.mockResolvedValueOnce({ statut: 'indisponible', raison: 'non-configure' })
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: { recit: 'Rien ne cède.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
				})

			const { result } = monter(SESSION_AVEC_HEROS)

			await act(async () => {
				await result.current.executeAction('pousser la porte')
			})

			expect(demanderMock).toHaveBeenCalledTimes(3)
			expect(result.current.carteJet).toBeNull()
			expect(result.current.issueNarrateur?.statut).toBe('raconte')
		})

		it('Lot 2 — KR-265 étendu : le verrou reste tenu tant que la carte attend le clic, relâché seulement après lancerLeDe', async () => {
			const propositionAgir = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] as string[] },
			}

			demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir }).mockResolvedValueOnce({
				statut: 'propose',
				proposition: { epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: 'réussir', enjeu_echec: 'échouer' } },
			})

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

			await act(async () => {
				await result.current.executeAction('agir')
			})

			// La carte attend le clic — le verrou DOIT rester posé (régression tech-lead it2).
			expect(result.current.carteJet).not.toBeNull()
			expect(result.current.isLocked).toBe(true)
			expect(result.current.pasEnCours()).toBe(true)

			// Une seconde soumission pendant l'attente doit être ignorée (verrou tenu).
			act(() => {
				result.current.executeAction('autre action pendant l attente')
			})
			expect(demanderMock).toHaveBeenCalledTimes(2) // toujours R1+R2, rien de plus

			// Le clic sur « Lancer » résout le jet et appelle R3.
			demanderMock.mockResolvedValueOnce({
				statut: 'propose',
				proposition: { recit: 'Vous agissez.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
			})
			await act(async () => {
				await result.current.lancerLeDe()
			})

			// Le verrou ne se relâche qu'ICI, à la fin de la chaîne étendue.
			expect(result.current.isLocked).toBe(false)
			expect(result.current.carteJet).toBeNull()
		})

		it('Lot 2 — garde de ré-entrance : un second appel concurrent à lancerLeDe est ignoré (BUG-137/KR-278, tech-lead 2e passage)', async () => {
			const propositionAgir = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] as string[] },
			}

			demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir }).mockResolvedValueOnce({
				statut: 'propose',
				proposition: { epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: 'réussir', enjeu_echec: 'échouer' } },
			})

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

			await act(async () => {
				await result.current.executeAction('agir')
			})
			expect(result.current.carteJet).not.toBeNull()

			// R3 contrôlé à la main — ouvre une fenêtre pendant laquelle un second
			// `lancerLeDe` pourrait s'intercaler avant que le premier n'ait fini.
			let resolveR3: (reponse: ReponseNarrateur) => void = () => {}
			demanderMock.mockImplementationOnce(
				() =>
					new Promise<ReponseNarrateur>((resolve) => {
						resolveR3 = resolve
					}),
			)

			// Double déclenchement SANS attendre entre les deux — même scénario qu'une
			// répétition clavier OS sur Entrée (double frappe de `CarteJet`).
			let p1: Promise<void> = Promise.resolve()
			let p2: Promise<void> = Promise.resolve()
			act(() => {
				p1 = result.current.lancerLeDe()
				p2 = result.current.lancerLeDe()
			})

			await act(async () => {
				resolveR3({
					statut: 'propose',
					proposition: { recit: 'Vous agissez.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
				})
				await p1
				await p2
			})

			// R1, R2, PUIS R3 — une seule fois, jamais un second appel R3 malgré les
			// deux invocations de `lancerLeDe`.
			expect(demanderMock).toHaveBeenCalledTimes(3)

			// Une seule écriture de jet : `consignerJet` n'a tourné qu'une fois.
			const sessionAvecJet = onSessionChange.mock.calls.find((appel) =>
				(appel[0] as EtatSession).journal.some((e) => e.jet !== undefined),
			)?.[0] as EtatSession | undefined
			expect(sessionAvecJet?.journal.filter((e) => e.jet !== undefined)).toHaveLength(1)
		})

		it("Lot 3 — lancerLeDe crédite heros.xp avant l'appel à R3", async () => {
			// Scénario : agir+héros → R2 (épreuve) → lancerLeDe crédite XP avant R3
			const propositionAgir = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] as string[] },
			}

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir })
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: {
						epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: 'franchir', enjeu_echec: 'tomber' },
					},
				})
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: { recit: 'Vous agissez.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
				})

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

			await act(async () => {
				await result.current.executeAction('agir')
			})

			// FORCER crédit XP > 0
			setXpDuJetMockReturnValue(5)

			await act(async () => {
				await result.current.lancerLeDe()
			})

			// Vérifier qu'il y a 3 appels : R1 + crédit/jet + R3
			expect(onSessionChange).toHaveBeenCalledTimes(3)

			// Le 2e appel DOIT avoir exactement 5 XP de crédit
			const sessionAvecXp = onSessionChange.mock.calls[1][0] as EtatSession
			expect(sessionAvecXp.heros?.xp).toBe(HEROS_TEST.xp + 5)

			// Vérifier l'ordre : la 2e persistance (crédit) doit PRÉCÉDER R3 (3e appel demander, après R1 et R2)
			const orderCredit = onSessionChange.mock.invocationCallOrder[1]
			const orderR3 = demanderMock.mock.invocationCallOrder[2] // R3 est après R1 (idx 0) et R2 (idx 1)
			expect(orderCredit).toBeLessThan(orderR3)
		})

		it('Lot 3 — lancerLeDe : R3 dégradé, heros.xp crédité persiste', async () => {
			// Scénario : R3 échoue mais l'XP reste crédité
			const propositionAgir = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] as string[] },
			}

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir })
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: { epreuve: { carac: 'AG', tc: 'TC1', enjeu_reussite: 'avancer', enjeu_echec: 'reculer' } },
				})
				.mockResolvedValueOnce({ statut: 'indisponible', raison: 'non-configure' }) // R3 dégradé

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

			await act(async () => {
				await result.current.executeAction('agir')
			})

			// FORCER crédit XP > 0 (pour prouver que le crédit persiste même si R3 échoue)
			setXpDuJetMockReturnValue(3)

			await act(async () => {
				await result.current.lancerLeDe()
			})

			// Vérifier 2 appels : R1 + crédit/jet (pas de 3e pour R3 échoué)
			expect(onSessionChange).toHaveBeenCalledTimes(2)

			// Le 2e appel DOIT avoir exactement 3 XP de crédit (même si R3 échoue après)
			const sessionAvecXp = onSessionChange.mock.calls[1][0] as EtatSession
			expect(sessionAvecXp.heros?.xp).toBe(HEROS_TEST.xp + 3)

			// issueNarrateur affiche dégradation
			expect(result.current.issueNarrateur?.statut).toBe('degrade')
		})

		it('Lot 3 — lancerLeDe : XP crédité, seule feuille modifiée (pv/pe inchangés)', async () => {
			// Vérifie que seul heros.xp change, pas pv/pe
			const propositionAgir = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] as string[] },
			}

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir })
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: { epreuve: { carac: 'IN', tc: 'TC1', enjeu_reussite: 'réussir', enjeu_echec: 'échouer' } },
				})
				.mockResolvedValueOnce({
					statut: 'propose',
					proposition: { recit: 'Fin.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
				})

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

			await act(async () => {
				await result.current.executeAction('agir')
			})

			// FORCER crédit XP > 0 — sinon ce test n'exerce jamais crediterXp et son
			// titre ("XP crédité") sur-promettrait par rapport à ce qu'il vérifie
			// réellement (trouvaille tech-lead, re-revue PR du lot 3).
			setXpDuJetMockReturnValue(7)

			await act(async () => {
				await result.current.lancerLeDe()
			})

			// Le 2e appel : vérifier modifications
			const sessionModifiee = onSessionChange.mock.calls[1][0] as EtatSession
			expect(sessionModifiee.heros?.pv).toBe(HEROS_TEST.pv) // inchangé
			expect(sessionModifiee.heros?.pe).toBe(HEROS_TEST.pe) // inchangé
			expect(sessionModifiee.heros?.xp).toBe(HEROS_TEST.xp + 7) // seule feuille modifiée, crédit réel
		})
	})

	describe('Lot 2 — orchestration R4 (acteur) — n° 12 moteur-acteurs it1', () => {
		beforeEach(() => {
			jest.clearAllMocks()
		})

		it('Lot 2 — R4 appelé après parler accepté (test simple)', async () => {
			// Test simple pour vérifier que R4 est appelé après une commande parler acceptée
			const propositionParler = {
				lecture: 'commande' as const,
				commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
			}
			const reponseR4 = { replique: 'Bonjour!' }

			// Mock : R1 retourne parler, R4 retourne une réplique
			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
				.mockResolvedValueOnce(reponseR4)

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_TEST, onSessionChange)

			await act(async () => {
				await result.current.executeAction('parler pnj-1')
			})

			// R4 doit avoir été appelé (2e appel après R1)
			expect(demanderMock).toHaveBeenCalledTimes(2)

			// La première journée du deuxième appel doit être pour R4
			const r4Call = demanderMock.mock.calls[1]?.[1]
			expect(r4Call?.role).toBe('acteur')

			// onSessionChange doit avoir été appelé deux fois : après R1 et après R4
			expect(onSessionChange).toHaveBeenCalledTimes(2)
		})

		it("Lot 2 — KR-265 étendu : verrou de tour sur R4 — 2e commande pendant l'attente R4 refusée, levée après résolution", async () => {
			// Lot 2 : `parler` command accepté → R1 pose avis.type = 'aucun' → R4 appelé
			// Le verrou DOIT rester posé pendant l'appel R4, et une 2e soumission doit être
			// refusée jusqu'à ce que R4 se résolve.
			const propositionParler = {
				lecture: 'commande' as const,
				commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
			}

			// Contrôle du timing : retenir les résolveurs à la main
			const resolveurs: Array<
				(
					reponse:
						| { statut: 'propose'; proposition: SortieInterprete }
						| { statut: string; replique: string }
						| EchecCopilote,
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

			// Temps 1 : première soumission `parler`
			act(() => {
				result.current.executeAction('parler pnj-1')
			})
			expect(demanderMock).toHaveBeenCalledTimes(1) // R1 appelé
			expect(result.current.isLocked).toBe(true)

			// Temps 2 : résoudre R1 avec succès (acceptation de la commande `parler`)
			await act(async () => {
				resolveurs[0]({ statut: 'propose', proposition: propositionParler })
			})

			// R4 doit être appelé maintenant (2e appel)
			expect(demanderMock).toHaveBeenCalledTimes(2)
			expect(result.current.isLocked).toBe(true) // Verrou RESTE POSÉ pendant R4

			// Temps 3 : tentative d'une 2e soumission pendant que R4 est en vol
			// Cette soumission DOIT être ignorée (verrou tenu).
			act(() => {
				result.current.executeAction('aller ailleurs')
			})
			expect(demanderMock).toHaveBeenCalledTimes(2) // Pas 3 — la garde tient bon

			// Temps 4 : résoudre R4 avec succès (réplique valide)
			await act(async () => {
				resolveurs[1]({ statut: 'propose', replique: 'Bonjour à toi.' })
			})

			// Verrou doit être relâché après résolution R4
			expect(result.current.isLocked).toBe(false)

			// Temps 5 : vérifier qu'une 3e soumission après déverrouillage EST acceptée
			act(() => {
				result.current.executeAction('aller au nord')
			})
			expect(demanderMock).toHaveBeenCalledTimes(3) // MAINTENANT il y a un 3e appel
		})

		it('Lot 2 — KR-283 : échec silencieux — EchecCopilote → bannière existante, zéro texte de repli', async () => {
			// Lot 2 : `parler` accepté → R4 appelé → R4 échoue (indisponible, contexte trop long, etc.)
			// Résultat attendu : avis doit porter l'échec copilote, AUCUNE réplique posée,
			// AUCUN texte de repli écrit par le code — la bannière standard d'EchecCopilote s'affiche.
			const propositionParler = {
				lecture: 'commande' as const,
				commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
			}
			const reponseActeurEchec = { statut: 'indisponible', raison: 'non-configure' } satisfies EchecCopilote

			// Mock : R1 succès, R4 échoue
			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
				.mockResolvedValueOnce(reponseActeurEchec)

			const onSessionChange = jest.fn()
			const { result } = monter(SESSION_TEST, onSessionChange)

			await act(async () => {
				await result.current.executeAction('parler pnj-1')
			})

			// Vérifications :
			// 1. R4 a été appelé (2e appel après R1)
			expect(demanderMock).toHaveBeenCalledTimes(2)

			// 2. L'avis capte l'échec copilote — c'est ce qui sera affiché à l'écran
			expect(result.current.avis).toEqual(reponseActeurEchec)

			// 3. onSessionChange a été appelé UNE SEULE fois (après R1, pas de 2e après R4 échoué)
			expect(onSessionChange).toHaveBeenCalledTimes(1)

			// 4. AUCUNE réplique n'a été posée : le journal de la session ne porte pas de nouveau `recit`
			const sessionApresR1 = onSessionChange.mock.calls[0][0] as EtatSession
			const journalApres = sessionApresR1.journal
			const entreesRecentes = journalApres.slice(-2) // Les 2 dernières entrées (joueur + moteur de `parler`)
			expect(entreesRecentes[1]?.recit).toBeUndefined() // Pas de recit après le refus R4
		})

		it('Lot 2 — R4 appelé seulement si commande === parler et avis.type === aucun', async () => {
			// Scénario : deux cas — `parler` accepté → R4 appelé, puis `agir` sans jet → R4 pas appelé
			const tests = [
				{
					nom: 'parler accepté → R4 appelé',
					r1Proposition: { lecture: 'commande' as const, commande: { commande: 'parler' as const, cibles: ['pnj-3'] } },
					r4Response: { statut: 'propose' as const, replique: 'Salut!' },
					attenduAppels: 2, // R1 + R4
					attenduRecit: true,
				},
				{
					nom: 'agir sans jet → R4 pas appelé, seulement R3',
					r1Proposition: { lecture: 'commande' as const, commande: { commande: 'agir' as const, cibles: [] } },
					r3Response: { recit: 'Vous agissez.', suggestions: [], faits_etablis: [] } satisfies SortieNarrateur,
					attenduAppels: 2, // R1 + R3 (pas de R2/R4)
					attenduRecit: true,
				},
			]

			for (const test of tests) {
				jest.resetAllMocks()
				demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition: test.r1Proposition })
				if ('r4Response' in test) {
					demanderMock.mockResolvedValueOnce({ statut: 'propose', ...test.r4Response })
				} else if ('r3Response' in test) {
					demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition: test.r3Response })
				}

				const onSessionChange = jest.fn()
				const { result } = monter(SESSION_TEST, onSessionChange)

				await act(async () => {
					await result.current.executeAction('test action')
				})

				expect(demanderMock).toHaveBeenCalledTimes(test.attenduAppels)
			}
		})

		it('Lot B (moteur-acteurs it2) -- indices_reveles de R4 propage jusqu a la session (BUG-145)', async () => {
			// Dossier variant : pnj-1 porte un savoir revelable (porte apres_indice_id,
			// deja ouverte par indices_connus de la session), avec une formulation_joueur
			// redigee -- condition de contenu (revelation.ts) remplie.
			const dossierAvecSavoir: Dossier = {
				...DOSSIER_TEST,
				monde: {
					...DOSSIER_TEST.monde,
					indices: [
						...DOSSIER_TEST.monde.indices,
						{ id: 'indice-prealable', nom: 'Un indice deja connu', verite: 'vrai' },
						{
							id: 'indice-secret',
							nom: 'Le secret du PNJ',
							verite: 'vrai',
							formulation_joueur: 'Il confie enfin son secret.',
						},
					],
					personnages: DOSSIER_TEST.monde.personnages.map((pnj) =>
						pnj.id === 'pnj-1'
							? {
									...pnj,
									savoirs: [
										{
											indice_id: 'indice-secret',
											certitude: 'sait' as const,
											revele_comment: 'Il hesite, puis parle.',
											revele_si: { apres_indice_id: 'indice-prealable' },
										},
									],
								}
							: pnj,
					),
				},
			}
			const sessionAvecIndiceConnu: EtatSession = {
				...SESSION_TEST,
				monde: { ...SESSION_TEST.monde, indices_connus: ['indice-prealable'] },
			}

			const propositionParler = {
				lecture: 'commande' as const,
				commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
			}
			const reponseR4 = { replique: 'Voici mon secret.', indices_reveles: ['indice-secret'] }

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
				.mockResolvedValueOnce(reponseR4)

			const onSessionChange = jest.fn()
			const { result } = renderHook(() => useTourDeJeu(dossierAvecSavoir, sessionAvecIndiceConnu, onSessionChange))

			await act(async () => {
				await result.current.executeAction('parler pnj-1')
			})

			expect(demanderMock).toHaveBeenCalledTimes(2)
			expect(onSessionChange).toHaveBeenCalledTimes(2)

			const sessionFinale = onSessionChange.mock.calls[1][0] as EtatSession

			// Le journal porte le delta applique
			const entreeParler = sessionFinale.journal.find(
				(entree) => entree.origine === 'parler' && entree.recit === 'Voici mon secret.',
			)
			expect(entreeParler?.deltas).toEqual([
				expect.objectContaining({ delta: 'reveler_indice', cibles: ['indice-secret'], effet: 'applique' }),
			])

			// La session porte l'indice comme connu
			expect(sessionFinale.monde.indices_connus).toContain('indice-secret')

			// La memoire du PNJ porte le savoir confie
			expect(sessionFinale.monde.pnj['pnj-1']?.a_dit).toContain('indice-secret')
		})

		it('Lot B (moteur-acteurs it3) -- delta_confiance de R4 propage et sature la confiance de session', async () => {
			// Test de propagation : une réponse R4 avec delta_confiance non nul crédite la
			// confiance du PNJ dans la session, avec saturation aux bornes testée.
			const propositionParler = {
				lecture: 'commande' as const,
				commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
			}
			const reponseR4 = { replique: 'Voici un secret.', indices_reveles: [], delta_confiance: 1 as const }

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
				.mockResolvedValueOnce(reponseR4)

			const onSessionChange = jest.fn()
			const { result } = renderHook(() => useTourDeJeu(DOSSIER_TEST, SESSION_TEST, onSessionChange))

			await act(async () => {
				await result.current.executeAction('parler pnj-1')
			})

			expect(demanderMock).toHaveBeenCalledTimes(2)
			expect(onSessionChange).toHaveBeenCalledTimes(2)

			const sessionFinale = onSessionChange.mock.calls[1][0] as EtatSession

			// La confiance du PNJ doit être créditée : CONFIANCE_DEPART (0) + 1 = 1
			expect(sessionFinale.monde.pnj['pnj-1']?.confiance).toBe(1)
		})

		it('Lot B (moteur-acteurs it3) -- delta_confiance sature a CONFIANCE_MAX', async () => {
			// Test de saturation borne haute : PNJ déjà à CONFIANCE_MAX (3),
			// delta_confiance = +1 doit saturer à 3, pas 4.
			const sessionAvecConfiance: EtatSession = {
				...SESSION_TEST,
				monde: {
					...SESSION_TEST.monde,
					pnj: {
						'pnj-1': { a_dit: [], confiance: 3 }, // CONFIANCE_MAX
					},
				},
			}

			const propositionParler = {
				lecture: 'commande' as const,
				commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
			}
			const reponseR4 = { replique: 'Toujours confiant.', indices_reveles: [], delta_confiance: 1 as const }

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
				.mockResolvedValueOnce(reponseR4)

			const onSessionChange = jest.fn()
			const { result } = renderHook(() => useTourDeJeu(DOSSIER_TEST, sessionAvecConfiance, onSessionChange))

			await act(async () => {
				await result.current.executeAction('parler pnj-1')
			})

			const sessionFinale = onSessionChange.mock.calls[1][0] as EtatSession

			// La confiance doit rester à CONFIANCE_MAX (3), pas dépasser
			expect(sessionFinale.monde.pnj['pnj-1']?.confiance).toBe(3)
		})

		it('Lot B (moteur-acteurs it3) -- delta_confiance sature a CONFIANCE_MIN', async () => {
			// Test de saturation borne basse : PNJ à CONFIANCE_MIN (-3),
			// delta_confiance = -1 doit saturer à -3, pas -4.
			const sessionAvecConfiance: EtatSession = {
				...SESSION_TEST,
				monde: {
					...SESSION_TEST.monde,
					pnj: {
						'pnj-1': { a_dit: [], confiance: -3 }, // CONFIANCE_MIN
					},
				},
			}

			const propositionParler = {
				lecture: 'commande' as const,
				commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
			}
			const reponseR4 = { replique: 'Je ne te fais pas confiance.', indices_reveles: [], delta_confiance: -1 as const }

			demanderMock
				.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
				.mockResolvedValueOnce(reponseR4)

			const onSessionChange = jest.fn()
			const { result } = renderHook(() => useTourDeJeu(DOSSIER_TEST, sessionAvecConfiance, onSessionChange))

			await act(async () => {
				await result.current.executeAction('parler pnj-1')
			})

			const sessionFinale = onSessionChange.mock.calls[1][0] as EtatSession

			// La confiance doit rester à CONFIANCE_MIN (-3), pas descendre
			expect(sessionFinale.monde.pnj['pnj-1']?.confiance).toBe(-3)
		})

		describe('Lot 4 (moteur-acteurs it4) — cablage-jet-dialogue: R4 appel 1 résistible → CarteJet → jet → R4 appel 2', () => {
			beforeEach(() => {
				jest.clearAllMocks()
				setXpDuJetMockReturnValue(undefined)
			})

			it('15. appel 1 résistible + `resiste` → CarteJet affichée', async () => {
				// Scénario : parler accepté → R4 appel 1 avec peutResister: true
				// → retourne {resiste:{carac,tc,enjeu_reussite,enjeu_echec}}
				// → CarteJet s'affiche avec les enjeux
				const propositionParler = {
					lecture: 'commande' as const,
					commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
				}
				const resistanceActeur = {
					resiste: {
						carac: 'FO' as const,
						tc: 'TC2' as const,
						enjeu_reussite: 'Il cède.',
						enjeu_echec: 'Il tient bon.',
					},
				}

				demanderMock
					.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
					.mockResolvedValueOnce(resistanceActeur)

				const onSessionChange = jest.fn()
				const { result } = monter(SESSION_TEST, onSessionChange)

				await act(async () => {
					await result.current.executeAction('parler pnj-1')
				})

				// Vérifications :
				// 1. R4 appel 1 appelé (2e appel après R1)
				expect(demanderMock).toHaveBeenCalledTimes(2)
				const cibleR4Appel1 = demanderMock.mock.calls[1][1]
				expect(cibleR4Appel1.role).toBe('acteur')
				expect(cibleR4Appel1.peutResister).toBe(true)

				// 2. CarteJet peuplée avec les enjeux
				expect(result.current.carteJet).toEqual({
					carac: 'FO',
					tc: 'TC2',
					enjeuReussite: 'Il cède.',
					enjeuEchec: 'Il tient bon.',
				})

				// 3. Le verrou reste posé (en attente du clic « Lancer »)
				expect(result.current.isLocked).toBe(true)

				// 4. Aucune persistance de réplique : juste R1
				expect(onSessionChange).toHaveBeenCalledTimes(1)
			})

			it('16. appel 1 résistible + réplique ordinaire → parcours normal (pas CarteJet)', async () => {
				// Scénario : parler accepté → R4 appel 1 avec peutResister: true
				// → retourne {replique, indices_reveles, delta_confiance} (forme A)
				// → réplique écrite, aucune CarteJet
				const propositionParler = {
					lecture: 'commande' as const,
					commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
				}
				const reponseActeurOrdinaire = {
					replique: 'Salut à toi!',
					indices_reveles: [],
					delta_confiance: 0 as const,
				}

				demanderMock
					.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
					.mockResolvedValueOnce(reponseActeurOrdinaire)

				const onSessionChange = jest.fn()
				const { result } = monter(SESSION_TEST, onSessionChange)

				await act(async () => {
					await result.current.executeAction('parler pnj-1')
				})

				// Vérifications :
				// 1. R4 appel 1 appelé
				expect(demanderMock).toHaveBeenCalledTimes(2)

				// 2. Aucune CarteJet — réplique ordinaire
				expect(result.current.carteJet).toBeNull()

				// 3. Réplique écrite dans la session
				expect(onSessionChange).toHaveBeenCalledTimes(2) // Après R1 + après réplique
				const sessionFinale = onSessionChange.mock.calls[1][0] as EtatSession
				const entreeParler = sessionFinale.journal.find((e) => e.recit === 'Salut à toi!')
				expect(entreeParler).toBeDefined()
			})

			it('17. jet réussi → appel 2 R4 + consigner réponse (epreuve et saisie transmises)', async () => {
				// Scénario complet :
				// - parler accepté
				// - R4 appel 1 rend resiste (savoir avec porte jet)
				// - Joueur lance le dé → réussi
				// - R4 appel 2 appelé avec {epreuve:{enjeu_reussite,enjeu_echec}, session avec jet+XP}
				// - Réplique écrite avec indices_reveles
				const dossierAvecSavoirJet: Dossier = {
					...DOSSIER_TEST,
					monde: {
						...DOSSIER_TEST.monde,
						indices: [
							...DOSSIER_TEST.monde.indices,
							{
								id: 'indice-secret-jet',
								nom: 'Le secret confié',
								verite: 'vrai',
								formulation_joueur: 'Il finit par parler.',
							},
						],
						personnages: DOSSIER_TEST.monde.personnages.map((pnj) =>
							pnj.id === 'pnj-1'
								? {
										...pnj,
										savoirs: [
											{
												indice_id: 'indice-secret-jet',
												certitude: 'sait' as const,
												revele_comment: 'Après beaucoup de persuasion.',
												revele_si: { jet: { carac: 'IN' as const, tc: 'TC1' as const } },
											},
										],
									}
								: pnj,
						),
					},
				}

				const propositionParler = {
					lecture: 'commande' as const,
					commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
				}
				const resistanceAppel1 = {
					resiste: {
						carac: 'IN' as const,
						tc: 'TC1' as const,
						enjeu_reussite: 'Il se confie.',
						enjeu_echec: 'Il se tait.',
					},
				}
				const reponseAppel2 = {
					replique: 'Enfin, il parle!',
					indices_reveles: ['indice-secret-jet'],
					delta_confiance: 1 as const,
				}

				demanderMock
					.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
					.mockResolvedValueOnce(resistanceAppel1)
					.mockResolvedValueOnce(reponseAppel2)

				const onSessionChange = jest.fn()
				const { result } = renderHook(() => useTourDeJeu(dossierAvecSavoirJet, SESSION_AVEC_HEROS, onSessionChange))

				// ÉTAPE 1 : executeAction → R4 appel 1
				await act(async () => {
					await result.current.executeAction('parler pnj-1')
				})
				expect(result.current.carteJet).not.toBeNull()
				expect(demanderMock).toHaveBeenCalledTimes(2)

				// ÉTAPE 2 : lancerLeDe → jet + R4 appel 2
				await act(async () => {
					await result.current.lancerLeDe()
				})

				// Vérifications :
				// 1. Trois appels en tout : R1 + R4 appel 1 + R4 appel 2
				expect(demanderMock).toHaveBeenCalledTimes(3)

				// 2. Le 3e appel (R4 appel 2) doit recevoir l'epreuve
				const cibleR4Appel2 = demanderMock.mock.calls[2][1]
				expect(cibleR4Appel2.role).toBe('acteur')
				expect(cibleR4Appel2.peutResister).toBeUndefined() // Appel 2 = pas de peutResister
				expect(cibleR4Appel2.epreuve).toBeDefined()
				expect(cibleR4Appel2.epreuve?.enjeu_reussite).toBe('Il se confie.')

				// 3. Trois persistances : R1 + jet+XP + réplique appel 2
				expect(onSessionChange).toHaveBeenCalledTimes(3)

				// 3b. Ordre : onSessionChange(jet+XP) AVANT l'appel 2 R4
				const ordreSessionJet = (onSessionChange as jest.Mock).mock.invocationCallOrder[1]
				const ordreAppel2 = (demanderMock as jest.Mock).mock.invocationCallOrder[2]
				expect(ordreSessionJet).toBeLessThan(ordreAppel2)

				// 3c. Appel 2 reçoit la saisie d'origine du joueur
				expect(cibleR4Appel2.saisie).toBe('parler pnj-1')

				// 4. Session finale porte la réplique
				const sessionFinale = onSessionChange.mock.calls[2][0] as EtatSession
				const entreeAppel2 = sessionFinale.journal.find((e) => e.recit === 'Enfin, il parle!')
				expect(entreeAppel2).toBeDefined()
				expect(entreeAppel2?.deltas).toContainEqual(
					expect.objectContaining({ delta: 'reveler_indice', cibles: ['indice-secret-jet'] }),
				)
			})

			it('18. jet quelconque → appel 2 R4 reçoit les deux enjeux', async () => {
				// Même orchestration mais le jet échoue
				// → enjeu_echec est passé à R4 appel 2
				const propositionParler = {
					lecture: 'commande' as const,
					commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
				}
				const resistanceAppel1 = {
					resiste: {
						carac: 'AG' as const,
						tc: 'TC3' as const,
						enjeu_reussite: 'Il cède à la persuasion.',
						enjeu_echec: 'Il se méfie.',
					},
				}
				const reponseAppel2 = {
					replique: 'Tu me sembles suspecte.',
					indices_reveles: [],
					delta_confiance: -1 as const,
				}

				demanderMock
					.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
					.mockResolvedValueOnce(resistanceAppel1)
					.mockResolvedValueOnce(reponseAppel2)

				const onSessionChange = jest.fn()
				// Hero avec faible AG pour favoriser l'échec
				const heroFaible: HeroState = { ...HEROS_TEST, caracs: { ...HEROS_TEST.caracs, AG: 5 } }
				const sessionFaible: EtatSession = { ...SESSION_AVEC_HEROS, heros: heroFaible }
				const { result } = monter(sessionFaible, onSessionChange)

				await act(async () => {
					await result.current.executeAction('parler pnj-1')
				})

				await act(async () => {
					await result.current.lancerLeDe()
				})

				// Vérifications :
				// 1. Appel 2 reçoit l'epreuve (avec enjeu_echec disponible)
				const cibleR4Appel2 = demanderMock.mock.calls[2][1]
				expect(cibleR4Appel2.epreuve).toBeDefined()
				expect(cibleR4Appel2.epreuve?.enjeu_echec).toBe('Il se méfie.')

				// 2. Réplique écrite (même en cas d'échec du jet)
				const sessionFinale = onSessionChange.mock.calls[2][0] as EtatSession
				const entreeAppel2 = sessionFinale.journal.find((e) => e.recit === 'Tu me sembles suspecte.')
				expect(entreeAppel2).toBeDefined()
			})

			it('19. appel 2 échoué → setAvis(echec), jet+XP déjà persistés, pas de réplique', async () => {
				// Scénario : R4 appel 2 échoue (indisponible, contexte, etc.)
				// Résultat : le jet ET l'XP restent persistés, mais pas de réplique écrite
				const propositionParler = {
					lecture: 'commande' as const,
					commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
				}
				const resistanceAppel1 = {
					resiste: {
						carac: 'FO' as const,
						tc: 'TC1' as const,
						enjeu_reussite: 'Il cède.',
						enjeu_echec: 'Il refuse.',
					},
				}
				const echec = { statut: 'indisponible', raison: 'non-configure' } satisfies EchecCopilote

				demanderMock
					.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
					.mockResolvedValueOnce(resistanceAppel1)
					.mockResolvedValueOnce(echec) // R4 appel 2 échoue

				const onSessionChange = jest.fn()
				const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

				await act(async () => {
					await result.current.executeAction('parler pnj-1')
				})

				setXpDuJetMockReturnValue(4) // Créditer XP avant l'appel 2
				await act(async () => {
					await result.current.lancerLeDe()
				})

				// Vérifications :
				// 1. Appel 2 était en vol (R1 + appel 1 + appel 2)
				expect(demanderMock).toHaveBeenCalledTimes(3)

				// 2. Deux persistances seulement : R1 + (jet+XP)
				// Pas de 3e persistance pour la réplique (appel 2 échoué)
				expect(onSessionChange).toHaveBeenCalledTimes(2)

				// 3. La session persistée porte le jet + XP
				const sessionAvecJetXp = onSessionChange.mock.calls[1][0] as EtatSession
				expect(sessionAvecJetXp.journal.some((e) => e.jet !== undefined)).toBe(true)
				expect(sessionAvecJetXp.heros?.xp).toBe(HEROS_TEST.xp + 4)

				// 4. L'avis porte l'échec (bannière d'échec IA affichée)
				expect(result.current.avis).toEqual(echec)

				// 5. Pas de réplique de PNJ dans le journal (appel 2 échoué)
				expect(sessionAvecJetXp.journal.length).toBeGreaterThanOrEqual(2)
				const derniereEntree = sessionAvecJetXp.journal[sessionAvecJetXp.journal.length - 1]
				expect(derniereEntree.recit).toBeUndefined()
			})

			it('20. propositionEncourseRef.kind discrimine lancerLeDe : arbitre vs acteur appel 2', async () => {
				// Vérifier que lancerLeDe aiguille correctement selon l'origine :
				// - R3 arbitre (epreuve sans PNJ) → pas d'appel 2 après jet
				// - R4 acteur appel 2 (epreuve + personnageId) → appel 2 APRÈS jet
				// Le test couvre deux cas : arbitre (R2) et acteur (R4 appel 2)

				// Cas 1 : arbitre (R2) — aucun appel 2 après lancerLeDe
				const propositionAgir = {
					lecture: 'commande' as const,
					commande: { commande: 'agir' as const, cibles: [] as string[] },
				}
				const epreuveArbitre = {
					epreuve: {
						carac: 'FO' as const,
						tc: 'TC1' as const,
						enjeu_reussite: 'franchir',
						enjeu_echec: 'tomber',
					},
				}
				const narrateurReponse: ReponseNarrateur = {
					statut: 'propose',
					proposition: {
						recit: 'Vous agissez.',
						suggestions: [],
						faits_etablis: [],
					},
				}

				demanderMock
					.mockResolvedValueOnce({ statut: 'propose', proposition: propositionAgir })
					.mockResolvedValueOnce({ statut: 'propose', proposition: epreuveArbitre })
					.mockResolvedValueOnce(narrateurReponse) // R3 seulement, pas d'appel 2 arbitre

				const onSessionChange = jest.fn()
				const { result } = monter(SESSION_AVEC_HEROS, onSessionChange)

				await act(async () => {
					await result.current.executeAction('agir')
				})

				await act(async () => {
					await result.current.lancerLeDe()
				})

				// R1 + R2 (arbitre) + R3 (pas d'appel 2 arbitre)
				expect(demanderMock).toHaveBeenCalledTimes(3)

				// Cas 2 : acteur (R4 appel 2) — appel 2 APRÈS lancerLeDe
				jest.resetAllMocks()
				const propositionParler = {
					lecture: 'commande' as const,
					commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
				}
				demanderMock
					.mockResolvedValueOnce({ statut: 'propose', proposition: propositionParler })
					.mockResolvedValueOnce({
						resiste: {
							carac: 'IN' as const,
							tc: 'TC2' as const,
							enjeu_reussite: 'confiance',
							enjeu_echec: 'méfiance',
						},
					})
					.mockResolvedValueOnce({
						replique: 'Je parle.',
						indices_reveles: [],
						delta_confiance: 0 as const,
					})

				const { result: result2 } = monter(SESSION_AVEC_HEROS)

				await act(async () => {
					await result2.current.executeAction('parler pnj-1')
				})

				await act(async () => {
					await result2.current.lancerLeDe()
				})

				// R1 + R4 appel 1 + R4 appel 2 (l'aiguillage du kind)
				expect(demanderMock).toHaveBeenCalledTimes(3)

				// Vérifier que l'appel 2 reçoit un rôle 'acteur' (pas 'narrateur')
				const dernierAppel = demanderMock.mock.calls[2]?.[1]
				expect(dernierAppel?.role).toBe('acteur')
			})
		})
	})

	describe('Garde R2/R3/R4 apres fin (moteur-fins it1, critere 6)', () => {
		const DOSSIER_AVEC_FIN: Dossier = {
			...DOSSIER_TEST,
			charpente: {
				...DOSSIER_TEST.charpente,
				fins: [
					{
						id: 'fin.arrivee',
						nom: 'Arrivee',
						condition_texte: 'Le joueur atteint le lieu 2',
						condition_expr: { op: 'predicat' as const, predicat: 'lieu_visite', cibles: ['lieu_2'] },
						texte: 'Felicitations, vous avez atteint la fin.',
					},
				],
			},
		}

		const DOSSIER_FIN_VIA_JALON: Dossier = {
			...DOSSIER_TEST,
			charpente: {
				...DOSSIER_TEST.charpente,
				jalons: [
					{
						id: 'jalon.depart',
						nom: 'Depart visite',
						enonce_texte: 'Le joueur a visite le depart',
						declencheur_texte: 'Quand le lieu de depart est visite',
						declencheur_expr: {
							op: 'predicat' as const,
							predicat: 'lieu_visite',
							cibles: ['lieu_1'],
						},
						effet: [],
					},
				],
				fins: [
					{
						id: 'fin.jalon',
						nom: 'Fin par jalon',
						condition_texte: 'Quand le jalon depart est atteint',
						condition_expr: {
							op: 'predicat' as const,
							predicat: 'jalon_atteint',
							cibles: ['jalon.depart'],
						},
						texte: 'La partie se termine par un jalon.',
					},
				],
			},
		}

		const SESSION_JALON_PRETE: EtatSession = {
			...SESSION_AVEC_HEROS,
			monde: { ...SESSION_AVEC_HEROS.monde, lieux_visites: ['lieu_1'] },
		}

		it('garde coupe R3 apres fin sur aller — copilote.demander appele une seule fois (R1)', async () => {
			const propositionR1 = {
				lecture: 'commande' as const,
				commande: { commande: 'aller' as const, cibles: ['lieu_2'] },
			}
			demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition: propositionR1 })

			const onSessionChange = jest.fn()
			const { result } = renderHook(() => useTourDeJeu(DOSSIER_AVEC_FIN, SESSION_TEST, onSessionChange))

			await act(async () => {
				await result.current.executeAction('aller lieu_2')
			})

			expect(demanderMock).toHaveBeenCalledTimes(1)
			expect(demanderMock.mock.calls[0][1].role).toBe('interprete')
			expect(onSessionChange).toHaveBeenCalledTimes(1)
		})

		it('garde coupe R2 apres fin sur agir avec heros — copilote.demander appele une seule fois (R1)', async () => {
			const propositionR1 = {
				lecture: 'commande' as const,
				commande: { commande: 'agir' as const, cibles: [] },
			}
			demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition: propositionR1 })

			const onSessionChange = jest.fn()
			const { result } = renderHook(() => useTourDeJeu(DOSSIER_FIN_VIA_JALON, SESSION_JALON_PRETE, onSessionChange))

			await act(async () => {
				await result.current.executeAction('agir')
			})

			expect(demanderMock).toHaveBeenCalledTimes(1)
			expect(demanderMock.mock.calls[0][1].role).toBe('interprete')
			expect(onSessionChange).toHaveBeenCalledTimes(1)
		})

		it('garde coupe R4 apres fin sur parler — copilote.demander appele une seule fois (R1)', async () => {
			const propositionR1 = {
				lecture: 'commande' as const,
				commande: { commande: 'parler' as const, cibles: ['pnj-1'] },
			}
			demanderMock.mockResolvedValueOnce({ statut: 'propose', proposition: propositionR1 })

			const onSessionChange = jest.fn()
			const { result } = renderHook(() => useTourDeJeu(DOSSIER_FIN_VIA_JALON, SESSION_JALON_PRETE, onSessionChange))

			await act(async () => {
				await result.current.executeAction('parler pnj-1')
			})

			expect(demanderMock).toHaveBeenCalledTimes(1)
			expect(demanderMock.mock.calls[0][1].role).toBe('interprete')
			expect(onSessionChange).toHaveBeenCalledTimes(1)
		})
	})
})
