import { useState } from 'react'
import { useCreateBook } from '../hooks/useCreateBook'
import { NewBookButton } from './NewBookButton'
import { NewBookDialog } from './NewBookDialog'

/**
 * The « + Nouveau livre » affordance + creation dialog, decoupled from any
 * page chrome so the composition root can drop it into the library grid
 * (book-library) without the two features importing each other. On create,
 * useCreateBook seeds the book and navigates to its editor.
 */
export function CreateBookEntry(): JSX.Element {
	const [dialogOpen, setDialogOpen] = useState(false)
	const createBook = useCreateBook()

	function handleCreate(title: string) {
		setDialogOpen(false)
		createBook(title)
	}

	return (
		<>
			<NewBookButton onClick={() => setDialogOpen(true)} />
			{dialogOpen && <NewBookDialog onCancel={() => setDialogOpen(false)} onCreate={handleCreate} />}
		</>
	)
}
