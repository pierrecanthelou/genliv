export interface ChipProps {
	children: React.ReactNode
	/** When provided, renders a trailing ✕ remove affordance. */
	onRemove?: () => void
	/** Dashed outline for "add"/placeholder chips. */
	dashed?: boolean
	tone?: 'neutral' | 'accent'
}

export function Chip(props: ChipProps): JSX.Element
