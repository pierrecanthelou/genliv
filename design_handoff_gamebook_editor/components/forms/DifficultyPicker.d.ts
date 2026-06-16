export interface DifficultyPickerProps {
	/** Filled squares (1..max). */
	level?: number
	/** Total squares. Default 3. */
	max?: number
	onChange?: (level: number) => void
	/** Square color when filled. */
	tone?: 'ink' | 'accent'
}

export function DifficultyPicker(props: DifficultyPickerProps): JSX.Element
