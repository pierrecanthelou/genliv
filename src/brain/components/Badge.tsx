import { type CSSProperties, type ReactNode } from 'react'

/**
 * Badge — a small mono pill for status/meta (e.g. "utile · +12 PV",
 * "leurre · sans effet", "#4"). Tone tints text + border.
 */
export type BadgeTone = 'neutral' | 'muted' | 'accent' | 'good' | 'bad'

export interface BadgeProps {
	children: ReactNode
	tone?: BadgeTone
}

const TONES: Record<BadgeTone, { color: string; border: string; bg: string }> = {
	neutral: { color: 'var(--ink-2)', border: 'var(--line-1)', bg: 'var(--paper-0)' },
	muted: { color: 'var(--ink-4)', border: 'var(--line-2)', bg: 'var(--paper-0)' },
	accent: { color: 'var(--accent)', border: 'var(--accent-line)', bg: 'var(--paper-0)' },
	good: { color: 'var(--good)', border: 'var(--good-line)', bg: 'var(--good-bg-2)' },
	bad: { color: 'var(--bad)', border: 'var(--bad-line)', bg: 'var(--bad-bg-2)' },
}

export function Badge({ children, tone = 'neutral' }: BadgeProps): JSX.Element {
	const t = TONES[tone]
	const style: CSSProperties = {
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
	}
	return <span style={style}>{children}</span>
}
