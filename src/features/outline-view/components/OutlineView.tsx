import { useMemo, useState } from 'react'
import {
	useBrain,
	useRoute,
	useOpenBook,
	useSelectedNode,
	NodeBadge,
	nodeTitle,
	textLines,
	effectiveKind,
	endLabel,
	EDGE_KINDS,
	type BookNode,
} from '../../../brain'
import { buildOutline, computeVisibleRows, type OutlineRow } from '../utils/buildOutline'

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
 * state, KR-013), a hover preview of each screen's text (title tooltip), and a
 * clearer reference-row affordance. Per-row rule badges (⊘/⏱) wait for the
 * edge rules (choice-linking iter 3–4) and « centrer dans l'arbre » for the
 * iter-2 inspector (needs canvas viewport centering).
 */
export function OutlineView(): JSX.Element {
	const { selection } = useBrain()
	const route = useRoute()
	const bookId = route.name === 'editor' ? route.bookId : null
	const book = useOpenBook(bookId)
	const selectedId = useSelectedNode()
	const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())

	const rows = useMemo(() => (book !== null ? buildOutline(book) : []), [book])
	const visible = useMemo(() => computeVisibleRows(rows, collapsed), [rows, collapsed])

	if (book === null || bookId === null) {
		return <div style={{ padding: 'var(--space-9)', color: 'var(--text-muted)' }}>Livre introuvable.</div>
	}

	function toggleCollapse(targetId: string): void {
		setCollapsed((prev) => {
			const next = new Set(prev)
			if (next.has(targetId)) next.delete(targetId)
			else next.add(targetId)
			return next
		})
	}

	return (
		<div role="tree" aria-label="Plan du livre" style={container}>
			<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
				{visible.map(({ row, index, hasChildren, collapsed: isCollapsed }) => (
					<OutlineRowItem
						key={`${index}-${row.reference ? 'ref' : 'node'}`}
						row={row}
						hasChildren={hasChildren}
						collapsed={isCollapsed}
						selected={!row.reference && row.targetId === selectedId}
						onSelect={() => row.node !== null && selection.select(bookId, row.node.id)}
						onToggle={() => toggleCollapse(row.targetId)}
					/>
				))}
			</ul>
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
	onSelect: () => void
	onToggle: () => void
}

function OutlineRowItem({
	row,
	hasChildren,
	collapsed,
	selected,
	onSelect,
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
					disabled={node === null}
					aria-pressed={selected}
					title={hint}
					style={{
						...rowButton,
						background: selected ? 'var(--accent-bg)' : 'transparent',
						color: row.reference ? 'var(--text-muted)' : 'var(--text-body)',
						cursor: node === null ? 'not-allowed' : 'pointer',
					}}
				>
					{detailed && node !== null ? (
						<span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
							<NodeBadge kind={effectiveKind(node)} label={endLabel(node)} selected={selected} />
							{title}
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

const container: React.CSSProperties = {
	height: '100%',
	overflow: 'auto',
	padding: 'var(--space-7)',
	background: 'var(--surface-app)',
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
