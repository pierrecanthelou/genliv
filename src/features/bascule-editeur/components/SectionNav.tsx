import type { CSSProperties } from 'react'
import { Badge, ListRow, SECTIONS, type Dossier, type SectionId } from '../../../brain'

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
}

/**
 * La nav des DIX sections du dossier d'aventure — un `ListRow` par entrée de
 * `SECTIONS` (`brain/dossier/sections.ts`), dans l'ordre du registre. Le
 * `trailing` de chaque ligne est `descripteur.compte(dossier)`, lu TEL QUEL :
 * ce composant ne recompte jamais rien lui-même — aucune longueur de tableau
 * recalculée ici, aucun filtre, aucune réduction — toute l'arithmétique des
 * compteurs vit dans `sections.ts` et nulle part ailleurs (KR-013), sinon
 * deux écrans pourraient un jour afficher deux chiffres différents pour la
 * même section.
 *
 * Toujours `tone="muted"` sur le badge : le badge de complétion coloré
 * (bon/mauvais) appartient au futur linter n° 7 `dossier-controles`, non
 * livré cette itération (§3 du plan d'itération 3, désaccord — hors périmètre).
 */
export function SectionNav({ dossier, selectedId, onSelect }: SectionNavProps): JSX.Element {
	return (
		<nav aria-label="Sections du dossier" style={nav}>
			{SECTIONS.map((section) => (
				<ListRow
					key={section.id}
					title={section.titre}
					subtitle={section.cle}
					trailing={<Badge tone="muted">{section.compte(dossier)}</Badge>}
					selected={section.id === selectedId}
					onSelect={() => onSelect(section.id)}
				/>
			))}
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
