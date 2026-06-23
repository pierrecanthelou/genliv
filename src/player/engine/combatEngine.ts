/**
 * COMBAT ENGINE — iter 3 (play mode). Pure, RNG-injectable. Implements all
 * orchestration rules from §D, §E, §I of REGLES-PLAY-A-COMPLETER.md.
 * No React, no state — the useCombat hook owns the session state.
 */
import { POSTURES, ecartBand, pfBase, maitriseDesCoups } from '../../brain/combat'
import type { Posture, HitQuality } from '../../brain/combat'
import { enduranceMalus, healthState } from '../../brain/characteristics'
import { PROTECTIONS } from '../../brain/equipment'
import { randInt, resolveChallenge } from '../../brain/challenge'
import type { ChallengeTier } from '../../brain/challenge'
import { tierOf, combatXp } from '../../brain/xp'
import type { Tier } from '../../brain/xp'
import { CREATURE_TYPES } from '../../brain/creatureTypes'
import type { CreatureType, MonsterConfig, GameObject } from '../../brain/types'
import type { HeroState, SessionState } from '../types'

// ─── Public types ──────────────────────────────────────────────────────────────

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
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

const HIT_ORDER: HitQuality[] = ['rate', 'erafle', 'franc', 'magistral', 'critique']

function betterHit(a: HitQuality, b: HitQuality): HitQuality {
	return HIT_ORDER.indexOf(a) >= HIT_ORDER.indexOf(b) ? a : b
}

function pfMonster(m: MonsterInstance): number {
	return (m.FO + m.mc / 2) * m.weaponMultiplier
}

function heroArmourEffective(session: SessionState, heroArmorDeg: number): number {
	const base = session.activeProtection ? PROTECTIONS[session.activeProtection].reduction : 0
	return Math.max(0, base - heroArmorDeg)
}

function heroMcEffective(hero: HeroState, state: CombatState): number {
	const base = maitriseDesCoups({ AG: hero.caracs.AG, DX: hero.caracs.DX, IG: hero.caracs.IG })
	const fatigue = enduranceMalus(state.heroPe, hero.caracs.EN)
	return base + hero.mcBonus + state.gardeBonus.hero + fatigue
}

function monsterMcEffective(state: CombatState): number {
	const fatigue = state.monster.immuneToFatigue
		? 0
		: enduranceMalus(state.monster.pe, state.monster.EN)
	return state.monster.mc + state.gardeBonus.monster + fatigue
}

function numericTc(n: number): ChallengeTier {
	const clamped = Math.max(1, Math.min(4, Math.round(n))) as 1 | 2 | 3 | 4
	return (['TC1', 'TC2', 'TC3', 'TC4'] as ChallengeTier[])[clamped - 1]
}

function checkMonsterFlees(state: CombatState, heroTier: Tier, rng: () => number): boolean {
	const { monster } = state
	if (monster.creatureType === null) return false
	const desc = CREATURE_TYPES[monster.creatureType]
	if (desc.fleeThresholdPct === 0) return false
	const pvPct = (monster.pv / monster.pvMax) * 100
	if (pvPct > desc.fleeThresholdPct) return false
	const deltaT = heroTier - monster.tier
	switch (desc.fleeStrategy) {
		case 'never':
			return false
		case 'half-chance':
			return randInt(0, 1, rng) === 1
		case 'roll-1-plus-delta':
			return resolveChallenge(numericTc(1 + deltaT), monster.mc, rng).success
		case 'roll-delta':
			if (deltaT <= 0) return false
			return resolveChallenge(numericTc(deltaT), monster.mc, rng).success
	}
}

