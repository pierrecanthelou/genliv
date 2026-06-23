import type { PlayExport, PlayNode } from '../brain/utils/playExport'
import type { Characteristic } from '../brain/characteristics'

export type AdventureDocument = PlayExport
export type { PlayNode }

export interface HeroState {
	name: string
	caracs: Record<Characteristic, number>
	pvMax: number
	pv: number
	peMax: number
	pe: number
	mcBonus: number
	xp: number
}

export type PlayPhase = 'playing' | 'victory' | 'failure' | 'death'

export interface SessionState {
	bookId: string
	currentNodeId: string
	hero: HeroState
	visitedNodes: string[]
}
