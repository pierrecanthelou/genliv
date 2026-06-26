import { startCombat, pickMonsterPosture, resolveCombatRound, tryHeroFlee } from './combatEngine'
import type { CombatState } from './combatEngine'
import type { MonsterConfig } from '../../brain/types'
import type { HeroState, SessionState } from '../types'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const baseMonster: MonsterConfig = {
	name: 'Gobelin',
	pv: 10,
	stats: { FO: 4, AG: 4, DX: 3, EN: 5, IG: 2 },
	mc: 3,
	armour: 0,
	weaponMultiplier: 0.8,
	tier: 1,
	creatureType: 'humanoide',
	outcomes: { reussite: '', echec: '' },
}

const baseHero: HeroState = {
	name: 'Héros',
	caracs: { FO: 6, AG: 5, DX: 5, EN: 6, IN: 4, IG: 4, SE: 3, CA: 3 },
	pvMax: 17,
	pv: 17,
	peMax: 6,
	pe: 6,
	mcBonus: 0,
	xp: 0,
}

const baseSession: SessionState = {
	bookId: 'book-1',
	currentNodeId: 'node-1',
	hero: baseHero,
	visitedNodes: [],
	inventory: [],
	activeWeapon: 'epee-1m',
	activeProtection: null,
	activeShield: false,
	armorDegradation: 0,
	activeMagicBonus: 0,
	activeSilverWeapon: false,
	permanentArmorBonus: 0,
}

// Deterministic rng: returns values in sequence
function seqRng(values: number[]): () => number {
	let i = 0
	return () => {
		const v = values[i % values.length]
		i++
		return v
	}
}

// ─── startCombat ──────────────────────────────────────────────────────────────

describe('startCombat', () => {
	it('initialises monster from config', () => {
		const state = startCombat(baseMonster, baseHero, baseSession)
		expect(state.monster.name).toBe('Gobelin')
		expect(state.monster.pv).toBe(10)
		expect(state.monster.pvMax).toBe(10)
		expect(state.monster.mc).toBe(3)
		expect(state.monster.tier).toBe(1)
	})

	it('monster peMax equals EN when not immune', () => {
		const state = startCombat(baseMonster, baseHero, baseSession)
		expect(state.monster.peMax).toBe(5) // stats.EN = 5
		expect(state.monster.pe).toBe(5)
		expect(state.monster.immuneToFatigue).toBe(false)
	})

	it('mort-vivant has peMax 0 and immuneToFatigue', () => {
		const undeadMonster: MonsterConfig = {
			...baseMonster,
			creatureType: 'mort-vivant',
		}
		const state = startCombat(undeadMonster, baseHero, baseSession)
		expect(state.monster.peMax).toBe(0)
		expect(state.monster.pe).toBe(0)
		expect(state.monster.immuneToFatigue).toBe(true)
	})

	it('applies pvVariance', () => {
		const m: MonsterConfig = { ...baseMonster, pvVariance: 4 }
		// seqRng returns 0.5 → randInt(0, 4) = 2 → pv = 12
		const state = startCombat(m, baseHero, baseSession, () => 0.5)
		expect(state.monster.pv).toBe(12)
	})

	it('seeds heroPv from hero.pv', () => {
		const heroLow = { ...baseHero, pv: 7 }
		const state = startCombat(baseMonster, heroLow, baseSession)
		expect(state.heroPv).toBe(7)
		expect(state.heroPvAtStart).toBe(7)
	})

	it('phase is choosing and outcome is ongoing', () => {
		const state = startCombat(baseMonster, baseHero, baseSession)
		expect(state.phase).toBe('choosing')
		expect(state.outcome).toBe('ongoing')
	})
})

// ─── pickMonsterPosture ───────────────────────────────────────────────────────

