import { type CSSProperties } from 'react'
import { Badge, IconButton, HIT_TARGET_MIN, type DossierResume } from '../../../brain'
import { formatDate } from '../utils/formatDate'

export interface DossierCardProps {
	dossier: DossierResume
	/** Re-validate and trigger a file download — never called when `lisible` is false (no button rendered). */
	onDownload: (id: string) => void
	/** Request the dangerous delete confirmation; the dialog itself lives in LibraryScreen. */
	onRequestDelete: (dossier: DossierResume) => void
}

/**
 * One dossier in the library grid — an inert `<article>` (nothing to open
 * before the editor route lands in it2): title + date when readable, a named
 * failure otherwise. Reads the `lisible` discriminant FIRST: `dossier.titre`
 * is never accessed on the `lisible: false` branch — the union type itself
 * refuses it, so a stray access is a compile error, not a runtime accident.
 */
export function DossierCard({ dossier, onDownload, onRequestDelete }: DossierCardProps): JSX.Element {
	const displayName = dossier.lisible ? dossier.titre : dossier.id

	return (
		<article className="dossier-card" style={cardSurface}>
			{dossier.lisible ? (
				<>
					<span style={cardTitle}>{dossier.titre}</span>
					<span style={cardDate}>Modifié le {formatDate(dossier.updatedAt)}</span>
				</>
			) : (
				<>
					<Badge tone="bad">⚠ Dossier illisible</Badge>
					<span style={explanationText}>Ce fichier ne respecte plus le format attendu.</span>
					<span style={cardDate}>id : {dossier.id}</span>
				</>
			)}

			{dossier.lisible && (
				<button type="button" onClick={() => onDownload(dossier.id)} style={telechargerButtonStyle}>
					Télécharger le fichier
				</button>
			)}

			<div className="dossier-card__actions" style={actionsCorner}>
				<IconButton
					tone="danger"
					label={`Supprimer « ${displayName} »`}
					size={HIT_TARGET_MIN}
					onClick={() => onRequestDelete(dossier)}
				>
					✕
				</IconButton>
			</div>
		</article>
	)
}

const cardSurface: CSSProperties = {
	position: 'relative',
	background: 'var(--surface-card)',
	border: '1px solid var(--border-card)',
	borderRadius: 'var(--r-2xl)',
	boxShadow: 'var(--shadow-card)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	padding: 'var(--space-5)',
	// Reserve the action column (offset + one hit-target + gap) so the title never slips under it.
	paddingRight: 'calc(var(--space-3) + var(--hit-target) + var(--space-3))',
}

const cardTitle: CSSProperties = {
	display: 'block',
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}

const cardDate: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

const explanationText: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}

// Const LOCALE, jamais importée (le tour 2 tech-lead a fait de son import un
// veto § A.3) : les neuf déclarations exactes signées par le comité.
const telechargerButtonStyle: CSSProperties = {
	alignSelf: 'flex-start',
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-2)',
	border: 'none',
	background: 'none',
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
}

const actionsCorner: CSSProperties = {
	position: 'absolute',
	top: 'var(--space-3)',
	right: 'var(--space-3)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-2)',
}
