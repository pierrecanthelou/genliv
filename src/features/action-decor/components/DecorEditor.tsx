import { useState } from 'react'
import {
	useBrain,
	useOpenBook,
	SegmentedControl,
	Badge,
	IconButton,
	HIT_TARGET_MIN,
	type ActionEditorContext,
	type DecorConfig,
	type DecorInteraction,
	type SegmentedOption,
	type TakeableObject,
} from '../../../brain'
import { TAKEABLE_KINDS, takeablesOf, blankTakeable } from '../utils/takeables'
import { ObjectEditModal } from './ObjectEditModal'

/**
 * Single source for per-interaction data — a closed set in one Record (KR-117,
 * the same data-driven pattern as the kind registry KR-068): the label is
 * written once here, never duplicated across the switch options and the
 * placeholder copy, and never branched on with an `x === 'a' ? …` ladder.
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

/** One fallback name for an unnamed object — used in both the row and its action labels. */
const UNNAMED = 'Objet sans nom'

/**
 * action-decor — the « Décor » required-action editor, mounted by node-editor
 * via the brain ActionRegistry (self-registered, KR-050/051; node-editor never
 * imports this feature). A VIEW over BookService (KR-020): it reads the node's
 * décor config live via useOpenBook and writes through BookService.updateNode.
 *
 * Iteration 1 — « Prendre » full (§ 4B): a list of takeable objects as rows
 * (utile/leurre badge + a « jet » marker), add / remove / reorder, each edited
 * in the shared ObjectEditor inside a modal with an optional « jet requis »
 * (KR-052/003). « Écouter »/« Fouiller » remain stubs for iteration 2.
 */
export function DecorEditor({ bookId, nodeId }: ActionEditorContext): JSX.Element {
	const { books } = useBrain()
	const book = useOpenBook(bookId)
	const node = book?.nodes.find((n) => n.id === nodeId) ?? null
	// Normalise the config once (default « prendre », migrate the skeleton's single
	// object to the list) so every read and write share one canonical shape.
	const decor = node?.decor ?? DEFAULT_DECOR
	const objects = takeablesOf(decor)
	// The object currently open in the edit modal — local UI state, not a derived
	// mirror of the node (KR-013).
	const [editing, setEditing] = useState<{ takeable: TakeableObject; isNew: boolean } | null>(null)

	// Every write canonicalises to { interaction, objects } — the legacy single
	// `object` field is dropped on the first write (migration, KR-090).
	function writeObjects(next: TakeableObject[]): void {
		books.updateNode(bookId, nodeId, { decor: { interaction: decor.interaction, objects: next } })
	}

	function setInteraction(interaction: DecorInteraction): void {
		books.updateNode(bookId, nodeId, { decor: { interaction, objects } })
	}

	function handleSave(takeable: TakeableObject): void {
		const exists = objects.some((o) => o.object.id === takeable.object.id)
		writeObjects(
			exists ? objects.map((o) => (o.object.id === takeable.object.id ? takeable : o)) : [...objects, takeable],
		)
		setEditing(null)
	}

	function removeObject(id: string): void {
		writeObjects(objects.filter((o) => o.object.id !== id))
	}

	function move(index: number, direction: -1 | 1): void {
		const target = index + direction
		if (target < 0 || target >= objects.length) return
		const next = [...objects]
		const [moved] = next.splice(index, 1)
		next.splice(target, 0, moved as TakeableObject)
		writeObjects(next)
	}

	function openNew(): void {
		setEditing({ takeable: blankTakeable(), isNew: true })
	}

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
			<SegmentedControl
				ariaLabel="Interaction du décor"
				options={INTERACTION_OPTIONS}
				value={decor.interaction}
				onChange={setInteraction}
			/>

			{decor.interaction === 'prendre' ? (
				objects.length === 0 ? (
					<button type="button" onClick={openNew} style={emptyAffordance}>
						+ Ajouter un objet à prendre…
					</button>
				) : (
					<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
						<ul
							style={{
								listStyle: 'none',
								margin: 0,
								padding: 0,
								display: 'flex',
								flexDirection: 'column',
								gap: 'var(--space-2)',
							}}
						>
							{objects.map((takeable, i) => (
								<li key={takeable.object.id} style={row}>
									<button
										type="button"
										onClick={() => setEditing({ takeable, isNew: false })}
										title="Modifier l’objet"
										style={rowMain}
									>
										<span style={objectName}>{takeable.object.name || UNNAMED}</span>
										<Badge tone={TAKEABLE_KINDS[takeable.kind].tone}>{TAKEABLE_KINDS[takeable.kind].label}</Badge>
										{takeable.roll !== undefined && <Badge tone="accent">jet</Badge>}
									</button>
									<span style={rowActions}>
										<IconButton
											label={`Monter « ${takeable.object.name || UNNAMED} »`}
											size={HIT_TARGET_MIN}
											onClick={() => move(i, -1)}
										>
											↑
										</IconButton>
										<IconButton
											label={`Descendre « ${takeable.object.name || UNNAMED} »`}
											size={HIT_TARGET_MIN}
											onClick={() => move(i, 1)}
										>
											↓
										</IconButton>
										<IconButton
											tone="danger"
											label={`Retirer « ${takeable.object.name || UNNAMED} »`}
											size={HIT_TARGET_MIN}
											onClick={() => removeObject(takeable.object.id)}
										>
											✕
										</IconButton>
									</span>
								</li>
							))}
						</ul>
						<button type="button" onClick={openNew} style={addButton}>
							+ Ajouter un objet
						</button>
					</div>
				)
			) : (
				<p style={{ margin: 0, fontSize: 'var(--fs-meta)', color: 'var(--text-faint)' }}>
					« {DECOR_INTERACTIONS[decor.interaction].label} » — détail à venir (jet de caractéristique, indices cachés).
				</p>
			)}

			{editing !== null && (
				<ObjectEditModal
					key={editing.takeable.object.id}
					takeable={editing.takeable}
					isNew={editing.isNew}
					onSave={handleSave}
					onCancel={() => setEditing(null)}
				/>
			)}
		</div>
	)
}

const row: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
	border: '1px solid var(--border-subtle)',
	borderRadius: 'var(--r-lg)',
	padding: '6px 8px',
}

const rowMain: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-2)',
	flex: 1,
	minWidth: 0,
	minHeight: 'var(--hit-target)',
	textAlign: 'left',
	border: 'none',
	background: 'transparent',
	borderRadius: 'var(--r-md)',
	cursor: 'pointer',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	color: 'var(--text-body)',
}

const objectName: React.CSSProperties = {
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	flex: 1,
	minWidth: 0,
}

const rowActions: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 'var(--space-1)',
	flex: 'none',
}

const addButton: React.CSSProperties = {
	alignSelf: 'flex-start',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--accent)',
	background: 'transparent',
	border: 'none',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
	padding: '0 var(--space-2)',
}

const emptyAffordance: React.CSSProperties = {
	width: '100%',
	border: '1.5px dashed var(--border-field)',
	borderRadius: 'var(--r-lg)',
	background: 'var(--paper-1)',
	color: 'var(--text-muted)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	padding: 'var(--space-5)',
	cursor: 'pointer',
	minHeight: 'var(--hit-target)',
}
