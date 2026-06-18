import {
	useBrain,
	useOpenBook,
	Field,
	Toggle,
	ObjectEditor,
	OutcomesEditor,
	Stepper,
	TargetPicker,
	NODE_KINDS,
	getNode,
	type ActionEditorContext,
	type MonsterConfig,
	type ObjectDraft,
	type RollOutcome,
} from '../../../brain'
import { blankLoot } from '../utils/loot'

/**
 * The config a node falls back to before any monster is authored. Skeleton
 * monsters (name + outcomes only) get the stat defaults filled in on read, so a
 * persisted pre-stats monster still loads (KR-116) and canonicalises on write.
 */
const DEFAULT_MONSTER: MonsterConfig = {
	name: '',
	pv: 10,
	attack: 1,
	defense: 1,
	outcomes: { reussite: '', echec: '' },
}

/** Stat bounds: a monster needs at least 1 PV; attack/defense may be 0. */
const PV_MIN = 1
const STAT_MIN = 0
const STAT_MAX = 99

/**
 * action-monster — the « Monstre » required-action editor, mounted by node-editor
 * via the brain ActionRegistry (self-registered, KR-050/051). A VIEW over
 * BookService (KR-020): reads node.monster live and writes via updateNode.
 *
 * Iteration 1 — combat mechanics (§ 4D): PV / Attaque / Défense stats (shared
 * brain Stepper), and the outcome targets — victoire → « poursuit » and fuite →
 * « reliaison » via the shared brain TargetPicker (KR-109), while défaite → Mort
 * is the automatic combat path (KR-067), surfaced read-only, never an authored
 * edge. The réussite/échec reveal texts derive from ROLL_OUTCOMES (KR-091/117).
 *
 * Iteration 2 — « butin lâché »: a toggle revealing the shared brain ObjectEditor
 * for the loot dropped on victory (4th ObjectEditor reuse, KR-052/003). Combat
 * reinforced by an inventory object (« si le joueur possède … → victoire auto »)
 * is the same by-id inventory reference as choice-linking's hidden prerequisite,
 * deferred to the ObjectCatalogService work (KR-062).
 */
export function MonsterEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books, events } = useBrain()
	const book = useOpenBook(bookId)
	const node = getNode(book, nodeId)
	// Normalise once (defaults fill a skeleton monster's missing stats, KR-116).
	const monster: MonsterConfig = { ...DEFAULT_MONSTER, ...(node?.monster ?? {}) }
	const nodes = book?.nodes ?? []
	const mortTitle = NODE_KINDS.mort.defaultTitle

	function patchMonster(patch: Partial<MonsterConfig>): void {
		books.updateNode(bookId, nodeId, { monster: { ...monster, ...patch } })
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

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<Field
				label="NOM DU MONSTRE"
				value={monster.name}
				placeholder="Gobelin des cavernes"
				onChange={(e) => patchMonster({ name: e.target.value })}
			/>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
				<span style={sectionLabel}>Caractéristiques</span>
				<Stepper label="PV" value={monster.pv} min={PV_MIN} max={STAT_MAX} onChange={(pv) => patchMonster({ pv })} />
				<Stepper
					label="Attaque"
					value={monster.attack}
					min={STAT_MIN}
					max={STAT_MAX}
					onChange={(attack) => patchMonster({ attack })}
				/>
				<Stepper
					label="Défense"
					value={monster.defense}
					min={STAT_MIN}
					max={STAT_MAX}
					onChange={(defense) => patchMonster({ defense })}
				/>
			</div>

			<OutcomesEditor value={monster.outcomes} onChange={setOutcome} />

			<TargetPicker
				label="Victoire → poursuivre vers"
				emptyLabel="Aucune suite"
				nodes={nodes}
				nodeId={nodeId}
				target={monster.victoryTarget}
				onChange={(victoryTarget) => patchMonster({ victoryTarget })}
			/>
			<TargetPicker
				label="Fuite → relier à"
				emptyLabel="Pas de fuite"
				nodes={nodes}
				nodeId={nodeId}
				target={monster.fleeTarget}
				onChange={(fleeTarget) => patchMonster({ fleeTarget })}
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
