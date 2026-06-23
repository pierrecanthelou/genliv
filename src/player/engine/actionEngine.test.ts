import {
	resolveTrap,
	resolveDecorReveal,
	resolveTakeableRoll,
	applyPnjGift,
	autoEquipObject,
	computeCaracUpgrade,
	computeMcUpgrade,
	applyCaracUpgrade,
	applyMcUpgrade,
} from './actionEngine'
import type { TrapConfig, PnjGift, SkillRoll, DecorReveal, GameObject } from '../../brain/types'
import type { HeroState, SessionEquipmentState } from '../types'

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeHero(overrides: Partial<HeroState> = {}): HeroState {
	return {
		name: 'Test',
		caracs: { FO: 5, AG: 5, DX: 5, EN: 5, IN: 6, IG: 5, SE: 5, CA: 5 },
		pvMax: 15,
		pv: 15,
		peMax: 5,
		pe: 5,
		mcBonus: 0,
		xp: 20,
		...overrides,
	}
}

function makeSession(overrides: Partial<SessionEquipmentState> = {}): SessionEquipmentState {
	return {
		inventory: [],
		activeWeapon: 'mains-nues',
		activeProtection: null,
		activeShield: false,
		armorDegradation: 0,
		activeMagicBonus: 0,
		activeSilverWeapon: false,
		permanentArmorBonus: 0,
		...overrides,
	}
}

function makeSkillRoll(overrides: Partial<SkillRoll> = {}): SkillRoll {
	return { trait: 'FO', tier: 'TC1', ...overrides }
}

const alwaysSucceed = () => 0   // dice total = 1 → ≤ any positive carac
const alwaysFail = () => 0.999  // dice total = max sides → > any typical carac

// ─── resolveTrap ──────────────────────────────────────────────────────────────

describe('resolveTrap', () => {
	const trap: TrapConfig = {
		description: 'Une lame jaillit du sol',
		roll: makeSkillRoll(),
		outcomes: { reussite: 'Vous esquivez !', echec: 'La lame vous blesse.' },
		fatal: false,
	}
	const fatalTrap: TrapConfig = { ...trap, fatal: true }

	it('returns reussite when roll succeeds', () => {
		const r = resolveTrap(trap, makeHero(), alwaysSucceed)
		expect(r.outcome).toBe('reussite')
		expect(r.text).toBe('Vous esquivez !')
		expect(r.isLethal).toBe(false)
	})

	it('returns echec when roll fails', () => {
		const r = resolveTrap(trap, makeHero(), alwaysFail)
		expect(r.outcome).toBe('echec')
		expect(r.text).toBe('La lame vous blesse.')
		expect(r.isLethal).toBe(false)
	})

	it('isLethal is true on echec when fatal=true', () => {
		const r = resolveTrap(fatalTrap, makeHero(), alwaysFail)
		expect(r.isLethal).toBe(true)
	})

	it('isLethal is false on reussite even when fatal=true', () => {
		const r = resolveTrap(fatalTrap, makeHero(), alwaysSucceed)
		expect(r.isLethal).toBe(false)
	})

	it('auto-fires echec when no roll authored', () => {
		const noRollTrap: TrapConfig = { ...trap, roll: undefined, fatal: false }
		const r = resolveTrap(noRollTrap, makeHero())
		expect(r.outcome).toBe('echec')
		expect(r.xp).toBe(0)
	})

	it('auto-fires lethal echec when no roll and fatal=true', () => {
		const noRollFatal: TrapConfig = { ...trap, roll: undefined, fatal: true }
		expect(resolveTrap(noRollFatal, makeHero()).isLethal).toBe(true)
	})

	it('awards xp on success for TC1 challenge', () => {
		// TC1 baseXp=1, hero FO=5 (tier 2), challenge tier=TC1 (1) → facile band → 1 XP
		const r = resolveTrap(trap, makeHero(), alwaysSucceed)
		expect(r.xp).toBeGreaterThan(0)
	})
})

// ─── resolveDecorReveal ───────────────────────────────────────────────────────

