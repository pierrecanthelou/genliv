/**
 * EQUIPMENT (§ 3) — weapons (PF multipliers) and protections (flat damage
 * reduction), as KR-117 registries. An author attaches one to an object via the
 * shared ObjectEditor « effet d'équipement ». The combat resolver reads only the
 * descriptor data — no `weapon === 'epee'` branches.
 */
export type WeaponId =
	| 'mains-nues'
	| 'couteau'
	| 'lance'
	| 'masse-1m'
	| 'contondante-2m'
	| 'epee-1m'
	| 'tranchante-2m'
	| 'distance'

export interface WeaponDescriptor {
	label: string
	/** PF multiplier (§ 3). */
	multiplier: number
	/** Ranged weapons replace FO by a 4D2 roll in the PF base (§ 3). Flag, not a branch. */
	replacesForceWith4D2?: boolean
}

export const WEAPONS: Record<WeaponId, WeaponDescriptor> = {
	'mains-nues': { label: 'Mains nues', multiplier: 0.3 },
	couteau: { label: 'Couteau', multiplier: 0.6 },
	lance: { label: 'Arme perçante (lance)', multiplier: 0.8 },
	'masse-1m': { label: 'Arme contondante 1 main (masse)', multiplier: 0.8 },
	'contondante-2m': { label: 'Arme contondante 2 mains', multiplier: 1 },
	'epee-1m': { label: 'Arme tranchante 1 main (épée)', multiplier: 1 },
	'tranchante-2m': { label: 'Arme tranchante 2 mains', multiplier: 1.3 },
	distance: { label: 'Distance (arc / arbalète)', multiplier: 1, replacesForceWith4D2: true },
}

export const WEAPON_VALUES = Object.keys(WEAPONS) as WeaponId[]
export const DEFAULT_WEAPON: WeaponId = 'mains-nues'


export type ProtectionId = 'cuir' | 'cotte' | 'plaque' | 'bouclier'

export interface ProtectionDescriptor {
	label: string
	/** Flat reduction of FINAL damage taken (§ 3); 0 for a shield. */
	reduction: number
	/** A shield adds +1D4 to AT in Défensive (§ 3) instead of reducing damage. */
	shieldDefensiveBonus?: boolean
}

export const PROTECTIONS: Record<ProtectionId, ProtectionDescriptor> = {
	cuir: { label: 'Cuir', reduction: 1 },
	cotte: { label: 'Cotte de mailles', reduction: 3 },
	plaque: { label: 'Plaque', reduction: 5 },
	bouclier: { label: 'Bouclier', reduction: 0, shieldDefensiveBonus: true },
}

export const PROTECTION_VALUES = Object.keys(PROTECTIONS) as ProtectionId[]
export const DEFAULT_PROTECTION: ProtectionId = 'cuir'
