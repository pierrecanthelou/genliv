import React from 'react'

/**
 * SegmentedControl — the inline option switcher on a sunken track
 * (action type, Prendre/Écouter/Fouiller, Créer/Choisir).
 */
export function SegmentedControl({ options, value, onChange }) {
	return (
		<div
			role="tablist"
			style={{
				display: 'flex',
				gap: 4,
				background: 'var(--surface-track)',
				borderRadius: 'var(--r-xl)',
				padding: 3,
			}}
		>
			{options.map((opt) => {
				const active = opt.value === value
				return (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={active}
						onClick={() => onChange && onChange(opt.value)}
						style={{
							flex: 1,
							textAlign: 'center',
							border: 'none',
							cursor: 'pointer',
							fontFamily: 'var(--font-ui)',
							fontSize: 'var(--fs-sm)',
							fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-regular)',
							color: active ? 'var(--accent-fg)' : 'var(--text-faint)',
							background: active ? 'var(--ink-0)' : 'transparent',
							borderRadius: 'var(--r-md)',
							padding: '6px 10px',
						}}
					>
						{opt.label}
					</button>
				)
			})}
		</div>
	)
}
