import { useEffect } from 'react'
import { useBrain, useRoute, type Route } from './brain'
import { LibraryScreen } from './features/book-library'
import { EditorScreen } from './EditorScreen'
import { SyncIndicator, ConflictDialog } from './features/cloud-sync'
import { ImportDossierButton } from './features/dossier-format'

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
 * dossier-format's import affordance; the editor route delegates to the
 * EditorScreen shell. Features communicate only through brain.
 *
 * `createEntry` is deliberately NOT passed to `LibraryScreen` this iteration:
 * book-creation still builds `Book`s, which would be invisible in a library
 * that now only lists `Dossier`s. book-creation is repointed onto dossiers
 * in itération 2.
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
			<LibraryScreen importEntry={<ImportDossierButton />} />
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
