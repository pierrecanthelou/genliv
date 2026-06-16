import { type CSSProperties } from 'react'
import type { NodeKind } from '../types'
import { NODE_KINDS } from '../kinds'

/**
 * NodeBadge — the node-type mark + mono label used on tree cards,
 * outline rows, and the editor panel header. One mark per leaf kind.
 * CSS-drawn marks (no icon font) — see DESIGN-SYSTEM.md.
 */
export interface NodeBadgeProps {
	kind: NodeKind
	/** Override the default uppercase label (e.g. "FIN · VICTOIRE"). */
	label?: string
	/** Accent treatment for the currently-selected node. */
	selected?: boolean
}

// The node-type mark + label are self-described by the kind registry (KR-068),
// so this primitive never branches on the kind value. `piege` is the one mark
// drawn as a triangle rather than a styled box (its discriminated `mark` shape).
function Mark({ kind, selected }: { kind: NodeKind; selected: boolean }): JSX.Element {
	const mark = NODE_KINDS[kind].mark
	if (mark.shape === 'triangle') {
		return (
			<span
				style={{
					width: 0,
					height: 0,
					borderLeft: '5px solid transparent',
					borderRight: '5px solid transparent',
					borderBottom: '9px solid var(--ink-0)',
				}}
			/>
		)
	}
	const base: CSSProperties = { width: 10, height: 10, flex: 'none' }
	const skin: CSSProperties = selected ? { borderRadius: 2, background: 'var(--accent)' } : mark.style
	return <span style={{ ...base, ...skin }} />
}

export function NodeBadge({ kind, label, selected = false }: NodeBadgeProps): JSX.Element {
	const text = label ?? NODE_KINDS[kind].label
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				fontFamily: 'var(--font-mono)',
				fontSize: 'var(--fs-eyebrow)',
				letterSpacing: '0.04em',
				color: selected ? 'var(--accent)' : 'var(--ink-2)',
				border: `1px solid ${selected ? 'var(--accent)' : 'var(--line-1)'}`,
				borderRadius: 'var(--r-lg)',
				padding: '3px 8px',
				background: 'var(--paper-0)',
			}}
		>
			<Mark kind={kind} selected={selected} />
			{text}
		</span>
	)
}
