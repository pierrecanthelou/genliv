import React from 'react'

export interface CardHeadProps {
	/** Mono uppercase eyebrow. */
	eyebrow?: string
	title: React.ReactNode
	/** Optional right-aligned control (icon button, chip). */
	trailing?: React.ReactNode
}

export function CardHead(props: CardHeadProps): JSX.Element
