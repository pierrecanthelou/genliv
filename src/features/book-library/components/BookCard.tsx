import { IconButton, HIT_TARGET_MIN, plural, type Book } from '../../../brain'

export interface BookCardProps {
	book: Book
	onOpen: (id: string) => void
	onRequestDelete: (book: Book) => void
}

/** Card surface height — tall enough for title + meta with breathing room. */
const CARD_MIN_HEIGHT = 96

/**
 * One book in the library grid: a clickable surface that opens the book in
 * the editor, with its title + a screen count, and a delete affordance. The
 * delete button is a sibling of the open button (not nested), so clicking it
 * never also opens the book; deletion is a dangerous action, so it only
 * requests confirmation (handled upstream).
 */
export function BookCard({ book, onOpen, onRequestDelete }: BookCardProps): JSX.Element {
	const screenCount = book.nodes.length

	return (
		<article style={cardSurface}>
			<button type="button" onClick={() => onOpen(book.id)} style={openButton}>
				<span style={cardTitle}>{book.title}</span>
				<span style={cardMeta}>
					{screenCount} {plural(screenCount, 'écran')}
				</span>
			</button>
			<div style={deleteCorner}>
				<IconButton
					tone="danger"
					label={`Supprimer « ${book.title} »`}
					size={HIT_TARGET_MIN}
					onClick={() => onRequestDelete(book)}
				>
					✕
				</IconButton>
			</div>
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
	// Reserve the delete button's column (offset + hit-target + gap) so the title never slips under it.
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
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}

const deleteCorner: React.CSSProperties = {
	position: 'absolute',
	top: 'var(--space-3)',
	right: 'var(--space-3)',
}
