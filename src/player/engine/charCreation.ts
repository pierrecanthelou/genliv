/**
 * Character creation logic (§ 1, REGLES-PLAY B1-B5). Pure, no React, RNG-injectable.
 * Flow: rollCreationPool → player assigns rolls + distributes bonus → buildHeroFromCreation.
 */
import { CHARACTERISTIC_VALUES, maxPV } from '../../brain/characteristics'
import type { Characteristic } from '../../brain/characteristics'
import { rollDice } from '../../brain/challenge'
import type { HeroState } from '../types'

/** The rolled pool waiting for player assignment. */
export interface CreationPool {
	/** 8 values (2D4 each, one per carac slot), in pool order — NOT pre-assigned to caracs. */
	rolls: number[]
	/** 1D4 bonus points the player distributes freely (cap 10 per carac). */
	bonusPool: number
}

export function rollCreationPool(rng: () => number = Math.random): CreationPool {
	const rolls: number[] = []
	for (let i = 0; i < CHARACTERISTIC_VALUES.length; i++) {
		rolls.push(rollDice(2, 4, rng))
	}
	return { rolls, bonusPool: rollDice(1, 4, rng) }
}

export interface CreationAssignment {
	/** Index into `rolls[]` assigned to each characteristic; -1 = unassigned. */
	rollIndices: Record<Characteristic, number>
	/** Bonus points added per characteristic. */
	bonus: Record<Characteristic, number>
}

export function emptyAssignment(): CreationAssignment {
	const rollIndices: Partial<Record<Characteristic, number>> = {}
	const bonus: Partial<Record<Characteristic, number>> = {}
	for (const c of CHARACTERISTIC_VALUES) {
		rollIndices[c] = -1
		bonus[c] = 0
	}
	return {
		rollIndices: rollIndices as Record<Characteristic, number>,
		bonus: bonus as Record<Characteristic, number>,
	}
}

/** True when all 8 caracs have a roll assigned and all bonus points are distributed. */
export function isAssignmentComplete(pool: CreationPool, assignment: CreationAssignment): boolean {
	const allAssigned = CHARACTERISTIC_VALUES.every((c) => assignment.rollIndices[c] !== -1)
	const bonusUsed = CHARACTERISTIC_VALUES.reduce((s, c) => s + assignment.bonus[c], 0)
	return allAssigned && bonusUsed === pool.bonusPool
}

/**
 * Cap for a carac value at creation time (§ 1, REGLES-PLAY B1).
 * Base (from roll) + bonus must not exceed this.
 */
export const CREATION_CAP = 10

export function baseValue(pool: CreationPool, rollIndex: number): number {
	return rollIndex === -1 ? 0 : pool.rolls[rollIndex]
}

export function totalValue(pool: CreationPool, assignment: CreationAssignment, c: Characteristic): number {
	return baseValue(pool, assignment.rollIndices[c]) + assignment.bonus[c]
}

export function buildHeroFromCreation(name: string, pool: CreationPool, assignment: CreationAssignment): HeroState {
	const caracs: Partial<Record<Characteristic, number>> = {}
	for (const c of CHARACTERISTIC_VALUES) {
		caracs[c] = totalValue(pool, assignment, c)
	}
	const c = caracs as Record<Characteristic, number>
	const pvMax = maxPV({ FO: c.FO, AG: c.AG, EN: c.EN })
	const peMax = c.EN
	return {
		name: name.trim() || 'Aventurier',
		caracs: c,
		pvMax,
		pv: pvMax,
		peMax,
		pe: peMax,
		mcBonus: 0,
		xp: 0,
	}
}
