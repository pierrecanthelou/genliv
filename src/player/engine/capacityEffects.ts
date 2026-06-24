/**
 * MONSTER CAPACITY HOOKS — play-mode behavior registry (§ H, iter 4).
 * KR-133: maps each MonsterCapacityId to lifecycle hooks — no if/switch on
 * capacity strings anywhere in the combat loop. KR-131: pure brain/ imports only.
 */
import type { Posture, HitQuality } from '../../brain/combat'
import { POSTURES, ecartBand, maitriseDesCoups } from '../../brain/combat'
import { enduranceMalus, healthState } from '../../brain/characteristics'
import { rollDice, resolveChallenge } from '../../brain/challenge'
import { PROTECTIONS } from '../../brain/equipment'
import type { MonsterCapacityId } from '../../brain/monsterCapacities'
import type { CombatState } from './combatTypes'
import type { HeroState, SessionState } from '../types'

// ─── Hook signatures ───────────────────────────────────────────────────────────

type StateFn = (state: CombatState, hero: HeroState, session: SessionState, rng: () => number) => CombatState

export interface CapacityHooks {
	/** Fires immediately after startCombat initialises state (piques, malédiction). */
	onStartCombat?: StateFn
	/**
	 * Fires once at the END of each round, only when outcome is still 'ongoing'.
	 * DoT, regen, rayon bonus effects. May set outcome to 'hero-mort'.
	 */
	onAfterRound?: StateFn
	/**
	 * Fires after the MONSTER wins a round and damage is applied to heroPv.
	 * Receives the final `damage` dealt this round (after armour, may be 0).
	 */
	onMonsterWon?: (
		state: CombatState,
		hero: HeroState,
		session: SessionState,
		rng: () => number,
		ecart: number,
		quality: HitQuality,
		damage: number,
	) => CombatState
	/** Fires when monster.pv first reaches ≤ 0 (before victory is declared). */
	onMonsterAt0PV?: StateFn
	/** Fires when the MONSTER lands a 'critique' quality hit on the hero. */
	onHeroReceivedCrit?: StateFn
	/** Fires after the HERO wins a round (deals damage to monster, mon.pv still > 0 or = 0). */
	onHeroWon?: (state: CombatState, hero: HeroState, session: SessionState, rng: () => number, ecart: number) => CombatState
	/**
	 * Passive modifier applied to the monster's damage factor (×2 for précise, ×1 for normale,
	 * ×0 for défensive). Called before multiplying by rawPf. Insensible: précise → ×1.
	 */
	modifyMonsterDamageFactor?: (factor: number, heroPosture: Posture, state: CombatState) => number
	/**
	 * Passive modifier applied to the final damage the hero deals to the monster (after
	 * armour subtraction). Intangible: non-magic weapon → min 1.
	 */
	modifyMonsterDamageReceived?: (damage: number, state: CombatState, hero: HeroState, session: SessionState) => number
	/**
	 * Passive modifier applied to the hero's armour reduction (before subtraction from
	 * monster's raw damage). Liche magie / Tyrannœil rayon: return 0 to bypass armour.
	 */
	modifyHeroArmourReduction?: (reduction: number, state: CombatState, hero: HeroState, session: SessionState) => number
}

// ─── Shared helpers (pure, no React) ─────────────────────────────────────────

function heroArmour(session: SessionState, heroArmorDeg: number): number {
	const base = session.activeProtection ? PROTECTIONS[session.activeProtection].reduction : 0
	return Math.max(0, base + session.permanentArmorBonus - heroArmorDeg)
}

/** Compute hero effective MC at the current state (for hooks that need AT). */
function heroMcForHooks(state: CombatState, hero: HeroState, session: SessionState): number {
	const base = maitriseDesCoups({ AG: hero.caracs.AG, DX: hero.caracs.DX, IG: hero.caracs.IG })
	const fatigue = enduranceMalus(state.heroPe, hero.caracs.EN)
	// Mirror combatEngine.ts heroMcEffective: magic bonus is 0 during disarm round.
	const magicBonus = state.effects.disarmedThisRound ? 0 : session.activeMagicBonus
	return base + hero.mcBonus + state.gardeBonus.hero + fatigue + magicBonus
}