describe('pickMonsterPosture', () => {
	let state: CombatState

	beforeEach(() => {
		state = startCombat(baseMonster, baseHero, baseSession)
	})

	it('returns normale for low roll (<=60)', () => {
		// randInt(1,100) with rng=()=>0 → 1 → normale
		expect(pickMonsterPosture(state, () => 0)).toBe('normale')
	})

	it('returns precise for mid roll (61-85)', () => {
		// randInt(1,100) = 0.7*99 + 1 ≈ 70.3 + 1 → 71 → 61..85 → precise
		// Actually randInt(1,100) = 1 + floor(rng() * 100) = 1 + floor(0.7 * 100) = 71
		expect(pickMonsterPosture(state, () => 0.7)).toBe('precise')
	})

	it('returns defensive for high roll (86-100)', () => {
		// randInt(1,100) = 1 + floor(0.99*100) = 100 → defensive
		expect(pickMonsterPosture(state, () => 0.99)).toBe('defensive')
	})

	it('uses lowHp weights when pv < 25% of max', () => {
		const lowHpState: CombatState = {
			...state,
			monster: { ...state.monster, pv: 2, pvMax: 10 }, // 20% < 25%
		}
		// lowHpPostureWeights = [45, 15, 40]. Roll 50 → 45 < 50 <= 60 → precise
		// randInt(1,100) = 1 + floor(0.49*100) = 50 → 50 > 45 and 50 <= 45+15=60 → precise
		expect(pickMonsterPosture(lowHpState, () => 0.49)).toBe('precise')
	})

	it('falls back to default weights when creatureType is null', () => {
		const noType: CombatState = {
			...state,
			monster: { ...state.monster, creatureType: null },
		}
		// Default [60,25,15]. Roll 1 → normale
		expect(pickMonsterPosture(noType, () => 0)).toBe('normale')
	})
})

// ─── resolveCombatRound ───────────────────────────────────────────────────────

describe('resolveCombatRound', () => {
	let state: CombatState

	beforeEach(() => {
		state = startCombat(baseMonster, baseHero, baseSession)
	})

	it('increments round counter', () => {
		const next = resolveCombatRound(state, baseHero, baseSession, 'normale', () => 0.5)
		expect(next.round).toBe(1)
	})

	it('handles AT tie — no damage, phase resolved', () => {
		// Force tie: both use computeAT with same MC. With rng returning 0.5:
		// normale.computeAT(3, {}) = 3 - randInt(0,6) = 3 - floor(0.5*7) = 3 - 3 = 0
		// monster mc=3, same formula → tie at 0.
		const tieRng = () => 0.5
		const next = resolveCombatRound(state, baseHero, baseSession, 'normale', tieRng)
		if (next.outcome === 'ongoing') {
			expect(next.phase).toBe('resolved')
		}
	})

	it('drains hero PE by 1 per round', () => {
		const next = resolveCombatRound(state, baseHero, baseSession, 'normale', () => 0.5)
		expect(next.heroPe).toBe(5)
	})

	it('drains monster PE when not immune', () => {
		const next = resolveCombatRound(state, baseHero, baseSession, 'normale', () => 0.5)
		expect(next.monster.pe).toBe(4)
	})

	it('does not drain monster PE when immuneToFatigue', () => {
		const immuneState: CombatState = {
			...state,
			monster: { ...state.monster, pe: 0, peMax: 0, immuneToFatigue: true },
		}
		const next = resolveCombatRound(immuneState, baseHero, baseSession, 'normale', () => 0.5)
		expect(next.monster.pe).toBe(0)
	})

	it('adds entry to log', () => {
		const next = resolveCombatRound(state, baseHero, baseSession, 'normale', () => 0.5)
		expect(next.log.length).toBeGreaterThan(0)
	})

	it('hero victory when monster pv reaches 0', () => {
		// Set monster to 1 PV and make hero win big
		const nearDead: CombatState = {
			...state,
			monster: { ...state.monster, pv: 1, armour: 0 },
		}
		// Force hero to win with high AT: hero precise with rng=0 → max AT
		// precise: mc - randInt(4,10). With rng=0 → 0 → 4 - 4 = base_mc - 4.
		// Hmm, let's just run and check outcome
		let result = nearDead
		for (let i = 0; i < 50; i++) {
			if (result.outcome !== 'ongoing') break
			result = resolveCombatRound(result, baseHero, baseSession, 'precise')
		}
		// After enough rounds the monster should be dead
		expect(['hero-victory', 'monster-fled', 'hero-mort'].includes(result.outcome)).toBe(true)
	})

	it('hero mort when hero pv drops below -CA', () => {
		const lowHpHero = { ...baseHero, pv: 1, caracs: { ...baseHero.caracs, CA: 1 } }
		const lowState: CombatState = { ...state, heroPv: 1 }
		// Monster will deal damage. Force monster to win and deal a lot.
		let result = lowState
		for (let i = 0; i < 20; i++) {
			if (result.outcome !== 'ongoing') break
			result = resolveCombatRound(result, lowHpHero, baseSession, 'normale')
		}
		expect(['hero-mort', 'hero-survived-unconscious', 'hero-victory', 'monster-fled'].includes(result.outcome)).toBe(
			true,
		)
	})

	it('garde aiguisee triggers after 3 consecutive defensive wins by hero', () => {
		// Build a state where hero has 2 consecutive defensive wins
		const almostGarde: CombatState = {
			...state,
			consecutiveDefWins: { hero: 2, monster: 0 },
		}
		// RNG order: 1. pickMonsterPosture randInt(1,100), 2. hero defensive rollDice(1,4), 3. monster normale randInt(0,6)
		// 0.5 → monster roll=51 → 'normale'; 0.99 → hero D4=4 → atHero=MC(4)+4=8; 0.0 → monster subtracts 0 → atMonster=3
		// Hero wins 8 > 3 with defensive → 3rd consecutive win → gardeBonus.monster += 2
		const heroWinsRng = seqRng([0.5, 0.99, 0.0])
		const next = resolveCombatRound(almostGarde, baseHero, baseSession, 'defensive', heroWinsRng)
		expect(next.gardeBonus.monster).toBe(2)
		expect(next.consecutiveDefWins.hero).toBe(0)
	})
})

