/**
 * COMBAT ENGINE — iter 4 (play mode). Pure, RNG-injectable. Orchestrates §D, §E,
 * §H, §I of REGLES-PLAY-A-COMPLETER.md. Dispatches all monster-specific behaviour
 * through CAPACITY_HOOKS (KR-133) — zero if/switch on capacity strings here.
 */
import { POSTURES, ecartBand, pfBase, maitriseDesCoups } from '../../brain/combat'
import type { Posture, HitQuality } from '../../brain/combat'
import { enduranceMalus, healthState } from '../../brain/characteristics'
import { PROTECTIONS } from '../../brain/equipment'
import { MONSTER_CAPACITIES } from '../../brain/monsterCapacities'
import type { MonsterCapacityId } from '../../brain/monsterCapacities'
import { randInt, resolveChallenge } from '../../brain/challenge'
import type { ChallengeTier } from '../../brain/challenge'
import { tierOf, combatXp } from '../../brain/xp'
import type { Tier } from '../../brain/xp'
import { CREATURE_TYPES } from '../../brain/creatureTypes'
import type { CreatureType, MonsterConfig } from '../../brain/types'
import type { HeroState, SessionState } from '../types'
import { CAPACITY_HOOKS } from './capacityEffects'
import {
	defaultEffectsState,
} from './combatTypes'
import type {
	CombatState,
	CombatOutcome,
	CombatLogEntry,
	MonsterInstance,
	CombatEffectsState,
} from './combatTypes'

// Re-export so existing importers (useCombat, tests) need no changes.
export type { CombatState, CombatOutcome, CombatLogEntry, MonsterInstance, CombatEffectsState }

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
	return Math.max(0, base + session.permanentArmorBonus - heroArmorDeg)
}

function heroMcEffective(hero: HeroState, state: CombatState, session: SessionState): number {
	const base = maitriseDesCoups({ AG: hero.caracs.AG, DX: hero.caracs.DX, IG: hero.caracs.IG })
	const fatigue = enduranceMalus(state.heroPe, hero.caracs.EN)
	// KR-136: magic bonus from active weapon; 0 if disarmed (malédiction round 1).
	const magicBonus = state.effects.disarmedThisRound ? 0 : session.activeMagicBonus
	return base + hero.mcBonus + state.gardeBonus.hero + fatigue + magicBonus
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
	const heroMc = heroMcEffective(hero, state, session)
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
	const creatureType = (config.creatureType ?? null) as CreatureType | null
	const immuneToFatigue = creatureType !== null && CREATURE_TYPES[creatureType].immuneToFatigue
	const capacityId = (config.capacity ?? 'aucune') as MonsterCapacityId
	const bypassedBySilver = MONSTER_CAPACITIES[capacityId].bypassedBySilver ?? false

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
		capacityId,
		bypassedBySilver,
		immuneToFatigue,
		tier: (config.tier ?? 1) as Tier,
		victoryTarget: config.victoryTarget ?? null,
		fleeTarget: config.fleeTarget ?? null,
		loot: config.loot ?? null,
	}

	let initialState: CombatState = {
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
		effects: defaultEffectsState(),
		pendingEnMaxDelta: 0,
		pendingPvMaxDelta: 0,
		pendingVol: false,
	}

	// Fire onStartCombat hook (piques, malédiction).
	const hooks = CAPACITY_HOOKS[capacityId]
	if (hooks.onStartCombat) {
		initialState = hooks.onStartCombat(initialState, hero, session, rng)
	}

	return initialState
}

export function pickMonsterPosture(state: CombatState, rng: () => number = Math.random): Posture {
	const { monster } = state
	const desc = monster.creatureType !== null ? CREATURE_TYPES[monster.creatureType] : null
	const isLowHp = monster.pv / monster.pvMax < 0.25
	const [wN, wP, _wD] = desc ? (isLowHp ? desc.lowHpPostureWeights : desc.postureWeights) : [60, 25, 15]
	const roll = randInt(1, 100, rng)
	if (roll <= wN) return 'normale'
	if (roll <= wN + wP) return 'precise'
	return 'defensive' // implicit wD bucket
}

