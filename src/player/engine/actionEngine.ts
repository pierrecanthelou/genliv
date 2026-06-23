/**
 * ACTION ENGINE (iter 5) — pure resolution functions for décor, PNJ, piège, and
 * the XP progression shop. Zero state, zero I/O, zero imports from features/.
 * Every function takes the inputs it needs and returns a typed result the calling
 * hook applies to session state.
 */
import type { TrapConfig, PnjGift, SkillRoll, DecorReveal, GameObject, RollOutcome } from '../../brain/types'
import type { Characteristic } from '../../brain/characteristics'
import { CHARACTERISTIC_MAX } from '../../brain/characteristics'
import { resolveChallenge, rollTier, challengeTierValue, CHALLENGE_TIERS } from '../../brain/challenge'
import { challengeXp, tierOf, characteristicUpgradeCost, mcUpgradeCost, canUpgradeMC } from '../../brain/xp'
import { PROTECTIONS, DEFAULT_WEAPON } from '../../brain/equipment'
import type { WeaponId, ProtectionId } from '../../brain/equipment'
import type { HeroState, SessionEquipmentState } from '../types'

// ─── Shared ───────────────────────────────────────────────────────────────────

function resolveRoll(
	roll: SkillRoll,
	hero: HeroState,
	rng: () => number,
): { outcome: RollOutcome; diceRoll: number; characteristicValue: number; margin: number; xp: number } {
	const tier = rollTier(roll)
	const characteristicValue = hero.caracs[roll.trait as Characteristic] ?? 0
	const { roll: diceRoll, success, margin } = resolveChallenge(tier, characteristicValue, rng)
	const outcome: RollOutcome = success ? 'reussite' : 'echec'
	const xp = challengeXp({
		challengeTier: challengeTierValue(tier),
		heroTier: tierOf(characteristicValue),
		success,
		baseXp: CHALLENGE_TIERS[tier].baseXp,
		margin,
	})
	return { outcome, diceRoll, characteristicValue, margin, xp }
}

// ─── Piège ────────────────────────────────────────────────────────────────────

export interface TrapResult {
	outcome: RollOutcome
	/** Dice total (0 when no roll authored). */
	diceRoll: number
	characteristicValue: number
	margin: number
	xp: number
	/** Player-facing outcome text from TrapConfig.outcomes. */
	text: string
	/** True when this result leads to the Mort node (échec + TrapConfig.fatal). */
	isLethal: boolean
}

/**
 * Resolve a trap encounter. When no `roll` is authored the trap auto-fires (échec).
 * `isLethal` is only true when the roll fails AND the trap has the fatal flag.
 */
export function resolveTrap(trap: TrapConfig, hero: HeroState, rng: () => number = Math.random): TrapResult {
	if (!trap.roll) {
		return {
			outcome: 'echec',
			diceRoll: 0,
			characteristicValue: 0,
			margin: 0,
			xp: 0,
			text: trap.outcomes.echec,
			isLethal: trap.fatal,
		}
	}
	const { outcome, diceRoll, characteristicValue, margin, xp } = resolveRoll(trap.roll, hero, rng)
	return {
		outcome,
		diceRoll,
		characteristicValue,
		margin,
		xp,
		text: trap.outcomes[outcome],
		isLethal: outcome === 'echec' && trap.fatal,
	}
}

// ─── Décor — reveal (écouter / fouiller) ──────────────────────────────────────

export interface DecorRevealResult {
	/** Whether a roll was required for this reveal. */
	hasRoll: boolean
	outcome?: RollOutcome
	revealText: string
}

/**
 * Resolve a décor reveal (écouter / fouiller). The reveal may be ungated (just text)
 * or gated by a skill roll — réussite/échec each carry their own text.
 */
