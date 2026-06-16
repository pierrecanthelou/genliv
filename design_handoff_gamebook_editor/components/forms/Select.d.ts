export interface SelectProps {
	label?: string
	/** Current selection text. */
	value: string
	/** Opens the option list (popover owned by the caller). */
	onClick?: () => void
}

export function Select(props: SelectProps): JSX.Element
