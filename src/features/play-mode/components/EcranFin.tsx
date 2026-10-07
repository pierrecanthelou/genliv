/**
 * ÉCRAN DE FIN DE PARTIE — fin atteinte et texte rendu verbatim.
 *
 * DEUX CAS (§ 3 du plan d'itération 1) :
 *  · Fin avec texte : OutcomeBlock + prose verbatim
 *  · Fin sans texte (KR-307) : bloc pointillé invitant à rédiger
 */

import type { CSSProperties } from 'react'
import { OutcomeBlock } from './OutcomeBlock'
import type { FinAtteinte } from '../../../player/engine/fin'

const ENTETE_FIN = 'FIN — lue au joueur, mot pour mot'
const TEXTE_REPLI_SANS_TEXTE =
	"Cette fin n'a pas de texte — rédigez-la dans JALONS & FINS, onglet FINS, pour que le moteur la lise au joueur."

export interface EcranFinProps {
	readonly fin: FinAtteinte
	readonly nom: string
}

export function EcranFin({ fin, nom }: EcranFinProps): JSX.Element {
	const nomAffiche = nom.trim() || 'Fin sans nom'

	return (
		<section aria-label="Fin de partie" style={conteneur}>
			<h2 style={titre}>FIN · {nomAffiche}</h2>
			{fin.texte !== undefined && fin.texte.trim() !== '' ? (
				<OutcomeBlock entete={ENTETE_FIN}>{fin.texte}</OutcomeBlock>
			) : (
				<div style={etatVide}>
					<span style={glypheVide} aria-hidden="true">
						⬚
					</span>
					<p style={texteVide}>{TEXTE_REPLI_SANS_TEXTE}</p>
				</div>
			)}
		</section>
	)
}

const conteneur: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-9)',
}

const titre: CSSProperties = {
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-h2)',
	fontWeight: 'var(--fw-semibold)',
	letterSpacing: 'var(--track-tight)',
	color: 'var(--text-strong)',
	margin: 0,
}

const etatVide: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
}

const glypheVide: CSSProperties = { fontSize: 'var(--fs-h1)', color: 'var(--text-faint)', lineHeight: 1 }

const texteVide: CSSProperties = { margin: 0, color: 'var(--text-muted)', lineHeight: 'var(--lh-body)' }