describe('resolveDecorReveal', () => {
	const ungated: DecorReveal = { text: 'Vous entendez un bruit.' }
	const gated: DecorReveal = {
		text: 'Rien à voir.',
		roll: makeSkillRoll({ trait: 'SE' }),
		outcomes: { reussite: 'Vous trouvez un passage secret !', echec: 'Vous ne remarquez rien.' },
	}

	it('returns ungated text when no roll', () => {
		const r = resolveDecorReveal(ungated, makeHero())
		expect(r.hasRoll).toBe(false)
		expect(r.revealText).toBe('Vous entendez un bruit.')
		expect(r.outcome).toBeUndefined()
	})

	it('returns reussite text on success', () => {
		const r = resolveDecorReveal(gated, makeHero(), alwaysSucceed)
		expect(r.hasRoll).toBe(true)
		expect(r.outcome).toBe('reussite')
		expect(r.revealText).toBe('Vous trouvez un passage secret !')
	})

	it('returns echec text on failure', () => {
		const r = resolveDecorReveal(gated, makeHero(), alwaysFail)
		expect(r.outcome).toBe('echec')
		expect(r.revealText).toBe('Vous ne remarquez rien.')
	})

	it('falls back to base text when outcomes missing', () => {
		const noOutcomes: DecorReveal = { text: 'Fallback', roll: makeSkillRoll() }
		const r = resolveDecorReveal(noOutcomes, makeHero(), alwaysFail)
		expect(r.revealText).toBe('Fallback')
	})
})

// ─── resolveTakeableRoll ──────────────────────────────────────────────────────

describe('resolveTakeableRoll', () => {
	it('canTake is true on success', () => {
		const r = resolveTakeableRoll(makeSkillRoll(), makeHero(), alwaysSucceed)
		expect(r.canTake).toBe(true)
		expect(r.outcome).toBe('reussite')
	})

	it('canTake is false on failure', () => {
		const r = resolveTakeableRoll(makeSkillRoll(), makeHero(), alwaysFail)
		expect(r.canTake).toBe(false)
		expect(r.outcome).toBe('echec')
	})

	it('returns xp on success', () => {
		const r = resolveTakeableRoll(makeSkillRoll(), makeHero(), alwaysSucceed)
		expect(typeof r.xp).toBe('number')
	})
})

// ─── applyPnjGift ─────────────────────────────────────────────────────────────

describe('applyPnjGift', () => {
	const hero = makeHero({ pv: 10, pvMax: 15 })
	const obj: GameObject = { id: 'obj-1', name: 'Potion', description: 'Restaure PV' }

	it('pv gift: pvDelta = min(value, pvMax - pv)', () => {
		const gift: PnjGift = { object: obj, effect: 'pv', value: 3 }
		const m = applyPnjGift(gift, hero)
		expect(m.pvDelta).toBe(3)
		expect(m.mcBonusDelta).toBe(0)
		expect(m.inventoryAdd).toEqual([])
	})

	it('pv gift: capped at pvMax', () => {
		const gift: PnjGift = { object: obj, effect: 'pv', value: 20 }
		const m = applyPnjGift(gift, hero)
		expect(m.pvDelta).toBe(5) // pvMax(15) - pv(10) = 5
	})

	it('attaque gift: mcBonusDelta = value', () => {
		const gift: PnjGift = { object: obj, effect: 'attaque', value: 1 }
		const m = applyPnjGift(gift, makeHero())
		expect(m.mcBonusDelta).toBe(1)
		expect(m.pvDelta).toBe(0)
	})

	it('defense gift: armorBonusDelta = value', () => {
		const gift: PnjGift = { object: obj, effect: 'defense', value: 2 }
		const m = applyPnjGift(gift, makeHero())
		expect(m.armorBonusDelta).toBe(2)
	})

	it('scenario gift: inventoryAdd contains object id', () => {
		const gift: PnjGift = { object: obj, effect: 'scenario', value: 0 }
		const m = applyPnjGift(gift, makeHero())
		expect(m.inventoryAdd).toEqual(['obj-1'])
		expect(m.pvDelta).toBe(0)
	})
})

// ─── autoEquipObject ──────────────────────────────────────────────────────────