function freeAssault(
	state: CombatState,
	hero: HeroState,
	session: SessionState,
	rng: () => number,
): { damage: number; degradeArmour: boolean } {
	const heroMc = heroMcEffective(hero, state)
	const monsterMc = monsterMcEffective(state)
	const atMonster = POSTURES['normale'].computeAT(monsterMc, { shield: false, rng })
	const atHero = POSTURES['defensive'].computeAT(heroMc, { shield: session.activeShield, rng })
	if (atMonster <= atHero) return { damage: 0, degradeArmour: false }
	const ecart = atMonster - atHero
	const band = ecartBand(ecart)
	const reduction = heroArmourEffective(session, state.heroArmorDegradation)
	const damage = Math.max(0, Math.round(pfMonster(state.monster) * POSTURES['normale'].damageFactor * band.factor - reduction))
	return { damage, degradeArmour: !!band.degradesArmour }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export function startCombat(
	config: MonsterConfig,
	hero: HeroState,
	session: SessionState,
	rng: () => number = Math.random,
): CombatState {
	const variance = config.pvVariance ?? 0
	const pvActual = config.pv + (variance > 0 ? randInt(0, variance, rng) : 0)
	const EN = config.stats?.EN ?? 0
	const creatureType = config.creatureType ?? null
	const immuneToFatigue = creatureType !== null && CREATURE_TYPES[creatureType].immuneToFatigue

	const monster: MonsterInstance = {
		name: config.name,
		pvMax: pvActual,
		pv: pvActual,
		peMax: immuneToFatigue ? 0 : EN,
		pe: immuneToFatigue ? 0 : EN,
		FO: config.stats?.FO ?? 0,
		EN,
		mc: config.mc ?? 0,
		armour: config.armour ?? 0,
		armourDegradation: 0,
		weaponMultiplier: config.weaponMultiplier ?? 1,
		creatureType,
		immuneToFatigue,
		tier: (config.tier ?? 1) as Tier,
		victoryTarget: config.victoryTarget ?? null,
		fleeTarget: config.fleeTarget ?? null,
		loot: config.loot ?? null,
	}

	return {
		monster,
		heroPv: hero.pv,
		heroPe: hero.pe,
		heroArmorDegradation: session.armorDegradation,
		heroPvAtStart: hero.pv,
		round: 0,
		consecutiveDefWins: { hero: 0, monster: 0 },
		gardeBonus: { hero: 0, monster: 0 },
		log: [],
		phase: 'choosing',
		outcome: 'ongoing',
		bestHeroHit: 'rate',
		pendingXp: 0,
		pendingLoot: null,
	}
}

export function pickMonsterPosture(state: CombatState, rng: () => number = Math.random): Posture {
	const { monster } = state
	const desc = monster.creatureType !== null ? CREATURE_TYPES[monster.creatureType] : null
	const isLowHp = monster.pv / monster.pvMax < 0.25
	const [wN, wP] = desc ? (isLowHp ? desc.lowHpPostureWeights : desc.postureWeights) : [60, 25, 15]
	const roll = randInt(1, 100, rng)
	if (roll <= wN) return 'normale'
	if (roll <= wN + wP) return 'precise'
	return 'defensive'
}

function computeVictoryXp(state: CombatState, hero: HeroState, bestHit: HitQuality): number {
	const heroBase = maitriseDesCoups({ AG: hero.caracs.AG, DX: hero.caracs.DX, IG: hero.caracs.IG })
	const heroTier = tierOf(heroBase + hero.mcBonus)
	return combatXp({
		monsterTier: state.monster.tier,
		heroTier,
		bestHit,
		perfect: state.heroPv >= state.heroPvAtStart,
	})
}

export function resolveCombatRound(
	state: CombatState,
	hero: HeroState,
	session: SessionState,
	heroPosture: Posture,
	rng: () => number = Math.random,
): CombatState {
	const monsterPosture = pickMonsterPosture(state, rng)
	const round = state.round + 1
	const log: CombatLogEntry[] = [...state.log]

	const heroMc = heroMcEffective(hero, state)
	const monsterMc = monsterMcEffective(state)

	const atHero = POSTURES[heroPosture].computeAT(heroMc, { shield: session.activeShield, rng })
	const atMonster = POSTURES[monsterPosture].computeAT(monsterMc, { shield: false, rng })

	// PE drain (both, skip monster if immune)
	const heroPe = Math.max(0, state.heroPe - 1)
	const monsterPe = state.monster.immuneToFatigue ? 0 : Math.max(0, state.monster.pe - 1)
	const updatedMonster = { ...state.monster, pe: monsterPe }

	if (atHero === atMonster) {
		log.push({ round, text: `Round ${round} — Égalité (AT ${atHero}), assaut nul.` })
		return { ...state, monster: updatedMonster, heroPe, round, log, phase: 'resolved' }
	}

	let newState: CombatState = { ...state, monster: updatedMonster, heroPe, round, log, phase: 'resolved' }

	// ── Hero wins ──────────────────────────────────────────────────────────────
	if (atHero > atMonster) {
		const ecart = atHero - atMonster
		const band = ecartBand(ecart)
		// heroMc already carries the enduranceMalus via heroMcEffective(); don't re-add it.
		const rawPf = pfBase({ FO: hero.caracs.FO, MC: heroMc, weapon: session.activeWeapon }, rng)
		const damage = Math.max(0, Math.round(rawPf * POSTURES[heroPosture].damageFactor * band.factor - updatedMonster.armour))

		let mon = { ...updatedMonster, pv: updatedMonster.pv - damage }
		if (band.degradesArmour) {
			mon = { ...mon, armour: Math.max(0, mon.armour - 1), armourDegradation: mon.armourDegradation + 1 }
		}
		log.push({ round, text: `Round ${round} — Héros (AT ${atHero}) vs Monstre (AT ${atMonster}). ${band.label} : −${damage} PV. [Monstre : ${mon.pv}/${mon.pvMax}]` })

		// Garde aiguisée
		let cdf = { ...state.consecutiveDefWins }
		let gb = { ...state.gardeBonus }
		if (heroPosture === 'defensive') {
			cdf.hero += 1
			if (cdf.hero >= 3) {
				gb.monster += 2
				cdf.hero = 0
				log.push({ round, text: `Garde aiguisée — le monstre gagne +2 MC.` })
			}
		} else {
			cdf.hero = 0
		}
		cdf.monster = 0

		const bestHeroHit = betterHit(state.bestHeroHit, band.quality)
		newState = { ...newState, monster: mon, consecutiveDefWins: cdf, gardeBonus: gb, bestHeroHit }

		const heroBase = maitriseDesCoups({ AG: hero.caracs.AG, DX: hero.caracs.DX, IG: hero.caracs.IG })
		const heroTier = tierOf(heroBase + hero.mcBonus)

		if (mon.pv <= 0) {
			const xp = computeVictoryXp(newState, hero, bestHeroHit)
			log.push({ round, text: `Monstre vaincu ! +${xp} XP.` })
			return { ...newState, log, phase: 'ended', outcome: 'hero-victory', pendingXp: xp, pendingLoot: mon.loot }
		}
		if (checkMonsterFlees(newState, heroTier, rng)) {
			const xp = computeVictoryXp(newState, hero, bestHeroHit)
			log.push({ round, text: `Le monstre prend la fuite ! +${xp} XP.` })
			return { ...newState, log, phase: 'ended', outcome: 'monster-fled', pendingXp: xp, pendingLoot: mon.loot }
		}
		return { ...newState, log }
	}

	// ── Monster wins ───────────────────────────────────────────────────────────
	{
		const ecart = atMonster - atHero
		const band = ecartBand(ecart)
		const reduction = heroArmourEffective(session, state.heroArmorDegradation)
		const damage = Math.max(0, Math.round(pfMonster(updatedMonster) * POSTURES[monsterPosture].damageFactor * band.factor - reduction))

		const newHeroPv = state.heroPv - damage
		let heroArmourDeg = state.heroArmorDegradation
		if (band.degradesArmour && session.activeProtection !== null) heroArmourDeg += 1

		log.push({ round, text: `Round ${round} — Monstre (AT ${atMonster}) vs Héros (AT ${atHero}). ${band.label} : −${damage} PV. [Héros : ${newHeroPv}]` })

		let cdf = { ...state.consecutiveDefWins }
		let gb = { ...state.gardeBonus }
		if (monsterPosture === 'defensive') {
			cdf.monster += 1
			if (cdf.monster >= 3) {
				gb.hero += 2
				cdf.monster = 0
				log.push({ round, text: `Garde aiguisée — le héros gagne +2 MC.` })
			}
		} else {
			cdf.monster = 0
		}
		cdf.hero = 0

		newState = { ...newState, heroPv: newHeroPv, heroArmorDegradation: heroArmourDeg, consecutiveDefWins: cdf, gardeBonus: gb, log }

		const heroHealth = healthState(newHeroPv, hero.caracs.CA)
		if (heroHealth === 'inconscient') {
			const { damage: lastDmg, degradeArmour } = freeAssault(newState, hero, session, rng)
			const finalPv = newHeroPv - lastDmg
			if (degradeArmour && session.activeProtection !== null) heroArmourDeg += 1
			const finalHealth = healthState(finalPv, hero.caracs.CA)
			if (finalHealth !== 'ok') {
				log.push({ round, text: `Inconscient — assaut final : −${lastDmg} PV. Le héros succombe.` })
				return { ...newState, heroPv: finalPv, heroArmorDegradation: heroArmourDeg, log, phase: 'ended', outcome: 'hero-mort' }
			}
			log.push({ round, text: `Inconscient — assaut final : −${lastDmg} PV. Le héros survit à 1 PV.` })
			return { ...newState, heroPv: 1, heroArmorDegradation: heroArmourDeg, log, phase: 'ended', outcome: 'hero-survived-unconscious' }
		}
		if (heroHealth === 'mort') {
			log.push({ round, text: `Le héros est mort.` })
			return { ...newState, log, phase: 'ended', outcome: 'hero-mort' }
		}
		return { ...newState, log }
	}
}

export function tryHeroFlee(
	state: CombatState,
	hero: HeroState,
	session: SessionState,
	rng: () => number = Math.random,
): CombatState {
	const log: CombatLogEntry[] = [...state.log]
	const { damage, degradeArmour } = freeAssault(state, hero, session, rng)
	const newHeroPv = state.heroPv - damage
	let heroArmourDeg = state.heroArmorDegradation
	if (degradeArmour && session.activeProtection !== null) heroArmourDeg += 1

	log.push({ round: state.round, text: `Fuite — assaut gratuit : −${damage} PV. [Héros : ${newHeroPv}]` })

	const heroHealth = healthState(newHeroPv, hero.caracs.CA)
	if (heroHealth !== 'ok') {
		log.push({ round: state.round, text: `Le héros tombe en fuyant.` })
		return { ...state, heroPv: newHeroPv, heroArmorDegradation: heroArmourDeg, log, phase: 'ended', outcome: 'hero-mort' }
	}
	log.push({ round: state.round, text: `Le héros fuit.` })
	return { ...state, heroPv: newHeroPv, heroArmorDegradation: heroArmourDeg, log, phase: 'ended', outcome: 'hero-fled' }
}
