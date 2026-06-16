import React from 'react'

/** Toggle — the on/off switch (30×17). Accent track when on. */
export function Toggle({ checked = false, onChange, label }) {
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			onClick={() => onChange && onChange(!checked)}
			style={{
				width: 30,
				height: 17,
				flex: 'none',
				border: 'none',
				padding: 0,
				cursor: 'pointer',
				background: checked ? 'var(--accent)' : 'var(--line-2)',
				borderRadius: 'var(--r-pill)',
				position: 'relative',
				transition: 'background 120ms ease',
			}}
		>
			<span
				style={{
					position: 'absolute',
					top: 2,
					left: checked ? 15 : 2,
					width: 13,
					height: 13,
					background: 'var(--paper-0)',
					borderRadius: '50%',
					boxShadow: '0 1px 2px rgba(0,0,0,.2)',
					transition: 'left 120ms ease',
				}}
			/>
		</button>
	)
}
