import {
	useBrain,
	useOpenBook,
	SegmentedControl,
	ObjectEditor,
	createId,
	type ActionEditorContext,
	type DecorConfig,
	type DecorInteraction,
	type ObjectDraft,
	type SegmentedOption,
} from '../../../brain'

const INTERACTIONS: SegmentedOption<DecorInteraction>[] = [
	{ value: 'prendre', label: 'Prendre' },
	{ value: 'ecouter', label: 'Écouter' },
	{ value: 'fouiller', label: 'Fouiller' },
]

/**
 * action-decor — the « Décor » required-action editor, mounted by node-editor
 * via the brain ActionRegistry (self-registered, KR-050/051; node-editor never
 * imports this feature). A VIEW over BookService (KR-020): it reads the node's
 * décor config live via useOpenBook and writes through BookService.updateNode.
 * « Prendre » uses the shared brain ObjectEditor (name internal + player-facing
 * description, KR-052); « Écouter »/« Fouiller » are stubs for later iterations.
 */
export function DecorEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books } = useBrain()
	const book = useOpenBook(bookId)
	const node = book?.nodes.find((n) => n.id === nodeId) ?? null
	const decor = node?.decor ?? null
	const interaction: DecorInteraction = decor?.interaction ?? 'prendre'

	function patchDecor(patch: Partial<DecorConfig>): void {
		const current: DecorConfig = decor ?? { interaction: 'prendre' }
		books.updateNode(bookId, nodeId, { decor: { ...current, ...patch } })
	}

	function handleObjectChange(draft: ObjectDraft): void {
		// Keep the object's stable id across edits; mint one on first authoring (KR-003).
		const id = decor?.object?.id ?? createId('object')
		patchDecor({ object: { id, ...draft } })
	}

	const objectValue: ObjectDraft = {
		name: decor?.object?.name ?? '',
		description: decor?.object?.description ?? '',
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<SegmentedControl
				ariaLabel="Interaction du décor"
				options={INTERACTIONS}
				value={interaction}
				onChange={(value) => patchDecor({ interaction: value })}
			/>
			{interaction === 'prendre' ? (
				<ObjectEditor value={objectValue} onChange={handleObjectChange} />
			) : (
				<p style={{ margin: 0, fontSize: 'var(--fs-meta)', color: 'var(--text-faint)' }}>
					{interaction === 'ecouter' ? '« Écouter »' : '« Fouiller »'} — détail à venir (jet de caractéristique, indices
					cachés).
				</p>
			)}
		</div>
	)
}
