/**
 * COMBAT SCREEN — display and control a combat encounter.
 *
 * Displays:
 *  - Combat log (chronological rounds)
 *  - Posture selection (Normale/Précise/Défensive)
 *  - Play round button
 *  - Combat outcome (Victory/Defeat/Unconscious)
 *  - Hero health (via BandeauHeros in parent)
 */

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { POSTURES, type Posture } from '../../../brain/combat'
import { SegmentedControl } from '../../../brain/components/SegmentedControl'
import { Badge } from '../../../brain/components/Badge'
import { HIT_TARGET_MIN } from '../../../brain/ui'
import type { CombatState } from '../../../player/engine/combatTypes'

export interface EcranCombatProps {
	readonly etat: CombatState
	readonly onJouer: (posture: Posture) => void
	readonly onClore?: () => void
}

export function EcranCombat({ etat, onJouer, onClore }: EcranCombatProps): JSX.Element {
	const [selectedPosture, setSelectedPosture] = useState<Posture>('normale')
	const isTerminal = etat.outcome !== 'ongoing'
	const isDead = etat.outcome === 'hero-mort'

	const continuerRef = useRef<HTMLButtonElement>(null)
	const partieTermineeRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (isTerminal) {
			if (isDead) {
				partieTermineeRef.current?.focus()
			} else {
				continuerRef.current?.focus()
			}
		}
	}, [isTerminal, isDead])

	const handlePlayRound = () => {
		onJouer(selectedPosture)
	}

	const handleClose = () => {
		if (onClore && !isDead) {
			onClore()
		}
	}

	return (
		<div style={container}>
			<h2 style={titre}>COMBAT</h2>

			{/* Combat log section */}
			<div style={section}>
				<h3 style={sectionTitre}>JOURNAL DE COMBAT</h3>
				{etat.log.length === 0 ? (
					<div style={logVide} role="status">
						Le combat commence. Choisissez une posture, puis lancez le round.
					</div>
				) : (
					<div style={log} role="log">
						{etat.log.map((entry, idx) => (
							<JournalLigneRound key={idx} round={entry.round} texte={entry.text} />
						))}
					</div>
				)}
			</div>

			{/* Posture section — hidden on terminal outcome */}
			{!isTerminal && (
				<div style={section}>
					<h3 style={sectionTitre}>POSTURE</h3>
					<SegmentedControl
						value={selectedPosture}
						onChange={setSelectedPosture}
						options={Object.entries(POSTURES).map(([key, desc]) => ({
							value: key as Posture,
							label: desc.label,
						}))}
						ariaLabel="Choisir une posture"
					/>
					<button
						style={boutonJouerRound}
						onClick={handlePlayRound}
						aria-label="Jouer le round avec la posture sélectionnée"
					>
						Jouer le round →
					</button>
				</div>
			)}

			{/* Combat outcome — displayed when terminal */}
			{isTerminal && (
				<>
					<div style={section}>
						<h3 style={sectionTitre}>ISSUE DU COMBAT</h3>
						{etat.outcome === 'hero-victory' && <Badge tone="neutral">VICTOIRE</Badge>}
						{etat.outcome === 'monster-fled' && <Badge tone="neutral">VICTOIRE</Badge>}
						{etat.outcome === 'hero-survived-unconscious' && <Badge tone="neutral">INCONSCIENT</Badge>}
						{etat.outcome === 'hero-mort' && <Badge tone="neutral">DÉFAITE</Badge>}
					</div>

					{isDead ? (
						<div ref={partieTermineeRef} tabIndex={-1} style={partieTerminee}>
							<p>PARTIE TERMINÉE — Échap ou « Quitter le test »</p>
						</div>
					) : (
						<button ref={continuerRef} style={boutonContinuer} onClick={handleClose} aria-label="Continuer après le combat">
							Continuer
						</button>
					)}
				</>
			)}
		</div>
	)
}

function JournalLigneRound({ round, texte }: { round: number; texte: string }): JSX.Element {
	return (
		<div style={ligneLivre}>
			<span style={enteteLivre}>ROUND {round}</span>
			<p style={texteLivre}>{texte}</p>
		</div>
	)
}

// --- Styles

const container: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
	padding: 'var(--space-4)',
}

const titre: CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
	fontFamily: 'var(--font-ui)',
	letterSpacing: 'var(--track-eyebrow-wide)',
	textTransform: 'uppercase',
}

const section: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const sectionTitre: CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-eyebrow)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
	fontFamily: 'var(--font-mono)',
	letterSpacing: 'var(--track-eyebrow-wide)',
	textTransform: 'uppercase',
}

const log: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	overflowY: 'auto',
	paddingRight: 'var(--space-3)',
}

const logVide: CSSProperties = {
	padding: 'var(--space-4)',
	border: 'var(--bw-emphasis) dashed var(--border-subtle)',
	borderRadius: 'var(--r-xl)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-mono)',
	lineHeight: 'var(--lh-body)',
	textAlign: 'center',
}

const ligneLivre: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
	paddingBottom: 'var(--space-2)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
}

const enteteLivre: CSSProperties = {
	fontSize: 'var(--fs-eyebrow)',
	fontFamily: 'var(--font-mono)',
	color: 'var(--text-strong)',
	letterSpacing: 'var(--track-eyebrow-wide)',
	fontWeight: 'var(--fw-semibold)',
	textTransform: 'uppercase',
}

const texteLivre: CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-body)',
	fontFamily: 'var(--font-mono)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
}

const boutonJouerRound: CSSProperties = {
	padding: 'var(--space-3) var(--space-4)',
	backgroundColor: 'var(--accent)',
	color: 'var(--text-on-accent)',
	border: 'none',
	borderRadius: 'var(--r-xl)',
	fontSize: 'var(--fs-body)',
	fontFamily: 'var(--font-ui)',
	fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer',
	minHeight: HIT_TARGET_MIN,
}

const boutonContinuer: CSSProperties = {
	padding: 'var(--space-3) var(--space-4)',
	backgroundColor: 'var(--accent)',
	color: 'var(--text-on-accent)',
	border: 'none',
	borderRadius: 'var(--r-xl)',
	fontSize: 'var(--fs-body)',
	fontFamily: 'var(--font-ui)',
	fontWeight: 'var(--fw-semibold)',
	cursor: 'pointer',
	minHeight: HIT_TARGET_MIN,
}

const partieTerminee: CSSProperties = {
	padding: 'var(--space-4)',
	backgroundColor: 'var(--surface-sunken)',
	borderRadius: 'var(--r-xl)',
	borderLeft: 'var(--bw-hair) solid var(--border-subtle)',
	fontSize: 'var(--fs-body)',
	fontFamily: 'var(--font-mono)',
	color: 'var(--text-strong)',
	lineHeight: 'var(--lh-body)',
	margin: 0,
}
