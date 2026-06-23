import { useState, useEffect, useRef, useCallback } from 'react'
import type { MonsterConfig, GameObject } from '../../brain/types'
import type { HeroState, SessionState } from '../types'
import { startCombat, resolveCombatRound, tryHeroFlee } from '../engine/combatEngine'
import type { CombatState } from '../engine/combatEngine'
import type { Posture } from '../../brain/combat'

export type { CombatState }

export interface UseCombatCallbacks {
	onVictory: (victoryTarget: string | null, loot: GameObject | null, xp: number, updatedPv: number, updatedPe: number, armorDeg: number) => void
	onFlee: (fleeTarget: string, updatedPv: number, updatedPe: number, armorDeg: number) => void
	onDeath: () => void
	onSurvivedUnconscious: (updatedPe: number, armorDeg: number) => void
}

export interface UseCombatResult {
	combatState: CombatState
	canFlee: boolean
	choosePosture: (posture: Posture) => void
	continueFight: () => void
	flee: () => void
}

export function useCombat(
	config: MonsterConfig,
	hero: HeroState,
	session: SessionState,
	callbacks: UseCombatCallbacks,
): UseCombatResult {
	const [combatState, setCombatState] = useState<CombatState>(() =>
		startCombat(config, hero, session),
	)

	// Stable refs so the useEffect doesn't re-fire when callbacks change identity
	const cbRef = useRef(callbacks)
	cbRef.current = callbacks

	// Dispatch combat-end side effects exactly once (guard ref prevents double-fire
	// if combatState updates again while outcome is already final).
	const endFiredRef = useRef(false)
	useEffect(() => {
		if (combatState.outcome === 'ongoing' || endFiredRef.current) return
		endFiredRef.current = true
		const s = combatState
		const cb = cbRef.current
		switch (s.outcome) {
			case 'hero-victory':
			case 'monster-fled':
				cb.onVictory(s.monster.victoryTarget, s.pendingLoot, s.pendingXp, s.heroPv, s.heroPe, s.heroArmorDegradation)
				break
			case 'hero-fled':
				if (s.monster.fleeTarget !== null) {
					cb.onFlee(s.monster.fleeTarget, s.heroPv, s.heroPe, s.heroArmorDegradation)
				} else {
					// fleeTarget was null at outcome resolution — should never happen since flee()
					// guards on fleeTarget !== null, but guard here to avoid a stuck state.
					console.warn('[useCombat] hero-fled but fleeTarget is null; falling back to onDeath')
					cb.onDeath()
				}
				break
			case 'hero-mort':
				cb.onDeath()
				break
			case 'hero-survived-unconscious':
				cb.onSurvivedUnconscious(s.heroPe, s.heroArmorDegradation)
				break
		}
	}, [combatState])

	const heroRef = useRef(hero)
	heroRef.current = hero
	const sessionRef = useRef(session)
	sessionRef.current = session

	const choosePosture = useCallback(
		(posture: Posture) => {
			setCombatState((prev) => {
				if (prev.phase !== 'choosing' || prev.outcome !== 'ongoing') return prev
				return resolveCombatRound(prev, heroRef.current, sessionRef.current, posture)
			})
		},
		[],
	)

	const continueFight = useCallback(() => {
		setCombatState((prev) => {
			if (prev.phase !== 'resolved' || prev.outcome !== 'ongoing') return prev
			return { ...prev, phase: 'choosing' }
		})
	}, [])

	const flee = useCallback(() => {
		setCombatState((prev) => {
			if (prev.phase !== 'choosing' || prev.outcome !== 'ongoing') return prev
			if (prev.monster.fleeTarget === null) return prev
			return tryHeroFlee(prev, heroRef.current, sessionRef.current)
		})
	}, [])

	const canFlee = combatState.monster.fleeTarget !== null && combatState.phase === 'choosing' && combatState.outcome === 'ongoing'

	return { combatState, canFlee, choosePosture, continueFight, flee }
}
