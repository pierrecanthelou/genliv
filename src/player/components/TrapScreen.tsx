import { useState } from 'react'
import type { TrapConfig } from '../../brain/types'
import type { HeroState } from '../types'
import { resolveTrap } from '../engine/actionEngine'
import { CHALLENGE_TIERS, rollTier } from '../../brain/challenge'
import { CHARACTERISTICS } from '../../brain/characteristics'
import type { Characteristic } from '../../brain/characteristics'

interface TrapScreenProps {
	trap: TrapConfig
	hero: HeroState
	onFinish: (isLethal: boolean, xp: number) => void
}

export function TrapScreen({ trap, hero, onFinish }: TrapScreenProps): JSX.Element {
	// Resolve once per mount via the lazy initializer (called exactly once, never on re-render).
	const [result] = useState(() => resolveTrap(trap, hero))

	const traitLabel = trap.roll ? (CHARACTERISTICS[trap.roll.trait as Characteristic]?.abbr ?? trap.roll.trait) : null
	const tierLabel = trap.roll ? CHALLENGE_TIERS[rollTier(trap.roll)].notation : null

	return (
		<div
			style={{
				flex: 1,
				overflowY: 'auto',
				display: 'flex',
				flexDirection: 'column',
				gap: 'var(--space-8)',
				padding: 'var(--space-12)',
				maxWidth: 680,
				margin: '0 auto',
				width: '100%',
			}}
		>
			{/* Trap description */}
			<div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)', lineHeight: 1.7 }}>
				{trap.description}
			</div>

			{/* Roll legend */}
			{traitLabel !== null && tierLabel !== null && (
				<div
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						color: 'var(--text-muted)',
					}}
				>
					Jet de {traitLabel} ({tierLabel}) — valeur {result.characteristicValue} / jet {result.diceRoll}
				</div>
			)}

			{/* Outcome */}
			<div
				style={{
					padding: 'var(--space-6) var(--space-8)',
					borderRadius: 'var(--r-md)',
					border: `1px solid ${result.outcome === 'reussite' ? 'var(--good)' : 'var(--bad)'}`,
					background: result.outcome === 'reussite' ? 'var(--good-bg)' : 'var(--bad-bg)',
				}}
			>
				<div
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-meta)',
						fontWeight: 'var(--fw-semibold)',
						marginBottom: 'var(--space-2)',
						color: result.outcome === 'reussite' ? 'var(--good)' : 'var(--bad)',
						textTransform: 'uppercase',
						letterSpacing: 'var(--track-eyebrow)',
					}}
				>
					{result.outcome === 'reussite' ? 'Réussite' : 'Échec'}
					{result.xp > 0 && (
						<span style={{ marginLeft: 'var(--space-4)' }}>+{result.xp} XP</span>
					)}
				</div>
				<div style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)', lineHeight: 1.6 }}>
					{result.text}
				</div>
				{result.isLethal && (
					<div
						style={{
							marginTop: 'var(--space-3)',
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							color: 'var(--bad)',
						}}
					>
						Ce piège est fatal.
					</div>
				)}
			</div>

			<button
				type="button"
				onClick={() => onFinish(result.isLethal, result.xp)}
				style={{
					alignSelf: 'flex-start',
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
				Continuer
			</button>
		</div>
	)
}
