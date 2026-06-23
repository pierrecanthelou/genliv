import { CHARACTERISTIC_VALUES, maxPV } from '../../brain/characteristics'
import type { Characteristic } from '../../brain/characteristics'
import { rollDice } from '../../brain/challenge'
import type { HeroState } from '../types'

function buildHeroState(name: string, caracs: Record<Characteristic, number>): HeroState {
	const pvMax = maxPV({ FO: caracs.FO, AG: caracs.AG, EN: caracs.EN })
	const peMax = caracs.EN
	return {
		name,
		caracs,
		pvMax,
		pv: pvMax,
		peMax,
		pe: peMax,
		mcBonus: 0,
		xp: 0,
	}
}

export function rollHeroCaracs(rng: () => number = Math.random): Record<Characteristic, number> {
	const caracs: Partial<Record<Characteristic, number>> = {}
	for (const c of CHARACTERISTIC_VALUES) {
		caracs[c] = rollDice(2, 4, rng)
	}
	return caracs as Record<Characteristic, number>
}

export function defaultHeroCaracs(): Record<Characteristic, number> {
	const caracs: Partial<Record<Characteristic, number>> = {}
	for (const c of CHARACTERISTIC_VALUES) {
		caracs[c] = 4
	}
	return caracs as Record<Characteristic, number>
}

export function rollHero(name: string, rng: () => number = Math.random): HeroState {
	return buildHeroState(name, rollHeroCaracs(rng))
}

export function defaultHero(name = 'Aventurier'): HeroState {
	return buildHeroState(name, defaultHeroCaracs())
}
