import { useEffect } from 'react'
import { useBrain, useRoute } from './brain'
import { CreateBookEntry } from './features/book-creation'
import { LibraryScreen } from './features/book-library'
import { EditorScreen } from './EditorScreen'
import { registerChoiceLinking } from './features/choice-linking'
import { registerActionDecor } from './features/action-decor'
import { registerActionPnj } from './features/action-pnj'
import { registerActionMonster } from './features/action-monster'
import { registerActionTrap } from './features/action-trap'
import { SyncIndicator } from './features/cloud-sync'

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
	const { slots, actions, events, router } = useBrain()
	const route = useRoute()
	// Register pluggable feature renderers once (external registry wiring, KR-013 ok).
	useEffect(() => {
		const offChoices = registerChoiceLinking(slots)
		const offDecor = registerActionDecor(actions)
		const offPnj = registerActionPnj(actions)
		const offMonster = registerActionMonster(actions)
		const offTrap = registerActionTrap(actions)
		return () => {
			offChoices()
			offDecor()
			offPnj()
			offMonster()
			offTrap()
		}
	}, [slots, actions])
	// Guard a dangling editor route: if the book currently open in the editor is
	// deleted (e.g. from the library), navigate home so the editor never points
	// at a removed book (KR-071). The route is read fresh inside the handler, so
	// the subscription needs no route dependency (no stale closure, KR-013).
	useEffect(() => {
		return events.on('book:deleted', ({ bookId }) => {
			const current = router.current()
			if (current.name === 'editor' && current.bookId === bookId) {
				router.navigate({ name: 'home' })
			}
		})
	}, [events, router])
	const content =
		route.name === 'editor' ? (
			<EditorScreen bookId={route.bookId} />
		) : (
			<LibraryScreen createEntry={<CreateBookEntry />} />
		)
	// SyncIndicator overlays both routes (composition root mounts it once).
	return (
		<>
			{content}
			<SyncIndicator />
		</>
	)
}
