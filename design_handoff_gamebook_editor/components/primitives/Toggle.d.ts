export interface ToggleProps {
	checked?: boolean
	onChange?: (next: boolean) => void
	/** Accessible label (visually-hidden switch). */
	label?: string
}

export function Toggle(props: ToggleProps): JSX.Element
