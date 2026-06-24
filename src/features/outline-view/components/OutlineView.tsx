import { useMemo, useState } from 'react'
import {
	useBrain,
	useRoute,
	useOpenBook,
	useSelectedNode,
	useBookOutlineCollapsed,
	useBookOutlineDisplayMode,
	getNode,
	NodeBadge,
	SegmentedControl,
	nodeTitle,
	textLines,
	effectiveKind,
	endLabel,
	EDGE_KINDS,
	type BookNode,
} from '../../../brain'
import { buildOutline, computeVisibleRows, type OutlineRow } from '../utils/buildOutline'
import { buildNodeInspector } from '../utils/buildNodeInspector'
import { NodeInspector } from './NodeInspector'
import { OutlineColumns } from './OutlineColumns'

export interface OutlineViewProps {
	/**
	 * Reveal a node in the canvas (switch to the tree view + centre on it),
	 * wired by the editor shell so outline-view never imports tree-canvas.
	 */
	onRevealInTree?: (nodeId: string) => void
	/** Node ids with dangling references after export — shown with a ⚠ badge. */
	warnedNodeIds?: ReadonlySet<string>
}

const INDENT = 24
/** Hover-preview tooltip length cap — enough to recognise a screen, not a wall of text. */
const PREVIEW_MAX = 140

/**
 * outline-view — the indented « plan du livre » body (wireframe § 03). A VIEW
 * over BookService (KR-020): it derives the outline inline with useMemo (no
 * useEffect-synced copy, KR-013) and shares selection with the canvas through
 * the brain SelectionService (KR-024) — clicking a row selects its node and the
 * node-editor + canvas reflect it. Reference rows (↪) jump to their target.
 *
 * Iteration 1 (§ 03 A) adds expand/collapse (collapsed node ids are local UI
 * state, KR-013), a hover preview of each screen's text, and a clearer
 * reference-row affordance. Iteration 2 (§ 03 B) adds the node inspector card:
 * focusing/hovering a row previews its relations (« entre depuis » + combat
 * outcomes) with Éditer (select) + « Centrer dans l'arbre » (reveal + centre on
 * the canvas, wired through the editor shell). Per-row rule badges (⊘/⏱) still
 * wait for the edge rules (choice-linking iter 3–4).
 */
const DISPLAY_MODE_OPTIONS = [
	{ value: 'list' as const, label: '≡ Liste' },
	{ value: 'columns' as const, label: '⦿ Colonnes' },
]

export function OutlineView({ onRevealInTree, warnedNodeIds }: OutlineViewProps = {}): JSX.Element {
	const { selection, uiPreferences } = useBrain()
	const route = useRoute()
	const bookId = route.name === 'editor' ? route.bookId : null
	const book = useOpenBook(bookId)
	const selectedId = useSelectedNode()
	// Collapsed node ids are a per-book, non-synced UI preference (KR-022): persisted
	// via UIPreferencesService so the outline shape survives a view switch + reload.
	const collapsed = useBookOutlineCollapsed(bookId ?? '')
	// Display mode: 'list' (indented DFS) or 'columns' (Miller columns).
	const displayMode = useBookOutlineDisplayMode(bookId ?? '')
	// The node previewed in the inspector — set on row focus/hover (§ 03 B);
	// falls back to the selection so the card always reflects a real node.
	const [inspectedId, setInspectedId] = useState<string | null>(null)

	const rows = useMemo(() => (book !== null ? buildOutline(book) : []), [book])
	const visible = useMemo(() => computeVisibleRows(rows, collapsed), [rows, collapsed])

	if (book === null || bookId === null) {
		return <div style={{ padding: 'var(--space-9)', color: 'var(--text-muted)' }}>Livre introuvable.</div>
	}

	// Narrowed non-null local for the nested handler closures (TS doesn't carry the
	// guard's flow-narrowing of `bookId` into a nested function).
	const activeBookId: string = bookId

	function toggleCollapse(targetId: string): void {
		const next = new Set(collapsed)
		if (next.has(targetId)) next.delete(targetId)
		else next.add(targetId)
		uiPreferences.setOutlineCollapsed(activeBookId, [...next])
	}

	// Inspector target: the focused row, falling back to the current selection.
	// Resolve against the live book so a deleted node drops the card (not a crash).
	const inspectId = inspectedId ?? selectedId
	const inspectNode = inspectId !== null ? getNode(book, inspectId) : null

	return (
		<div style={pane}>
			{/* Display-mode toggle — list (indented DFS) vs columns (Miller columns) */}
			<div style={modeBar}>
				<SegmentedControl
					options={DISPLAY_MODE_OPTIONS}
					value={displayMode}
					onChange={(mode) => uiPreferences.setOutlineDisplayMode(activeBookId, mode)}
					ariaLabel="Mode d'affichage du plan"
				/>
			</div>

			{displayMode === 'columns' ? (
				<OutlineColumns
					key={activeBookId}
					book={book}
					bookId={activeBookId}
					warnedNodeIds={warnedNodeIds}
				/>
			) : (
				<>
					<div role="tree" aria-label="Plan du livre" style={container}>
						<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
							{visible.map(({ row, index, hasChildren, collapsed: isCollapsed }) => (
								<OutlineRowItem
									key={`${index}-${row.reference ? 'ref' : 'node'}`}
									row={row}
									hasChildren={hasChildren}
									collapsed={isCollapsed}
									selected={!row.reference && row.targetId === selectedId}
									warned={!row.reference && row.node !== null && (warnedNodeIds?.has(row.node.id) ?? false)}
									onSelect={() => row.node !== null && selection.select(bookId, row.node.id)}
									onInspect={() => row.node !== null && setInspectedId(row.node.id)}
									onToggle={() => toggleCollapse(row.targetId)}
								/>
							))}
						</ul>
					</div>

					{inspectNode !== null && (
						<div style={inspectorWrap}>
							<NodeInspector
								title={nodeTitle(inspectNode)}
								inspection={buildNodeInspector(book, inspectNode.id)}
								onEdit={() => selection.select(bookId, inspectNode.id)}
								onCenter={() => {
									selection.select(bookId, inspectNode.id)
									onRevealInTree?.(inspectNode.id)
								}}
							/>
						</div>
					)}
				</>
			)}
		</div>
	)
}