function monsterMcForHooks(state: CombatState): number {
	const fatigue = state.monster.immuneToFatigue ? 0 : enduranceMalus(state.monster.pe, state.monster.EN)
	return state.monster.mc + state.gardeBonus.monster + fatigue
}

/**
 * Run a free assault: monster Normale vs hero Défensive.
 * Used by fureur (orque last gasp) and internally by the engine for E1 / flee.
 */
function runFreeAssault(
	state: CombatState,
	hero: HeroState,
	session: SessionState,
	rng: () => number,
): { damage: number; log: string } {
	const heroMc = heroMcForHooks(state, hero, session)
	const monsterMc = monsterMcForHooks(state)
	const atMonster = POSTURES['normale'].computeAT(monsterMc, { shield: false, rng })
	const atHero = POSTURES['defensive'].computeAT(heroMc, { shield: session.activeShield, rng })
	if (atMonster <= atHero) return { damage: 0, log: 'manqué' }
	const ecart = atMonster - atHero
	const band = ecartBand(ecart)
	const reduction = heroArmour(session, state.heroArmorDegradation)
	const pfMon = (state.monster.FO + state.monster.mc / 2) * state.monster.weaponMultiplier
	const damage = Math.max(0, Math.round(pfMon * POSTURES['normale'].damageFactor * band.factor - reduction))
	return { damage, log: `${band.label} : −${damage} PV` }
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CAPACITY_HOOKS: Record<MonsterCapacityId, CapacityHooks> = {
	// ── No capacity ──────────────────────────────────────────────────────────────
	aucune: {},

	// ── Maladie (Rat géant) — −1 EN max si vaincu avec Écart > 4 ────────────────
	maladie: {
		onHeroWon: (state, _hero, _session, _rng, ecart) => {
			if (ecart <= 4) return state
			return {
				...state,
				pendingEnMaxDelta: state.pendingEnMaxDelta - 1,
				log: [...state.log, { round: state.round, text: `Maladie — héros perd 1 EN max permanent.` }],
			}
		},
	},

	// ── Vol (Gobelin) — vole un objet mineur si victoire au round 1 ──────────────
	vol: {
		onMonsterWon: (state, _hero, _session, _rng, _ecart, _quality, _damage) => {
			if (state.round !== 1 || state.pendingVol) return state
			return {
				...state,
				pendingVol: true,
				log: [...state.log, { round: state.round, text: `Vol — le Gobelin dérobe un objet.` }],
			}
		},
	},

	// ── Pas d'endurance — handled via CREATURE_TYPES.immuneToFatigue ─────────────
	'pas-endurance': {},

	// ── Se relève (Zombie) — à 0 PV, revient à 1 PV sur un jet 5–6 ──────────────
	'se-releve': {
		onMonsterAt0PV: (state, _hero, _session, rng) => {
			if (state.effects.zombieRevived) return state
			const roll = rollDice(1, 6, rng)
			if (roll < 5) return state
			return {
				...state,
				monster: { ...state.monster, pv: 1 },
				effects: { ...state.effects, zombieRevived: true },
				log: [
					...state.log,
					{ round: state.round, text: `Se relève — jet ${roll} : le zombie repasse à 1 PV !` },
				],
			}
		},
	},

	// ── Chant stressant (Harpie) — −1 PE héros supplémentaire par round ──────────
	'chant-stressant': {
		onAfterRound: (state, _hero, _session, _rng) => {
			const newPe = Math.max(0, state.heroPe - 1)
			return {
				...state,
				heroPe: newPe,
				log: [
					...state.log,
					{ round: state.round, text: `Chant stressant — héros −1 PE supplémentaire (PE : ${newPe}).` },
				],
			}
		},
	},

	// ── Fureur (Orque) — assaut désespéré gratuit avant de mourir ────────────────
	fureur: {
		onMonsterAt0PV: (state, hero, session, rng) => {
			if (state.effects.fureurUsed) return state
			const { damage, log: logText } = runFreeAssault(state, hero, session, rng)
			const newHeroPv = state.heroPv - damage
			const newState: CombatState = {
				...state,
				heroPv: newHeroPv,
				effects: { ...state.effects, fureurUsed: true },
				log: [...state.log, { round: state.round, text: `Fureur (Orque) — assaut désespéré : ${logText}.` }],
			}
			if (healthState(newHeroPv, hero.caracs.CA) !== 'ok') {
				return { ...newState, phase: 'ended', outcome: 'hero-mort' }
			}
			return newState
		},
	},

	// ── Tacticien (Hobgobelin) — V1: groups not modelled ─────────────────────────
	tacticien: {},

	// ── Poison (Araignée géante) — DoT 1 dégât/round × 1D4 rounds sur critique ───
	poison: {
		onHeroReceivedCrit: (state, _hero, _session, rng) => {
			if (state.effects.poisonRoundsLeft > 0) return state
			const rounds = rollDice(1, 4, rng)
			return {
				...state,
				effects: { ...state.effects, poisonRoundsLeft: rounds, poisonDmgPerRound: 1 },
				log: [
					...state.log,
					{ round: state.round, text: `Poison — ${rounds} rounds de −1 PV/round.` },
				],
			}
		},
		onAfterRound: applyDotRound,
	},

	// ── Renversement (Minotaure) — −2 AT au prochain tour si Écart > 3 ───────────
	renversement: {
		onMonsterWon: (state, _hero, _session, _rng, ecart, _quality, _damage) => {
			if (ecart <= 3) return state
			return {
				...state,
				effects: { ...state.effects, renversementMalus: 2 },
				log: [
					...state.log,
					{ round: state.round, text: `Renversement — héros −2 AT au prochain round.` },
				],
			}
		},
	},

	// ── Étreinte (Ours) — 3e victoire consécutive : ×2 dégâts ───────────────────
	etreinte: {
		onMonsterWon: (state, hero, _session, _rng, _ecart, _quality, damage) => {
			const newCount = state.effects.etreinte + 1
			if (state.effects.etreinte < 2) {
				return { ...state, effects: { ...state.effects, etreinte: newCount } }
			}
			// 3rd consecutive win — double the damage already applied
			const extraDmg = damage
			const newHeroPv = state.heroPv - extraDmg
			const newState: CombatState = {
				...state,
				heroPv: newHeroPv,
				effects: { ...state.effects, etreinte: 0 },
				log: [
					...state.log,
					{
						round: state.round,
						text: `Étreinte — 3e victoire consécutive : ×2 dégâts (−${extraDmg} PV supplémentaires).`,
					},
				],
			}
			if (healthState(newHeroPv, hero.caracs.CA) !== 'ok') {
				return { ...newState, phase: 'ended', outcome: 'hero-mort' }
			}
			return newState
		},
		onHeroWon: (state, _hero, _session, _rng, _ecart) => ({
			...state,
			effects: { ...state.effects, etreinte: 0 },
		}),
	},

	// ── Venin (Serpent géant) — DoT 2 dégâts/round × 3 rounds sur critique ───────
	venin: {
		onHeroReceivedCrit: (state, _hero, _session, _rng) => {
			if (state.effects.poisonRoundsLeft > 0) return state
			return {
				...state,
				effects: { ...state.effects, poisonRoundsLeft: 3, poisonDmgPerRound: 2 },
				log: [
					...state.log,
					{ round: state.round, text: `Venin — 3 rounds de −2 PV/round.` },
				],
			}
		},
		onAfterRound: applyDotRound,
	},

	// ── Malédiction (Sorcière) — round 1: lâche arme sur 1D6 (1–3) ──────────────
	malediction: {
		onStartCombat: (state, _hero, _session, rng) => {
			const roll = rollDice(1, 6, rng)
			if (roll > 3) return state
			return {
				...state,
				effects: { ...state.effects, disarmedThisRound: true },
				log: [
					...state.log,
					{
						round: 0,
						text: `Malédiction — jet ${roll} : le héros lâche son arme, round 1 défensif forcé !`,
					},
				],
			}
		},
	},

	// ── Regard pétrifiant — capacité disponible pour les monstres custom ; non utilisée dans le bestiaire de base
	'regard-petrifiant': {},

	// ── Intangible (Spectre) — max 1 dégât par coup d'arme non-magique ───────────
	intangible: {
		modifyMonsterDamageReceived: (damage, _state, _hero, session) => {
			if (session.activeMagicBonus > 0) return damage
			return Math.min(damage, 1)
		},
	},

	// ── Force écrasante (Géant des pierres) — détruit 1 pt armure même si paré ───
	'force-ecrasante': {
		onMonsterWon: (state, _hero, _session, _rng, _ecart, _quality, _damage) => ({
			...state,
			heroArmorDegradation: state.heroArmorDegradation + 1,
			log: [
				...state.log,
				{ round: state.round, text: `Force écrasante — 1 pt d'armure du héros détruit.` },
			],
		}),
	},

	// ── Insensible (Momie) — précise → ×1 ; soins bloqués sur critique ───────────
	insensible: {
		modifyMonsterDamageFactor: (factor, heroPosture, _state) => {
			if (heroPosture === 'precise') return 1
			return factor
		},
		onHeroReceivedCrit: (state, _hero, _session, _rng) => ({
			...state,
			effects: { ...state.effects, soinsBloques: true },
			log: [
				...state.log,
				{
					round: state.round,
					text: `Insensible (Momie) — coup critique : soins bloqués pour le reste du combat.`,
				},
			],
		}),
	},

	// ── Piques (Manticore) — 1D3 piques (AT 5, Dégâts 3) avant le combat ────────
	piques: {
		onStartCombat: (state, hero, session, rng) => {
			if (state.effects.piquesUsed) return state
			const numPiques = rollDice(1, 3, rng)
			let s: CombatState = { ...state, effects: { ...state.effects, piquesUsed: true } }
			for (let i = 0; i < numPiques; i++) {
				const mc = heroMcForHooks(s, hero, session)
				const atHero = POSTURES['defensive'].computeAT(mc, { shield: session.activeShield, rng })
				const mantiAT = 5
				if (mantiAT > atHero) {
					const reduction = heroArmour(session, s.heroArmorDegradation)
					const dmg = Math.max(0, 3 - reduction)
					s = {
						...s,
						heroPv: s.heroPv - dmg,
						log: [
							...s.log,
							{ round: 0, text: `Piques ${i + 1}/${numPiques} — −${dmg} PV (AT ${mantiAT} > ${atHero}).` },
						],
					}
				} else {
					s = {
						...s,
						log: [
							...s.log,
							{ round: 0, text: `Piques ${i + 1}/${numPiques} — manqué (AT ${mantiAT} ≤ ${atHero}).` },
						],
					}
				}
			}
			return s
		},
	},

	// ── Régénération (Troll) — +3 PV/round (arrêtée par feu/acide, V1 non modélisé)
	regeneration: {
		onAfterRound: (state, _hero, _session, _rng) => {
			const regen = 3
			const newPv = Math.min(state.monster.pvMax, state.monster.pv + regen)
			return {
				...state,
				monster: { ...state.monster, pv: newPv },
				log: [
					...state.log,
					{
						round: state.round,
						text: `Régénération — monstre +${regen} PV (${newPv}/${state.monster.pvMax}).`,
					},
				],
			}
		},
	},

	// ── Régénération argentée (Loup-Garou) — +2 PV/round ; armure ignorée argent ─
	// bypassedBySilver is handled in combatEngine via monster.bypassedBySilver.
	'regeneration-argentee': {
		onAfterRound: (state, _hero, _session, _rng) => {
			const regen = 2
			const newPv = Math.min(state.monster.pvMax, state.monster.pv + regen)
			return {
				...state,
				monster: { ...state.monster, pv: newPv },
				log: [
					...state.log,
					{
						round: state.round,
						text: `Régénération argentée — monstre +${regen} PV (${newPv}/${state.monster.pvMax}).`,
					},
				],
			}
		},
	},

	// ── Séisme (Géant) — chaque coup encaissé force un jet AG TC3 ────────────────
	seisme: {
		onMonsterWon: (state, hero, _session, rng, _ecart, _quality, damage) => {
			if (damage <= 0) return state
			const result = resolveChallenge('TC3', hero.caracs.AG, rng)
			if (result.success) {
				return {
					...state,
					log: [
						...state.log,
						{ round: state.round, text: `Séisme — jet AG TC3 réussi : le héros reste debout.` },
					],
				}
			}
			return {
				...state,
				effects: { ...state.effects, seismeStunned: true },
				log: [
					...state.log,
					{
						round: state.round,
						text: `Séisme — jet AG TC3 raté : le héros tombe, prochain round défensif forcé.`,
					},
				],
			}
		},
	},

	// ── Magie (Liche) — ignore armure ; sort 1D4 : 3–4 = drain −1D4 PV max ──────
	magie: {
		modifyHeroArmourReduction: (_reduction) => 0,
		onAfterRound: (state, _hero, _session, rng) => {
			const roll = rollDice(1, 4, rng)
			if (roll <= 2) {
				return {
					...state,
					log: [
						...state.log,
						{ round: state.round, text: `Magie (Liche) — sort niveau ${roll} : effets normaux.` },
					],
				}
			}
			const drain = rollDice(1, 4, rng)
			return {
				...state,
				pendingPvMaxDelta: state.pendingPvMaxDelta - drain,
				log: [
					...state.log,
					{ round: state.round, text: `Magie (Liche) — sort niveau ${roll} : drain −${drain} PV max.` },
				],
			}
		},
	},

	// ── Rayon (Tyrannœil) — ignore armure ; rayon 1D4 : effets multiples ─────────
	rayon: {
		modifyHeroArmourReduction: (_reduction) => 0,
		onAfterRound: (state, hero, _session, rng) => {
			const roll = rollDice(1, 4, rng)
			if (roll === 1) {
				const newPv = state.heroPv - 2
				const newState: CombatState = {
					...state,
					heroPv: newPv,
					log: [
						...state.log,
						{ round: state.round, text: `Rayon (1) — +2 dégâts : −2 PV héros.` },
					],
				}
				if (healthState(newPv, hero.caracs.CA) !== 'ok') {
					return { ...newState, phase: 'ended', outcome: 'hero-mort' }
				}
				return newState
			}
			if (roll === 2) {
				return {
					...state,
					effects: { ...state.effects, renversementMalus: state.effects.renversementMalus + 2 },
					log: [
						...state.log,
						{ round: state.round, text: `Rayon (2) — −2 AT héros au prochain round.` },
					],
				}
			}
			if (roll === 3) {
				return {
					...state,
					pendingEnMaxDelta: state.pendingEnMaxDelta - 2,
					log: [
						...state.log,
						{ round: state.round, text: `Rayon (3) — −2 EN permanent.` },
					],
				}
			}
			// roll === 4: mort instantanée (V1 simplification: −3 PV supplémentaires)
			const newPv = state.heroPv - 3
			const newState: CombatState = {
				...state,
				heroPv: newPv,
				log: [
					...state.log,
					{ round: state.round, text: `Rayon (4) — rayon désintégrant : −3 PV héros.` },
				],
			}
			if (healthState(newPv, hero.caracs.CA) !== 'ok') {
				return { ...newState, phase: 'ended', outcome: 'hero-mort' }
			}
			return newState
		},
	},

	// ── Vol de vie (Vampire) — récupère autant de PV qu'infligés ─────────────────
	'vol-de-vie': {
		onMonsterWon: (state, _hero, _session, _rng, _ecart, _quality, damage) => {
			if (damage <= 0) return state
			const heal = damage
			const newPv = Math.min(state.monster.pvMax, state.monster.pv + heal)
			return {
				...state,
				monster: { ...state.monster, pv: newPv },
				log: [
					...state.log,
					{
						round: state.round,
						text: `Vol de vie — monstre +${heal} PV (${newPv}/${state.monster.pvMax}).`,
					},
				],
			}
		},
	},
}

// ─── Shared DoT helper (poison + venin share identical onAfterRound logic) ───

function applyDotRound(
	state: CombatState,
	hero: HeroState,
	_session: SessionState,
	_rng: () => number,
): CombatState {
	if (state.effects.poisonRoundsLeft <= 0) return state
	const dmg = state.effects.poisonDmgPerRound
	const newPv = state.heroPv - dmg
	const rounds = state.effects.poisonRoundsLeft - 1
	const newState: CombatState = {
		...state,
		heroPv: newPv,
		effects: { ...state.effects, poisonRoundsLeft: rounds },
		log: [
			...state.log,
			{
				round: state.round,
				text: `DoT — −${dmg} PV (${rounds} round${rounds !== 1 ? 's' : ''} restant${rounds !== 1 ? 's' : ''}).`,
			},
		],
	}
	if (healthState(newPv, hero.caracs.CA) !== 'ok') {
		return { ...newState, phase: 'ended', outcome: 'hero-mort' }
	}
	return newState
}
