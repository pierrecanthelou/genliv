import { Field } from '../../../brain'
import { useDebouncedText } from '../hooks/useDebouncedText'

export interface NodeDescriptionProps {
	/** The node's current text (seeds the draft once — the panel is keyed by node id, KR-053). */
	value: string
	/** Commit the settled text to the store (debounced; flushed on blur/unmount). */
	onCommit: (text: string) => void
}

/**
 * The node's « Description » field with DEBOUNCED commits (node-editor iter 4):
 * typing updates a fast local draft and only writes through BookService once the
 * typing settles (or on blur), so a keystroke no longer fires a canvas/outline
 * re-read per character. Extracted so the useDebouncedText hook is unconditional
 * (the panel's empty-state early return would otherwise make it conditional);
 * the parent keys the panel by node id, so this remounts + reseeds on a selection
 * swap (KR-053), and any pending edit is flushed on that unmount (no data loss).
 */
export function NodeDescription({ value, onCommit }: NodeDescriptionProps): JSX.Element {
	const { value: draft, onChange, flush } = useDebouncedText(value, onCommit)
	return (
		<Field
			label="Description"
			multiline
			rows={4}
			value={draft}
			placeholder="Décrivez l’écran tel que le joueur le lit…"
			onChange={(e) => onChange(e.target.value)}
			onBlur={flush}
		/>
	)
}
