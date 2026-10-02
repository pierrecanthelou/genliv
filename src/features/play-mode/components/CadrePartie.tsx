import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { useBrain, type Route } from '../../../brain'

/**
 * L'ENVELOPPE COMMUNE DE L'ÉCRAN DE PARTIE — header et corps défilant, EXTRAITE
 * d'`EcranPartie.tsx` (KR-112, 388 lignes mesurées, à 12 du signal) par
 * l'itération 2. Partagée par `PartieEnCours` (`EcranPartie.tsx`) et
 * `EcranRefus.tsx` : un seul composant par fichier.
 *
 * `titre` vaut `null` quand il n'y a pas de dossier à nommer (refus
 * `dossier_introuvable`) : « Aperçu du jeu · undefined » serait pire qu'un
 * header court.
 *
 * `Échap` fait EXACTEMENT ce que fait le bouton visible de l'écran affiché —
 * d'où la route `sortie` en prop, partagée par le bouton du header, la touche,
 * et (sur un refus) le bouton d'action. Écouteur sur `document`, rappel tenu
 * par un `useRef` et retiré au nettoyage (KR-004) : recopié de
 * `PlayerModal.tsx:18-27`.
 */

const TITRE_APERCU = 'Aperçu du jeu'
const LIBELLE_SORTIE = 'Quitter le test'

export interface CadrePartieProps {
	readonly titre: string | null
	readonly sortie: Route
	readonly bandeau?: ReactNode
	readonly actionsEntete?: ReactNode
	readonly children: ReactNode
}

export function CadrePartie({ titre, sortie, bandeau, actionsEntete, children }: CadrePartieProps): JSX.Element {
	const { router } = useBrain()
	const sortir = (): void => router.navigate(sortie)
	const sortirRef = useRef(sortir)
	sortirRef.current = sortir

	useEffect(() => {
		function handleKey(e: KeyboardEvent): void {
			if (e.key === 'Escape') sortirRef.current()
		}
		document.addEventListener('keydown', handleKey)
		return () => document.removeEventListener('keydown', handleKey)
	}, [])

	return (
		<main aria-label={TITRE_APERCU} style={racine}>
			<header style={entete}>
				<span style={titreEntete}>
					{TITRE_APERCU}
					{titre !== null && (
						<>
							{' · '}
							<span style={titreDossier}>{titre}</span>
						</>
					)}
				</span>
				<div style={groupeEnteteActionsEtSortie}>
					{actionsEntete}
					<button type="button" onClick={sortir} aria-label={LIBELLE_SORTIE} style={boutonSortie}>
						✕ {LIBELLE_SORTIE}
					</button>
				</div>
			</header>
			{bandeau}
			<div style={corps}>{children}</div>
		</main>
	)
}

const racine: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	height: '100vh',
	background: 'var(--surface-app)',
}

// Calqué sur `PlayerModal.tsx:43-53`, jetons à la place des pixels bruts.
const entete: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	padding: 'var(--space-3) var(--space-7)',
	borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
	background: 'var(--surface-card)',
	flexShrink: 0,
}

const titreEntete: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-label)',
}

const titreDossier: CSSProperties = { color: 'var(--text-strong)' }

// Groupe contenant les actions entête et le bouton de sortie, arrangés avec gap
const groupeEnteteActionsEtSortie: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-3)',
}

// Calqué sur `PlayerModal.tsx:74-85`. Le survol est en CSS seul côté design
// system — jamais un état `isHovered` en React.
const boutonSortie: CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-2) var(--space-5)',
	borderRadius: 'var(--r-md)',
	border: 'var(--bw-hair) solid var(--border-card)',
	background: 'transparent',
	color: 'var(--text-label)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}

// `flex: 1` + `minHeight: 0` + `overflowY` : le trio sans lequel le défilement
// est un no-op dans une colonne flex (KR-147).
const corps: CSSProperties = {
	flex: 1,
	minHeight: 0,
	overflowY: 'auto',
	padding: 'var(--space-12)',
	boxSizing: 'border-box',
}
