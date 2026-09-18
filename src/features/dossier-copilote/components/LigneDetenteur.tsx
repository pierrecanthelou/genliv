import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Badge, HIT_TARGET_MIN, IconButton } from '../../../brain'
import { BADGE_ACCEPTE, BADGE_REJETE, LABEL_ACCEPTER, LABEL_REJETER, LIEN_OUVRIR_FICHE } from '../textes'
import { actionsDetenteurStyle, designationDetenteurStyle, lienDetenteurStyle, ligneDetenteurStyle } from './styles'

export interface LigneDetenteurProps {
	/** `localiserEntite('pnj', personnage, index)` — calculée par la CARTE,
	 *  jamais recomposée ici (encapsulation : la désignation appartient à celui
	 *  qui la définit). */
	designation: string
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void
	onRejeter: () => void
	onOuvrirFiche: () => void
}

/** Une INTENTION exposée au parent (§ 3.5) : « mets le focus sur le bouton
 *  Accepter de CETTE ligne » — jamais le `ref` du bouton lui-même. Même
 *  précédent que `BarreLancerHandle`/`FichePersonnageHandle`. */
export interface LigneDetenteurHandle {
	focusAccepter: () => void
}

/**
 * La ligne d'un détenteur proposé — SŒUR de `LigneProposition`, jamais une
 * variante (§ 3.4 du plan d'itération 2, désaccord n° 24 du raffinage) :
 * `LigneProposition` porte un diff de prose (chemin, avant/après) qui n'a
 * aucun sens sur un détenteur. `LigneDetenteur` n'a NI prop `certitude` NI
 * badge de certitude — elle vaut toujours `CERTITUDE_INITIALE`, posée par la
 * CARTE au moment de l'écriture, jamais choisie ici.
 *
 * Non décidée : la désignation + la paire `IconButton` `+`/`×`. Décidée : un
 * `Badge` (accent/muted, jamais good/bad — réservés à réussite/échec de jet) +
 * sur acceptée seulement, le lien « → Ouvrir la fiche ».
 */
export const LigneDetenteur = forwardRef<LigneDetenteurHandle, LigneDetenteurProps>(function LigneDetenteur(
	{ designation, decision, onAccepter, onRejeter, onOuvrirFiche }: LigneDetenteurProps,
	ref,
) {
	const accepterRef = useRef<HTMLButtonElement>(null)

	useImperativeHandle(ref, () => ({ focusAccepter: () => accepterRef.current?.focus() }), [])

	return (
		<div style={ligneDetenteurStyle}>
			<span style={designationDetenteurStyle}>{designation}</span>
			{decision === undefined ? (
				<div style={actionsDetenteurStyle}>
					<IconButton ref={accepterRef} label={LABEL_ACCEPTER} tone="accent" size={HIT_TARGET_MIN} onClick={onAccepter}>
						+
					</IconButton>
					<IconButton label={LABEL_REJETER} tone="danger" size={HIT_TARGET_MIN} onClick={onRejeter}>
						×
					</IconButton>
				</div>
			) : (
				<div style={actionsDetenteurStyle}>
					<Badge tone={decision === 'acceptee' ? 'accent' : 'muted'}>
						{decision === 'acceptee' ? BADGE_ACCEPTE : BADGE_REJETE}
					</Badge>
					{decision === 'acceptee' && (
						<button type="button" onClick={onOuvrirFiche} style={lienDetenteurStyle}>
							{LIEN_OUVRIR_FICHE}
						</button>
					)}
				</div>
			)}
		</div>
	)
})
