import { useState } from 'react'
import { nodeTitle, NODE_KINDS, type BookNode } from '../../../brain'

export interface TargetPickerProps {
	/** All nodes of the book (to list candidates + resolve the current target). */
	nodes: BookNode[]
	/** The node being edited (excluded from its own candidates). */
	nodeId: string
	/** The currently chosen « mène à » target node id, if any. */
	target: string | undefined
	onChange: (target: string | undefined) => void
}

/**
 * « Ensuite, le PNJ mène à » (§ 4A): pick a node the PNJ leads to — a non-choice
 * screen change (domain brief). Structural screens are never authored targets so
 * the Sommaire/Mort are excluded (KR-067, the canBeTarget flag), and a target
 * whose node was deleted is surfaced (⚠), never silently broken (KR-021/063).
 * The chosen id lives on pnj.target (config), pending promotion to a real edge.
 */
export function TargetPicker({ nodes, nodeId, target, onChange }: TargetPickerProps): JSX.Element {
	const [open, setOpen] = useState(false)
	const candidates = nodes.filter((n) => n.id !== nodeId && NODE_KINDS[n.kind].canBeTarget)
	const current = target !== undefined ? (nodes.find((n) => n.id === target) ?? null) : null
	const dangling = target !== undefined && current === null
	const summary =
		current !== null ? nodeTitle(current) : dangling ? '⚠ cible supprimée' : 'Aucune suite — fin de l’échange'

	function choose(next: string | undefined): void {
		onChange(next)
		setOpen(false)
	}

	return (
		<div>
			<span style={label}>Ensuite, le PNJ mène à</span>
			<button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={pickerButton}>
				{summary}
			</button>
			{open && (
				<ul style={picker} aria-label="Choisir le nœud suivant">
					<li>
						<button type="button" style={candidate} onClick={() => choose(undefined)}>
							— Aucune suite —
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

const label: React.CSSProperties = {
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
