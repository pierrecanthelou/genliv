import {
	useBrain,
	useOpenBook,
	Field,
	Toggle,
	OutcomesEditor,
	SegmentedControl,
	Stepper,
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	DEFAULT_CHARACTERISTIC,
	type ActionEditorContext,
	type TrapConfig,
	type RollOutcome,
	type SkillRoll,
	type Characteristic,
	type SegmentedOption,
} from '../../../brain'

/** Difficulty bounds for the skill roll (a low-fi target number). */
const DIFFICULTY_MIN = 1
const DIFFICULTY_MAX = 12
const DEFAULT_DIFFICULTY = 7

/** The config a node falls back to before any trap is authored (with a default roll). */
const DEFAULT_TRAP: TrapConfig = {
	description: '',
	roll: { trait: DEFAULT_CHARACTERISTIC, difficulty: DEFAULT_DIFFICULTY },
	outcomes: { reussite: '', echec: '' },
	fatal: false,
}

const CHARACTERISTIC_OPTIONS: SegmentedOption<Characteristic>[] = CHARACTERISTIC_VALUES.map((value) => ({
	value,
	label: CHARACTERISTICS[value].label,
}))

/**
 * action-trap — the « Piège » required-action editor, mounted by node-editor via
 * the brain ActionRegistry (self-registered, KR-050/051). A VIEW over BookService
 * (KR-020): reads node.trap live and writes via updateNode.
 *
 * Iteration 1 — the skill roll (§ 05): a CARACTÉRISTIQUE select (from the brain
 * CHARACTERISTICS registry, KR-117) + a DIFFICULTÉ stepper gate which outcome
 * applies; the réussite/échec reveal texts use the shared brain OutcomesEditor
 * (KR-117/091). The « échec mène à la Mort » toggle is the « échec sanctionné »
 * variant (the automatic →Mort edge is wired later, KR-067). A skeleton trap
 * (no roll) migrates in the default roll on read (KR-116).
 */
export function TrapEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books } = useBrain()
	const book = useOpenBook(bookId)
	const node = book?.nodes.find((n) => n.id === nodeId) ?? null
	// Normalise once (default + roll migration) so every read and write share one shape.
	const trap: TrapConfig = { ...DEFAULT_TRAP, ...(node?.trap ?? {}) }
	const roll = trap.roll ?? DEFAULT_TRAP.roll!

	function patchTrap(patch: Partial<TrapConfig>): void {
		books.updateNode(bookId, nodeId, { trap: { ...trap, ...patch } })
	}

	function setRoll(patch: Partial<SkillRoll>): void {
		patchTrap({ roll: { ...roll, ...patch } })
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

			<div style={rollSection}>
				<span style={sectionLabel}>Jet de caractéristique</span>
				<SegmentedControl
					ariaLabel="Caractéristique du jet"
					options={CHARACTERISTIC_OPTIONS}
					// Cast is intentional: trait is a free string for forward-compat; an
					// unknown value simply highlights no segment (no unguarded lookup).
					value={roll.trait as Characteristic}
					onChange={(trait) => setRoll({ trait })}
				/>
				<Stepper
					label="Difficulté"
					value={roll.difficulty}
					min={DIFFICULTY_MIN}
					max={DIFFICULTY_MAX}
					onChange={(difficulty) => setRoll({ difficulty })}
				/>
			</div>

			<OutcomesEditor value={trap.outcomes} onChange={setOutcome} />
			<Toggle label="L’échec mène à la Mort" checked={trap.fatal} onChange={(fatal) => patchTrap({ fatal })} />
		</div>
	)
}

const rollSection: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
}

const sectionLabel: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
}
