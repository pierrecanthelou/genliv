import { useRoute } from './brain'
import { HomeScreen } from './features/book-creation'
import { TreeCanvas } from './features/tree-canvas'
import { NodeEditorPanel } from './features/node-editor'

/**
 * App shell — routes between the home (book-creation) and the editor. The
 * editor composes two isolated features side-by-side (§ 02): the tree-canvas
 * and the node-editor panel. They communicate only through brain (selection +
 * BookService), never by importing each other.
 */
export function App(): JSX.Element {
	const route = useRoute()
	switch (route.name) {
		case 'editor':
			return (
				<div style={{ display: 'flex', height: '100vh' }}>
					<div style={{ flex: 1, minWidth: 0 }}>
						<TreeCanvas />
					</div>
					<NodeEditorPanel />
				</div>
			)
		case 'home':
		default:
			return <HomeScreen />
	}
}
