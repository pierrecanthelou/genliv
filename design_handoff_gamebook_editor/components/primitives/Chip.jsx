import React from 'react'

/**
 * Chip — a rounded inventory/source token, optionally removable.
 * Used for inventory objects, source chips, required-item pills.
 */
export function Chip({ children, onRemove, dashed = false, tone = 'neutral' }) {
	const accent = tone === 'accent'
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				fontSize: '11px',
				color: accent ? 'var(--accent)' : 'var(--ink-1)',
				border: `1px ${dashed ? 'dashed' : 'solid'} ${accent ? 'var(--accent-line)' : 'var(--line-1)'}`,
				background: dashed ? 'transparent' : 'var(--surface-chip)',
				borderRadius: 'var(--r-pill)',
				padding: '4px 10px',
			}}
		>
			{children}
			{onRemove && (
				<button
					type="button"
					onClick={onRemove}
					aria-label="Retirer"
					style={{
						border: 'none',
						background: 'none',
						padding: 0,
						cursor: 'pointer',
						color: 'var(--ink-5)',
						fontSize: '11px',
						lineHeight: 1,
					}}
				>
					✕
				</button>
			)}
		</span>
	)
}
