import { type KeyboardEvent } from 'react'
import { NodeBadge, effectiveKind, endLabel, type BookNode } from '../../../brain'
import { NODE_W, NODE_H, type Point } from '../layout/geometry'
import { nodeView, nodeRef } from '../layout/nodeView'

/**
 * A single node rendered as an absolutely-positioned card on the canvas
 * (wireframe § 02 anatomy: NodeBadge + mono ref, title, 1-line snippet).
 * Selecting it is the canvas's job (single source of truth, KR-024); the
 * card is keyboard-focusable and selectable without a pointer (a11y).
 */
export interface NodeCardProps {
	node: BookNode
	index: number
	position: Point
	selected: boolean
	onSelect: (nodeId: string) => void
}

export function NodeCard({ node, index, position, selected, onSelect }: NodeCardProps): JSX.Element {
	const view = nodeView(node)

	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			onSelect(node.id)
		}
	}

	return (
		<div
			role="button"
			tabIndex={0}
			aria-pressed={selected}
			aria-label={`Nœud ${nodeRef(index)} — ${view.title}`}
			onPointerDown={(e) => e.stopPropagation()}
			onClick={(e) => {
				e.stopPropagation()
				onSelect(node.id)
			}}
			onKeyDown={handleKeyDown}
			style={{
				position: 'absolute',
				left: position.x,
				top: position.y,
				width: NODE_W,
				minHeight: NODE_H,
				boxSizing: 'border-box',
				background: 'var(--surface-card)',
				border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-card)'}`,
				borderRadius: 'var(--r-2xl)',
				boxShadow: selected ? 'var(--ring-selected)' : 'var(--shadow-card)',
				padding: '10px 12px',
				cursor: 'pointer',
				userSelect: 'none',
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
				<NodeBadge kind={effectiveKind(node)} label={endLabel(node)} selected={selected} />
				<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)', color: 'var(--ink-5)' }}>
					{nodeRef(index)}
				</span>
			</div>
			<div
				style={{
					fontSize: 'var(--fs-body)',
					fontWeight: 'var(--fw-semibold)',
					lineHeight: 'var(--lh-tight)',
					letterSpacing: 'var(--track-tight)',
					color: 'var(--text-strong)',
				}}
			>
				{view.title}
			</div>
			<div
				style={{
					fontSize: 'var(--fs-meta)',
					color: view.snippetIsPlaceholder ? 'var(--text-disabled)' : 'var(--text-faint)',
					fontStyle: view.snippetIsPlaceholder ? 'italic' : 'normal',
					lineHeight: 'var(--lh-snug)',
					marginTop: 3,
					overflow: 'hidden',
					textOverflow: 'ellipsis',
					display: '-webkit-box',
					WebkitLineClamp: 1,
					WebkitBoxOrient: 'vertical',
				}}
			>
				{view.snippet}
			</div>
		</div>
	)
}
