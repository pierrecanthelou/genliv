import { act, renderHook } from '@testing-library/react'
import type { Dossier, EtatSession, SortieInterprete, SortieNarrateur, ReponseNarrateur } from '../../../brain'
import { apresInterpretation } from '../../../brain'
import { COMMANDES } from '../../../brain/dossier/commandes'
import { useTourDeJeu } from './useTourDeJeu'

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

/** Dossier minimal avec un accès `aller` de `lieu_1` à `lieu_2`. */
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
		personnages: [],
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
			jest.resetAllMocks()
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
			// `UseTourDeJeuResult` INCHANGÉ : les faits ne passent JAMAIS par l'état du hook.
			expect(Object.keys(result.current).sort()).toEqual(
				['avis', 'executeAction', 'getGestelabel', 'isLocked', 'issueNarrateur', 'pasEnCours'].sort(),
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
	})
})
