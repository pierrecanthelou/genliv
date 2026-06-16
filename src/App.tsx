import { useEffect } from 'react'
import { useBrain, useRoute } from './brain'
import { CreateBookEntry } from './features/book-creation'
import { LibraryScreen } from './features/book-library'
import { EditorScreen } from './EditorScreen'
import { registerChoiceLinking } from './features/choice-linking'

/**
 * App shell — routes between the home (book-library) and the editor, and is
 * the composition root: it wires pluggable features into the brain registries
 * (e.g. choice-linking into node-editor's choices slot) so features never
 * import each other. The home composes book-library's LibraryScreen with
 * book-creation's create affordance; the editor route delegates to the
 * EditorScreen shell (canvas ↔ outline + node-editor panel). Features
 * communicate only through brain.
 */
export function App(): JSX.Element {
	const { slots } = useBrain()
	const route = useRoute()
	// Register feature slot renderers once (external registry wiring, KR-013 ok).
	useEffect(() => registerChoiceLinking(slots), [slots])
	switch (route.name) {
		case 'editor':
			return <EditorScreen bookId={route.bookId} />
		case 'home':
		default:
			return <LibraryScreen createEntry={<CreateBookEntry />} />
	}
}
