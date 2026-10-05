import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { CombatEnCours } from './CombatEnCours'
import type { Dossier } from '../../../brain/dossier/types'
import type { CombatState } from '../../../player/engine/combatTypes'
import type { EtatSession } from '../../../brain/dossier/session'
import { useBrain } from '../../../brain'
import { rejouerCombat } from '../../../player/engine/rencontre'

jest.mock('../../../brain', () => ({
	useBrain: jest.fn(),
}))

jest.mock('../../../player/engine/rencontre', () => ({
	rejouerCombat: jest.fn(),
}))

interface MockEcranCombatProps {
	etat: CombatState
	onJouer: (posture: string) => void
	onFuir: () => void
	commentaires?: ReadonlyMap<number, unknown>
}

jest.mock('./EcranCombat', () => ({
	EcranCombat: ({ etat, onJouer, onFuir, commentaires }: MockEcranCombatProps) => (
		<div>
			<div data-testid="combat-state">Round {etat.round}</div>
			<div data-testid="commentaires-count">{commentaires?.size ?? 0}</div>
			<div data-testid="commentaires-keys">{commentaires ? Array.from(commentaires.keys()).join(',') : ''}</div>
			<button onClick={() => onJouer('normale')}>Play</button>
			<button onClick={() => onFuir()}>Fuir</button>
		</div>
	),
}))

const mockUseBrain = useBrain as jest.MockedFunction<typeof useBrain>
const mockRejouerCombat = rejouerCombat as jest.MockedFunction<typeof rejouerCombat>

const mockDossier: Dossier = {
	schema: 1,
	id: 'dossier-test',
	titre: 'Test',
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

const mockSession = {
	schema: 1,
	dossier_id: 'dossier-test',
	dossier_maj: '2024-01-01',
	graine_alea: 12345,
	horloge: { tour: 1 },
	monde: {
		lieux: [],
		personnages: [],
		objets: [],
		indices: [],
		quetes: [],
		evenements: [],
		conditions: { climat: [] },
	},
	journal: [],
	memoire: null,
	combat: {
		monstre_ref: 'bestiaire.gobelin',
		postures: [],
	},
	heros: {
		name: 'Heros',
		caracs: { FO: 6, AG: 5, DX: 5, EN: 6, IN: 4, IG: 4, SE: 3, CA: 3 },
		pvMax: 17,
		pv: 15,
		peMax: 6,
		pe: 6,
		mcBonus: 0,
		xp: 0,
	},
} as unknown as EtatSession

const nextSession = {
	...mockSession,
	combat: { monstre_ref: 'bestiaire.gobelin', postures: ['normale'] },
} as unknown as EtatSession

describe('CombatEnCours', () => {
	let mockDemander: jest.Mock

	beforeEach(() => {
		mockDemander = jest.fn().mockResolvedValue({ narration: 'Le gobelin recule.' })
		mockUseBrain.mockReturnValue({
			copilote: { estDisponible: () => true, demander: mockDemander },
		} as unknown as ReturnType<typeof useBrain>)
		mockRejouerCombat.mockReturnValue({
			ok: true as const,
			etat: mockCombatState,
		})
	})

	afterEach(() => jest.restoreAllMocks())

	it('rend EcranCombat avec une map de commentaires vide', () => {
		const onJouer = jest.fn().mockReturnValue(mockSession)
		render(
			<CombatEnCours
				dossier={mockDossier}
				session={mockSession}
				etat={mockCombatState}
				onJouer={onJouer}
				onFuir={jest.fn()}
			/>,
		)
		expect(screen.getByTestId('commentaires-count')).toHaveTextContent('0')
	})

	it('appelle onJouer et demande un commentaire R5 depuis le rejeu (pas l etat initial)', async () => {
		const etatSansAssaut = { ...mockCombatState, dernierAssaut: undefined, heroPv: 15 }
		const rejeuState: CombatState = {
			...mockCombatState,
			heroPv: 8,
			round: 2,
			dernierAssaut: { round: 2, vainqueur: 'monstre' as const, qualite: 'franc' as const },
		}
		mockRejouerCombat.mockReturnValue({ ok: true as const, etat: rejeuState })
		const onJouer = jest.fn().mockReturnValue(nextSession)

		render(
			<CombatEnCours
				dossier={mockDossier}
				session={mockSession}
				etat={etatSansAssaut}
				onJouer={onJouer}
				onFuir={jest.fn()}
			/>,
		)

		await act(async () => {
			fireEvent.click(screen.getByText('Play'))
		})

		expect(onJouer).toHaveBeenCalledWith('normale')
		expect(mockRejouerCombat).toHaveBeenCalledWith(nextSession)
		expect(mockDemander).toHaveBeenCalledWith(
			mockDossier,
			{
				role: 'commentateur',
				projection: {
					vainqueur: 'monstre',
					qualite: 'franc',
					monstre: 'bestiaire.gobelin',
					heroPv: 8,
					heroPvMax: 17,
					monstrePv: 5,
					monstrePvMax: 10,
					issue: undefined,
				},
			},
			expect.any(AbortSignal),
		)

		await waitFor(() => {
			expect(screen.getByTestId('commentaires-keys')).toHaveTextContent('2')
		})
	})

	it('ne demande pas de commentaire si la session ne change pas', async () => {
		const onJouer = jest.fn().mockReturnValue(mockSession)
		render(
			<CombatEnCours
				dossier={mockDossier}
				session={mockSession}
				etat={mockCombatState}
				onJouer={onJouer}
				onFuir={jest.fn()}
			/>,
		)

		await act(async () => {
			fireEvent.click(screen.getByText('Play'))
		})

		expect(mockDemander).not.toHaveBeenCalled()
	})

	it('ne demande pas de commentaire sur fuite (KR-297)', async () => {
		const onFuir = jest.fn()
		render(
			<CombatEnCours
				dossier={mockDossier}
				session={mockSession}
				etat={mockCombatState}
				onJouer={jest.fn().mockReturnValue(mockSession)}
				onFuir={onFuir}
			/>,
		)

		await act(async () => {
			fireEvent.click(screen.getByText('Fuir'))
		})

		expect(onFuir).toHaveBeenCalled()
		expect(mockDemander).not.toHaveBeenCalled()
	})

	it('avorte les requetes au demontage', async () => {
		const onJouer = jest.fn().mockReturnValue(nextSession)
		const { unmount } = render(
			<CombatEnCours
				dossier={mockDossier}
				session={mockSession}
				etat={mockCombatState}
				onJouer={onJouer}
				onFuir={jest.fn()}
			/>,
		)

		let capturedSignal: AbortSignal | undefined
		mockDemander.mockImplementation((_d: unknown, _c: unknown, signal: AbortSignal) => {
			capturedSignal = signal
			return new Promise(() => {})
		})

		await act(async () => {
			fireEvent.click(screen.getByText('Play'))
		})

		unmount()
		expect(capturedSignal?.aborted).toBe(true)
	})
})
