import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EcranCombat } from './EcranCombat'
import type { CombatState, CombatOutcome } from '../../../player/engine/combatTypes'

describe('EcranCombat', () => {
	const createMinimalMockState = (outcome: CombatOutcome = 'ongoing'): CombatState => ({
		monster: {
			name: 'Test',
			pvMax: 20,
			pv: 15,
			peMax: 10,
			pe: 8,
			FO: 2,
			EN: 2,
			mc: 0,
			armour: 0,
			armourDegradation: 0,
			weaponMultiplier: 1,
			creatureType: null,
			capacityId: 'aucune',
			bypassedBySilver: false,
			immuneToFatigue: false,
			tier: 1,
			victoryTarget: null,
			fleeTarget: null,
			loot: null,
		},
		heroPv: 10,
		heroPe: 8,
		heroArmorDegradation: 0,
		heroPvAtStart: 10,
		round: 1,
		consecutiveDefWins: { hero: 0, monster: 0 },
		gardeBonus: { hero: 0, monster: 0 },
		log: [],
		phase: 'choosing',
		outcome,
		bestHeroHit: 'rate',
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
	})

	it('affiche le titre COMBAT', () => {
		const etat = createMinimalMockState()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} />)
		expect(screen.getByText('COMBAT')).toBeInTheDocument()
	})

	it('affiche le placeholder du journal quand vide', () => {
		const etat = createMinimalMockState()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} />)
		expect(screen.getByText(/Le combat commence/)).toBeInTheDocument()
	})

	it("affiche badge VICTOIRE à l'issue terminale", () => {
		const etat = createMinimalMockState('hero-victory')
		render(<EcranCombat etat={etat} onJouer={jest.fn()} />)
		expect(screen.getByText('VICTOIRE')).toBeInTheDocument()
	})

	it('affiche badge DÉFAITE et masque boutons sur hero-mort', () => {
		const etat = createMinimalMockState('hero-mort')
		render(<EcranCombat etat={etat} onJouer={jest.fn()} />)
		expect(screen.getByText('DÉFAITE')).toBeInTheDocument()
		expect(screen.getByText(/PARTIE TERMINÉE/)).toBeInTheDocument()
	})

	it('appelle onJouer avec la posture selectionnee au clic sur Jouer le round', async () => {
		const user = userEvent.setup()
		const etat = createMinimalMockState()
		const onJouer = jest.fn()
		render(<EcranCombat etat={etat} onJouer={onJouer} />)
		await user.click(screen.getByRole('radio', { name: 'Précise' }))
		await user.click(screen.getByRole('button', { name: /Jouer le round/ }))
		expect(onJouer).toHaveBeenCalledWith('precise')
	})

	it('appelle onClore au clic sur Continuer en fin de combat non mortel', async () => {
		const user = userEvent.setup()
		const etat = createMinimalMockState('hero-victory')
		const onClore = jest.fn()
		render(<EcranCombat etat={etat} onJouer={jest.fn()} onClore={onClore} />)
		await user.click(screen.getByRole('button', { name: /Continuer/ }))
		expect(onClore).toHaveBeenCalledTimes(1)
	})

	it('aucun bouton Continuer sur hero-mort', () => {
		const etat = createMinimalMockState('hero-mort')
		render(<EcranCombat etat={etat} onJouer={jest.fn()} />)
		expect(screen.queryByRole('button', { name: /Continuer/ })).not.toBeInTheDocument()
	})

	it('affiche les entetes ROUND pour chaque ligne du journal', () => {
		const etat = {
			...createMinimalMockState(),
			log: [
				{ round: 1, text: 'Le gobelin attaque' },
				{ round: 2, text: 'Riposte du heros' },
			],
		}
		render(<EcranCombat etat={etat} onJouer={jest.fn()} />)
		expect(screen.getByText('ROUND 1')).toBeInTheDocument()
		expect(screen.getByText('ROUND 2')).toBeInTheDocument()
	})
})
