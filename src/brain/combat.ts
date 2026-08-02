/**
 * COMBAT (§ 3) — PLAY MODE (deferred). Pure resolution: postures → AT → assault
 * winner → PF → final damage. No state; RNG injectable for tests. The editor
 * never runs this — it only authors monster stat blocks + réussite/échec text.
 * Decimals are preserved until the FINAL damage (§ 3); only `resolveAssault`
 * rounds.
 */
import { randInt, rollDice } from './challenge'
import { WEAPONS, PROTECTIONS, type WeaponId, type ProtectionId } from './equipment'

export type Posture = 'normale' | 'precise' | 'defensive'

export interface PostureDescriptor {
	label: string
	/** Damage multiplier applied to PF_base on a win (parade deals none). */
	damageFactor: number
	/** Compute the AT for this posture from a combatant's MC (§ 3). */
	computeAT: (mc: number, opts: { shield: boolean; rng?: () => number }) => number
}

// Stryker disable StringLiteral: registre verrouille par rules.golden.test.ts
export const POSTURES: Record<Posture, PostureDescriptor> = {
	normale: {
		label: 'Normale',
		damageFactor: 1,
		computeAT: (mc, { rng = Math.random }) => mc - randInt(0, 6, rng),
	},
	precise: {
		label: 'Précise',
		damageFactor: 2,
		computeAT: (mc, { rng = Math.random }) => mc - randInt(4, 10, rng),
	},
	defensive: {
		label: 'Défensive',
		damageFactor: 0,
		computeAT: (mc, { shield, rng = Math.random }) => mc + rollDice(1, 4, rng) + (shield ? rollDice(1, 4, rng) : 0),
	},
}
// Stryker restore StringLiteral

export const POSTURE_VALUES = Object.keys(POSTURES) as Posture[]

/** floor((AG + DX + IG) / 3) — Maîtrise des Coups (§ 3). */
export function maitriseDesCoups(s: { AG: number; DX: number; IG: number }): number {
	return Math.floor((s.AG + s.DX + s.IG) / 3)
}

export type HitQuality = 'rate' | 'erafle' | 'franc' | 'magistral' | 'critique'

export interface EcartBand {
	quality: HitQuality
	label: string
	/** PF multiplier for this écart band. */
	factor: number
	/** A critique degrades the target's armour by 1 (§ 3). */
	degradesArmour?: boolean
}

/** Map an écart (AT_winner − AT_loser) to its quality band (§ 3). */
export function ecartBand(ecart: number): EcartBand {
	if (ecart <= 0) return { quality: 'rate', label: 'Manqué', factor: 0 }
	if (ecart === 1) return { quality: 'erafle', label: 'Coup éraflé', factor: 0.5 }
	if (ecart <= 3) return { quality: 'franc', label: 'Coup franc', factor: 1 }
	if (ecart <= 5) return { quality: 'magistral', label: 'Coup magistral', factor: 1.5 }
	return { quality: 'critique', label: 'Coup critique', factor: 2, degradesArmour: true }
}

/** PF_base = (FO + MC/2) × multiplicateur_arme (§ 3). Ranged replaces FO by 4D2. */
export function pfBase(
	attacker: { FO: number; MC: number; weapon: WeaponId },
	rng: () => number = Math.random,
): number {
	const w = WEAPONS[attacker.weapon]
	const force = w.replacesForceWith4D2 ? rollDice(4, 2, rng) : attacker.FO
	return (force + attacker.MC / 2) * w.multiplier
}

export interface Combatant {
	FO: number
	MC: number
	weapon: WeaponId
	protection?: ProtectionId
	shield?: boolean
}

export interface AssaultResult {
	winner: 'attacker' | 'defender' | 'tie'
	atAttacker: number
	atDefender: number
	ecart: number
	band: HitQuality
	/** Final damage dealt to the loser (rounded), after posture + écart + protection. */
	damage: number
}

/**
 * Resolve one assault between two combatants who each chose a posture (§ 3). The
 * higher AT wins and deals
 * damage = round( PF_base × postureFactor × écartFactor − protectionReduction ),
 * floored at 0. A Défensive winner parries (0 damage).
 */
export function resolveAssault(
	attacker: Combatant & { posture: Posture },
	defender: Combatant & { posture: Posture },
	rng: () => number = Math.random,
): AssaultResult {
	const atA = POSTURES[attacker.posture].computeAT(attacker.MC, { shield: !!attacker.shield, rng })
	const atD = POSTURES[defender.posture].computeAT(defender.MC, { shield: !!defender.shield, rng })

	if (atA === atD) return { winner: 'tie', atAttacker: atA, atDefender: atD, ecart: 0, band: 'rate', damage: 0 }

	// Stryker disable next-line ConditionalExpression,EqualityOperator: egalite deja traitee l.110, le mutant >= est equivalent
	const attackerWins = atA > atD
	const winner = attackerWins ? attacker : defender
	const loser = attackerWins ? defender : attacker
	const ecart = Math.abs(atA - atD)
	const band = ecartBand(ecart)

	const postureFactor = POSTURES[winner.posture].damageFactor
	const reduction = loser.protection ? PROTECTIONS[loser.protection].reduction : 0
	const raw = pfBase(winner, rng) * postureFactor * band.factor
	const damage = Math.max(0, Math.round(raw - reduction))

	return {
		winner: attackerWins ? 'attacker' : 'defender',
		atAttacker: atA,
		atDefender: atD,
		ecart,
		band: band.quality,
		damage,
	}
}
