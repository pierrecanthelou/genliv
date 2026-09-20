import type { CSSProperties, ReactNode } from 'react'

export interface OutcomeBlockProps {
	/** Libellé mono MAJUSCULES — REGISTRE AUTEUR. REQUIS : il désigne la prose sans en faire partie. */
	entete: string
	/** La prose du dossier, rendue VERBATIM. Jamais transformée, jamais tronquée. */
	children: ReactNode
}

/**
 * LE BLOC DE PROSE JOUEUR — un en-tête auteur qui désigne, une prose qui se lit.
 *
 * PAS DE PROP `variant` EN IT1, ET C'EST DÉLIBÉRÉ (§ 8, D-18 du plan). Le fichier
 * de référence du handoff (`components/surfaces/OutcomeBlock.jsx`) porte un axe
 * réussite / échec teinté par les DEUX SEULES COULEURS SÉMANTIQUES du projet,
 * réservées à la réussite et à l'échec d'un JET — jetons volontairement non
 * recopiés ici, y compris en commentaire, pour que le balayage de source de
 * `outcomeBlock.test.tsx` garde son pouvoir. Le texte d'ouverture n'est pas un
 * jet : l'axe de variante entrera avec son premier appelant de jet (n° 11).
 *
 * `entete` est REQUIS : optionnel, il laisserait la seule prose joueur de l'écran
 * sans rien qui la désigne.
 *
 * KR-109 : ce composant reste dans `features/play-mode/components/` tant qu'il
 * n'a qu'un consommateur. Un second, dans une autre feature, le ferait descendre
 * dans `brain/components/` — jamais un import croisé.
 */
export function OutcomeBlock({ entete, children }: OutcomeBlockProps): JSX.Element {
	return (
		<div style={bloc}>
			<span style={libelleEntete}>{entete}</span>
			<p style={prose}>{children}</p>
		</div>
	)
}

const bloc: CSSProperties = {
	border: 'var(--bw-hair) solid var(--border-card)',
	background: 'var(--surface-card)',
	// « outcome blocks » — `spacing.css`, le rayon nommé pour cette surface.
	borderRadius: 'var(--r-lg)',
	padding: 'var(--space-7)',
}

const libelleEntete: CSSProperties = {
	display: 'block',
	marginBottom: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	letterSpacing: 'var(--track-eyebrow-wide)',
	color: 'var(--text-label)',
}

/**
 * `whiteSpace: 'pre-wrap'` est une EXIGENCE de « verbatim », pas une préférence :
 * les retours de paragraphe tapés par l'auteur doivent survivre au rendu, sinon
 * « mot pour mot » est faux dès le premier alinéa.
 *
 * `--fs-row` et `--text-strong` (et non `--fs-sm` / `--text-body`) : c'est la
 * seule prose littéraire de l'écran.
 */
const prose: CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-row)',
	lineHeight: 'var(--lh-loose)',
	color: 'var(--text-strong)',
	whiteSpace: 'pre-wrap',
}
