import type { CSSProperties } from 'react'
import { Badge, ListRow, SECTIONS, type Dossier, type SectionId } from '../../../brain'

export interface SectionNavProps {
	dossier: Dossier
	selectedId: SectionId
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

const nav: CSSProperties = {
	width: 280,
	flexShrink: 0,
	boxSizing: 'border-box',
	borderRight: '1px solid var(--border-subtle)',
	overflowY: 'auto',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	padding: 'var(--space-8)',
}
