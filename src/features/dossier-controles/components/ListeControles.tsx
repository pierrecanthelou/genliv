import type { CSSProperties } from 'react'
import { Badge, SECTIONS, controleRemediation, pastilleNiveau, type Controle, type SectionId } from '../../../brain'

export interface ListeControlesProps {
	controles: readonly Controle[]
	/**
	 * Le rappel de navigation — REQUIS (§ 4 du plan d'itération 4) : chaque
	 * ligne est un arrêt de tabulation qui émet la section OÙ le constat a été
	 * produit, jamais celle du remède (hors périmètre, § 2 du plan).
	 */
	onSelectSection: (section: SectionId) => void
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
 * LE MOT ET LA TEINTE DE LA PASTILLE non plus, depuis l'itération 2 : sa table
 * `Record<NiveauControle, …>` est descendue dans `brain/dossier/pastilles.ts` le
 * jour où le badge de la navigation en est devenu le SECOND appelant, dans une
 * autre feature (KR-109). Ce qui reste ICI est le BALISAGE — le `<li>` à trois
 * étages —, et il n'est toujours pas partagé : la navigation rend un `trailing`
 * de `ListRow`, pas une ligne de liste. Deux surfaces partagent la DÉCISION,
 * jamais le balisage.
 *
 * PURE PRÉSENTATION : ce composant ne lit jamais le dossier ni n'importe
 * `MARQUEUR_A_ECRIRE` — il reçoit des `Controle` déjà produits. C'est ce qui
 * garde le glyphe hors de cette source (§ 8, désaccord 5 du plan).
 *
 * Depuis l'itération 4 (§ 3 du plan) — CHAQUE ligne devient un
 * `<button type="button">` enveloppant tout son contenu, avec un trailing
 * `→ {titreSection}` qui nomme la section OÙ le constat a été produit :
 * `const section = controle.section` n'est lu qu'UNE SEULE FOIS par ligne, et
 * cette même valeur alimente à la fois le trailing affiché ET l'action au
 * clic — la garde anti-dérive qui rend la cohérence vraie PAR CONSTRUCTION
 * (§ 3 du plan, D-7). Le titre est DÉRIVÉ de `SECTIONS`, jamais recopié dans
 * une table locale (D-2) ; son repli — l'identifiant brut plutôt qu'une chaîne
 * vide — reprend celui de `PanneauSection.tsx` l. 38-39 (jamais un `?? ''`).
 * Tab, Entrée et Espace restent NATIFS : aucun `tabIndex`, aucun `onKeyDown`,
 * aucun `role="button"` maison — le `<li>` ne garde que son filet conditionnel.
 */
export function ListeControles({ controles, onSelectSection }: ListeControlesProps): JSX.Element {
	return (
		<ul style={listStyle}>
			{controles.map((controle, index) => {
				const pastille = pastilleNiveau(controle.niveau)
				const section = controle.section
				const descripteur = SECTIONS.find((s) => s.id === section)
				const titreSection = descripteur !== undefined ? descripteur.titre : section
				return (
					<li key={`${controle.path}-${index}`} style={index < controles.length - 1 ? liDivider : undefined}>
						<button type="button" onClick={() => onSelectSection(section)} style={rowButtonStyle}>
							<Badge tone={pastille.tone}>{pastille.texte}</Badge>
							<span style={colonneStyle}>
								<span data-etage="ou" style={whereStyle}>
									{controle.location}
								</span>
								<span data-etage="quoi" style={whatStyle}>
									{controle.message}
								</span>
								<span data-etage="quoi-faire" style={whatToDoStyle}>
									{controleRemediation(controle)}
								</span>
							</span>
							<span style={trailingStyle}>→ {titreSection}</span>
						</button>
					</li>
				)
			})}
		</ul>
	)
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

const liDivider: CSSProperties = { borderBottom: '1px solid var(--border-divider)' }

const rowButtonStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'flex-start',
	gap: 'var(--space-3)',
	width: '100%',
	boxSizing: 'border-box',
	border: 'none',
	background: 'transparent',
	textAlign: 'left',
	cursor: 'pointer',
	fontFamily: 'var(--font-ui)',
	padding: 'var(--space-4)',
}
// AUCUNE règle :hover — doctrine écrite de `ListRow.tsx` l. 93-94 reconduite.

const colonneStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-1)',
	flex: 1,
	minWidth: 0, // pousse le trailing à droite, mécanique de `texts` dans ListRow
}

const whereStyle: CSSProperties = {
	display: 'block',
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
}

const whatStyle: CSSProperties = {
	display: 'block',
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
}

const whatToDoStyle: CSSProperties = {
	display: 'block',
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}

const trailingStyle: CSSProperties = {
	marginLeft: 'auto',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)', // cohérence LOCALE avec `whereStyle`, même composant
	letterSpacing: 'var(--track-eyebrow)',
	color: 'var(--text-faint)',
	// AUCUN textTransform : `titre` est déjà en casse phrase et `SectionNav` rend
	// le MÊME titre en casse phrase sur le même écran.
}
