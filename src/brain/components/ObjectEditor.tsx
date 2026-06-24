import { Field } from './Field'
import { Toggle } from './Toggle'
import { SegmentedControl, type SegmentedOption } from './SegmentedControl'
import { Stepper } from './Stepper'
import type { GameObject, EquipmentEffect } from '../types'
import {
	WEAPONS,
	WEAPON_VALUES,
	DEFAULT_WEAPON,
	PROTECTIONS,
	PROTECTION_VALUES,
	DEFAULT_PROTECTION,
	type WeaponId,
	type ProtectionId,
} from '../equipment'

/** The author-editable surface of a game object (its id is owned by the caller). */
export type ObjectDraft = Pick<GameObject, 'name' | 'description' | 'equipment' | 'reinforcementBonus' | 'scenario'>

/**
 * ObjectEditor — the shared editor for a game object (KR-052): an internal
 * NOM plus a player-facing DESCRIPTION plus an optional EQUIPMENT EFFECT (§ 3).
 * Lives in brain because several action features reuse it (décor « prendre »,
 * PNJ « donne un objet », monster loot, wireframe § 04). Controlled: it holds
 * no state, the owner persists `onChange` through BookService.
 */
export interface ObjectEditorProps {
	value: ObjectDraft
	onChange: (value: ObjectDraft) => void
}

type EquipKind = 'aucun' | 'arme' | 'protection'

const EQUIP_OPTIONS: SegmentedOption<EquipKind>[] = [
	{ value: 'aucun', label: 'Aucun' },
	{ value: 'arme', label: 'Arme' },
	{ value: 'protection', label: 'Protection' },
]

export function ObjectEditor({ value, onChange }: ObjectEditorProps): JSX.Element {
	const equip: EquipmentEffect | undefined = value.equipment
	const equipKind: EquipKind = equip === undefined ? 'aucun' : equip.kind

	function handleEquipKind(kind: EquipKind): void {
		if (kind === 'aucun') {
			onChange({ ...value, equipment: undefined })
		} else if (kind === 'arme') {
			// Preserve the current weapon selection when switching back from protection.
			const weapon = equip?.kind === 'arme' ? equip.weapon : DEFAULT_WEAPON
			onChange({ ...value, equipment: { kind: 'arme', weapon } })
		} else {
			// Preserve the current protection selection when switching back from arme.
			const protection = equip?.kind === 'protection' ? equip.protection : DEFAULT_PROTECTION
			onChange({ ...value, equipment: { kind: 'protection', protection } })
		}
	}

	function handleWeapon(weapon: WeaponId): void {
		onChange({ ...value, equipment: { kind: 'arme', weapon } })
	}

	function handleProtection(protection: ProtectionId): void {
		onChange({ ...value, equipment: { kind: 'protection', protection } })
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Field
				label="NOM DE L'OBJET"
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
				<span style={sectionLabel}>Effet d'équipement</span>
				<SegmentedControl<EquipKind>
					ariaLabel="Effet d'équipement"
					options={EQUIP_OPTIONS}
					value={equipKind}
					onChange={handleEquipKind}
				/>
				{equip?.kind === 'arme' && (
					<select
						aria-label="Type d'arme"
						value={equip.weapon}
						onChange={(e) => handleWeapon(e.target.value as WeaponId)}
						style={selectStyle}
					>
						{WEAPON_VALUES.map((id) => (
							<option key={id} value={id}>
								{WEAPONS[id].label} (×{WEAPONS[id].multiplier})
							</option>
						))}
					</select>
				)}
				{equip?.kind === 'protection' && (
					<select
						aria-label="Type de protection"
						value={equip.protection}
						onChange={(e) => handleProtection(e.target.value as ProtectionId)}
						style={selectStyle}
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

			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
				<span style={sectionLabel}>Renforcement d'action</span>
				<Stepper
					label="BONUS DE JET"
					value={value.reinforcementBonus?.rollBonus ?? 0}
					onChange={(v) =>
						onChange({ ...value, reinforcementBonus: v > 0 ? { rollBonus: v } : undefined })
					}
					min={0}
					max={5}
					prefix="+"
				/>
			</div>

			<Toggle
				label="Objet de scénario"
				checked={value.scenario ?? false}
				onChange={(scenario) => onChange({ ...value, scenario: scenario || undefined })}
			/>
		</div>
	)
}

const sectionLabel: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
}

const selectStyle: React.CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-2) var(--space-3)',
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-card)',
	color: 'var(--text-body)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
}
