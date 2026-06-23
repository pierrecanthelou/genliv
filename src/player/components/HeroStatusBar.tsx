import type { HeroState } from '../types'

interface HeroStatusBarProps {
	hero: HeroState
}

export function HeroStatusBar({ hero }: HeroStatusBarProps): JSX.Element {
	const pvPct = hero.pvMax > 0 ? hero.pv / hero.pvMax : 0
	const pvColor = pvPct > 0.5 ? 'var(--good)' : 'var(--bad)'

	return (
		<div
			style={{
				display: 'flex',
				gap: 'var(--space-5)',
				alignItems: 'center',
				padding: '8px 16px',
				borderBottom: '1px solid var(--border-subtle)',
				background: 'var(--surface-card)',
				fontFamily: 'var(--font-mono)',
				fontSize: 'var(--fs-meta)',
				color: 'var(--text-label)',
				flexShrink: 0,
			}}
		>
			<span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>
				{hero.name}
			</span>
			<span style={{ width: 1, height: 14, background: 'var(--border-subtle)' }} />
			<span>
				PV{' '}
				<span style={{ color: pvColor, fontWeight: 'var(--fw-semibold)' }}>
					{hero.pv}
				</span>
				/{hero.pvMax}
			</span>
			<span>
				PE{' '}
				<span
					style={{
						color: hero.pe < hero.peMax * 0.3 ? 'var(--bad)' : 'inherit',
						fontWeight: 'var(--fw-semibold)',
					}}
				>
					{hero.pe}
				</span>
				/{hero.peMax}
			</span>
			<span>
				XP <span style={{ fontWeight: 'var(--fw-semibold)' }}>{hero.xp}</span>
			</span>
		</div>
	)
}
