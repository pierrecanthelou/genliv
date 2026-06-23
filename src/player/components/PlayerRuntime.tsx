import { useState } from 'react'
import type { AdventureDocument, PlayPhase } from '../types'
import { getNode } from '../engine/sessionEngine'
import { usePlaySession } from '../hooks/usePlaySession'
import { HeroStatusBar } from './HeroStatusBar'
import { NodeScreen } from './NodeScreen'
import { EndScreen } from './EndScreen'
import { CharacterCreationScreen } from './CharacterCreationScreen'
import { CombatScreen } from './CombatScreen'
import type { UseCombatCallbacks } from '../hooks/useCombat'

interface PlayerRuntimeProps {
	adventure: AdventureDocument
	onQuit: () => void
}

export function PlayerRuntime({ adventure, onQuit }: PlayerRuntimeProps): JSX.Element {
	const {
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
	} = usePlaySession(adventure)

	const [rerollUsed, setRerollUsed] = useState(false)

	function handleGoToCreation(): void {
		setRerollUsed(false)
		goToCreation()
	}

	function handleRestart(): void {
		setRerollUsed(false)
		restart()
	}

	function handleReroll(): void {
		rerollCreation()
		setRerollUsed(true)
	}

	if (runtimePhase === 'start') {
		return (
			<StartPrompt
				bookTitle={adventure.book.title}
				hasSavedSession={hasSavedSession}
				onContinue={resume}
				onNew={handleGoToCreation}
			/>
		)
	}

	if (runtimePhase === 'creating' && creationPool !== null) {
		return (
			<CharacterCreationScreen
				key={creationPool.rolls.join('-')}
				pool={creationPool}
				onConfirm={confirmHero}
				onReroll={handleReroll}
				rerollUsed={rerollUsed}
			/>
		)
	}

	if (session === null) {
		return (
			<div style={{ padding: 'var(--space-12)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
				Chargement…
			</div>
		)
	}

	const currentNode = getNode(adventure, session.currentNodeId)

	if (phase !== null && phase !== 'playing') {
		return (
			<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				<HeroStatusBar hero={session.hero} />
				<EndScreen
					phase={phase as Exclude<PlayPhase, 'playing'>}
					node={currentNode}
					onRestart={handleRestart}
					onQuit={onQuit}
				/>
			</div>
		)
	}

	// Route monster nodes to CombatScreen (anti-farm: only if not already visited)
	const isCombatNode =
		currentNode !== null &&
		currentNode.actionType === 'monstre' &&
		currentNode.monster !== undefined &&
		!session.visitedNodes.includes(currentNode.id)

	if (isCombatNode && currentNode !== null && currentNode.monster !== undefined) {
		const combatNodeId = currentNode.id
		const monsterConfig = currentNode.monster

		const combatCallbacks: UseCombatCallbacks = {
			onVictory: (victoryTarget, loot, xp, updatedPv, updatedPe, armorDeg, enMaxDelta, pvMaxDelta, volTriggered) => {
				finishCombat({
					updatedPv,
					updatedPe,
					xp,
					armorDeg,
					loot,
					nextNodeId: victoryTarget,
					combatNodeId,
					markVisited: true,
					enMaxDelta,
					pvMaxDelta,
					volTriggered,
				})
			},
			onFlee: (fleeTarget, updatedPv, updatedPe, armorDeg) => {
				finishCombat({
					updatedPv,
					updatedPe,
					xp: 0,
					armorDeg,
					loot: null,
					nextNodeId: fleeTarget,
					combatNodeId,
					markVisited: false,
					enMaxDelta: 0,
					pvMaxDelta: 0,
					volTriggered: false,
				})
			},
			onDeath: () => navigateToMort(),
			onSurvivedUnconscious: (updatedPe, armorDeg) => {
				finishCombat({
					updatedPv: 1,
					updatedPe,
					xp: 0,
					armorDeg,
					loot: null,
					nextNodeId: null,
					combatNodeId,
					markVisited: true,
					enMaxDelta: 0,
					pvMaxDelta: 0,
					volTriggered: false,
				})
			},
		}

		return (
			<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
				<HeroStatusBar hero={session.hero} />
				<CombatScreen
					key={combatNodeId}
					config={monsterConfig}
					hero={session.hero}
					session={session}
					callbacks={combatCallbacks}
				/>
			</div>
		)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			<HeroStatusBar hero={session.hero} />
			{currentNode !== null ? (
				<NodeScreen node={currentNode} choices={choices} onChoice={navigateTo} />
			) : (
				<div style={{ padding: 'var(--space-12)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
					Écran introuvable (id: {session.currentNodeId}).
				</div>
			)}
		</div>
	)
}

interface StartPromptProps {
	bookTitle: string
	hasSavedSession: boolean
	onContinue: () => void
	onNew: () => void
}

function StartPrompt({ bookTitle, hasSavedSession, onContinue, onNew }: StartPromptProps): JSX.Element {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				height: '100%',
				gap: 'var(--space-8)',
				padding: 'var(--space-12)',
				textAlign: 'center',
			}}
		>
			<h2
				style={{
					fontSize: 'var(--fs-title)',
					fontWeight: 'var(--fw-bold)',
					letterSpacing: 'var(--track-tight)',
					color: 'var(--text-strong)',
					margin: 0,
				}}
			>
				{bookTitle}
			</h2>
			<p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 'var(--fs-meta)', fontFamily: 'var(--font-mono)' }}>
				Test depuis le brouillon en mémoire — les modifications non sauvegardées sont incluses.
			</p>
			<div style={{ display: 'flex', gap: 'var(--space-3)' }}>
				{hasSavedSession && (
					<button
						type="button"
						onClick={onContinue}
						style={{
							padding: '10px 20px',
							borderRadius: 'var(--r-md)',
							border: '1px solid var(--border-card)',
							background: 'var(--surface-card)',
							color: 'var(--text-body)',
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							cursor: 'pointer',
							minHeight: 'var(--hit-target)',
						}}
					>
						Continuer
					</button>
				)}
				<button
					type="button"
					onClick={onNew}
					style={{
						padding: '10px 20px',
						borderRadius: 'var(--r-md)',
						border: '1px solid var(--accent)',
						background: 'var(--accent)',
						color: 'var(--text-on-accent)',
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						fontWeight: 'var(--fw-semibold)',
						cursor: 'pointer',
						minHeight: 'var(--hit-target)',
					}}
				>
					Nouvelle partie
				</button>
			</div>
		</div>
	)
}
