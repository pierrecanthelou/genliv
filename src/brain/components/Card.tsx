import { type ReactNode } from 'react'

/** Card — the white rounded surface that holds a section of the editor. */
export interface CardProps {
	children: ReactNode
	selected?: boolean
	padding?: number
}

export function Card({ children, selected = false, padding = 18 }: CardProps): JSX.Element {
	return (
		<div
			style={{
				background: 'var(--surface-card)',
				border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border-card)',
				borderRadius: 'var(--r-3xl)',
				boxShadow: selected ? 'var(--ring-selected)' : 'var(--shadow-card)',
				padding,
			}}
		>
			{children}
		</div>
	)
}
