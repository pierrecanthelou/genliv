/**
 * COMBAT PROJECTION — transforms in-game combat state into IA input for commentary.
 *
 * Produces a whitelist of only observable facts about the latest assault round,
 * never internal game mechanics (round numbers, postures, full histories).
 */

import type { CombatState } from '../../../player/engine/combatTypes'
import type { ProjectionAssaut } from '../../../brain/copilote/types'

/**
 * Project the latest resolved assault into IA input.
 *
 * @param etat Current combat state
 * @param heroPvMax Hero's max PV (from session context, not engine)
 * @param monstreRef Bestiary reference ID (e.g. 'bestiaire.gobelin'), from session.combat.monstre_ref
 * @returns Projection ready for IA commentateur, or null if no assault to project
 */
export function projeterAssaut(etat: CombatState, heroPvMax: number, monstreRef: string): ProjectionAssaut | null {
	if (etat.dernierAssaut === undefined) return null

	const issue: Exclude<typeof etat.outcome, 'ongoing' | 'hero-fled'> | undefined =
		etat.outcome === 'ongoing' || etat.outcome === 'hero-fled' ? undefined : etat.outcome

	return {
		vainqueur: etat.dernierAssaut.vainqueur,
		qualite: etat.dernierAssaut.qualite,
		monstre: monstreRef,
		heroPv: etat.heroPv,
		heroPvMax,
		monstrePv: etat.monster.pv,
		monstrePvMax: etat.monster.pvMax,
		issue,
	}
}
