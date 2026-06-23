import type { Edge } from '../../brain/types'
import type { AdventureDocument, PlayPhase, PlayNode, SessionState, SessionEquipmentState } from '../types'
import type { HeroState } from '../types'
import { DEFAULT_WEAPON } from '../../brain/equipment'
import { rollHero } from './heroGen'

export const PE_PER_TRANSITION = 5

export function defaultSessionFields(): SessionEquipmentState {
	return {
		inventory: [],
		activeWeapon: DEFAULT_WEAPON,
		activeProtection: null,
		activeShield: false,
		armorDegradation: 0,
		activeMagicBonus: 0,
		activeSilverWeapon: false,
	}
}

export function findSommaire(adventure: AdventureDocument): string {
	const node = adventure.nodes.find((n) => n.kind === 'sommaire')
	if (!node) throw new Error('No sommaire node in adventure')
	return node.id
}

export function getNode(adventure: AdventureDocument, nodeId: string): PlayNode | null {
	return adventure.nodes.find((n) => n.id === nodeId) ?? null
}

export function listChoices(adventure: AdventureDocument, session: SessionState): Edge[] {
	return adventure.edges.filter((e) => e.from === session.currentNodeId && e.kind === 'choice')
}

export function determinePhase(adventure: AdventureDocument, session: SessionState): PlayPhase {
	const node = getNode(adventure, session.currentNodeId)
	if (!node) return 'playing'
	if (node.kind === 'mort') return 'death'
	if (node.endVictory) return 'victory'
	if (node.endFailure) return 'failure'
	return 'playing'
}

/** Create a session with an auto-rolled hero (used for quick starts; iter 1 default). */
export function createSession(
	adventure: AdventureDocument,
	rng: () => number = Math.random,
): SessionState {
	const hero = rollHero('Aventurier', rng)
	return createSessionFromHero(adventure, hero)
}

/** Create a session from a fully-specified hero (from the character creation screen). */
export function createSessionFromHero(adventure: AdventureDocument, hero: HeroState): SessionState {
	return {
		bookId: adventure.book.id,
		currentNodeId: findSommaire(adventure),
		hero,
		visitedNodes: [],
		...defaultSessionFields(),
	}
}

export function navigate(session: SessionState, targetNodeId: string): SessionState {
	const newPE = Math.min(session.hero.pe + PE_PER_TRANSITION, session.hero.peMax)
	return {
		...session,
		currentNodeId: targetNodeId,
		hero: { ...session.hero, pe: newPE },
	}
}
