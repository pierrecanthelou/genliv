/**
 * CREATURE_TYPES (§ I, § D3) — KR-135 registry. Maps each CreatureType to its
 * flee threshold, AI posture weights, and passive flags. The combat engine reads
 * CREATURE_TYPES rather than branching on creatureType strings (KR-117).
 */
import type { CreatureType } from './types'

/** How a monster decides whether to flee when below its threshold. */
export type FleeStrategy =
	| 'roll-1-plus-delta' // MC roll, TC = 1 + (heroTier − monsterTier)
	| 'roll-delta' // MC roll, TC = heroTier − monsterTier; ΔT ≤ 0 → never
	| 'half-chance' // 50 % flat chance, no roll
	| 'never' // never flees

export interface CreatureTypeDescriptor {
	label: string
	/** PV percentage (0–100) below which flee is checked. 0 = never. */
	fleeThresholdPct: number
	fleeStrategy: FleeStrategy
	/** [normale%, precise%, defensive%] summing to 100 — baseline posture AI. */
	postureWeights: [number, number, number]
	/** Same weights when monster PV < 25 % of max. */
	lowHpPostureWeights: [number, number, number]
	/**
	 * This type has no PE gauge and never suffers the endurance malus (§ D4):
	 * morts-vivants are "sans endurance" by nature. Other creature types with a
	 * specific « pas d'endurance » capacité are handled in MONSTER_CAPACITIES (iter 4).
	 */
	immuneToFatigue: boolean
}

export const CREATURE_TYPES: Record<CreatureType, CreatureTypeDescriptor> = {
	humanoide: {
		label: 'Humanoïde',
		fleeThresholdPct: 25,
		fleeStrategy: 'roll-1-plus-delta',
		postureWeights: [60, 25, 15],
		lowHpPostureWeights: [45, 15, 40],
		immuneToFatigue: false,
	},
	'mort-vivant': {
		label: 'Mort-vivant',
		fleeThresholdPct: 0,
		fleeStrategy: 'never',
		postureWeights: [60, 25, 15],
		lowHpPostureWeights: [45, 15, 40],
		immuneToFatigue: true,
	},
	animal: {
		label: 'Animal',
		fleeThresholdPct: 50,
		fleeStrategy: 'half-chance',
		postureWeights: [60, 25, 15],
		lowHpPostureWeights: [45, 15, 40],
		immuneToFatigue: false,
	},
	'animal-geant': {
		label: 'Animal géant',
		fleeThresholdPct: 40,
		fleeStrategy: 'half-chance',
		postureWeights: [60, 25, 15],
		lowHpPostureWeights: [45, 15, 40],
		immuneToFatigue: false,
	},
	'creature-magique': {
		label: 'Créature magique',
		fleeThresholdPct: 10,
		fleeStrategy: 'roll-delta',
		postureWeights: [60, 25, 15],
		lowHpPostureWeights: [45, 15, 40],
		immuneToFatigue: false,
	},
}
