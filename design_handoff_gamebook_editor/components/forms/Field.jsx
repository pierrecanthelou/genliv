import React from 'react'

/**
 * Field — a labelled value box. The base authoring control: a mono
 * uppercase label over a bordered box. Multiline for descriptions.
 */
export function Field({ label, hint, value, placeholder, multiline = false, rows = 2, onChange }) {
	const shared = {
		border: '1px solid var(--border-field)',
		borderRadius: 'var(--r-md)',
		padding: '7px 10px',
		background: 'var(--surface-sunken)',
		fontFamily: 'var(--font-ui)',
		fontSize: 'var(--fs-body)',
		color: 'var(--text-body)',
		lineHeight: 'var(--lh-body)',
		width: '100%',
		boxSizing: 'border-box',
		resize: 'none',
	}
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
					{hint && <span style={{ color: 'var(--ink-6)' }}> — {hint}</span>}
				</span>
			)}
			{multiline ? (
				<textarea rows={rows} value={value} placeholder={placeholder} onChange={onChange} style={shared} />
			) : (
				<input type="text" value={value} placeholder={placeholder} onChange={onChange} style={shared} />
			)}
		</label>
	)
}
