/**
 * CAPACITY HOOKS — targeted tests for key behaviours.
 * Full combat integration is tested via combatEngine.test.ts.
 */
import { CAPACITY_HOOKS } from './capacityEffects'
import type { CombatState } from './combatTypes'
import { defaultEffectsState } from './combatTypes'
import type { HeroState, SessionState } from '../types'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

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
	bookId: 'b1',
	currentNodeId: 'n1',
	hero: baseHero,
	visitedNodes: [],
	inventory: ['obj1', 'obj2'],
	activeWeapon: 'epee-1m',
	activeProtection: null,
	activeShield: false,
	armorDegradation: 0,
	activeMagicBonus: 0,
	activeSilverWeapon: false,
}

const fakeMonster = {
	name: 'Test',
	pvMax: 20,
	pv: 10,
	peMax: 5,
	pe: 5,
	FO: 4,
	EN: 5,
	mc: 3,
	armour: 0,
	armourDegradation: 0,
	weaponMultiplier: 1,
	creatureType: null,
	capacityId: 'aucune' as const,
	bypassedBySilver: false,
	immuneToFatigue: false,
	tier: 1 as const,
	victoryTarget: null,
	fleeTarget: null,
	loot: null,
}

function makeState(overrides: Partial<CombatState> = {}): CombatState {
	return {
		monster: fakeMonster,
		heroPv: 10,
		heroPe: 6,
		heroArmorDegradation: 0,
		heroPvAtStart: 10,
		round: 1,
		consecutiveDefWins: { hero: 0, monster: 0 },
		gardeBonus: { hero: 0, monster: 0 },
		log: [],
		phase: 'resolved',
		outcome: 'ongoing',
		bestHeroHit: 'rate',
		pendingXp: 0,
		pendingLoot: null,
		effects: defaultEffectsState(),
		pendingEnMaxDelta: 0,
		pendingPvMaxDelta: 0,
		pendingVol: false,
		...overrides,
	}
}

function seqRng(values: number[]): () => number {
	let i = 0
	return () => values[i++ % values.length]
}

// ─── aucune ───────────────────────────────────────────────────────────────────

describe('aucune', () => {
	it('has no hooks', () => {
		const hooks = CAPACITY_HOOKS['aucune']
		expect(hooks.onHeroWon).toBeUndefined()
		expect(hooks.onMonsterWon).toBeUndefined()
		expect(hooks.onAfterRound).toBeUndefined()
	})
})

// ─── maladie ──────────────────────────────────────────────────────────────────

describe('maladie', () => {
	const hook = CAPACITY_HOOKS['maladie'].onHeroWon!

	it('no mutation when ecart <= 4', () => {
		const state = makeState()
		const next = hook(state, baseHero, baseSession, Math.random, 4)
		expect(next.pendingEnMaxDelta).toBe(0)
		expect(next.log).toHaveLength(0)
	})

	it('sets pendingEnMaxDelta -1 when ecart > 4', () => {
		const state = makeState()
		const next = hook(state, baseHero, baseSession, Math.random, 5)
		expect(next.pendingEnMaxDelta).toBe(-1)
		expect(next.log).toHaveLength(1)
	})

	it('accumulates across multiple triggers', () => {
		let state = makeState()
		state = hook(state, baseHero, baseSession, Math.random, 6)
		state = hook(state, baseHero, baseSession, Math.random, 7)
		expect(state.pendingEnMaxDelta).toBe(-2)
	})
})

// ─── vol ──────────────────────────────────────────────────────────────────────

describe('vol', () => {
	const hook = CAPACITY_HOOKS['vol'].onMonsterWon!

	it('sets pendingVol on round 1 win', () => {
		const state = makeState({ round: 1 })
		const next = hook(state, baseHero, baseSession, Math.random, 3, 'franc', 4)
		expect(next.pendingVol).toBe(true)
		expect(next.log).toHaveLength(1)
	})

	it('does not trigger after round 1', () => {
		const state = makeState({ round: 2 })
		const next = hook(state, baseHero, baseSession, Math.random, 3, 'franc', 4)
		expect(next.pendingVol).toBe(false)
	})

	it('does not trigger twice', () => {
		const state = makeState({ round: 1, pendingVol: true })
		const next = hook(state, baseHero, baseSession, Math.random, 3, 'franc', 4)
		expect(next.log).toHaveLength(0)
	})
})

// ─── se-relève ────────────────────────────────────────────────────────────────

