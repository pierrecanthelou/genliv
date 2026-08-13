import { useEffect, useRef, type CSSProperties } from 'react'
import {
	Stepper,
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	CHARACTERISTIC_MAX,
	CARACTERISTIQUE_MIN,
	maxPV,
	type Personnage,
	type Characteristic,
} from '../../../brain'
import { boutonPointilleStyle, eyebrowStyle, legendeStyle, separateurStyle } from './styles'

const TEXTE_REGLER_CARACTERISTIQUES = '+ Régler les caractéristiques…'
const LEGENDE_CARACTERISTIQUES = 'Caractéristiques — jamais lues par le narrateur.'
const LEGENDE_PV = 'Dérivé de Force + Agilité + Endurance — jamais stocké.'

export interface BlocCaracteristiquesProps {
	personnage: Personnage
	onReglerCaracteristiques: () => void
	onChangeCaracteristique: (carac: Characteristic, valeur: number) => void
}

/**
 * Le bloc 3 de l'accordéon (« Caractéristiques ») — extrait de
 * `FichePersonnage.tsx` (dette KR-112 datée par it3, désaccord n° 17 du plan
 * d'itération 4). DEUX états exclusifs : `stats` absent → une seule CTA, ni
 * grille ni ligne PV dans le DOM ; `stats` présent (TOUJOURS les 8 clés) →
 * légende + grille 2×4 (ordre `CHARACTERISTIC_VALUES`) + ligne PV dérivée EN
 * LIGNE (KR-013/113 — une seule condition, aucun `?? 0`).
 *
 * FOCUS après le clic sur la CTA : ce composant est rendu comme le `content`
 * d'une section de l'`Accordion` parent, lui-même remonté par
 * `key={personnage.id}` (`FichePersonnage.tsx`) — il est donc TOUJOURS monté à
 * neuf au changement de personnage, et son `useRef` booléen n'a PAS besoin de
 * porter l'identité du personnage (contrairement à la version antérieure de
 * ce code, qui vivait hors de l'Accordion et devait s'en prémunir — revue de
 * PR it3). Déplacement DOM impératif vers le premier contrôle du bloc qui
 * vient d'apparaître (« Diminuer FORCE (FO) ») : usage légitime de
 * `useEffect` (KR-013/113). `Stepper` n'expose pas de ref ; le premier
 * `<button>` du DOM sous la grille EST « Diminuer FORCE (FO) » (FO est le
 * premier de `CHARACTERISTIC_VALUES`, et `Stepper` rend « Diminuer » avant
 * « Augmenter »).
 */
export function BlocCaracteristiques({
	personnage,
	onReglerCaracteristiques,
	onChangeCaracteristique,
}: BlocCaracteristiquesProps): JSX.Element {
	const stats = personnage.stats
	// PV — EN LIGNE, jamais un repli vers `STATS_INITIALES` (réservé à l'écriture).
	const pv = stats === undefined ? null : maxPV(stats)

	const grilleRef = useRef<HTMLDivElement>(null)
	const focusApresReglageRef = useRef(false)

	useEffect(() => {
		if (focusApresReglageRef.current) {
			focusApresReglageRef.current = false
			grilleRef.current?.querySelector('button')?.focus()
		}
	}, [stats])

	function handleClicRegler(): void {
		focusApresReglageRef.current = true
		onReglerCaracteristiques()
	}

	if (stats === undefined) {
		return (
			<button type="button" onClick={handleClicRegler} style={boutonPointilleStyle}>
				{TEXTE_REGLER_CARACTERISTIQUES}
			</button>
		)
	}

	return (
		<>
			<p style={legendeStyle}>{LEGENDE_CARACTERISTIQUES}</p>
			<div style={grilleStyle} ref={grilleRef}>
				{CHARACTERISTIC_VALUES.map((carac) => (
					<Stepper
						key={carac}
						label={`${CHARACTERISTICS[carac].label.toUpperCase()} (${carac})`}
						value={stats[carac]}
						min={CARACTERISTIQUE_MIN}
						max={CHARACTERISTIC_MAX}
						onChange={(valeur) => onChangeCaracteristique(carac, valeur)}
					/>
				))}
			</div>
			<div style={separateurStyle}>
				<span style={eyebrowStyle}>PV</span>
				<span style={valeurPvStyle}>{pv}</span>
				<p style={legendeStyle}>{LEGENDE_PV}</p>
			</div>
		</>
	)
}

const grilleStyle: CSSProperties = {
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: 'var(--space-8)',
}

const valeurPvStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-title)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}
