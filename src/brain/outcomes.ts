import type { BadgeTone } from './components'
import type { RollOutcome } from './types'

/**
 * Roll-outcome registry — the single source for the two semantic outcomes
 * (KR-117). réussite / échec are the ONLY semantic colours in the domain, so
 * their label + Badge tone live here once and every consumer (monster combat
 * now; trap / skill-roll later) derives its UI from this map rather than
 * hardcoding « Réussite »/« Échec » or branching on the value. Placed in brain
 * because it is domain-wide and reused across features (KR-109 sibling).
 */
export interface RollOutcomeDescriptor {
	label: string
	/** Semantic Badge tone: réussite is good (green), échec is bad (red). */
	tone: Extract<BadgeTone, 'good' | 'bad'>
}

export const ROLL_OUTCOMES: Record<RollOutcome, RollOutcomeDescriptor> = {
	reussite: { label: 'Réussite', tone: 'good' },
	echec: { label: 'Échec', tone: 'bad' },
}
