import type { CSSProperties } from 'react'
import { SECTIONS, type SectionId } from '../../../brain'

export interface PanneauSectionProps {
	sectionId: SectionId
}

/**
 * Le GLYPHE de famille et le NUMÉRO DE FEATURE qui livrera l'écran d'édition
 * réel de chaque section — délibérément ABSENTS de `SECTIONS` (`brain/`, qui
 * ne connaît ni glyphe ni texte de feature, voir le commentaire d'en-tête de
 * `sections.ts`). Table construite ICI, côté feature, et EXHAUSTIVE sur
 * `SectionId` : `Record<SectionId, …>` fait échouer `tsc` si une section
 * manque — la garantie est la compilation, pas ce commentaire. Valeurs du §3
 * du plan d'itération 3 de `bascule-editeur`.
 */
const PANNEAU_PAR_SECTION: Record<SectionId, { glyphe: string; featureNum: number }> = {
	canon: { glyphe: '✎', featureNum: 3 },
	depart: { glyphe: '✎', featureNum: 3 },
	personnages: { glyphe: '❏', featureNum: 4 },
	lieux: { glyphe: '❏', featureNum: 3 },
	objets: { glyphe: '❏', featureNum: 5 },
	indices: { glyphe: '❏', featureNum: 6 },
	quetes: { glyphe: '❏', featureNum: 6 },
	evenements: { glyphe: '❏', featureNum: 6 },
	conditions: { glyphe: '⊘', featureNum: 6 },
	'jalons-fins': { glyphe: '⊘', featureNum: 6 },
}

/**
 * L'état vide du panneau droit — NOMMÉ mais honnête : le même gabarit pour les
 * dix sections, jamais « Aucun·e {section}. » (faux pour Canon/Départ/Lieux
 * dès la création par `DossierService.create()` — désaccord 5 du plan
 * d'itération 3). Aucun élément focalisable ici : le focus au clavier reste
 * sur la ligne de nav activée (contrat clavier, §3 du plan).
 */
export function PanneauSection({ sectionId }: PanneauSectionProps): JSX.Element {
	const descripteur = SECTIONS.find((section) => section.id === sectionId)
	const titre = descripteur !== undefined ? descripteur.titre : sectionId
	const { glyphe, featureNum } = PANNEAU_PAR_SECTION[sectionId]

	return (
		<div style={page}>
			<div style={emptyState}>
				<span style={emptyGlyph} aria-hidden="true">
					{glyphe}
				</span>
				<p style={emptyText}>
					{titre} — l&apos;écran d&apos;édition arrive avec la feature n°{featureNum}.
				</p>
			</div>
		</div>
	)
}

const page: CSSProperties = {
	flex: 1,
	minHeight: 0,
	boxSizing: 'border-box',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: 'var(--space-12)',
	overflowY: 'auto',
}

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
