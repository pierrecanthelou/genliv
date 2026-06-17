import { useState, type KeyboardEvent } from 'react'
import { IconButton, HIT_TARGET_MIN, effectiveKind, plural, type Book } from '../../../brain'
import { formatDate } from '../utils/formatDate'

export interface BookCardProps {
	book: Book
	onOpen: (id: string) => void
	onRename: (id: string, title: string) => void
	onDuplicate: (id: string) => void
	onRequestDelete: (book: Book) => void
}

/** Card surface height — tall enough for title + two meta lines with breathing room. */
const CARD_MIN_HEIGHT = 116

/**
 * One book in the library grid: a clickable surface that opens the book in the
 * editor, showing its title plus meta (screen / link / ending counts and the
 * last-modified date). Hover (or keyboard focus) reveals the rename, duplicate
 * and delete actions; the title can be renamed in place. The action buttons are
 * siblings of the open button (not nested) so they never also open the book;
 * deletion only REQUESTS confirmation (the dangerous action is handled upstream).
 */
export function BookCard({ book, onOpen, onRename, onDuplicate, onRequestDelete }: BookCardProps): JSX.Element {
	const [editing, setEditing] = useState(false)
	const [draft, setDraft] = useState(book.title)

	const screenCount = book.nodes.length
	const linkCount = book.edges.length
	const endingCount = book.nodes.filter((n) => effectiveKind(n) === 'fin').length

	function startRename(): void {
		setDraft(book.title)
		setEditing(true)
	}

	function commitRename(): void {
		const trimmed = draft.trim()
		// A blank or unchanged rename is a no-op (BookService rejects blanks too and
		// stores titles trimmed, so compare against the trimmed stored title).
		if (trimmed !== '' && trimmed !== book.title.trim()) onRename(book.id, trimmed)
		setEditing(false)
	}

	function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
		if (e.key === 'Enter') commitRename()
		else if (e.key === 'Escape') setEditing(false)
	}

	return (
		<article className="book-card" style={cardSurface}>
			{editing ? (
				<div style={editBox}>
					<input
						type="text"
						autoFocus
						value={draft}
						aria-label={`Renommer « ${book.title} »`}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={handleKeyDown}
						onBlur={commitRename}
						style={renameInput}
					/>
				</div>
			) : (
				<button type="button" onClick={() => onOpen(book.id)} style={openButton}>
					<span style={cardTitle}>{book.title}</span>
					<span style={cardMeta}>
						{screenCount} {plural(screenCount, 'écran')} · {linkCount} {plural(linkCount, 'lien')} · {endingCount}{' '}
						{plural(endingCount, 'fin')}
					</span>
					<span style={cardDate}>Modifié le {formatDate(book.updatedAt)}</span>
				</button>
			)}

			{!editing && (
				<div className="book-card__actions" style={actionsCorner}>
					<IconButton label={`Renommer « ${book.title} »`} size={HIT_TARGET_MIN} onClick={startRename}>
						✎
					</IconButton>
					<IconButton label={`Dupliquer « ${book.title} »`} size={HIT_TARGET_MIN} onClick={() => onDuplicate(book.id)}>
						⧉
					</IconButton>
					<IconButton
						tone="danger"
						label={`Supprimer « ${book.title} »`}
						size={HIT_TARGET_MIN}
						onClick={() => onRequestDelete(book)}
					>
						✕
					</IconButton>
				</div>
			)}
		</article>
	)
}

const cardSurface: React.CSSProperties = {
	position: 'relative',
	background: 'var(--surface-card)',
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-2xl)',
	boxShadow: 'var(--shadow-card)',
}

const openButton: React.CSSProperties = {
	display: 'block',
	width: '100%',
	textAlign: 'left',
	minHeight: CARD_MIN_HEIGHT,
	padding: 'var(--space-5)',
	// Reserve the action column (offset + one hit-target + gap) so the title never slips under it.
	paddingRight: 'calc(var(--space-3) + var(--hit-target) + var(--space-3))',
	border: 'none',
	background: 'none',
	borderRadius: 'var(--r-2xl)',
	cursor: 'pointer',
	fontFamily: 'var(--font-ui)',
}

const cardTitle: React.CSSProperties = {
	display: 'block',
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
	marginBottom: 'var(--space-2)',
}

const cardMeta: React.CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
	marginBottom: 'var(--space-1)',
}

const cardDate: React.CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

const editBox: React.CSSProperties = {
	minHeight: CARD_MIN_HEIGHT,
	padding: 'var(--space-5)',
	display: 'flex',
	alignItems: 'flex-start',
}

const renameInput: React.CSSProperties = {
	width: '100%',
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	padding: '7px 10px',
	background: 'var(--surface-sunken)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
	boxSizing: 'border-box',
}

const actionsCorner: React.CSSProperties = {
	position: 'absolute',
	top: 'var(--space-3)',
	right: 'var(--space-3)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
}
