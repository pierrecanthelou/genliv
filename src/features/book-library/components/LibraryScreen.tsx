import { useState, type ReactNode } from 'react'
import { Field, SegmentedControl, type Book, type SegmentedOption } from '../../../brain'
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

/** Sort order for the library grid. */
type SortMode = 'recent' | 'alpha'

const SORT_OPTIONS: SegmentedOption<SortMode>[] = [
	{ value: 'recent', label: 'Récent' },
	{ value: 'alpha', label: 'A→Z' },
]

/**
 * Home screen and book list: lists every persisted book as a grid of cards
 * (click to open, ✕ to delete), with the create affordance composed in as
 * the last cell. The list is a live VIEW over BookService via useLibrary;
 * deletion is a dangerous action gated behind a confirmation dialog. The
 * pending-deletion target, search query, and sort mode are local UI state,
 * never useEffect-mirrored — the filtered/sorted list is derived inline (KR-013).
 */
export function LibraryScreen({ createEntry }: LibraryScreenProps): JSX.Element {
	const { books, open, rename, duplicate, remove } = useLibrary()
	const [pendingDelete, setPendingDelete] = useState<Book | null>(null)
	const [query, setQuery] = useState('')
	const [sort, setSort] = useState<SortMode>('recent')

	function handleConfirmDelete() {
		if (pendingDelete === null) return
		remove(pendingDelete.id)
		setPendingDelete(null)
	}

	// Filter + sort are pure derived views over the live list (KR-013): never
	// mutate the snapshot array from useBooks — sort a copy.
	const needle = query.trim().toLowerCase()
	const filtered = needle === '' ? books : books.filter((b) => b.title.toLowerCase().includes(needle))
	const visible = [...filtered].sort((a, b) =>
		sort === 'alpha' ? a.title.localeCompare(b.title, 'fr') : b.updatedAt.localeCompare(a.updatedAt),
	)

	return (
		<main style={page}>
			<h1 style={heading}>Mes livres-jeux</h1>
			<p style={intro}>Composez un « livre dont vous êtes le héros » : un arbre d’écrans à explorer.</p>

			{books.length > 0 && (
				<div style={toolbar}>
					<div style={{ flex: 1 }}>
						<Field
							ariaLabel="Rechercher un livre"
							value={query}
							placeholder="Rechercher un livre…"
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
					<SegmentedControl ariaLabel="Trier les livres" options={SORT_OPTIONS} value={sort} onChange={setSort} />
				</div>
			)}

			{books.length === 0 && (
				<div style={emptyState} role="note">
					<span style={emptyGlyph} aria-hidden="true">
						❏
					</span>
					<p style={emptyText}>
						Votre bibliothèque est vide. Créez votre premier livre-jeu pour commencer à bâtir son arbre d’écrans.
					</p>
				</div>
			)}

			{books.length > 0 && visible.length === 0 && (
				<p style={noMatch} role="status">
					Aucun livre ne correspond à « {query.trim()} ».
				</p>
			)}

			<div style={grid}>
				{visible.map((book) => (
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
	margin: '0 0 var(--space-8)',
}

const toolbar: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-4)',
	margin: '0 0 var(--space-8)',
}

const emptyState: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
	margin: '0 0 var(--space-6)',
}

const emptyGlyph: React.CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

const emptyText: React.CSSProperties = {
	margin: 0,
	maxWidth: 360,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}

const noMatch: React.CSSProperties = {
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	margin: '0 0 var(--space-6)',
}

const grid: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_MIN_COL}px, 1fr))`,
	gap: 'var(--space-5)',
	alignItems: 'stretch',
}
