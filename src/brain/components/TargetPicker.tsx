import { useState } from 'react'
import { nodeTitle } from '../utils/nodeView'
import { canBeTarget } from '../kinds'
import type { BookNode } from '../types'

/**
 * TargetPicker — pick a node another node points at for a NON-choice screen
 * change (PNJ « mène à », monster victoire/fuite targets). Lives in brain because
 * more than one feature uses it (action-pnj + action-monster, KR-109). Structural
 * screens are never authored targets so the Sommaire/Mort are excluded (KR-067,
 * the canBeTarget flag), and a target whose node was deleted is surfaced (⚠),
 * never silently broken (KR-021/063). Controlled: the chosen id lives on the
 * owner's config (pending promotion to a rendered edge via the dedicated path).
 */
export interface TargetPickerProps {
	/** Mono caption above the picker (e.g. « Ensuite, le PNJ mène à »). */
	label: string
	/** All nodes of the book (to list candidates + resolve the current target). */
	nodes: BookNode[]
	/** The node being edited (excluded from its own candidates). */
	nodeId: string
	/** The currently chosen target node id, if any. */
	target: string | undefined
	onChange: (target: string | undefined) => void
	/** Copy for the no-target state + the clear option. */
	emptyLabel?: string
}

export function TargetPicker({
	label,
	nodes,
	nodeId,
	target,
	onChange,
	emptyLabel = 'Aucune cible',
}: TargetPickerProps): JSX.Element {
	const [open, setOpen] = useState(false)
	const candidates = nodes.filter((n) => n.id !== nodeId && canBeTarget(n.kind))
	const current = target !== undefined ? (nodes.find((n) => n.id === target) ?? null) : null
	const dangling = target !== undefined && current === null
	const summary = current !== null ? nodeTitle(current) : dangling ? '⚠ cible supprimée' : emptyLabel

	function choose(next: string | undefined): void {
		onChange(next)
		setOpen(false)
	}

	return (
		<div>
			<span style={labelStyle}>{label}</span>
			<button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={pickerButton}>
				{summary}
			</button>
			{open && (
				<ul style={picker} aria-label={`Choisir : ${label}`}>
					<li>
						<button type="button" style={candidate} onClick={() => choose(undefined)}>
							— {emptyLabel} —
						</button>
					</li>
					{candidates.length === 0 ? (
						<li style={{ ...candidate, color: 'var(--text-faint)' }}>Aucun autre nœud</li>
					) : (
						candidates.map((n) => (
							<li key={n.id}>
								<button type="button" style={candidate} onClick={() => choose(n.id)}>
									{nodeTitle(n)}
								</button>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	)
}

/** Target picker dropdown max height before it scrolls. */
const PICKER_MAX_HEIGHT = 180

const labelStyle: React.CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}

const pickerButton: React.CSSProperties = {
	width: '100%',
	textAlign: 'left',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	background: 'var(--surface-sunken)',
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	padding: '7px 10px',
	minHeight: 'var(--hit-target)',
	cursor: 'pointer',
}

const picker: React.CSSProperties = {
	listStyle: 'none',
	margin: 'var(--space-2) 0 0',
	padding: 'var(--space-1)',
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-card)',
	boxShadow: 'var(--shadow-menu)',
	maxHeight: PICKER_MAX_HEIGHT,
	overflowY: 'auto',
}

const candidate: React.CSSProperties = {
	width: '100%',
	textAlign: 'left',
	background: 'transparent',
	border: 'none',
	borderRadius: 'var(--r-sm)',
	padding: '8px 10px',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}
