/**
 * COMBAT REPLAY ENGINE — deterministic orchestration of combat state from session storage.
 *
 * A combat is FULLY DEFINED by:
 *  - graine_alea + horloge.tour (RNG seed, deterministic branching)
 *  - monstre_ref (which monster from bestiary)
 *  - postures[] (player's chosen postures per round, in order)
 *
 * None of these are snapshots: replay from session.combat computes the entire
 * CombatState from scratch each render, avoiding desync when engine rules change
 * (KR-292).
 */

import { resoudreRencontre, type BilanCombat, type EtatSession } from '../../brain/dossier/session'
import type { Dossier } from '../../brain/dossier/types'
import { evenementARencontrer } from '../../brain/dossier/evaluate'
import { monstreDeLaReference } from '../../brain/dossier/monstre'
import { creerRng } from '../../brain/dossier/alea'
import { DEFAULT_WEAPON } from '../../brain/equipment'
import { startCombat, resolveCombatRound, tryHeroFlee } from './combatEngine'
import type { CombatState } from './combatTypes'
import type { SessionState } from '../types'

/**
 * OUTCOME OF REPLAY ATTEMPT — either a valid CombatState ready for rendering,
 * or a rejection reason if preconditions failed.
 */
export type RejeuCombat =
	| { readonly ok: true; readonly etat: CombatState }
	| { readonly ok: false; readonly refus: 'monstre_inconnu' | 'heros_absent' }

/**
 * Replay a combat from persistent storage (session.combat = {monstre_ref, postures[]}).
 *
 * PURE: deterministic given session. RNG seed is:
 *   `creerRng(graine_alea, 'combat', horloge.tour)` — all rounds within same combat
 *   share the same seed/domain, so replay from an empty postures[] yields identical
 *   CombatState after each subsequent posture is added.
 *
 * PRECONDITIONS:
 *  - session.combat must exist (caller checks; will return unchanged session if not)
 *  - monstre_ref must resolve via monstreDeLaReference
 *  - hero must exist (session.heros)
 *
 * FLOW:
 *  1. Validate inputs (hero, monster).
 *  2. startCombat(...) initializes CombatState.
 *  3. For each posture in session.combat.postures[]:
 *     - pickMonsterPosture(...) — derive monster's random posture for this round
 *     - resolveCombatRound(...) — resolve assault, apply damage, check outcome
 *     - Stop if outcome terminal (not 'ongoing')
 *  4. If outcome still 'ongoing' and combat.fuite === true: tryHeroFlee(...).
 *  5. Return completed CombatState.
 *
 * HALTING: stops when postures[] is exhausted OR outcome becomes terminal.
 * Flee after postures consumes at most one more RNG draw (freeAssault).
 * A prolonged stalemate (3+ null assaults) will run to array end; that's expected.
 */
export function rejouerCombat(s: EtatSession): RejeuCombat {
	const { combat, heros } = s
	if (!combat || !heros) {
		return { ok: false, refus: 'heros_absent' }
	}

	const config = monstreDeLaReference(combat.monstre_ref)
	if (!config) {
		return { ok: false, refus: 'monstre_inconnu' }
	}

	const sessionState: SessionState = {
		bookId: '',
		currentNodeId: '',
		hero: heros,
		visitedNodes: [],
		inventory: [],
		activeWeapon: DEFAULT_WEAPON,
		activeProtection: null,
		activeShield: false,
		armorDegradation: 0,
		activeMagicBonus: 0,
		activeSilverWeapon: false,
		permanentArmorBonus: 0,
	}

	const rng = creerRng(s.graine_alea, 'combat', s.horloge.tour)
	let state = startCombat(config, heros, sessionState, rng)

	// Replay each round from stored postures
	for (const heroPosture of combat.postures) {
		state = resolveCombatRound(state, heros, sessionState, heroPosture, rng)

		// Terminal outcome: stop early
		if (state.outcome !== 'ongoing') {
			break
		}
	}

	// Apply flee if flagged and still ongoing (not already terminal from postures)
	if (state.outcome === 'ongoing' && combat.fuite === true) {
		state = tryHeroFlee(state, heros, sessionState, rng)
	}

	return { ok: true, etat: state }
}

/**
 * Extract combat outcome (BilanCombat) from CombatState, if terminal.
 *
 * Returns undefined while outcome is 'ongoing' — the combat is not yet resolved.
 * Once terminal, returns the bilan for persistence and session mutation
 * (crediting XP, updating PV/PE, removing combat from session).
 */
export function bilanDe(e: CombatState): BilanCombat | undefined {
	if (e.outcome === 'ongoing') {
		return undefined
	}

	return {
		issue: e.outcome,
		pv: e.heroPv,
		pe: e.heroPe,
		xp: e.pendingXp,
		pv_max_delta: e.pendingPvMaxDelta,
		pe_max_delta: e.pendingEnMaxDelta,
	}
}

export function ouvrirRencontreSiDue(dossier: Dossier, session: EtatSession): EtatSession {
	const rencontre = evenementARencontrer(dossier, session)

	if (!rencontre) {
		return session
	}

	return resoudreRencontre(session, rencontre)
}