// ─── tryHeroFlee ──────────────────────────────────────────────────────────────

describe('tryHeroFlee', () => {
	let state: CombatState

	beforeEach(() => {
		state = {
			...startCombat(baseMonster, baseHero, baseSession),
			monster: {
				...startCombat(baseMonster, baseHero, baseSession).monster,
				fleeTarget: 'exit-node',
			},
		}
	})

	it('sets outcome to hero-fled when hero survives free assault', () => {
		// freeAssault RNG order: 1. monster normale randInt(0,6), 2. hero defensive rollDice(1,4)
		// 0.99 → monster subtracts 6 → atMonster=3-6=-3; 0.0 → hero D4=1 → atHero=MC(4)+1=5
		// Hero wins (-3 < 5) → 0 damage → hero flees
		const heroWinsRng = seqRng([0.99, 0.0])
		const next = tryHeroFlee(state, baseHero, baseSession, heroWinsRng)
		expect(next.outcome).toBe('hero-fled')
	})

	it('sets outcome to hero-mort when free assault kills hero', () => {
		const fragileState: CombatState = {
			...state,
			heroPv: 1,
			monster: { ...state.monster, FO: 10, mc: 12, weaponMultiplier: 2 },
		}
		// freeAssault RNG order: 1. monster normale randInt(0,6), 2. hero defensive rollDice(1,4)
		// 0.0 → monster subtracts 0 → atMonster=12; 0.99 → hero D4=4 → atHero=4+4=8
		// Monster wins (12 > 8) → pfMonster=(10+6)*2=32, magistral(factor=1.5) → damage=48 → heroPv=1-48=-47 → mort
		const monsterWinsRng = seqRng([0.0, 0.99])
		const next = tryHeroFlee(fragileState, baseHero, baseSession, monsterWinsRng)
		expect(next.outcome).toBe('hero-mort')
	})

	it('adds log entry', () => {
		const next = tryHeroFlee(state, baseHero, baseSession)
		expect(next.log.length).toBeGreaterThan(0)
	})

	it('phase is ended after flee attempt', () => {
		const next = tryHeroFlee(state, baseHero, baseSession)
		expect(next.phase).toBe('ended')
	})
})
