import { Field } from './Field'
import type { GameObject } from '../types'

/** The author-editable surface of a game object (its id is owned by the caller). */
export type ObjectDraft = Pick<GameObject, 'name' | 'description'>

/**
 * ObjectEditor — the shared editor for a game object (KR-052): an internal
 * NOM plus a player-facing DESCRIPTION. Lives in brain because several action
 * features reuse it (décor « prendre », PNJ « donne un objet », monster loot,
 * wireframe § 04) — never duplicated per feature. Controlled: it holds no
 * state, the owner persists `onChange` through BookService.
 */
export interface ObjectEditorProps {
	value: ObjectDraft
	onChange: (value: ObjectDraft) => void
}

export function ObjectEditor({ value, onChange }: ObjectEditorProps): JSX.Element {
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
		</div>
	)
}
