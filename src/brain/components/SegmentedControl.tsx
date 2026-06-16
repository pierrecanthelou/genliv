/**
 * SegmentedControl — a single-choice mono segmented switch on a sunken track
 * (wireframe § 02 « Action requise »: Aucune / PNJ / Décor / Piège / Monstre).
 * The active segment gets the dark ink fill. Options are passed in — the
 * control is content-agnostic so callers (node-editor) stay Open/Closed.
 */
export interface SegmentedOption<T extends string> {
	value: T
	label: string
}

export interface SegmentedControlProps<T extends string> {
	options: SegmentedOption<T>[]
	value: T
	onChange: (value: T) => void
	ariaLabel?: string
}

export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
}: SegmentedControlProps<T>): JSX.Element {
	return (
		<div
			role="radiogroup"
			aria-label={ariaLabel}
			style={{
				display: 'flex',
				gap: 3,
				background: 'var(--surface-track)',
				borderRadius: 'var(--r-xl)',
				padding: 3,
			}}
		>
			{options.map((option) => {
				const active = option.value === value
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={active}
						onClick={() => onChange(option.value)}
						style={{
							flex: 1,
							minHeight: 'var(--hit-target)',
							border: 'none',
							borderRadius: 'var(--r-md)',
							cursor: 'pointer',
							fontFamily: 'var(--font-mono)',
							fontSize: 'var(--fs-meta)',
							fontWeight: active ? 'var(--fw-semibold)' : 'var(--fw-regular)',
							color: active ? 'var(--text-on-accent)' : 'var(--text-muted)',
							background: active ? 'var(--ink-0)' : 'transparent',
						}}
					>
						{option.label}
					</button>
				)
			})}
		</div>
	)
}
