import type { CSSProperties } from 'react'
import { Badge } from '../../../brain/components/Badge'
import { boutonPrimaire } from './boutonPrimaire'
import { boutonSecondaire } from './boutonSecondaire'
import { OutcomeBlock } from './OutcomeBlock'
import { JournalLigneRound } from './JournalLigneRound'
import type { CombatLogEntry } from '../../../player/engine/combatTypes'

export const TEXTE_MORT_HEROS = "Vos forces vous quittent. Le combat est perdu : votre aventure s'arrête ici."
const TEXTE_AIDE_REJOUER = 'Mêmes dés dès la création du héros. Le récit peut changer.'

export interface EcranMortProps {
	readonly nom: string
	readonly log: ReadonlyArray<CombatLogEntry>
	readonly onNouvellePartie: () => void
	readonly onRejouer: () => void
}

export function EcranMort({ nom, log, onNouvellePartie, onRejouer }: EcranMortProps): JSX.Element {
	const nomAffiche = nom.trim() || 'Héros sans nom'

	return (
		<section aria-label="Mort du héros" style={conteneur}>
			<h2 style={titre}>MORT · {nomAffiche}</h2>

			<Badge tone="muted">PARTIE TERMINÉE</Badge>

			<div style={glypheIcon} aria-hidden="true">
				⚔
			</div>

			<OutcomeBlock entete="MORT DU HÉROS — texte du moteur">{TEXTE_MORT_HEROS}</OutcomeBlock>

			{/* Journal des rounds */}
			<div style={journal} role="log">
				{log.map((entry, idx) => (
					<JournalLigneRound key={idx} round={entry.round} texte={entry.text} />
				))}
			</div>

			{/* Barre d'actions */}
			<div style={barreActions}>
				<button style={boutonPrimaire} onClick={onNouvellePartie} autoFocus>
					↻ Nouvelle partie
				</button>
				<button type="button" style={boutonSecondaire} onClick={onRejouer}>
					↪ Rejouer — mêmes dés
				</button>
			</div>

			{/* Aides */}
			<p style={aide}>La partie est terminée. Le dossier n&apos;est pas modifié.</p>
			<p style={aide}>{TEXTE_AIDE_REJOUER}</p>
		</section>
	)
}

// --- Styles

const conteneur: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-9)',
	maxWidth: 480,
	margin: '0 auto',
}

const titre: CSSProperties = {
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-h2)',
	fontWeight: 'var(--fw-semibold)',
	letterSpacing: 'var(--track-tight)',
	color: 'var(--text-strong)',
	margin: 0,
}

const glypheIcon: CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
	textAlign: 'center',
}

const journal: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	overflowY: 'auto',
	paddingRight: 'var(--space-3)',
}

const barreActions: CSSProperties = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: 'var(--space-5)',
	alignItems: 'center',
}

const aide: CSSProperties = {
	margin: 0,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
	fontSize: 'var(--fs-body)',
	fontFamily: 'var(--font-ui)',
}