describe('se-releve', () => {
	const hook = CAPACITY_HOOKS['se-releve'].onMonsterAt0PV!

	it('revives monster on roll 5 or 6', () => {
		const state = makeState({ monster: { ...fakeMonster, pv: 0 } })
		const next = hook(state, baseHero, baseSession, seqRng([0.9])) // 1+floor(0.9*6)=6 → relève
		expect(next.monster.pv).toBe(1)
		expect(next.effects.zombieRevived).toBe(true)
	})

	it('no revive on roll 1-4', () => {
		const state = makeState({ monster: { ...fakeMonster, pv: 0 } })
		const next = hook(state, baseHero, baseSession, seqRng([0.0])) // 1 → pas de relève
		expect(next.monster.pv).toBe(0)
		expect(next.effects.zombieRevived).toBe(false)
	})

	it('does not trigger twice (zombieRevived guard)', () => {
		const state = makeState({
			monster: { ...fakeMonster, pv: 0 },
			effects: { ...defaultEffectsState(), zombieRevived: true },
		})
		const next = hook(state, baseHero, baseSession, seqRng([0.9]))
		expect(next.monster.pv).toBe(0)
	})
})

// ─── chant-stressant ──────────────────────────────────────────────────────────

describe('chant-stressant', () => {
	const hook = CAPACITY_HOOKS['chant-stressant'].onAfterRound!

	it('drains 1 extra PE per round', () => {
		const state = makeState({ heroPe: 4 })
		const next = hook(state, baseHero, baseSession, Math.random)
		expect(next.heroPe).toBe(3)
		expect(next.log).toHaveLength(1)
	})

	it('clamps at 0', () => {
		const state = makeState({ heroPe: 0 })
		const next = hook(state, baseHero, baseSession, Math.random)
		expect(next.heroPe).toBe(0)
	})
})

// ─── poison / venin DoT ───────────────────────────────────────────────────────

describe('poison.onHeroReceivedCrit', () => {
	const hook = CAPACITY_HOOKS['poison'].onHeroReceivedCrit!

	it('starts DoT on critical hit', () => {
		const state = makeState()
		// rollDice(1,4) with rng=()=>0.9 → 1+floor(0.9*4)=4 rounds
		const next = hook(state, baseHero, baseSession, seqRng([0.9]))
		expect(next.effects.poisonRoundsLeft).toBe(4)
		expect(next.effects.poisonDmgPerRound).toBe(1)
	})

	it('does not stack if already poisoned', () => {
		const state = makeState({ effects: { ...defaultEffectsState(), poisonRoundsLeft: 2, poisonDmgPerRound: 1 } })
		const next = hook(state, baseHero, baseSession, seqRng([0.9]))
		expect(next.effects.poisonRoundsLeft).toBe(2) // unchanged
	})
})

describe('poison.onAfterRound', () => {
	const hook = CAPACITY_HOOKS['poison'].onAfterRound!

	it('applies DoT and decrements counter', () => {
		const state = makeState({
			heroPv: 10,
			effects: { ...defaultEffectsState(), poisonRoundsLeft: 3, poisonDmgPerRound: 1 },
		})
		const next = hook(state, baseHero, baseSession, Math.random)
		expect(next.heroPv).toBe(9)
		expect(next.effects.poisonRoundsLeft).toBe(2)
	})

	it('kills hero when DoT drains last PV (PV <= -CA)', () => {
		const fragileHero = { ...baseHero, caracs: { ...baseHero.caracs, CA: 1 } }
		const state = makeState({
			heroPv: -1, // already at -1, DoT brings to -2 ≤ -CA(1)? No: -2 ≤ -1 yes
			effects: { ...defaultEffectsState(), poisonRoundsLeft: 1, poisonDmgPerRound: 1 },
		})
		const next = hook(state, fragileHero, baseSession, Math.random)
		expect(next.outcome).toBe('hero-mort')
		expect(next.phase).toBe('ended')
	})

	it('is a no-op when poisonRoundsLeft is 0', () => {
		const state = makeState({ heroPv: 10 })
		const next = hook(state, baseHero, baseSession, Math.random)
		expect(next.heroPv).toBe(10)
		expect(next.log).toHaveLength(0)
	})
})

// ─── renversement ─────────────────────────────────────────────────────────────

describe('renversement', () => {
	const hook = CAPACITY_HOOKS['renversement'].onMonsterWon!

	it('sets renversementMalus when ecart > 3', () => {
		const state = makeState()
		const next = hook(state, baseHero, baseSession, Math.random, 4, 'franc', 3)
		expect(next.effects.renversementMalus).toBe(2)
	})

	it('no effect when ecart <= 3', () => {
		const state = makeState()
		const next = hook(state, baseHero, baseSession, Math.random, 3, 'franc', 3)
		expect(next.effects.renversementMalus).toBe(0)
	})
})

// ─── étreinte ─────────────────────────────────────────────────────────────────

