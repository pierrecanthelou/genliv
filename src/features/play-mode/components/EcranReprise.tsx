import { useRef, useEffect, type CSSProperties } from 'react'
import { boutonPrimaire } from './boutonPrimaire'

export interface EcranRepriseProps {
	readonly statut: 'perimee' | 'illisible'
	readonly onNouvellePartie: () => void
}

const MESSAGES: Record<'perimee' | 'illisible', { titre: string; texte: string }> = {
	perimee: {
		titre: "Cette partie n'est plus à jour",
		texte: `Le dossier a changé depuis votre dernière partie. Elle ne peut pas reprendre là où vous l'aviez laissée.`,
	},
	illisible: {
		titre: 'Cette partie ne peut pas être lue',
		texte: `La sauvegarde est endommagée. Une nouvelle partie la remplacera.`,
	},
}

/**
 * Écran de refus de session — périmée ou illisible.
 * Focus automatique sur le bouton. Entrée relance.
 */
export function EcranReprise({ statut, onNouvellePartie }: EcranRepriseProps): JSX.Element {
	const buttonRef = useRef<HTMLButtonElement>(null)
	const msg = MESSAGES[statut]

	useEffect(() => {
		buttonRef.current?.focus()
	}, [])

	return (
		<div style={blocReprise}>
			<span style={glypheReprise} aria-hidden="true">
				↻
			</span>
			<h2 style={titreReprise}>{msg.titre}</h2>
			<p style={texteReprise}>{msg.texte}</p>
			<button ref={buttonRef} type="button" style={boutonPrimaire} onClick={onNouvellePartie}>
				↻ Nouvelle partie
			</button>
		</div>
	)
}

const blocReprise: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
	maxWidth: 480,
	margin: '0 auto',
}

const glypheReprise: CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

const titreReprise: CSSProperties = {
	margin: 0,
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	letterSpacing: 'var(--track-tight)',
	color: 'var(--text-strong)',
}

const texteReprise: CSSProperties = {
	margin: 0,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
