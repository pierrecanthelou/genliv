import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
	Badge,
	Card,
	ListRow,
	useOpenDossier,
	SECTIONS,
	BESTIARY_BY_TEMPLATE,
	PREFIXE_BESTIAIRE,
	type SectionId,
} from '../../../brain'
import { repeter, PAS_MAX, ROUNDS_MAX } from '../utils/repeter'

export interface PanneauRepetitionProps {
	dossierId: string
	/** Render-prop de nav : l'écran fournit le rappel de navigation */
	onSelectSection: (section: SectionId) => void
}

const containerStyle: CSSProperties = {
	padding: 'var(--space-7)',
}

const cardContainerStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-5)',
}

const inviteStyle: CSSProperties = {
	padding: 'var(--space-5)',
	background: 'var(--accent-bg)',
	border: 'var(--bw-emphasis) dashed var(--accent-line)',
	borderRadius: 'var(--r-md)',
}

const inviteTextStyle: CSSProperties = {
	color: 'var(--text-body)',
	fontSize: 'var(--fs-body)',
	lineHeight: 'var(--lh-body)',
	margin: '0 0 var(--space-5) 0',
}

const buttonGroupStyle: CSSProperties = {
	display: 'flex',
	gap: 'var(--space-3)',
	justifyContent: 'flex-end',
}

const buttonStyle: CSSProperties = {
	padding: 'var(--space-3) var(--space-5)',
	minHeight: 'var(--hit-target)',
	fontSize: 'var(--fs-body)',
	fontFamily: 'var(--font-ui)',
	backgroundColor: 'var(--accent)',
	color: 'var(--text-on-accent)',
	border: 'none',
	borderRadius: 'var(--r-md)',
	cursor: 'pointer',
	fontWeight: 'var(--fw-medium)',
}

const eyebrowStyle: CSSProperties = {
	fontSize: 'var(--fs-eyebrow)',
	fontFamily: 'var(--font-mono)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-label)',
	textTransform: 'uppercase',
	letterSpacing: 'var(--track-eyebrow)',
	margin: '0 0 var(--space-1) 0',
}

const titleStyle: CSSProperties = {
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
	margin: '0 0 var(--space-5) 0',
}

const bodyStyle: CSSProperties = {
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	margin: '0 0 var(--space-5) 0',
	lineHeight: 'var(--lh-body)',
}

const badgeContainerStyle: CSSProperties = {
	marginBottom: 'var(--space-5)',
}

const linkStyle: CSSProperties = {
	color: 'var(--accent)',
	textDecoration: 'underline',
	cursor: 'pointer',
	padding: 0,
	minHeight: 'var(--hit-target)',
	border: 'none',
	background: 'none',
	font: 'inherit',
	fontSize: 'var(--fs-body)',
}

/**
 * Le panneau Répétition — injecté par la racine de composition (`App.tsx`).
 *
 * TROIS ÉTATS :
 *  1. Invite (jamais lancée) : dashed card + « Lancez la répétition »
 *  2. À corriger (refus dossier_injouable) : « RÉPÉTITION IMPOSSIBLE » + lien vers section
 *  3. Résultat (rapport ok: true) : eyebrow ARRÊT, badge graine, texte + ListRow lieu
 *
 * ÉTAT LOCAL : graine | null. Null = jamais lancée.
 * RAPPORT DÉRIVÉ EN LIGNE : useMemo(() => repeter(dossier, graine!), [dossier, graine])
 *
 * KR-013: rapport jamais stocké. KR-310: recalculé à chaque clic.
 */
