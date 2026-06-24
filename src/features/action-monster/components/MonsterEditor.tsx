import { useMemo } from 'react'
import {
	useBrain,
	useOpenBook,
	useMonsterLibrary,
	createId,
	Field,
	Toggle,
	ObjectEditor,
	OutcomesEditor,
	Stepper,
	TargetPicker,
	NODE_KINDS,
	CHARACTERISTICS,
	MONSTER_CHARACTERISTICS,
	MONSTER_CAPACITIES,
	MONSTER_CAPACITY_VALUES,
	DEFAULT_CAPACITY,
	maitriseDesCoups,
	tierOf,
	getNode,
	type ActionEditorContext,
	type MonsterConfig,
	type MonsterCharacteristic,
	type MonsterCapacityId,
	type ObjectDraft,
	type RollOutcome,
	type SavedMonster,
} from '../../../brain'
import { blankLoot } from '../utils/loot'
import { MonsterLibraryPicker } from './MonsterLibraryPicker'

/**
 * The config a node falls back to before any monster is authored. Skeleton /
 * legacy monsters (name + outcomes, or the old attack/defense pair) get the § 4
 * stat-block defaults filled in on read (KR-116) and canonicalise on write.
 */
const DEFAULT_MONSTER: MonsterConfig = {
	name: '',
	pv: 10,
	pvVariance: 0,
	stats: { FO: 1, AG: 1, DX: 1, EN: 1, IG: 1 },
	mc: 1,
	armour: 0,
	weaponMultiplier: 1,
	tier: 1,
	outcomes: { reussite: '', echec: '' },
}

const PV_MIN = 1
const STAT_MIN = 0
const STAT_MAX = 99
const CARAC_MIN = 1
const CARAC_MAX = 12

/** Preset natural-weapon multipliers (§ 4: 0.3–2, moyenne 1). */
const WEAPON_MULTIPLIERS = [0.3, 0.5, 0.8, 1, 1.2, 1.5, 1.8, 2]

/**
 * action-monster — the « Monstre » required-action editor, mounted by node-editor
 * via the brain ActionRegistry (self-registered, KR-050/051). A VIEW over
 * BookService (KR-020): reads node.monster live and writes via updateNode.
 *
 * Combat mechanics use the § 4 stat block: the 5 monster caracs (FO/AG/DX/EN/IG,
 * from MONSTER_CHARACTERISTICS, full labels), Maîtrise des Coups, PV (+ variance),
 * Armure, the natural-weapon multiplier, the monster Tier (drives XP, § 5), and a
 * free-text Capacité. Outcome targets — victoire → « poursuit » and fuite →
 * « reliaison » — use the shared brain TargetPicker (KR-109); défaite → Mort is
 * automatic (KR-067). The réussite/échec reveal texts use the shared brain
 * OutcomesEditor (KR-091). « Ajouter à la librairie » saves a reusable COPY; the
 * MonsterLibraryPicker instantiates a bestiary template (COPY-ON-USE, KR-101).
 */
