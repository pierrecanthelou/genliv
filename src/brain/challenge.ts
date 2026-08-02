/**
 * CHALLENGE TIERS (§ 2) — the four Tiers de Challenge that REPLACE the raw
 * `SkillRoll.difficulty: number`. Same KR-117 registry shape as CHARACTERISTICS:
 * the difficulty picker derives its options/labels/dice from here, no hardcoded
 * list, no `tier === 'TC2'` branch.
 *
 * AUTHORING vs PLAY split: the editor stores WHICH tier gates a roll
 * (`ChallengeTier`); the dice + resolution are PLAY MODE (pure helpers below).
 * A roll succeeds when the dice total ≤ the tested caractéristique (§ 2).
 */
export type ChallengeTier = 'TC1' | 'TC2' | 'TC3' | 'TC4'

export interface ChallengeTierDescriptor {
	label: string
	/** Difficulty word. */
	difficulty: string
	/** Dice rolled in play mode: `count`d`sides`. */
	dice: { count: number; sides: number }
	/** Human dice notation for the editor (e.g. '2D5'). */
	notation: string
	/** XP de base earned (= the tier value, § 2 / § 5). */
	baseXp: number
}

// Stryker disable StringLiteral,ObjectLiteral,ArrayDeclaration: registre verrouille par rules.golden.test.ts
export const CHALLENGE_TIERS: Record<ChallengeTier, ChallengeTierDescriptor> = {
	TC1: { label: 'Simple', difficulty: 'Simple', dice: { count: 1, sides: 6 }, notation: '1D6', baseXp: 1 },
	TC2: { label: 'Dur', difficulty: 'Dur', dice: { count: 2, sides: 5 }, notation: '2D5', baseXp: 2 },
	TC3: { label: 'Très dur', difficulty: 'Très dur', dice: { count: 3, sides: 4 }, notation: '3D4', baseXp: 3 },
	TC4: { label: 'Impossible', difficulty: 'Impossible', dice: { count: 4, sides: 4 }, notation: '4D4', baseXp: 4 },
}

export const CHALLENGE_TIER_VALUES = Object.keys(CHALLENGE_TIERS) as ChallengeTier[]
export const DEFAULT_CHALLENGE_TIER: ChallengeTier = 'TC1'
// Stryker restore StringLiteral,ObjectLiteral,ArrayDeclaration

/** Numeric tier value (1..4) — used by the XP delta (§ 5). */
export function challengeTierValue(t: ChallengeTier): 1 | 2 | 3 | 4 {
	return (CHALLENGE_TIER_VALUES.indexOf(t) + 1) as 1 | 2 | 3 | 4
}

/**
 * MIGRATION helper — a persisted SkillRoll may carry the legacy numeric
 * `difficulty` and no `tier`. Map it to the nearest tier (1→TC1, 2→TC2, 3→TC3,
 * ≥4→TC4); a roll that already has a `tier` keeps it. Editors read through this
 * so old books load and canonicalise to a tier on the next write (KR-021/116).
 */
export function rollTier(roll: { tier?: ChallengeTier; difficulty?: number }): ChallengeTier {
	if (roll.tier !== undefined) return roll.tier
	const d = roll.difficulty ?? 1
	if (d <= 1) return 'TC1'
	if (d === 2) return 'TC2'
	if (d === 3) return 'TC3'
	return 'TC4'
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAY MODE (deferred) — pure dice + resolution.
// ─────────────────────────────────────────────────────────────────────────────

/** Uniform integer in [min, max] inclusive. Inject `rng` for deterministic tests. */
export function randInt(min: number, max: number, rng: () => number = Math.random): number {
	return min + Math.floor(rng() * (max - min + 1))
}

/** Roll `count`d`sides` and total. */
export function rollDice(count: number, sides: number, rng: () => number = Math.random): number {
	let total = 0
	for (let i = 0; i < count; i++) total += randInt(1, sides, rng)
	return total
}

export interface ChallengeResult {
	roll: number
	success: boolean
	/** caractéristique − roll; ≥ 3 grants the « marge » XP bonus (§ 5). */
	margin: number
}

/** Resolve a challenge: success when the dice total ≤ the tested caractéristique value. */
export function resolveChallenge(
	tier: ChallengeTier,
	characteristicValue: number,
	rng: () => number = Math.random,
): ChallengeResult {
	const d = CHALLENGE_TIERS[tier].dice
	const roll = rollDice(d.count, d.sides, rng)
	return { roll, success: roll <= characteristicValue, margin: characteristicValue - roll }
}
