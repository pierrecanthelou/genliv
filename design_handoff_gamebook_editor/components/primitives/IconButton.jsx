import React from 'react'

/**
 * IconButton — 24px square action button used on rows (édition,
 * suppression). Tone 'danger' for destructive, 'accent' for active.
 */
const TONES = {
	default: { color: 'var(--ink-2)', border: 'var(--line-2)', bg: 'var(--paper-0)' },
	danger: { color: 'var(--bad)', border: 'var(--line-2)', bg: 'var(--paper-0)' },
	accent: { color: 'var(--accent-fg)', border: 'var(--accent)', bg: 'var(--accent)' },
}

export function IconButton({ children, onClick, tone = 'default', label, size = 24 }) {
	const t = TONES[tone] ?? TONES.default
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			style={{
				width: size,
				height: size,
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: 'var(--font-mono)',
				fontSize: '11px',
				color: t.color,
				border: `1px solid ${t.border}`,
				background: t.bg,
				borderRadius: 'var(--r-md)',
				cursor: 'pointer',
				padding: 0,
			}}
		>
			{children}
		</button>
	)
}
