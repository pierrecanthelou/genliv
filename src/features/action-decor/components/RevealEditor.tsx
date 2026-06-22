import {
	Field,
	Toggle,
	SegmentedControl,
	Stepper,
	OutcomesEditor,
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	DEFAULT_CHARACTERISTIC,
	type DecorReveal,
	type RollOutcome,
	type Characteristic,
	type SegmentedOption,
} from '../../../brain'

/** Difficulty bounds for the gating roll (a low-fi target number, as in trap). */
const DIFFICULTY_MIN = 1
const DIFFICULTY_MAX = 12
const DEFAULT_DIFFICULTY = 7

const CHARACTERISTIC_OPTIONS: SegmentedOption<Characteristic>[] = CHARACTERISTIC_VALUES.map((value) => ({
	value,
	label: CHARACTERISTICS[value].label,
}))

const EMPTY_OUTCOMES: Record<RollOutcome, string> = { reussite: '', echec: '' }

export interface RevealEditorProps {
	/** Mono label for the reveal field (« Ce que le joueur entend / trouve »). */
	label: string
	placeholder: string
	reveal: DecorReveal
	onChange: (next: DecorReveal) => void
}

/**
 * The « écouter » / « fouiller » reveal editor (action-decor iteration 2): the
 * heard/found text, plus an optional « jet requis » that gates it behind a skill
 * roll — caractéristique + difficulté (shared brain controls) and a réussite/échec
 * reveal via the shared brain OutcomesEditor (KR-091/117: the only semantic
 * outcomes/colours). Toggling the roll off drops the roll + outcomes but keeps
 * the base text. Controlled — the owner persists every change via BookService.
 */
export function RevealEditor({ label, placeholder, reveal, onChange }: RevealEditorProps): JSX.Element {
	const gated = reveal.roll !== undefined
	const roll = reveal.roll ?? { trait: DEFAULT_CHARACTERISTIC, difficulty: DEFAULT_DIFFICULTY }
	const outcomes = reveal.outcomes ?? EMPTY_OUTCOMES

	function toggleGate(on: boolean): void {
		// Adding the gate seeds a default roll + empty outcomes; removing it drops
		// both and keeps just the base reveal text.
		if (on) onChange({ text: reveal.text, roll, outcomes })
		else onChange({ text: reveal.text })
	}

	return (
		<div style={section}>
			<Field
				label={label}
				hint="lue par le joueur"
				multiline
				rows={2}
				value={reveal.text}
				placeholder={placeholder}
				onChange={(e) => onChange({ ...reveal, text: e.target.value })}
			/>

			<Toggle label="Jet requis" checked={gated} onChange={toggleGate} />

			{gated && (
				<div style={section}>
					<span style={sectionLabel}>Jet de caractéristique</span>
					<SegmentedControl
						ariaLabel="Caractéristique du jet"
						options={CHARACTERISTIC_OPTIONS}
						// trait is a free string for forward-compat; an unknown value highlights no segment.
						value={roll.trait as Characteristic}
						onChange={(trait) => onChange({ ...reveal, roll: { ...roll, trait }, outcomes })}
					/>
					<Stepper
						label="Difficulté"
						value={roll.difficulty ?? DEFAULT_DIFFICULTY}
						min={DIFFICULTY_MIN}
						max={DIFFICULTY_MAX}
						onChange={(difficulty) => onChange({ ...reveal, roll: { ...roll, difficulty }, outcomes })}
					/>
					<OutcomesEditor
						value={outcomes}
						onChange={(outcome, text) => onChange({ ...reveal, roll, outcomes: { ...outcomes, [outcome]: text } })}
					/>
				</div>
			)}
		</div>
	)
}

const section: React.CSSProperties = {
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
