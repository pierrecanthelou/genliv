import React from 'react'

export interface OutcomeBlockProps {
	variant?: 'success' | 'failure'
	/** Mono header after the ✓/✕ glyph (e.g. "RÉUSSITE — ajoute un choix"). */
	header: string
	/** Player-facing outcome text. */
	children: React.ReactNode
	/** Optional trailing control (edit affordance). */
	trailing?: React.ReactNode
}

export function OutcomeBlock(props: OutcomeBlockProps): JSX.Element
