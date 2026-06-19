import { useState } from 'react'
import { Field, type GameObject } from '../../../brain'

export interface ReuseObjectPickerProps {
	/** Catalog objects available to reuse (already-present ones excluded by the owner). */
	candidates: GameObject[]
	/** Reuse the chosen object by its stable id. */
	onPick: (objectId: string) => void
}

const UNNAMED = 'Objet sans nom'

/**
 * « Prendre dans la liste » (action-decor iter 3) — reuse an existing acquirable
 * object by stable id instead of authoring a new one (KR-062). A toggle reveals a
 * searchable popover of catalog candidates; picking one adds a REFERENCE takeable
 * (resolved live, never copied). Mirrors the choice-linking relink popover.
 */
export function ReuseObjectPicker({ candidates, onPick }: ReuseObjectPickerProps): JSX.Element {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')

	function toggle(): void {
		setQuery('')
		setOpen((v) => !v)
	}

	function pick(objectId: string): void {
		onPick(objectId)
		setOpen(false)
		setQuery('')
	}

	// Search is derived inline from the live candidates (KR-013), not mirrored.
	const needle = query.trim().toLowerCase()
	const matches =
		needle === '' ? candidates : candidates.filter((o) => (o.name || UNNAMED).toLowerCase().includes(needle))

	return (
		<div>
			<button type="button" onClick={toggle} style={button} aria-expanded={open}>
				↪ Prendre dans la liste…
			</button>
			{open && (
				<div style={wrap}>
					<Field
						ariaLabel="Rechercher un objet à réutiliser"
						value={query}
						placeholder="Rechercher un objet…"
						autoFocus
						onChange={(e) => setQuery(e.target.value)}
					/>
					<ul style={list} aria-label="Choisir un objet à réutiliser">
						{matches.length === 0 ? (
							<li style={{ ...item, color: 'var(--text-faint)' }}>
								{candidates.length === 0 ? 'Aucun objet à réutiliser' : 'Aucun objet ne correspond'}
							</li>
						) : (
							matches.map((obj) => (
								<li key={obj.id}>
									<button type="button" style={item} onClick={() => pick(obj.id)}>
										{obj.name.trim() === '' ? UNNAMED : obj.name}
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
