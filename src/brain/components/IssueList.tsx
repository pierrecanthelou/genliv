import type { CSSProperties } from 'react'
import { dossierIssueRemediation, type DossierIssue } from '../dossier/issues'

export interface IssueListProps {
	issues: DossierIssue[]
}

/**
 * L'anatomie à trois lignes d'une anomalie (§ 3.3) : OÙ (l'entité résolue par
 * nom, avec son identifiant stable entre parenthèses quand elle en porte un),
 * QUOI (le `message` déjà rédigé par le validateur) et QUOI FAIRE (résolu par
 * `dossierIssueRemediation` — jamais recopié ni substitué à la main ici).
 */
export function IssueList({ issues }: IssueListProps): JSX.Element {
	return (
		<ul style={listStyle}>
			{issues.map((issue, index) => (
				<li
					key={`${issue.path}-${index}`}
					style={
						index < issues.length - 1 ? { ...rowStyle, borderBottom: '1px solid var(--border-divider)' } : rowStyle
					}
				>
					<p style={whereStyle}>
						{issue.location}
						{issue.entityId !== undefined && <span style={entityIdStyle}> ({issue.entityId})</span>}
					</p>
					<p style={whatStyle}>{issue.message}</p>
					<p style={whatToDoStyle}>{dossierIssueRemediation(issue)}</p>
				</li>
			))}
		</ul>
	)
}

const listStyle: CSSProperties = {
	listStyle: 'none',
	margin: 0,
	padding: 0,
	maxHeight: 240,
	overflowY: 'auto',
	border: '1px solid var(--border-divider)',
	borderRadius: 'var(--r-md)',
}

const rowStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-1)',
	padding: 'var(--space-4)',
}

const whereStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
}

const entityIdStyle: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	color: 'var(--text-faint)',
}

const whatStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
}

const whatToDoStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}
