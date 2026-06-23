import { useState, useCallback } from 'react'
import type { Edge, GameObject } from '../../brain/types'
import type { AdventureDocument, PlayPhase, SessionState, HeroState } from '../types'
import type { CreationPool } from '../engine/charCreation'
import { rollCreationPool } from '../engine/charCreation'
import { createSessionFromHero, navigate, listChoices, determinePhase, PE_PER_TRANSITION } from '../engine/sessionEngine'
import { saveSession, loadSession, clearSession } from '../utils/persist'

export type UsePlayRuntimePhase = 'start' | 'creating' | 'playing'

export interface FinishCombatOpts {
	updatedPv: number
	updatedPe: number
	xp: number
	armorDeg: number
	loot: GameObject | null
	/** Next node to navigate to; null = stay on the current node. */
	nextNodeId: string | null
	/** Node id of the combat screen — marked visited when markVisited is true. */
	combatNodeId: string
	/** True when monster was defeated / hero survived unconscious; false on flee. */
	markVisited: boolean
}

export interface UsePlaySessionResult {
	session: SessionState | null
	choices: Edge[]
	phase: PlayPhase | null
	runtimePhase: UsePlayRuntimePhase
	creationPool: CreationPool | null
	hasSavedSession: boolean
	resume: () => void
	goToCreation: () => void
	rerollCreation: () => void
	confirmHero: (hero: HeroState) => void
	navigateTo: (targetNodeId: string) => void
	navigateToMort: () => void
	finishCombat: (opts: FinishCombatOpts) => void
	restart: () => void
}

export function usePlaySession(adventure: AdventureDocument): UsePlaySessionResult {
	const bookId = adventure.book.id
	const [session, setSession] = useState<SessionState | null>(null)
	// NOTE: snapshot at mount — not reactive after startNew/restart. Safe here because
	// the start prompt unmounts once session is set; do not copy this pattern.
	const [hasSavedSession] = useState<boolean>(() => loadSession(bookId) !== null)
	const [runtimePhase, setRuntimePhase] = useState<UsePlayRuntimePhase>('start')
	const [creationPool, setCreationPool] = useState<CreationPool | null>(null)

	const choices = session ? listChoices(adventure, session) : []
	const phase = session ? determinePhase(adventure, session) : null

	const resume = useCallback(() => {
		const saved = loadSession(bookId)
		if (saved) {
			setSession(saved)
			setRuntimePhase('playing')
		}
	}, [bookId])

	const goToCreation = useCallback(() => {
		setCreationPool(rollCreationPool())
		setRuntimePhase('creating')
	}, [])

	const rerollCreation = useCallback(() => {
		setCreationPool(rollCreationPool())
	}, [])

	const confirmHero = useCallback(
		(hero: HeroState) => {
			clearSession(bookId)
			const s = createSessionFromHero(adventure, hero)
			setSession(s)
			saveSession(bookId, s)
			setRuntimePhase('playing')
		},
		[adventure, bookId],
	)

	const navigateTo = useCallback(
		(targetNodeId: string) => {
			if (!session) return
			const next = navigate(session, targetNodeId)
			setSession(next)
			saveSession(bookId, next)
		},
		[session, bookId],
	)

	const navigateToMort = useCallback(() => {
		const mortNode = adventure.nodes.find((n) => n.kind === 'mort')
		if (mortNode === undefined) return
		setSession((prev) => {
			if (prev === null) return prev
			const next = { ...prev, currentNodeId: mortNode.id }
			saveSession(bookId, next)
			return next
		})
	}, [adventure, bookId])

	const finishCombat = useCallback(
		(opts: FinishCombatOpts) => {
			setSession((prev) => {
				if (prev === null) return prev
				const peAfterCombat =
					opts.nextNodeId !== null
						? Math.min(opts.updatedPe + PE_PER_TRANSITION, prev.hero.peMax)
						: opts.updatedPe
				const updatedHero: HeroState = {
					...prev.hero,
					pv: opts.updatedPv,
					pe: peAfterCombat,
					xp: prev.hero.xp + opts.xp,
				}
				const newInventory =
					opts.loot !== null ? [...prev.inventory, opts.loot.id] : prev.inventory
				const newVisited =
					opts.markVisited && !prev.visitedNodes.includes(opts.combatNodeId)
						? [...prev.visitedNodes, opts.combatNodeId]
						: prev.visitedNodes
				const next: SessionState = {
					...prev,
					hero: updatedHero,
					inventory: newInventory,
					armorDegradation: opts.armorDeg,
					visitedNodes: newVisited,
					currentNodeId: opts.nextNodeId !== null ? opts.nextNodeId : prev.currentNodeId,
				}
				saveSession(bookId, next)
				return next
			})
		},
		[bookId],
	)

	const restart = useCallback(() => {
		clearSession(bookId)
		setSession(null)
		setCreationPool(rollCreationPool())
		setRuntimePhase('creating')
	}, [bookId])

	return {
		session,
		choices,
		phase,
		runtimePhase,
		creationPool,
		hasSavedSession,
		resume,
		goToCreation,
		rerollCreation,
		confirmHero,
		navigateTo,
		navigateToMort,
		finishCombat,
		restart,
	}
}
