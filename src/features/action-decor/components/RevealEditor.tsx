import {
	Field,
	Toggle,
	Select,
	SegmentedControl,
	OutcomesEditor,
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	DEFAULT_CHARACTERISTIC,
	CHALLENGE_TIERS,
	CHALLENGE_TIER_VALUES,
	DEFAULT_CHALLENGE_TIER,
	rollTier,
	type DecorReveal,
	type RollOutcome,
	type Characteristic,
	type ChallengeTier,
	type SelectOption,
	type SegmentedOption,
} from '../../../brain'

const CHARACTERISTIC_OPTIONS: SelectOption<Characteristic>[] = CHARACTERISTIC_VALUES.map((value) => ({
	value,
	label: `${CHARACTERISTICS[value].abbr} — ${CHARACTERISTICS[value].label}`,
}))

const TIER_OPTIONS: SegmentedOption<ChallengeTier>[] = CHALLENGE_TIER_VALUES.map((value) => ({
	value,
	label: `${value} · ${CHALLENGE_TIERS[value].notation}`,
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
 * roll — caractéristique + tier de challenge (same system as TrapEditor, KR-117)
 * and a réussite/échec reveal via the shared brain OutcomesEditor (KR-091).
 * Legacy numeric `difficulty` is migrated via `rollTier()` on read and dropped
 * on write (KR-021/116). Controlled — the owner persists every change via BookService.
 */
export function RevealEditor({ label, placeholder, reveal, onChange }: RevealEditorProps): JSX.Element {
	const gated = reveal.roll !== undefined
	const roll = reveal.roll ?? { trait: DEFAULT_CHARACTERISTIC, tier: DEFAULT_CHALLENGE_TIER }
	// Migrate legacy numeric difficulty to a tier on read (KR-021/116).
	const tier = rollTier(roll)
	const outcomes = reveal.outcomes ?? EMPTY_OUTCOMES

	function setRoll(patch: Partial<typeof roll>): void {
		// Canonicalise to `tier`; drop deprecated `difficulty` on every write (KR-021).
		const next = { ...roll, tier, ...patch }
		delete (next as { difficulty?: number }).difficulty
		onChange({ ...reveal, roll: next, outcomes })
	}

	function toggleGate(on: boolean): void {
		if (on) onChange({ text: reveal.text, roll: { trait: roll.trait, tier }, outcomes })
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
					<Select<Characteristic>
						label="CARACTÉRISTIQUE"
						ariaLabel="Caractéristique du jet"
						options={CHARACTERISTIC_OPTIONS}
						value={roll.trait as Characteristic}
						onChange={(trait) => setRoll({ trait })}
					/>
					<SegmentedControl<ChallengeTier>
						ariaLabel="Tier de challenge"
						options={TIER_OPTIONS}
						value={tier}
						onChange={(t) => setRoll({ tier: t })}
					/>
					<OutcomesEditor
						value={outcomes}
						onChange={(outcome, text) => {
							// Canonicalise tier and drop deprecated `difficulty` on every write (KR-021).
							const next = { ...roll, tier }
							delete (next as { difficulty?: number }).difficulty
							onChange({ ...reveal, roll: next, outcomes: { ...outcomes, [outcome]: text } })
						}}
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
