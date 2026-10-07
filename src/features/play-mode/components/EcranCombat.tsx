/**
 * COMBAT SCREEN — display and control a combat encounter.
 *
 * Displays:
 *  - Combat log (chronological rounds)
 *  - Posture selection (Normale/Précise/Défensive)
 *  - Play round button
 *  - Combat outcome (Victory/Defeat/Unconscious/Fled)
 *  - Hero health (via BandeauHeros in parent)
 */

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { POSTURES, type Posture } from '../../../brain/combat'
import { SegmentedControl } from '../../../brain/components/SegmentedControl'
import { Badge } from '../../../brain/components/Badge'
import { HIT_TARGET_MIN } from '../../../brain/ui'
import type { CombatState, CombatOutcome } from '../../../player/engine/combatTypes'
import type { CommentaireRound } from '../hooks/useCommentaireCombat'
import { JournalLigneRound } from './JournalLigneRound'

export interface EcranCombatProps {
	readonly etat: CombatState
	readonly onJouer: (posture: Posture) => void
	readonly onFuir: () => void
	readonly onClore?: () => void
	readonly commentaires?: ReadonlyMap<number, CommentaireRound>
}

// Exhaustive table of outcome labels
const OUTCOME_LABELS: Record<Exclude<CombatOutcome, 'ongoing'>, string> = {
	'hero-victory': 'VICTOIRE',
	'monster-fled': 'VICTOIRE',
	'hero-survived-unconscious': 'INCONSCIENT',
	'hero-mort': 'DÉFAITE',
	'hero-fled': 'FUITE',
}

export function EcranCombat({ etat, onJouer, onFuir, onClore, commentaires }: EcranCombatProps): JSX.Element {
	const [selectedPosture, setSelectedPosture] = useState<Posture>('normale')
	const isTerminal = etat.outcome !== 'ongoing'

	const continuerRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		if (isTerminal) {
			continuerRef.current?.focus()
		}
	}, [isTerminal])

	const handlePlayRound = () => {
		onJouer(selectedPosture)
	}

	const handleFuir = () => {
		onFuir()
	}

	const handleClose = () => {
		if (onClore) {
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
						{(() => {
							const dernierIdx = new Map<number, number>()
							etat.log.forEach((e, i) => dernierIdx.set(e.round, i))
							return etat.log.map((entry, idx) => (
								<JournalLigneRound
									key={idx}
									round={entry.round}
									texte={entry.text}
									commentaire={dernierIdx.get(entry.round) === idx ? commentaires?.get(entry.round) : undefined}
								/>
							))
						})()}
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
					<div style={groupeActions}>
						<button
							style={boutonJouerRound}
							onClick={handlePlayRound}
							aria-label="Jouer le round avec la posture sélectionnée"
						>
							Jouer le round →
						</button>
						<button style={boutonFuir} onClick={handleFuir} aria-label="Fuir le combat">
							Fuir ↪
						</button>
					</div>
				</div>
			)}

			{/* Combat outcome — displayed when terminal */}
			{isTerminal && (
				<>
					<div style={section}>
						<h3 style={sectionTitre}>ISSUE DU COMBAT</h3>
						{etat.outcome !== 'ongoing' && <Badge tone="muted">{OUTCOME_LABELS[etat.outcome]}</Badge>}
					</div>

					<button
						ref={continuerRef}
						style={boutonContinuer}
						onClick={handleClose}
						aria-label="Continuer après le combat"
					>
						Continuer
					</button>
				</>
			)}
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

const groupeActions: CSSProperties = {
	display: 'flex',
	gap: 'var(--space-5)',
	alignItems: 'center',
}

const boutonJouerRound: CSSProperties = {
	flex: 1,
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

const boutonFuir: CSSProperties = {
	flexShrink: 0,
	padding: 'var(--space-3) var(--space-4)',
	backgroundColor: 'var(--surface-card)',
	color: 'var(--text-strong)',
	border: 'var(--bw-hair) solid var(--border-card)',
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