/** Build the hover-preview tooltip from a node's authored text (KR-068 fallback). */
function previewText(node: BookNode): string {
	const joined = textLines(node).join(' ')
	if (joined === '') return 'Écran vide — cliquez pour l’éditer'
	return joined.length > PREVIEW_MAX ? `${joined.slice(0, PREVIEW_MAX)}…` : joined
}

interface OutlineRowItemProps {
	row: OutlineRow
	hasChildren: boolean
	collapsed: boolean
	selected: boolean
	warned: boolean
	onSelect: () => void
	onInspect: () => void
	onToggle: () => void
}

function OutlineRowItem({
	row,
	hasChildren,
	collapsed,
	selected,
	warned,
	onSelect,
	onInspect,
	onToggle,
}: OutlineRowItemProps): JSX.Element {
	const node = row.node
	// A real (non-reference) row always has its node; narrow it so we never reach
	// for a `!` assertion. A reference row (or a dangling target) takes the ↪ form.
	const detailed = !row.reference && node !== null
	const title = node !== null ? nodeTitle(node) : '⚠ cible supprimée'
	// Hover preview: a node row previews its screen text; a reference row tells
	// the author the click jumps to the target shown elsewhere (KR-021 dangling).
	const hint =
		detailed && node !== null ? previewText(node) : node !== null ? `Aller au nœud « ${title} »` : 'Cible supprimée'

	return (
		<li
			role="treeitem"
			aria-level={row.depth + 1}
			aria-selected={selected}
			aria-expanded={hasChildren ? !collapsed : undefined}
		>
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					marginLeft: row.depth * INDENT,
					borderLeft: row.depth > 0 ? '1px solid var(--border-divider)' : '1px solid transparent',
				}}
			>
				{hasChildren ? (
					<button
						type="button"
						onClick={onToggle}
						aria-label={collapsed ? `Déplier « ${title} »` : `Replier « ${title} »`}
						style={disclosure}
					>
						{collapsed ? '▸' : '▾'}
					</button>
				) : (
					<span style={disclosureSpacer} aria-hidden="true" />
				)}
				<button
					type="button"
					onClick={onSelect}
					onFocus={onInspect}
					onMouseEnter={onInspect}
					disabled={node === null}
					aria-pressed={selected}
					title={hint}
					style={{
						...rowButton,
						background: selected ? 'var(--accent-bg)' : warned ? 'var(--bad-bg)' : 'transparent',
						color: row.reference ? 'var(--text-muted)' : warned ? 'var(--bad)' : 'var(--text-body)',
						cursor: node === null ? 'not-allowed' : 'pointer',
					}}
				>
					{detailed && node !== null ? (
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
							<NodeBadge kind={effectiveKind(node)} label={endLabel(node)} selected={selected} />
							{title}
							{warned && (
								<span aria-label="Référence cassée" style={{ color: 'var(--bad)', fontSize: 'var(--fs-meta)' }}>
									⚠
								</span>
							)}
						</span>
					) : (
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
							<span aria-hidden="true">↪</span> {title}
							{row.via !== undefined && (
								<span
									style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)', color: 'var(--text-faint)' }}
								>
									({EDGE_KINDS[row.via].rowLabel})
								</span>
							)}
						</span>
					)}
				</button>
			</div>
		</li>
	)
}

const pane: React.CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
	background: 'var(--surface-app)',
}

const modeBar: React.CSSProperties = {
	flexShrink: 0,
	padding: 'var(--space-3) var(--space-5)',
	borderBottom: '1px solid var(--border-divider)',
	background: 'var(--surface-app)',
}

const container: React.CSSProperties = {
	flex: 1,
	minHeight: 0,
	overflow: 'auto',
	padding: 'var(--space-7)',
}

const inspectorWrap: React.CSSProperties = {
	flex: 'none',
	borderTop: '1px solid var(--border-divider)',
	padding: 'var(--space-4)',
	background: 'var(--paper-1)',
}

const rowButton: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	flex: 1,
	minWidth: 0,
	textAlign: 'left',
	minHeight: 'var(--hit-target)',
	padding: '6px 10px',
	border: 'none',
	borderRadius: 'var(--r-md)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
}

const disclosure: React.CSSProperties = {
	flex: 'none',
	width: 'var(--hit-target)',
	minHeight: 'var(--hit-target)',
	border: 'none',
	background: 'transparent',
	color: 'var(--text-muted)',
	fontSize: 10,
	cursor: 'pointer',
}

const disclosureSpacer: React.CSSProperties = {
	flex: 'none',
	width: 'var(--hit-target)',
}
