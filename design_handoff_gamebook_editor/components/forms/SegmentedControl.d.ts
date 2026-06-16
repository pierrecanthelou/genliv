export interface SegmentOption {
	value: string
	label: string
}

export interface SegmentedControlProps {
	options: SegmentOption[]
	value: string
	onChange?: (value: string) => void
}

export function SegmentedControl(props: SegmentedControlProps): JSX.Element