export function MonsterEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books, events, monsterLibrary } = useBrain()
	const book = useOpenBook(bookId)
	const node = getNode(book, nodeId)
	// Normalise once (defaults fill a skeleton/legacy monster's missing block, KR-116).
	const monster: MonsterConfig = { ...DEFAULT_MONSTER, ...(node?.monster ?? {}) }
	const stats = monster.stats ?? DEFAULT_MONSTER.stats!
	const nodes = book?.nodes ?? []
	const mortTitle = NODE_KINDS.mort.defaultTitle
	const library = useMonsterLibrary()

	function patchMonster(patch: Partial<MonsterConfig>): void {
		books.updateNode(bookId, nodeId, { monster: { ...monster, ...patch } })
	}

	function setStat(key: MonsterCharacteristic, value: number): void {
		const nextStats = { ...stats, [key]: value }
		// Tier is derived from stats (§ 5: tierOf(MC) where MC = floor((AG+DX+IG)/3)).
		const nextTier = tierOf(maitriseDesCoups(nextStats)) as 1 | 2 | 3 | 4
		patchMonster({ stats: nextStats, tier: nextTier })
	}

	function saveToLibrary(): void {
		monsterLibrary.save(monster)
		events.emit('monster:savedToLibrary', { bookId, nodeId })
	}

	// « Choisir dans la librairie »: instantiate a saved/bestiary monster as an
	// independent copy on this node — fresh loot id (KR-003); keep this node's own
	// victory/flee targets (the library config carries none).
	function instantiateFromLibrary(saved: SavedMonster): void {
		const copy: MonsterConfig = JSON.parse(JSON.stringify(saved.config))
		const loot = copy.loot !== undefined ? { ...copy.loot, id: createId('obj') } : undefined
		patchMonster({
			name: copy.name,
			pv: copy.pv,
			pvVariance: copy.pvVariance,
			stats: copy.stats,
			mc: copy.mc,
			armour: copy.armour,
			weaponMultiplier: copy.weaponMultiplier,
			tier: copy.tier,
			capacity: copy.capacity,
			templateId: copy.templateId,
			outcomes: copy.outcomes,
			loot,
		})
	}

	function setOutcome(outcome: RollOutcome, text: string): void {
		patchMonster({ outcomes: { ...monster.outcomes, [outcome]: text } })
	}

	function toggleLoot(on: boolean): void {
		patchMonster({ loot: on ? blankLoot() : undefined })
	}

	function setLoot(draft: ObjectDraft): void {
		if (monster.loot === undefined) return
		patchMonster({ loot: { ...monster.loot, ...draft } })
	}

	// Tier is derived from stats (readonly in editor) — §5: tierOf(maitriseDesCoups(stats)).
	// Uses AG+DX+IG from the stats block, NOT the authored `monster.mc` field.
	const computedTier = tierOf(maitriseDesCoups(stats))

	// Contextual target suggestions: predecessors (nodes that lead INTO this combat)
	// plus their other outgoing targets (screens the player came from / could go to).
	const suggestedTargetIds = useMemo((): ReadonlySet<string> => {
		if (book === null) return new Set()
		const suggested = new Set<string>()
		const edges = book.edges
		for (const e of edges) {
			if (e.to === nodeId) {
				suggested.add(e.from)
				for (const e2 of edges) {
					if (e2.from === e.from && e2.to !== nodeId) suggested.add(e2.to)
				}
			}
		}
		suggested.delete(nodeId)
		return suggested
	}, [book, nodeId])

	// Capacity id; fall back to 'aucune' for legacy free-text values not in the registry.
	const capacityId: MonsterCapacityId = MONSTER_CAPACITIES[monster.capacity as MonsterCapacityId]
		? (monster.capacity as MonsterCapacityId)
		: DEFAULT_CAPACITY

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Field
				label="NOM DU MONSTRE"
				value={monster.name}
				placeholder="Gobelin des cavernes"
				onChange={(e) => patchMonster({ name: e.target.value })}
			/>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
				<span style={sectionLabel}>Caractéristiques (§ 4)</span>
				{MONSTER_CHARACTERISTICS.map((key) => (
					<Stepper
						key={key}
						label={CHARACTERISTICS[key].label}
						value={stats[key]}
						min={CARAC_MIN}
						max={CARAC_MAX}
						onChange={(v) => setStat(key, v)}
					/>
				))}
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
				<span style={sectionLabel}>Combat</span>
				<Stepper
					label="Maîtrise des coups (MC)"
					value={monster.mc ?? 1}
					min={STAT_MIN}
					max={STAT_MAX}
					onChange={(mc) => patchMonster({ mc })}
				/>
				<Stepper label="PV" value={monster.pv} min={PV_MIN} max={STAT_MAX} onChange={(pv) => patchMonster({ pv })} />
				<Stepper
					label="Variance PV (±)"
					value={monster.pvVariance ?? 0}
					min={STAT_MIN}
					max={STAT_MAX}
					onChange={(pvVariance) => patchMonster({ pvVariance })}
				/>
				<Stepper
					label="Armure"
					value={monster.armour ?? 0}
					min={STAT_MIN}
					max={STAT_MAX}
					onChange={(armour) => patchMonster({ armour })}
				/>
				<label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
					<span style={sectionLabel}>Arme naturelle (multiplicateur)</span>
					<select
						style={selectStyle}
						value={String(monster.weaponMultiplier ?? 1)}
						onChange={(e) => patchMonster({ weaponMultiplier: parseFloat(e.target.value) })}
					>
						{WEAPON_MULTIPLIERS.map((m) => (
							<option key={m} value={m}>
								×{m}
							</option>
						))}
					</select>
				</label>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
					<span style={sectionLabel}>Tier (§ 5 — calculé automatiquement)</span>
					<span style={tierBadge}>T{computedTier}</span>
				</div>
			</div>

			<label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
				<span style={sectionLabel}>Capacité spéciale</span>
				<select
					aria-label="Capacité du monstre"
					value={capacityId}
					onChange={(e) => patchMonster({ capacity: e.target.value as MonsterCapacityId })}
					style={selectStyle}
				>
					{MONSTER_CAPACITY_VALUES.map((id) => (
						<option key={id} value={id}>
							{MONSTER_CAPACITIES[id].label}
						</option>
					))}
				</select>
				{capacityId !== 'aucune' && (
					<span style={capacityHint}>{MONSTER_CAPACITIES[capacityId].description}</span>
				)}
			</label>

			<OutcomesEditor value={monster.outcomes} onChange={setOutcome} />

			<TargetPicker
				label="Victoire → poursuivre vers"
				emptyLabel="Aucune suite"
				nodes={nodes}
				nodeId={nodeId}
				target={monster.victoryTarget}
				onChange={(victoryTarget) => patchMonster({ victoryTarget })}
				suggestedIds={suggestedTargetIds}
			/>
			<TargetPicker
				label="Fuite → relier à"
				emptyLabel="Pas de fuite"
				nodes={nodes}
				nodeId={nodeId}
				target={monster.fleeTarget}
				onChange={(fleeTarget) => patchMonster({ fleeTarget })}
				suggestedIds={suggestedTargetIds}
			/>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
				<Toggle label="Le monstre lâche un butin" checked={monster.loot !== undefined} onChange={toggleLoot} />
				{monster.loot !== undefined && <ObjectEditor value={monster.loot} onChange={setLoot} />}
			</div>

			{/* Défaite → Mort is automatic at the end of a combat (KR-067): surfaced,
			    never an authored edge. The dedicated combat→Mort path wires it later. */}
			<p style={defeatNote}>
				Défaite → {mortTitle} <span style={{ color: 'var(--text-faint)' }}>(automatique)</span>
			</p>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
				<button type="button" onClick={saveToLibrary} style={libraryButton}>
					<span aria-hidden="true">＋</span> Ajouter à la librairie du générateur
				</button>
				<MonsterLibraryPicker library={library} onPick={instantiateFromLibrary} />
			</div>
		</div>
	)
}

const sectionLabel: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
}

const defeatNote: React.CSSProperties = {
	margin: 0,
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
}

const tierBadge: React.CSSProperties = {
	display: 'inline-block',
	alignSelf: 'flex-start',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-body)',
	fontWeight: 'var(--fw-semibold)',
	color: 'var(--text-strong)',
	background: 'var(--surface-chip)',
	borderRadius: 'var(--r-sm)',
	padding: 'var(--space-1) var(--space-3)',
}

const capacityHint: React.CSSProperties = {
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-muted)',
	lineHeight: 1.4,
}

const selectStyle: React.CSSProperties = {
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-3)',
	border: '1px solid var(--border-field)',
	borderRadius: 'var(--r-md)',
	background: 'var(--surface-card)',
	color: 'var(--text-body)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
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
