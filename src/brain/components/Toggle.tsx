/**
 * Toggle — a labelled on/off switch (wireframe § 02 « Fin victoire / Fin échec »).
 * Accent track when on. Keyboard-operable via the native checkbox, ≥44px row.
 */
export interface ToggleProps {
	label: string
	checked: boolean
	onChange: (checked: boolean) => void
	disabled?: boolean
}

export function Toggle({ label, checked, onChange, disabled = false }: ToggleProps): JSX.Element {
	return (
		<label
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				minHeight: 'var(--hit-target)',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
			}}
		>
			<span style={{ fontSize: 'var(--fs-body)', color: 'var(--text-body)' }}>{label}</span>
			<span style={{ position: 'relative', display: 'inline-flex' }}>
				<input
					type="checkbox"
					role="switch"
					checked={checked}
					disabled={disabled}
					onChange={(e) => onChange(e.target.checked)}
					style={{ position: 'absolute', opacity: 0, width: 34, height: 19, margin: 0, cursor: 'inherit' }}
				/>
				<span
					aria-hidden="true"
					style={{
						width: 34,
						height: 19,
						borderRadius: 'var(--r-pill)',
						background: checked ? 'var(--accent)' : 'var(--line-2)',
						transition: 'background 0.12s',
						display: 'inline-block',
					}}
				>
					<span
						style={{
							position: 'absolute',
							top: 2,
							left: checked ? 17 : 2,
							width: 15,
							height: 15,
							borderRadius: '50%',
							background: 'var(--surface-card)',
							boxShadow: 'var(--shadow-card)',
							transition: 'left 0.12s',
						}}
					/>
				</span>
			</span>
		</label>
	)
}
