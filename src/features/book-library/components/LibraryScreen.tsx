import { useState, type ReactNode } from 'react'
import { type Book } from '../../../brain'
import { useLibrary } from '../hooks/useLibrary'
import { BookCard } from './BookCard'
import { DeleteBookDialog } from './DeleteBookDialog'

export interface LibraryScreenProps {
	/**
	 * The « + Nouveau livre » create affordance, injected by the composition
	 * root (book-creation) so the two features never import each other.
	 */
	createEntry: ReactNode
}

/**
 * Home screen and book list: lists every persisted book as a grid of cards
 * (click to open, ✕ to delete), with the create affordance composed in as
 * the last cell. The list is a live VIEW over BookService via useLibrary;
 * deletion is a dangerous action gated behind a confirmation dialog. The
 * pending-deletion target is local UI state, not derived from props (KR-013).
 */
export function LibraryScreen({ createEntry }: LibraryScreenProps): JSX.Element {
	const { books, open, rename, duplicate, remove } = useLibrary()
	const [pendingDelete, setPendingDelete] = useState<Book | null>(null)

	function handleConfirmDelete() {
		if (pendingDelete === null) return
		remove(pendingDelete.id)
		setPendingDelete(null)
	}

	return (
		<main style={page}>
			<h1 style={heading}>Mes livres-jeux</h1>
			<p style={intro}>Composez un « livre dont vous êtes le héros » : un arbre d’écrans à explorer.</p>

			<div style={grid}>
				{books.map((book) => (
					<BookCard
						key={book.id}
						book={book}
						onOpen={open}
						onRename={rename}
						onDuplicate={duplicate}
						onRequestDelete={setPendingDelete}
					/>
				))}
				<div style={{ display: 'flex' }}>{createEntry}</div>
			</div>

			{pendingDelete !== null && (
				<DeleteBookDialog
					book={pendingDelete}
					onCancel={() => setPendingDelete(null)}
					onConfirm={handleConfirmDelete}
				/>
			)}
		</main>
	)
}

/** Centred reading column width, and the grid's minimum card column. */
const PAGE_MAX_WIDTH = 720
const GRID_MIN_COL = 220

const page: React.CSSProperties = {
	maxWidth: PAGE_MAX_WIDTH,
	margin: '0 auto',
	padding: 'var(--space-12) var(--space-9)',
}

const heading: React.CSSProperties = {
	fontSize: 'var(--fs-h1)',
	fontWeight: 'var(--fw-bold)',
	letterSpacing: 'var(--track-tighter)',
	color: 'var(--text-strong)',
	margin: '0 0 var(--space-3)',
}

const intro: React.CSSProperties = {
	color: 'var(--text-muted)',
	margin: '0 0 var(--space-10)',
}

const grid: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_MIN_COL}px, 1fr))`,
	gap: 'var(--space-5)',
	alignItems: 'stretch',
}
