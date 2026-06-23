import type { PlayPhase, PlayNode } from '../types'

interface EndScreenProps {
	phase: Exclude<PlayPhase, 'playing'>
	node: PlayNode | null
	onRestart: () => void
	onQuit: () => void
}

const END_LABELS: Record<Exclude<PlayPhase, 'playing'>, { title: string; color: string }> = {
	victory: { title: 'Victoire !', color: 'var(--good)' },
	failure: { title: 'Fin…', color: 'var(--text-label)' },
	death: { title: 'Vous êtes mort.', color: 'var(--bad)' },
}

export function EndScreen({ phase, node, onRestart, onQuit }: EndScreenProps): JSX.Element {
	const { title, color } = END_LABELS[phase]

	return (
		<div
			style={{
				flex: 1,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 'var(--space-8)',
				padding: 'var(--space-12)',
				textAlign: 'center',
			}}
		>
			<h2
				style={{
					fontSize: 'calc(var(--fs-title) * 1.5)',
					fontWeight: 'var(--fw-bold)',
					letterSpacing: 'var(--track-tight)',
					color,
					margin: 0,
				}}
			>
				{title}
			</h2>

			{node?.text && (
				<p
					style={{
						fontSize: 'var(--fs-body)',
						color: 'var(--text-body)',
						lineHeight: 1.7,
						maxWidth: 560,
						whiteSpace: 'pre-wrap',
					}}
				>
					{node.text}
				</p>
			)}

			<div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
				<button
					type="button"
					onClick={onRestart}
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
					Recommencer
				</button>
				<button
					type="button"
					onClick={onQuit}
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
					Quitter le test
				</button>
			</div>
		</div>
	)
}
