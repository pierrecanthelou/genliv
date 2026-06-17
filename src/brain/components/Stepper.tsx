import { IconButton } from './IconButton'
import { HIT_TARGET_MIN } from '../ui'

/**
 * Stepper — a labelled − N + numeric stepper (wireframe § 04: gift bonus,
 * monster stats). Clamps to [min, max] on each step. Lives in brain because
 * more than one feature uses it (action-pnj gift value + action-monster stats,
 * KR-109) — same extraction rule as ObjectEditor/OutcomesEditor. Controlled:
 * the owner persists `onChange`. The +/− buttons name themselves from `label`
 * so several steppers on one screen keep distinct accessible names.
 */
export interface StepperProps {
	label: string
	value: number
	onChange: (value: number) => void
	min?: number
	max?: number
	/** Optional prefix on the displayed value (e.g. "+" for a bonus). */
	prefix?: string
}

export function Stepper({ label, value, onChange, min = 0, max = 99, prefix = '' }: StepperProps): JSX.Element {
	// Guard NaN (the component is shared; a future non-numeric source falls back to min).
	const clamp = (v: number): number => (Number.isNaN(v) ? min : Math.min(max, Math.max(min, v)))
	return (
		<div style={row}>
			<span style={labelStyle}>{label}</span>
			<div style={controls}>
				<IconButton label={`Diminuer ${label}`} size={HIT_TARGET_MIN} onClick={() => onChange(clamp(value - 1))}>
					−
				</IconButton>
				<span style={display} aria-live="polite">
					{prefix}
					{value}
				</span>
				<IconButton label={`Augmenter ${label}`} size={HIT_TARGET_MIN} onClick={() => onChange(clamp(value + 1))}>
					+
				</IconButton>
			</div>
		</div>
	)
}

const row: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 'var(--space-3)',
}

const labelStyle: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
}

const controls: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
}

const display: React.CSSProperties = {
	minWidth: 36,
	textAlign: 'center',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-body)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
}
