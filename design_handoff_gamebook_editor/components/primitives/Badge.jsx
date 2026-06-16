import React from 'react'

/**
 * Badge — a small mono pill for status/meta (e.g. "utile · +12 PV",
 * "leurre · sans effet", "#4"). Tone tints text + border.
 */
const TONES = {
	neutral: { color: 'var(--ink-2)', border: 'var(--line-1)', bg: 'var(--paper-0)' },
	muted: { color: 'var(--ink-4)', border: 'var(--line-2)', bg: 'var(--paper-0)' },
	accent: { color: 'var(--accent)', border: 'var(--accent-line)', bg: 'var(--paper-0)' },
	good: { color: 'var(--good)', border: 'var(--good-line)', bg: 'var(--good-bg-2)' },
	bad: { color: 'var(--bad)', border: 'var(--bad-line)', bg: 'var(--bad-bg-2)' },
}

export function Badge({ children, tone = 'neutral' }) {
	const t = TONES[tone] ?? TONES.neutral
	return (
		<span
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				fontFamily: 'var(--font-mono)',
				fontSize: '10px',
				color: t.color,
				border: `1px solid ${t.border}`,
				background: t.bg,
				borderRadius: 'var(--r-pill)',
				padding: '3px 9px',
				whiteSpace: 'nowrap',
			}}
		>
			{children}
		</span>
	)
}
