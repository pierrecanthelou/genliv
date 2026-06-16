import { useState } from 'react'
import { useCreateBook } from '../hooks/useCreateBook'
import { NewBookButton } from './NewBookButton'
import { NewBookDialog } from './NewBookDialog'

/**
 * Home screen for the walking skeleton: a title + the « + Nouveau livre »
 * affordance that opens the creation dialog. On create, useCreateBook
 * seeds the book and navigates to its editor. The book list itself is
 * owned later by book-library.
 */
export function HomeScreen(): JSX.Element {
	const [dialogOpen, setDialogOpen] = useState(false)
	const createBook = useCreateBook()

	function handleCreate(title: string) {
		setDialogOpen(false)
		createBook(title)
	}

	return (
		<main
			style={{
				maxWidth: 720,
				margin: '0 auto',
				padding: 'var(--space-12) var(--space-9)',
			}}
		>
			<h1
				style={{
					fontSize: 'var(--fs-h1)',
					fontWeight: 'var(--fw-bold)',
					letterSpacing: 'var(--track-tighter)',
					color: 'var(--text-strong)',
					margin: '0 0 var(--space-3)',
				}}
			>
				Mes livres-jeux
			</h1>
			<p style={{ color: 'var(--text-muted)', margin: '0 0 var(--space-10)' }}>
				Composez un « livre dont vous êtes le héros » : un arbre d’écrans à explorer.
			</p>

			<NewBookButton onClick={() => setDialogOpen(true)} />

			{dialogOpen && <NewBookDialog onCancel={() => setDialogOpen(false)} onCreate={handleCreate} />}
		</main>
	)
}
