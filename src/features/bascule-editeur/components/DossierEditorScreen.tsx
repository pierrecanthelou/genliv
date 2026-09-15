import { useState, type CSSProperties, type ReactNode } from 'react'
import {
	useBrain,
	useOpenDossier,
	controlerDossier,
	EditorTopBar,
	ListRow,
	SECTIONS,
	type SectionId,
} from '../../../brain'
import { SectionNav } from './SectionNav'
import { PanneauSection } from './PanneauSection'

/**
 * L'union `SectionId | 'controles'` — LOCALE à `bascule-editeur`, elle ne
 * remonte jamais dans `brain/` (§ 4 du plan d'itération 1 de
 * `dossier-controles` : l'y élargir ferait de `PANNEAU_PAR_SECTION`
 * (`PanneauSection.tsx`) un `Record` réclamant un glyphe et un numéro de
 * feature pour une destination déjà livrée — le défaut `SANS_COMPTE`).
 */
const DESTINATION_CONTROLES = 'controles' as const
type DestinationNav = SectionId | typeof DESTINATION_CONTROLES

export interface DossierEditorScreenProps {
	dossierId: string
	/**
	 * Panneaux d'édition RÉELS, injectés par la racine de composition (`App.tsx`)
	 * — jamais importés depuis une autre feature (KR-184, précédent
	 * `ImportDossierButton` → `LibraryScreen.importEntry`). Une section absente
	 * de la table retombe sur l'état vide `PanneauSection`.
	 */
	panneaux?: Partial<Record<SectionId, ReactNode>>
	/**
	 * Le panneau Contrôles (`dossier-controles`) — prop SŒUR de `panneaux`,
	 * jamais une onzième clé de section : « Contrôles » n'est pas une section
	 * du dossier (§ 4 du plan d'itération 1 de `dossier-controles`). Sa nav
	 * n'apparaît que si cette prop est injectée.
	 */
	panneauControles?: ReactNode
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
export function DossierEditorScreen({ dossierId, panneaux, panneauControles }: DossierEditorScreenProps): JSX.Element {
	const { router } = useBrain()
	const dossier = useOpenDossier(dossierId)
	// UN SEUL état pour « ce qui est affiché », et c'est délibéré : deux `useState`
	// indépendants (`selectedId` + `destination`) rendaient un état ILLÉGAL
	// REPRÉSENTABLE — une ligne de section restait surlignée en même temps que
	// « Contrôles », soit deux lignes courantes à l'écran. Forme rejetée au tour 1
	// du raffinage (annexe du tech-lead : « 4 combinaisons pour 2 états légaux,
	// deux sources pour ce qui est affiché »), livrée quand même, rattrapée par la
	// QA en mode B (BUG-082). `SectionNav` reçoit `null` quand la destination
	// courante ne lui appartient pas.
	const [destination, setDestination] = useState<DestinationNav>(SECTIONS[0].id)

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

	// Dérivé EN LIGNE à chaque rendu, jamais via un `useEffect` miroir ni un
	// `useMemo` (KR-013/113) : `controlerDossier` est pure et bornée à quatre
	// proses aujourd'hui, rien ne justifie de mettre en cache son résultat.
	// `parSection` SEUL est propagé à `SectionNav` — jamais le `RapportControles`
	// entier, qui n'a rien à faire de `controles` ni de `jouable` ici.
	const { parSection } = controlerDossier(dossier)

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
			<EditorTopBar
				title={dossier.titre}
				backLabel="Mes dossiers"
				onBack={() => router.navigate({ name: 'home' })}
				previewDisabledReason={RAISON_APERCU_DESACTIVE}
			/>
			<main style={body}>
				<div style={navColumn}>
					<SectionNav
						dossier={dossier}
						selectedId={destination === DESTINATION_CONTROLES ? null : destination}
						onSelect={setDestination}
						niveauxParSection={parSection}
					/>
					{panneauControles !== undefined && (
						<nav aria-label="Contrôles" style={controlesNav}>
							<ListRow
								title="Contrôles"
								selected={destination === DESTINATION_CONTROLES}
								onSelect={() => setDestination(DESTINATION_CONTROLES)}
							/>
						</nav>
					)}
				</div>
				{destination === DESTINATION_CONTROLES
					? panneauControles
					: (panneaux?.[destination] ?? <PanneauSection sectionId={destination} />)}
			</main>
		</div>
	)
}

const body: CSSProperties = {
	flex: 1,
	minHeight: 0,
	display: 'flex',
}

// Reprend `width` / `borderRight` / `overflowY` / `padding`, cédés par
// `SectionNav.tsx` (§ 3 du plan) : cette colonne devient la boîte visuelle de
// la nav, empilant ses deux `<nav>` frères — « Sections du dossier » puis,
// sous condition d'injection, « Contrôles ».
const navColumn: CSSProperties = {
	width: 280,
	flexShrink: 0,
	boxSizing: 'border-box',
	borderRight: '1px solid var(--border-subtle)',
	overflowY: 'auto',
	padding: 'var(--space-8)',
	display: 'flex',
	flexDirection: 'column',
}

// Séparation du second landmark (§ 3 du plan) : filet + espace, aucun jeton neuf.
const controlesNav: CSSProperties = {
	borderTop: '1px solid var(--border-rule)',
	paddingTop: 'var(--space-3)',
}
