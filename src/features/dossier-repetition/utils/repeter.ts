/**
 * Simulation engine for synthetic replay — pure, no IA, no fetch.
 *
 * CHAIN (order matters):
 * 1. controlerDossier(d).jouable — sine qua non
 * 2. ouvrirSession + fixerHeros(creerHerosSynthetique)
 * 3. finAtteinte at step 0
 * 4. Loop step=1..PAS_MAX: choisirDestination → executerCommande → ouvrirRencontreSiDue → combat loop → finAtteinte
 *
 * PURE: no service calls, no effects, no RNG except creerRng (injectable, seeded).
 * Caller supplies dossier once; repeter(dossier, seed) is wholly deterministic.
 *
 * KR-309: zero IA calls, zero fetch, zero play-mode imports.
 * KR-310: rapport never stored (KR-013) — recalc on every call.
 * KR-313: features/dossier-repetition/utils/, not brain/ (no brain→player edge).
 */

import {
	CHARACTERISTIC_VALUES,
	controlerDossier,
	creerRng,
	destinationsPossibles,
	executerCommande,
	ouvrirSession,
	fixerHeros,
	jouerPosture,
	cloreCombat,
	type Dossier,
	type Controle,
} from '../../../brain'
import { buildHeroFromCreation, emptyAssignment, rollCreationPool } from '../../../player/engine/charCreation'
import { finAtteinte } from '../../../player/engine/fin'
import { ouvrirRencontreSiDue, rejouerCombat, bilanDe } from '../../../player/engine/rencontre'
import type { HeroState } from '../../../player/types'

/** Maximum number of steps before stopping (KR-315: pinned by test). */
export const PAS_MAX = 20

/** Maximum number of combat rounds before stopping (KR-315: pinned by test). */
export const ROUNDS_MAX = 50

/** Why the synthetic player stopped. */
export type MotifArret = 'fin' | 'impasse' | 'mort' | 'combat_sans_issue' | 'pas_max'

/** Report of a single run: outcome + evidence. */
export type RapportRepetition = {
	readonly graine: number
	/** 0 = avant la boucle ; pour impasse : le pas tenté, non accompli. */
	readonly pas: number
	readonly lieu_id: string
	readonly combats_traverses: number
	/** Lieux visités durant ce parcours (SSOT: session.monde.lieux_visites) */
	readonly lieux_visites: readonly string[]
} & (
	| { readonly arret: 'fin'; readonly fin_id: string }
	| { readonly arret: 'mort'; readonly monstre_ref: string }
	| { readonly arret: 'combat_sans_issue'; readonly monstre_ref: string }
	| { readonly arret: 'impasse' }
	| { readonly arret: 'pas_max' }
)

/** Outcome: report or refusal. */
export type ResultatRepetition =
	| { readonly ok: true; readonly rapport: RapportRepetition }
	| { readonly ok: false; readonly refus: 'dossier_injouable'; readonly bloquant: Controle }

/**
 * Create a synthetic hero for replay — deterministic, no human input.
 *
 * SPEC (plan §7, NIA):
 *  - rollCreationPool(rng) → 8 rolls
 *  - Sequential assignment: rolls[i] → CHARACTERISTIC_VALUES[i]
 *  - 1D4 bonus: distributed one by one to the lowest characteristic (first if tied)
 *  - buildHeroFromCreation('Héros synthétique', pool, assignment)
 *
 * Private to this module, exported for test only.
 */
export function creerHerosSynthetique(rng: () => number): HeroState {
	const pool = rollCreationPool(rng)
	const assignment = emptyAssignment()

	for (let i = 0; i < CHARACTERISTIC_VALUES.length; i++) {
		assignment.rollIndices[CHARACTERISTIC_VALUES[i]] = i
	}

	for (let b = 0; b < pool.bonusPool; b++) {
		let lowestChar = CHARACTERISTIC_VALUES[0]
		let lowestValue =
			pool.rolls[assignment.rollIndices[CHARACTERISTIC_VALUES[0]]] + assignment.bonus[CHARACTERISTIC_VALUES[0]]

		for (const c of CHARACTERISTIC_VALUES) {
			const value = pool.rolls[assignment.rollIndices[c]] + assignment.bonus[c]
			if (value < lowestValue) {
				lowestValue = value
				lowestChar = c
			}
		}

		assignment.bonus[lowestChar]++
	}

	return buildHeroFromCreation('Héros synthétique', pool, assignment)
}

/**
 * Pick one destination at random from the accessible list.
 *
 * SPEC (plan §7):
 *  - One draw from rng()
 *  - Empty list → null (impasse)
 *  - No rotation, no filtering: first successful draw wins
 *
 * Local to this module, not exported.
 */
function choisirDestination(accessibles: ReturnType<typeof destinationsPossibles>, rng: () => number): string | null {
	if (accessibles.length === 0) return null
	const index = Math.floor(rng() * accessibles.length)
	return accessibles[index]
}

