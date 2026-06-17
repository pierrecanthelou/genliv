import {
	useBrain,
	useOpenBook,
	Field,
	Toggle,
	OutcomesEditor,
	type ActionEditorContext,
	type TrapConfig,
	type RollOutcome,
} from '../../../brain'

/** The config a node falls back to before any trap is authored. */
const DEFAULT_TRAP: TrapConfig = { description: '', outcomes: { reussite: '', echec: '' }, fatal: false }

/**
 * action-trap — the « Piège » required-action editor, mounted by node-editor via
 * the brain ActionRegistry (self-registered, KR-050/051). A VIEW over BookService
 * (KR-020): reads node.trap live and writes via updateNode. A trap is a skill
 * roll, so its réussite/échec reveal texts use the shared brain OutcomesEditor
 * (KR-117/091) — the same rows as the monster combat. The « échec mène à la Mort »
 * toggle is the trap's « échec sanctionné » variant (the automatic →Mort edge is
 * wired in a later iteration, KR-067). Skill caractéristique/difficulté deferred.
 */
export function TrapEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books } = useBrain()
	const book = useOpenBook(bookId)
	const node = book?.nodes.find((n) => n.id === nodeId) ?? null
	const trap = node?.trap ?? DEFAULT_TRAP

	function patchTrap(patch: Partial<TrapConfig>): void {
		books.updateNode(bookId, nodeId, { trap: { ...trap, ...patch } })
	}

	function setOutcome(outcome: RollOutcome, text: string): void {
		patchTrap({ outcomes: { ...trap.outcomes, [outcome]: text } })
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Field
				label="DESCRIPTION DU PIÈGE"
				hint="lue par le joueur"
				multiline
				rows={2}
				value={trap.description}
				placeholder="Une dalle s’enfonce sous votre pas…"
				onChange={(e) => patchTrap({ description: e.target.value })}
			/>
			<OutcomesEditor value={trap.outcomes} onChange={setOutcome} />
			<Toggle label="L’échec mène à la Mort" checked={trap.fatal} onChange={(fatal) => patchTrap({ fatal })} />
		</div>
	)
}
