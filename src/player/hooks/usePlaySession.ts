import { useState, useCallback } from 'react'
import type { Edge, GameObject } from '../../brain/types'
import type { Characteristic } from '../../brain/characteristics'
import type { AdventureDocument, PlayPhase, SessionState, HeroState } from '../types'
import type { CreationPool } from '../engine/charCreation'
import { rollCreationPool } from '../engine/charCreation'
import { createSessionFromHero, navigate, listChoices, determinePhase, PE_PER_TRANSITION } from '../engine/sessionEngine'
import { applyCaracUpgrade, applyMcUpgrade } from '../engine/actionEngine'
import type { PnjGiftMutations, EquipMutations } from '../engine/actionEngine'
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
	/**
	 * Permanent session mutations from capacity hooks (iter 4).
	 * enMaxDelta: maladie (−1 EN max). pvMaxDelta: liche drain (−1D4 PV max).
	 * volTriggered: gobelin stole an inventory object.
	 */
	enMaxDelta: number
	pvMaxDelta: number
	volTriggered: boolean
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
	/** Add an object to inventory (and auto-equip it) after a décor « prendre ». */
	takeObject: (obj: GameObject, xp: number, equip: EquipMutations) => void
	/** Mark a décor node visited and award its authored XP. */
	finishDecor: (nodeId: string, xp: number) => void
	/** Apply a PNJ gift, mark the node visited, award XP, and optionally navigate. */
	finishPnj: (nodeId: string, gift: PnjGiftMutations | null, xp: number, target: string | null) => void
	/** Mark a trap node resolved: lethal → mort; otherwise mark visited + award XP. */
	finishTrap: (nodeId: string, isLethal: boolean, xp: number) => void
	/** Spend XP on a characteristic upgrade (caller pre-checks canUpgrade). */
	spendXpOnCarac: (carac: Characteristic) => void
	/** Spend XP on a MC bonus upgrade (caller pre-checks canUpgrade). */
	spendXpOnMc: () => void
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
				// Apply permanent session mutations from capacity hooks (maladie, liche, vol).
				// V1 approximation: enMaxDelta (maladie −1 EN) reduces peMax only.
				// Full EN carac mutation would also cascade to pvMax and fatigue thresholds; deferred.
				const newEnMax = Math.max(1, prev.hero.peMax + opts.enMaxDelta)
				const newPvMax = Math.max(1, prev.hero.pvMax + opts.pvMaxDelta)
				// Vol: remove last inventory item (first minor object proxy for V1).
				const inventoryAfterVol =
					opts.volTriggered && prev.inventory.length > 0
						? prev.inventory.slice(0, -1)
						: prev.inventory
				const newInventory =
					opts.loot !== null ? [...inventoryAfterVol, opts.loot.id] : inventoryAfterVol
				const updatedHero: HeroState = {
					...prev.hero,
					pv: Math.min(opts.updatedPv, newPvMax),
					pvMax: newPvMax,
					pe: peAfterCombat,
					peMax: newEnMax,
					xp: prev.hero.xp + opts.xp,
				}
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

	const takeObject = useCallback(
		(obj: GameObject, xp: number, equip: EquipMutations) => {
			setSession((prev) => {
				if (prev === null) return prev
				const next: SessionState = {
					...prev,
					inventory: [...prev.inventory, obj.id],
					hero: { ...prev.hero, xp: prev.hero.xp + xp },
					activeWeapon: equip.activeWeapon ?? prev.activeWeapon,
					activeProtection: equip.activeProtection ?? prev.activeProtection,
					activeShield: equip.activeShield ?? prev.activeShield,
					activeMagicBonus: equip.activeMagicBonus ?? prev.activeMagicBonus,
					activeSilverWeapon: equip.activeSilverWeapon ?? prev.activeSilverWeapon,
				}
				saveSession(bookId, next)
				return next
			})
		},
		[bookId],
	)

	const finishDecor = useCallback(
		(nodeId: string, xp: number) => {
			setSession((prev) => {
				if (prev === null) return prev
				const newVisited = prev.visitedNodes.includes(nodeId) ? prev.visitedNodes : [...prev.visitedNodes, nodeId]
				const next: SessionState = {
					...prev,
					hero: { ...prev.hero, xp: prev.hero.xp + xp },
					visitedNodes: newVisited,
				}
				saveSession(bookId, next)
				return next
			})
		},
		[bookId],
	)

	const finishPnj = useCallback(
		(nodeId: string, gift: PnjGiftMutations | null, xp: number, target: string | null) => {
			setSession((prev) => {
				if (prev === null) return prev
				const g: PnjGiftMutations = gift ?? { pvDelta: 0, mcBonusDelta: 0, armorBonusDelta: 0, inventoryAdd: [] }
				const newPv = Math.min(prev.hero.pv + g.pvDelta, prev.hero.pvMax)
				const newInventory = g.inventoryAdd.length > 0 ? [...prev.inventory, ...g.inventoryAdd] : prev.inventory
				const newVisited = prev.visitedNodes.includes(nodeId) ? prev.visitedNodes : [...prev.visitedNodes, nodeId]
				const newPe = target !== null ? Math.min(prev.hero.pe + PE_PER_TRANSITION, prev.hero.peMax) : prev.hero.pe
				const next: SessionState = {
					...prev,
					hero: {
						...prev.hero,
						pv: newPv,
						pe: newPe,
						mcBonus: prev.hero.mcBonus + g.mcBonusDelta,
						xp: prev.hero.xp + xp,
					},
					inventory: newInventory,
					permanentArmorBonus: prev.permanentArmorBonus + g.armorBonusDelta,
					visitedNodes: newVisited,
					currentNodeId: target !== null ? target : prev.currentNodeId,
				}
				saveSession(bookId, next)
				return next
			})
		},
		[bookId],
	)

	const finishTrap = useCallback(
		(nodeId: string, isLethal: boolean, xp: number) => {
			if (isLethal) {
				navigateToMort()
				return
			}
			setSession((prev) => {
				if (prev === null) return prev
				const newVisited = prev.visitedNodes.includes(nodeId) ? prev.visitedNodes : [...prev.visitedNodes, nodeId]
				const next: SessionState = {
					...prev,
					hero: { ...prev.hero, xp: prev.hero.xp + xp },
					visitedNodes: newVisited,
				}
				saveSession(bookId, next)
				return next
			})
		},
		[bookId, navigateToMort],
	)

	const spendXpOnCarac = useCallback(
		(carac: Characteristic) => {
			setSession((prev) => {
				if (prev === null) return prev
				const updatedHero = applyCaracUpgrade(carac, prev.hero)
				const next: SessionState = { ...prev, hero: updatedHero }
				saveSession(bookId, next)
				return next
			})
		},
		[bookId],
	)

	const spendXpOnMc = useCallback(() => {
		setSession((prev) => {
			if (prev === null) return prev
			const updatedHero = applyMcUpgrade(prev.hero)
			const next: SessionState = { ...prev, hero: updatedHero }
			saveSession(bookId, next)
			return next
		})
	}, [bookId])

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
		takeObject,
		finishDecor,
		finishPnj,
		finishTrap,
		spendXpOnCarac,
		spendXpOnMc,
		restart,
	}
}
