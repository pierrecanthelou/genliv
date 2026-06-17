import {
	useBrain,
	useOpenBook,
	Field,
	OutcomesEditor,
	type ActionEditorContext,
	type MonsterConfig,
	type RollOutcome,
} from '../../../brain'

/** The config a node falls back to before any monster is authored. */
const DEFAULT_MONSTER: MonsterConfig = { name: '', outcomes: { reussite: '', echec: '' } }

/**
 * action-monster — the « Monstre » required-action editor, mounted by node-editor
 * via the brain ActionRegistry (self-registered, KR-050/051). A VIEW over
 * BookService (KR-020): reads node.monster live and writes via updateNode. The
 * two combat outcomes are derived from the brain ROLL_OUTCOMES registry (KR-117)
 * and coloured with the only semantic colours (réussite = good, échec = bad).
 * « Ajouter à la librairie » is a stub that emits monster:savedToLibrary; the
 * real reusable-monster catalog is a later iteration.
 */
export function MonsterEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books, events } = useBrain()
	const book = useOpenBook(bookId)
	const node = book?.nodes.find((n) => n.id === nodeId) ?? null
	const monster = node?.monster ?? DEFAULT_MONSTER

	function patchMonster(patch: Partial<MonsterConfig>): void {
		books.updateNode(bookId, nodeId, { monster: { ...monster, ...patch } })
	}

	function setOutcome(outcome: RollOutcome, text: string): void {
		patchMonster({ outcomes: { ...monster.outcomes, [outcome]: text } })
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Field
				label="NOM DU MONSTRE"
				value={monster.name}
				placeholder="Gobelin des cavernes"
				onChange={(e) => patchMonster({ name: e.target.value })}
			/>

			<OutcomesEditor value={monster.outcomes} onChange={setOutcome} />

			<button
				type="button"
				onClick={() => events.emit('monster:savedToLibrary', { bookId, nodeId })}
				style={libraryButton}
			>
				<span aria-hidden="true">＋</span> Ajouter à la librairie du générateur
			</button>
		</div>
	)
}

const libraryButton: React.CSSProperties = {
	display: 'inline-flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
	minHeight: 'var(--hit-target)',
	padding: 'var(--space-3) var(--space-5)',
	border: '1.5px dashed var(--accent)',
	borderRadius: 'var(--r-md)',
	background: 'var(--accent-bg)',
	color: 'var(--accent)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	cursor: 'pointer',
}
