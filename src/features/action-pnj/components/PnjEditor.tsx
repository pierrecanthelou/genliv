import {
	useBrain,
	useOpenBook,
	Field,
	Toggle,
	ObjectEditor,
	createId,
	type ActionEditorContext,
	type PnjConfig,
	type ObjectDraft,
} from '../../../brain'

/** The config a node falls back to before any PNJ is authored. */
const DEFAULT_PNJ: PnjConfig = { name: '', dialogue: '' }

/**
 * action-pnj — the « PNJ » required-action editor, mounted by node-editor via
 * the brain ActionRegistry (self-registered, KR-050/051; node-editor never
 * imports this feature). A VIEW over BookService (KR-020): it reads node.pnj
 * live via useOpenBook and writes through BookService.updateNode. The « donne
 * un objet » gift reuses the shared brain ObjectEditor (KR-052/109) — the same
 * primitive action-decor uses, with no cross-feature import.
 */
export function PnjEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books } = useBrain()
	const book = useOpenBook(bookId)
	const node = book?.nodes.find((n) => n.id === nodeId) ?? null
	// Normalise once so every read and the write share one shape (no scattered defaults).
	const pnj = node?.pnj ?? DEFAULT_PNJ
	const { name, dialogue, gift } = pnj

	function patchPnj(patch: Partial<PnjConfig>): void {
		books.updateNode(bookId, nodeId, { pnj: { ...pnj, ...patch } })
	}

	function handleGiftToggle(on: boolean): void {
		// On → seed an empty object with a stable id; off → drop it (KR-003).
		patchPnj({ gift: on ? { id: createId('object'), name: '', description: '' } : undefined })
	}

	function handleGiftChange(draft: ObjectDraft): void {
		patchPnj({ gift: { id: gift?.id ?? createId('object'), ...draft } })
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Field
				label="NOM DU PNJ"
				value={name}
				placeholder="Le vieil ermite"
				onChange={(e) => patchPnj({ name: e.target.value })}
			/>
			<Field
				label="DIALOGUE"
				hint="lu par le joueur"
				multiline
				rows={3}
				value={dialogue}
				placeholder="« Approche, voyageur. J’ai gardé ceci pour toi… »"
				onChange={(e) => patchPnj({ dialogue: e.target.value })}
			/>
			<Toggle label="Le PNJ donne un objet" checked={gift !== undefined} onChange={handleGiftToggle} />
			{gift !== undefined && (
				<ObjectEditor value={{ name: gift.name, description: gift.description }} onChange={handleGiftChange} />
			)}
		</div>
	)
}
