import { useState } from 'react'
import {
	Modal,
	ObjectEditor,
	SegmentedControl,
	Field,
	Toggle,
	type ObjectDraft,
	type SegmentedOption,
	type SkillRoll,
	type TakeableKind,
	type TakeableObject,
} from '../../../brain'
import { TAKEABLE_KINDS, TAKEABLE_KIND_VALUES } from '../utils/takeables'

const KIND_OPTIONS: SegmentedOption<TakeableKind>[] = TAKEABLE_KIND_VALUES.map((value) => ({
	value,
	label: TAKEABLE_KINDS[value].label,
}))

/** A fresh roll the « jet requis » toggle reveals (réussite simply takes the object). */
const DEFAULT_ROLL: SkillRoll = { trait: '', difficulty: 0, failureText: '' }

/** Parse the difficulty input to a non-negative integer (blank/invalid → 0). */
function parseDifficulty(raw: string): number {
	const n = parseInt(raw, 10)
	return Number.isNaN(n) ? 0 : Math.max(0, n)
}

export interface ObjectEditModalProps {
	takeable: TakeableObject
	isNew: boolean
	onSave: (takeable: TakeableObject) => void
	onCancel: () => void
}

/**
 * The per-object editor for a décor « prendre » takeable, shown in a Modal with
 * real commit/cancel semantics: edits build a local DRAFT (legitimate editing
 * state, not a useEffect-synced mirror — KR-013) initialised once from the
 * takeable, and « Enregistrer » commits it through the owner (which persists via
 * BookService). « Annuler »/Esc discards, so a cancelled new object never lands.
 * Mounted keyed by the object id so each open starts from a fresh draft (KR-053).
 */
export function ObjectEditModal({ takeable, isNew, onSave, onCancel }: ObjectEditModalProps): JSX.Element {
	const [draft, setDraft] = useState<TakeableObject>(takeable)
	const roll = draft.roll
	const nameEmpty = draft.object.name.trim() === ''

	function setObject(value: ObjectDraft): void {
		setDraft({ ...draft, object: { ...draft.object, ...value } })
	}

	function toggleRoll(on: boolean): void {
		setDraft({ ...draft, roll: on ? (draft.roll ?? DEFAULT_ROLL) : undefined })
	}

	function setRoll(patch: Partial<SkillRoll>): void {
		if (draft.roll === undefined) return
		setDraft({ ...draft, roll: { ...draft.roll, ...patch } })
	}

	return (
		<Modal
			title={isNew ? 'Nouvel objet à prendre' : 'Modifier l’objet'}
			confirmLabel="Enregistrer"
			confirmDisabled={nameEmpty}
			onCancel={onCancel}
			onClose={onCancel}
			onConfirm={() => onSave(draft)}
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
				<ObjectEditor value={draft.object} onChange={setObject} />

				<div>
					<span style={fieldLabel}>Nature</span>
					<SegmentedControl
						ariaLabel="Nature de l’objet"
						options={KIND_OPTIONS}
						value={draft.kind}
						onChange={(kind) => setDraft({ ...draft, kind })}
					/>
				</div>

				<Toggle label="Jet requis pour le prendre" checked={roll !== undefined} onChange={toggleRoll} />

				{roll !== undefined && (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
						<Field
							label="CARACTÉRISTIQUE"
							value={roll.trait}
							placeholder="Habileté"
							onChange={(e) => setRoll({ trait: e.target.value })}
						/>
						<Field
							label="DIFFICULTÉ"
							value={String(roll.difficulty)}
							placeholder="7"
							onChange={(e) => setRoll({ difficulty: parseDifficulty(e.target.value) })}
						/>
						<Field
							label="TEXTE D’ÉCHEC"
							hint="lu par le joueur"
							multiline
							rows={2}
							value={roll.failureText}
							placeholder="Le mécanisme cède et l’objet se brise…"
							onChange={(e) => setRoll({ failureText: e.target.value })}
						/>
					</div>
				)}
			</div>
		</Modal>
	)
}

const fieldLabel: React.CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}