export function PanneauRepetition({ dossierId, onSelectSection }: PanneauRepetitionProps): JSX.Element | null {
	const dossier = useOpenDossier(dossierId)
	const [graine, setGraine] = useState<number | null>(null)

	const rapport = useMemo(() => {
		if (!dossier || graine === null) return null
		return repeter(dossier, graine)
	}, [dossier, graine])

	if (!dossier) return null

	// État 1 : Invite (jamais lancée)
	if (graine === null) {
		return (
			<div style={containerStyle}>
				<Card shadow={false}>
					<div style={cardContainerStyle}>
						<div style={inviteStyle}>
							<p style={inviteTextStyle}>
								Lancez la répétition : un joueur synthétique parcourt votre dossier et vous dit où il s&apos;arrête.
							</p>
							<div style={buttonGroupStyle}>
								<button type="button" style={buttonStyle} onClick={() => setGraine(1)} autoFocus>
									Lancer la répétition
								</button>
							</div>
						</div>
					</div>
				</Card>
			</div>
		)
	}

	// État 2 : À corriger (refus dossier_injouable)
	if (rapport && !rapport.ok) {
		const section = rapport.bloquant.section
		const sectionLabel = SECTIONS.find((s) => s.id === section)?.titre ?? section

		return (
			<div style={containerStyle}>
				<Card shadow={false}>
					<div style={cardContainerStyle}>
						<div>
							<p style={eyebrowStyle}>RÉPÉTITION IMPOSSIBLE</p>
							<p style={bodyStyle}>{rapport.bloquant.message}</p>
							<button type="button" style={linkStyle} onClick={() => onSelectSection(section)} autoFocus>
								Corriger dans {sectionLabel}
							</button>
						</div>
					</div>
				</Card>
			</div>
		)
	}

	// État 3 : Résultat (rapport ok: true)
	if (rapport && rapport.ok) {
		const { rapport: r } = rapport
		const lieuListe = dossier.monde.lieux.find((l) => l.id === r.lieu_id)
		const lieuNom = lieuListe?.nom ?? r.lieu_id

		// Helper to resolve monster name from ref
		const resoudreNomMonstre = (ref: string): string => {
			const templateId = ref.slice(PREFIXE_BESTIAIRE.length)
			return BESTIARY_BY_TEMPLATE[templateId]?.name ?? 'un monstre du bestiaire'
		}

		let contenuMotif: ReactNode = null
		switch (r.arret) {
			case 'fin': {
				contenuMotif = (
					<p style={titleStyle}>
						Le joueur synthétique a atteint la fin &laquo;{' '}
						{dossier.charpente.fins.find((f) => f.id === r.fin_id)?.nom ?? r.fin_id} &raquo;.
					</p>
				)
				break
			}
			case 'impasse': {
				contenuMotif = <p style={titleStyle}>Impasse pour un joueur qui ne fait qu&apos;aller.</p>
				break
			}
			case 'mort': {
				const nomMonstre = resoudreNomMonstre(r.monstre_ref)
				contenuMotif = (
					<>
						<p style={titleStyle}>Le joueur synthétique est mort face à {nomMonstre}.</p>
						<p style={bodyStyle}>Relancez pour tirer un autre parcours.</p>
					</>
				)
				break
			}
			case 'combat_sans_issue': {
				const nomMonstre = resoudreNomMonstre(r.monstre_ref)
				contenuMotif = (
					<>
						<p style={titleStyle}>
							Le combat contre {nomMonstre} n&apos;a pas été tranché en {ROUNDS_MAX} rounds.
						</p>
						<p style={bodyStyle}>Ni le joueur synthétique ni {nomMonstre} ne l&apos;a emporté.</p>
					</>
				)
				break
			}
			case 'pas_max': {
				contenuMotif = (
					<p style={titleStyle}>Le joueur synthétique a parcouru {PAS_MAX} pas sans atteindre de fin.</p>
				)
				break
			}
			default: {
				const _exhaustive: never = r
				return _exhaustive
			}
		}

		return (
			<div style={containerStyle}>
				<Card shadow={false}>
					<div style={cardContainerStyle}>
						<div>
							<p style={eyebrowStyle}>
								ARRÊT — PAS {r.pas} SUR {PAS_MAX}
							</p>

							<div style={badgeContainerStyle}>
								<Badge tone="neutral">Parcours n°{r.graine}</Badge>
							</div>

							{contenuMotif}
							{lieuListe && <ListRow title={lieuNom} subtitle={lieuListe.description} />}
						</div>

						<div style={buttonGroupStyle}>
							<button type="button" style={buttonStyle} onClick={() => setGraine(graine + 1)} autoFocus>
								Relancer
							</button>
						</div>
					</div>
				</Card>
			</div>
		)
	}

	return null
}
