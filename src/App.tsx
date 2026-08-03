import { useEffect } from 'react'
import { useBrain, useRoute, type Route } from './brain'
import { CreateBookEntry } from './features/book-creation'
import { LibraryScreen } from './features/book-library'
import { EditorScreen } from './EditorScreen'
import { SyncIndicator, ConflictDialog } from './features/cloud-sync'

/**
 * True when `route` is the editor showing `bookId` — the one screen a delete
 * must not strand (KR-071). Named so the guard reads as a question, not inline
 * route logic.
 */
function isEditingBook(route: Route, bookId: string): boolean {
	return route.name === 'editor' && route.bookId === bookId
}

/**
 * App shell — routes between the home (book-library) and the editor, and is
 * the composition root: features are wired together here so they never import
 * each other. The home composes book-library's LibraryScreen with
 * book-creation's create affordance; the editor route delegates to the
 * EditorScreen shell. Features communicate only through brain.
 */
export function App(): JSX.Element {
	const { events, router } = useBrain()
	const route = useRoute()
	// Guard a dangling editor route: if the book currently open in the editor is
	// deleted (e.g. from the library), navigate home so the editor never points
	// at a removed book (KR-071). The route is read fresh inside the handler, so
	// the subscription needs no route dependency (no stale closure, KR-013).
	useEffect(() => {
		return events.on('book:deleted', ({ bookId }) => {
			if (isEditingBook(router.current(), bookId)) router.navigate({ name: 'home' })
		})
	}, [events, router])
	const content =
		route.name === 'editor' ? (
			// Key by bookId so a book→book switch remounts the shell and re-seeds the
			// seed-once viewport from the new book's persisted prefs (KR-013).
			<EditorScreen key={route.bookId} bookId={route.bookId} />
		) : (
			<LibraryScreen createEntry={<CreateBookEntry />} />
		)
	// SyncIndicator overlays both routes (composition root mounts it once).
	return (
		<>
			{content}
			<SyncIndicator />
			<ConflictDialog />
		</>
	)
}
