import type { CSSProperties } from 'react'

/**
 * Select — a labelled native dropdown, stylistically aligned with Field.
 * Preferred over SegmentedControl when the option set is too wide for a
 * horizontal row (> 4–5 items, or long labels).
 */
export interface SelectOption<T extends string> {
	value: T
	label: string
}

export interface SelectProps<T extends string> {
	label?: string
	ariaLabel?: string
	options: SelectOption<T>[]
	value: T
	onChange: (value: T) => void
}

export function Select<T extends string>({ label, ariaLabel, options, value, onChange }: SelectProps<T>): JSX.Element {
	return (
		<label style={{ display: 'block' }}>
			{label && <span style={labelStyle}>{label}</span>}
			<div style={{ position: 'relative' }}>
				<select
					aria-label={ariaLabel}
					value={value}
					onChange={(e) => onChange(e.target.value as T)}
					style={selectStyle}
				>
					{options.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
				<span style={chevronStyle} aria-hidden="true">
					▾
				</span>
			</div>
		</label>
	)
}

const labelStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}

const selectStyle: CSSProperties = {
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	padding: '7px 32px 7px 10px',
	background: 'var(--surface-sunken)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
	lineHeight: 'var(--lh-body)',
	width: '100%',
	boxSizing: 'border-box',
	cursor: 'pointer',
	appearance: 'none',
}

const chevronStyle: CSSProperties = {
	position: 'absolute',
	right: 10,
	top: '50%',
	transform: 'translateY(-50%)',
	pointerEvents: 'none',
	color: 'var(--text-muted)',
	fontSize: 'var(--fs-meta)',
	lineHeight: 1,
}
