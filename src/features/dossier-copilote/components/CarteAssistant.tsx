import type { ReactNode } from 'react'
import { Card } from '../../../brain'
import { EYEBROW_ASSISTANT } from '../textes'
import { carteStyle, corpsStyle, enTeteStyle, eyebrowStyle, titreStyle } from './styles'

export interface CarteAssistantProps {
	titre: string
	corps: string
	children?: ReactNode
}

/**
 * La coquille COMMUNE aux six Card du panneau Copilote (§ 4.9 du plan
 * d'itération 2) : `<Card>` + `<section aria-label={titre}>` + eyebrow + titre
 * + `children`. Absorbe l'ancien `Entete` ET l'ancien `CardBientot` de
 * l'itération 1 — un seul composant, plus de duplication entre une carte
 * active et une carte « Bientôt ».
 *
 * ⚠ `badge?` RETIRÉ à l'itération 4 : son UNIQUE consommateur (le placeholder
 * « Bientôt — itération 4 » de la carte 6) a disparu avec l'activation de
 * `CarteEclaterSynopsis` — une prop publique à zéro appelant est une dette
 * (KR-109), et l'import `Badge` part avec elle.
 *
 * `aria-label` sur la `<section>` est un POINT D'ANCRAGE EXPOSÉ
 * DÉLIBÉRÉMENT : depuis l'itération 2, PLUSIEURS boutons « Lancer » coexistent
 * à l'écran, et c'est ce `role="region"` implicite que les tests cadrent
 * (`within(screen.getByRole('region', { name: CARD1_TITRE }))`) plutôt qu'une
 * recherche DOM à distance.
 */
export function CarteAssistant({ titre, corps, children }: CarteAssistantProps): JSX.Element {
	return (
		<section aria-label={titre}>
			<Card>
				<div style={carteStyle}>
					<div style={enTeteStyle}>
						<div>
							<span style={eyebrowStyle}>{EYEBROW_ASSISTANT}</span>
							<p style={titreStyle}>{titre}</p>
						</div>
					</div>
					<p style={corpsStyle}>{corps}</p>
					{children}
				</div>
			</Card>
		</section>
	)
}