describe('etreinte', () => {
	const winHook = CAPACITY_HOOKS['etreinte'].onMonsterWon!
	const heroWinHook = CAPACITY_HOOKS['etreinte'].onHeroWon!

	it('increments etreinte counter on monster win', () => {
		const state = makeState()
		const next = winHook(state, baseHero, baseSession, Math.random, 3, 'franc', 4)
		expect(next.effects.etreinte).toBe(1)
	})

	it('applies double damage on 3rd consecutive win', () => {
		const state = makeState({
			heroPv: 20,
			effects: { ...defaultEffectsState(), etreinte: 2 },
		})
		// damage = 5 → extra 5 → heroPv = 20 - 5 = 15
		const next = winHook(state, baseHero, baseSession, Math.random, 3, 'franc', 5)
		expect(next.heroPv).toBe(15)
		expect(next.effects.etreinte).toBe(0) // reset
	})

	it('kills hero when double damage is lethal', () => {
		const fragileHero = { ...baseHero, caracs: { ...baseHero.caracs, CA: 1 } }
		const state = makeState({
			heroPv: -1, // already in bad shape; extra 5 pushes to -6 ≤ -CA(1) → mort
			effects: { ...defaultEffectsState(), etreinte: 2 },
		})
		const next = winHook(state, fragileHero, baseSession, Math.random, 3, 'franc', 5)
		expect(next.outcome).toBe('hero-mort')
	})

	it('hero win resets etreinte counter', () => {
		const state = makeState({ effects: { ...defaultEffectsState(), etreinte: 2 } })
		const next = heroWinHook(state, baseHero, baseSession, Math.random, 3)
		expect(next.effects.etreinte).toBe(0)
	})
})

// ─── intangible ───────────────────────────────────────────────────────────────

describe('intangible', () => {
	const hook = CAPACITY_HOOKS['intangible'].modifyMonsterDamageReceived!

	it('caps damage to 1 for non-magic weapon', () => {
		const state = makeState()
		expect(hook(5, state, baseHero, baseSession)).toBe(1)
	})

	it('allows full damage for magic weapon', () => {
		const magicSession = { ...baseSession, activeMagicBonus: 2 }
		const state = makeState()
		expect(hook(5, state, baseHero, magicSession)).toBe(5)
	})

	it('leaves 0 damage as 0', () => {
		const state = makeState()
		expect(hook(0, state, baseHero, baseSession)).toBe(0)
	})
})

// ─── insensible ───────────────────────────────────────────────────────────────

describe('insensible', () => {
	const factorHook = CAPACITY_HOOKS['insensible'].modifyMonsterDamageFactor!
	const critHook = CAPACITY_HOOKS['insensible'].onHeroReceivedCrit!

	it('reduces precise damageFactor from 2 to 1', () => {
		const state = makeState()
		expect(factorHook(2, 'precise', state)).toBe(1)
	})

	it('leaves normale and defensive factors unchanged', () => {
		const state = makeState()
		expect(factorHook(1, 'normale', state)).toBe(1)
		expect(factorHook(0, 'defensive', state)).toBe(0)
	})

	it('sets soinsBloques on critical', () => {
		const state = makeState()
		const next = critHook(state, baseHero, baseSession, Math.random)
		expect(next.effects.soinsBloques).toBe(true)
		expect(next.log).toHaveLength(1)
	})
})

// ─── magie (armour bypass) ────────────────────────────────────────────────────

describe('magie.modifyHeroArmourReduction', () => {
	const hook = CAPACITY_HOOKS['magie'].modifyHeroArmourReduction!
	it('returns 0 regardless of base reduction', () => {
		const state = makeState()
		expect(hook(5, state, baseHero, baseSession)).toBe(0)
	})
})

// ─── rayon (armour bypass) ───────────────────────────────────────────────────

describe('rayon.modifyHeroArmourReduction', () => {
	const hook = CAPACITY_HOOKS['rayon'].modifyHeroArmourReduction!
	it('returns 0 to bypass hero armour', () => {
		const state = makeState()
		expect(hook(3, state, baseHero, baseSession)).toBe(0)
	})
})

// ─── regeneration ─────────────────────────────────────────────────────────────

describe('regeneration', () => {
	const hook = CAPACITY_HOOKS['regeneration'].onAfterRound!

	it('heals monster 3 PV per round', () => {
		const state = makeState({ monster: { ...fakeMonster, pv: 10, pvMax: 20 } })
		const next = hook(state, baseHero, baseSession, Math.random)
		expect(next.monster.pv).toBe(13)
	})

	it('does not heal above pvMax', () => {
		const state = makeState({ monster: { ...fakeMonster, pv: 19, pvMax: 20 } })
		const next = hook(state, baseHero, baseSession, Math.random)
		expect(next.monster.pv).toBe(20)
	})
})

// ─── vol-de-vie ───────────────────────────────────────────────────────────────

describe('vol-de-vie', () => {
	const hook = CAPACITY_HOOKS['vol-de-vie'].onMonsterWon!

	it('heals monster by the full damage dealt', () => {
		const state = makeState({ monster: { ...fakeMonster, pv: 10, pvMax: 20 } })
		const next = hook(state, baseHero, baseSession, Math.random, 3, 'franc', 6)
		expect(next.monster.pv).toBe(16)
	})

	it('does not heal when 0 damage', () => {
		const state = makeState({ monster: { ...fakeMonster, pv: 10, pvMax: 20 } })
		const next = hook(state, baseHero, baseSession, Math.random, 3, 'franc', 0)
		expect(next.monster.pv).toBe(10)
	})
})
