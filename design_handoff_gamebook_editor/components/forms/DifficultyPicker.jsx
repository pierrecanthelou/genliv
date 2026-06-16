import React from 'react'

/**
 * DifficultyPicker — N filled squares out of max for a skill-roll
 * difficulty (Force, Perception…). Tone follows accent or ink.
 */
export function DifficultyPicker({ level = 2, max = 3, onChange, tone = 'ink' }) {
	const fill = tone === 'accent' ? 'var(--accent)' : 'var(--ink-0)'
	const emptyBorder = tone === 'accent' ? 'var(--accent-line)' : 'var(--ink-6)'
	return (
		<div style={{ display: 'flex', gap: 3 }}>
			{Array.from({ length: max }).map((_, i) => {
				const on = i < level
				return (
					<button
						key={i}
						type="button"
						aria-label={`Difficulté ${i + 1}`}
						onClick={() => onChange && onChange(i + 1)}
						style={{
							width: 11,
							height: 11,
							padding: 0,
							cursor: 'pointer',
							borderRadius: 2,
							background: on ? fill : 'transparent',
							border: on ? 'none' : `1px solid ${emptyBorder}`,
						}}
					/>
				)
			})}
		</div>
	)
}
