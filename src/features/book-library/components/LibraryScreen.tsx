import { useState, type ReactNode } from 'react'
import { Field, SegmentedControl, type DossierResume, type SegmentedOption } from '../../../brain'
import { useDossierLibrary } from '../hooks/useDossierLibrary'
import { selectVisibleDossiers, type SortMode } from '../utils/selectVisibleDossiers'
import { DossierCard } from './DossierCard'
import { DeleteDossierDialog } from './DeleteDossierDialog'

export interface LibraryScreenProps {
	/**
	 * The « + Nouveau dossier » create affordance (book-creation's
	 * CreateDossierEntry, mounted by App.tsx since bascule-editeur it2). Kept
	 * OPTIONAL rather than required so book-creation's contract with this
	 * screen never has to move again if a future context needs to omit it.
	 */
	createEntry?: ReactNode
	/** « Importer un dossier », injected by the composition root (App.tsx). */
	importEntry?: ReactNode
}

const SORT_OPTIONS: SegmentedOption<SortMode>[] = [
	{ value: 'recent', label: 'Récent' },
	{ value: 'alpha', label: 'A→Z' },
]

/**
 * Home screen and dossier list: lists every persisted dossier as a grid of
 * cards (download / ✕ to delete / click the title to open, since bascule-editeur
 * it2 — a `lisible:false` card offers none of the three), with the create and
 * import affordances composed in as the last cell. The list is a live VIEW
 * over DossierService via useDossierLibrary;
 * deletion is a dangerous action gated behind a confirmation dialog. The
 * pending-deletion target, search query, and sort mode are local UI state,
 * never useEffect-mirrored — the filtered/sorted list is derived inline (KR-013).
 */
export function LibraryScreen({ createEntry, importEntry }: LibraryScreenProps): JSX.Element {
	const { dossiers, livresHerites, download, remove, open } = useDossierLibrary()
	const [pendingDelete, setPendingDelete] = useState<DossierResume | null>(null)
	const [query, setQuery] = useState('')
	const [sort, setSort] = useState<SortMode>('recent')

	function handleConfirmDelete() {
		if (pendingDelete === null) return
		remove(pendingDelete.id)
		setPendingDelete(null)
	}

	// Filtered + sorted view of the live list, derived inline via a pure helper
	// (KR-013); selectVisibleDossiers never mutates the useDossiers snapshot.
	const visible = selectVisibleDossiers(dossiers, query, sort)

	return (
		<main style={page}>
			<h1 style={heading}>Mes dossiers d&apos;aventure</h1>
			<p style={intro}>Retrouvez un dossier déjà importé, téléchargez-le ou supprimez-le.</p>

			{dossiers.length > 0 && (
				<div style={toolbar}>
					<div style={{ flex: 1 }}>
						<Field
							ariaLabel="Rechercher un dossier"
							value={query}
							placeholder="Rechercher un dossier…"
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
					<SegmentedControl ariaLabel="Trier les dossiers" options={SORT_OPTIONS} value={sort} onChange={setSort} />
				</div>
			)}

			{dossiers.length === 0 && (
				<div style={emptyState} role="note">
					<span style={emptyGlyph} aria-hidden="true">
						❏
					</span>
					<p style={emptyText}>
						{livresHerites > 0 ? (
							<>
								Aucun dossier d&apos;aventure ici pour l&apos;instant : vos anciens livres restent stockés, mais ne
								s&apos;affichent plus pendant la bascule. Importez un dossier pour commencer.
							</>
						) : (
							<>Votre bibliothèque est vide. Importez un dossier d&apos;aventure pour commencer.</>
						)}
					</p>
				</div>
			)}

			{dossiers.length > 0 && visible.length === 0 && (
				<p style={noMatch} role="status">
					Aucun dossier ne correspond à « {query.trim()} ».
				</p>
			)}

			<div style={grid}>
				{visible.map((dossier) => (
					<DossierCard
						key={dossier.id}
						dossier={dossier}
						onDownload={download}
						onRequestDelete={setPendingDelete}
						onOpen={open}
					/>
				))}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
					{createEntry}
					{importEntry}
				</div>
			</div>

			{pendingDelete !== null && (
				<DeleteDossierDialog
					dossier={pendingDelete}
					onCancel={() => setPendingDelete(null)}
					onConfirm={handleConfirmDelete}
				/>
			)}
		</main>
	)
}

/** Centred reading column width, and the grid's minimum card column. */
const PAGE_MAX_WIDTH = 720
const GRID_MIN_COL = 220

const page: React.CSSProperties = {
	maxWidth: PAGE_MAX_WIDTH,
	margin: '0 auto',
	padding: 'var(--space-12) var(--space-9)',
}

const heading: React.CSSProperties = {
	fontSize: 'var(--fs-h1)',
	fontWeight: 'var(--fw-bold)',
	letterSpacing: 'var(--track-tighter)',
	color: 'var(--text-strong)',
	margin: '0 0 var(--space-3)',
}

const intro: React.CSSProperties = {
	color: 'var(--text-muted)',
	margin: '0 0 var(--space-8)',
}

const toolbar: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-4)',
	margin: '0 0 var(--space-8)',
}

const emptyState: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
	margin: '0 0 var(--space-6)',
}

const emptyGlyph: React.CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

const emptyText: React.CSSProperties = {
	margin: 0,
	maxWidth: 360,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}

const noMatch: React.CSSProperties = {
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	margin: '0 0 var(--space-6)',
}

const grid: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_MIN_COL}px, 1fr))`,
	gap: 'var(--space-5)',
	alignItems: 'stretch',
}
