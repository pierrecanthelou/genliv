import type { CSSProperties } from 'react'
import {
	Badge,
	ListRow,
	SECTIONS,
	badgeSection,
	type Dossier,
	type NiveauControle,
	type SectionId,
} from '../../../brain'

export interface SectionNavProps {
	dossier: Dossier
	/**
	 * La section surlignée, ou `null` quand la destination courante n'est AUCUNE
	 * des dix — c'est-à-dire « Contrôles » (n° 7). `null` plutôt que l'union
	 * `SectionId | 'controles'` : cette nav n'a aucune raison de connaître une
	 * destination qui ne lui appartient pas, elle a seulement besoin de savoir
	 * qu'aucune de SES lignes n'est courante. Le jour où une deuxième destination
	 * étrangère arrive, cette signature ne bouge pas.
	 */
	selectedId: SectionId | null
	onSelect: (id: SectionId) => void
	/**
	 * Le pire niveau de contrôle par section, `null` quand elle est calme —
	 * `RapportControles.parSection` (`brain/dossier/controles.ts`) SEUL, jamais
	 * le rapport entier : cette nav n'a rien à faire de `controles` ni de
	 * `jouable`. REQUISE, jamais optionnelle — un second chemin sans niveau
	 * serait un chemin non testé (§ 4 du plan d'itération 2 de
	 * `dossier-controles`).
	 */
	niveauxParSection: Record<SectionId, NiveauControle | null>
}

/**
 * La nav des DIX sections du dossier d'aventure — un `ListRow` par entrée de
 * `SECTIONS` (`brain/dossier/sections.ts`), dans l'ordre du registre. Le
 * `trailing` de chaque ligne est le badge rendu par `badgeSection`
 * (`brain/dossier/pastilles.ts`) à partir de `descripteur.compte(dossier)` et
 * du niveau reçu en prop — fondus en UN SEUL badge (KR-218), jamais deux
 * nœuds côte à côte. Ce composant ne recompte ni ne décide jamais rien
 * lui-même : aucune longueur de tableau recalculée ici, aucun filtre, aucune
 * réduction (KR-013), aucun mot de niveau ni aucune teinte écrits en dur.
 * Toute l'arithmétique des compteurs vit dans `sections.ts`, tout le mot et
 * toute la teinte dans `pastilles.ts`, nulle part ailleurs — sinon deux
 * écrans pourraient un jour diverger sur la même section.
 */
export function SectionNav({ dossier, selectedId, onSelect, niveauxParSection }: SectionNavProps): JSX.Element {
	return (
		<nav aria-label="Sections du dossier" style={nav}>
			{SECTIONS.map((section) => {
				const badge = badgeSection(section.compte(dossier), niveauxParSection[section.id])
				return (
					<ListRow
						key={section.id}
						title={section.titre}
						subtitle={section.cle}
						trailing={<Badge tone={badge.tone}>{badge.texte}</Badge>}
						selected={section.id === selectedId}
						onSelect={() => onSelect(section.id)}
					/>
				)
			})}
		</nav>
	)
}

// `width` / `borderRight` / `overflowY` / `padding` sont CÉDÉS au `<div>`
// wrapper en colonne de `DossierEditorScreen` (§ 3 du plan d'itération 1 de
// `dossier-controles`, itération 1) — c'est lui qui devient la boîte visuelle
// de la colonne de nav depuis qu'elle empile deux `<nav>` frères
// (« Sections du dossier » puis « Contrôles »). Rien d'autre ne change ici.
const nav: CSSProperties = {
	flexShrink: 0,
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}
