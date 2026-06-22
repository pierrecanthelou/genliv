/**
 * XP & PROGRESSION (§ 5) — PLAY MODE (deferred). Pure functions: the XP delta
 * matrix (award) and the progression shop (spend). No state. The editor never
 * awards XP; encoded now so the system is unambiguous and the play runtime lifts
 * it directly.
 */
import { CHARACTERISTIC_MAX } from './characteristics'
import type { HitQuality } from './combat'

export type Tier = 1 | 2 | 3 | 4

/** Tier of a value (caractéristique or MC): 1–3→T1, 4–6→T2, 7–9→T3, 10–12→T4 (§ 5). */
export function tierOf(value: number): Tier {
	if (value <= 3) return 1
	if (value <= 6) return 2
	if (value <= 9) return 3
	return 4
}

// ── Earning XP ────────────────────────────────────────────────────────────────

export type DeltaBand = 'insignifiant' | 'facile' | 'equilibre' | 'depassement'

/** Classify ΔT = Tier_challenge/monstre − Tier_perso into its band (§ 5). */
export function deltaBand(deltaT: number): DeltaBand {
	if (deltaT <= -2) return 'insignifiant'
	if (deltaT === -1) return 'facile'
	if (deltaT === 0) return 'equilibre'
	return 'depassement'
}

/** XP for a non-combat challenge (§ 5). `baseXp` = the challenge tier value. */
export function challengeXp(opts: {
	challengeTier: Tier
	heroTier: Tier
	success: boolean
	baseXp: number
	/** caractéristique − roll; ≥ 3 grants +1 at the equilibré band. */
	margin: number
}): number {
	const band = deltaBand(opts.challengeTier - opts.heroTier)
	switch (band) {
		case 'insignifiant':
			return 0
		case 'facile':
			return opts.success ? 1 : 0
		case 'equilibre':
			return opts.success ? opts.baseXp + (opts.margin >= 3 ? 1 : 0) : 0
		case 'depassement':
			return opts.success ? opts.baseXp * 2 : 0
	}
}

/**
 * XP for a won combat (§ 5). Base = monster tier value. Style bonuses: +1
 * magistral, +2 critique, +1 « parfait » (won without losing a PV). At the
 * dépassement band the style bonuses are DOUBLED and a flat +2 applies.
 */
export function combatXp(opts: {
	monsterTier: Tier
	heroTier: Tier
	/** Best écart band landed during the fight. */
	bestHit: HitQuality
	/** Won without losing any PV. */
	perfect: boolean
}): number {
	const band = deltaBand(opts.monsterTier - opts.heroTier)
	if (band === 'insignifiant') return 0
	if (band === 'facile') return 1

	let style = 0
	if (opts.bestHit === 'magistral') style += 1
	if (opts.bestHit === 'critique') style += 2
	if (opts.perfect) style += 1

	if (band === 'equilibre') return opts.monsterTier + style
	return opts.monsterTier + 2 + style * 2
}

// ── Spending XP (boutique de progression) ───────────────────────────────────────

/** Cost to raise a caractéristique TO `targetLevel` (§ 5). null if past the cap (12). */
export function characteristicUpgradeCost(targetLevel: number): number | null {
	if (targetLevel > CHARACTERISTIC_MAX) return null
	if (targetLevel <= 4) return 1
	if (targetLevel <= 6) return 3
	if (targetLevel <= 8) return 7
	if (targetLevel <= 10) return 15
	return 30
}

/** MC bonus cap (§ 5). */
export const MC_BONUS_MAX = 5
/** Raising MC requires IN ≥ this (§ 5). */
export const MC_REQUIRES_IN = 6

/** Cost to reach MC bonus +`bonus` (§ 5): 5/10/15/20/25 for +1…+5. */
export function mcUpgradeCost(bonus: number): number | null {
	if (bonus < 1 || bonus > MC_BONUS_MAX) return null
	return bonus * 5
}

/** Whether the hero may purchase MC upgrades at all (IN gate, § 5). */
export function canUpgradeMC(IN: number): boolean {
	return IN >= MC_REQUIRES_IN
}
