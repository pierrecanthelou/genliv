import { type KeyboardEvent } from 'react'
import { NodeBadge, effectiveKind, endLabel, type BookNode } from '../../../brain'
import { NODE_W, NODE_H, type Point } from '../layout/geometry'
import { nodeView, nodeRef } from '../layout/nodeView'
import { useNodeDrag } from '../hooks/useNodeDrag'

/**
 * A single node rendered as an absolutely-positioned card on the canvas
 * (wireframe § 02 anatomy: NodeBadge + mono ref, title, 1-line snippet).
 * Selecting it is the canvas's job (single source of truth, KR-024); the
 * card is keyboard-focusable and selectable without a pointer (a11y). It can
 * also be dragged to a new position, committed via onMove (persisted by the
 * canvas, overriding the auto-layout slot, KR-022/023).
 */
export interface NodeCardProps {
	node: BookNode
	index: number
	position: Point
	selected: boolean
	/** Current canvas zoom, so screen drag travel maps to canvas units. */
	zoom: number
	/** When true, the card renders in the error state (dangling reference after export). */
	warned?: boolean
	onSelect: (nodeId: string) => void
	/** Commit a dragged position (canvas units) for this node. */
	onMove: (nodeId: string, position: Point) => void
}

export function NodeCard({ node, index, position, selected, zoom, warned, onSelect, onMove }: NodeCardProps): JSX.Element {
	const view = nodeView(node)
	const { delta, onPointerDown, consumeDragClick } = useNodeDrag(position, zoom, (next) => onMove(node.id, next))

	function handleKeyDown(e: KeyboardEvent): void {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			onSelect(node.id)
		}
	}

	const left = position.x + (delta?.x ?? 0)
	const top = position.y + (delta?.y ?? 0)
	const dragging = delta !== null

	return (
		<div
			role="button"
			tabIndex={0}
			aria-pressed={selected}
			aria-label={`Nœud ${nodeRef(index)} — ${view.title}`}
			onPointerDown={onPointerDown}
			onClick={(e) => {
				e.stopPropagation()
				// A drag-release is not a select click (consume the gesture's click).
				if (consumeDragClick()) return
				onSelect(node.id)
			}}
			onKeyDown={handleKeyDown}
			style={{
				position: 'absolute',
				left,
				top,
				width: NODE_W,
				minHeight: NODE_H,
				boxSizing: 'border-box',
				background: warned && !selected ? 'var(--bad-bg)' : 'var(--surface-card)',
				border: `1.5px solid ${selected ? 'var(--accent)' : warned ? 'var(--bad)' : 'var(--border-card)'}`,
				borderRadius: 'var(--r-2xl)',
				boxShadow: selected ? 'var(--ring-selected)' : warned ? '0 0 0 2px var(--bad-line)' : 'var(--shadow-card)',
				padding: '10px 12px',
				cursor: dragging ? 'grabbing' : 'grab',
				userSelect: 'none',
				zIndex: dragging ? 1 : undefined,
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
