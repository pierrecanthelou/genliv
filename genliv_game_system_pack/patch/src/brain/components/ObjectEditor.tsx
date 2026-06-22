import { Field } from './Field'
import { SegmentedControl, type SegmentedOption } from './SegmentedControl'
import type { GameObject, EquipmentEffect } from '../types'
import { WEAPONS, WEAPON_VALUES, DEFAULT_WEAPON, PROTECTIONS, PROTECTION_VALUES } from '../equipment'

/** The author-editable surface of a game object (its id is owned by the caller). */
export type ObjectDraft = Pick<GameObject, 'name' | 'description' | 'equipment'>

/** The « effet d'équipement » segments: none / weapon / protection (§ 3). */
type EquipKind = 'aucun' | 'arme' | 'protection'

const EQUIP_OPTIONS: SegmentedOption<EquipKind>[] = [
	{ value: 'aucun', label: 'Aucun' },
	{ value: 'arme', label: 'Arme' },
	{ value: 'protection', label: 'Protection' },
]

/**
 * ObjectEditor — the shared editor for a game object (KR-052): an internal
 * NOM plus a player-facing DESCRIPTION, and an OPTIONAL « effet d'équipement »
 * (§ 3) marking the object as a weapon (PF multiplier) or protection (damage
 * reduction). Lives in brain because several action features reuse it (décor
 * « prendre », PNJ « donne un objet », monster loot, wireframe § 04) — never
 * duplicated per feature. Controlled: it holds no state, the owner persists
 * `onChange` through BookService.
 */
export interface ObjectEditorProps {
	value: ObjectDraft
	onChange: (value: ObjectDraft) => void
}

function equipKindOf(equipment: EquipmentEffect | undefined): EquipKind {
	return equipment?.kind ?? 'aucun'
}

export function ObjectEditor({ value, onChange }: ObjectEditorProps): JSX.Element {
	const equipKind = equipKindOf(value.equipment)

	function setEquipKind(kind: EquipKind): void {
		if (kind === 'aucun') {
			onChange({ ...value, equipment: undefined })
		} else if (kind === 'arme') {
			onChange({ ...value, equipment: { kind: 'arme', weapon: value.equipment?.weapon ?? DEFAULT_WEAPON } })
		} else {
			onChange({ ...value, equipment: { kind: 'protection', protection: value.equipment?.protection ?? PROTECTION_VALUES[0] } })
		}
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Field
				label="NOM DE L’OBJET"
				hint="interne"
				value={value.name}
				placeholder="Potion de vigueur"
				onChange={(e) => onChange({ ...value, name: e.target.value })}
			/>
			<Field
				label="DESCRIPTION"
				hint="lue par le joueur"
				multiline
				rows={3}
				value={value.description}
				placeholder="Une fiole tiède où perle un liquide ambré…"
				onChange={(e) => onChange({ ...value, description: e.target.value })}
			/>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
				<span style={fieldLabel}>Effet d’équipement</span>
				<SegmentedControl ariaLabel="Effet d’équipement" options={EQUIP_OPTIONS} value={equipKind} onChange={setEquipKind} />

				{equipKind === 'arme' && (
					<select
						aria-label="Type d’arme"
						style={select}
						value={value.equipment?.weapon ?? DEFAULT_WEAPON}
						onChange={(e) => onChange({ ...value, equipment: { kind: 'arme', weapon: e.target.value as EquipmentEffect['weapon'] } })}
					>
						{WEAPON_VALUES.map((id) => (
							<option key={id} value={id}>
								{WEAPONS[id].label} (×{WEAPONS[id].multiplier})
							</option>
						))}
					</select>
				)}

				{equipKind === 'protection' && (
					<select
						aria-label="Type de protection"
						style={select}
						value={value.equipment?.protection ?? PROTECTION_VALUES[0]}
						onChange={(e) =>
							onChange({ ...value, equipment: { kind: 'protection', protection: e.target.value as EquipmentEffect['protection'] } })
						}
					>
						{PROTECTION_VALUES.map((id) => (
							<option key={id} value={id}>
								{PROTECTIONS[id].label}
								{PROTECTIONS[id].reduction > 0 ? ` (−${PROTECTIONS[id].reduction})` : ' (+1D4 parade)'}
							</option>
						))}
					</select>
				)}
			</div>
		</div>
	)
}

const fieldLabel: React.CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
}

const select: React.CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-3)',
	border: '1px solid var(--border-input)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-card)',
	color: 'var(--text-body)',
	fontFamily: 'var(--font-sans)',
	fontSize: 'var(--fs-body)',
}