describe('autoEquipObject', () => {
	const swordObj: GameObject = {
		id: 'sw-1',
		name: 'Epee',
		description: 'Tranchante',
		equipment: { kind: 'arme', weapon: 'epee-1m' },
	}
	const magicSword: GameObject = {
		id: 'ms-1',
		name: 'Epee magique',
		description: '+2 MC',
		equipment: { kind: 'arme', weapon: 'epee-1m', magic: 2 },
	}
	const silverSword: GameObject = {
		id: 'ag-1',
		name: 'Epee argent',
		description: 'Argent',
		equipment: { kind: 'arme', weapon: 'epee-1m', silver: true },
	}
	const leatherObj: GameObject = {
		id: 'cu-1',
		name: 'Cuir',
		description: 'Armure legere',
		equipment: { kind: 'protection', protection: 'cuir' },
	}
	const shieldObj: GameObject = {
		id: 'sh-1',
		name: 'Bouclier',
		description: 'Bouclier',
		equipment: { kind: 'protection', protection: 'bouclier' },
	}
	const plotObj: GameObject = { id: 'p-1', name: 'Cle', description: 'Cle' }

	it('no-op for objects without equipment', () => {
		expect(autoEquipObject(plotObj, makeSession())).toEqual({})
	})

	it('equips weapon when slot is vacant', () => {
		const m = autoEquipObject(swordObj, makeSession())
		expect(m.activeWeapon).toBe('epee-1m')
	})

	it('no-op for weapon when slot is occupied', () => {
		const m = autoEquipObject(swordObj, makeSession({ activeWeapon: 'epee-1m' }))
		expect(m.activeWeapon).toBeUndefined()
	})

	it('sets activeMagicBonus for magic weapon', () => {
		const m = autoEquipObject(magicSword, makeSession())
		expect(m.activeMagicBonus).toBe(2)
		expect(m.activeWeapon).toBe('epee-1m')
	})

	it('sets activeSilverWeapon for silver weapon', () => {
		const m = autoEquipObject(silverSword, makeSession())
		expect(m.activeSilverWeapon).toBe(true)
	})

	it('equips armor when slot is vacant', () => {
		const m = autoEquipObject(leatherObj, makeSession())
		expect(m.activeProtection).toBe('cuir')
	})

	it('no-op for armor when slot is occupied', () => {
		const m = autoEquipObject(leatherObj, makeSession({ activeProtection: 'cuir' }))
		expect(m.activeProtection).toBeUndefined()
	})

	it('equips shield when not already held', () => {
		const m = autoEquipObject(shieldObj, makeSession())
		expect(m.activeShield).toBe(true)
	})

	it('no-op for shield when already held', () => {
		const m = autoEquipObject(shieldObj, makeSession({ activeShield: true }))
		expect(m.activeShield).toBeUndefined()
	})
})

// ─── computeCaracUpgrade ─────────────────────────────────────────────────────

describe('computeCaracUpgrade', () => {
	it('can upgrade when xp >= cost', () => {
		const hero = makeHero({ xp: 10, caracs: { FO: 5, AG: 5, DX: 5, EN: 5, IN: 6, IG: 5, SE: 5, CA: 5 } })
		const r = computeCaracUpgrade('FO', hero)
		expect(r.canUpgrade).toBe(true)
		expect(r.nextValue).toBe(6)
		expect(r.cost).not.toBeNull()
	})

	it('cannot upgrade when xp < cost', () => {
		const poorHero = makeHero({ xp: 0 })
		const r = computeCaracUpgrade('FO', poorHero)
		expect(r.canUpgrade).toBe(false)
	})

	it('cannot upgrade when at cap (12)', () => {
		const maxHero = makeHero({ xp: 999, caracs: { FO: 12, AG: 5, DX: 5, EN: 5, IN: 6, IG: 5, SE: 5, CA: 5 } })
		const r = computeCaracUpgrade('FO', maxHero)
		expect(r.canUpgrade).toBe(false)
		expect(r.cost).toBeNull()
	})

	it('pvMaxDelta is 1 for FO', () => {
		const r = computeCaracUpgrade('FO', makeHero())
		expect(r.pvMaxDelta).toBe(1)
	})

	it('pvMaxDelta is 1 for AG', () => {
		expect(computeCaracUpgrade('AG', makeHero()).pvMaxDelta).toBe(1)
	})

	it('pvMaxDelta is 1 for EN', () => {
		expect(computeCaracUpgrade('EN', makeHero()).pvMaxDelta).toBe(1)
	})

	it('pvMaxDelta is 0 for non-pvMax caracs', () => {
		expect(computeCaracUpgrade('DX', makeHero()).pvMaxDelta).toBe(0)
		expect(computeCaracUpgrade('IN', makeHero()).pvMaxDelta).toBe(0)
	})
})

