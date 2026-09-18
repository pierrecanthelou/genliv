import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { LABEL_ANNULER, LABEL_LANCER, TEXTE_CHARGEMENT } from '../textes'
import {
	annulerStyle,
	chargementStyle,
	corpsStyle,
	lancerActifStyle,
	lancerDesactiveStyle,
	ligneLancerStyle,
} from './styles'

export interface BarreLancerProps {
	enCours: boolean
	desactive: boolean
	titreDesactive?: string
	onLancer: () => void
	onAnnuler: () => void
}

/** Ce que le PARENT peut DEMANDER, jamais ce qu'il peut ATTEINDRE : une
 *  INTENTION (« mets le focus sur Lancer »), pas un `ref` de nœud DOM ni un
 *  `getBouton()` — même précédent que `FichePersonnageHandle.focusRetirer`
 *  (`dossier-fiches`). Consommé par `CarteTisserIndices` pour ramener le focus
 *  sur Lancer quand la dernière ligne de la liste vient d'être décidée
 *  (§ 3.5) ; `CarteCompleterFiche` n'en a pas besoin et ne passe pas de `ref`. */
export interface BarreLancerHandle {
	focusLancer: () => void
}

/**
 * Le bouton Lancer + `title` de désactivation + la région `role="status"` +
 * Annuler + Échap + LA CHORÉGRAPHIE DE FOCUS de l'itération 1 (§ 3.5 du plan
 * d'itération 1, désormais écrite une seule fois ici plutôt que dans
 * `PanneauCopilote.tsx`). DEUX appelants dès cette itération (carte 1, carte
 * 2) : chaque instance porte SES PROPRES refs et son propre effet, donc les
 * deux barres ne se marchent jamais dessus.
 */
export const BarreLancer = forwardRef<BarreLancerHandle, BarreLancerProps>(function BarreLancer(
	{ enCours, desactive, titreDesactive, onLancer, onAnnuler }: BarreLancerProps,
	ref,
) {
	const lancerRef = useRef<HTMLButtonElement>(null)
	const annulerRef = useRef<HTMLButtonElement>(null)
	const enCoursPrecedentRef = useRef(false)

	useImperativeHandle(ref, () => ({ focusLancer: () => lancerRef.current?.focus() }), [])

	// Focus IMPÉRATIF, jamais un miroir d'état (KR-013/113) : entrée dans
	// `en-cours` → focus Annuler, sortie de `en-cours` → focus Lancer.
	useEffect(() => {
		const precedent = enCoursPrecedentRef.current
		enCoursPrecedentRef.current = enCours
		if (enCours) {
			annulerRef.current?.focus()
		} else if (precedent) {
			lancerRef.current?.focus()
		}
	}, [enCours])

	const boutonDesactive = desactive || enCours

	return (
		<div style={ligneLancerStyle}>
			<button
				ref={lancerRef}
				type="button"
				disabled={boutonDesactive}
				title={desactive ? titreDesactive : undefined}
				onClick={onLancer}
				style={boutonDesactive ? lancerDesactiveStyle : lancerActifStyle}
			>
				{LABEL_LANCER}
			</button>
			{enCours && (
				<div
					role="status"
					style={chargementStyle}
					onKeyDown={(e) => {
						if (e.key === 'Escape') onAnnuler()
					}}
				>
					<span style={corpsStyle}>{TEXTE_CHARGEMENT}</span>
					<button ref={annulerRef} type="button" onClick={onAnnuler} style={annulerStyle}>
						{LABEL_ANNULER}
					</button>
				</div>
			)}
		</div>
	)
})
