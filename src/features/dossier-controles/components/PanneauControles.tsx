import type { CSSProperties } from 'react'
import { controlerDossier, useOpenDossier, type SectionId } from '../../../brain'
import { ListeControles } from './ListeControles'

export interface PanneauControlesProps {
	dossierId: string
	/**
	 * Le rappel de navigation — REQUIS, fourni par `DossierEditorScreen` en
	 * render-prop (§ 4 du plan d'itération 4) : `(onSelectSection) => (<PanneauControles
	 * … onSelectSection={onSelectSection} />)`. Ce panneau ne connaît que
	 * `SectionId`, jamais `DestinationNav` (local à `bascule-editeur`).
	 */
	onSelectSection: (section: SectionId) => void
}

/**
 * Texte exact du § 3 du plan — le mot « connus » ne se retire pas : c'est lui
 * qui porte la limite du dossier importé (une prose non blanche mais creuse
 * n'est vue par aucune règle littérale, hors périmètre § 2 n° 2 du plan).
 */
const TEXTE_ETAT_CALME = 'Aucun contrôle à signaler — le dossier passe tous les contrôles connus.'

/**
 * Le panneau Contrôles — injecté par la racine de composition (`App.tsx`,
 * KR-184), jamais importé par `bascule-editeur`. N'ÉTEND PAS `PanneauSection`
 * (fichier neuf, § 3 du plan) : le gabarit `page` est calqué sur le sien mais
 * cette surface n'a pas vocation à devenir une dixième section.
 *
 * `controlerDossier` est PURE, TOTALE, SYNCHRONE (`brain/dossier/controles.ts`) :
 * le rapport est recalculé À CHAQUE RENDU, en ligne, jamais mis en cache ni
 * miroité par un `useEffect` (KR-013/113) — la dérivation la moins chère
 * possible pour un calcul qui ne dépend que du dossier déjà en main.
 */
export function PanneauControles({ dossierId, onSelectSection }: PanneauControlesProps): JSX.Element | null {
	const dossier = useOpenDossier(dossierId)
	if (dossier === null) return null

	const rapport = controlerDossier(dossier)

	return (
		<div style={page}>
			{rapport.controles.length === 0 ? (
				<div style={emptyState}>
					<span style={emptyGlyph} aria-hidden="true">
						⬚
					</span>
					<p style={emptyText}>{TEXTE_ETAT_CALME}</p>
				</div>
			) : (
				<ListeControles controles={rapport.controles} onSelectSection={onSelectSection} />
			)}
		</div>
	)
}

// Calqué sur `PanneauSection.page` (§ 3 du plan) : c'est ce conteneur qui
// défile, jamais la liste elle-même (`ListeControles` a perdu `overflowY`).
const page: CSSProperties = {
	flex: 1,
	minHeight: 0,
	boxSizing: 'border-box',
	overflowY: 'auto',
	padding: 'var(--space-12)',
}

// Gabarit `emptyState` de `PanneauSection`, jetons identiques (§ 3 du plan).
const emptyState: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
	maxWidth: 480,
}

const emptyGlyph: CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

const emptyText: CSSProperties = {
	margin: 0,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
