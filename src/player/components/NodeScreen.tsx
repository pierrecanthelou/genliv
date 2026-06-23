import type { Edge } from '../../brain/types'
import type { PlayNode } from '../types'

interface NodeScreenProps {
	node: PlayNode
	choices: Edge[]
	onChoice: (targetNodeId: string) => void
}

export function NodeScreen({ node, choices, onChoice }: NodeScreenProps): JSX.Element {
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
			<div
				style={{
					fontSize: 'var(--fs-body)',
					color: 'var(--text-body)',
					lineHeight: 1.7,
					whiteSpace: 'pre-wrap',
				}}
			>
				{node.text || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pas de texte.</span>}
			</div>

			{choices.length > 0 ? (
				<div
					role="list"
					style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
				>
					{choices.map((edge) => (
						<button
							key={edge.id}
							type="button"
							onClick={() => onChoice(edge.to)}
							style={{
								textAlign: 'left',
								padding: '12px 16px',
								borderRadius: 'var(--r-md)',
								border: '1px solid var(--border-card)',
								background: 'var(--surface-card)',
								color: 'var(--text-body)',
								fontSize: 'var(--fs-body)',
								cursor: 'pointer',
								minHeight: 'var(--hit-target)',
								transition: 'border-color 0.1s, background 0.1s',
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.borderColor = 'var(--accent)'
								e.currentTarget.style.background = 'var(--accent-bg)'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.borderColor = 'var(--border-card)'
								e.currentTarget.style.background = 'var(--surface-card)'
							}}
						>
							{edge.label || '→ (choix sans libellé)'}
						</button>
					))}
				</div>
			) : (
				<p
					style={{
						color: 'var(--text-muted)',
						fontStyle: 'italic',
						fontSize: 'var(--fs-meta)',
						fontFamily: 'var(--font-mono)',
					}}
				>
					Pas de sortie depuis cet écran.
				</p>
			)}
		</div>
	)
}
