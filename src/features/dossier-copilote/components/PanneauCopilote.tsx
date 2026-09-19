import { useBrain, useOpenDossier, type SectionId } from '../../../brain'
import { CarteCompleterFiche } from './CarteCompleterFiche'
import { CarteCompleterPlan } from './CarteCompleterPlan'
import { CarteCompleterRelations } from './CarteCompleterRelations'
import { CarteEclaterSynopsis } from './CarteEclaterSynopsis'
import { CarteFaireParler } from './CarteFaireParler'
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
 * (jamais un `useState`/`useEffect`, KR-013/113) et les six Card dans
 * l'ordre — SIX ACTIVES depuis l'itération 4 (`CarteCompleterFiche`,
 * `CarteTisserIndices`, `CarteFaireParler`, `CarteCompleterPlan`,
 * `CarteCompleterRelations`, `CarteEclaterSynopsis`) : plus aucun placeholder
 * « Bientôt ». AUCUNE logique d'assistant ici — elle vit dans chaque Carte.
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
			<CarteFaireParler
				dossierId={dossierId}
				dossier={dossier}
				indisponible={indisponible}
				onSelectSection={onSelectSection}
			/>
			<CarteCompleterPlan
				dossierId={dossierId}
				dossier={dossier}
				indisponible={indisponible}
				onSelectSection={onSelectSection}
			/>
			<CarteCompleterRelations
				dossierId={dossierId}
				dossier={dossier}
				indisponible={indisponible}
				onSelectSection={onSelectSection}
			/>
			<CarteEclaterSynopsis
				dossierId={dossierId}
				dossier={dossier}
				indisponible={indisponible}
				onSelectSection={onSelectSection}
			/>
		</div>
	)
}