// ─── applyCaracUpgrade ───────────────────────────────────────────────────────

describe('applyCaracUpgrade', () => {
	it('increments the characteristic', () => {
		const hero = makeHero({ xp: 20 })
		const updated = applyCaracUpgrade('FO', hero)
		expect(updated.caracs.FO).toBe(hero.caracs.FO + 1)
	})

	it('spends the correct xp', () => {
		const hero = makeHero({ xp: 20 })
		const { cost } = computeCaracUpgrade('FO', hero)
		const updated = applyCaracUpgrade('FO', hero)
		expect(updated.xp).toBe(20 - (cost ?? 0))
	})

	it('increases pvMax and heals the diff for FO', () => {
		const hero = makeHero({ xp: 20, pv: 15, pvMax: 15 })
		const updated = applyCaracUpgrade('FO', hero)
		expect(updated.pvMax).toBe(16)
		expect(updated.pv).toBe(16)
	})

	it('does not change pvMax for DX', () => {
		const hero = makeHero({ xp: 20, pvMax: 15, pv: 10 })
		const updated = applyCaracUpgrade('DX', hero)
		expect(updated.pvMax).toBe(15)
		expect(updated.pv).toBe(10) // no heal from pvMax
	})

	it('increases peMax when upgrading EN (peMax = EN, § 1)', () => {
		const hero = makeHero({ xp: 20, peMax: 5, pe: 5 })
		const updated = applyCaracUpgrade('EN', hero)
		expect(updated.peMax).toBe(6)
	})

	it('does not change peMax for non-EN caracs', () => {
		const hero = makeHero({ xp: 20, peMax: 5 })
		expect(applyCaracUpgrade('FO', hero).peMax).toBe(5)
		expect(applyCaracUpgrade('AG', hero).peMax).toBe(5)
		expect(applyCaracUpgrade('DX', hero).peMax).toBe(5)
	})
})

// ─── computeMcUpgrade ────────────────────────────────────────────────────────

describe('computeMcUpgrade', () => {
	it('can upgrade when IN >= 6 and xp sufficient', () => {
		const hero = makeHero({ xp: 10, caracs: { FO: 5, AG: 5, DX: 5, EN: 5, IN: 6, IG: 5, SE: 5, CA: 5 } })
		const r = computeMcUpgrade(hero)
		expect(r.canUpgrade).toBe(true)
		expect(r.nextBonus).toBe(1)
	})

	it('cannot upgrade when IN < 6', () => {
		const hero = makeHero({ xp: 50, caracs: { FO: 5, AG: 5, DX: 5, EN: 5, IN: 5, IG: 5, SE: 5, CA: 5 } })
		const r = computeMcUpgrade(hero)
		expect(r.canUpgrade).toBe(false)
		expect(r.cost).toBeNull()
	})

	it('cannot upgrade at MC_BONUS_MAX (5)', () => {
		const hero = makeHero({ xp: 999, mcBonus: 5, caracs: { FO: 5, AG: 5, DX: 5, EN: 5, IN: 6, IG: 5, SE: 5, CA: 5 } })
		const r = computeMcUpgrade(hero)
		expect(r.canUpgrade).toBe(false)
	})
})

// ─── applyMcUpgrade ──────────────────────────────────────────────────────────

describe('applyMcUpgrade', () => {
	it('increments mcBonus and spends xp', () => {
		const hero = makeHero({ xp: 20, mcBonus: 0, caracs: { FO: 5, AG: 5, DX: 5, EN: 5, IN: 6, IG: 5, SE: 5, CA: 5 } })
		const { cost } = computeMcUpgrade(hero)
		const updated = applyMcUpgrade(hero)
		expect(updated.mcBonus).toBe(1)
		expect(updated.xp).toBe(20 - (cost ?? 0))
	})
})