export function resolveDecorReveal(reveal: DecorReveal, hero: HeroState, rng: () => number = Math.random): DecorRevealResult {
	if (!reveal.roll) {
		return { hasRoll: false, revealText: reveal.text }
	}
	const { outcome } = resolveRoll(reveal.roll, hero, rng)
	const revealText = reveal.outcomes?.[outcome] ?? reveal.text
	return { hasRoll: true, outcome, revealText }
}

// ─── Décor — takeable roll ────────────────────────────────────────────────────

export interface TakeableRollResult {
	outcome: RollOutcome
	diceRoll: number
	characteristicValue: number
	margin: number
	xp: number
	canTake: boolean
}

/**
 * Resolve the optional skill roll gating access to a takeable object.
 * Called only when `takeable.roll` is set; the caller checks that guard first.
 */
export function resolveTakeableRoll(roll: SkillRoll, hero: HeroState, rng: () => number = Math.random): TakeableRollResult {
	const { outcome, diceRoll, characteristicValue, margin, xp } = resolveRoll(roll, hero, rng)
	return { outcome, diceRoll, characteristicValue, margin, xp, canTake: outcome === 'reussite' }
}

// ─── PNJ — gift application ───────────────────────────────────────────────────

/**
 * Additive deltas from a PNJ gift. Every field is an addend (never a setter) so
 * the calling hook can apply them with `prev + delta` without knowing the current
 * state. `inventoryAdd` carries the object id to append to inventory (scenario).
 */
export interface PnjGiftMutations {
	pvDelta: number
	mcBonusDelta: number
	armorBonusDelta: number
	/** Object id to add to inventory for a 'scenario' gift. Empty for other gifts. */
	inventoryAdd: string[]
}

/** Compute the additive mutations that applying `gift` to `hero` should produce. */
export function applyPnjGift(gift: PnjGift, hero: HeroState): PnjGiftMutations {
	switch (gift.effect) {
		case 'pv':
			// Capped at pvMax — the hook clamps using `Math.min(hero.pv + pvDelta, hero.pvMax)`.
			return { pvDelta: Math.min(gift.value, hero.pvMax - hero.pv), mcBonusDelta: 0, armorBonusDelta: 0, inventoryAdd: [] }
		case 'attaque':
			return { pvDelta: 0, mcBonusDelta: gift.value, armorBonusDelta: 0, inventoryAdd: [] }
		case 'defense':
			return { pvDelta: 0, mcBonusDelta: 0, armorBonusDelta: gift.value, inventoryAdd: [] }
		case 'scenario':
			return { pvDelta: 0, mcBonusDelta: 0, armorBonusDelta: 0, inventoryAdd: [gift.object.id] }
	}
}

// ─── Object auto-equip ────────────────────────────────────────────────────────

/**
 * Equipment slot mutations produced by auto-equipping an object. Only the fields
 * that change are set; the caller merges with the existing session.
 */
export interface EquipMutations {
	activeWeapon?: WeaponId
	activeProtection?: ProtectionId
	activeShield?: boolean
	activeMagicBonus?: number
	activeSilverWeapon?: boolean
}

/**
 * When the hero takes an object with an equipment effect, auto-equip it if the
 * relevant slot is vacant. Returns `{}` when nothing should change (no effect, or
 * slot already occupied).
 */
export function autoEquipObject(obj: GameObject, session: SessionEquipmentState): EquipMutations {
	if (!obj.equipment) return {}

	if (obj.equipment.kind === 'arme') {
		if (session.activeWeapon !== DEFAULT_WEAPON) return {}
		const mutations: EquipMutations = { activeWeapon: obj.equipment.weapon }
		if (obj.equipment.magic) mutations.activeMagicBonus = obj.equipment.magic
		if (obj.equipment.silver) mutations.activeSilverWeapon = true
		return mutations
	}

	// protection
	const prot = obj.equipment.protection
	const desc = PROTECTIONS[prot]
	if (desc.shieldDefensiveBonus) {
		if (session.activeShield) return {}
		return { activeShield: true }
	}
	if (session.activeProtection !== null) return {}
	return { activeProtection: prot }
}

