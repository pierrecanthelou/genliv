import fs from 'fs'
import path from 'path'
import { projeterAssaut } from './combatProjection'
import type { CombatState } from '../../../player/engine/combatTypes'

function buildState(overrides: Partial<CombatState> = {}): CombatState {
	return {
		monster: {
			name: 'Gobelin',
			pvMax: 20,
			pv: 7,
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
		heroPv: 13,
		heroPe: 6,
		heroArmorDegradation: 0,
		heroPvAtStart: 17,
		round: 3,
		consecutiveDefWins: { hero: 0, monster: 0 },
		gardeBonus: { hero: 0, monster: 0 },
		log: [{ round: 3, text: 'sentinelle-log' }],
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
			round: 3,
			vainqueur: 'heros',
			qualite: 'magistral',
		},
		...overrides,
	}
}

describe('projeterAssaut', () => {
	it('returns null if no dernierAssaut', () => {
		const etat = buildState({ dernierAssaut: undefined })
		expect(projeterAssaut(etat, 17, 'bestiaire.gobelin')).toBeNull()
	})

	it('projette un round ongoing avec toutes les valeurs exactes', () => {
		const etat = buildState()
		const projection = projeterAssaut(etat, 25, 'bestiaire.orque-chef')
		expect(projection).toEqual({
			vainqueur: 'heros',
			qualite: 'magistral',
			monstre: 'bestiaire.orque-chef',
			heroPv: 13,
			heroPvMax: 25,
			monstrePv: 7,
			monstrePvMax: 20,
			issue: undefined,
		})
	})

	it('issue hero-victory', () => {
		const etat = buildState({
			outcome: 'hero-victory',
			monster: { ...buildState().monster, pv: 0 },
			dernierAssaut: { round: 5, vainqueur: 'heros', qualite: 'critique' },
		})
		const p = projeterAssaut(etat, 17, 'bestiaire.gobelin')!
		expect(p.issue).toBe('hero-victory')
		expect(p.monstrePv).toBe(0)
		expect(p.qualite).toBe('critique')
	})

	it('issue monster-fled', () => {
		const etat = buildState({ outcome: 'monster-fled' })
		expect(projeterAssaut(etat, 17, 'bestiaire.gobelin')!.issue).toBe('monster-fled')
	})

	it('issue hero-survived-unconscious', () => {
		const etat = buildState({ outcome: 'hero-survived-unconscious', heroPv: 0 })
		const p = projeterAssaut(etat, 17, 'bestiaire.gobelin')!
		expect(p.issue).toBe('hero-survived-unconscious')
		expect(p.heroPv).toBe(0)
	})

	it('issue hero-mort', () => {
		const etat = buildState({ outcome: 'hero-mort', heroPv: -2 })
		expect(projeterAssaut(etat, 17, 'bestiaire.gobelin')!.issue).toBe('hero-mort')
	})

	it('issue undefined pour hero-fled (jamais projete)', () => {
		const etat = buildState({ outcome: 'hero-fled' })
		expect(projeterAssaut(etat, 17, 'bestiaire.gobelin')!.issue).toBeUndefined()
	})

	it('issue undefined pour ongoing', () => {
		const etat = buildState({ outcome: 'ongoing' })
		expect(projeterAssaut(etat, 17, 'bestiaire.gobelin')!.issue).toBeUndefined()
	})

	it('sentinelle log absente de la projection', () => {
		const etat = buildState()
		const json = JSON.stringify(projeterAssaut(etat, 17, 'bestiaire.gobelin'))
		expect(json).not.toContain('sentinelle-log')
	})

	it('source ne reference ni .log ni .text de CombatState (sonde source)', () => {
		const src = fs.readFileSync(path.join(__dirname, 'combatProjection.ts'), 'utf8')
		expect(src).not.toMatch(/etat\.log/)
		expect(src).not.toMatch(/etat\.text/)
		expect(src).not.toMatch(/\.log\[/)
	})
})