/**
 * Run synthetic replay: 1 seed, deterministic path, 20 steps max.
 *
 * PURE function, no service calls except those injected.
 */
export function repeter(dossier: Dossier, graine: number): ResultatRepetition {
	// 1. Check playability
	const controle = controlerDossier(dossier)
	if (!controle.jouable) {
		return {
			ok: false,
			refus: 'dossier_injouable',
			bloquant: controle.controles.find((c) => c.niveau === 'bloquant')!,
		}
	}

	// 2. Open session + set synthetic hero
	const resultatOuverture = ouvrirSession(dossier, { graine_alea: graine })
	if (!resultatOuverture.ok) {
		// Invariant: controlerDossier.jouable === true implies ouvrirSession succeeds
		// (controles.ts:170,805 checks the same MARQUEUR_A_ECRIRE predicate as session.ts:570).
		throw new Error('repeter: ouvrirSession failed after controlerDossier.jouable — invariant broken')
	}

	const heros = creerHerosSynthetique(creerRng(graine, 'heros', 0))
	let session = fixerHeros(resultatOuverture.session, heros)

	// 3. Check fin at step 0
	let fin = finAtteinte(dossier, session)
	if (fin) {
		return {
			ok: true,
			rapport: {
				graine,
				pas: 0,
				lieu_id: session.monde.lieu_courant,
				combats_traverses: 0,
				lieux_visites: session.monde.lieux_visites,
				arret: 'fin',
				fin_id: fin.fin_id,
			},
		}
	}

	// 4. Loop: step 1..PAS_MAX
	let combats_traverses = 0
	for (let pas = 1; pas <= PAS_MAX; pas++) {
		// Pick destination
		const accessibles = destinationsPossibles(dossier, session)
		const destination = choisirDestination(accessibles, creerRng(graine, 'repetition', pas))

		// No access: impasse
		if (!destination) {
			return {
				ok: true,
				rapport: {
					graine,
					pas,
					lieu_id: session.monde.lieu_courant,
					combats_traverses,
					lieux_visites: session.monde.lieux_visites,
					arret: 'impasse',
				},
			}
		}

		// Execute: refusal → impasse
		const commande = { commande: 'aller' as const, cibles: [destination] }
		const resultat = executerCommande(dossier, session, commande)
		if (!resultat.ok) {
			return {
				ok: true,
				rapport: {
					graine,
					pas,
					lieu_id: session.monde.lieu_courant,
					combats_traverses,
					lieux_visites: session.monde.lieux_visites,
					arret: 'impasse',
				},
			}
		}
		session = resultat.session

		// KR-303 : finAtteinte rend undefined sous combat, donc combat testé avant
		session = ouvrirRencontreSiDue(dossier, session)

		// Combat loop (KR-303, KR-304, KR-312, KR-315)
		if (session.combat) {
			// Play up to ROUNDS_MAX postures on a local copy
			let combatSession = session
			for (let round = 0; round < ROUNDS_MAX; round++) {
				combatSession = jouerPosture(combatSession, 'normale')
			}

			// Replay combat with all stored postures (O(N), not O(N²))
			const rejeu = rejouerCombat(combatSession)
			if (!rejeu.ok) {
				throw new Error(`repeter: rejouerCombat failed — invariant broken (${rejeu.refus})`)
			}

			// Extract outcome
			const bilan = bilanDe(rejeu.etat)

			// No bilan → combat ongoing after ROUNDS_MAX rounds
			if (!bilan) {
				return {
					ok: true,
					rapport: {
						graine,
						pas,
						lieu_id: session.monde.lieu_courant,
						combats_traverses,
						lieux_visites: session.monde.lieux_visites,
						arret: 'combat_sans_issue',
						monstre_ref: session.combat.monstre_ref,
					},
				}
			}

			// Hero death → stop, don't call cloreCombat (KR-312)
			if (bilan.issue === 'hero-mort') {
				return {
					ok: true,
					rapport: {
						graine,
						pas,
						lieu_id: session.monde.lieu_courant,
						combats_traverses,
						lieux_visites: session.monde.lieux_visites,
						arret: 'mort',
						monstre_ref: session.combat.monstre_ref,
					},
				}
			}

			// Survival → apply outcome, continue journey
			session = cloreCombat(session, bilan)
			combats_traverses++
		}

		fin = finAtteinte(dossier, session)
		if (fin) {
			return {
				ok: true,
				rapport: {
					graine,
					pas,
					lieu_id: session.monde.lieu_courant,
					combats_traverses,
					lieux_visites: session.monde.lieux_visites,
					arret: 'fin',
					fin_id: fin.fin_id,
				},
			}
		}
	}

	// PAS_MAX reached without exit
	return {
		ok: true,
		rapport: {
			graine,
			pas: PAS_MAX,
			lieu_id: session.monde.lieu_courant,
			combats_traverses,
			lieux_visites: session.monde.lieux_visites,
			arret: 'pas_max',
		},
	}
}
