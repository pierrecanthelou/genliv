import React from 'react'

export interface CardProps {
	children: React.ReactNode
	/** Accent border + selection ring. */
	selected?: boolean
	/** Inner padding in px. Default 18. */
	padding?: number
}

export function Card(props: CardProps): JSX.Element
