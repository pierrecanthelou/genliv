import React from 'react'

/**
 * OutcomeBlock — a réussite (success) or échec (failure) panel for a
 * skill-roll result: tinted background, mono header, player text.
 */
export function OutcomeBlock({ variant = 'success', header, children, trailing }) {
	const good = variant === 'success'
	return (
		<div
			style={{
				border: `1px solid ${good ? 'var(--good-line)' : 'var(--bad-line)'}`,
				background: good ? 'var(--good-bg)' : 'var(--bad-bg)',
				borderRadius: 'var(--r-lg)',
				padding: 10,
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
				<span
					style={{
						fontFamily: 'var(--font-mono)',
						fontSize: '8.5px',
						color: good ? 'var(--good)' : 'var(--bad)',
					}}
				>
					{good ? '✓' : '✕'} {header}
				</span>
				{trailing}
			</div>
			<div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-body)', lineHeight: 'var(--lh-body)' }}>
				{children}
			</div>
		</div>
	)
}
