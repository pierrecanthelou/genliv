import { useState, type CSSProperties, type ReactNode } from 'react'
import { useBrain, useOpenDossier, EditorTopBar, SECTIONS, type SectionId } from '../../../brain'
import { SectionNav } from './SectionNav'
import { PanneauSection } from './PanneauSection'

export interface DossierEditorScreenProps {
	dossierId: string
	/**
	 * Panneaux d'édition RÉELS, injectés par la racine de composition (`App.tsx`)
	 * — jamais importés depuis une autre feature (KR-184, précédent
	 * `ImportDossierButton` → `LibraryScreen.importEntry`). Une section absente
	 * de la table retombe sur l'état vide `PanneauSection`.
	 */
	panneaux?: Partial<Record<SectionId, ReactNode>>
}

const RAISON_APERCU_DESACTIVE =
	'Aperçu du jeu — disponible quand le mode jeu sera repointé sur le dossier (feature n° 9)'

/**
 * Écran d'édition d'un dossier d'aventure — fichier NEUF de bascule-editeur,
 * jamais une branche ajoutée à `src/EditorScreen.tsx` (chemin Book, condamné
 * à la démolition n° 9).
 *
 * Lit le dossier ouvert via `useOpenDossier` (`brain/hooks.ts`, lot contrat de
 * l'itération 3) plutôt qu'un `dossiers.get(dossierId)` direct : la vue se
 * remet à jour SANS remontage si `dossier:updated` survient pendant qu'elle
 * est ouverte (adoption cloud) — report explicite de l'itération 2, honoré ici
 * (critère #6).
 *
 * La section sélectionnée est un état LOCAL à cet écran, pas une propriété du
 * dossier : elle ne survit pas à une navigation. Défaut : la première section
 * du registre (`SECTIONS[0]`, Canon) — un choix raisonnable non écrit par le
 * plan d'itération, documenté ici plutôt qu'inventé en silence.
 */
export function DossierEditorScreen({ dossierId, panneaux }: DossierEditorScreenProps): JSX.Element {
	const { router } = useBrain()
	const dossier = useOpenDossier(dossierId)
	const [selectedId, setSelectedId] = useState<SectionId>(SECTIONS[0].id)

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
			<main style={body}>
				<SectionNav dossier={dossier} selectedId={selectedId} onSelect={setSelectedId} />
				{panneaux?.[selectedId] ?? <PanneauSection sectionId={selectedId} />}
			</main>
		</div>
	)
}

const body: CSSProperties = {
	flex: 1,
	minHeight: 0,
	display: 'flex',
}
