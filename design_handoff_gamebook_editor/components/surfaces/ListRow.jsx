import React from 'react'

/**
 * ListRow — a draggable object/butin/choice row: handle, title +
 * optional subtitle, trailing controls. The selected variant tints
 * accent (open in editor).
 */
export function ListRow({ title, subtitle, leading, trailing, selected = false }) {
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 12,
				border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border-subtle)',
				background: selected ? 'var(--accent-bg-2)' : 'var(--surface-card)',
				borderRadius: 'var(--r-xl)',
				padding: '10px 12px',
			}}
		>
			<span style={{ color: 'var(--ink-6)', fontSize: 13, cursor: 'grab' }} aria-hidden>⠿</span>
			{leading}
			<div style={{ minWidth: 0, flex: 'none' }}>
				<div style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
					{title}
				</div>
				{subtitle && (
					<div style={{ fontSize: 'var(--fs-meta)', color: 'var(--text-faint)', marginTop: 2, lineHeight: 'var(--lh-snug)' }}>
						{subtitle}
					</div>
				)}
			</div>
			<span style={{ flex: 1 }} />
			{trailing}
		</div>
	)
}
