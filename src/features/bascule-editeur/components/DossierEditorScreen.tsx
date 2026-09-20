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
/**
 * TROISIÈME branche, posée par l'itération 1 de `dossier-copilote` — et elle reste
 * LOCALE au même titre que la deuxième : ni `SectionId`, ni `brain/`. « Copilote »
 * n'est pas une section du dossier, et l'élargissement ferait de
 * `PANNEAU_PAR_SECTION` un `Record` réclamant un glyphe et un numéro de feature
 * pour une destination déjà livrée (défaut `SANS_COMPTE`).
 */
const DESTINATION_COPILOTE = 'copilote' as const
type DestinationNav = SectionId | typeof DESTINATION_CONTROLES | typeof DESTINATION_COPILOTE

/**
 * VRAI quand la destination courante appartient à la nav des sections. Écrit comme
 * un garde de TYPE plutôt qu'en comparaison au site d'appel : avec deux
 * destinations étrangères, un `destination === DESTINATION_CONTROLES ? null : …`
 * oubliait la seconde et rendait `'copilote'` à `SectionNav` — exactement l'état
 * illégal de BUG-082, avec une ligne de plus pour l'atteindre.
 */
function estSectionId(destination: DestinationNav): destination is SectionId {
	return destination !== DESTINATION_CONTROLES && destination !== DESTINATION_COPILOTE
}

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
	 *
	 * RENDER-PROP depuis l'itération 4 de `dossier-controles` (§ 4 du plan) :
	 * l'écran fournit le rappel de navigation `onSelectSection`, jamais
	 * l'inverse. `SectionId` SEUL traverse la frontière — jamais
	 * `DestinationNav`, qui reste STRICTEMENT local à ce fichier — donc le
	 * panneau Contrôles ne peut pas exprimer `'controles'` et ne peut pas
	 * fabriquer l'état illégal de BUG-082.
	 */
	panneauControles?: (onSelectSection: (section: SectionId) => void) => ReactNode
	/**
	 * Le panneau Copilote (`dossier-copilote`) — prop SŒUR de `panneauControles`,
	 * de forme IDENTIQUE, et jamais une onzième clé de section : « Copilote » n'est
	 * pas une section du dossier. Sa nav n'apparaît que si cette prop est injectée.
	 *
	 * RENDER-PROP pour la même raison que sa sœur : l'écran fournit le rappel de
	 * navigation, jamais l'inverse. `SectionId` SEUL traverse la frontière — jamais
	 * `DestinationNav`, qui reste STRICTEMENT local à ce fichier —, donc le panneau
	 * Copilote ne peut ni exprimer `'copilote'`, ni fabriquer l'état illégal de
	 * BUG-082. C'est ce qui rend le lien « → Ouvrir la fiche » possible sans qu'une
	 * feature connaisse la nav de l'éditeur.
	 */
	panneauCopilote?: (onSelectSection: (section: SectionId) => void) => ReactNode
}

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
export function DossierEditorScreen({
	dossierId,
	panneaux,
	panneauControles,
	panneauCopilote,
}: DossierEditorScreenProps): JSX.Element {
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
	// `useMemo` (KR-013/113). Le motif a changé à l'itération 3 de la n° 7 et il
	// est réécrit ici plutôt que laissé faux : `controlerDossier` balaie désormais,
	// EN PLUS des quatre proses semées, les collections du dossier (personnages et
	// leurs savoirs, quêtes, événements, climat, jalons, indices et leurs
	// enchaînements). Elle reste pure, et le coût mesuré sur le dossier de
	// référence du dépôt — dix constats — est sous le seuil où un cache se
	// justifierait. `useMemo` attend une MESURE, jamais une intuition : le jour
	// où un dossier réel rendra ce balayage visible au profilage, c'est cette
	// mesure-là qui décidera, pas cette phrase.
	//
	// La DÉSTRUCTURATION S'ÉLARGIT à l'itération 1 de `moteur-dossier` (§ 3.A du
	// plan) : `controles` et `jouable` alimentent le CTA « Aperçu du jeu ». UN SEUL
	// appel, celui-ci — un second recalculerait le rapport deux fois par rendu pour
	// deux lectures du même fait. `parSection` reste le SEUL morceau propagé à
	// `SectionNav`, qui n'a toujours rien à faire des deux autres.
	const { parSection, controles, jouable } = controlerDossier(dossier)

	// LE TEXTE SEUL est dérivé ici. `jouable` reste LA PORTE et n'est JAMAIS
	// recalculé en « aucun bloquant » : `controles.ts` le dérive « ICI ET NULLE PART
	// AILLEURS » (KR-013), et une vue qui le refabriquerait en ferait une seconde
	// règle de jouabilité. Le suffixe compte le RESTE (`length - 1`), jamais le
	// total, et « de plus » est invariable — pas de `plural` à appeler. Aucune
	// chaîne de repli non plus : « injouable sans raison » n'est pas un état
	// atteignable, `jouable` EST « aucun bloquant » (KR-245).
	const bloquants = controles.filter((controle) => controle.niveau === 'bloquant')
	const raisonApercu =
		bloquants.length === 0
			? undefined
			: bloquants.length === 1
				? bloquants[0].message
				: `${bloquants[0].message} (et ${bloquants.length - 1} de plus)`

	/**
	 * Le panneau courant — une suite de gardes plutôt qu'une cascade de ternaires :
	 * avec DEUX destinations hors sections, l'expression imbriquée cessait de se
	 * lire, et c'est exactement le genre d'endroit où la troisième branche se pose
	 * au mauvais niveau. Le `return` final tombe sur une destination NARROWED à
	 * `SectionId` par élimination, sans `as`.
	 */
	function rendrePanneau(): ReactNode {
		if (destination === DESTINATION_CONTROLES) return panneauControles?.((section) => setDestination(section))
		if (destination === DESTINATION_COPILOTE) return panneauCopilote?.((section) => setDestination(section))
		return panneaux?.[destination] ?? <PanneauSection sectionId={destination} />
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
			<EditorTopBar
				title={dossier.titre}
				backLabel="Mes dossiers"
				onBack={() => router.navigate({ name: 'home' })}
				// C'est l'ABSENCE d'`onPreview` qui désactive le bouton
				// (`EditorTopBar:126` fait `disabled={!onPreview}`), jamais la présence
				// d'une raison : le passer inconditionnellement livrerait un CTA
				// cliquable sur un dossier injouable.
				onPreview={jouable ? () => router.navigate({ name: 'partie', dossierId }) : undefined}
				previewDisabledReason={raisonApercu}
			/>
			<main style={body}>
				<div style={navColumn}>
					<SectionNav
						dossier={dossier}
						selectedId={estSectionId(destination) ? destination : null}
						onSelect={setDestination}
						niveauxParSection={parSection}
					/>
					{panneauControles !== undefined && (
						<nav aria-label="Contrôles" style={navHorsSections}>
							<ListRow
								title="Contrôles"
								selected={destination === DESTINATION_CONTROLES}
								onSelect={() => setDestination(DESTINATION_CONTROLES)}
							/>
						</nav>
					)}
					{/* « Copilote » vient APRÈS « Contrôles » — ordre posé ici faute d'être
					    écrit au contrat de design, et épinglé par un test pour qu'il ne
					    dérive pas d'un rendu à l'autre : les deux entrées sont sœurs, et
					    deux sœurs sans ordre fixe se réordonnent au premier refactor. */}
					{panneauCopilote !== undefined && (
						<nav aria-label="Copilote" style={navHorsSections}>
							<ListRow
								title="Copilote"
								selected={destination === DESTINATION_COPILOTE}
								onSelect={() => setDestination(DESTINATION_COPILOTE)}
							/>
						</nav>
					)}
				</div>
				{rendrePanneau()}
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

// Séparation des landmarks HORS SECTIONS (§ 3 du plan) : filet + espace, aucun
// jeton neuf. Le MÊME gabarit sert « Contrôles » et « Copilote » — deux entrées
// sœurs qui ne se ressembleraient plus au premier réglage si chacune portait le
// sien. Renommé de `controlesNav` à l'itération 1 de `dossier-copilote` : un nom
// qui désigne le premier de deux appelants se lit comme une exclusivité.
const navHorsSections: CSSProperties = {
	borderTop: '1px solid var(--border-rule)',
	paddingTop: 'var(--space-3)',
}
