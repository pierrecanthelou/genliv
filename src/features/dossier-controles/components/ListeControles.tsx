import type { CSSProperties } from 'react'
import { Badge, controleRemediation, type BadgeTone, type Controle, type NiveauControle } from '../../../brain'

export interface ListeControlesProps {
	controles: readonly Controle[]
}

/**
 * Le CALQUE d'`IssueList` (`brain/components/IssueList.tsx`) — jamais
 * `IssueList` elle-même (veto tech-lead, § 3 du plan d'itération 1) : la
 * réutiliser obligerait à forger un `DossierIssue` porteur d'un `code` absent
 * de son union de vingt. L'extraction d'une primitive partagée attend le
 * SECOND appelant de forme `Controle` (KR-109), pas celui-ci.
 *
 * Chaque ligne porte trois étages — OÙ / QUOI / QUOI FAIRE — dans une colonne
 * SŒUR de la pastille, jamais dans la pastille elle-même. QUOI FAIRE est
 * TOUJOURS résolu par `controleRemediation(controle)` : ce composant ne
 * connaît ni le registre `CONTROLES` ni aucune table de son cru (Open/Closed,
 * KR-117).
 *
 * PURE PRÉSENTATION : ce composant ne lit jamais le dossier ni n'importe
 * `MARQUEUR_A_ECRIRE` — il reçoit des `Controle` déjà produits. C'est ce qui
 * garde le glyphe hors de cette source (§ 8, désaccord 5 du plan).
 */
export function ListeControles({ controles }: ListeControlesProps): JSX.Element {
	return (
		<ul style={listStyle}>
			{controles.map((controle, index) => {
				const pastille = PASTILLES[controle.niveau]
				return (
					<li
						key={`${controle.path}-${index}`}
						style={
							index < controles.length - 1 ? { ...rowStyle, borderBottom: '1px solid var(--border-divider)' } : rowStyle
						}
					>
						<Badge tone={pastille.tone}>{pastille.libelle}</Badge>
						<div style={colonneStyle}>
							<p style={whereStyle}>{controle.location}</p>
							<p style={whatStyle}>{controle.message}</p>
							<p style={whatToDoStyle}>{controleRemediation(controle)}</p>
						</div>
					</li>
				)
			})}
		</ul>
	)
}

/**
 * Les trois niveaux se séparent par le MOT, jamais par une teinte neuve — le
 * produit n'a que `--good`/`--bad` comme couleurs sémantiques, et elles sont
 * réservées au jet (§ 3 du plan). `Record` TOTAL sur `NiveauControle` :
 * exhaustif PAR COMPILATION dès cette itération, `info` compris bien
 * qu'aucune règle ne le produise avant l'itération 3 — sinon celle-ci
 * rouvrirait ce fichier.
 */
const PASTILLES: Record<NiveauControle, { libelle: string; tone: BadgeTone }> = {
	bloquant: { libelle: 'BLOQUANT', tone: 'bad' },
	alerte: { libelle: 'ALERTE', tone: 'neutral' },
	info: { libelle: 'INFO', tone: 'muted' },
}

// Repris d'`IssueList` à l'identique, moins `maxHeight`/`overflowY` (gabarit de
// page, la page défile déjà — § 3 du plan).
const listStyle: CSSProperties = {
	listStyle: 'none',
	margin: 0,
	padding: 0,
	border: '1px solid var(--border-divider)',
	borderRadius: 'var(--r-md)',
}

const rowStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: 'var(--space-3)',
	padding: 'var(--space-4)',
}

const colonneStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-1)',
}

const whereStyle: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
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
