import type { Edge } from '../../brain/types'
import type { PlayNode } from '../types'
import { ChoiceList } from './ChoiceList'

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

			<ChoiceList choices={choices} onChoice={onChoice} />
		</div>
	)
}
