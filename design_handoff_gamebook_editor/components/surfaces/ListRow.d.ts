import React from 'react'

export interface ListRowProps {
	title: React.ReactNode
	/** Player-facing description / qualifier under the title. */
	subtitle?: React.ReactNode
	/** Optional leading element after the drag handle (badge). */
	leading?: React.ReactNode
	/** Trailing controls (toggle, icon buttons). */
	trailing?: React.ReactNode
	/** Accent treatment when opened in the editor. */
	selected?: boolean
}

export function ListRow(props: ListRowProps): JSX.Element
