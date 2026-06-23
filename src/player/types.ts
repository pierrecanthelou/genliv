import type { PlayExport, PlayNode } from '../brain/utils/playExport'
import type { Characteristic } from '../brain/characteristics'
import type { WeaponId, ProtectionId } from '../brain/equipment'

export type AdventureDocument = PlayExport
export type { PlayNode }

export interface HeroState {
	name: string
	caracs: Record<Characteristic, number>
	pvMax: number
	pv: number
	peMax: number
	pe: number
	mcBonus: number
	xp: number
}

export type PlayPhase = 'playing' | 'victory' | 'failure' | 'death'

/** Equipment and inventory fields that are tracked in session state and initialised by defaultSessionFields(). */
export interface SessionEquipmentState {
	/** Object ids from the book catalog; items are added during play (iter 5). */
	inventory: string[]
	/** Currently equipped weapon (§ 3). Default: 'mains-nues' (B3). */
	activeWeapon: WeaponId
	/** Currently equipped armor (§ 3). Null = bare. */
	activeProtection: ProtectionId | null
	/** Whether the bouclier is equipped (stacks with armor, incompatible with 2H). */
	activeShield: boolean
	/** Cumulative armour reduction from critical hits (§ 3, iter 3+). */
	armorDegradation: number
}

export interface SessionState extends SessionEquipmentState {
	bookId: string
	currentNodeId: string
	hero: HeroState
	visitedNodes: string[]
}
