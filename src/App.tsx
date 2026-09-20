import { useRoute } from './brain'
import { LibraryScreen } from './features/book-library'
import { EditorScreen } from './EditorScreen'
import { SyncIndicator, ConflictDialog } from './features/cloud-sync'
import { ImportDossierButton } from './features/dossier-format'
import { CreateDossierEntry } from './features/book-creation'
import { DossierEditorScreen } from './features/bascule-editeur'
import { EcranPartie } from './features/play-mode'
import { PanneauControles } from './features/dossier-controles'
import { PanneauCopilote } from './features/dossier-copilote'
import { PanneauCanon, PanneauDepart, PanneauLieux } from './features/dossier-canon'
import { PanneauPersonnages } from './features/dossier-fiches'
import { PanneauObjets } from './features/dossier-objets'
import {
	PanneauIndices,
	PanneauJalonsFins,
	PanneauQuetes,
	PanneauEvenements,
	PanneauConditions,
} from './features/dossier-registres'

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
			// Key by dossierId so a dossier→dossier switch remounts the screen. ALL TEN
			// section panels are injected HERE, from the composition root — the list is
			// the `panneaux` map below, never re-enumerated in prose (a recopied list
			// drifts, KR-159: this comment named eight of them for two iterations).
			// bascule-editeur never imports dossier-canon, dossier-fiches,
			// dossier-objets or dossier-registres, and vice versa (KR-184).
			<DossierEditorScreen
				key={route.dossierId}
				dossierId={route.dossierId}
				panneauControles={(onSelectSection) => (
					<PanneauControles dossierId={route.dossierId} onSelectSection={onSelectSection} />
				)}
				panneauCopilote={(onSelectSection) => (
					<PanneauCopilote dossierId={route.dossierId} onSelectSection={onSelectSection} />
				)}
				panneaux={{
					canon: <PanneauCanon dossierId={route.dossierId} />,
					depart: <PanneauDepart dossierId={route.dossierId} />,
					personnages: <PanneauPersonnages dossierId={route.dossierId} />,
					lieux: <PanneauLieux dossierId={route.dossierId} />,
					objets: <PanneauObjets dossierId={route.dossierId} />,
					indices: <PanneauIndices dossierId={route.dossierId} />,
					quetes: <PanneauQuetes dossierId={route.dossierId} />,
					evenements: <PanneauEvenements dossierId={route.dossierId} />,
					conditions: <PanneauConditions dossierId={route.dossierId} />,
					'jalons-fins': <PanneauJalonsFins dossierId={route.dossierId} />,
				}}
			/>
		) : route.name === 'partie' ? (
			// La route `partie` (n° 9 `moteur-dossier`, itération 1) monte le shell de
			// `play-mode` sur le MÊME `dossierId` — c'est le seul rendez-vous entre
			// l'éditeur et le moteur, et c'est ce qui rend la jonction possible sans
			// un seul import croisé : `bascule-editeur` navigue, la racine monte.
			// Keyé par `dossierId` pour la même raison que les deux branches
			// au-dessus : un changement de dossier remonte le shell, donc re-gèle le
			// dossier et rouvre une session (le dossier est GELÉ à l'ouverture,
			// arbitrage n° 7).
			<EcranPartie key={route.dossierId} dossierId={route.dossierId} />
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
