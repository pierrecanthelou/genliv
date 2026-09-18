import { useBrain, useOpenDossier, type SectionId } from '../../../brain'
import { CARD3_BADGE, CARD3_CORPS, CARD3_TITRE } from '../textes'
import { CarteAssistant } from './CarteAssistant'
import { CarteCompleterFiche } from './CarteCompleterFiche'
import { CarteTisserIndices } from './CarteTisserIndices'
import { pageStyle } from './styles'

export interface PanneauCopiloteProps {
	dossierId: string
	/** Render-prop de nav (§ 4 du plan it1) : ce panneau ne connaît que
	 *  `SectionId`, jamais `DestinationNav` (local à `bascule-editeur`). */
	onSelectSection: (section: SectionId) => void
}

/**
 * Le panneau Copilote — injecté par la racine de composition (`App.tsx`,
 * KR-184). COQUILLE SEULE depuis l'itération 2 (KR-112) : l'abonnement au
 * dossier, la garde de nullité, `estDisponible()` calculé EN LIGNE au rendu
 * (jamais un `useState`/`useEffect`, KR-013/113) et les trois Card dans
 * l'ordre. AUCUNE logique d'assistant ici — elle vit dans chaque Carte.
 */
export function PanneauCopilote({ dossierId, onSelectSection }: PanneauCopiloteProps): JSX.Element | null {
	const { copilote } = useBrain()
	const dossier = useOpenDossier(dossierId)
	if (dossier === null) return null
	const indisponible = !copilote.estDisponible()

	return (
		<div style={pageStyle}>
			<CarteCompleterFiche
				dossierId={dossierId}
				dossier={dossier}
				indisponible={indisponible}
				onSelectSection={onSelectSection}
			/>
			<CarteTisserIndices
				dossierId={dossierId}
				dossier={dossier}
				indisponible={indisponible}
				onSelectSection={onSelectSection}
			/>
			<CarteAssistant titre={CARD3_TITRE} corps={CARD3_CORPS} badge={CARD3_BADGE} />
		</div>
	)
}
