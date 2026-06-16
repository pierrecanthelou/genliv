import { useRoute } from './brain'
import { HomeScreen } from './features/book-creation'
import { EditorStub } from './EditorStub'

/**
 * App shell — routes between the home (book-creation) and the editor.
 * Navigation is driven by the brain Router; the shell only maps route → view.
 */
export function App(): JSX.Element {
	const route = useRoute()
	switch (route.name) {
		case 'editor':
			return <EditorStub />
		case 'home':
		default:
			return <HomeScreen />
	}
}
