import { renderHook, act, waitFor } from '@testing-library/react'
import { useCommentaireCombat } from './useCommentaireCombat'
import type { Dossier } from '../../../brain/dossier/types'
import type { CombatState } from '../../../player/engine/combatTypes'
import { useBrain } from '../../../brain'

jest.mock('../../../brain', () => ({
	useBrain: jest.fn(),
}))

const mockUseBrain = useBrain as jest.MockedFunction<typeof useBrain>

const mockDossier: Dossier = {
	schema: 1,
	id: 'dossier-test',
	titre: 'Test Dossier',
	createdAt: '2024-01-01',
	updatedAt: '2024-01-01',
	canon: {
		mj: { synopsis_mj: 'Test' },
		partage: { accroche_joueur: 'Test' },
		ton: 'tutoyant',
		interdits_ton: [],
		objectifs: [],
	},
	monde: {
		lieux: [],
		personnages: [],
		objets: [],
		indices: [],
		quetes: [],
		evenements: [],
		conditions: { climat: [] },
	},
	charpente: {
		depart: { lieu_id: 'lieu-1', texte_ouverture_joueur: 'Start' },
		jalons: [],
		fins: [],
	},
}

const mockCombatState: CombatState = {
	monster: {
		name: 'Gobelin',
		pvMax: 10,
		pv: 5,
		peMax: 5,
		pe: 5,
		FO: 4,
		EN: 5,
		mc: 3,
		armour: 0,
		armourDegradation: 0,
		weaponMultiplier: 0.8,
		creatureType: 'humanoide',
		capacityId: 'aucune',
		bypassedBySilver: false,
		immuneToFatigue: false,
		tier: 1,
		victoryTarget: null,
		fleeTarget: null,
		loot: null,
	},
	heroPv: 15,
	heroPe: 6,
	heroArmorDegradation: 0,
	heroPvAtStart: 17,
	round: 1,
	consecutiveDefWins: { hero: 0, monster: 0 },
	gardeBonus: { hero: 0, monster: 0 },
	log: [],
	phase: 'resolved',
	outcome: 'ongoing',
	bestHeroHit: 'franc',
	pendingXp: 0,
	pendingLoot: null,
	effects: {
		poisonRoundsLeft: 0,
		poisonDmgPerRound: 0,
		renversementMalus: 0,
		seismeStunned: false,
		disarmedThisRound: false,
		fureurUsed: false,
		zombieRevived: false,
		etreinte: 0,
		piquesUsed: false,
		soinsBloques: false,
	},
	pendingEnMaxDelta: 0,
	pendingPvMaxDelta: 0,
	pendingVol: false,
	dernierAssaut: {
		round: 1,
		vainqueur: 'heros',
		qualite: 'franc',
	},
}

describe('useCommentaireCombat', () => {
	let mockDemander: jest.Mock

	beforeEach(() => {
		jest.clearAllMocks()
		mockDemander = jest.fn().mockResolvedValue({ narration: 'Le gobelin recule.' })
		mockUseBrain.mockReturnValue({
			copilote: { estDisponible: () => true, demander: mockDemander },
		} as unknown as ReturnType<typeof useBrain>)
	})

	it('idempotent : double appel meme round = un seul fetch', async () => {
		const { result } = renderHook(() => useCommentaireCombat(mockDossier))

		await act(async () => {
			result.current.commenter(mockCombatState, 17, 'bestiaire.gobelin')
			result.current.commenter(mockCombatState, 17, 'bestiaire.gobelin')
		})

		await waitFor(() => {
			expect(mockDemander).toHaveBeenCalledTimes(1)
		})
	})

	it('etat attente pendant l appel en vol', async () => {
		let resolvePromise: (v: { narration: string }) => void
		mockDemander.mockReturnValue(new Promise((r) => (resolvePromise = r)))

		const { result } = renderHook(() => useCommentaireCombat(mockDossier))

		act(() => {
			result.current.commenter(mockCombatState, 17, 'bestiaire.gobelin')
		})

		expect(result.current.commentaires.get(1)).toEqual({ etat: 'attente' })

		await act(async () => {
			resolvePromise!({ narration: 'Le gobelin recule.' })
		})

		expect(result.current.commentaires.get(1)).toEqual({
			etat: 'recu',
			narration: 'Le gobelin recule.',
		})
	})

	it('etat recu apres succes', async () => {
		const { result } = renderHook(() => useCommentaireCombat(mockDossier))

		await act(async () => {
			result.current.commenter(mockCombatState, 17, 'bestiaire.gobelin')
		})

		await waitFor(() => {
			expect(result.current.commentaires.get(1)).toEqual({
				etat: 'recu',
				narration: 'Le gobelin recule.',
			})
		})
	})

	it('silence sur erreur de validation : attente puis retrait', async () => {
		let resolvePromise: (v: unknown) => void
		mockDemander.mockReturnValue(new Promise((r) => (resolvePromise = r)))

		const { result } = renderHook(() => useCommentaireCombat(mockDossier))

		act(() => {
			result.current.commenter(mockCombatState, 17, 'bestiaire.gobelin')
		})

		expect(mockDemander).toHaveBeenCalledTimes(1)
		expect(result.current.commentaires.get(1)).toEqual({ etat: 'attente' })

		await act(async () => {
			resolvePromise!({ statut: 'refuse', motif: 'cible-a-ecrire' })
		})

		expect(result.current.commentaires.get(1)).toBeUndefined()
	})

	it('silence sur erreur reseau : attente puis retrait', async () => {
		let rejectPromise: (e: Error) => void
		mockDemander.mockReturnValue(new Promise((_r, rej) => (rejectPromise = rej)))

		const { result } = renderHook(() => useCommentaireCombat(mockDossier))

		act(() => {
			result.current.commenter(mockCombatState, 17, 'bestiaire.gobelin')
		})

		expect(mockDemander).toHaveBeenCalledTimes(1)
		expect(result.current.commentaires.get(1)).toEqual({ etat: 'attente' })

		await act(async () => {
			rejectPromise!(new Error('Network error'))
		})

		expect(result.current.commentaires.get(1)).toBeUndefined()
	})

	it('avorte les requetes au demontage et le signal est aborted', async () => {
		let capturedSignal: AbortSignal | undefined
		mockDemander.mockImplementation((_d: unknown, _c: unknown, signal: AbortSignal) => {
			capturedSignal = signal
			return new Promise(() => {})
		})

		const { result, unmount } = renderHook(() => useCommentaireCombat(mockDossier))

		act(() => {
			result.current.commenter(mockCombatState, 17, 'bestiaire.gobelin')
		})

		expect(capturedSignal).toBeDefined()
		expect(capturedSignal!.aborted).toBe(false)

		unmount()

		expect(capturedSignal!.aborted).toBe(true)
	})

	it('ne pose pas attente si la projection est nulle (pas de dernierAssaut)', async () => {
		const etatSansAssaut = { ...mockCombatState, dernierAssaut: undefined }

		const { result } = renderHook(() => useCommentaireCombat(mockDossier))

		act(() => {
			result.current.commenter(etatSansAssaut, 17, 'bestiaire.gobelin')
		})

		expect(result.current.commentaires.size).toBe(0)
		expect(mockDemander).not.toHaveBeenCalled()
	})
})
