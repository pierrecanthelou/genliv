import React from 'react'

/**
 * CardHead — the standard card header: a mono eyebrow over a
 * Hanken title, with an optional trailing action (e.g. expand).
 */
export function CardHead({ eyebrow, title, trailing }) {
	return (
		<div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 11 }}>
			<div>
				{eyebrow && (
					<div
						style={{
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-eyebrow)',
							letterSpacing: 'var(--track-eyebrow-wide)',
							textTransform: 'uppercase',
							color: 'var(--text-faint)',
							marginBottom: 4,
						}}
					>
						{eyebrow}
					</div>
				)}
				<div
					style={{
						fontFamily: 'var(--font-ui)',
						fontSize: 'var(--fs-title)',
						fontWeight: 'var(--fw-medium)',
						letterSpacing: 'var(--track-tight)',
						color: 'var(--text-strong)',
					}}
				>
					{title}
				</div>
			</div>
			{trailing}
		</div>
	)
}
