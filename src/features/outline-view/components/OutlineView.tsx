import { useMemo } from 'react'
import {
	useBrain,
	useRoute,
	useOpenBook,
	useSelectedNode,
	NodeBadge,
	nodeTitle,
	effectiveKind,
	endLabel,
	EDGE_KINDS,
} from '../../../brain'
import { buildOutline, type OutlineRow } from '../utils/buildOutline'

const INDENT = 24

/**
 * outline-view — the indented « plan du livre » body (wireframe § 03). A VIEW
 * over BookService (KR-020): it derives the outline inline with useMemo (no
 * useEffect-synced copy, KR-013) and shares selection with the canvas through
 * the brain SelectionService (KR-024) — clicking a row selects its node and
 * the node-editor + canvas reflect it. Reference rows (↪) jump to their target.
 */
export function OutlineView(): JSX.Element {
	const { selection } = useBrain()
	const route = useRoute()
	const bookId = route.name === 'editor' ? route.bookId : null
	const book = useOpenBook(bookId)
	const selectedId = useSelectedNode()
	const rows = useMemo(() => (book !== null ? buildOutline(book) : []), [book])

	if (book === null || bookId === null) {
		return <div style={{ padding: 'var(--space-9)', color: 'var(--text-muted)' }}>Livre introuvable.</div>
	}

	return (
		<div role="tree" aria-label="Plan du livre" style={container}>
			<ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
				{rows.map((row, i) => (
					<OutlineRowItem
						key={`${i}-${row.targetId}-${row.reference ? 'ref' : 'node'}`}
						row={row}
						selected={!row.reference && row.targetId === selectedId}
						onSelect={() => row.node !== null && selection.select(bookId, row.node.id)}
					/>
				))}
			</ul>
		</div>
	)
}

interface OutlineRowItemProps {
	row: OutlineRow
	selected: boolean
	onSelect: () => void
}

function OutlineRowItem({ row, selected, onSelect }: OutlineRowItemProps): JSX.Element {
	const node = row.node
	// A real (non-reference) row always has its node; narrow it so we never reach
	// for a `!` assertion. A reference row (or a dangling target) takes the ↪ form.
	const detailed = !row.reference && node !== null
	const title = node !== null ? nodeTitle(node) : '⚠ cible supprimée'

	return (
		<li role="treeitem" aria-level={row.depth + 1} aria-selected={selected}>
			<button
				type="button"
				onClick={onSelect}
				disabled={node === null}
				aria-pressed={selected}
				style={{
					...rowButton,
					marginLeft: row.depth * INDENT,
					borderLeft: row.depth > 0 ? '1px solid var(--border-divider)' : '1px solid transparent',
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
							<span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-eyebrow)', color: 'var(--text-faint)' }}>
								({EDGE_KINDS[row.via].rowLabel})
							</span>
						)}
					</span>
				)}
			</button>
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
	width: '100%',
	textAlign: 'left',
	minHeight: 'var(--hit-target)',
	padding: '6px 10px',
	border: 'none',
	borderRadius: 'var(--r-md)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
}
