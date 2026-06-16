import React from 'react'

export interface FieldProps {
	/** Mono uppercase label above the box. */
	label?: string
	/** Faint qualifier appended to the label ("interne", "lue par le joueur"). */
	hint?: string
	value?: string
	placeholder?: string
	/** Renders a textarea instead of an input. */
	multiline?: boolean
	rows?: number
	onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export function Field(props: FieldProps): JSX.Element
