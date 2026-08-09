import type { CSSProperties } from 'react'
import { useBrain, EditorTopBar } from '../../../brain'

export interface DossierEditorScreenProps {
	dossierId: string
}

const RAISON_APERCU_DESACTIVE =
	'Aperçu du jeu — disponible quand le mode jeu sera repointé sur le dossier (feature n° 9)'

/**
 * Écran d'édition minimal d'un dossier d'aventure — fichier NEUF de
 * bascule-editeur, jamais une branche ajoutée à `src/EditorScreen.tsx` (chemin
 * Book, condamné à la démolition n° 9).
 *
 * Lit `dossiers.get(dossierId)` directement au rendu (pas de hook dédié — un
 * seul appelant) : aucune vue live n'est nécessaire cette itération, rien ici
 * ne peut encore modifier le dossier. Le rafraîchissement en direct du titre
 * si `dossier:updated` survient pendant que l'écran est ouvert est reporté à
 * l'itération 3 (propriétaire de la vraie nav de sections).
 */
export function DossierEditorScreen({ dossierId }: DossierEditorScreenProps): JSX.Element {
	const { dossiers, router } = useBrain()
	const dossier = dossiers.get(dossierId)

	if (dossier === null) {
		return (
			<main style={{ padding: 'var(--space-12)' }}>
				<p style={{ color: 'var(--text-muted)' }}>Dossier introuvable.</p>
				<button type="button" onClick={() => router.navigate({ name: 'home' })}>
					← Mes dossiers
				</button>
			</main>
		)
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
			<EditorTopBar
				title={dossier.titre}
				backLabel="Mes dossiers"
				onBack={() => router.navigate({ name: 'home' })}
				previewDisabledReason={RAISON_APERCU_DESACTIVE}
			/>
			<main style={page}>
				<div style={emptyState}>
					<span style={emptyGlyph} aria-hidden="true">
						❏
					</span>
					<p style={emptyText}>
						Aucune section pour l&apos;instant. La navigation de ce dossier arrive avec une prochaine mise à jour de
						l&apos;éditeur.
					</p>
				</div>
			</main>
		</div>
	)
}

const page: CSSProperties = {
	flex: 1,
	minHeight: 0,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	padding: 'var(--space-12)',
}

const emptyState: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	textAlign: 'center',
	gap: 'var(--space-3)',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-xl)',
	background: 'var(--paper-1)',
	padding: 'var(--space-10) var(--space-8)',
	maxWidth: 480,
}

const emptyGlyph: CSSProperties = {
	fontSize: 'var(--fs-h1)',
	color: 'var(--text-faint)',
	lineHeight: 1,
}

const emptyText: CSSProperties = {
	margin: 0,
	color: 'var(--text-muted)',
	lineHeight: 'var(--lh-body)',
}
