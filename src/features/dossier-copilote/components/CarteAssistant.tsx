import type { ReactNode } from 'react'
import { Badge, Card } from '../../../brain'
import { EYEBROW_ASSISTANT } from '../textes'
import { carteStyle, corpsStyle, enTeteStyle, eyebrowStyle, titreStyle } from './styles'

export interface CarteAssistantProps {
	titre: string
	corps: string
	badge?: string
	children?: ReactNode
}

/**
 * La coquille COMMUNE aux trois Card du panneau Copilote (§ 4.9 du plan
 * d'itération 2) : `<Card>` + `<section aria-label={titre}>` + eyebrow + titre
 * + `Badge` optionnel + `children`. Absorbe l'ancien `Entete` ET l'ancien
 * `CardBientot` de l'itération 1 — un seul composant, plus de duplication
 * entre une carte active et une carte « Bientôt ».
 *
 * `aria-label` sur la `<section>` est un POINT D'ANCRAGE EXPOSÉ
 * DÉLIBÉRÉMENT : depuis cette itération, DEUX boutons « Lancer » coexistent à
 * l'écran (carte 1 et carte 2), et c'est ce `role="region"` implicite que les
 * tests cadrent (`within(screen.getByRole('region', { name: CARD1_TITRE }))`)
 * plutôt qu'une recherche DOM à distance.
 */
export function CarteAssistant({ titre, corps, badge, children }: CarteAssistantProps): JSX.Element {
	return (
		<section aria-label={titre}>
			<Card>
				<div style={carteStyle}>
					<div style={enTeteStyle}>
						<div>
							<span style={eyebrowStyle}>{EYEBROW_ASSISTANT}</span>
							<p style={titreStyle}>{titre}</p>
						</div>
						{badge !== undefined && <Badge tone="muted">{badge}</Badge>}
					</div>
					<p style={corpsStyle}>{corps}</p>
					{children}
				</div>
			</Card>
		</section>
	)
}
