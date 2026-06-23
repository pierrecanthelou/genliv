/**
 * Combat engine shared types — extracted to avoid circular imports between
 * combatEngine.ts and capacityEffects.ts.
 */
import type { HitQuality } from '../../brain/combat'
import type { CreatureType, GameObject } from '../../brain/types'
import type { MonsterCapacityId } from '../../brain/monsterCapacities'
import type { Tier } from '../../brain/xp'

export type CombatOutcome =
	| 'ongoing'
	| 'hero-victory' // monster PV = 0
	| 'monster-fled' // monster fled (same resolution: loot + XP)
	| 'hero-fled' // hero fled → fleeTarget
	| 'hero-mort' // hero PV ≤ -CA → mort node
	| 'hero-survived-unconscious' // E1: hero at 1 PV after unconscious round

export interface CombatLogEntry {
	round: number
	text: string
}

/** Within-combat transient state owned by monster capacité hooks. */
export interface CombatEffectsState {
	/** Poison / venin DoT: rounds remaining (0 = no DoT). */
	poisonRoundsLeft: number
	/** Damage per DoT round (1 for poison, 2 for venin). */
	poisonDmgPerRound: number
	/** AT malus applied to hero next round (renversement, rayon-2). Cleared each round. */
	renversementMalus: number
	/** Hero skips next round's attack (séisme). */
	seismeStunned: boolean
	/** Hero dropped weapon on round 1 (malédiction). */
	disarmedThisRound: boolean
	/** Orque fureur free assault already used. */
	fureurUsed: boolean
	/** Zombie se-relève already triggered. */
	zombieRevived: boolean
	/** Consecutive monster wins counter (ours étreinte). */
	etreinte: number
	/** Manticore piques pre-combat attack already fired. */
	piquesUsed: boolean
	/** Soins bloqués for rest of combat (momie insensible critical, liche). */
	soinsBloques: boolean
}

export function defaultEffectsState(): CombatEffectsState {
	return {
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
	}
}

export interface MonsterInstance {
	name: string
	pvMax: number
	pv: number
	peMax: number
	pe: number
	FO: number
	EN: number
	mc: number
	armour: number
	armourDegradation: number
	weaponMultiplier: number
	creatureType: CreatureType | null
	capacityId: MonsterCapacityId
	/** KR-136: true when this monster's capacity has bypassedBySilver in MONSTER_CAPACITIES. */
	bypassedBySilver: boolean
	immuneToFatigue: boolean
	tier: Tier
	victoryTarget: string | null
	fleeTarget: string | null
	loot: GameObject | null
}

export interface CombatState {
	monster: MonsterInstance
	heroPv: number
	heroPe: number
	heroArmorDegradation: number
	heroPvAtStart: number
	round: number
	consecutiveDefWins: { hero: number; monster: number }
	gardeBonus: { hero: number; monster: number }
	log: CombatLogEntry[]
	phase: 'choosing' | 'resolved' | 'ended'
	outcome: CombatOutcome
	bestHeroHit: HitQuality
	pendingXp: number
	pendingLoot: GameObject | null
	effects: CombatEffectsState
	/** Post-combat session mutations from capacity hooks. */
	pendingEnMaxDelta: number
	pendingPvMaxDelta: number
	pendingVol: boolean
}