export function resolveCombatRound(
	state: CombatState,
	hero: HeroState,
	session: SessionState,
	heroPosture: Posture,
	rng: () => number = Math.random,
): CombatState {
	const hooks = CAPACITY_HOOKS[state.monster.capacityId]
	const round = state.round + 1

	// ── Effect overrides (séisme stun, malédiction disarm) ─────────────────────
	const isStunned = state.effects.seismeStunned
	const isDisarmed = state.round === 0 && state.effects.disarmedThisRound
	const effectivePosture: Posture = isStunned || isDisarmed ? 'defensive' : heroPosture

	// Clear transient round effects BEFORE AT computation so renversementMalus
	// is applied to atHero below (read from state.effects, then cleared in workingState).
	const clearedEffects: CombatEffectsState = {
		...state.effects,
		seismeStunned: false,
		disarmedThisRound: false,
		renversementMalus: 0,
	}

	const monsterPosture = pickMonsterPosture(state, rng)
	const heroMc = heroMcEffective(hero, state, session)
	const monsterMc = monsterMcEffective(state)

	const atHeroRaw = POSTURES[effectivePosture].computeAT(heroMc, { shield: session.activeShield, rng })
	const atHero = Math.max(0, atHeroRaw - state.effects.renversementMalus)
	const atMonster = POSTURES[monsterPosture].computeAT(monsterMc, { shield: false, rng })

	// PE drain
	const heroPe = Math.max(0, state.heroPe - 1)
	const monsterPe = state.monster.immuneToFatigue ? 0 : Math.max(0, state.monster.pe - 1)

	let workingState: CombatState = {
		...state,
		monster: { ...state.monster, pe: monsterPe },
		heroPe,
		round,
		effects: clearedEffects,
		phase: 'resolved',
	}

	// ── Tie ────────────────────────────────────────────────────────────────────
	if (atHero === atMonster) {
		return {
			...workingState,
			log: [...workingState.log, { round, text: `Round ${round} — Égalité (AT ${atHero}), assaut nul.` }],
		}
	}

	// ── Hero wins ──────────────────────────────────────────────────────────────
	if (atHero > atMonster) {
		const ecart = atHero - atMonster
		const band = ecartBand(ecart)
		const rawPf = pfBase({ FO: hero.caracs.FO, MC: heroMc, weapon: session.activeWeapon }, rng)

		// Passive: insensible (précise → damageFactor ×1 instead of ×2)
		const damageFactor =
			hooks.modifyMonsterDamageFactor?.(POSTURES[effectivePosture].damageFactor, effectivePosture, workingState) ??
			POSTURES[effectivePosture].damageFactor

		// KR-136: silver weapon bypasses Loup-Garou armour
		const monsterArmour =
			workingState.monster.bypassedBySilver && session.activeSilverWeapon
				? 0
				: workingState.monster.armour

		let heroDamage = Math.max(0, Math.round(rawPf * damageFactor * band.factor - monsterArmour))

		// Passive: intangible (max 1 dmg from non-magic weapon)
		heroDamage =
			hooks.modifyMonsterDamageReceived?.(heroDamage, workingState, hero, session) ?? heroDamage

		let mon = { ...workingState.monster, pv: workingState.monster.pv - heroDamage }
		if (band.degradesArmour) {
			mon = { ...mon, armour: Math.max(0, mon.armour - 1), armourDegradation: mon.armourDegradation + 1 }
		}

		workingState = {
			...workingState,
			monster: mon,
			log: [
				...workingState.log,
				{
					round,
					text: `Round ${round} — Héros (AT ${atHero}) vs Monstre (AT ${atMonster}). ${band.label} : −${heroDamage} PV. [Monstre : ${mon.pv}/${mon.pvMax}]`,
				},
			],
		}

		// Garde aiguisée
		let cdf = { ...state.consecutiveDefWins }
		let gb = { ...state.gardeBonus }
		if (effectivePosture === 'defensive') {
			cdf.hero += 1
			if (cdf.hero >= 3) {
				gb.monster += 2
				cdf.hero = 0
				workingState = {
					...workingState,
					log: [...workingState.log, { round, text: `Garde aiguisée — le monstre gagne +2 MC.` }],
				}
			}
		} else {
			cdf.hero = 0
		}
		cdf.monster = 0
		const bestHeroHit = betterHit(state.bestHeroHit, band.quality)
		workingState = { ...workingState, consecutiveDefWins: cdf, gardeBonus: gb, bestHeroHit }

		// Lifecycle: onHeroWon (maladie − EN max, étreinte reset)
		if (hooks.onHeroWon) {
			workingState = hooks.onHeroWon(workingState, hero, session, rng, ecart)
		}

		const heroBase = maitriseDesCoups({ AG: hero.caracs.AG, DX: hero.caracs.DX, IG: hero.caracs.IG })
		const heroTier = tierOf(heroBase + hero.mcBonus)

		if (workingState.monster.pv <= 0) {
			// Lifecycle: onMonsterAt0PV (se-relève / fureur)
			if (hooks.onMonsterAt0PV) {
				workingState = hooks.onMonsterAt0PV(workingState, hero, session, rng)
			}
			if (workingState.outcome === 'hero-mort') return workingState
			if (workingState.monster.pv > 0) {
				// Monster revived (se-relève) — continue as ongoing
				return { ...workingState, phase: 'resolved', outcome: 'ongoing' }
			}
			const xp = computeVictoryXp(workingState, hero, workingState.bestHeroHit)
			return {
				...workingState,
				log: [...workingState.log, { round, text: `Monstre vaincu ! +${xp} XP.` }],
				phase: 'ended',
				outcome: 'hero-victory',
				pendingXp: xp,
				pendingLoot: workingState.monster.loot,
			}
		}

		if (checkMonsterFlees(workingState, heroTier, rng)) {
			const xp = computeVictoryXp(workingState, hero, workingState.bestHeroHit)
			return {
				...workingState,
				log: [...workingState.log, { round, text: `Le monstre prend la fuite ! +${xp} XP.` }],
				phase: 'ended',
				outcome: 'monster-fled',
				pendingXp: xp,
				pendingLoot: workingState.monster.loot,
			}
		}

		// onAfterRound (regen, chant-stressant, DoT)
		if (hooks.onAfterRound && workingState.outcome === 'ongoing') {
			workingState = hooks.onAfterRound(workingState, hero, session, rng)
		}
		return workingState
	}

	// ── Monster wins ───────────────────────────────────────────────────────────
	{
		const ecart = atMonster - atHero
		const band = ecartBand(ecart)

		const baseReduction = heroArmourEffective(session, state.heroArmorDegradation)
		// Passive: liche magie / rayon — hero armour provides no reduction
		const reduction =
			hooks.modifyHeroArmourReduction?.(baseReduction, workingState, hero, session) ?? baseReduction

		const damage = Math.max(
			0,
			Math.round(pfMonster(workingState.monster) * POSTURES[monsterPosture].damageFactor * band.factor - reduction),
		)

		const newHeroPv = workingState.heroPv - damage
		let heroArmourDeg = state.heroArmorDegradation
		if (band.degradesArmour && session.activeProtection !== null) heroArmourDeg += 1

		workingState = {
			...workingState,
			heroPv: newHeroPv,
			heroArmorDegradation: heroArmourDeg,
			log: [
				...workingState.log,
				{
					round,
					text: `Round ${round} — Monstre (AT ${atMonster}) vs Héros (AT ${atHero}). ${band.label} : −${damage} PV. [Héros : ${newHeroPv}]`,
				},
			],
		}

		// Garde aiguisée for monster
		let cdf = { ...state.consecutiveDefWins }
		let gb = { ...state.gardeBonus }
		if (monsterPosture === 'defensive') {
			cdf.monster += 1
			if (cdf.monster >= 3) {
				gb.hero += 2
				cdf.monster = 0
				workingState = {
					...workingState,
					log: [...workingState.log, { round, text: `Garde aiguisée — le héros gagne +2 MC.` }],
				}
			}
		} else {
			cdf.monster = 0
		}
		cdf.hero = 0
		workingState = { ...workingState, consecutiveDefWins: cdf, gardeBonus: gb }

		// Lifecycle: onHeroReceivedCrit (poison, venin, insensible soinsBloques)
		if (band.quality === 'critique' && hooks.onHeroReceivedCrit) {
			workingState = hooks.onHeroReceivedCrit(workingState, hero, session, rng)
		}

		// Lifecycle: onMonsterWon (renversement, force-écrasante, séisme, étreinte, vol, vol-de-vie)
		if (hooks.onMonsterWon) {
			workingState = hooks.onMonsterWon(workingState, hero, session, rng, ecart, band.quality, damage)
		}

		// A hook may have set a terminal outcome (étreinte ×2 kill).
		if (workingState.outcome !== 'ongoing') return workingState

		// Standard health check (E1 unconscious logic)
		const heroHealth = healthState(workingState.heroPv, hero.caracs.CA)
		if (heroHealth === 'inconscient') {
			const { damage: lastDmg, degradeArmour } = freeAssault(workingState, hero, session, rng)
			const finalPv = workingState.heroPv - lastDmg
			let finalArmourDeg = workingState.heroArmorDegradation
			if (degradeArmour && session.activeProtection !== null) finalArmourDeg += 1
			const finalHealth = healthState(finalPv, hero.caracs.CA)
			if (finalHealth !== 'ok') {
				return {
					...workingState,
					heroPv: finalPv,
					heroArmorDegradation: finalArmourDeg,
					log: [
						...workingState.log,
						{ round, text: `Inconscient — assaut final : −${lastDmg} PV. Le héros succombe.` },
					],
					phase: 'ended',
					outcome: 'hero-mort',
				}
			}
			return {
				...workingState,
				heroPv: 1,
				heroArmorDegradation: finalArmourDeg,
				log: [
					...workingState.log,
					{ round, text: `Inconscient — assaut final : −${lastDmg} PV. Le héros survit à 1 PV.` },
				],
				phase: 'ended',
				outcome: 'hero-survived-unconscious',
			}
		}
		if (heroHealth === 'mort') {
			return {
				...workingState,
				log: [...workingState.log, { round, text: `Le héros est mort.` }],
				phase: 'ended',
				outcome: 'hero-mort',
			}
		}

		// onAfterRound (regen, DoT, chant-stressant)
		if (hooks.onAfterRound && workingState.outcome === 'ongoing') {
			workingState = hooks.onAfterRound(workingState, hero, session, rng)
		}
		return workingState
	}
}

export function tryHeroFlee(
	state: CombatState,
	hero: HeroState,
	session: SessionState,
	rng: () => number = Math.random,
): CombatState {
	const { damage, degradeArmour } = freeAssault(state, hero, session, rng)
	const newHeroPv = state.heroPv - damage
	let heroArmourDeg = state.heroArmorDegradation
	if (degradeArmour && session.activeProtection !== null) heroArmourDeg += 1

	const log = [
		...state.log,
		{ round: state.round, text: `Fuite — assaut gratuit : −${damage} PV. [Héros : ${newHeroPv}]` },
	]

	const heroHealth = healthState(newHeroPv, hero.caracs.CA)
	if (heroHealth !== 'ok') {
		return {
			...state,
			heroPv: newHeroPv,
			heroArmorDegradation: heroArmourDeg,
			log: [...log, { round: state.round, text: `Le héros tombe en fuyant.` }],
			phase: 'ended',
			outcome: 'hero-mort',
		}
	}
	return {
		...state,
		heroPv: newHeroPv,
		heroArmorDegradation: heroArmourDeg,
		log: [...log, { round: state.round, text: `Le héros fuit.` }],
		phase: 'ended',
		outcome: 'hero-fled',
	}
}