// ─── XP shop ─────────────────────────────────────────────────────────────────

export interface CaracUpgradeInfo {
	/** Whether the upgrade can be purchased (not at cap AND enough XP). */
	canUpgrade: boolean
	/** XP cost, or null when already at the cap. */
	cost: number | null
	/** The characteristic value after upgrading. */
	nextValue: number
	/**
	 * By how much pvMax changes if the upgrade is applied (1 for FO/AG/EN, else 0).
	 * pvMax = FO + AG + EN (§ 1). The calling hook adjusts pvMax and heals the diff.
	 */
	pvMaxDelta: number
	/**
	 * By how much peMax changes if the upgrade is applied (1 for EN, else 0).
	 * peMax = EN (§ 1). Must be applied alongside pvMaxDelta for EN upgrades.
	 */
	peMaxDelta: number
}

/**
 * Compute the upgrade info for one characteristic. The caller checks `canUpgrade`
 * before spending XP; `pvMaxDelta` is always the delta regardless of feasibility.
 */
export function computeCaracUpgrade(carac: Characteristic, hero: HeroState): CaracUpgradeInfo {
	const current = hero.caracs[carac]
	const nextValue = current + 1
	const cost = nextValue > CHARACTERISTIC_MAX ? null : characteristicUpgradeCost(nextValue)
	const canUpgrade = cost !== null && hero.xp >= cost
	const pvMaxAffected = carac === 'FO' || carac === 'AG' || carac === 'EN'
	const peMaxAffected = carac === 'EN'
	return { canUpgrade, cost, nextValue, pvMaxDelta: pvMaxAffected ? 1 : 0, peMaxDelta: peMaxAffected ? 1 : 0 }
}

/**
 * Apply a characteristic upgrade to the hero (XP spent, carac incremented,
 * pvMax recalculated, pv healed by the pvMax diff). Caller must verify `canUpgrade`.
 */
export function applyCaracUpgrade(carac: Characteristic, hero: HeroState): HeroState {
	const { cost, nextValue, pvMaxDelta, peMaxDelta } = computeCaracUpgrade(carac, hero)
	const newCaracs = { ...hero.caracs, [carac]: nextValue }
	const newPvMax = hero.pvMax + pvMaxDelta
	// Heal the hero by the pvMax increase (F4: carac upgrade → pvMax diff healed).
	const newPv = Math.min(hero.pv + pvMaxDelta, newPvMax)
	// EN upgrade also increments peMax (peMax = EN, § 1).
	const newPeMax = hero.peMax + peMaxDelta
	return {
		...hero,
		caracs: newCaracs,
		pvMax: newPvMax,
		pv: newPv,
		peMax: newPeMax,
		xp: hero.xp - (cost ?? 0),
	}
}

export interface McUpgradeInfo {
	/** Whether the upgrade can be purchased (IN gate + not at cap + enough XP). */
	canUpgrade: boolean
	/** XP cost, or null when gated by IN or already at the cap. */
	cost: number | null
	/** The MC bonus after upgrading. */
	nextBonus: number
}

/** Compute the MC-upgrade info for the hero. */
export function computeMcUpgrade(hero: HeroState): McUpgradeInfo {
	const nextBonus = hero.mcBonus + 1
	if (!canUpgradeMC(hero.caracs.IN)) {
		return { canUpgrade: false, cost: null, nextBonus }
	}
	const cost = mcUpgradeCost(nextBonus)
	const canUpgrade = cost !== null && hero.xp >= cost
	return { canUpgrade, cost, nextBonus }
}

/**
 * Apply an MC upgrade to the hero (XP spent, mcBonus incremented).
 * Caller must verify `canUpgrade`.
 */
export function applyMcUpgrade(hero: HeroState): HeroState {
	const { cost, nextBonus } = computeMcUpgrade(hero)
	return {
		...hero,
		mcBonus: nextBonus,
		xp: hero.xp - (cost ?? 0),
	}
}

