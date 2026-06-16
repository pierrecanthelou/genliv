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

/**
 * Single source for per-interaction data (same data-driven pattern as the kind
 * registry, KR-068): the label is written once here, never duplicated in the
 * switch options and the placeholder copy. New per-interaction facts (reveal
 * text, roll config) get added as fields here in later iterations.
 */
const DECOR_INTERACTIONS: Record<DecorInteraction, { label: string }> = {
	prendre: { label: 'Prendre' },
	ecouter: { label: 'Écouter' },
	fouiller: { label: 'Fouiller' },
}

const INTERACTION_OPTIONS: SegmentedOption<DecorInteraction>[] = (
	Object.keys(DECOR_INTERACTIONS) as DecorInteraction[]
).map((value) => ({ value, label: DECOR_INTERACTIONS[value].label }))

/** The config a node falls back to before any décor is authored. */
const DEFAULT_DECOR: DecorConfig = { interaction: 'prendre' }

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
	// Normalise the config once (default « prendre ») so every read and the write
	// share one shape — no repeated `?? 'prendre'` fallback or `decor?.object?.` chain.
	const decor = node?.decor ?? DEFAULT_DECOR
	const { interaction, object } = decor

	function patchDecor(patch: Partial<DecorConfig>): void {
		books.updateNode(bookId, nodeId, { decor: { ...decor, ...patch } })
	}

	function handleObjectChange(draft: ObjectDraft): void {
		// Keep the object's stable id across edits; mint one on first authoring (KR-003).
		patchDecor({ object: { id: object?.id ?? createId('object'), ...draft } })
	}

	const objectValue: ObjectDraft = { name: object?.name ?? '', description: object?.description ?? '' }

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<SegmentedControl
				ariaLabel="Interaction du décor"
				options={INTERACTION_OPTIONS}
				value={interaction}
				onChange={(value) => patchDecor({ interaction: value })}
			/>
			{interaction === 'prendre' ? (
				<ObjectEditor value={objectValue} onChange={handleObjectChange} />
			) : (
				<p style={{ margin: 0, fontSize: 'var(--fs-meta)', color: 'var(--text-faint)' }}>
					« {DECOR_INTERACTIONS[interaction].label} » — détail à venir (jet de caractéristique, indices cachés).
				</p>
			)}
		</div>
	)
}
