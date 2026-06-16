export interface IconButtonProps {
	/** Glyph or short text (✎, ✕, +). */
	children: React.ReactNode
	onClick?: () => void
	/** Accessible label — also the tooltip. */
	label?: string
	tone?: 'default' | 'danger' | 'accent'
	/** Square size in px. Default 24. */
	size?: number
}

export function IconButton(props: IconButtonProps): JSX.Element
