import { useState } from 'react'
import { Field } from '../../../brain'
import type { PnjEntry } from '../utils/pnjCatalog'

export interface PnjPickerProps {
	/** Reusable PNJs in the book (the current node excluded by the owner). */
	candidates: PnjEntry[]
	/** Reuse the chosen PNJ by its owner node id. */
	onPick: (nodeId: string) => void
}

const UNNAMED = 'PNJ sans nom'

/**
 * « Choisir un PNJ du livre » (action-pnj iter 3) — reuse an existing PNJ by its
 * stable id (the owner node id) instead of authoring a new one. A toggle reveals
 * a searchable popover of catalog candidates; picking one stores a REFERENCE
 * resolved live, never copied. Mirrors the action-decor ReuseObjectPicker.
 */
export function PnjPicker({ candidates, onPick }: PnjPickerProps): JSX.Element {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')

	function toggle(): void {
		setQuery('')
		setOpen((v) => !v)
	}

	function pick(nodeId: string): void {
		onPick(nodeId)
		setOpen(false)
		setQuery('')
	}

	// Search is derived inline from the live candidates (KR-013), not mirrored.
	const needle = query.trim().toLowerCase()
	const matches =
		needle === '' ? candidates : candidates.filter((p) => (p.name || UNNAMED).toLowerCase().includes(needle))

	return (
		<div>
			<button type="button" onClick={toggle} style={button} aria-expanded={open}>
				↪ Réutiliser un PNJ du livre…
			</button>
			{open && (
				<div style={wrap}>
					<Field
						ariaLabel="Rechercher un PNJ à réutiliser"
						value={query}
						placeholder="Rechercher un PNJ…"
						autoFocus
						onChange={(e) => setQuery(e.target.value)}
					/>
					<ul style={list} aria-label="Choisir un PNJ à réutiliser">
						{matches.length === 0 ? (
							<li style={{ ...item, color: 'var(--text-faint)' }}>
								{candidates.length === 0 ? 'Aucun PNJ à réutiliser' : 'Aucun PNJ ne correspond'}
							</li>
						) : (
							matches.map((pnj) => (
								<li key={pnj.nodeId}>
									<button type="button" style={item} onClick={() => pick(pnj.nodeId)}>
										{pnj.name.trim() === '' ? UNNAMED : pnj.name}
									</button>
								</li>
							))
						)}
					</ul>
				</div>
			)}
		</div>
	)
}

/** Reuse popover dropdown max height before it scrolls. */
const LIST_MAX_HEIGHT = 180

const button: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--accent)',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-2)',
}

const wrap: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
	marginTop: 'var(--space-2)',
}

const list: React.CSSProperties = {
	listStyle: 'none',
	margin: 0,
	padding: 'var(--space-1)',
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-card)',
	boxShadow: 'var(--shadow-menu)',
	maxHeight: LIST_MAX_HEIGHT,
	overflowY: 'auto',
}

const item: React.CSSProperties = {
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
