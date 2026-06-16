import { IconButton, type Book } from '../../../brain'

export interface BookCardProps {
	book: Book
	onOpen: (id: string) => void
	onRequestDelete: (book: Book) => void
}

/**
 * One book in the library grid: a clickable surface that opens the book in
 * the editor, with its title + a screen count, and a delete affordance. The
 * delete button stops propagation so it never also opens the book; deletion
 * is a dangerous action, so it only requests confirmation (handled upstream).
 */
export function BookCard({ book, onOpen, onRequestDelete }: BookCardProps): JSX.Element {
	const screenCount = book.nodes.length

	return (
		<article
			style={{
				position: 'relative',
				background: 'var(--surface-card)',
				border: '1px solid var(--border-card)',
				borderRadius: 'var(--r-2xl)',
				boxShadow: 'var(--shadow-card)',
			}}
		>
			<button
				type="button"
				onClick={() => onOpen(book.id)}
				style={{
					display: 'block',
					width: '100%',
					textAlign: 'left',
					minHeight: 96,
					padding: 'var(--space-5)',
					// Reserve the delete button's column (offset + 44px + gap) so the title never slips under it.
					paddingRight: 'calc(var(--space-3) + 44px + var(--space-3))',
					border: 'none',
					background: 'none',
					borderRadius: 'var(--r-2xl)',
					cursor: 'pointer',
					fontFamily: 'var(--font-ui)',
				}}
			>
				<span
					style={{
						display: 'block',
						fontSize: 'var(--fs-title)',
						fontWeight: 'var(--fw-semibold)',
						color: 'var(--text-strong)',
						marginBottom: 'var(--space-2)',
					}}
				>
					{book.title}
				</span>
				<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)', color: 'var(--text-muted)' }}>
					{screenCount} écran{screenCount > 1 ? 's' : ''}
				</span>
			</button>
			<div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)' }}>
				<IconButton
					tone="danger"
					label={`Supprimer « ${book.title} »`}
					size={44}
					onClick={() => onRequestDelete(book)}
				>
					✕
				</IconButton>
			</div>
		</article>
	)
}
