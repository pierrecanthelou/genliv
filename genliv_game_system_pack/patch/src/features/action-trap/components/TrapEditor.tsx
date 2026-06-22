import {
	useBrain,
	useOpenBook,
	Field,
	Toggle,
	OutcomesEditor,
	SegmentedControl,
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	DEFAULT_CHARACTERISTIC,
	CHALLENGE_TIERS,
	CHALLENGE_TIER_VALUES,
	DEFAULT_CHALLENGE_TIER,
	rollTier,
	getNode,
	type ActionEditorContext,
	type TrapConfig,
	type RollOutcome,
	type SkillRoll,
	type Characteristic,
	type ChallengeTier,
	type SegmentedOption,
} from '../../../brain'

/** The config a node falls back to before any trap is authored (with a default roll). */
const DEFAULT_TRAP: TrapConfig = {
	description: '',
	roll: { trait: DEFAULT_CHARACTERISTIC, tier: DEFAULT_CHALLENGE_TIER },
	outcomes: { reussite: '', echec: '' },
	fatal: false,
}

const CHARACTERISTIC_OPTIONS: SegmentedOption<Characteristic>[] = CHARACTERISTIC_VALUES.map((value) => ({
	value,
	label: CHARACTERISTICS[value].abbr,
}))

const TIER_OPTIONS: SegmentedOption<ChallengeTier>[] = CHALLENGE_TIER_VALUES.map((value) => ({
	value,
	label: `${value} · ${CHALLENGE_TIERS[value].notation}`,
}))

/**
 * action-trap — the « Piège » required-action editor, mounted by node-editor via
 * the brain ActionRegistry (self-registered, KR-050/051). A VIEW over BookService
 * (KR-020): reads node.trap live and writes via updateNode.
 *
 * The skill roll (§ 05/§ 2): a CARACTÉRISTIQUE select (the 7 caracs from the
 * brain CHARACTERISTICS registry, KR-117) + a DIFFICULTÉ Tier de Challenge
 * (TC1..TC4, from CHALLENGE_TIERS) gate which outcome applies; the réussite/échec
 * reveal texts use the shared brain OutcomesEditor (KR-091). A persisted legacy
 * numeric difficulty migrates to a tier on read via rollTier (KR-021/116). The
 * « échec mène à la Mort » toggle is the « échec sanctionné » fatal variant,
 * which derives the automatic →Mort edge (deriveAutomaticEdges, KR-067).
 */
export function TrapEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books } = useBrain()
	const book = useOpenBook(bookId)
	const node = getNode(book, nodeId)
	// Normalise once (default + roll migration) so every read and write share one shape.
	const trap: TrapConfig = { ...DEFAULT_TRAP, ...(node?.trap ?? {}) }
	const roll = trap.roll ?? DEFAULT_TRAP.roll!
	const tier = rollTier(roll)

	function patchTrap(patch: Partial<TrapConfig>): void {
		books.updateNode(bookId, nodeId, { trap: { ...trap, ...patch } })
	}

	function setRoll(patch: Partial<SkillRoll>): void {
		// Canonicalise to a tier on write — drop the deprecated numeric difficulty.
		const next: SkillRoll = { ...roll, tier, ...patch }
		delete next.difficulty
		patchTrap({ roll: next })
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
				<span style={sectionLabel}>Difficulté (Tier de Challenge)</span>
				<SegmentedControl
					ariaLabel="Tier de Challenge"
					options={TIER_OPTIONS}
					value={tier}
					onChange={(t) => setRoll({ tier: t })}
				/>
			</div>

			<OutcomesEditor value={trap.outcomes} onChange={setOutcome} />
			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
				<Toggle label="L’échec mène à la Mort" checked={trap.fatal} onChange={(fatal) => patchTrap({ fatal })} />
				{trap.fatal && (
					<p style={fatalNote}>
						Lien automatique vers la Mort <span style={{ color: 'var(--text-faint)' }}>(tracé sur l’arbre)</span>
					</p>
				)}
			</div>
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

const fatalNote: React.CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}
