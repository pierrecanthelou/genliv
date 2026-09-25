import type { Characteristic } from '../brain/characteristics'
import type { WeaponId, ProtectionId } from '../brain/equipment'

/**
 * `AdventureDocument` (alias of the now-removed `PlayExport`) is retired with
 * `moteur-dossier` it4 (KR-240) — its only readers were `usePlaySession.ts` and
 * `PlayerModal.tsx`, both deleted in this lot.
 *
 * `PlayNode` SURVIVES its former source (`brain/utils/playExport`, deleted, where
 * it aliased `Omit<BookNode, 'position'>`): `src/player/components/EndScreen.tsx`
 * — an orphaned survivor out of this lot's scope (§ 2, conservé, repreneur
 * n° 10/n° 13) — still declares a `node: PlayNode | null` prop and reads
 * `node.text`. Re-deriving it from `BookNode` would re-import `brain/tree` from
 * `src/player/**`, which this lot's critère 2 measures at exactly ZERO after —
 * so it is intentionally narrowed here to the one field that orphan actually
 * reads, with NO import of the tree model. Widen it only if a future consumer
 * needs more, and re-derive from `BookNode` only once `src/player/` is allowed
 * to depend on the tree model again (it is not, today).
 */
export interface PlayNode {
	text: string
}

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

/**
 * Equipment and inventory fields tracked in session state. The initialiser that
 * used to set their defaults (`defaultSessionFields()`, in `usePlaySession.ts`)
 * was removed with the tree-model runtime in `moteur-dossier` it4 (KR-240) — no
 * producer constructs these fields today; only the orphaned survivors of
 * `src/player/` (`combatEngine.ts` and siblings) still read them.
 */
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
	/**
	 * KR-136: magic bonus from the active weapon's EquipmentEffect (arme.magic).
	 * Added to hero MC for AT and PF computation. 0 = no magic weapon equipped.
	 * Set when equipping a weapon object with magic?: number (iter 5 equipment screen).
	 */
	activeMagicBonus: number
	/**
	 * KR-136: true when the active weapon has silver: true on its EquipmentEffect.
	 * Bypasses the armour of monsters whose capacity has bypassedBySilver: true.
	 * Set when equipping a silver-weapon object (iter 5 equipment screen).
	 */
	activeSilverWeapon: boolean
	/**
	 * Permanent flat damage reduction granted by PNJ 'defense' gifts (E4).
	 * Stacks with equipped armor; applied in heroArmourEffective (combatEngine + capacityEffects).
	 */
	permanentArmorBonus: number
}

export interface SessionState extends SessionEquipmentState {
	bookId: string
	currentNodeId: string
	hero: HeroState
	visitedNodes: string[]
}
