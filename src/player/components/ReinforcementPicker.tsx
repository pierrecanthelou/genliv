import type { GameObject } from '../../brain/types'

interface ReinforcementPickerProps {
	/** Eyebrow label describing what is being reinforced. */
	label: string
	inventory: string[]
	objects: GameObject[]
	selectedId: string | null
	onSelect: (id: string | null) => void
}

/**
 * Shows inventory objects that carry a rollBonus reinforcement (AC C5, KR-141).
 * Returns null when no applicable objects are in inventory — callers render nothing.
 * The player may pick at most one; selecting the active choice deselects it.
 */
export function ReinforcementPicker({
	label,
	inventory,
	objects,
	selectedId,
	onSelect,
}: ReinforcementPickerProps): JSX.Element | null {
	const applicable = objects.filter(
		(o) => inventory.includes(o.id) && (o.reinforcementBonus?.rollBonus ?? 0) > 0,
	)
	if (applicable.length === 0) return null

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
			<div
				style={{
					fontFamily: 'var(--font-mono)',
					fontSize: 'var(--fs-meta)',
					color: 'var(--text-muted)',
					textTransform: 'uppercase',
					letterSpacing: 'var(--track-eyebrow)',
				}}
			>
				{label}
			</div>
			<div role="list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
				<div role="listitem">
					<button
						type="button"
						onClick={() => onSelect(null)}
						style={selectedId === null ? selectedBtn : idleBtn}
					>
						Aucun objet
					</button>
				</div>
				{applicable.map((obj) => (
					<div key={obj.id} role="listitem">
						<button
							type="button"
							onClick={() => onSelect(selectedId === obj.id ? null : obj.id)}
							style={selectedId === obj.id ? selectedBtn : idleBtn}
						>
							<span>{obj.name}</span>
							<span
								style={{
									fontFamily: 'var(--font-mono)',
									fontSize: 'var(--fs-meta)',
									color: selectedId === obj.id ? 'var(--accent)' : 'var(--text-muted)',
									flexShrink: 0,
								}}
							>
								+{obj.reinforcementBonus!.rollBonus} au jet
							</span>
						</button>
					</div>
				))}
			</div>
		</div>
	)
}

const base: React.CSSProperties = {
	width: '100%',
	textAlign: 'left',
	padding: 'var(--space-3) var(--space-5)',
	borderRadius: 'var(--r-md)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
	gap: 'var(--space-4)',
	transition: 'border-color 0.1s, background 0.1s',
}

const idleBtn: React.CSSProperties = {
	...base,
	border: '1px solid var(--border-card)',
	background: 'var(--surface-card)',
	color: 'var(--text-body)',
}

const selectedBtn: React.CSSProperties = {
	...base,
	border: '1px solid var(--accent)',
	background: 'var(--accent-bg)',
	color: 'var(--text-body)',
}
