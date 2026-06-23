import { useState } from 'react'
import type { AdventureDocument, PlayPhase } from '../types'
import { getNode } from '../engine/sessionEngine'
import { usePlaySession } from '../hooks/usePlaySession'
import { HeroStatusBar } from './HeroStatusBar'
import { NodeScreen } from './NodeScreen'
import { EndScreen } from './EndScreen'
import { CharacterCreationScreen } from './CharacterCreationScreen'

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
