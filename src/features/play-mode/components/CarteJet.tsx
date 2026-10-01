/**
 * `CarteJet` — LA CARTE DU JET (n° 11 `moteur-arbitre`, lot 2, it2).
 *
 * Composant PUR — accepte `carteJet` et `onLancer` en props, affiche la proposition
 * de l'arbitre et gère la résolution du jet (clic « Lancer », résultat, classement).
 *
 * TROIS ÉTATS INTERNES :
 *  1. Avant lancer (État 3 du contrat) — affiche l'épreuve, enjeux, bouton actif
 *  2. Pendant résolution (État 4) — bouton désactivé opacity 0.5
 *  3. Après résolution (État 5) — affiche le roll vs valeur, Badge réussite/échec
 *
 * MONTAGE — conditionnel (`EcranPartie`), monté ssi `carteJet !== null` (KR-013).
 *
 * CLAVIER — `Enter` lance le jet (états 3→4), focus programmatique au montage.
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CHARACTERISTICS } from '../../../brain/characteristics'
import { CHALLENGE_TIERS } from '../../../brain/challenge'
import { Card } from '../../../brain/components/Card'
import { Badge } from '../../../brain/components/Badge'
import type { CarteJetState } from '../hooks/useTourDeJeu'

interface CarteJetProps {
	readonly carteJet: CarteJetState
	readonly onLancer: () => Promise<void>
}

export function CarteJet({ carteJet, onLancer }: CarteJetProps) {
	const cardRef = useRef<HTMLDivElement>(null)
	const [isLoading, setIsLoading] = useState(false)
	const isResolved = carteJet.resultat !== undefined

	// Focus programmatique au montage (avant lancer)
	useEffect(() => {
		if (cardRef.current) {
			cardRef.current.focus()
		}
	}, [])

	// Gestion du clavier : Enter lance le jet
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !isLoading && !isResolved) {
			e.preventDefault()
			onLancer()
		}
	}

	// Gestion du clic sur le bouton
	const handleClick = async () => {
		setIsLoading(true)
		try {
			await onLancer()
		} finally {
			setIsLoading(false)
		}
	}

	const carac = carteJet.carac
	const tc = carteJet.tc
	const caracLabel = CHARACTERISTICS[carac]?.label ?? carac
	const tcInfo = CHALLENGE_TIERS[tc]
	const tcLabel = tcInfo ? `${tcInfo.notation} — ${tcInfo.difficulty}` : tc

	// Styles inline — patron établi par PlayerInputBar.tsx (pas de CSS modules)
	const carteStyle: CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: 'var(--space-7)',
	}
	const headStyle: CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: 'var(--space-3)',
	}
	const eyebrowStyle: CSSProperties = {
		fontFamily: 'var(--font-mono)',
		fontSize: 'var(--fs-eyebrow)',
		fontWeight: 600,
		letterSpacing: 'var(--track-eyebrow)',
		textTransform: 'uppercase',
		color: 'var(--text-label)',
	}
	const titleStyle: CSSProperties = {
		fontFamily: 'var(--font-mono)',
		fontSize: 'var(--fs-body)',
		fontWeight: 600,
		color: 'var(--text-primary)',
	}
	const enjeuStyle: CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: 'var(--space-5)',
	}
	const enjeuLigneStyle: CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: 'var(--space-2)',
	}
	const enjeuLabelStyle: CSSProperties = {
		fontFamily: 'var(--font-mono)',
		fontSize: 'var(--fs-eyebrow)',
		fontWeight: 600,
		letterSpacing: 'var(--track-eyebrow)',
		textTransform: 'uppercase',
		color: 'var(--text-label)',
	}
	const enjeuTexteStyle: CSSProperties = {
		fontFamily: 'var(--font-ui)',
		fontSize: 'var(--fs-body)',
		lineHeight: 'var(--lh-body)',
		color: 'var(--text-primary)',
		whiteSpace: 'pre-wrap',
		wordBreak: 'break-word',
	}
	const resultatStyle: CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		gap: 'var(--space-5)',
	}
	const rollStyle: CSSProperties = {
		fontFamily: 'var(--font-mono)',
		fontSize: 'var(--fs-body)',
		fontWeight: 600,
		color: 'var(--text-primary)',
	}
	const boutonStyle: CSSProperties = {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		height: 'var(--hit-target)',
		padding: '0 var(--space-7)',
		fontFamily: 'var(--font-mono)',
		fontSize: 'var(--fs-body)',
		fontWeight: 500,
		border: 'none',
		borderRadius: 'var(--r-md)',
		cursor: isLoading || isResolved ? 'not-allowed' : 'pointer',
		backgroundColor: 'var(--accent)',
		color: 'white',
		opacity: isLoading || isResolved ? 0.5 : 1,
		transition: 'opacity 0.2s ease',
	}

	return (
		<div ref={cardRef} tabIndex={0} onKeyDown={handleKeyDown}>
			<Card shadow={false}>
				<div style={carteStyle}>
					{/* Eyebrow + Title */}
					<div style={headStyle}>
						<div style={eyebrowStyle}>{caracLabel}</div>
						<div style={titleStyle}>{tcLabel}</div>
					</div>

					{/* Enjeux (État 3, avant résolution) */}
					{!isResolved && (
						<div style={enjeuStyle}>
							<div style={enjeuLigneStyle}>
								<div style={enjeuLabelStyle}>SI RÉUSSITE</div>
								<div style={enjeuTexteStyle}>{carteJet.enjeuReussite}</div>
							</div>
							<div style={enjeuLigneStyle}>
								<div style={enjeuLabelStyle}>SI ÉCHEC</div>
								<div style={enjeuTexteStyle}>{carteJet.enjeuEchec}</div>
							</div>
						</div>
					)}

					{/* Résultat (État 5, après résolution) */}
					{isResolved && (
						<div style={resultatStyle}>
							<div style={rollStyle}>
								{carteJet.resultat.roll} vs {carteJet.resultat.characteristicValue}
							</div>
							<Badge tone={carteJet.resultat.success ? 'good' : 'bad'}>
								{carteJet.resultat.success ? 'RÉUSSITE' : 'ÉCHEC'}
							</Badge>
						</div>
					)}

					{/* Bouton « Lancer » ou indicateur de chargement */}
					<button
						style={boutonStyle}
						onClick={handleClick}
						disabled={isLoading || isResolved}
						aria-label="Lancer le dé"
					>
						{isLoading ? '…' : 'Lancer le dé →'}
					</button>
				</div>
			</Card>
		</div>
	)
}
