export interface NodeBadgeProps {
	/** Leaf kind — selects the mark and default label. */
	kind: 'sommaire' | 'choix' | 'pnj' | 'decor' | 'piege' | 'monstre' | 'fin' | 'mort'
	/** Override the default uppercase label (e.g. "FIN · VICTOIRE"). */
	label?: string
	/** Accent treatment for the currently-selected node. */
	selected?: boolean
}

export function NodeBadge(props: NodeBadgeProps): JSX.Element
