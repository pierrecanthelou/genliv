import { useState } from 'react'
import { Field, type SavedMonster } from '../../../brain'

export interface MonsterLibraryPickerProps {
	/** The saved monsters available to instantiate. */
	library: SavedMonster[]
	/** Instantiate the chosen saved monster (a copy) into this node. */
	onPick: (saved: SavedMonster) => void
}

const UNNAMED = 'Monstre sans nom'

/**
 * « Choisir dans la librairie » (action-monster iter 3) — instantiate a saved
 * monster from the cross-book library as an independent COPY (a library monster
 * is reused across books, so it can't be a live reference). A toggle reveals a
 * searchable popover; mirrors the action-decor / action-pnj reuse pickers.
 */
export function MonsterLibraryPicker({ library, onPick }: MonsterLibraryPickerProps): JSX.Element {
	const [open, setOpen] = useState(false)
	const [query, setQuery] = useState('')

	function toggle(): void {
		setQuery('')
		setOpen((v) => !v)
	}

	function pick(saved: SavedMonster): void {
		onPick(saved)
		setOpen(false)
		setQuery('')
	}

	const needle = query.trim().toLowerCase()
	const matches =
		needle === '' ? library : library.filter((m) => (m.config.name || UNNAMED).toLowerCase().includes(needle))

	return (
		<div>
			<button type="button" onClick={toggle} style={button} aria-expanded={open}>
				↪ Choisir dans la librairie…
			</button>
			{open && (
				<div style={wrap}>
					<Field
						ariaLabel="Rechercher un monstre dans la librairie"
						value={query}
						placeholder="Rechercher un monstre…"
						autoFocus
						onChange={(e) => setQuery(e.target.value)}
					/>
					<ul style={list} aria-label="Choisir un monstre de la librairie">
						{matches.length === 0 ? (
							<li style={{ ...item, color: 'var(--text-faint)' }}>
								{library.length === 0 ? 'La librairie est vide' : 'Aucun monstre ne correspond'}
							</li>
						) : (
							matches.map((saved) => (
								<li key={saved.id}>
									<button type="button" style={item} onClick={() => pick(saved)}>
										{saved.config.name.trim() === '' ? UNNAMED : saved.config.name}
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

/** Library popover dropdown max height before it scrolls. */
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
