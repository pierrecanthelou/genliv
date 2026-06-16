import React from 'react'

export interface BadgeProps {
	children: React.ReactNode
	/** Tints text, border, and fill. */
	tone?: 'neutral' | 'muted' | 'accent' | 'good' | 'bad'
}

export function Badge(props: BadgeProps): JSX.Element
