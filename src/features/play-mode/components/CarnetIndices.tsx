import { type CSSProperties } from 'react'
import { Modal } from '../../../brain/components/Modal'
import { ListRow } from '../../../brain/components/ListRow'
import type { EtatSession } from '../../../brain'
import { verbeDeCommande } from '../../../brain/dossier/commandes'

/**
 * Carnet d'indices — VUE DÉRIVÉE du journal, lecture seule. Affiche une ligne
 * par révélation appliquée (entrée de journal portant `deltas` avec
 * `delta: 'reveler_indice'` et `effet: 'applique'`). Zéro état stocké.
 *
 * Lot B — `carnet-indices` (moteur-acteurs it2, critère #7).
 *  · Titre : Carnet d'indices
 *  · État vide : placeholder + glyphe
 *  · ListRow.title = recit réel de l'entrée (garantie lot A)
 *  · ListRow.subtitle = #{tour} — {VERBE}, dérivé via `verbeDeCommande`
 *    (registre INTERFACE, distinct du registre développeur-débogueur que
 *    `JournalRow.tsx` porte pour `[{origine}]` brut — le plan § 2 écarte
 *    nommément ce précédent pour le carnet : « registre joueur », pas
 *    « registre développeur-débogueur »). Jamais de copie locale (KR-013) —
 *    et jamais d'import direct du registre `COMMANDES` lui-même : la
 *    frontière de `commandes.test.ts` (KR-260) réserve cet import au seul
 *    `useTourDeJeu.ts` ; `verbeDeCommande` est la fonction exportée pour tout
 *    autre lecteur (encapsulation, raffinage-iteration § Encapsulation).
 *  · onSelect absent → lecture seule, rendu en <div>
 *  · Modal hideFooter={true} → seul le bouton ✕ ferme le tiroir
 */

export interface CarnetIndicesProps {
	readonly session: EtatSession
	readonly onClose?: () => void
}

export function CarnetIndices({ session, onClose }: CarnetIndicesProps): JSX.Element {
	const handleClose = (): void => {
		onClose?.()
	}

	// Filtrer les révélations appliquées du journal
	const revelations = session.journal.filter((entree): boolean => {
		if (entree.deltas === undefined) return false
		return entree.deltas.some((delta) => delta.delta === 'reveler_indice' && delta.effet === 'applique')
	})

	// Filtrer les révélations avec un recit valide
	const revelationsAvecRecit = revelations.filter((entree) => entree.recit !== undefined)

	return (
		<Modal title="Carnet d'indices" onClose={handleClose} hideFooter={true}>
			{revelationsAvecRecit.length === 0 ? (
				<div style={etatVide}>
					<span style={glypheVide} aria-hidden="true">
						🗝
					</span>
					<p style={texteVide}>Aucun indice découvert pour l&apos;instant — explorez, parlez, fouillez.</p>
				</div>
			) : (
				<ul style={listeCarnet}>
					{revelationsAvecRecit.map((entree, index) => {
						const verbe = entree.origine !== undefined ? verbeDeCommande(entree.origine) : ''
						const subtitle = `#${entree.tour} — ${verbe}`

						return (
							<li key={index} style={{ listStyle: 'none' }}>
								<ListRow
									title={entree.recit ?? ''} // Garantie non-undefined par le filtre
									subtitle={subtitle}
									// onSelect absent → lecture seule
								/>
							</li>
						)
					})}
				</ul>
			)}
		</Modal>
	)
}

const etatVide: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: 'var(--bw-strong) dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
}

const glypheVide: CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

const texteVide: CSSProperties = {
	margin: 0,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}

const listeCarnet: CSSProperties = {
	margin: 0,
	padding: 0,
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}
