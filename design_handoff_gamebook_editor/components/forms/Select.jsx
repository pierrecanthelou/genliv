import React from 'react'

/** Select — a field-styled dropdown trigger (▾). Presentational. */
export function Select({ label, value, onClick }) {
	return (
		<label style={{ display: 'block' }}>
			{label && (
				<span
					style={{
						display: 'block',
						fontFamily: 'var(--font-mono)',
						fontSize: 'var(--fs-eyebrow)',
						color: 'var(--text-label)',
						marginBottom: 5,
						letterSpacing: 'var(--track-eyebrow)',
					}}
				>
					{label}
				</span>
			)}
			<button
				type="button"
				onClick={onClick}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					width: '100%',
					border: '1px solid var(--border-field)',
					borderRadius: 'var(--r-md)',
					padding: '7px 10px',
					background: 'var(--surface-sunken)',
					fontFamily: 'var(--font-ui)',
					fontSize: 'var(--fs-body)',
					color: 'var(--text-body)',
					cursor: 'pointer',
				}}
			>
				<span>{value}</span>
				<span style={{ color: 'var(--ink-5)' }}>▾</span>
			</button>
		</label>
	)
}
