import { useRoute } from './brain'
import { LibraryScreen } from './features/book-library'
import { EditorScreen } from './EditorScreen'
import { SyncIndicator, ConflictDialog } from './features/cloud-sync'
import { ImportDossierButton } from './features/dossier-format'
import { CreateDossierEntry } from './features/book-creation'
import { DossierEditorScreen } from './features/bascule-editeur'
import { PanneauCanon, PanneauDepart, PanneauLieux } from './features/dossier-canon'
import { PanneauPersonnages } from './features/dossier-fiches'
import { PanneauObjets } from './features/dossier-objets'
import { PanneauIndices } from './features/dossier-registres'

/**
 * App shell — routes between the home (book-library), the Book editor
 * (chemin mort, démolition n° 9) and the Dossier editor, and is the
 * composition root: features are wired together here so they never import
 * each other. The home composes book-library's LibraryScreen with
 * dossier-format's import affordance and book-creation's create affordance;
 * the `dossier` route delegates to bascule-editeur's DossierEditorScreen.
 * Features communicate only through brain.
 */
export function App(): JSX.Element {
	const route = useRoute()
	const content =
		route.name === 'editor' ? (
			// Key by bookId so a book→book switch remounts the shell and re-seeds the
			// seed-once viewport from the new book's persisted prefs (KR-013).
			<EditorScreen key={route.bookId} bookId={route.bookId} />
		) : route.name === 'dossier' ? (
			// Key by dossierId so a dossier→dossier switch remounts the screen. The
			// Canon, Départ, Personnages, Lieux, Objets and Indices panels are injected
			// HERE, from the composition root: bascule-editeur never imports
			// dossier-canon, dossier-fiches, dossier-objets or dossier-registres, and
			// vice versa (KR-184).
			<DossierEditorScreen
				key={route.dossierId}
				dossierId={route.dossierId}
				panneaux={{
					canon: <PanneauCanon dossierId={route.dossierId} />,
					depart: <PanneauDepart dossierId={route.dossierId} />,
					personnages: <PanneauPersonnages dossierId={route.dossierId} />,
					lieux: <PanneauLieux dossierId={route.dossierId} />,
					objets: <PanneauObjets dossierId={route.dossierId} />,
					indices: <PanneauIndices dossierId={route.dossierId} />,
				}}
			/>
		) : (
			<LibraryScreen createEntry={<CreateDossierEntry />} importEntry={<ImportDossierButton />} />
		)
	// SyncIndicator overlays every route (composition root mounts it once).
	return (
		<>
			{content}
			<SyncIndicator />
			<ConflictDialog />
		</>
	)
}
